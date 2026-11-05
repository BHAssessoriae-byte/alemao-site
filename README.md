# Alemão Afiação · site, link na bio, catálogo e vídeos

## Como atualizar (tudo de uma vez)

Os dados ficam em **3 arquivos**. Mude só neles:

| O que mudou | Onde mudar |
|---|---|
| WhatsApp, horário, Instagram/Facebook/YouTube, endereço, CNPJ, números (500+, 300+), garantia | `src/config.json` |
| Máquinas, equipamentos, peças, preços, medidas, cores e fotos | `public/catalogo/produtos.json` |
| Vídeos | `public/videos/videos.json` |

Depois rode **um comando só**:

```
node tools/atualizar.js
git add -A && git commit -m "o que mudou" && git push
```

Esse comando regera e confere o site (`/`), o link na bio (`/links/`), o catálogo online e o PDF (`/catalogo/`), os vídeos, a privacidade, os termos e a 404. Ele avisa se algum WhatsApp ficou diferente. O que vai para a `main` entra no ar em ~3 min.

Textos e layout das páginas ficam nos modelos em `src/` (`index.html`, `links.html`, `catalogo.html`, `videos.html`, `404.html`, `legal/`). Nunca edite os `.html` de `public/` direto, porque eles são sobrescritos.

# Alemão Afiação · link na bio e site

- `public/links/` → link na bio (alemaoafiacao.com.br/links)
- `public/catalogo/` → catálogo online (alemaoafiacao.com.br/catalogo)
  - `produtos.json` → base de produtos (preços, medidas, fotos). Editar aqui e regerar o PDF.
  - `catalogo-alemao-afiacao.pdf` → gerado por `node tools/gerar-pdf.js`
- `deploy/` → configuração do servidor (nginx + docker compose da Hostinger)

Publicação: o servidor puxa este repositório a cada 2 minutos. Tudo que entrar na branch `main` vai para o ar.

Feito por BH Comunicação.
