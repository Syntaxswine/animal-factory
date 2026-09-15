$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Drawing
$cutRoot=Split-Path $PSScriptRoot -Parent
$cutSource=Join-Path $cutRoot 'dist/assets/environment/fence-chainlink.png'
$cutOutput=Join-Path $cutRoot 'dist/assets/environment/fence-chainlink-cut.png'
$cutBitmap=[System.Drawing.Bitmap]::new($cutSource)
# Source-coordinate cutout. Keep the original frame and bottom rail intact.
# Slightly irregular sides leave clipped ends in the original mesh.
$cutPoints=@(
 @(450,560),@(800,356),@(797,408),@(803,457),@(798,510),
 @(802,560),@(798,610),@(803,662),@(799,715),@(800,755),
 @(450,958),@(453,910),@(447,860),@(452,811),@(448,760),
 @(452,710),@(447,660),@(452,610)
)
$cutPath=[System.Drawing.Drawing2D.GraphicsPath]::new()
$cutPath.AddPolygon([System.Drawing.PointF[]]@($cutPoints | ForEach-Object { [System.Drawing.PointF]::new($_[0],$_[1]) }))
$cutCount=0
for($cutY=356;$cutY -le 958;$cutY++){
 for($cutX=447;$cutX -le 803;$cutX++){
  if($cutPath.IsVisible([single]$cutX,[single]$cutY)){
   $cutPixel=$cutBitmap.GetPixel($cutX,$cutY)
   if($cutPixel.A -gt 0){$cutBitmap.SetPixel($cutX,$cutY,[System.Drawing.Color]::FromArgb(0,0,0,0));$cutCount++}
  }
 }
}
$cutBitmap.Save($cutOutput,[System.Drawing.Imaging.ImageFormat]::Png)
$cutBitmap.Dispose();$cutPath.Dispose()
Write-Output "Cut $cutCount mesh pixels; original frame and canvas retained."
