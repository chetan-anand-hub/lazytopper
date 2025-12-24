Param(
  [string]$RepoRoot = (Get-Location).Path,
  [switch]$DryRun
)

$Q = Join-Path $RepoRoot "_quarantine/phase1_deleted"
if (!(Test-Path $Q)) {
  Write-Host "No quarantine folder found at: $Q"
  exit 0
}

Write-Host "This will permanently delete: $Q"
if ($DryRun) {
  Write-Host "[dryrun] Remove-Item -Recurse -Force $Q"
  exit 0
}

Remove-Item -Recurse -Force -Path $Q
Write-Host "Deleted quarantine folder."
