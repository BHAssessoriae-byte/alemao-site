// Robô de atendimento · Alemão Afiação (BH Comunicação)
// Este arquivo é o código do nó "Interpreta e responde" do n8n (Code node, "Run once for all items").
// Recebe o webhook da Meta e devolve a lista de mensagens a enviar (cada item = 1 chamada à API do WhatsApp).
// Mensagens fixas (menu, horário, catálogo, lista de máquinas) NÃO passam pela IA.
// Preços e nomes vêm do produtos.json do site (base única: "atualizou um, atualiza todos").
// Nunca inventar preço, prazo, frete, garantia ou condição: na dúvida, passa para o vendedor.

const CFG = {
  empresa: 'Alemão Afiação',
  site: 'https://www.alemaoafiacao.com.br',
  produtosUrl: 'https://www.alemaoafiacao.com.br/catalogo/produtos.json',
  catalogoPdf: 'https://www.alemaoafiacao.com.br/catalogo/catalogo-alemao-afiacao.pdf',
  catalogoSite: 'https://www.alemaoafiacao.com.br/catalogo/',
  videos: 'https://www.alemaoafiacao.com.br/videos/',
  fotoWa: (id) => `https://www.alemaoafiacao.com.br/catalogo/img/wa/${id}.jpg`,
  horarioTexto: 'segunda a sexta, das 8h às 20h',
  abre: 8, fecha: 20, dias: [1, 2, 3, 4, 5], // sábado: A CONFIRMAR com o cliente (por enquanto fechado)
  fuso: 'America/Sao_Paulo',
  pausaHoras: 12,       // depois de passar para o vendedor, o robô fica calado por este tempo
  avisoForaHoras: 6,    // aviso de "fora do horário" no máximo 1 vez a cada 6 h por cliente
  graph: 'https://graph.facebook.com/v25.0',
};

// ---------- utilidades ----------
const agoraSP = () => new Date(new Date().toLocaleString('en-US', { timeZone: CFG.fuso }));
function aberto(d = agoraSP()) {
  const h = d.getHours() + d.getMinutes() / 60;
  return CFG.dias.includes(d.getDay()) && h >= CFG.abre && h < CFG.fecha;
}
function proximaAbertura(d = agoraSP()) {
  const nomes = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
  for (let i = 0; i < 8; i++) {
    const x = new Date(d); x.setDate(d.getDate() + i); x.setHours(CFG.abre, 0, 0, 0);
    if (CFG.dias.includes(x.getDay()) && x > d) {
      const quando = i === 0 ? 'hoje' : i === 1 ? 'amanhã' : nomes[x.getDay()];
      return `${quando} às ${CFG.abre}h`;
    }
  }
  return `no próximo dia útil às ${CFG.abre}h`;
}
const norm = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
const real = (v) => 'R$ ' + Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const corta = (s, n) => (s.length <= n ? s : s.slice(0, n - 1) + '…');
const primeiroNome = (n) => (n || '').split(' ')[0];

// ---------- montadores de mensagem ----------
const base = (to) => ({ messaging_product: 'whatsapp', recipient_type: 'individual', to });
const texto = (to, body) => ({ ...base(to), type: 'text', text: { body, preview_url: true } });
const botoes = (to, body, lista, fotoUrl) => ({
  ...base(to), type: 'interactive',
  interactive: { type: 'button', ...(fotoUrl ? { header: { type: 'image', image: { link: fotoUrl } } } : {}), body: { text: body },
    action: { buttons: lista.map(([id, title]) => ({ type: 'reply', reply: { id, title: corta(title, 20) } })) } },
});
const listaMsg = (to, body, botao, secoes, rodape) => ({
  ...base(to), type: 'interactive',
  interactive: { type: 'list', body: { text: body }, ...(rodape ? { footer: { text: rodape } } : {}),
    action: { button: corta(botao, 20), sections: secoes } },
});
const documento = (to, link, filename, caption) => ({ ...base(to), type: 'document', document: { link, filename, caption } });
const imagem = (to, link, caption) => ({ ...base(to), type: 'image', image: { link, caption } });

function menu(to, saudacao) {
  return listaMsg(to,
    (saudacao ? saudacao + '\n\n' : '') + 'Como posso te ajudar? Toque em *Ver opções* 👇',
    'Ver opções',
    [{ title: 'Atendimento', rows: [
      { id: 'menu_maquinas', title: 'Ver máquinas e preços', description: 'Escolha a máquina e veja a foto' },
      { id: 'menu_catalogo', title: 'Catálogo em PDF', description: 'Todas as máquinas, equipamentos e peças' },
      { id: 'menu_videos', title: 'Vídeos tutoriais', description: 'Modelos, testes de afiação e dicas' },
      { id: 'menu_horario', title: 'Horário de atendimento', description: CFG.horarioTexto },
      { id: 'menu_vendedor', title: 'Falar com o vendedor', description: 'Continua aqui mesmo, nesta conversa' },
    ] }],
    CFG.empresa);
}

const CURTO = { alicate: 'Alicate de cutícula', compacta: 'Compacta', tesoura: 'Tesoura e faca', basica: 'Basiquinha' };
function listaMaquinas(to, produtos) {
  const maq = produtos.filter((p) => p.tipo === 'maquina').slice(0, 10);
  return listaMsg(to, 'Estas são as nossas máquinas. Toque em *Escolher* e selecione uma 👇', 'Escolher',
    [{ title: 'Máquinas', rows: maq.map((p) => ({
      id: 'maq_' + p.id,
      title: corta(p.modelo ? `${p.modelo} – ${CURTO[p.cat] || p.cat}` : p.nome, 24),
      description: corta(real(p.preco) + ' · ' + p.nome, 72),
    })) }],
    'Preços conforme o catálogo');
}

// ---------- entrada ----------
const corpo = $input.first().json.body || {};
const est = $getWorkflowStaticData('global');
est.c = est.c || {}; est.vistos = est.vistos || [];
const saida = [];
const envia = (phoneId, payload) => saida.push({ json: { url: `${CFG.graph}/${phoneId}/messages`, payload } });

let produtos = null;
async function carregaProdutos() {
  if (produtos) return produtos;
  const r = await this_.helpers.httpRequest({ url: CFG.produtosUrl, json: true, timeout: 8000 });
  produtos = (typeof r === 'string' ? JSON.parse(r) : r).produtos || [];
  return produtos;
}
const this_ = this;

for (const entry of corpo.entry || []) {
  for (const ch of entry.changes || []) {
    const v = ch.value || {};
    const phoneId = v.metadata && v.metadata.phone_number_id;
    for (const m of v.messages || []) {
      if (!phoneId || !m.from) continue;
      if (est.vistos.includes(m.id)) continue;              // a Meta às vezes reenvia o mesmo aviso
      est.vistos.push(m.id); if (est.vistos.length > 300) est.vistos.splice(0, 100);

      const de = m.from;
      const nome = primeiroNome(((v.contacts || []).find((c) => c.wa_id === de) || {}).profile?.name);
      const c = est.c[de] = est.c[de] || {};
      const agora = Date.now();
      c.ultima = agora;

      // marca como lida (os dois risquinhos azuis)
      envia(phoneId, { messaging_product: 'whatsapp', status: 'read', message_id: m.id });

      // o que o cliente mandou
      let id = '', txt = '';
      if (m.type === 'text') txt = norm(m.text.body);
      else if (m.type === 'interactive') id = (m.interactive.button_reply || m.interactive.list_reply || {}).id || '';
      else if (m.type === 'button') txt = norm(m.button.text);

      // em pausa (vendedor atendendo): só volta se o cliente pedir o menu
      if (c.pausaAte && agora < c.pausaAte) {
        if (txt === 'menu' || txt === 'robo') { delete c.pausaAte; }
        else { saida.pop(); continue; }                     // nem marca como lida: o vendedor vê como nova
      }

      // aviso de fora do horário (no máximo 1 vez a cada 6 h)
      const fechado = !aberto();
      if (fechado && (!c.avisoFora || agora - c.avisoFora > CFG.avisoForaHoras * 3600e3)) {
        c.avisoFora = agora;
        envia(phoneId, texto(de, `🕗 Estamos fora do horário de atendimento (${CFG.horarioTexto}).\n` +
          `Um vendedor responde ${proximaAbertura()}. Enquanto isso, você já pode ver as máquinas e o catálogo aqui. 👇`));
      }

      // decide a resposta
      if (!id) {
        if (/^(menu|inicio|oi+|ola|opa|e ai|bom dia|boa tarde|boa noite|hello|hi|hola|buenas)\b/.test(txt) || m.type === 'button') id = 'saudacao';
        else if (/catalog|pdf/.test(txt)) id = 'menu_catalogo';
        else if (/video|tutorial|youtube/.test(txt)) id = 'menu_videos';
        else if (/horario|abre|fecha|funciona|aberto/.test(txt)) id = 'menu_horario';
        else if (/vendedor|atendente|humano|pessoa|comprar|pedido|fechar|orcamento|frete|prazo|garantia|pagamento|pix|parcel|manual/.test(txt)) id = 'menu_vendedor';
        else if (/maquina|modelo|preco|valor|quanto|a1|a2|a3|a4|a5|tf1|tf2/.test(txt)) id = 'menu_maquinas';
        else if (m.type !== 'text' && m.type !== 'interactive') id = 'midia';
        else id = 'naosei';                                  // TODO etapa IA: dúvidas simples vão para o Claude Haiku
      }

      try {
        if (id === 'saudacao') {
          envia(phoneId, menu(de, `Olá${nome ? ', ' + nome : ''}! 👋 Aqui é o assistente da *${CFG.empresa}*.`));
        } else if (id === 'menu_catalogo') {
          envia(phoneId, documento(de, CFG.catalogoPdf, 'Catalogo Alemao Afiacao.pdf', 'Catálogo completo da Alemão Afiação 📘'));
          envia(phoneId, botoes(de, `Se preferir, veja o catálogo no site, com fotos e botão de pedido:\n${CFG.catalogoSite}`,
            [['menu_maquinas', 'Escolher máquina'], ['menu_vendedor', 'Falar c/ vendedor']]));
        } else if (id === 'menu_videos') {
          envia(phoneId, texto(de, `🎬 Vídeos dos modelos, testes de afiação e dicas de uso:\n${CFG.videos}`));
        } else if (id === 'menu_horario') {
          envia(phoneId, texto(de, `🕗 Atendimento: ${CFG.horarioTexto}.` + (fechado ? `\nAgora estamos fechados; voltamos ${proximaAbertura()}.` : '\nEstamos abertos agora.')));
        } else if (id === 'menu_maquinas') {
          envia(phoneId, listaMaquinas(de, await carregaProdutos()));
        } else if (id.startsWith('maq_')) {
          const p = (await carregaProdutos()).find((x) => x.id === id.slice(4));
          if (!p) { envia(phoneId, listaMaquinas(de, produtos)); continue; }
          c.escolha = p.id;
          // foto + nome + preço + botões numa mensagem só (não tem como chegarem fora de ordem)
          envia(phoneId, botoes(de, `✅ Você escolheu:\n*${p.nome}*\n${real(p.preco)}\n\nQuer seguir com o pedido dessa máquina?`,
            [['vend_' + p.id, 'Quero essa'], ['menu_maquinas', 'Ver outras'], ['menu_catalogo', 'Catálogo PDF']],
            CFG.fotoWa(p.id)));
        } else if (id === 'menu_vendedor' || id.startsWith('vend_') || id === 'midia') {
          const p = id.startsWith('vend_') ? (await carregaProdutos()).find((x) => x.id === id.slice(5)) : null;
          let msg = p ? `Perfeito! Vou passar seu pedido da *${p.nome}* para o vendedor. 🙌`
            : id === 'midia' ? 'Recebi sua mensagem! Vou passar para o vendedor, que ouve/vê e te responde. 🙌'
            : 'Certo! Vou chamar o vendedor. 🙌';
          msg += fechado ? `\nEle continua por aqui mesmo, nesta conversa, ${proximaAbertura()}.` : '\nEle continua por aqui mesmo, nesta conversa, em instantes.';
          envia(phoneId, texto(de, msg));
          // pausa: o robô fica calado para este cliente (o vendedor assume)
          c.pausaAte = agora + CFG.pausaHoras * 3600e3;
          c.transferido = agora;
          // TODO coexistência: quando o vendedor responder pelo app (smb_message_echoes), renovar a pausa.
        } else {
          envia(phoneId, botoes(de, 'Ainda não sei responder isso por aqui 🙂\nPosso te mostrar as máquinas ou chamar o vendedor:',
            [['menu_maquinas', 'Ver máquinas'], ['menu_catalogo', 'Catálogo PDF'], ['menu_vendedor', 'Falar c/ vendedor']]));
        }
      } catch (e) {
        envia(phoneId, texto(de, 'Tive um probleminha para buscar essa informação. Vou chamar o vendedor para te ajudar. 🙏'));
        c.pausaAte = agora + CFG.pausaHoras * 3600e3;
      }
    }
  }
}

// limpa clientes sem conversa há mais de 30 dias
for (const [k, c] of Object.entries(est.c)) if (Date.now() - (c.ultima || 0) > 30 * 864e5) delete est.c[k];

return saida;
