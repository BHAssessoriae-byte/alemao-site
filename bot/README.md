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

## 03 · Conectar cliente (Embedded Signup) — 24/11/2026
- Página: https://www.bhcomunicacao.com.br/conectar/ (repositório bh-link-in-bio). Botão desligado até preencher `CONFIG_ID` no script da página.
- Fluxo n8n `03-conectar-cliente.json`: POST /webhook/conectar → Valida → Troca o código (GET /oauth/access_token, credencial "Meta · chave secreta do app" do tipo Query Auth, nome `client_secret`) → Liga o cliente (`conectar.js`) → Responde à página → Avisa o Bruno.
- Liga o cliente: assina o app na conta do cliente (subscribed_apps); coexistência → sincroniza contatos e histórico (smb_app_data, só 1 vez, em até 24 h) e NÃO registra o número; número novo → registra com PIN aleatório.
- O token do cliente fica só nos dados estáticos do fluxo, no servidor. Não vai para a página nem para o aviso.
- Embedded Signup v4 (v2/v3 desligados pela Meta em 15/10/2026): extras `{ setup: {}, featureType: 'whatsapp_business_app_onboarding', sessionInfoVersion: '3' }`.
