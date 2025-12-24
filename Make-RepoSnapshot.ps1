<# 
LazyTopper — Make Repo Snapshot (safe, launch-ready)
Creates a lightweight snapshot ZIP + reports to help identify unused/duplicate files
WITHOUT touching runtime code.

Usage (PowerShell):
  cd C:\Projects\lazytopper
  powershell -ExecutionPolicy Bypass -File .\Make-RepoSnapshot.ps1

Outputs:
  _share\snapshot\   (zip + reports)
#>

param(
  [string]$OutRoot = "$PSScriptRoot\_share\snapshot",
  [string]$ZipNamePrefix = "lazytopper_repo_snapshot",
  [int]$MaxHashFileSizeMB = 5,
  [int]$MaxZipReadRetries = 6
)

$ErrorActionPreference = "Stop"

# --- Root resolution (works even if run from interactive console) ---
if ([string]::IsNullOrWhiteSpace($PSScriptRoot)) {
  $RepoRoot = (Get-Location).Path
} else {
  $RepoRoot = $PSScriptRoot
}
if ([string]::IsNullOrWhiteSpace($OutRoot)) {
  $OutRoot = Join-Path $RepoRoot "_share\snapshot"
}

function New-CleanDir {
  param([Parameter(Mandatory=$true)][string]$PathToMake)
  if (!(Test-Path -LiteralPath $PathToMake)) {
    New-Item -ItemType Directory -Force -Path $PathToMake | Out-Null
  }
}

function Write-Text {
  param([Parameter(Mandatory=$true)][string]$Path, [Parameter(Mandatory=$true)][string]$Text)
  [System.IO.File]::WriteAllText($Path, $Text, (New-Object System.Text.UTF8Encoding($false)))
}

# PSScriptAnalyzer warns on custom verbs; keep verbs approved.
function Test-ExcludedPath {
  param([Parameter(Mandatory=$true)][string]$FullPath, [Parameter(Mandatory=$true)][string[]]$ExcludeDirs)

  # Normalize separators for matching
  $p = $FullPath.Replace('/', '\')

  foreach ($d in $ExcludeDirs) {
    # Match path segment like \node_modules\ or \.git\
    $seg = "\" + $d.Trim('\') + "\"
    if ($p -like "*$seg*") { return $true }
  }
  return $false
}

# Ensure output folder exists
New-CleanDir $OutRoot

$ts = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$base = "$ZipNamePrefix" + "_" + $ts

$zipPath = Join-Path $OutRoot ($base + ".zip")

# Excludes (keep snapshot small + deterministic)
$excludeDirs = @(
  ".git", "node_modules", "dist",
  "_backups", "_exports", "_quarantine", "_share"
)

# Collect files to snapshot
$all = Get-ChildItem -Path $RepoRoot -Recurse -File -Force |
  Where-Object { -not (Test-ExcludedPath -FullPath $_.FullName -ExcludeDirs $excludeDirs) }

$allSorted = $all | Sort-Object FullName

# --- Reports: trees + paths ---
$treeAllPath  = Join-Path $OutRoot ($base + "_repo_tree_all.txt")
$treeSrcPath  = Join-Path $OutRoot ($base + "_repo_tree_src.txt")
$pathsAllPath = Join-Path $OutRoot ($base + "_repo_paths_all.txt")
$pathsSrcPath = Join-Path $OutRoot ($base + "_repo_paths_src.txt")

Write-Text $pathsAllPath (($allSorted | ForEach-Object { $_.FullName.Replace($RepoRoot + "\", "") }) -join "`r`n")

$srcOnly = $allSorted | Where-Object { $_.FullName.Replace('/', '\') -like "*\src\*" }
Write-Text $pathsSrcPath (($srcOnly | ForEach-Object { $_.FullName.Replace($RepoRoot + "\", "") }) -join "`r`n")

# Tree view (folders + files), excluding heavy dirs
$treeAll = Get-ChildItem -Path $RepoRoot -Recurse -Force |
  Where-Object { -not (Test-ExcludedPath -FullPath $_.FullName -ExcludeDirs $excludeDirs) } |
  ForEach-Object {
    $rel = $_.FullName.Replace($RepoRoot + "\", "")
    if ($_.PSIsContainer) { "DIR  $rel" } else { "FILE $rel" }
  }
Write-Text $treeAllPath ($treeAll -join "`r`n")

# src tree view (only if src exists)
$srcDir = Join-Path $RepoRoot "src"
if (Test-Path -LiteralPath $srcDir) {
  $treeSrc = Get-ChildItem -Path $srcDir -Recurse -Force |
    ForEach-Object {
      $rel = $_.FullName.Replace($RepoRoot + "\", "")
      if ($_.PSIsContainer) { "DIR  $rel" } else { "FILE $rel" }
    }
  Write-Text $treeSrcPath ($treeSrc -join "`r`n")
} else {
  Write-Text $treeSrcPath "No src/ folder found under: $RepoRoot"
}

# --- Duplicate detector (hash-based) ---
# Exact duplicates: same bytes (SHA256). Great for catching accidental copies.
$dupCsv = Join-Path $OutRoot ($base + "_duplicates_sha256.csv")

$hashRows = @()
$maxBytes = $MaxHashFileSizeMB * 1MB
foreach ($f in $allSorted) {
  if ($f.Length -gt $maxBytes) { continue }
  $h = Get-FileHash -Algorithm SHA256 -Path $f.FullName
  $hashRows += [PSCustomObject]@{
    sha256 = $h.Hash
    size   = $f.Length
    file   = $f.FullName.Replace($RepoRoot + "\", "")
  }
}

$hashGroups = $hashRows | Group-Object sha256 | Where-Object { $_.Count -gt 1 } | Sort-Object Count -Descending
$dupOut = @()
foreach ($g in $hashGroups) {
  foreach ($item in $g.Group) {
    $dupOut += [PSCustomObject]@{
      sha256   = $item.sha256
      size     = $item.size
      file     = $item.file
      dupCount = $g.Count
    }
  }
}

if ($dupOut.Count -gt 0) {
  $dupOut | Export-Csv -NoTypeInformation -Encoding UTF8 $dupCsv
} else {
  Write-Text $dupCsv "No exact duplicates found (SHA256)."
}

# --- ZIP snapshot (no staging; resilient to file locks) ---
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

$lockedPath = Join-Path $OutRoot ($base + "_LOCKED_FILES.txt")
$locked = New-Object System.Collections.Generic.List[string]

if (Test-Path -LiteralPath $zipPath) { Remove-Item -Force $zipPath }

$zipFs = [System.IO.File]::Open($zipPath, [System.IO.FileMode]::CreateNew, [System.IO.FileAccess]::ReadWrite, [System.IO.FileShare]::None)
try {
  $zip = New-Object System.IO.Compression.ZipArchive($zipFs, [System.IO.Compression.ZipArchiveMode]::Create, $false)
  try {
    foreach ($f in $allSorted) {
      $rel = $f.FullName.Replace($RepoRoot + "\", "")
      $rel = $rel.Replace("\", "/") # zip standard

      $entry = $zip.CreateEntry($rel, [System.IO.Compression.CompressionLevel]::Fastest)
      $entryStream = $entry.Open()
      $srcStream = $null

      try {
        for ($i = 0; $i -lt $MaxZipReadRetries; $i++) {
          try {
            # FileShare.ReadWrite avoids failures when VS Code / scanners have the file open.
            $srcStream = [System.IO.File]::Open($f.FullName, [System.IO.FileMode]::Open, [System.IO.FileAccess]::Read, [System.IO.FileShare]::ReadWrite)
            break
          } catch {
            Start-Sleep -Milliseconds (250 * ($i + 1))
          }
        }

        if ($null -eq $srcStream) {
          $locked.Add($f.FullName)
          continue
        }

        $srcStream.CopyTo($entryStream)
      } finally {
        if ($srcStream) { $srcStream.Dispose() }
        if ($entryStream) { $entryStream.Dispose() }
      }
    }
  } finally {
    $zip.Dispose()
  }
} finally {
  $zipFs.Dispose()
}

if ($locked.Count -gt 0) {
  Write-Text $lockedPath ("Some files were locked and were skipped:`r`n" + ($locked -join "`r`n"))
} else {
  Write-Text $lockedPath "No locked files encountered."
}

# Summary
$summaryPath = Join-Path $OutRoot ($base + "_SUMMARY.txt")
$summary = @"
Snapshot created:
  $zipPath

Reports:
  $treeAllPath
  $treeSrcPath
  $pathsAllPath
  $pathsSrcPath
  $dupCsv
  $lockedPath

Next:
  1) Upload the ZIP + the duplicates CSV to ChatGPT.
  2) Also upload your latest src/App.tsx (routes) and src/main.tsx, so we can produce an exact Keep/Move/Delete manifest.
"@
Write-Text $summaryPath $summary

Write-Host $summary
