// Gera public/index.html a partir de src/index.html + public/catalogo/produtos.json + public/videos/videos.json
// Uso: node tools/gerar-site.js
const fs = require("fs"), path = require("path");
const raiz = path.resolve(__dirname, "..");
const D = JSON.parse(fs.readFileSync(path.join(raiz, "public/catalogo/produtos.json"), "utf8"));
const V = JSON.parse(fs.readFileSync(path.join(raiz, "public/videos/videos.json"), "utf8"));
let html = fs.readFileSync(path.join(raiz, "src/index.html"), "utf8");

const C = JSON.parse(fs.readFileSync(path.join(raiz, "src/config.json"), "utf8"));
// o número e as redes do config.json valem para tudo: sincroniza os JSONs usados pelo catálogo e pelos vídeos
const salvaJSON = (arq, obj) => fs.writeFileSync(path.join(raiz, arq), JSON.stringify(obj, null, 1) + "\n");
if (D.whatsapp !== C.whatsapp) { D.whatsapp = C.whatsapp; salvaJSON("public/catalogo/produtos.json", D); }
if (V.whatsapp !== C.whatsapp || V.youtube !== C.youtube) { V.whatsapp = C.whatsapp; V.youtube = C.youtube; salvaJSON("public/videos/videos.json", V); }
const pega = k => k.split(".").reduce((o, x) => (o == null ? o : o[x]), C);
const preencher = t => t.replace(/{{c\.([\w.]+)(:cap)?}}/g, (m, k, cap) => {
  const v = pega(k); if (v == null) throw new Error("config.json sem o campo " + k);
  const t2 = String(v); return cap ? t2.charAt(0).toUpperCase() + t2.slice(1) : t2;
});
html = preencher(html);
const WA = C.whatsapp;
const brl = v => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const wa = t => `https://wa.me/${WA}?text=${encodeURIComponent(t)}`;
const img = s => "/catalogo/" + s;
const P = Object.fromEntries(D.produtos.map(p => [p.id, p]));
const maquinas = D.produtos.filter(p => p.tipo === "maquina");
const pecas = D.produtos.filter(p => p.tipo === "peca");
const equips = D.produtos.filter(p => p.tipo === "equipamento");
const acess = [...equips, ...pecas];
const med = p => p.medidas ? `${p.medidas.altura} × ${p.medidas.largura} × ${p.medidas.comprimento} (A × L × C)` : "";
const corHex = { Laranja: "#F36C10", Verde: "#6CC72B" };

const ICO = {
  wa: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.5 14.4c-.3-.1-1.8-.9-2-1s-.5-.1-.7.1-.8 1-.9 1.2-.3.2-.6.1a8.2 8.2 0 0 1-2.4-1.5 9 9 0 0 1-1.7-2.1c-.2-.3 0-.5.1-.6l.4-.5.3-.5v-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6a1.1 1.1 0 0 0-.8.4 3.4 3.4 0 0 0-1 2.5 5.9 5.9 0 0 0 1.2 3.1 13.4 13.4 0 0 0 5.2 4.6c.7.3 1.3.5 1.7.6a4.2 4.2 0 0 0 1.9.1 3.1 3.1 0 0 0 2-1.4 2.5 2.5 0 0 0 .2-1.4c-.1-.2-.3-.3-.6-.4ZM12 21.8a9.8 9.8 0 0 1-5-1.4l-.4-.2-3.7 1 1-3.6-.2-.4a9.8 9.8 0 1 1 8.3 4.6Zm8.4-18.2A11.8 11.8 0 0 0 1.8 17.9L.1 24l6.3-1.6a11.8 11.8 0 0 0 5.6 1.4 11.8 11.8 0 0 0 8.4-20.2Z"/></svg>',
  seta: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="m7.5 12.5 3 3 6-6.5"/></svg>',
  play: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4.5v15l13-7.5z"/></svg>',
  busca: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
  insta: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg>',
  fb: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M13.5 21v-7.5h2.6l.4-3h-3V8.6c0-.9.3-1.5 1.6-1.5h1.6V4.4A21 21 0 0 0 14.4 4C12 4 10.5 5.4 10.5 8v2.5H8v3h2.5V21z"/></svg>',
  yt: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4a2.5 2.5 0 0 0-1.8 1.8A26 26 0 0 0 2 12a26 26 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8A26 26 0 0 0 22 12a26 26 0 0 0-.4-4.8ZM10 15V9l5.2 3z"/></svg>',
  pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.5"/></svg>',
  relogio: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  fechar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>'
};

// ---- Cards de máquinas
const cardMaq = (p, i) => {
  const cores = p.cores || [];
  const foto = cores.length ? cores[0].img : p.imgs[0];
  const coresHtml = cores.length ? `<div class="maq__cores"><span>Cor:</span>${cores.map((c, j) =>
    `<button type="button" aria-pressed="${j === 0}" aria-label="${c.nome}" title="${c.nome}" data-cor="${c.nome}" data-img="${img(c.img)}" style="--c:${corHex[c.nome]}"></button>`).join("")}<b class="maq__cor-nome">${cores[0].nome}</b></div>` : "";
  return `<article class="maq rv" data-cat="${p.cat}" data-id="${p.id}"${cores.length ? ` data-cor="${cores[0].nome}"` : ""} style="--i:${i % 3}">
        <span class="maq__num">[${String(i + 1).padStart(2, "0")}]</span>
        ${p.modelo ? `<span class="maq__selo">${esc(p.modelo)}</span>` : ""}
        <div class="maq__foto"><img src="${img(foto)}" alt="${esc(p.nome)}" loading="lazy" decoding="async"></div>
        <div class="maq__corpo">
          <h3>${esc(p.nome)}</h3>
          ${p.destaque ? `<div class="maq__extra">${esc(p.destaque)}</div>` : ""}
          ${p.medidas ? `<div class="maq__med"><span>Altura <b>${p.medidas.altura}</b></span><span>Largura <b>${p.medidas.largura}</b></span><span>Compr. <b>${p.medidas.comprimento}</b></span></div>` : ""}
          ${coresHtml}
          <div class="maq__rodape">
            <div class="preco"><small>Preço</small>${brl(p.preco)}</div>
            <button class="btn btn--peq" type="button" data-orc="${p.id}">Orçamento</button>
          </div>
        </div>
      </article>`;
};

// ---- Cards de peças
const msgPeca = (p, cor) => `Olá! Vi no site e quero ${p.tipo === "equipamento" ? "o equipamento" : "a peça"} *${p.nome}*${cor ? ` na cor *${cor}*` : ""} (${brl(p.preco)}).`;
const coresPeca = p => p.cores ? `<div class="peca__cores"><span>Cor:</span>${p.cores.map((c, j) =>
    `<button type="button" aria-pressed="${j === 0}" aria-label="${c.nome}" title="${c.nome}" data-cor="${c.nome}" data-img="${img(c.img)}" data-wa="${esc(wa(msgPeca(p, c.nome)))}" style="--c:${corHex[c.nome]}"></button>`).join("")}<b class="peca__cor-nome">${p.cores[0].nome}</b></div>` : "";
const cardPeca = (p, i) => `<article class="peca rv" data-tipo="${p.tipo}"${p.cores ? ` data-cor="${p.cores[0].nome}"` : ""} data-busca="${esc((p.nome + " " + (p.servePara || "") + " " + (p.destaque || "")).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""))}"${i >= 10 ? " data-extra hidden" : ""} style="--i:${i % 4}">
        <div class="peca__foto"><img src="${img(p.cores ? p.cores[0].img : p.imgs[0])}" alt="${esc(p.nome)}" loading="lazy" decoding="async"></div>
        <div class="peca__corpo">
          <h3>${esc(p.nome)}</h3>
          ${p.destaque ? `<div class="serve">${esc(p.destaque)}</div>` : ""}
          ${p.servePara ? `<div class="serve">Serve para: <b>${esc(p.servePara)}</b></div>` : ""}
          ${p.variantes ? `<div class="var">${p.variantes.map(v => `${esc(v.nome)}: ${brl(v.preco)}`).join(" · ")}</div>` : ""}
          ${coresPeca(p)}
          <div class="preco">${p.variantes ? "<small>a partir de</small>" : ""}${brl(p.preco)}</div>
          <span class="peca__tipo">${p.tipo === "equipamento" ? "Equipamento" : "Peça"}</span>
          <a class="peca__pedir" href="${wa(msgPeca(p, p.cores && p.cores[0].nome))}" target="_blank" rel="noopener" aria-label="Pedir ${esc(p.nome)} no WhatsApp">Pedir ${ICO.seta}</a>
        </div>
      </article>`;

// ---- Vídeos (fachada: só a capa carrega)
const escolhidos = ["maquina-a2-com-kit", "teste-afiacao-controle-velocidade", "dica-como-usar-maquina", "maquina-afiar-tesoura-faca"];
const dur = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
const vids = escolhidos.map(id => V.videos.find(v => v.id === id)).filter(Boolean);
const cardVid = (v, i) => `<button class="vid rv" type="button" style="--i:${i}" data-src="/videos/${v.arquivo}" data-titulo="${esc(v.titulo)}">
        <img src="/videos/${v.capa}" alt="" loading="lazy" decoding="async">
        <span class="play">${ICO.play}</span>
        <span class="info"><b>${esc(v.titulo)}</b><span>${dur(v.duracao)} · Assistir</span></span>
      </button>`;

// ---- Chips de categorias (só as que têm máquinas)
const cats = D.categorias.filter(c => maquinas.some(p => p.cat === c.id));
const chips = cats.map(c => `<button class="chip" type="button" aria-pressed="false" data-f="${c.id}">${esc(c.nome.replace(/^Afiar /, "").replace(/^./, m => m.toUpperCase()))}</button>`).join("\n        ");

// ---- Opções do formulário
const opcoes = `<optgroup label="Máquinas">${maquinas.map(p => `<option value="${p.id}">${esc(p.nome)} · ${brl(p.preco)}</option>`).join("")}</optgroup>
          <optgroup label="Equipamentos">${equips.map(p => `<option value="${p.id}">${esc(p.nome)} · ${brl(p.preco)}</option>`).join("")}</optgroup>
          <optgroup label="Peças">${pecas.map(p => `<option value="${p.id}">${esc(p.nome)} · ${brl(p.preco)}</option>`).join("")}</optgroup>`;

// ---- Dados para o JS
const dados = {
  whatsapp: WA,
  produtos: Object.fromEntries(D.produtos.map(p => [p.id, {
    nome: p.nome, preco: brl(p.preco), tipo: p.tipo,
    img: img((p.cores && p.cores[0].img) || p.imgs[0]),
    cores: (p.cores || []).map(c => ({ nome: c.nome, img: img(c.img) }))
  }]))
};

// ---- Dados estruturados (Google)
const jsonld = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Store", "@id": "https://www.alemaoafiacao.com.br/#loja", name: "Alemão Afiação",
      legalName: C.razaoSocial, taxID: C.cnpj,
      url: "https://www.alemaoafiacao.com.br/", logo: "https://www.alemaoafiacao.com.br/assets/img/logo-v.webp",
      image: "https://www.alemaoafiacao.com.br/assets/img/og.jpg", telephone: "+" + C.whatsapp,
      address: { "@type": "PostalAddress", streetAddress: `${C.rua}, ${C.bairro}`, addressLocality: C.cidade.split("/")[0], addressRegion: C.cidade.split("/")[1], postalCode: C.cep, addressCountry: "BR" },
      openingHoursSpecification: [{ "@type": "OpeningHoursSpecification", dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], opens: C.horarioAbre, closes: C.horarioFecha }],
      sameAs: [C.instagram, C.facebook, C.youtube]
    },
    {
      "@type": "ItemList", name: "Máquinas de afiação Alemão",
      itemListElement: maquinas.map((p, i) => ({
        "@type": "ListItem", position: i + 1,
        item: { "@type": "Product", name: p.nome, brand: { "@type": "Brand", name: "Alemão" }, image: "https://www.alemaoafiacao.com.br" + img(p.imgs[0]),
          offers: { "@type": "Offer", price: p.preco.toFixed(2), priceCurrency: "BRL", url: "https://www.alemaoafiacao.com.br/#maquinas", seller: { "@id": "https://www.alemaoafiacao.com.br/#loja" } } }
      }))
    }
  ]
};

const [y, m, d] = D.atualizado.split("-");
const versao = Date.now().toString(36);
const precoMinPeca = Math.min(...acess.map(p => p.preco));

html = html
  .replace("{{MAQUINAS}}", maquinas.map(cardMaq).join("\n      "))
  .replace("{{PECAS}}", acess.map(cardPeca).join("\n      "))
  .replace("{{VIDEOS}}", vids.map(cardVid).join("\n      "))
  .replace("{{CHIPS}}", chips)
  .replace("{{MAPA}}", fs.readFileSync(path.join(raiz, "src/mapa.html"), "utf8"))
  .replace("{{OPCOES}}", opcoes)
  .replace("{{JSONLD}}", JSON.stringify(jsonld).replace(/</g, "\\u003c"))
  .replace("{{DADOS}}", JSON.stringify(dados).replace(/</g, "\\u003c"))
  .replace(/{{VERSAO}}/g, versao)
  .replace(/{{N_MAQ}}/g, maquinas.length)
  .replace(/{{N_PECAS}}/g, pecas.length)
  .replace(/{{N_EQUIP}}/g, equips.length)
  .replace(/{{N_ACESS}}/g, acess.length)
  .replace(/{{ATUALIZADO}}/g, `${d}/${m}/${y}`)
  .replace(/{{preco_min_peca}}/g, brl(precoMinPeca))
  .replace(/{{preco:([\w-]+)}}/g, (_, id) => brl(P[id].preco))
  .replace(/{{img:([\w-]+)}}/g, (_, id) => img((P[id].cores && P[id].cores[0].img) || P[id].imgs[0]))
  .replace(/{{imgv:([\w-]+)}}/g, (_, id) => img(((P[id].cores || []).find(c => c.nome === "Verde") || {}).img || (P[id].cores && P[id].cores[0].img) || P[id].imgs[0]))
  .replace(/{{med:([\w-]+)}}/g, (_, id) => med(P[id]))
  .replace(/{{wa:([^}]+)}}/g, (_, t) => esc(wa(t)))
  .replace(/{{ico:(\w+)}}/g, (_, k) => ICO[k]);

const sobra = html.match(/{{[^}]+}}/g);
if (sobra) { console.error("Marcadores sem valor:", sobra); process.exit(1); }
fs.writeFileSync(path.join(raiz, "public/index.html"), html);
console.log(`ok · ${maquinas.length} máquinas · ${pecas.length} peças · ${vids.length} vídeos · ${Math.round(html.length / 1024)} KB`);

// ---- Páginas legais
const base = preencher(fs.readFileSync(path.join(raiz, "src/legal/_base.html"), "utf8"));
[
  { slug: "privacidade", titulo: "Política de Privacidade", rotulo: "Privacidade", desc: "Como a Alemão® trata dados pessoais no site e no atendimento pelo WhatsApp (LGPD)." },
  { slug: "termos", titulo: "Termos e condições de venda", rotulo: "Termos de venda", desc: "Como comprar, preços, pagamento, entrega, direito de arrependimento e garantia dos produtos Alemão®." }
].forEach(pg => {
  const corpo = preencher(fs.readFileSync(path.join(raiz, `src/legal/${pg.slug}.html`), "utf8"));
  const out = base.replace(/{{TITULO}}/g, pg.titulo).replace("{{DESC}}", pg.desc).replace("{{SLUG}}", pg.slug)
    .replace("{{ROTULO}}", pg.rotulo).replace("{{VERSAO}}", versao).replace("{{DATA}}", "05/11/2026").replace("{{CORPO}}", corpo);
  fs.mkdirSync(path.join(raiz, "public", pg.slug), { recursive: true });
  fs.writeFileSync(path.join(raiz, "public", pg.slug, "index.html"), out);
  console.log("ok ·", pg.slug);
});

// ---- Link na bio, catálogo, vídeos e 404 (mesmos dados)
const cardsCat = D.categorias.map((c, i) => {
  const itens = D.produtos.filter(p => p.cat === c.id); if (!itens.length) return "";
  const p0 = itens[0], foto = img((p0.cores && p0.cores[0].img) || p0.imgs[0]);
  const modelos = itens.map(p => p.modelo).filter(Boolean);
  const sub = modelos.length ? (modelos.length > 1 ? "Modelos " + modelos.slice(0, -1).join(", ") + " e " + modelos.at(-1) : "Modelo " + modelos[0]) : `${itens.length} itens`;
  const tipoTxt = c.id === "pecas" ? "as peças de reposição" : c.id === "equipamentos" ? "os equipamentos"
    : itens.length === 1 ? "a " + p0.nome : "as máquinas de " + c.nome.toLowerCase().replace(/^máquinas? (de )?/, "");
  return `    <a class="cat anima" style="--i:${8 + i}" data-wa="${esc(`Olá! Vim pelo Instagram e quero saber sobre ${tipoTxt}.`)}" href="#">
      <img src="${foto}" alt="${esc(c.nome)}" loading="lazy">
      <span>${esc(c.nome)}<em>${esc(sub)}</em></span>
    </a>`;
}).join("\n");
for (const [src, dst, extra] of [["src/links.html", "public/links/index.html", t => t.replace("{{LINKS_CATS}}", cardsCat)],
                                 ["src/catalogo.html", "public/catalogo/index.html"], ["src/videos.html", "public/videos/index.html"], ["src/404.html", "public/404.html"]]) {
  let t = preencher(fs.readFileSync(path.join(raiz, src), "utf8")).replace(/{{VERSAO}}/g, versao);
  if (extra) t = extra(t);
  const resto = t.match(/{{[^}]+}}/g); if (resto) { console.error(src, "marcadores sem valor:", resto); process.exit(1); }
  fs.writeFileSync(path.join(raiz, dst), t); console.log("ok ·", dst.replace("public/", ""));
}
