param(
    [Parameter(Mandatory = $true)][string]$CursorExe,
    [string]$Root = (Join-Path $env:LOCALAPPDATA 'Grok Guarder Cursor'),
    [string]$Profile,
    [string]$DataRoot,
    [string]$VocabularyRoot,
    [switch]$NoShortcuts
)

$ErrorActionPreference = 'Stop'
$CursorExe = (Resolve-Path -LiteralPath $CursorExe).Path
if ([IO.Path]::GetFileName($CursorExe) -ne 'Cursor.exe') { throw 'Choose the Cursor.exe application.' }
$Root = [IO.Path]::GetFullPath($Root)
$runtime = Join-Path $Root 'runtime'
New-Item -ItemType Directory -Force $runtime | Out-Null
$runtimeFiles = 'floating', 'lib', 'native', 'launcher.cjs', 'resident.cjs'
foreach ($item in $runtimeFiles) {
    Copy-Item -LiteralPath (Join-Path $PSScriptRoot $item) -Destination $runtime -Recurse -Force
}
$configuration = @{ executable = $CursorExe }
if ($Profile) { $configuration.profile = [IO.Path]::GetFullPath($Profile) }
if ($DataRoot) { $configuration.dataRoot = [IO.Path]::GetFullPath($DataRoot) }
if ($VocabularyRoot) { $configuration.vocabularyRoot = [IO.Path]::GetFullPath($VocabularyRoot) }
[IO.File]::WriteAllText((Join-Path $Root 'installation.json'), ($configuration | ConvertTo-Json), [Text.UTF8Encoding]::new($false))

$run = Join-Path $runtime 'start.vbs'
$binary = $CursorExe.Replace('"', '""')
$rootLiteral = $Root.Replace('"', '""')
$wrapper = @"
Option Explicit
Dim shell, script, mode, executable, root
Set shell = CreateObject("WScript.Shell")
executable = "$binary"
root = "$rootLiteral"
script = root & Chr(92) & "runtime" & Chr(92) & "launcher.cjs"
mode = "--glass"
If WScript.Arguments.Count > 0 Then mode = WScript.Arguments(0)
If mode <> "--glass" And mode <> "--classic" And mode <> "--resident" Then WScript.Quit 2
shell.Environment("Process")("ELECTRON_RUN_AS_NODE") = "1"
shell.Run Chr(34) & executable & Chr(34) & " " & Chr(34) & script & Chr(34) & " " & mode & " " & Chr(34) & root & Chr(34), 0, False
"@
[IO.File]::WriteAllText($run, $wrapper, [Text.Encoding]::Unicode)

$wscript = Join-Path $env:WINDIR 'System32/wscript.exe'
if (-not $NoShortcuts) {
    $shell = New-Object -ComObject WScript.Shell
    $menu = $shell.CreateShortcut((Join-Path ([Environment]::GetFolderPath('Programs')) 'Cursor - Grok Guarder.lnk'))
    $menu.TargetPath = $wscript
    $menu.Arguments = '"' + $run + '" --glass'
    $menu.WorkingDirectory = $runtime
    $menu.IconLocation = $CursorExe + ',0'
    $menu.Description = 'Open the Cursor Agents Window with Grok Guarder'
    $menu.Save()
    $startup = $shell.CreateShortcut((Join-Path ([Environment]::GetFolderPath('Startup')) 'Grok Guarder.lnk'))
    $startup.TargetPath = $wscript
    $startup.Arguments = '"' + $run + '" --resident'
    $startup.WorkingDirectory = $runtime
    $startup.Save()
}
Start-Process -FilePath $wscript -ArgumentList ('"' + $run + '" --resident') -WindowStyle Hidden
Write-Output $run
