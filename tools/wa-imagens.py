"""Gera as fotos em JPG que o robô do WhatsApp envia (o WhatsApp não aceita .webp em mensagens de imagem).
Uso: python3 tools/wa-imagens.py   → cria public/catalogo/img/wa/<id>.jpg para cada produto do produtos.json.
Rode de novo sempre que trocar a foto de um produto."""
import json, os
from PIL import Image
RAIZ = os.path.join(os.path.dirname(__file__), '..', 'public', 'catalogo')
dados = json.load(open(os.path.join(RAIZ, 'produtos.json'), encoding='utf-8'))
os.makedirs(os.path.join(RAIZ, 'img', 'wa'), exist_ok=True)
for p in dados['produtos']:
    src = (p.get('cores') or [{}])[0].get('img') or (p.get('imgs') or [None])[0]
    if not src:
        print('sem foto:', p['id']); continue
    im = Image.open(os.path.join(RAIZ, src)).convert('RGBA')
    im.thumbnail((1000, 1000))
    lado = max(im.size) + 80
    fundo = Image.new('RGB', (lado, lado), (255, 255, 255))
    fundo.paste(im, ((lado - im.width) // 2, (lado - im.height) // 2), im)
    fundo.save(os.path.join(RAIZ, 'img', 'wa', p['id'] + '.jpg'), quality=86, optimize=True)
print('ok', len(dados['produtos']))
