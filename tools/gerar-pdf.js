// Gera public/catalogo/catalogo-alemao-afiacao.pdf a partir de public/catalogo/produtos.json
// Uso: node tools/gerar-pdf.js   (precisa de playwright e da fonte Montserrat instalada)
const { chromium } = require("playwright");
const fs = require("fs"), path = require("path");

const raiz = path.resolve(__dirname, "..");
const dir = path.join(raiz, "public/catalogo");
const D = JSON.parse(fs.readFileSync(path.join(dir, "produtos.json"), "utf8"));
const C = JSON.parse(fs.readFileSync(path.join(raiz, "src/config.json"), "utf8"));
D.whatsapp = C.whatsapp;
const brl = v => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const wa = t => `https://wa.me/${D.whatsapp}?text=${encodeURIComponent(t)}`;
const msg = p => p.tipo === "maquina"
  ? `Olá! Vi no catálogo em PDF e tenho interesse na *${p.nome}* (${brl(p.preco)}).`
  : p.tipo === "equipamento" ? `Olá! Vi no catálogo em PDF e quero o equipamento *${p.nome}* (${brl(p.preco)}).`
  : `Olá! Vi no catálogo em PDF e quero a peça *${p.nome}* (${brl(p.preco)}).`;
const img = s => "file://" + path.join(dir, s);
const logo = "file://" + path.join(raiz, "public/links/img/logo-alemao.webp");

const card = p => `
  <a class="item ${p.tipo}" href="${wa(msg(p))}">
    <div class="foto">${p.modelo ? `<span class="selo">${p.modelo}</span>` : ""}<img src="${img(p.imgs[0])}"></div>
    <div class="txt">
      <h3>${p.nome}</h3>
      ${p.destaque ? `<div class="extra">${p.destaque}</div>` : ""}
      ${p.servePara ? `<div class="serve">Serve para: <b>${p.servePara}</b></div>` : ""}
      ${p.medidas ? `<div class="med">Altura ${p.medidas.altura} · Largura ${p.medidas.largura} · Comprimento ${p.medidas.comprimento}</div>` : ""}
      ${p.variantes ? `<div class="med">${p.variantes.map(v => `${v.nome}: ${brl(v.preco)}`).join(" · ")}</div>` : ""}
      <div class="preco">${brl(p.preco)}</div>
      <span class="pedir">Pedir no WhatsApp →</span>
    </div>
  </a>`;

const secoes = D.categorias.map(c => {
  const itens = D.produtos.filter(p => p.cat === c.id);
  return `<section class="${(c.id === "pecas" || c.id === "equipamentos") ? "pecas" : ""}"><h2><i>///</i> ${c.nome}</h2><div class="grade">${itens.map(card).join("")}</div></section>`;
}).join("");

const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><style>
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
.foto img{max-width:100%;max-height:100%;object-fit:contain;filter:drop-shadow(0 3mm 3mm rgba(0,0,0,.55))}
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
  <h1>CATÁLOGO <span>${new Date(D.atualizado + "T12:00:00").getFullYear()}</span></h1>
  <p>Máquinas para afiar alicate de cutícula, tesouras e facas<br>Peças e acessórios</p>
  <a class="wa" href="${wa("Olá! Vi o catálogo em PDF e gostaria de mais informações.")}">Pedidos pelo WhatsApp ${C.whatsappTexto}</a>
  <div class="rod">Toque em qualquer produto para pedir pelo WhatsApp · ${C.dominio}/catalogo</div>
</div>
<div class="conteudo">
${secoes}
<div class="final"><b>Pedidos e dúvidas:</b> WhatsApp ${C.whatsappTexto} · ${C.horario} · ${C.dominio}<br>
Todas as máquinas em laranja e verde · ${C.garantiaMaquinas} de garantia nas máquinas.<br>
Preços sujeitos a alteração. Consulte disponibilidade, frete e formas de pagamento pelo WhatsApp.<br>
ALEMÃO® · ${C.razaoSocial} · CNPJ ${C.cnpj} · ${C.rua}, ${C.bairro}, ${C.cidade}</div>
</div>
</body></html>`;

(async () => {
  const tmp = path.join(dir, "_pdf.html");
  fs.writeFileSync(tmp, html);
  const b = await chromium.launch();
  const p = await b.newPage();
  await p.goto("file://" + tmp, { waitUntil: "networkidle" });
  await p.evaluate(() => document.fonts.ready);
  await p.pdf({
    path: path.join(dir, "catalogo-alemao-afiacao.pdf"), format: "A4", printBackground: true,
    margin: { top: "0", bottom: "0", left: "0", right: "0" }
  });
  await b.close(); fs.unlinkSync(tmp);
  console.log("ok");
})();
