# Draws a FICTIONAL equipment label to samples/fictional-label.png.
# Every value on it is made up: no real brand, serial number or asset tag.
Add-Type -AssemblyName System.Drawing

$outDir = Join-Path $PSScriptRoot '..\samples'
New-Item -ItemType Directory -Force -Path $outDir | Out-Null
$outFile = [System.IO.Path]::GetFullPath((Join-Path $outDir 'fictional-label.png'))

$bitmap = New-Object System.Drawing.Bitmap 900, 520
$g = [System.Drawing.Graphics]::FromImage($bitmap)
$g.SmoothingMode = 'AntiAlias'
$g.TextRenderingHint = 'AntiAliasGridFit'
$g.Clear([System.Drawing.Color]::White)

$black = [System.Drawing.Brushes]::Black
$pen = New-Object System.Drawing.Pen ([System.Drawing.Color]::Black), 4
$g.DrawRectangle($pen, 12, 12, 876, 496)

$title = New-Object System.Drawing.Font 'Arial', 40, ([System.Drawing.FontStyle]::Bold)
$body = New-Object System.Drawing.Font 'Consolas', 30, ([System.Drawing.FontStyle]::Bold)
$small = New-Object System.Drawing.Font 'Arial', 22

$g.DrawString('EXEMPLE TECH', $title, $black, 40, 30)
$g.DrawString('Model: DEMO-PORTABLE 14', $body, $black, 40, 130)
$g.DrawString('S/N: SN-TEST-0000-DEMO', $body, $black, 40, 215)
$g.DrawString('Asset tag: TEST-0001', $body, $black, 40, 300)
$g.DrawString('SPECIMEN - FICTIONAL LABEL, NOT A REAL ASSET', $small, $black, 40, 430)

$bitmap.Save($outFile, [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose()
$bitmap.Dispose()
Write-Output "Wrote $outFile"
