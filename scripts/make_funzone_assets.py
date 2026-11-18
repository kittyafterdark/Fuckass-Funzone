"""Build decorative PNG assets from the shipped hand-isolated mascot PNGs.
Uses locally installed system fonts for lettering; fonts are never bundled.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import math
ROOT=Path(__file__).resolve().parents[1]
ASSETS=ROOT/'assets'; DST=ASSETS/'funzone'; DST.mkdir(exist_ok=True)
SPR=ASSETS/'sprites'
FONTS=[Path('/usr/share/fonts/truetype/dejavu/DejaVuSansCondensed-Bold.ttf'),Path('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf')]
def font(px):
 for p in FONTS:
  if p.exists():return ImageFont.truetype(str(p),px)
 return ImageFont.load_default()
def poly_star(draw,x,y,r,fill,points=5):
 vertices=[]
 for i in range(points*2):
  a=-math.pi/2 + i*math.pi/points
  rr=r if i%2==0 else r*.46
  vertices.append((x+math.cos(a)*rr,y+math.sin(a)*rr))
 draw.polygon(vertices,fill=fill)
def text_gradient(base,pos,txt,f,top,bottom,stroke=6):
 d=ImageDraw.Draw(base)
 box=d.textbbox((0,0),txt,font=f,stroke_width=stroke)
 w=box[2]-box[0]+24;h=box[3]-box[1]+24
 mask=Image.new('L',(w,h));md=ImageDraw.Draw(mask)
 md.text((12-box[0],12-box[1]),txt,font=f,fill=255,stroke_width=stroke,stroke_fill=255)
 grad=Image.new('RGBA',(w,h));pixels=grad.load()
 for y in range(h):
  t=y/max(1,h-1)
  c=tuple(int(top[i]*(1-t)+bottom[i]*t) for i in range(3))
  for x in range(w):pixels[x,y]=(*c,255)
 # near-black text outline underneath, then pink stroke and gradient body
 outline=Image.new('RGBA',(w,h));od=ImageDraw.Draw(outline)
 od.text((12-box[0],12-box[1]),txt,font=f,fill=(0,0,0,0),stroke_width=stroke+7,stroke_fill=(27,9,44,255))
 base.alpha_composite(outline,pos)
 border=Image.new('RGBA',(w,h));bd=ImageDraw.Draw(border)
 bd.text((12-box[0],12-box[1]),txt,font=f,fill=(0,0,0,0),stroke_width=stroke+2,stroke_fill=(255,96,170,255))
 base.alpha_composite(border,pos)
 base.alpha_composite(Image.composite(grad,Image.new('RGBA',(w,h)),mask),pos)
 return w

def thumb(src,size):
 im=Image.open(SPR/src).convert('RGBA');im.thumbnail(size,Image.Resampling.LANCZOS);return im
w,h=1000,262
base=Image.new('RGBA',(w,h));d=ImageDraw.Draw(base)
d.rounded_rectangle((17,26,w-18,h-20),radius=42,fill=(30,12,50,242),outline=(255,112,185,255),width=10)
d.rounded_rectangle((31,39,w-32,h-34),radius=31,outline=(139,76,165,230),width=4)
for i in range(18):
 x=56+i*49
 d.rounded_rectangle((x,226,x+22,232),radius=2,fill=(104,55,133,180))
for i,(x,y) in enumerate(((120,32),(265,24),(730,20),(875,36),(205,206),(829,221))):
 poly_star(d,x,y,11+(i%3)*4,fill=(255,207,95,255))
# mascots do not get drawn over text
bird=thumb('bird_flap_0.png',(160,150));base.alpha_composite(bird,(48,64))
gabi=thumb('gabi_fly_4.png',(170,178));base.alpha_composite(gabi,(815,54))
heading=font(99)
text_gradient(base,(197,39),'FUCKASS',heading,(255,251,251),(255,84,160),5)
text_gradient(base,(251,124),'FUNZONE',heading,(255,246,139),(255,154,50),5)
d=ImageDraw.Draw(base)
d.rounded_rectangle((349,219,686,246),radius=12,fill=(46,14,69,252),outline=(255,151,210,245),width=3)
small=font(17)
label='ARCADE INTERMISSION'
d.text((517,232),label,font=small,fill=(255,235,252,255),anchor='mm',stroke_width=0)
base.save(DST/'funzone-logo.png',optimize=True)
# The largest UI placement is the 265px-wide drawer banner.
base.resize((530,139),Image.Resampling.LANCZOS).save(DST/'funzone-logo-runtime.png',optimize=True)
# Snake character/food art is maintained in make_snake_assets.py below.
# Compact square tile icon for the 2048 selector; functional numbers remain readable text.
tile=Image.new('RGBA',(128,128));td=ImageDraw.Draw(tile)
td.rounded_rectangle((8,9,120,120),radius=27,fill=(43,19,66),outline=(255,133,202),width=5)
td.rounded_rectangle((16,16,111,109),radius=20,fill=(253,179,103),outline=(255,240,175),width=4)
td.text((64,63),'2048',font=font(28),fill=(73,23,68),anchor='mm')
tile.save(DST/'merge-tile.png',optimize=True)
# Make an app icon using known PNG artwork, no glyph icons.
icon=Image.new('RGBA',(256,256));di=ImageDraw.Draw(icon)
di.rounded_rectangle((7,7,249,249),radius=64,fill=(36,16,52),outline=(255,105,180),width=11)
bi=thumb('bird_flap_0.png',(125,101));ga=thumb('gabi_fly_4.png',(147,153))
icon.alpha_composite(bi,(10,114));icon.alpha_composite(ga,(109,50))
icon.save(DST/'funzone-icon.png',optimize=True)
# Keep original build command reproducible for every Snake PNG.
import runpy
runpy.run_path(str(ROOT/'scripts'/'make_snake_assets.py'),run_name='__main__')
print('Wrote',*[p.name for p in DST.glob('*.png')],sep=' ')
