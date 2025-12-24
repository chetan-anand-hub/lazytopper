Param(
  [string]$RepoRoot = (Get-Location).Path,
  [switch]$DryRun,
  [switch]$HardDelete
)

$ErrorActionPreference = "Stop"

$ManifestPath = Join-Path $RepoRoot "phase1_cleanup_manifest_2025-12-22.json"
if (!(Test-Path $ManifestPath)) {
  throw "Manifest not found at: $ManifestPath. Copy the cleanup pack files into repo root and re-run."
}

$manifestJson = Get-Content $ManifestPath -Raw | ConvertFrom-Json
$entries = $manifestJson.entries

function Ensure-Dir([string]$path) {
  $dir = Split-Path $path -Parent
  if ($dir -and !(Test-Path $dir)) {
    if (!$DryRun) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
    else { Write-Host "[dryrun] mkdir $dir" }
  }
}

function Move-ItemSafe([string]$srcAbs, [string]$dstAbs) {
  Ensure-Dir $dstAbs
  if ($DryRun) {
    Write-Host "[dryrun] move $srcAbs -> $dstAbs"
    return
  }
  if (Test-Path $dstAbs) {
    # Avoid overwrite; append timestamp
    $ts = Get-Date -Format "yyyyMMdd_HHmmss"
    $dstAbs = $dstAbs + "__" + $ts
  }
  Move-Item -Force -Path $srcAbs -Destination $dstAbs
}

function Delete-Or-Quarantine([string]$srcAbs, [string]$relPath) {
  if ($HardDelete) {
    if ($DryRun) { Write-Host "[dryrun] delete $srcAbs"; return }
    Remove-Item -Force -Recurse -Path $srcAbs
    return
  }
  # Default: quarantine deletes
  $qRoot = Join-Path $RepoRoot "_quarantine/phase1_deleted"
  $dstAbs = Join-Path $qRoot $relPath
  Move-ItemSafe $srcAbs $dstAbs
}

Write-Host "=== LazyTopper Phase 1 Apply (Quarantine-first) ==="
Write-Host "RepoRoot: $RepoRoot"
Write-Host "DryRun:   $DryRun"
Write-Host "HardDelete: $HardDelete"
Write-Host "Manifest: $ManifestPath"
Write-Host ""

$moveCount = 0
$deleteCount = 0
$skipCount = 0

foreach ($e in $entries) {
  $rel = $e.path
  $action = $e.action
  $srcAbs = Join-Path $RepoRoot $rel

  if ($action -eq "keep") { continue }

  if (!(Test-Path $srcAbs)) {
    Write-Host "[skip] missing: $rel"
    $skipCount++
    continue
  }

  if ($action -eq "move") {
    $dstRel = $e.dest
    if ([string]::IsNullOrWhiteSpace($dstRel)) {
      Write-Host "[skip] move has no dest: $rel"
      $skipCount++
      continue
    }
    $dstAbs = Join-Path $RepoRoot $dstRel
    Move-ItemSafe $srcAbs $dstAbs
    Write-Host "[move] $rel -> $dstRel"
    $moveCount++
    continue
  }

  if ($action -eq "delete") {
    Delete-Or-Quarantine $srcAbs $rel
    if ($HardDelete) { Write-Host "[delete] $rel" } else { Write-Host "[quarantine-delete] $rel -> _quarantine/phase1_deleted/$rel" }
    $deleteCount++
    continue
  }

  Write-Host "[skip] unknown action '$action' for $rel"
  $skipCount++
}

Write-Host ""
Write-Host "Done."
Write-Host "Moved:   $moveCount"
Write-Host "Deleted: $deleteCount (quarantined unless -HardDelete)"
Write-Host "Skipped: $skipCount"
