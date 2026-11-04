# Alemão Afiação · link na bio e site

- `public/links/` → link na bio (alemaoafiacao.com.br/links)
- `public/catalogo/` → catálogo online (alemaoafiacao.com.br/catalogo)
  - `produtos.json` → base de produtos (preços, medidas, fotos). Editar aqui e regerar o PDF.
  - `catalogo-alemao-afiacao.pdf` → gerado por `node tools/gerar-pdf.js`
- `deploy/` → configuração do servidor (nginx + docker compose da Hostinger)

Publicação: o servidor puxa este repositório a cada 2 minutos. Tudo que entrar na branch `main` vai para o ar.

Feito por BH Comunicação.
