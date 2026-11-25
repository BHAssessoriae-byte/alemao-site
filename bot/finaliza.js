// Robô Alemão · nó "Finaliza atendimentos" (Code node, roda a cada 15 min pelo gatilho "A cada 15 min").
// Se o cliente não responde há 5 h (contando a última mensagem dele, do robô ou do vendedor),
// o atendimento é finalizado: o robô sai da pausa, esquece a conversa da IA e, no horário permitido,
// manda uma mensagem curta avisando. À noite finaliza em silêncio, para não acordar ninguém.
const CFG = {
  fimHoras: 5,
  janela: [8, 21],                       // só manda a mensagem de finalização entre 8h e 21h
  fuso: 'America/Sao_Paulo',
  graph: 'https://graph.facebook.com/v25.0',
  texto: 'Como não tivemos mais resposta, vamos finalizar este atendimento por aqui. 😊\n' +
    'Quando precisar, é só mandar um *oi* que a gente te atende de novo.\n— Equipe Alemão Afiação',
};
const est = $getWorkflowStaticData('global'); est.c = est.c || {};
const agora = Date.now();
const h = new Date(new Date().toLocaleString('en-US', { timeZone: CFG.fuso })).getHours();
const podeMandar = h >= CFG.janela[0] && h < CFG.janela[1];
const saida = [];
for (const [de, c] of Object.entries(est.c)) {
  if (!c.ativo || c.finalizado) continue;
  const ultima = Math.max(c.ultima || 0, c.vendedorEm || 0);
  if (agora - ultima < CFG.fimHoras * 3600e3) continue;
  c.ativo = false; c.finalizado = agora;
  delete c.pausaAte; delete c.escolha; c.hist = [];
  if (podeMandar && c.phoneId && agora - (c.ultima || 0) < 23 * 3600e3) {   // dentro da janela de 24 h da Meta
    saida.push({ json: { url: `${CFG.graph}/${c.phoneId}/messages`,
      payload: { messaging_product: 'whatsapp', recipient_type: 'individual', to: de, type: 'text', text: { body: CFG.texto } } } });
  }
}
return saida;
