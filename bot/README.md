# Robô de atendimento (n8n) — fluxos

Fluxos do n8n em https://bot.bhcomunicacao.com.br (VPS Hostinger, projeto Docker n8n-8g6o).
Nenhum segredo fica aqui: token de verificação, chave do app e tokens da Meta/Anthropic são preenchidos direto no n8n.

- `01-webhook-meta.json`: recebe o webhook do WhatsApp (app "BH Atendimento"). GET = verificação da Meta; POST = mensagens.

## v2 (18/11/2026) — menu, catálogo, máquinas e vendedor
- `robo.js`: código do nó "Interpreta e responde" (Code node). Teste local: harness no scratchpad (simula webhook).
- `02-nos-novos.json`: nós Code + HTTP ("Envia ao WhatsApp", credencial whatsAppApi) aplicados no workflow 0h5QZqdhQefvZhBO.
- `02-robo-menu.json`: modelo completo sem segredos (trocar TROCAR_PELO_TOKEN e o id da credencial).
- Fotos para o WhatsApp (JPG, o WhatsApp não aceita webp): `python3 tools/wa-imagens.py` → `public/catalogo/img/wa/<id>.jpg`. Rodar de novo ao trocar foto de produto.
- Preços e nomes vêm em tempo real de `/catalogo/produtos.json` do site.
- Pausa do robô por cliente: 12 h após passar ao vendedor; o cliente volta com "menu".
