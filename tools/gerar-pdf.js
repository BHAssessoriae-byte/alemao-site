// Gera os catálogos em PDF (português, inglês e espanhol) a partir de public/catalogo/produtos.json:
//   public/catalogo/catalogo-alemao-afiacao.pdf · -en.pdf · -es.pdf   (traduções: src/i18n/textos.json)
// Uso: node tools/gerar-pdf.js   (precisa de playwright e da fonte Montserrat instalada)
const { chromium } = require("playwright");
const fs = require("fs"), path = require("path");

const raiz = path.resolve(__dirname, "..");
const dir = path.join(raiz, "public/catalogo");
const D = JSON.parse(fs.readFileSync(path.join(dir, "produtos.json"), "utf8"));
const I = require("./i18n.js");
const C0 = JSON.parse(fs.readFileSync(path.join(raiz, "src/config.json"), "utf8"));
D.whatsapp = C0.whatsapp;
const wa = t => `https://wa.me/${D.whatsapp}?text=${encodeURIComponent(t)}`;
const fmt = (s, o) => s.replace(/\{(\w+)\}/g, (_, k) => o[k] ?? "");
// Fotos do PDF SEM transparência: vários leitores (prévia do WhatsApp, celulares Android)
// ignoram a transparência e mostram fundo preto. Cada foto é achatada sobre a cor do cartão,
// com a sombra já desenhada (tools/gerar-fotos-pdf.py).
const pastaPdf = path.join(raiz, "tools/.pdf-img"); fs.mkdirSync(pastaPdf, { recursive: true });
const listaPdf = [];
const achatar = (orig, nome, cor, sombra) => { const d = path.join(pastaPdf, nome), l = [orig, d, cor, sombra].join("\t"); if (!listaPdf.includes(l)) listaPdf.push(l); return "file://" + d; };
// máquinas: contorno branco sobre o cartão escuro; equipamentos/peças: quadrado branco
const img = (s, borda) => borda
  ? achatar(path.join(dir, s.replace("img/", "img/borda/")), "m-" + path.basename(s).replace(/\.\w+$/, ".jpg"), "#171717", "0.55")
  : achatar(path.join(dir, s), "p-" + path.basename(s).replace(/\.\w+$/, ".jpg"), "#FFFFFF", "0.25");
const logo = achatar(path.join(raiz, "public/links/img/logo-alemao.webp"), "logo.jpg", "#0B0B0B", "0");

function htmlDe(lang) {
const t = I.tradutor(lang), brl = I.brlDe(lang), C = I.configDe(C0, lang);
const msg = p => fmt(t(p.tipo === "maquina" ? "Olá! Vi no catálogo em PDF e tenho interesse na *{nome}* ({preco})."
  : p.tipo === "equipamento" ? "Olá! Vi no catálogo em PDF e quero o equipamento *{nome}* ({preco})." : "Olá! Vi no catálogo em PDF e quero a peça *{nome}* ({preco})."),
  { nome: t(p.nome), preco: brl(p.preco) });
const card = p => `
  <a class="item ${p.tipo}" href="${wa(msg(p))}">
    <div class="foto">${p.modelo ? `<span class="selo">${p.modelo}</span>` : ""}<img src="${img(p.imgs[0], p.tipo === "maquina")}"></div>
    <div class="txt">
      <h3>${t(p.nome)}</h3>
      ${p.destaque ? `<div class="extra">${t(p.destaque)}</div>` : ""}
      ${p.cores ? `<div class="med">${t("Disponível em")} <b style="color:#F36C10">${t("laranja")}</b> ${t("e")} <b style="color:#6CC72B">${t("verde")}</b></div>` : ""}
      ${p.servePara ? `<div class="serve">${t("Serve para:")} <b>${t(p.servePara)}</b></div>` : ""}
      ${p.medidas ? `<div class="med">${t("Altura")} ${p.medidas.altura} · ${t("Largura")} ${p.medidas.largura} · ${t("Comprimento")} ${p.medidas.comprimento}</div>` : ""}
      ${p.variantes ? `<div class="med">${p.variantes.map(v => `${t(v.nome)}: ${brl(v.preco)}`).join(" · ")}</div>` : ""}
      <div class="preco">${brl(p.preco)}</div>
      <span class="pedir">${t("Pedir no WhatsApp")} →</span>
    </div>
  </a>`;

const secoes = D.categorias.map(c => {
  const itens = D.produtos.filter(p => p.cat === c.id);
  return `<section class="${(c.id === "pecas" || c.id === "equipamentos") ? "pecas" : ""}"><h2><i>///</i> ${t(c.nome)}</h2><div class="grade">${itens.map(card).join("")}</div></section>`;
}).join("");

return `<!doctype html><html lang="${I.IDIOMAS[lang].html}"><head><meta charset="utf-8"><style>
@page{size:A4;margin:0}
.conteudo{padding:14mm 12mm;-webkit-box-decoration-break:clone;box-decoration-break:clone}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:"Montserrat",sans-serif;color:#F5F5F5;background:#0B0B0B;-webkit-print-color-adjust:exact;print-color-adjust:exact}
html{background:#0B0B0B}
.capa{height:297mm;padding:14mm 12mm;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;page-break-after:always;position:relative}
.capa img{width:120mm}
.capa h1{margin-top:14mm;font-size:34pt;font-weight:800;letter-spacing:1pt}
.capa h1 span{color:#F36C10}
.capa p{margin-top:5mm;font-size:11pt;color:#b5b5b5;line-height:1.6}
.capa .wa{display:inline-block;margin-top:10mm;background:#F36C10;color:#111;font-weight:800;font-size:12pt;padding:4mm 8mm;text-decoration:none;clip-path:polygon(3mm 0,100% 0,calc(100% - 3mm) 100%,0 100%)}
.capa .rod{position:absolute;bottom:14mm;font-size:8pt;color:#777}
section{margin-bottom:8mm}
h2{font-size:13pt;font-weight:800;letter-spacing:.8pt;text-transform:uppercase;margin:0 0 5mm;break-after:avoid}
h2 i{color:#F36C10;letter-spacing:-1pt}
.grade{display:grid;grid-template-columns:1fr 1fr;gap:5mm}
section.pecas .grade{grid-template-columns:1fr 1fr 1fr;gap:4mm}
.item{display:flex;flex-direction:column;background:#171717;border-radius:2mm;overflow:hidden;text-decoration:none;color:inherit;break-inside:avoid}
.foto{position:relative;height:62mm;display:flex;align-items:center;justify-content:center;padding:5mm}
section.pecas .foto{height:40mm;padding:3mm}
.foto img{max-width:100%;max-height:100%;object-fit:contain}
.item.equipamento .foto,.item.peca .foto{background:#fff}
.selo{position:absolute;top:3mm;left:3mm;background:#F36C10;color:#111;font-weight:800;font-size:8pt;padding:1mm 2.5mm}
.txt{padding:2mm 4mm 4mm;display:flex;flex-direction:column;gap:1.4mm;flex:1}
h3{font-size:10.5pt;font-weight:700;line-height:1.3}
section.pecas h3{font-size:9pt}
.extra{font-size:8pt;color:#F36C10;font-weight:600}
.serve,.med{font-size:7.5pt;color:#b5b5b5}
.serve b{color:#fff}
.preco{margin-top:auto;font-size:15pt;font-weight:800}
section.pecas .preco{font-size:12pt}
.pedir{font-size:8pt;font-weight:700;color:#F36C10}
.final{margin-top:6mm;padding:5mm;background:#171717;border-radius:2mm;font-size:9pt;color:#b5b5b5;line-height:1.6;break-inside:avoid}
.final b{color:#fff}
</style></head><body>
<div class="capa">
  <img src="${logo}">
  <h1>${t("CATÁLOGO")} <span>${new Date(D.atualizado + "T12:00:00").getFullYear()}</span></h1>
  <p>${t("Máquinas para afiar alicate de cutícula, tesouras e facas")}<br>${t("Peças e acessórios")}</p>
  <a class="wa" href="${wa(t("Olá! Vi o catálogo em PDF e gostaria de mais informações."))}">${t("Pedidos pelo WhatsApp")} ${C.whatsappTexto}</a>
  <div class="rod">${t("Toque em qualquer produto para pedir pelo WhatsApp")} · ${C.dominio}${I.IDIOMAS[lang].prefixo}/catalogo</div>
</div>
<div class="conteudo">
${secoes}
<div class="final"><b>${t("Pedidos e dúvidas:")}</b> WhatsApp ${C.whatsappTexto} · ${C.horario} · ${C.dominio}<br>
${fmt(t("Todas as máquinas e as peças pintadas em laranja e verde · {garantia} de garantia nas máquinas."), { garantia: C.garantiaMaquinas })}<br>
${t("Preços sujeitos a alteração. Consulte disponibilidade, frete e formas de pagamento pelo WhatsApp.")}<br>
ALEMÃO® · ${C.razaoSocial} · CNPJ ${C.cnpj} · ${C.rua}, ${C.bairro}, ${C.cidade}</div>
</div>
</body></html>`;
}

(async () => {
  const paginas = Object.fromEntries(I.LISTA.map(l => [l, htmlDe(l)]));
  I.conferir();
  fs.writeFileSync(path.join(pastaPdf, "lista.txt"), listaPdf.join("\n"));
  require("child_process").execFileSync("python3", [path.join(raiz, "tools/gerar-fotos-pdf.py")], { stdio: "inherit" });
  const tmp = path.join(dir, "_pdf.html");
  const b = await chromium.launch();
  for (const lang of I.LISTA) {
    fs.writeFileSync(tmp, paginas[lang]);
    const p = await b.newPage();
    await p.goto("file://" + tmp, { waitUntil: "networkidle" });
    await p.evaluate(() => document.fonts.ready);
    await p.pdf({
      path: path.join(dir, I.IDIOMAS[lang].pdf), format: "A4", printBackground: true,
      margin: { top: "0", bottom: "0", left: "0", right: "0" }
    });
    await p.close();
    console.log("ok · PDF", I.IDIOMAS[lang].nome, "·", I.IDIOMAS[lang].pdf);
  }
  await b.close(); fs.unlinkSync(tmp);
})();
