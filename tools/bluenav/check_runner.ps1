$ErrorActionPreference = 'Stop'
$config = Get-Content -LiteralPath "$PSScriptRoot/../../bluenav.native.json" -Raw | ConvertFrom-Json
$root = (Resolve-Path -LiteralPath "$PSScriptRoot/../..").Path
if (-not $IsWindows) { throw 'A Windows x64 runner is required.' }
if ($env:PROCESSOR_ARCHITECTURE -ne 'AMD64') { throw 'An x64 runner is required.' }
if ($root.Contains(' ')) { throw 'Chromium requires a workspace path without spaces.' }
$drive = Get-PSDrive -Name ([IO.Path]::GetPathRoot($root).Substring(0, 1))
if ($drive.Free -lt ($config.build.minimumFreeDiskGiB * 1GB)) {
    throw "At least $($config.build.minimumFreeDiskGiB) GiB free is required on the build volume."
}
$memory = (Get-CimInstance Win32_ComputerSystem).TotalPhysicalMemory
if ($memory -lt ($config.build.minimumMemoryGiB * 1GB)) {
    throw "At least $($config.build.minimumMemoryGiB) GiB RAM is required."
}
$vswhere = Join-Path ${env:ProgramFiles(x86)} 'Microsoft Visual Studio/Installer/vswhere.exe'
if (-not (Test-Path -LiteralPath $vswhere)) { throw 'Install Visual Studio 2022 with Desktop development with C++.' }
$visualStudio = & $vswhere -latest -products '*' -requires Microsoft.VisualStudio.Component.VC.Tools.x86.x64 -property installationPath
if (-not $visualStudio) { throw 'Visual Studio C++ x64 build tools are missing.' }
$sdk = Join-Path ${env:ProgramFiles(x86)} 'Windows Kits/10/Include'
if (-not (Test-Path -LiteralPath $sdk)) { throw 'Install the Windows SDK required by the pinned Chromium revision.' }
Write-Output "Build machine ready: $([math]::Round($drive.Free / 1GB)) GiB free, $([math]::Round($memory / 1GB)) GiB RAM."
