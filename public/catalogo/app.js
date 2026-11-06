const WA_ICON = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2c-1.5 0-3-.4-4.3-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.2 2.2 2.2 0 0 0 .2-1.2c-.1-.1-.3-.2-.6-.3Z"/></svg>';
const brl = v => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const sem = s => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const reduz = matchMedia("(prefers-reduced-motion: reduce)").matches;
let DADOS, filtro = "todos";

function waLink(texto){ return `https://wa.me/${DADOS.whatsapp}?text=${encodeURIComponent(texto)}`; }
function mensagem(p, variante){
  const preco = brl(variante ? variante.preco : p.preco);
  const v = variante ? ` – ${variante.nome}` : "";
  return p.tipo === "maquina"
    ? `Olá! Vi no catálogo online e tenho interesse na *${p.nome}* (${preco}).`
    : p.tipo === "equipamento" ? `Olá! Vi no catálogo online e quero o equipamento *${p.nome}${v}* (${preco}).`
    : `Olá! Vi no catálogo online e quero a peça *${p.nome}${v}* (${preco}).`;
}

function card(p){
  const el = document.createElement("article");
  el.className = "card"; el.dataset.busca = sem([p.nome, p.modelo || "", p.servePara || "", p.destaque || "", ...(p.variantes || []).map(v => v.nome)].join(" "));
  const med = p.medidas ? `<div class="medidas">
      <span>Altura <b>${p.medidas.altura}</b></span><span>Largura <b>${p.medidas.largura}</b></span><span>Comprimento <b>${p.medidas.comprimento}</b></span></div>` : "";
  const cores = p.imgs.length > 1 ? `<div class="cores">${p.imgs.map((s,i)=>`<button type="button" aria-label="Ver foto ${i+1}" class="${i?"":"ativo"}" style="background-image:url('${s}')" data-i="${i}"></button>`).join("")}</div>` : "";
  const variantes = p.variantes ? `<div class="variantes">${p.variantes.map((v,i)=>`<button type="button" class="${i?"":"ativo"}" data-i="${i}">${v.nome}</button>`).join("")}</div>` : "";
  el.innerHTML = `
    <div class="foto">
      ${p.modelo ? `<span class="selo">${p.modelo}</span>` : ""}
      <img src="${p.imgs[0]}" alt="${p.nome}" loading="lazy" decoding="async">
      ${cores}
    </div>
    <div class="info">
      <h3>${p.nome}</h3>
      ${p.destaque ? `<div class="extra">${p.destaque}</div>` : ""}
      ${p.servePara ? `<div class="serve">Serve para: <b>${p.servePara}</b></div>` : ""}
      ${med}${variantes}
      <div class="preco"><small>R$</small>${brl(p.preco).replace("R$","").trim()}</div>
      <a class="pedir" target="_blank" rel="noopener" href="${waLink(mensagem(p))}">${WA_ICON}Pedir no WhatsApp</a>
    </div>`;
  // trocar foto / cor
  const img = el.querySelector(".foto img");
  el.querySelectorAll(".cores button").forEach(b => b.addEventListener("click", () => {
    el.querySelectorAll(".cores button").forEach(x => x.classList.toggle("ativo", x === b));
    img.classList.add("troca");
    setTimeout(() => { img.src = p.imgs[+b.dataset.i]; img.onload = () => img.classList.remove("troca"); }, 160);
  }));
  // variantes (ex.: com ou sem correia)
  const pedir = el.querySelector(".pedir"), preco = el.querySelector(".preco");
  el.querySelectorAll(".variantes button").forEach(b => b.addEventListener("click", () => {
    el.querySelectorAll(".variantes button").forEach(x => x.classList.toggle("ativo", x === b));
    const v = p.variantes[+b.dataset.i];
    preco.innerHTML = `<small>R$</small>${brl(v.preco).replace("R$","").trim()}`;
    pedir.href = waLink(mensagem(p, v));
  }));
  return el;
}

function comparativo(){
  const a1 = DADOS.produtos.find(p=>p.id==="a1"), a2 = DADOS.produtos.find(p=>p.id==="a2");
  const d = document.createElement("div"); d.className = "compara card";
  d.innerHTML = `<h4><i>//</i> Diferença entre A1 e A2</h4>
    <table><thead><tr><th></th><th>A1</th><th>A2</th></tr></thead><tbody>
      <tr><td>Preço</td><td>${brl(a1.preco)}</td><td>${brl(a2.preco)}</td></tr>
      <tr><td>Controlador de velocidade</td><td>Não</td><td>Sim</td></tr>
      <tr><td>Altura</td><td>${a1.medidas.altura}</td><td>${a2.medidas.altura}</td></tr>
      <tr><td>Largura × comprimento</td><td>${a1.medidas.largura} × ${a1.medidas.comprimento}</td><td>${a2.medidas.largura} × ${a2.medidas.comprimento}</td></tr>
      <tr><td>Eixo mancal</td><td>Sem rebolo com balanceador</td><td>Simples</td></tr>
      <tr><td>Kit rampa</td><td>Completo</td><td>Simples</td></tr>
    </tbody></table>`;
  return d;
}

function montar(){
  const lista = document.getElementById("lista"), chips = document.getElementById("chips");
  chips.innerHTML = `<button class="chip ativo" data-cat="todos">Tudo <b>${DADOS.produtos.length}</b></button>` +
    DADOS.categorias.map(c => `<button class="chip" data-cat="${c.id}">${c.nome} <b>${DADOS.produtos.filter(p=>p.cat===c.id).length}</b></button>`).join("");
  DADOS.categorias.forEach(c => {
    const itens = DADOS.produtos.filter(p => p.cat === c.id);
    const sec = document.createElement("section"); sec.className = "cat"; sec.id = c.id; sec.dataset.cat = c.id;
    sec.innerHTML = `<h2><i>///</i>${c.nome} <small>${itens.length} ${itens.length>1?"itens":"item"}</small></h2>`;
    const g = document.createElement("div"); g.className = "grade" + ((c.id === "pecas" || c.id === "equipamentos") ? " pecas" : "");
    itens.forEach(p => g.appendChild(card(p)));
    sec.appendChild(g);
    if (c.id === "alicate") sec.appendChild(comparativo());
    lista.appendChild(sec);
  });
  chips.addEventListener("click", e => {
    const b = e.target.closest(".chip"); if (!b) return;
    filtro = b.dataset.cat;
    chips.querySelectorAll(".chip").forEach(x => x.classList.toggle("ativo", x === b));
    b.scrollIntoView({ inline: "center", block: "nearest", behavior: reduz ? "auto" : "smooth" });
    aplicar(); window.scrollTo({ top: document.getElementById("lista").offsetTop - 130, behavior: reduz ? "auto" : "smooth" });
  });
  document.getElementById("busca").addEventListener("input", aplicar);
  document.getElementById("flutua").href = waLink("Olá! Vi o catálogo online e gostaria de mais informações.");
  observar(); ondas();
}

function aplicar(){
  const q = sem(document.getElementById("busca").value.trim());
  let total = 0;
  document.querySelectorAll("section.cat").forEach(sec => {
    let n = 0;
    sec.querySelectorAll(".grade .card").forEach(c => {
      const ok = (filtro === "todos" || sec.dataset.cat === filtro) && (!q || c.dataset.busca.includes(q));
      c.hidden = !ok; if (ok) { n++; c.classList.add("visivel"); }
    });
    const comp = sec.querySelector(".compara"); if (comp) comp.hidden = !!q || !(filtro==="todos"||filtro===sec.dataset.cat);
    sec.hidden = n === 0; total += n;
  });
  document.getElementById("vazio").hidden = total > 0;
}

function observar(){
  const cards = document.querySelectorAll(".card");
  if (reduz || !("IntersectionObserver" in window)) { cards.forEach(c => c.classList.add("visivel")); return; }
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { const c = e.target; const i = [...c.parentNode.children].indexOf(c) % 4;
      c.style.transitionDelay = (i * 70) + "ms"; c.classList.add("visivel"); io.unobserve(c);
      setTimeout(() => c.style.transitionDelay = "", 900); }
  }), { rootMargin: "0px 0px -40px 0px" });
  cards.forEach(c => io.observe(c));
  // botão flutuante aparece depois de rolar
  const f = document.getElementById("flutua");
  addEventListener("scroll", () => f.classList.toggle("mostra", scrollY > 380), { passive: true });
}

function ondas(){
  document.addEventListener("pointerdown", e => {
    const el = e.target.closest(".pedir"); if (!el || reduz) return;
    const r = el.getBoundingClientRect(), o = document.createElement("span");
    o.className = "onda"; o.style.left = (e.clientX - r.left) + "px"; o.style.top = (e.clientY - r.top) + "px";
    el.appendChild(o); o.addEventListener("animationend", () => o.remove());
    if (navigator.vibrate) navigator.vibrate(8);
  });
}

fetch("produtos.json").then(r => r.json()).then(d => { d.produtos.forEach(p => { if (p.cores) p.imgs = p.cores.map(c => c.img); p.imgs = p.imgs.map(s => s.replace("img/", "img/borda/")); /* catálogo: fotos com contorno branco */ }); DADOS = d; montar(); });
