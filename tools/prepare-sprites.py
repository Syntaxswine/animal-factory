"""Extract approved artwork locally; retain original RGB color pixels.

Run with rembg[cpu], Pillow and numpy available. Model weights stay local.
"""
from pathlib import Path
import sys, os, json
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / '.sprite-tools'))
os.environ['U2NET_HOME'] = str(ROOT / '.sprite-models')
os.environ['NUMBA_CACHE_DIR'] = str(ROOT / '.sprite-cache')
from PIL import Image, ImageDraw
import numpy as np

GROUPS = {'workers-heavy':['horse','donkey'], 'workers-barn':['cow','sheep'],
          'workers-small':['goat','hen'], 'pigs':['pig-foreman','pig-director']}
POSES = ['idle','walk-a','walk-b','work']

def characters():
    from rembg import remove, new_session
    target = ROOT / 'dist/assets/characters'
    target.mkdir(parents=True, exist_ok=True)
    cache = ROOT / '.sprite-cache'
    cache.mkdir(exist_ok=True)
    session = new_session('isnet-general-use', providers=['CPUExecutionProvider'])
    manifest = {'frameWidth':192, 'frameHeight':256, 'anchor':[96,244], 'poses':POSES, 'characters':{}}
    contact = Image.new('RGB', (4*220, 8*292), '#697659')
    draw = ImageDraw.Draw(contact)
    n=0
    for sheet, names in GROUPS.items():
        image=Image.open(ROOT / 'art/source' / (sheet+'.png')).convert('RGB')
        cw,ch=image.width//4,image.height//2
        for row,name in enumerate(names):
            cuts=[]
            for col,pose in enumerate(POSES):
                raw=image.crop((col*cw,row*ch,(col+1)*cw,(row+1)*ch))
                cached=cache/(name+'-'+pose+'.png')
                if cached.exists(): cut=Image.open(cached).convert('RGBA')
                else:
                    cut=remove(raw,session=session)
                    cut.save(cached)
                # Remove only negligible mask haze, retaining anti-aliased edges.
                a=np.array(cut.getchannel('A'));a[a<12]=0;a[a>244]=255
                cut.putalpha(Image.fromarray(a))
                bbox=cut.getbbox()
                if not bbox: raise RuntimeError(f'Empty sprite: {name} {pose}')
                cuts.append(cut.crop(bbox))
            scale=min(174/max(c.width for c in cuts),236/max(c.height for c in cuts))
            strip=Image.new('RGBA',(192*4,256))
            files=[]
            for col,(pose,cut) in enumerate(zip(POSES,cuts)):
                cut=cut.resize((round(cut.width*scale),round(cut.height*scale)),Image.Resampling.LANCZOS)
                frame=Image.new('RGBA',(192,256))
                frame.alpha_composite(cut,((192-cut.width)//2,244-cut.height))
                filename=f'{name}-{pose}.png';frame.save(target/filename,optimize=True);files.append(filename)
                strip.alpha_composite(frame,(col*192,0))
                contact.paste(frame,(col*220+14,n*292+18),frame)
                draw.text((col*220+14,n*292+272),f'{name} / {pose}',fill='#ffefc1')
            strip.save(target/(name+'.png'),optimize=True)
            manifest['characters'][name]={'sheet':name+'.png','frames':files}
            print(f'Prepared {name}: 4 transparent frames',flush=True)
            n+=1
    (target/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
    contact.save(ROOT/'art/character-review.jpg',quality=92)

def machines():
    groups={'machines-bread':['field','mill','bakery','house'],
            'machines-alcohol':['orchard','press','fermenter','bottler'],
            'machines-cakes':['feedmill','dairy','sugarworks','confectionery']}
    target=ROOT/'dist/assets/machines';target.mkdir(parents=True,exist_ok=True)
    review=Image.new('RGB',(4*340,3*370),'#697659');draw=ImageDraw.Draw(review)
    for row,(sheet,names) in enumerate(groups.items()):
        source=Image.open(ROOT/'art/source'/f'{sheet}.png').convert('RGB')
        cw,ch=source.width//2,source.height//2
        for i,name in enumerate(names):
            crop=source.crop(((i%2)*cw,(i//2)*ch,(i%2+1)*cw,(i//2+1)*ch))
            rgb=np.array(crop).astype(float)
            magenta=np.minimum(rgb[:,:,0],rgb[:,:,2])-rgb[:,:,1]
            alpha=(255*(1-np.clip((magenta-20)/90,0,1))).astype(np.uint8)
            alpha[alpha<12]=0;alpha[alpha>244]=255
            image=crop.convert('RGBA');image.putalpha(Image.fromarray(alpha))
            image=image.crop(image.getbbox())
            image.thumbnail((304,304),Image.Resampling.LANCZOS)
            frame=Image.new('RGBA',(320,320));frame.alpha_composite(image,((320-image.width)//2,312-image.height))
            frame.save(target/f'{name}.png',optimize=True)
            review.paste(frame,(i*340+10,row*370+8),frame);draw.text((i*340+12,row*370+342),name,fill='#ffefc1')
            print(f'Prepared machine {name}',flush=True)
    review.save(ROOT/'art/machine-review.jpg',quality=94)

if __name__=='__main__':
    if len(sys.argv)>1 and sys.argv[1]=='machines': machines()
    else: characters()
