param(
  [ValidateSet('snapshot', 'stop')][string]$Action = 'snapshot',
  [int]$TargetPid = 0,
  [string]$ExpectedStartedAt = '',
  [int]$ExpectedPort = 0
)
$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [Text.UTF8Encoding]::new($false)

if ($Action -eq 'snapshot') {
  $leoProcesses = @(Get-CimInstance Win32_Process -Filter "Name='node.exe' OR Name='cloudflared.exe'" | ForEach-Object {
    [pscustomobject]@{
      pid = $_.ProcessId; parentPid = $_.ParentProcessId; name = $_.Name
      startedAt = $_.CreationDate.ToUniversalTime().ToString('o')
      command = $_.CommandLine
    }
  })
  $leoListeners = @(Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | ForEach-Object {
    [pscustomobject]@{ pid = $_.OwningProcess; port = $_.LocalPort; host = $_.LocalAddress }
  })
  [pscustomobject]@{ processes = $leoProcesses; listeners = $leoListeners } | ConvertTo-Json -Depth 4 -Compress
  exit 0
}

if ($TargetPid -le 0 -or !$ExpectedStartedAt) { throw 'Missing process identity.' }
$leoProcess = Get-CimInstance Win32_Process -Filter "ProcessId=$TargetPid"
if (!$leoProcess) { exit 0 }
if ($leoProcess.Name -ne 'node.exe' -or $leoProcess.CreationDate.ToUniversalTime().ToString('o') -ne $ExpectedStartedAt) {
  throw 'Process identity changed; refusing to stop it.'
}
if ($ExpectedPort -gt 0) {
  $leoListener = @(Get-NetTCPConnection -State Listen -LocalPort $ExpectedPort -ErrorAction SilentlyContinue)
  if (!$leoListener.Count -or @($leoListener | Where-Object { $_.OwningProcess -ne $TargetPid }).Count) {
    throw 'Port ownership changed; refusing to stop it.'
  }
}
# App PID only. Never kill a parent process, cloudflared, or all listeners by name.
Stop-Process -Id $TargetPid -Force
Wait-Process -Id $TargetPid -Timeout 10 -ErrorAction SilentlyContinue
