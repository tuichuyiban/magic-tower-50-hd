# 6 档武器特效对照图：python3 contact-sheet.py out.png p0 … p5
import sys
from PIL import Image, ImageDraw, ImageFont
out, paths = sys.argv[1], sys.argv[2:8]
names = ['0 空手', '1 铁剑', '2 银剑', '3 骑士剑', '4 圣剑', '5 神圣剑']
ims = [Image.open(p).convert('RGB') for p in paths]
w, h, pad, lab = 300, 300, 12, 40
sheet = Image.new('RGB', (pad + 3 * (w + pad), pad + 2 * (h + lab + pad)), (36, 28, 84))
d = ImageDraw.Draw(sheet)
font = None
for f in ['/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc', '/usr/share/fonts/truetype/noto/NotoSansCJK-Bold.ttc', '/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc']:
    try:
        font = ImageFont.truetype(f, 26); break
    except Exception:
        pass
for i, im in enumerate(ims):
    x = pad + (i % 3) * (w + pad); y = pad + (i // 3) * (h + lab + pad)
    sheet.paste(im.resize((w, h), Image.NEAREST), (x, y + lab))
    d.text((x + 6, y + 4), names[i], fill=(255, 211, 74), font=font)
sheet.save(out)
