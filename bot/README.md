# Robô de atendimento (n8n) — fluxos

Fluxos do n8n em https://bot.bhcomunicacao.com.br (VPS Hostinger, projeto Docker n8n-8g6o).
Nenhum segredo fica aqui: token de verificação, chave do app e tokens da Meta/Anthropic são preenchidos direto no n8n.

- `01-webhook-meta.json`: recebe o webhook do WhatsApp (app "BH Atendimento"). GET = verificação da Meta; POST = mensagens.
