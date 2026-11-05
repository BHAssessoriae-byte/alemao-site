/* Alemão® · interações do site · sem cookies, sem rastreadores */
(() => {
  "use strict";
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const D = JSON.parse($("#dados").textContent);
  const reduz = matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.documentElement.classList.add("js");
  const waUrl = t => `https://wa.me/${D.whatsapp}?text=${encodeURIComponent(t)}`;
  const abrirWa = t => { const w = window.open(waUrl(t), "_blank", "noopener"); if (!w) location.href = waUrl(t); };

  /* ---------- Header: fundo, esconder ao descer, progresso, link ativo ---------- */
  const header = $("#header"), barra = $(".progresso"), waFlut = $(".wa-flut");
  let ultimoY = 0, tic = false;
  const aoRolar = () => {
    const y = scrollY, h = document.documentElement.scrollHeight - innerHeight;
    header.classList.toggle("solido", y > 40);
    header.classList.toggle("escondido", y > 500 && y > ultimoY + 4 && !document.body.classList.contains("menu-aberto"));
    if (y < ultimoY - 4) header.classList.remove("escondido");
    barra.style.transform = `scaleX(${h > 0 ? y / h : 0})`;
    waFlut.classList.toggle("vis", y > innerHeight * .6);
    ultimoY = y; tic = false;
  };
  addEventListener("scroll", () => { if (!tic) { tic = true; requestAnimationFrame(aoRolar); } }, { passive: true });
  aoRolar();

  const links = $$(".nav a");
  const ioNav = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) links.forEach(a => a.classList.toggle("ativo", a.getAttribute("href") === "#" + e.target.id));
  }), { rootMargin: "-45% 0px -50% 0px" });
  $$("main section[id]").forEach(s => ioNav.observe(s));

  /* ---------- Menu mobile ---------- */
  const hamb = $(".hamb");
  const menu = aberto => {
    document.body.classList.toggle("menu-aberto", aberto);
    hamb.setAttribute("aria-expanded", aberto);
    hamb.setAttribute("aria-label", aberto ? "Fechar menu" : "Abrir menu");
  };
  hamb.addEventListener("click", () => menu(!document.body.classList.contains("menu-aberto")));
  $$("#menu-mob a").forEach(a => a.addEventListener("click", () => menu(false)));

  /* ---------- Revelação ao rolar ---------- */
  if ("IntersectionObserver" in window && !reduz) {
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { const el = e.target; el.classList.add("vis"); io.unobserve(el); setTimeout(() => el.classList.remove("rv", "vis"), 1400); }
    }), { rootMargin: "0px 0px -6% 0px", threshold: .05 });
    $$(".rv").forEach(el => io.observe(el));
  } else $$(".rv").forEach(el => el.classList.add("vis"));

  /* ---------- Contadores (partem de 70% do valor, nunca de zero) ---------- */
  const ioConta = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    ioConta.unobserve(e.target);
    const el = e.target, fim = +el.dataset.conta, ini = Math.round(fim * .7), t0 = performance.now(), dur = 1100;
    if (reduz || !fim) return;
    const passo = t => { const k = Math.min(1, (t - t0) / dur), ease = 1 - Math.pow(1 - k, 3);
      el.textContent = Math.round(ini + (fim - ini) * ease); if (k < 1) requestAnimationFrame(passo); };
    requestAnimationFrame(passo);
  }), { threshold: .6 });
  $$("[data-conta]").forEach(el => ioConta.observe(el));

  /* ---------- Efeito onda nos botões ---------- */
  document.addEventListener("pointerdown", ev => {
    const b = ev.target.closest(".btn"); if (!b || reduz) return;
    const r = b.getBoundingClientRect(), s = Math.max(r.width, r.height), o = document.createElement("span");
    o.className = "onda"; o.style.cssText = `width:${s}px;height:${s}px;left:${ev.clientX - r.left - s / 2}px;top:${ev.clientY - r.top - s / 2}px`;
    b.appendChild(o); setTimeout(() => o.remove(), 650);
  });

  /* ---------- Hero: troca de cor laranja / verde ---------- */
  const fotosHero = $$(".hero__bg img");
  $$(".cor-btn").forEach(b => b.addEventListener("click", () => {
    $$(".cor-btn").forEach(x => x.setAttribute("aria-pressed", x === b));
    fotosHero.forEach(im => {
      if (im.dataset.cor === b.dataset.cor && im.dataset.src) { im.srcset = im.dataset.srcset; im.src = im.dataset.src; delete im.dataset.src; }
      im.classList.toggle("ativa", im.dataset.cor === b.dataset.cor);
    });
    // mesma cor nos cards de máquinas
    $$(`.maq__cores button[data-cor="${b.dataset.cor}"]`).forEach(x => x.click());
  }));
  // pré-carrega a versão verde quando o navegador estiver livre
  setTimeout(() => { const v = fotosHero.find(i => i.dataset.src); if (v) { const p = new Image(); p.srcset = v.dataset.srcset; p.sizes = "100vw"; p.src = v.dataset.src; } }, 2500);

  /* ---------- Máquinas: filtro e cores ---------- */
  const cards = $$(".maq");
  $$(".chip").forEach(c => c.addEventListener("click", () => {
    $$(".chip").forEach(x => x.setAttribute("aria-pressed", x === c));
    const f = c.dataset.f;
    cards.forEach(card => {
      const mostra = f === "todas" || card.dataset.cat === f || card.dataset.cat === "ajuda";
      if (mostra && card.hidden) { card.hidden = false; card.classList.add("saindo"); requestAnimationFrame(() => requestAnimationFrame(() => card.classList.remove("saindo"))); card.classList.add("vis"); }
      else if (!mostra && !card.hidden) { card.classList.add("saindo"); setTimeout(() => { card.hidden = true; card.classList.remove("saindo"); }, reduz ? 0 : 280); }
    });
  }));
  cards.forEach(card => $$(".maq__cores button", card).forEach(b => b.addEventListener("click", () => {
    if (b.getAttribute("aria-pressed") === "true") return;
    $$(".maq__cores button", card).forEach(x => x.setAttribute("aria-pressed", x === b));
    $(".maq__cor-nome", card).textContent = b.dataset.cor;
    card.dataset.cor = b.dataset.cor;
    const im = $(".maq__foto img", card); im.classList.add("troca");
    setTimeout(() => { im.src = b.dataset.img; im.onload = () => im.classList.remove("troca"); }, reduz ? 0 : 200);
  })));

  /* ---------- Qual escolher ---------- */
  const itens = $$(".lista-esc li"), vit = $(".vitrine"), fotosV = $$(".vitrine img.prod"), info = $(".vitrine__info");
  let vAtual = 0;
  itens.forEach(li => {
    const ativar = () => {
      if (li.classList.contains("ativo")) return;
      itens.forEach(x => { x.classList.toggle("ativo", x === li); $("button", x).setAttribute("aria-expanded", x === li); });
      const prox = fotosV[1 - vAtual]; prox.src = li.dataset.img;
      prox.onload = () => { fotosV[vAtual].classList.remove("ativa"); prox.classList.add("ativa"); vAtual = 1 - vAtual; };
      info.innerHTML = `<b></b><span></span>`; $("b", info).textContent = li.dataset.nome; $("span", info).textContent = li.dataset.preco;
    };
    $("button", li).addEventListener("click", ativar);
    if (matchMedia("(hover:hover)").matches) li.addEventListener("mouseenter", ativar);
  });

  /* ---------- Peças: busca e ver mais ---------- */
  const pecas = $$(".peca"), maisBtn = $("#mais-pecas"), vazio = $("#grade-pecas .vazio"), busca = $("#busca-peca");
  let todas = false;
  const norm = s => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const filtraPecas = () => {
    const q = norm(busca.value.trim()); let n = 0;
    pecas.forEach(p => { const ok = q ? p.dataset.busca.includes(q) : (todas || !p.hasAttribute("data-extra")); p.hidden = !ok; if (ok) { n++; p.classList.add("vis"); } });
    vazio.hidden = n > 0; maisBtn.hidden = todas || !!q;
  };
  busca.addEventListener("input", filtraPecas);
  maisBtn.addEventListener("click", () => { todas = true; filtraPecas(); });

  /* ---------- Modais ---------- */
  let focoAntes = null;
  const abrir = m => { focoAntes = document.activeElement; m.hidden = false; requestAnimationFrame(() => m.classList.add("aberto")); document.body.style.overflow = "hidden"; setTimeout(() => ($("input:not([type=hidden]),video,button", m) || m).focus({ preventScroll: true }), 60); };
  const fechar = m => { m.classList.remove("aberto"); document.body.style.overflow = ""; setTimeout(() => { m.hidden = true; const v = $("video", m); if (v) { v.pause(); v.removeAttribute("src"); v.load(); } }, 300); if (focoAntes) focoAntes.focus({ preventScroll: true }); };
  $$(".modal").forEach(m => $$("[data-fechar]", m).forEach(b => b.addEventListener("click", () => fechar(m))));
  addEventListener("keydown", e => { if (e.key === "Escape") { $$(".modal.aberto").forEach(fechar); menu(false); } });

  /* ---------- Orçamento ---------- */
  const mOrc = $("#modal-orc"), fModal = $("#form-modal"), fPag = $("#form-orc");
  const mostraCores = (fs, prod, corPadrao) => {
    const tem = prod && prod.cores.length > 1; fs.hidden = !tem;
    $$("input[name=cor]", fs).forEach(r => { r.checked = r.value === (tem ? (corPadrao || "Tanto faz") : "Tanto faz"); });
  };
  $$("[data-orc]").forEach(b => b.addEventListener("click", () => {
    const id = b.dataset.orc, p = D.produtos[id], card = b.closest(".maq");
    const cor = card && card.dataset.cor;
    fModal.produto.value = id;
    $("#mo-titulo").textContent = p.nome; $("#mo-preco").textContent = p.preco;
    const c = p.cores.find(x => x.nome === cor); $("#mo-img").src = c ? c.img : p.img;
    mostraCores($("#m-cores", mOrc), p, cor || p.cores[0]?.nome);
    abrir(mOrc);
  }));
  $("#o-maq").addEventListener("change", e => mostraCores($("#o-cores"), D.produtos[e.target.value]));

  const montar = f => {
    const nome = f.nome.value.trim(), cidade = f.cidade.value.trim();
    let ok = true;
    [f.nome, f.cidade].forEach(i => { const v = !!i.value.trim(); i.setAttribute("aria-invalid", !v); if (!v && ok) { i.focus(); ok = false; } });
    if (!ok) return null;
    const p = D.produtos[f.produto.value];
    const cor = (f.querySelector("input[name=cor]:checked") || {}).value;
    const uso = (f.querySelector("input[name=uso]:checked") || {}).value;
    const obs = f.obs.value.trim();
    const l = ["Olá! Quero um orçamento pelo site alemaoafiacao.com.br", ""];
    l.push(p ? `*${p.tipo === "maquina" ? "Máquina" : "Peça"}:* ${p.nome} (${p.preco})` : "*Máquina:* ainda não sei, quero ajuda para escolher");
    if (p && p.cores.length > 1 && cor) l.push(`*Cor:* ${cor}`);
    l.push(`*Nome:* ${nome}`, `*Cidade:* ${cidade}`);
    if (uso) l.push(`*Uso:* ${uso}`);
    if (obs) l.push(`*Observação:* ${obs}`);
    return l.join("\n");
  };
  [fModal, fPag].forEach(f => {
    f.addEventListener("submit", e => { e.preventDefault(); const t = montar(f); if (!t) return; abrirWa(t); if (f === fModal) fechar(mOrc); });
    $$("input[required]", f).forEach(i => i.addEventListener("input", () => i.removeAttribute("aria-invalid")));
  });

  /* ---------- Vídeos ---------- */
  const mVid = $("#modal-vid"), video = $("video", mVid);
  $$(".vid").forEach(b => b.addEventListener("click", () => {
    video.src = b.dataset.src; $(".rod b", mVid).textContent = b.dataset.titulo;
    $(".rod a", mVid).href = waUrl(`Olá! Vi o vídeo *${b.dataset.titulo}* no site e quero saber mais.`);
    abrir(mVid); video.play().catch(() => {});
  }));

  /* ---------- Ano no rodapé ---------- */
  $$("[data-ano]").forEach(el => el.textContent = new Date().getFullYear());
})();
