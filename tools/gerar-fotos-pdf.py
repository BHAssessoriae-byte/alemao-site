#!/usr/bin/env python3
"""Fotos do PDF sem transparência.
Vários leitores de PDF (prévia do WhatsApp, alguns celulares Android) ignoram a
transparência das imagens e mostram o fundo PRETO. Por isso, para o PDF, cada foto
é "achatada" sobre a cor real do cartão, já com a sombra desenhada, e salva em JPG.
Uso: python3 tools/gerar-fotos-pdf.py <origem.webp> <destino.jpg> <cor_fundo #RRGGBB> <opacidade_sombra>
Ou sem argumentos: gera tudo que o gerar-pdf.js precisa (lista em tools/.pdf-img/lista.txt)."""
import sys
from pathlib import Path
from PIL import Image, ImageFilter

def achatar(orig, dest, cor, sombra):
    im = Image.open(orig).convert("RGBA")
    w, h = im.size
    pad = max(8, round(max(w, h) * 0.06))
    W, H = w + 2 * pad, h + 2 * pad
    r, g, b = int(cor[1:3], 16), int(cor[3:5], 16), int(cor[5:7], 16)
    base = Image.new("RGBA", (W, H), (r, g, b, 255))
    if sombra > 0:
        a = im.getchannel("A").point(lambda v: int(v * sombra))
        sh = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        camada = Image.new("RGBA", (w, h), (0, 0, 0, 255)); camada.putalpha(a)
        dy = round(h * 0.035)
        sh.paste(camada, (pad, pad + dy), camada)
        sh = sh.filter(ImageFilter.GaussianBlur(max(2, round(max(w, h) * 0.022))))
        base = Image.alpha_composite(base, sh)
    base.alpha_composite(im, (pad, pad))
    base.convert("RGB").save(dest, "JPEG", quality=90, optimize=True, progressive=True)

if __name__ == "__main__":
    if len(sys.argv) == 5:
        achatar(sys.argv[1], sys.argv[2], sys.argv[3], float(sys.argv[4]))
    else:
        lista = Path(__file__).resolve().parent / ".pdf-img" / "lista.txt"
        for linha in lista.read_text().splitlines():
            if linha.strip():
                o, d, c, s = linha.split("\t")
                achatar(o, d, c, float(s))
