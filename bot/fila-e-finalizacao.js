// Robô Alemão · nó "Fila e finalização" (Code node, roda a cada 1 min pelo gatilho "A cada minuto").
// 1) FILA: o cliente foi passado para a equipe com a loja aberta e, depois de 5 min, o vendedor ainda não
//    respondeu pelo app (smb_message_echoes) → manda 1 aviso de fila de espera (uma vez por transferência).
// 2) FINALIZAÇÃO: 5 h sem nenhuma mensagem (cliente ou vendedor) → finaliza o atendimento; o robô sai da
//    pausa e esquece a conversa. Manda o aviso só entre 8h e 21h; à noite finaliza em silêncio.
const CFG = {
  filaMin: 5,
  filaTexto: '⏳ Você está na fila de atendimento. Nossa equipe já vai te responder por aqui mesmo.\nObrigado pela paciência! 🙏',
  fimHoras: 5,
  janela: [8, 21],
  fuso: 'America/Sao_Paulo',
  graph: 'https://graph.facebook.com/v25.0',
  fimTexto: 'Como não tivemos mais resposta, vamos finalizar este atendimento por aqui. 😊\n' +
    'Quando precisar, é só mandar um *oi* que a gente te atende de novo.\n— Equipe Alemão Afiação',
};
const est = $getWorkflowStaticData('global'); est.c = est.c || {};
const agora = Date.now();
const h = new Date(new Date().toLocaleString('en-US', { timeZone: CFG.fuso })).getHours();
const podeMandar = h >= CFG.janela[0] && h < CFG.janela[1];
const msg = (c, to, body) => ({ json: { url: `${CFG.graph}/${c.phoneId}/messages`,
  payload: { messaging_product: 'whatsapp', recipient_type: 'individual', to, type: 'text', text: { body } } } });
const saida = [];
for (const [de, c] of Object.entries(est.c)) {
  if (!c.phoneId) continue;

  // 1) fila de espera
  const t = c.transferido || 0;
  const desde = agora - t;
  if (t && c.transfAberto && c.filaAvisada !== t && (c.pausaAte || 0) > agora
      && !((c.vendedorEm || 0) > t) && desde >= CFG.filaMin * 60e3 && desde < 60 * 60e3) {
    c.filaAvisada = t;
    saida.push(msg(c, de, CFG.filaTexto));
  }

  // 2) finalização
  if (!c.ativo || c.finalizado) continue;
  const ultima = Math.max(c.ultima || 0, c.vendedorEm || 0);
  if (agora - ultima < CFG.fimHoras * 3600e3) continue;
  c.ativo = false; c.finalizado = agora;
  delete c.pausaAte; delete c.escolha; c.hist = [];
  if (podeMandar && agora - (c.ultima || 0) < 23 * 3600e3) saida.push(msg(c, de, CFG.fimTexto));
}
return saida;
