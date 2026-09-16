param([ValidateSet('normal','red-hats')][string]$Outfit='normal')
$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Drawing
$root=Split-Path $PSScriptRoot -Parent
$species=@('horse','goat','donkey','sheep','cow','hen','pig-foreman','pig-director','skunk')
if($Outfit -eq 'red-hats'){$species=@('horse','goat','donkey','sheep','cow','hen','skunk')}
$stances=@('standing','kneeling','prone')
for($page=0;$page -lt [Math]::Ceiling($species.Count/3);$page++){
 $canvas=[System.Drawing.Bitmap]::new(1152,840)
 $g=[System.Drawing.Graphics]::FromImage($canvas)
 $font=[System.Drawing.Font]::new('Arial',13)
 try {
  $g.Clear([System.Drawing.Color]::FromArgb(51,62,55))
  for($col=0;$col -lt 3;$col++){for($row=0;$row -lt 3;$row++){
   if($page*3+$col -ge $species.Count){continue}
   $animal=$species[$page*3+$col]
   $stance=$stances[$row]
   $g.DrawString(($animal+' / '+$stance),$font,[System.Drawing.Brushes]::White,($col*384+12),($row*280+8))
   $img=[System.Drawing.Bitmap]::new((Join-Path $root ('dist/assets/characters/weapon-expansion/'+$Outfit+'/'+$animal+'-flamethrower-'+$stance+'.png')))
   try {$scale=[Math]::Min(384/$img.Width,1);$g.DrawImage($img,[System.Drawing.RectangleF]::new(($col*384+(384-$img.Width*$scale)/2),($row*280+24),($img.Width*$scale),($img.Height*$scale)))} finally {$img.Dispose()}
  }}
  $prefix=if($Outfit -eq 'red-hats'){'red-hats-'}else{''}
  $path=Join-Path $root ('art/'+$prefix+'flamethrower-review-'+($page+1)+'.png')
  $canvas.Save($path,[System.Drawing.Imaging.ImageFormat]::Png)
  Write-Output $path
 } finally {$font.Dispose();$g.Dispose();$canvas.Dispose()}
}
