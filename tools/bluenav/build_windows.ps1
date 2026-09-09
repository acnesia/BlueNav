$ErrorActionPreference = 'Stop'
$root = (Resolve-Path -LiteralPath "$PSScriptRoot/../..").Path
$config = Get-Content -LiteralPath "$root/bluenav.native.json" -Raw | ConvertFrom-Json
$buildArgs = @('build/commands/scripts/build.ts', 'Release', '-C', 'BlueNav', '--target', 'mini_installer', '--target_os', 'win', '--target_arch', 'x64', '--channel', 'release', '--skip_signing', '--use_remoteexec', 'false')
foreach ($property in $config.build.gnArgs.PSObject.Properties) {
    $value = if ($property.Value -is [bool]) { $property.Value.ToString().ToLowerInvariant() } else { [string]$property.Value }
    $buildArgs += @('--gn', "$($property.Name):$value")
}
Push-Location -LiteralPath $root
try {
    & node @buildArgs
    if ($LASTEXITCODE -ne 0) { throw "Native compilation failed with exit code $LASTEXITCODE" }
    $out = Join-Path (Split-Path -Parent $root) 'out/BlueNav'
    $installer = Join-Path $out 'mini_installer.exe'
    if (-not (Test-Path -LiteralPath $installer)) { throw "Native installer missing: $installer" }
    $artifacts = Join-Path $root 'artifacts/native'
    New-Item -ItemType Directory -Path $artifacts -Force | Out-Null
    $destination = Join-Path $artifacts "BlueNav-native-$($config.version)-Windows-x64.exe"
    Copy-Item -LiteralPath $installer -Destination $destination
    $revision = (& git rev-parse HEAD).Trim()
    if ($LASTEXITCODE -ne 0) { throw 'Cannot determine source revision.' }
    $chromium = (Get-Content -LiteralPath "$root/package.json" -Raw | ConvertFrom-Json).config.projects.chrome.tag
    @{
        version = $config.version
        revision = $revision
        chromium = $chromium
        sha256 = (Get-FileHash -LiteralPath $destination -Algorithm SHA256).Hash
        signed = $false
        configuration = $config
    } | ConvertTo-Json -Depth 12 | Set-Content -LiteralPath "$artifacts/build-info.json" -Encoding utf8
    Copy-Item -LiteralPath "$out/args.gn" -Destination "$artifacts/args.gn"
} finally {
    Pop-Location
}
