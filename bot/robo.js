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
  abre: 8, fecha: 20, dias: [1, 2, 3, 4, 5], // confirmado 24/11: não abre sábado, domingo nem feriado
  // Equipe (confirmado 24/11): vendas e marketing = Letícia; financeiro = Alessandra; dúvidas técnicas das máquinas = Alemão (dono)
  vendas: 'Letícia', financeiro: 'Alessandra', tecnico: 'Alemão',
  fuso: 'America/Sao_Paulo',
  pausaHoras: 12,       // depois de passar para o vendedor, o robô fica calado por este tempo
  avisoForaHoras: 6,    // aviso de "fora do horário" no máximo 1 vez a cada 6 h por cliente
  graph: 'https://graph.facebook.com/v25.0',
  // Feriados: fecha nos feriados nacionais (lei). Os itens abaixo estão A CONFIRMAR com a Alemão;
  // para fechar neles, coloque aqui: 'MM-DD' fixos (ex.: '07-09' Revolução Constitucionalista/SP, '08-08' aniversário de Votuporanga)
  // e móveis: 'carnaval' (segunda e terça), 'cinzas' (quarta até 12h não é tratado), 'corpus' (Corpus Christi).
  feriadosExtras: [],
  feriadosMoveisExtras: [],
  // IA (Claude Haiku 4.5) para perguntas livres. Liga só depois de a credencial "Anthropic" estar no n8n.
  ia: {
    ligada: false,
    modelo: 'claude-haiku-4-5',
    maxTokens: 350,
    porClientePorDia: 15,   // acima disso, passa para o vendedor (controle de gasto)
    historico: 6,           // últimas mensagens lembradas por cliente
  },
};

// ---------- utilidades ----------
const agoraSP = () => new Date(new Date().toLocaleString('en-US', { timeZone: CFG.fuso }));
// Páscoa (algoritmo de Meeus/Jones/Butcher) → feriados móveis
function pascoa(ano) {
  const a = ano % 19, b = Math.floor(ano / 100), c = ano % 100, d = Math.floor(b / 4), e = b % 4;
  const f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31), dia = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(ano, mes - 1, dia);
}
const FIXOS = { '01-01': 'Confraternização Universal', '04-21': 'Tiradentes', '05-01': 'Dia do Trabalho',
  '09-07': 'Independência', '10-12': 'Nossa Senhora Aparecida', '11-02': 'Finados',
  '11-15': 'Proclamação da República', '11-20': 'Dia da Consciência Negra', '12-25': 'Natal' };
const mmdd = (d) => String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
function feriado(d = agoraSP()) {
  const k = mmdd(d);
  if (FIXOS[k]) return FIXOS[k];
  if (CFG.feriadosExtras.includes(k)) return 'feriado';
  const p = pascoa(d.getFullYear());
  const mais = (n) => { const x = new Date(p); x.setDate(p.getDate() + n); return mmdd(x); };
  if (k === mais(-2)) return 'Sexta-feira Santa';
  if (CFG.feriadosMoveisExtras.includes('carnaval') && (k === mais(-48) || k === mais(-47))) return 'Carnaval';
  if (CFG.feriadosMoveisExtras.includes('corpus') && k === mais(60)) return 'Corpus Christi';
  return null;
}
function aberto(d = agoraSP()) {
  const h = d.getHours() + d.getMinutes() / 60;
  return CFG.dias.includes(d.getDay()) && !feriado(d) && h >= CFG.abre && h < CFG.fecha;
}
function proximaAbertura(d = agoraSP()) {
  const nomes = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
  for (let i = 0; i < 15; i++) {
    const x = new Date(d); x.setDate(d.getDate() + i); x.setHours(CFG.abre, 0, 0, 0);
    if (CFG.dias.includes(x.getDay()) && !feriado(x) && x > d) {
      const quando = i === 0 ? 'hoje' : i === 1 ? 'amanhã' : i < 7 ? nomes[x.getDay()] : `${nomes[x.getDay()]} (${x.getDate()}/${x.getMonth() + 1})`;
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

// ---------- IA (Claude Haiku) ----------
// Só fatos confirmados entram no prompt. O que não estiver aqui, a IA não responde: passa para a equipe.
function iaPode(c) {
  const hoje = mmdd(agoraSP());
  if (c.iaDia !== hoje) { c.iaDia = hoje; c.iaN = 0; }
  return c.iaN < CFG.ia.porClientePorDia;
}
function fatos(produtos) {
  const linha = (p) => {
    let t = `- ${p.nome}${p.modelo ? ` (modelo ${p.modelo})` : ''}: ${real(p.preco)}`;
    if (p.medidas) t += `; medidas: altura ${p.medidas.altura}, largura ${p.medidas.largura}, comprimento ${p.medidas.comprimento} (unidade não informada)`;
    if (p.servePara) t += `; serve para: ${[].concat(p.servePara).join(', ')}`;
    return t;
  };
  return [
    `EMPRESA: ${CFG.empresa}, Votuporanga/SP. Site: ${CFG.site}`,
    `HORÁRIO: ${CFG.horarioTexto}. Não abre sábado, domingo nem feriado.`,
    `EQUIPE: vendas e marketing = ${CFG.vendas}; financeiro (frete e pagamento) = ${CFG.financeiro}; dúvidas técnicas das máquinas = ${CFG.tecnico} (o dono).`,
    'PAGAMENTO: Pix ou link de pagamento, enviado pelo setor de vendas e financeiro logo depois de o cliente escolher a máquina.',
    'FRETE: calculado pelo financeiro. Entregamos em todo o Brasil e já vendemos para EUA, Portugal e Itália.',
    'GARANTIA: todas as máquinas têm 90 dias de garantia.',
    'CORES: todas as máquinas existem em laranja e verde.',
    `MANUAL: sempre vai junto com a máquina. Vídeos tutoriais: ${CFG.videos}`,
    `CATÁLOGO: ${CFG.catalogoSite} (PDF: ${CFG.catalogoPdf})`,
    'NÚMEROS: mais de 500 máquinas vendidas e mais de 300 clientes ativos.',
    'DETALHES: a A2 tem controlador de velocidade. A A3 é a máquina compacta.',
    'MÁQUINAS:', ...produtos.filter((p) => p.tipo === 'maquina').map(linha),
    'EQUIPAMENTOS:', ...produtos.filter((p) => p.tipo === 'equipamento').map(linha),
    'PEÇAS:', ...produtos.filter((p) => p.tipo === 'peca').map(linha),
  ].join('\n');
}
async function pedidoIA(c, pergunta, nome, fechado) {
  const produtos = await carregaProdutos();
  const system = `Você é o assistente de WhatsApp da ${CFG.empresa}, que vende máquinas de afiação.
Responda no idioma do cliente, em no máximo 3 frases curtas, tom simpático e direto, pode usar 1 emoji.
Use SOMENTE os FATOS abaixo. Nunca invente preço, prazo, frete, parcelamento, desconto, garantia, estoque, condição, especificação técnica ou unidade de medida.
Se a resposta não estiver nos FATOS, responda exatamente [VENDEDOR] (pedido, compra, frete, prazo, parcelamento, negociação, reclamação, qualquer outra coisa)
ou exatamente [TECNICO] (dúvida técnica de uso, defeito, regulagem ou manutenção que os FATOS não respondem).
Se o cliente quiser comprar, diga que é só escolher a máquina no menu ou pedir para falar com a ${CFG.vendas}.
${fechado ? 'AGORA A LOJA ESTÁ FECHADA; a equipe responde ' + proximaAbertura() + '.' : 'A loja está aberta agora.'}
${nome ? 'Nome do cliente: ' + nome + '.' : ''}

FATOS:
${fatos(produtos)}`;
  c.hist = (c.hist || []).concat([{ role: 'user', content: corta(pergunta, 800) }]).slice(-CFG.ia.historico);
  while (c.hist.length && c.hist[0].role !== 'user') c.hist.shift();
  c.iaN = (c.iaN || 0) + 1;
  return { model: CFG.ia.modelo, max_tokens: CFG.ia.maxTokens, system, messages: c.hist };
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

    // Coexistência: mensagem enviada pelo vendedor no app WhatsApp Business (celular ou WhatsApp Web).
    // O robô fica calado para aquele cliente enquanto o vendedor estiver atendendo.
    if (ch.field === 'smb_message_echoes' || v.message_echoes) {
      for (const e of v.message_echoes || []) {
        if (!e.to) continue;
        const c = est.c[e.to] = est.c[e.to] || {};
        c.pausaAte = Date.now() + CFG.pausaHoras * 3600e3;
        c.vendedorEm = Date.now(); c.phoneId = phoneId;   // conta para o tempo de finalização do atendimento
        c.ativo = true; delete c.finalizado;
      }
      continue;
    }

    for (const m of v.messages || []) {
      if (!phoneId || !m.from) continue;
      if (est.vistos.includes(m.id)) continue;              // a Meta às vezes reenvia o mesmo aviso
      est.vistos.push(m.id); if (est.vistos.length > 300) est.vistos.splice(0, 100);

      const de = m.from;
      const nome = primeiroNome(((v.contacts || []).find((c) => c.wa_id === de) || {}).profile?.name);
      const c = est.c[de] = est.c[de] || {};
      const agora = Date.now();
      c.ultima = agora; c.phoneId = phoneId;
      c.ativo = true; delete c.finalizado;            // conversa aberta (o nó "Finaliza atendimentos" fecha após 5 h sem resposta)

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
        const fer = feriado();
        envia(phoneId, texto(de, (fer ? `🕗 Hoje é feriado (${fer}) e não estamos atendendo.\n` : `🕗 Estamos fora do horário de atendimento (${CFG.horarioTexto}).\n`) +
          `Um vendedor responde ${proximaAbertura()}. Enquanto isso, você já pode ver as máquinas e o catálogo aqui. 👇`));
      }

      // decide a resposta
      if (!id) {
        if (/^(menu|inicio|oi+|ola|opa|e ai|bom dia|boa tarde|boa noite|hello|hi|hola|buenas)\b/.test(txt) || m.type === 'button') id = 'saudacao';
        else if (/catalog|pdf/.test(txt)) id = 'menu_catalogo';
        else if (/video|tutorial|youtube/.test(txt)) id = 'menu_videos';
        else if (/horario|que horas|\babre|fecha|funcionamento|aberto/.test(txt)) id = 'menu_horario';
        else if (/pagamento|pagar|pix|link de pag|boleto|cartao/.test(txt)) id = 'faq_pagamento';
        else if (/frete|envio|entrega|transportadora/.test(txt)) id = 'faq_frete';
        else if (/garantia/.test(txt)) id = 'faq_garantia';
        else if (/manual/.test(txt)) id = 'faq_manual';
        else if (/vendedor|atendente|humano|pessoa|comprar|pedido|fechar|orcamento|prazo|parcel/.test(txt)) id = 'menu_vendedor';
        else if (/maquina|modelo|preco|valor|quanto|a1|a2|a3|a4|a5|tf1|tf2/.test(txt)) id = 'menu_maquinas';
        else if (m.type !== 'text' && m.type !== 'interactive') id = 'midia';
        else id = 'naosei';                                  // texto livre: vai para a IA (se ligada)
      }

      try {
        if (id === 'saudacao') {
          envia(phoneId, menu(de, `Olá${nome ? ', ' + nome : ''}! 👋 Aqui é o assistente da *${CFG.empresa}*.`));
        } else if (id === 'menu_catalogo') {
          envia(phoneId, documento(de, CFG.catalogoPdf, 'Catalogo Alemao Afiacao.pdf', 'Catálogo completo da Alemão Afiação 📘'));
          envia(phoneId, botoes(de, `Se preferir, veja o catálogo no site, com fotos e botão de pedido:\n${CFG.catalogoSite}`,
            [['menu_maquinas', 'Escolher máquina'], ['menu_vendedor', 'Falar c/ vendedor']]));
        } else if (id === 'faq_pagamento') {
          // confirmado 24/11: Pix ou link de pagamento, enviado por vendas/financeiro logo após o pedido
          envia(phoneId, botoes(de, '💳 O pagamento é por *Pix* ou *link de pagamento*.\nAssim que você escolhe a máquina, nosso setor de vendas e financeiro te envia o pagamento por aqui.',
            [['menu_maquinas', 'Escolher máquina'], ['menu_vendedor', 'Falar c/ vendedor']]));
        } else if (id === 'faq_frete') {
          // confirmado 24/11: frete calculado pelo financeiro (valor e prazo nunca pelo robô)
          envia(phoneId, texto(de, `🚚 O frete é calculado pelo nosso financeiro (${CFG.financeiro}). Entregamos em todo o Brasil.` +
            (fechado ? `\nVou deixar seu pedido de cálculo registrado; ela responde ${proximaAbertura()}.` : '\nVou chamar a equipe para calcular para você, aqui mesmo.')));
          c.pausaAte = agora + CFG.pausaHoras * 3600e3; c.transferido = agora; c.transfAberto = !fechado;
        } else if (id === 'faq_garantia') {
          // confirmado 05/11: todas as máquinas têm 90 dias de garantia
          envia(phoneId, botoes(de, '🛡️ Todas as nossas máquinas têm *90 dias de garantia*.',
            [['menu_maquinas', 'Ver máquinas'], ['menu_vendedor', 'Falar c/ vendedor']]));
        } else if (id === 'faq_manual') {
          // confirmado 24/11: o manual sempre vai junto com a máquina; há vídeos tutoriais
          envia(phoneId, texto(de, `📘 O manual sempre vai junto com a máquina.\n🎬 Também temos vídeos tutoriais: ${CFG.videos}`));
        } else if (id === 'menu_videos') {
          envia(phoneId, texto(de, `🎬 Vídeos dos modelos, testes de afiação e dicas de uso:\n${CFG.videos}`));
        } else if (id === 'menu_horario') {
          envia(phoneId, texto(de, `🕗 Atendimento: ${CFG.horarioTexto}.` + (fechado ? `\nAgora estamos fechados${feriado() ? ' (feriado)' : ''}; voltamos ${proximaAbertura()}.` : '\nEstamos abertos agora.')));
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
          let msg = p ? `Perfeito! 🙌 A ${CFG.vendas}, do nosso setor de vendas, vai continuar seu pedido da *${p.nome}* e te enviar o pagamento (Pix ou link de pagamento).`
            : id === 'midia' ? 'Recebi sua mensagem! 🙌 Nossa equipe ouve/vê e te responde.'
            : 'Certo! 🙌 Vou chamar nossa equipe.';
          msg += fechado ? `\nO atendimento continua por aqui mesmo, nesta conversa, ${proximaAbertura()}.` : '\nO atendimento continua por aqui mesmo, nesta conversa, em instantes.';
          envia(phoneId, texto(de, msg));
          // pausa: o robô fica calado para este cliente (o vendedor assume)
          c.pausaAte = agora + CFG.pausaHoras * 3600e3;
          c.transferido = agora; c.transfAberto = !fechado;   // "Fila e finalização" avisa a fila após 5 min sem resposta do vendedor
          // coexistência: cada resposta do vendedor pelo app (smb_message_echoes) renova a pausa
        } else if (id === 'naosei' && m.type === 'text' && CFG.ia.ligada && iaPode(c)) {
          // a pergunta vai para o nó "Pergunta ao Claude"; a resposta volta pelo nó "Resposta da IA"
          const volta = fechado ? `O atendimento continua por aqui mesmo, nesta conversa, ${proximaAbertura()}.` : 'O atendimento continua por aqui mesmo, nesta conversa, em instantes.';
          saida.push({ json: { ia: true, phoneId, de, nome, corpo: await pedidoIA(c, m.text.body, nome, fechado),
            transfVendedor: `Essa eu vou passar para a ${CFG.vendas}, do nosso setor de vendas, te responder certinho. 🙌\n` + volta,
            transfTecnico: `Boa pergunta! Vou passar para o ${CFG.tecnico}, que tira as dúvidas técnicas das máquinas. 🔧\n` + volta,
            pausaMs: CFG.pausaHoras * 3600e3, graph: CFG.graph, aberto: !fechado } });
        } else if (id === 'naosei' && m.type === 'text' && CFG.ia.ligada) {
          // passou do limite diário de IA para este cliente → vendedor
          envia(phoneId, texto(de, 'Vou chamar nossa equipe para te responder certinho. 🙌\n' +
            (fechado ? `O atendimento continua por aqui mesmo, ${proximaAbertura()}.` : 'O atendimento continua por aqui mesmo, em instantes.')));
          c.pausaAte = agora + CFG.pausaHoras * 3600e3; c.transferido = agora; c.transfAberto = !fechado;
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
for (const [k, c] of Object.entries(est.c)) if (Date.now() - Math.max(c.ultima || 0, c.vendedorEm || 0) > 30 * 864e5) delete est.c[k];

return saida;
