// Robô Alemão · nó "Resposta da IA" (Code node, "Run once for all items").
// Recebe a resposta da API da Anthropic (nó "Pergunta ao Claude") e monta a mensagem do WhatsApp.
// [VENDEDOR] ou [TECNICO] → passa para a equipe e pausa o robô para o cliente.
// Erro da API ou resposta vazia → mostra o menu de opções (nunca inventa nada).
const est = $getWorkflowStaticData('global'); est.c = est.c || {};
const corta = (s, n) => (s.length <= n ? s : s.slice(0, n - 1) + '…');
const saida = [];
const itens = $input.all();
for (let i = 0; i < itens.length; i++) {
  const r = itens[i].json || {};
  const o = $('Vai para a IA?').itemMatching(i).json;
  const c = est.c[o.de] = est.c[o.de] || {};
  const url = `${o.graph}/${o.phoneId}/messages`;
  const base = { messaging_product: 'whatsapp', recipient_type: 'individual', to: o.de };
  const texto = (body) => ({ ...base, type: 'text', text: { body } });
  const botoes = (body, lista) => ({ ...base, type: 'interactive', interactive: { type: 'button', body: { text: body },
    action: { buttons: lista.map(([id, title]) => ({ type: 'reply', reply: { id, title } })) } } });

  let txt = '';
  if (Array.isArray(r.content)) txt = r.content.filter((b) => b.type === 'text').map((b) => b.text).join('\n').trim();
  const tag = /\[(VENDEDOR|TECNICO)\]/.exec(txt);

  if (r.type === 'error' || r.error || !txt) {
    c.hist = [];
    saida.push({ json: { url, payload: botoes('Ainda não sei responder isso por aqui 🙂\nPosso te mostrar as máquinas ou chamar o vendedor:',
      [['menu_maquinas', 'Ver máquinas'], ['menu_catalogo', 'Catálogo PDF'], ['menu_vendedor', 'Falar c/ vendedor']]) } });
  } else if (tag) {
    c.hist = [];
    saida.push({ json: { url, payload: texto(tag[1] === 'TECNICO' ? o.transfTecnico : o.transfVendedor) } });
    c.pausaAte = Date.now() + o.pausaMs; c.transferido = Date.now(); c.transfAberto = !!o.aberto;
  } else {
    const resp = corta(txt, 900);
    c.hist = (c.hist || []).concat([{ role: 'assistant', content: resp }]).slice(-6);
    while (c.hist.length && c.hist[0].role !== 'user') c.hist.shift();
    saida.push({ json: { url, payload: botoes(resp, [['menu_maquinas', 'Ver máquinas'], ['menu_vendedor', 'Falar c/ vendedor']]) } });
  }
}
return saida;
