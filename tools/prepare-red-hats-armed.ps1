param([string]$SourceList='art/red-hats-armed-sources.json')
$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Drawing
Add-Type -TypeDefinition @'
using System;
using System.Drawing;
public static class StanceBounds {
 public static int[] Find(Bitmap b) {
  int x0=b.Width,y0=b.Height,x1=0,y1=0;
  for(int y=0;y<b.Height;y++)for(int x=0;x<b.Width;x++)if(b.GetPixel(x,y).A>20){x0=Math.Min(x0,x);x1=Math.Max(x1,x);y0=Math.Min(y0,y);y1=Math.Max(y1,y);}
  int foot0=b.Width,foot1=0;
  for(int y=y1-(y1-y0)/8;y<=y1;y++)for(int x=x0;x<=x1;x++)if(b.GetPixel(x,y).A>20){foot0=Math.Min(foot0,x);foot1=Math.Max(foot1,x);}
  return new int[]{x0,y0,x1,y1,(foot0+foot1)/2};
 }
}
'@ -ReferencedAssemblies System.Drawing.Common,System.Drawing.Primitives
$root=Split-Path $PSScriptRoot -Parent
$out=Join-Path $root 'dist/assets/characters/red-hats'
$sourceDir=Join-Path $root 'art/source/red-hats-armed'
New-Item -ItemType Directory -Force $out,$sourceDir | Out-Null
$entries=Get-Content -Raw (Join-Path $root $SourceList) | ConvertFrom-Json
foreach($entry in $entries){
 $name=$entry.species+'-'+$entry.weapon+'-'+$entry.stance+'.png'
 $source=Join-Path $sourceDir $name
 if(!(Test-Path -LiteralPath $source)){Copy-Item -LiteralPath $entry.path -Destination $source}
 $img=[System.Drawing.Bitmap]::new($source)
 $b=[StanceBounds]::Find($img)
 $targetHeight=if($entry.stance -eq 'standing'){236}elseif($entry.stance -eq 'kneeling'){176}else{96}
 $scale=$targetHeight/($b[3]-$b[1]+1)
 $left=192-($b[2]-$b[0]+1)*$scale/2
 $w=($b[2]-$b[0]+1)*$scale
 if($left -lt 2 -or ($left+$w) -gt 382){throw "Weapon exceeds frame: $name"}
 $dest=[System.Drawing.Bitmap]::new(384,256,[System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
 $g=[System.Drawing.Graphics]::FromImage($dest)
 $g.InterpolationMode=[System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
 $g.DrawImage($img,[System.Drawing.RectangleF]::new($left,244-$targetHeight,$w,$targetHeight),[System.Drawing.RectangleF]::new($b[0],$b[1],$b[2]-$b[0]+1,$b[3]-$b[1]+1),[System.Drawing.GraphicsUnit]::Pixel)
 $dest.Save((Join-Path $out $name),[System.Drawing.Imaging.ImageFormat]::Png)
 $g.Dispose();$dest.Dispose();$img.Dispose()
 Write-Output $name
}
