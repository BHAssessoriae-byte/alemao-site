// Nó "Liga o cliente" do fluxo "WhatsApp · Conectar cliente (Embedded Signup)".
// Entrada: resposta da troca do código (nó "Troca o código", com o token de negócio do cliente).
// Faz, servidor a servidor: assina o app na conta do cliente, sincroniza contatos e histórico (coexistência)
// ou registra o número (número novo), lê o número e guarda tudo nos dados do fluxo.
// O token NUNCA sai daqui: não vai na resposta para a página nem no aviso.
const G = 'https://graph.facebook.com/v25.0';
const d = $('Valida').first().json;
const tok = $json.access_token;
if (!tok) {
  return [{ json: { ok: false, etapa: 'troca do código', erro: ($json.error && $json.error.message) || 'sem token', ...d.publico } }];
}
const chama = async (method, url, body) => {
  try {
    const r = await this.helpers.httpRequest({ method, url, headers: { Authorization: 'Bearer ' + tok }, body, json: true, timeout: 15000 });
    return { ok: true, r };
  } catch (e) {
    const b = e.response && e.response.body;
    return { ok: false, erro: (b && b.error && b.error.message) || e.message };
  }
};

let waba = d.waba_id;
let phone = d.phone_number_id;
const passos = {};

// Se a página não recebeu os ids, descobre pelo token (o token só enxerga a conta autorizada)
if (!waba) {
  const dbg = await chama('GET', `${G}/debug_token?input_token=${tok}`);
  const g = dbg.ok && (dbg.r.data.granular_scopes || []).find((s) => s.scope === 'whatsapp_business_management');
  waba = g && g.target_ids && g.target_ids[0];
}
if (waba && !phone) {
  const pn = await chama('GET', `${G}/${waba}/phone_numbers?fields=id,display_phone_number,verified_name`);
  phone = pn.ok && pn.r.data && pn.r.data[0] && pn.r.data[0].id;
}

passos.assinatura = waba ? await chama('POST', `${G}/${waba}/subscribed_apps`) : { ok: false, erro: 'sem waba_id' };

let pin = null;
if (d.coex && phone) {
  // Coexistência: NÃO registrar o número. Sincronizar em até 24 h (cada um só pode ser pedido 1 vez).
  passos.contatos = await chama('POST', `${G}/${phone}/smb_app_data`, { messaging_product: 'whatsapp', sync_type: 'smb_app_state_sync' });
  passos.historico = await chama('POST', `${G}/${phone}/smb_app_data`, { messaging_product: 'whatsapp', sync_type: 'history' });
} else if (phone) {
  pin = String(Math.floor(100000 + Math.random() * 900000));
  passos.registro = await chama('POST', `${G}/${phone}/register`, { messaging_product: 'whatsapp', pin });
}

const info = phone ? await chama('GET', `${G}/${phone}?fields=display_phone_number,verified_name,quality_rating`) : { ok: false };
const numero = info.ok ? info.r.display_phone_number : null;
const nome = info.ok ? info.r.verified_name : null;

// Guarda no servidor (dados estáticos deste fluxo, no banco do n8n). Não aparece na resposta nem no aviso.
const est = $getWorkflowStaticData('global');
est.clientes = est.clientes || {};
est.clientes[phone || waba || ('sem-id-' + Date.now())] = {
  conectado_em: new Date().toISOString(), waba_id: waba, phone_number_id: phone, business_id: d.business_id,
  numero, nome, coexistencia: d.coex, evento: d.evento, token: tok, pin,
  passos: Object.fromEntries(Object.entries(passos).map(([k, v]) => [k, v.ok ? 'ok' : 'ERRO: ' + v.erro])),
};

const ok = !!(waba && phone && passos.assinatura.ok);
return [{ json: {
  ok, numero, nome, coexistencia: d.coex, waba_id: waba, phone_number_id: phone,
  passos: Object.fromEntries(Object.entries(passos).map(([k, v]) => [k, v.ok ? 'ok' : 'ERRO: ' + v.erro])),
} }];
