# User-requested non-generative crops: retain the painted door/frame pixels.
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$root = Split-Path $PSScriptRoot -Parent
$definitions = @(
 @{id='door-steel-closed';points=@(506,416,815,267,820,910,509,1040);baseline=@(510,1035,815,906,623)},
 @{id='door-wood-closed';points=@(530,446,802,312,807,956,533,1080);baseline=@(534,1074,804,950,631)},
 @{id='doorway-concrete-open';points=@(494,477,797,341,799,910,765,913,720,895,721,416,542,515,543,1010,519,1026,495,1017);baseline=@(510,1021,781,909,556)}
)
$calibration = @{}
foreach($definition in $definitions) {
 $source = [System.Drawing.Bitmap]::new((Join-Path $root ('dist/assets/environment/'+$definition.id+'.png')))
 $masked = [System.Drawing.Bitmap]::new(1254,1254,[System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
 $g = [System.Drawing.Graphics]::FromImage($masked)
 $path = [System.Drawing.Drawing2D.GraphicsPath]::new()
 $points = for($i=0;$i -lt $definition.points.Count;$i+=2){[System.Drawing.PointF]::new($definition.points[$i],$definition.points[$i+1])}
 $path.AddPolygon([System.Drawing.PointF[]]$points)
 $g.SetClip($path)
 $g.DrawImageUnscaled($source,0,0)
 $g.Dispose()
 $bounds=$path.GetBounds()
 $scale=1120/[Math]::Max($bounds.Width,$bounds.Height)
 $width=$bounds.Width*$scale;$height=$bounds.Height*$scale
 $left=(1254-$width)/2;$top=(1254-$height)/2
 $output=[System.Drawing.Bitmap]::new(1254,1254,[System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
 $g=[System.Drawing.Graphics]::FromImage($output)
 $g.InterpolationMode=[System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
 $dest=[System.Drawing.RectangleF]::new($left,$top,$width,$height)
 $g.DrawImage($masked,$dest,$bounds,[System.Drawing.GraphicsUnit]::Pixel)
 $output.Save((Join-Path $root ('dist/assets/environment/'+$definition.id+'-v2.png')),[System.Drawing.Imaging.ImageFormat]::Png)
 $b=$definition.baseline
 $calibration[$definition.id]=@{file=$definition.id+'-v2.png';crop=@($left,$top,($left+$width),($top+$height));baseline=@(($left+($b[0]-$bounds.X)*$scale),($top+($b[1]-$bounds.Y)*$scale),($left+($b[2]-$bounds.X)*$scale),($top+($b[3]-$bounds.Y)*$scale),($b[4]*$scale));height=72}
 $g.Dispose();$output.Dispose();$masked.Dispose();$source.Dispose();$path.Dispose()
}
$json=$calibration|ConvertTo-Json -Depth 6
[System.IO.File]::WriteAllText((Join-Path $root 'dist/tactics/door-art.js'),('export const DOOR_ART = '+$json+';'+[Environment]::NewLine))
