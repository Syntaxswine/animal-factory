param([string]$Outfit='normal',[string]$Species='horse')
$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Drawing
$root=Split-Path $PSScriptRoot -Parent
$weapons=@('shotgun','smg','sniper','hmg','grenade-launcher','rpg','grenade')
$stances=@('standing','kneeling','prone')
$canvas=[System.Drawing.Bitmap]::new(1400,640)
$g=[System.Drawing.Graphics]::FromImage($canvas)
$font=[System.Drawing.Font]::new('Arial',12)
try {
 $g.Clear([System.Drawing.Color]::FromArgb(51,62,55))
 $g.DrawString(($Species+' / '+$Outfit),$font,[System.Drawing.Brushes]::White,12,8)
 for($col=0;$col -lt 7;$col++){
  $g.DrawString($weapons[$col],$font,[System.Drawing.Brushes]::White,($col*200+8),36)
  for($row=0;$row -lt 3;$row++){
   $path=Join-Path $root ('dist/assets/characters/weapon-expansion/'+$Outfit+'/'+$Species+'-'+$weapons[$col]+'-'+$stances[$row]+'.png')
   $g.DrawString($stances[$row],$font,[System.Drawing.Brushes]::LightGray,($col*200+8),($row*190+68))
   if(!(Test-Path -LiteralPath $path)){continue}
   $img=[System.Drawing.Bitmap]::new($path)
   try {
    $scale=[Math]::Min(192/$img.Width,160/$img.Height)
    $g.DrawImage($img,[System.Drawing.RectangleF]::new(($col*200+(200-$img.Width*$scale)/2),($row*190+92),($img.Width*$scale),($img.Height*$scale)))
   } finally {$img.Dispose()}
  }
 }
 $output=Join-Path $root ('art/weapon-expansion-'+$Outfit+'-'+$Species+'-review.png')
 $canvas.Save($output,[System.Drawing.Imaging.ImageFormat]::Png)
 Write-Output $output
} finally {$font.Dispose();$g.Dispose();$canvas.Dispose()}
