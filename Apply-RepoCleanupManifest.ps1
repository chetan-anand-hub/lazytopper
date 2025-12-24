<# 
LazyTopper — Apply Repo Cleanup Manifest (SAFE)
- Reads a cleanup manifest CSV (path, action, reason)
- For DELETE and QUARANTINE_CANDIDATE, moves files into _quarantine (never hard-deletes by default)
- Generates an undo_manifest.csv so you can restore everything.

USAGE (PowerShell, from repo root):
  powershell -ExecutionPolicy Bypass -File .\Apply-RepoCleanupManifest.ps1 -Manifest ".\LazyTopper_Repo_Cleanup_Manifest_2025-12-24.csv" -DryRun
  powershell -ExecutionPolicy Bypass -File .\Apply-RepoCleanupManifest.ps1 -Manifest ".\LazyTopper_Repo_Cleanup_Manifest_2025-12-24.csv"

NOTES
- VS Code may warn about "unapproved verbs" from PSScriptAnalyzer. Those are warnings only.
- This script is designed to be idempotent + safe: it won't delete runtime code, it quarantines.
#>

[CmdletBinding()]
param(
  [Parameter(Mandatory=$true)]
  [string]$Manifest,

  [string]$RepoRoot = $PSScriptRoot,

  [string]$QuarantineRoot = "",

  [switch]$DryRun
)
# ---- Robust defaults (avoid "LiteralPath is an empty string" failures) ----
if ([string]::IsNullOrWhiteSpace($RepoRoot)) {
  # Fall back to current working directory when $PSScriptRoot is unavailable (edge cases)
  $RepoRoot = (Get-Location).Path
}

if ([string]::IsNullOrWhiteSpace($Manifest)) {
  # If user didn't pass -Manifest, auto-pick the newest cleanup manifest in repo root.
  $candidate = Get-ChildItem -Path $RepoRoot -File -Filter "LazyTopper_Repo_Cleanup_Manifest_*.csv" -ErrorAction SilentlyContinue |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 1
  if ($null -eq $candidate) {
    throw "Manifest path is empty and no LazyTopper_Repo_Cleanup_Manifest_*.csv was found under: $RepoRoot"
  }
  $Manifest = $candidate.FullName
}

$ErrorActionPreference = "Stop"

function New-CleanDirectory([string]$PathToMake) {
  if ([string]::IsNullOrWhiteSpace($PathToMake)) { return }
  if (!(Test-Path -LiteralPath $PathToMake)) {
    New-Item -ItemType Directory -Force -Path $PathToMake | Out-Null
  }
}

function Write-Utf8NoBom([string]$Path, [string]$Text) {
  [System.IO.File]::WriteAllText($Path, $Text, (New-Object System.Text.UTF8Encoding($false)))
}

function ConvertTo-RelPath([string]$p) {
  if ($null -eq $p) { return "" }
  $x = "$p".Trim()
  $x = $x -replace "^[`"']|[`"']$", ""          # strip surrounding quotes if any
  $x = $x -replace "^[.\\\/]+", ""              # remove leading ./ .\ / \
  $x = $x -replace "[\\/]+", "\"               # normalize separators to Windows
  return $x
}

function Join-SafePath([string]$root, [string]$rel) {
  $r = ConvertTo-RelPath $rel
  if ([string]::IsNullOrWhiteSpace($r)) { return $root }
  return (Join-Path -Path $root -ChildPath $r)
}

function Move-Or-CopyToQuarantine(
  [string]$SourceFull,
  [string]$DestFull,
  [string]$RelPath,
  [string]$ActionLabel
) {
  $destDir = Split-Path -Parent $DestFull
  New-CleanDirectory $destDir

  if ($DryRun) {
    return @{
      status = "DRYRUN"
      error  = ""
    }
  }

  try {
    Move-Item -LiteralPath $SourceFull -Destination $DestFull -Force
    return @{ status = "MOVED"; error = "" }
  } catch {
    # Locked files or permission issues — try copy, then leave source in place if remove fails.
    try {
      Copy-Item -LiteralPath $SourceFull -Destination $DestFull -Force
      return @{ status = "COPIED_SOURCE_REMAINS"; error = ($_.Exception.Message) }
    } catch {
      return @{ status = "FAILED"; error = ($_.Exception.Message) }
    }
  }
}

# Resolve manifest path
$manifestFull = Resolve-Path -LiteralPath $Manifest -ErrorAction Stop | Select-Object -ExpandProperty Path
$repoFull = Resolve-Path -LiteralPath $RepoRoot -ErrorAction Stop | Select-Object -ExpandProperty Path

# Quarantine root (timestamped to prevent collisions)
if ([string]::IsNullOrWhiteSpace($QuarantineRoot)) {
  $ts = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
  $QuarantineRoot = Join-Path $repoFull ("_quarantine\phase2_" + $ts)
}

$qcRoot = Join-Path $QuarantineRoot "candidates"
$delRoot = Join-Path $QuarantineRoot "deleted"
$logRoot = Join-Path $QuarantineRoot "logs"
New-CleanDirectory $qcRoot
New-CleanDirectory $delRoot
New-CleanDirectory $logRoot

$undoPath = Join-Path $logRoot "undo_manifest.csv"
$summaryPath = Join-Path $logRoot "SUMMARY.txt"

# Read CSV
$rows = Import-Csv -LiteralPath $manifestFull

# Counters
$counts = [ordered]@{
  KEEP_SKIPPED = 0
  QUARANTINED  = 0
  DELETED_SAFE = 0
  MISSING      = 0
  FAILED       = 0
  COPIED       = 0
  DRYRUN       = 0
}

$undo = New-Object System.Collections.Generic.List[object]

foreach ($row in $rows) {
  $rel = ConvertTo-RelPath $row.path
  $action = ("" + $row.action).Trim().ToUpperInvariant()

  if ([string]::IsNullOrWhiteSpace($rel) -or [string]::IsNullOrWhiteSpace($action)) {
    continue
  }

  $src = Join-SafePath $repoFull $rel

  if (!(Test-Path -LiteralPath $src)) {
    $counts.MISSING++
    $undo.Add([pscustomobject]@{
      action = $action
      relPath = $rel
      source = $src
      quarantine = ""
      status = "SKIPPED_MISSING"
      error = ""
    })
    continue
  }

  if ($action -eq "KEEP_RUNTIME") {
    $counts.KEEP_SKIPPED++
    $undo.Add([pscustomobject]@{
      action = $action
      relPath = $rel
      source = $src
      quarantine = ""
      status = "SKIPPED_KEEP"
      error = ""
    })
    continue
  }

  if ($action -eq "QUARANTINE_CANDIDATE") {
    $dest = Join-SafePath $qcRoot $rel
    $res = Move-Or-CopyToQuarantine -SourceFull $src -DestFull $dest -RelPath $rel -ActionLabel $action
    if ($res.status -eq "MOVED") { $counts.QUARANTINED++ }
    elseif ($res.status -eq "COPIED_SOURCE_REMAINS") { $counts.COPIED++ }
    elseif ($res.status -eq "DRYRUN") { $counts.DRYRUN++ }
    else { $counts.FAILED++ }

    $undo.Add([pscustomobject]@{
      action = $action
      relPath = $rel
      source = $src
      quarantine = $dest
      status = $res.status
      error = $res.error
    })
    continue
  }

  if ($action -eq "DELETE") {
    # SAFE delete = quarantine under deleted/
    $dest = Join-SafePath $delRoot $rel
    $res = Move-Or-CopyToQuarantine -SourceFull $src -DestFull $dest -RelPath $rel -ActionLabel $action
    if ($res.status -eq "MOVED") { $counts.DELETED_SAFE++ }
    elseif ($res.status -eq "COPIED_SOURCE_REMAINS") { $counts.COPIED++ }
    elseif ($res.status -eq "DRYRUN") { $counts.DRYRUN++ }
    else { $counts.FAILED++ }

    $undo.Add([pscustomobject]@{
      action = $action
      relPath = $rel
      source = $src
      quarantine = $dest
      status = $res.status
      error = $res.error
    })
    continue
  }

  # Unknown action -> skip
  $undo.Add([pscustomobject]@{
    action = $action
    relPath = $rel
    source = $src
    quarantine = ""
    status = "SKIPPED_UNKNOWN_ACTION"
    error = ""
  })
}

# Write undo manifest
$undo | Export-Csv -NoTypeInformation -Encoding UTF8 -LiteralPath $undoPath

# Summary
$summary = @()
$summary += "Apply-RepoCleanupManifest.ps1 completed"
$summary += ""
$summary += ("RepoRoot:       " + $repoFull)
$summary += ("Manifest:       " + $manifestFull)
$summary += ("QuarantineRoot: " + $QuarantineRoot)
$summary += ("DryRun:         " + $DryRun)
$summary += ""
$summary += "Counts:"
foreach ($k in $counts.Keys) {
  $summary += ("  " + $k + ": " + $counts[$k])
}
$summary += ""
$summary += ("Undo manifest:  " + $undoPath)
$summary += ""
$summary += "Next:"
$summary += "  - If DryRun looks correct, re-run without -DryRun."
$summary += "  - After quarantine, run: npm run build && npm run lint"
$summary += "  - If something breaks, restore from undo_manifest.csv by copying files back."

Write-Utf8NoBom -Path $summaryPath -Text ($summary -join "`r`n")

Write-Host ($summary -join "`r`n")