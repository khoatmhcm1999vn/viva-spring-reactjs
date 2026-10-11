<#
.SYNOPSIS
  Build backend tren may nay, chuyen sang VM Ubuntu, va recreate CHI service backend
  (topology Supabase). Xem docs/deployment/BACKEND_REDEPLOY.md.

.DESCRIPTION
  1. Kiem tra git: khong co thay doi chua commit o src/, pom.xml, Dockerfile; HEAD da push.
  2. docker build image bat bien vivacon-backend:git-<sha> cho dung kien truc CPU cua VM.
  3. docker save, scp sang /tmp tren VM, doi chieu SHA-256.
  4. Tren VM: git pull --ff-only, roi scripts/deploy/vm-backend-up.sh (load, doi
     BACKEND_IMAGE, recreate backend, cho healthy). Frontend, cloudflared, db khong bi dung.
  5. Probe tu may nay va ghi evidence da che vao docs/deployment/evidence/.

  Build tren VM khong kha thi: VM chi con ~1.3 GB RAM trong (deployment.md).

.EXAMPLE
  .\scripts\deploy\deploy-backend.ps1 -DryRun
  .\scripts\deploy\deploy-backend.ps1
  .\scripts\deploy\deploy-backend.ps1 -CheckOnly
  .\scripts\deploy\deploy-backend.ps1 -Rollback
#>
[CmdletBinding()]
param(
    [string]$VmHost = '192.168.221.128',
    [string]$VmUser = 'minh-khoa',
    [string]$RemoteDir = '~/viva-spring-reactjs',
    [string]$IdentityFile = '',
    [string]$PublicOrigin = 'https://viva-spring-reactjs-five.vercel.app',
    [switch]$CheckOnly,
    [switch]$Rollback,
    [switch]$DryRun,
    [switch]$AllowDirty,
    [switch]$Yes
)

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
$repo = (Resolve-Path (Join-Path (Join-Path $PSScriptRoot '..') '..')).Path
Set-Location $repo

if (-not $IdentityFile) { $IdentityFile = Join-Path (Join-Path $repo 'config') 'vm_ed25519' }
$sshOpts = @('-o', 'BatchMode=yes', '-o', 'StrictHostKeyChecking=accept-new', '-o', 'ConnectTimeout=15')
if (Test-Path $IdentityFile) { $sshOpts = @('-i', $IdentityFile) + $sshOpts }
$target = "$VmUser@$VmHost"

function Step($t) { Write-Host "`n== $t" -ForegroundColor Cyan }
function Run([string]$exe, [string[]]$argv) {
    if ($DryRun) { Write-Host ("  [dry-run] {0} {1}" -f $exe, ($argv -join ' ')); return '' }
    # Windows PowerShell 5.1 bien moi dong stderr cua lenh native thanh loi khi
    # ErrorActionPreference=Stop va co 2>&1 (docker build ghi tien do ra stderr).
    $prev = $ErrorActionPreference; $ErrorActionPreference = 'Continue'
    try { $out = & $exe @argv 2>&1 | ForEach-Object { "$_" } } finally { $ErrorActionPreference = $prev }
    if ($LASTEXITCODE -ne 0) { $out | ForEach-Object { Write-Host "  $_" }; throw "$exe that bai (exit $LASTEXITCODE)" }
    return $out
}
function Remote([string]$cmd) {
    # -n: khong de ssh doc stdin cua may nay (bay "exec -T nuot stdin" trong deployment.md).
    Run 'ssh' (@('-n') + $sshOpts + @($target, $cmd))
}

Step 'Kiem tra truoc'
$sha = (git rev-parse HEAD).Trim()
$short = $sha.Substring(0, 7)
$branch = (git branch --show-current).Trim()
Write-Host "  branch=$branch  HEAD=$sha"
if (-not $CheckOnly -and -not $Rollback) {
    $dirty = git status --porcelain -- src pom.xml Dockerfile .dockerignore GeoLite2-City.mmdb
    if ($dirty -and -not $AllowDirty) { $dirty | ForEach-Object { Write-Host "  $_" }; throw 'Co thay doi chua commit trong source backend. Commit truoc, hoac dung -AllowDirty (tag se co hau to -dirty).' }
    git fetch -q origin $branch
    $remoteSha = (git rev-parse "origin/$branch").Trim()
    if ($remoteSha -ne $sha) { throw "HEAD ($short) chua trung origin/$branch ($($remoteSha.Substring(0,7))). Push truoc: VM se git pull de lay compose + script." }
}
if (-not (Test-Path $IdentityFile)) { Write-Host "  (khong thay $IdentityFile; dung key mac dinh cua ssh-agent / ~/.ssh)" }

Step "Ket noi VM $target"
$arch = (Remote 'uname -m') | Select-Object -Last 1
if ($DryRun -and -not $arch) { $arch = 'x86_64' }
Write-Host "  VM arch=$arch"
$platform = switch -Regex ($arch) { 'x86_64|amd64' { 'linux/amd64' } 'aarch64|arm64' { 'linux/arm64' } default { throw "Kien truc VM la: $arch" } }

if ($CheckOnly) {
    Step 'Kiem tra .env tren VM (khong in secret)'
    Remote "cd $RemoteDir && git pull --ff-only -q && scripts/deploy/vm-backend-up.sh --check-only" | ForEach-Object { Write-Host $_ }
    return
}

if ($Rollback) {
    if (-not $Yes -and -not $DryRun) { if ((Read-Host 'Rollback backend tren VM ve PREVIOUS_BACKEND_IMAGE? Go yes') -ne 'yes') { return } }
    Step 'Rollback tren VM'
    Remote "cd $RemoteDir && scripts/deploy/vm-backend-up.sh --rollback --yes" | ForEach-Object { Write-Host $_ }
    return
}

$tag = "vivacon-backend:git-$short" + $(if ((git status --porcelain -- src pom.xml Dockerfile)) { '-dirty' } else { '' })
$tar = Join-Path ([IO.Path]::GetTempPath()) ("vivacon-backend-git-$short.tar")
$remoteTar = "/tmp/vivacon-backend-git-$short.tar"

Step "Build $tag ($platform)"
Run 'docker' @('build', '--platform', $platform, '-t', $tag, '.') | Select-Object -Last 3 | ForEach-Object { Write-Host "  $_" }

Step 'docker save + scp'
Run 'docker' @('save', '-o', $tar, $tag) | Out-Null
$localHash = if ($DryRun) { '<dry-run>' } else { (Get-FileHash $tar -Algorithm SHA256).Hash.ToLower() }
if (-not $DryRun) { Write-Host ("  {0}  {1:N0} MB" -f $localHash, ((Get-Item $tar).Length / 1MB)) }
Run 'scp' ($sshOpts + @($tar, "${target}:$remoteTar")) | Out-Null
$remoteHash = ((Remote "sha256sum $remoteTar") | Select-Object -Last 1) -replace '\s.*$', ''
if (-not $DryRun -and $remoteHash -ne $localHash) { throw "SHA-256 lech: local $localHash, VM $remoteHash" }
Write-Host $(if ($DryRun) { '  (dry-run: bo qua doi chieu SHA-256)' } else { '  SHA-256 khop' })

if (-not $Yes -and -not $DryRun) {
    Write-Host ''
    Write-Host '  Backend se khoi dong lai voi ddl-auto: update tren Supabase production.' -ForegroundColor Yellow
    Write-Host '  Entity/cot moi se duoc tao tren database that. Backup truoc (BACKEND_REDEPLOY.md, buoc 4).' -ForegroundColor Yellow
    if ((Read-Host '  Go yes de deploy') -ne 'yes') { Write-Host '  Huy. Image da o /tmp tren VM, chua load.'; return }
}

Step 'Deploy tren VM'
Remote "cd $RemoteDir && git pull --ff-only -q && scripts/deploy/vm-backend-up.sh --image $tag --tar $remoteTar --yes" | ForEach-Object { Write-Host $_ }
if (-not $DryRun) { Remove-Item $tar -ErrorAction SilentlyContinue }

Step "Probe tu may nay"
$lines = New-Object System.Collections.Generic.List[string]
$lines.Add("deploy_utc=" + (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ'))
$lines.Add("git_sha=$sha branch=$branch image=$tag platform=$platform tar_sha256=$localHash")
function Code($url, $headers = @{}) { try { [int](Invoke-WebRequest $url -Headers $headers -UseBasicParsing -TimeoutSec 20).StatusCode } catch { $r = $_.Exception.Response; if ($r) { [int]$r.StatusCode } else { 'NO_RESPONSE' } } }
if (-not $DryRun) {
    $lines.Add("GET http://$VmHost/api/v1/post (no token) -> $(Code "http://$VmHost/api/v1/post") (expect 401)")
    $lines.Add("GET http://$VmHost/api/v1/account/check?username=admin -> $(Code "http://$VmHost/api/v1/account/check?username=admin") (expect 200, body not recorded)")
    $lines.Add("GET http://$VmHost/ws/info Origin=$PublicOrigin -> $(Code "http://$VmHost/ws/info" @{ Origin = $PublicOrigin }) (expect 200)")
    $lines.Add("GET http://$VmHost/ws/info Origin=https://evil.example.com -> $(Code "http://$VmHost/ws/info" @{ Origin = 'https://evil.example.com' }) (expect 403)")
    $stamp = (Get-Date).ToUniversalTime().ToString('yyyyMMddTHHmmssZ')
    $ev = Join-Path (Join-Path (Join-Path (Join-Path $repo 'docs') 'deployment') 'evidence') "$stamp-backend-redeploy.txt"
    $lines | Set-Content $ev -Encoding utf8
    Write-Host "  evidence: $ev"
}
$lines | ForEach-Object { Write-Host "  $_" }
