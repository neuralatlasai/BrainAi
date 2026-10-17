from pathlib import Path
from PIL import Image
import random
import sys

root = Path(__file__).resolve().parents[1]
source = Image.open(root / 'assets' / '28a9ff7c-047d-4be8-b908-d6fcd7c1cdda.png').convert('RGB')
w,h = source.size
# Approved reference compositions only; these are the non-GPU experience.
cuts = {'form':(0.06,0.391), 'space':(.397,.632), 'surface':(.637,.849), 'stillness':(.852,1)}
out = root/'public'/'images'
out.mkdir(parents=True,exist_ok=True)
for name,(a,b) in cuts.items():
    if '--from-review' in sys.argv:
        for profile in ['desktop', 'mobile']:
            im = Image.open(root/'docs'/'review'/f'{profile}-{name}-poster.png').convert('RGB')
            im.save(out/f'{"mobile-" if profile == "mobile" else ""}{name}.webp', quality=88, method=6)
    else:
        im = source.crop((0,int(h*a),w,int(h*b)))
        im.save(out/f'{name}.webp', quality=88, method=6)
random.seed(42)
grain = Image.new('RGB',(128,128))
grain.putdata([(n,n,n) for n in [random.randint(200,255) for _ in range(128*128)]])
grain.save(out/'grain.webp', quality=65)
print('Prepared four reference posters and grain texture.')
