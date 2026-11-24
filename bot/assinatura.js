// Robô Alemão · nó "Lê o corpo bruto" (Code node, "Run once for all items").
// Pega o corpo exatamente como a Meta enviou (precisa da opção "Raw Body" no Webhook) para conferir
// a assinatura X-Hub-Signature-256 (HMAC-SHA256 com a chave secreta do app) no nó seguinte.
const it = $input.first();
let raw = '';
if (it.binary && it.binary.data) raw = (await this.helpers.getBinaryDataBuffer(0, 'data')).toString('utf8');
const h = it.json.headers || {};
let body = it.json.body;
if ((!body || !Object.keys(body).length) && raw) { try { body = JSON.parse(raw); } catch (e) { body = {}; } }
return [{ json: { body, raw, assinatura: h['x-hub-signature-256'] || '' } }];
