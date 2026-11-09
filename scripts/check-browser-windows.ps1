$ErrorActionPreference = 'Stop'
$browserRoot = Join-Path $env:RUNNER_TEMP 'quiet-shelf-browser'
Expand-Archive 'work/quiet-shelf-pc.zip' $browserRoot
$root = Join-Path $browserRoot 'quiet-shelf'
$start = [System.Diagnostics.ProcessStartInfo]::new()
$start.FileName = (Get-Command node).Source
$start.ArgumentList.Add((Join-Path $root 'pc/server.mjs'))
$start.WorkingDirectory = $root
$start.UseShellExecute = $false
$start.Environment['QUIET_SHELF_NO_OPEN'] = '1'
foreach ($name in @('QUIET_SHELF_GOOGLE_DESKTOP_CLIENT_ID','QUIET_SHELF_GOOGLE_DESKTOP_CLIENT_SECRET','QUIET_SHELF_GOOGLE_WEB_CLIENT_ID','QUIET_SHELF_GOOGLE_WEB_CLIENT_SECRET','QUIET_SHELF_SESSION_KEY')) { $start.Environment.Remove($name) | Out-Null }
$server = [System.Diagnostics.Process]::Start($start)
$edge = $null
try {
    $ready = $false
    for ($attempt=0; $attempt -lt 30; $attempt++) {
        try { $response = Invoke-WebRequest 'http://127.0.0.1:8765/api/account/status' -UseBasicParsing; if ($response.StatusCode -eq 200) { $ready=$true; break } } catch {}
        Start-Sleep -Seconds 1
    }
    if (-not $ready) { throw 'Packaged browser server did not start.' }
    $edgePath = @("${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe", "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe") | Where-Object { Test-Path $_ } | Select-Object -First 1
    if (-not $edgePath) { throw 'The Windows runner has no Edge browser.' }
    $edgeProfile = Join-Path $env:RUNNER_TEMP 'quiet-shelf-browser-profile'
    $edge = Start-Process -FilePath $edgePath -ArgumentList @('--headless=new','--disable-gpu','--no-first-run','--no-default-browser-check','--remote-debugging-port=9223',"--user-data-dir=$edgeProfile",'--window-size=1440,1200','http://127.0.0.1:8765/') -PassThru
    $ready=$false
    for ($attempt=0; $attempt -lt 30; $attempt++) {
        try { $null=Invoke-WebRequest 'http://127.0.0.1:9223/json/list' -UseBasicParsing; $ready=$true; break } catch {}
        Start-Sleep -Seconds 1
    }
    if (-not $ready) { throw 'Browser debugger did not become available.' }
    Start-Sleep -Seconds 2
    node scripts/check-browser-ui.mjs
    if ($LASTEXITCODE -ne 0) { throw 'The packaged browser interface check failed.' }
} finally {
    if ($edge -and -not $edge.HasExited) { Stop-Process -Id $edge.Id -Force -ErrorAction SilentlyContinue }
    if (-not $server.HasExited) { Stop-Process -Id $server.Id -Force -ErrorAction SilentlyContinue }
}
