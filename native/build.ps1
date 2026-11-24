param([string]$SdkDir = (Join-Path $PSScriptRoot 'bin'))

$ErrorActionPreference = 'Stop'
$compiler = Join-Path $env:WINDIR 'Microsoft.NET/Framework64/v4.0.30319/csc.exe'
Push-Location $PSScriptRoot
try {
    New-Item -ItemType Directory -Force bin | Out-Null
    if ((Resolve-Path $SdkDir).Path -ne (Resolve-Path bin).Path) {
        foreach ($name in 'Microsoft.Web.WebView2.Core.dll', 'Microsoft.Web.WebView2.WinForms.dll', 'WebView2Loader.dll') {
            Copy-Item -LiteralPath (Join-Path $SdkDir $name) -Destination bin -Force
        }
    }
    & $compiler /nologo /platform:x64 /target:winexe /win32manifest:Guarder.manifest /out:bin/GrokGuarderFloating.exe /reference:System.Windows.Forms.dll /reference:System.Drawing.dll /reference:System.Web.Extensions.dll /reference:bin/Microsoft.Web.WebView2.Core.dll /reference:bin/Microsoft.Web.WebView2.WinForms.dll Guarder.cs
    if ($LASTEXITCODE -ne 0) { throw "Floating panel compiler exited with code $LASTEXITCODE." }
} finally {
    Pop-Location
}
