$ErrorActionPreference = 'Stop'
$version = node -p "require('./package.json').version"
$installer = (Resolve-Path "work/windows/Quiet-Shelf-Setup-$version-x64.exe").Path
$installPath = Join-Path $env:RUNNER_TEMP 'quiet-shelf-update-smoke'
$appExe = Join-Path $installPath 'Quiet Shelf.exe'
$profilePath = Join-Path $env:APPDATA 'Quiet Shelf'
$sentinel = Join-Path $profilePath 'update-smoke-sentinel.json'

function Wait-NativeWindow {
    for ($attempt = 0; $attempt -lt 30; $attempt++) {
        $process = Get-Process -Name 'Quiet Shelf' -ErrorAction SilentlyContinue |
            Where-Object { $_.Path -eq $appExe -and $_.MainWindowHandle -ne 0 -and $_.MainWindowTitle -eq 'Quiet Shelf' } |
            Select-Object -First 1
        if ($process) { return $process }
        Start-Sleep -Seconds 1
    }
    throw 'The installed app did not create its native window.'
}

try {
    $initialInstall = Start-Process -FilePath $installer -ArgumentList @('/S', "/D=$installPath") -PassThru
    if (-not $initialInstall.WaitForExit(120000)) { throw 'Initial smoke installation timed out.' }
    if ($initialInstall.ExitCode -ne 0) { throw 'Initial smoke installation failed.' }
    New-Item -ItemType Directory -Force $profilePath | Out-Null
    Set-Content -Path $sentinel -Value '{"preserve":"existing local data"}' -NoNewline
    $null = Start-Process -FilePath $appExe -ArgumentList '--disable-gpu' -PassThru
    $oldApp = Wait-NativeWindow
    $upgrading = Start-Process -FilePath $installer -ArgumentList @('/S', "/UPDATEPID=$($oldApp.Id)", '/RESTARTAPP') -PassThru
    Start-Sleep -Seconds 2
    $upgrading.Refresh()
    if ($upgrading.HasExited) { throw 'The update installer failed to wait for the running app.' }
    Stop-Process -Id $oldApp.Id -Force
    if (-not $upgrading.WaitForExit(120000)) { throw 'The update installer timed out.' }
    if ($upgrading.ExitCode -ne 0) { throw 'The update installer failed.' }
    $restarted = Wait-NativeWindow
    if ($restarted.Id -eq $oldApp.Id) { throw 'The app was not restarted by the update installer.' }
    if ((Get-Content $sentinel -Raw) -ne '{"preserve":"existing local data"}') { throw 'The update changed existing local data.' }
    Write-Output 'PASS: silent install, waiting for the previous process, in-place update, native restart and preserved app-data profile.'
} finally {
    Get-Process -Name 'Quiet Shelf' -ErrorAction SilentlyContinue |
        Where-Object { $_.Path -eq $appExe } |
        Stop-Process -Force -ErrorAction SilentlyContinue
}
