const reduz = matchMedia("(prefers-reduced-motion: reduce)").matches;
const mmss = s => `${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`;
let D, ordem = [], atual = -1;

function montar(){
  const lista = document.getElementById("lista"), chips = document.getElementById("chips");
  chips.innerHTML = `<button class="chip ativo" data-cat="todos">Todos <b>${D.videos.length}</b></button>` +
    D.categorias.map(c => `<button class="chip" data-cat="${c.id}">${c.nome} <b>${D.videos.filter(v=>v.cat===c.id).length}</b></button>`).join("");
  D.categorias.forEach(c => {
    const itens = D.videos.filter(v => v.cat === c.id); if (!itens.length) return;
    const sec = document.createElement("section"); sec.className = "cat"; sec.dataset.cat = c.id;
    sec.innerHTML = `<h2><i>///</i>${c.nome} <small>${itens.length} ${itens.length>1?"vídeos":"vídeo"}</small></h2><div class="grade"></div>`;
    const g = sec.querySelector(".grade");
    itens.forEach(v => {
      const i = ordem.push(v) - 1;
      const b = document.createElement("button"); b.className = "video"; b.type = "button";
      b.innerHTML = `<div class="capa"><img src="${v.capa}" alt="" loading="lazy"><span class="dur">${mmss(v.duracao)}</span>
        <span class="play"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 4.5v15l13-7.5z"/></svg></span>
        <span class="titulo">${v.titulo}</span></div>`;
      b.addEventListener("click", () => abrir(i)); g.appendChild(b);
    });
    lista.appendChild(sec);
  });
  chips.addEventListener("click", e => {
    const b = e.target.closest(".chip"); if (!b) return;
    chips.querySelectorAll(".chip").forEach(x => x.classList.toggle("ativo", x === b));
    document.querySelectorAll("section.cat").forEach(s => s.hidden = !(b.dataset.cat === "todos" || s.dataset.cat === b.dataset.cat));
    document.querySelectorAll(".video").forEach(v => v.classList.add("visivel"));
    b.scrollIntoView({ inline: "center", block: "nearest" });
  });
  document.getElementById("yt").href = D.youtube;
  revelar();
}

function abrir(i){
  atual = (i + ordem.length) % ordem.length; const v = ordem[atual];
  const tela = document.getElementById("tela");
  tela.poster = v.capa; tela.src = v.arquivo; tela.play().catch(() => {});
  document.getElementById("pTitulo").textContent = v.titulo;
  document.getElementById("pPedir").href = `https://wa.me/${D.whatsapp}?text=${encodeURIComponent(`Olá! Vi o vídeo *${v.titulo}* no site e quero saber mais.`)}`;
  document.getElementById("player").classList.add("aberto"); document.body.style.overflow = "hidden";
  history.replaceState(null, "", "#" + v.id);
}
function fechar(){
  const tela = document.getElementById("tela"); tela.pause(); tela.removeAttribute("src"); tela.load();
  document.getElementById("player").classList.remove("aberto"); document.body.style.overflow = "";
  history.replaceState(null, "", location.pathname);
}
document.getElementById("fechar").onclick = fechar;
document.getElementById("ant").onclick = () => abrir(atual - 1);
document.getElementById("prox").onclick = () => abrir(atual + 1);
document.getElementById("player").addEventListener("click", e => { if (e.target.id === "player") fechar(); });
addEventListener("keydown", e => {
  if (atual < 0 || !document.getElementById("player").classList.contains("aberto")) return;
  if (e.key === "Escape") fechar(); if (e.key === "ArrowRight") abrir(atual + 1); if (e.key === "ArrowLeft") abrir(atual - 1);
});
// deslizar para o lado troca de vídeo
let x0 = null;
document.querySelector(".caixa").addEventListener("touchstart", e => x0 = e.touches[0].clientX, { passive: true });
document.querySelector(".caixa").addEventListener("touchend", e => {
  if (x0 === null) return; const dx = e.changedTouches[0].clientX - x0; x0 = null;
  if (Math.abs(dx) > 70) abrir(atual + (dx < 0 ? 1 : -1));
});

function revelar(){
  const els = document.querySelectorAll(".video");
  if (reduz || !("IntersectionObserver" in window)) { els.forEach(c => c.classList.add("visivel")); return; }
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return; const c = e.target, i = [...c.parentNode.children].indexOf(c) % 4;
    c.style.transitionDelay = (i * 70) + "ms"; c.classList.add("visivel"); io.unobserve(c);
    setTimeout(() => c.style.transitionDelay = "", 900);
  }), { rootMargin: "0px 0px -40px 0px" });
  els.forEach(c => io.observe(c));
}

fetch("videos.json").then(r => r.json()).then(d => {
  D = d; montar();
  const h = location.hash.slice(1); const i = ordem.findIndex(v => v.id === h); if (i >= 0) abrir(i);
});
