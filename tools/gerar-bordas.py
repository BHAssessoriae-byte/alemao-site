#!/usr/bin/env python3
"""Gera versões das fotos do catálogo com contorno branco (para fundo escuro).
Lê public/catalogo/img/*.webp e grava em public/catalogo/img/borda/ (mesmo nome).
Usado só no catálogo (página /catalogo/ e PDF). O site principal usa as fotos sem borda.
Só regenera quando a foto original é mais nova que a versão com borda."""
from pathlib import Path
from PIL import Image, ImageFilter

RAIZ = Path(__file__).resolve().parent.parent
ORIG = RAIZ / "public/catalogo/img"
DEST = ORIG / "borda"
DEST.mkdir(exist_ok=True)

def contorno(im: Image.Image) -> Image.Image:
    im = im.convert("RGBA")
    w, h = im.size
    esp = max(4, round(max(w, h) * 0.011))          # espessura ~1,1% do maior lado
    pad = esp + 2
    base = Image.new("RGBA", (w + 2 * pad, h + 2 * pad), (0, 0, 0, 0))
    base.paste(im, (pad, pad))
    a = base.getchannel("A").point(lambda v: 255 if v > 90 else 0)
    # dilatação em passos para contorno arredondado
    restante = esp
    while restante > 0:
        k = min(restante, 4)
        a = a.filter(ImageFilter.MaxFilter(2 * k + 1))
        restante -= k
    a = a.filter(ImageFilter.GaussianBlur(0.8))
    branco = Image.new("RGBA", base.size, (255, 255, 255, 0))
    branco.putalpha(a)
    return Image.alpha_composite(branco, base)

n = 0
for f in sorted(ORIG.glob("*.webp")):
    d = DEST / f.name
    if d.exists() and d.stat().st_mtime >= f.stat().st_mtime:
        continue
    contorno(Image.open(f)).save(d, "WEBP", quality=88, method=6)
    n += 1
# remove versões com borda de fotos que não existem mais
for d in DEST.glob("*.webp"):
    if not (ORIG / d.name).exists():
        d.unlink()
print(f"bordas: {n} foto(s) gerada(s) em {DEST.relative_to(RAIZ)}")
