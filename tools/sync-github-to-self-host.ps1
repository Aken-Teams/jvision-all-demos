[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [ValidatePattern('^[A-Za-z0-9.:-]+$')]
  [string]$DeployHost,

  [Parameter(Mandatory = $true)]
  [ValidatePattern('^https://')]
  [string]$HealthUrl,

  [Parameter(Mandatory = $true)]
  [string]$SshKeyPath,

  [Parameter(Mandatory = $true)]
  [string]$KnownHostsPath,

  [ValidatePattern('^[A-Za-z0-9._-]+$')]
  [string]$DeployUser = 'aken',

  [ValidatePattern('^[A-Za-z0-9._/-]+$')]
  [string]$Branch = 'feat/homepage-impact',

  [string]$RemoteRepo = '/home/aken/code/jvision-all-demos-homepage-impact-20260723'
)

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot

function Invoke-Native {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Executable,
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$Arguments
  )
  & $Executable @Arguments
  if ($LASTEXITCODE -ne 0) {
    throw "$Executable exited with code $LASTEXITCODE"
  }
}

foreach ($requiredPath in @($SshKeyPath, $KnownHostsPath)) {
  if (-not (Test-Path -LiteralPath $requiredPath -PathType Leaf)) {
    throw "Required SSH file is missing: $requiredPath"
  }
}

Push-Location $repoRoot
try {
  Invoke-Native git fetch --quiet origin $Branch
  $candidateSha = (& git rev-parse "origin/$Branch").Trim()
  if ($LASTEXITCODE -ne 0 -or $candidateSha -notmatch '^[0-9a-f]{40}$') {
    throw 'Could not resolve the GitHub release SHA.'
  }

  try {
    $health = Invoke-RestMethod -Uri $HealthUrl -Method Get -TimeoutSec 10 -Headers @{ 'Cache-Control' = 'no-cache' }
    if ($health.ok -eq $true -and $health.release -eq $candidateSha) {
      Write-Output "Deployment is already current at $candidateSha."
      return
    }
  } catch {
    Write-Verbose "The public health endpoint is not current yet: $($_.Exception.Message)"
  }

  $bundlePath = Join-Path ([System.IO.Path]::GetTempPath()) "jvision-release-$candidateSha.bundle"
  $remoteBundle = "/tmp/jvision-release-$candidateSha.bundle"
  try {
    Invoke-Native git bundle create $bundlePath "refs/remotes/origin/$Branch"

    $sshOptions = @(
      '-i', $SshKeyPath,
      '-o', 'BatchMode=yes',
      '-o', 'IdentitiesOnly=yes',
      '-o', 'StrictHostKeyChecking=yes',
      '-o', "UserKnownHostsFile=$KnownHostsPath"
    )
    Invoke-Native scp @sshOptions $bundlePath "${DeployUser}@${DeployHost}:$remoteBundle"

    $remoteCommand = "set -eu; trap 'rm -f -- $remoteBundle' EXIT; env JVISION_REPO_ROOT='$RemoteRepo' JVISION_DEPLOY_BRANCH='$Branch' JVISION_BUNDLE_PATH='$remoteBundle' JVISION_BUNDLE_REF='refs/remotes/origin/$Branch' sh '$RemoteRepo/tools/self-host-sync.sh'"
    Invoke-Native ssh @sshOptions "${DeployUser}@${DeployHost}" $remoteCommand
  } finally {
    Remove-Item -LiteralPath $bundlePath -Force -ErrorAction SilentlyContinue
  }

  $verified = $false
  for ($attempt = 0; $attempt -lt 12; $attempt++) {
    try {
      $health = Invoke-RestMethod -Uri $HealthUrl -Method Get -TimeoutSec 10 -Headers @{ 'Cache-Control' = 'no-cache' }
      if ($health.ok -eq $true -and $health.release -eq $candidateSha) {
        $verified = $true
        break
      }
    } catch {
      Write-Verbose "Health verification attempt $($attempt + 1) failed: $($_.Exception.Message)"
    }
    Start-Sleep -Seconds 5
  }
  if (-not $verified) {
    throw "The deployment command completed, but the public endpoint did not report $candidateSha."
  }
  Write-Output "GitHub release $candidateSha is healthy at $HealthUrl."
} finally {
  Pop-Location
}
