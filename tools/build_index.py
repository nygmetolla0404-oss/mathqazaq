# app.html (claude.ai артефакт беті) → index.html (GitHub Pages және server.py үшін толық HTML құжат).
# Іске қосу: python3 tools/build_index.py
import os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HEAD = ('<!doctype html>\n<html lang="kk">\n<head>\n<meta charset="utf-8">\n'
        '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n'
        '<style>:root{padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom)}'
        'body{margin:0;font:14px system-ui}img{max-width:100%}[hidden]{display:none!important}</style>\n')
src = open(os.path.join(ROOT, "app.html"), encoding="utf-8").read()
cut = src.index('<canvas id="gl"')
out = HEAD + src[:cut] + "</head>\n<body>\n" + src[cut:] + "\n</body>\n</html>\n"
open(os.path.join(ROOT, "index.html"), "w", encoding="utf-8").write(out)
print("index.html жасалды")
