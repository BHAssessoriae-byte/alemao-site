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

  /* ---------- Títulos palavra por palavra ---------- */
  if (!reduz) $$("main h2").forEach(h => {
    let n = 0;
    const quebra = el => [...el.childNodes].forEach(no => {
      if (no.nodeType === 3) {
        const frag = document.createDocumentFragment();
        no.textContent.split(/(\s+)/).forEach(p => {
          if (!p) return;
          if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(" ")); return; }
          const w = document.createElement("span"); w.className = "w"; w.setAttribute("aria-hidden", "true");
          const i = document.createElement("span"); i.textContent = p; i.style.setProperty("--w", n++);
          w.appendChild(i); frag.appendChild(w);
        });
        no.replaceWith(frag);
      } else if (no.nodeType === 1) quebra(no);
    });
    h.setAttribute("aria-label", h.textContent.replace(/\s+/g, " ").trim());
    quebra(h); h.classList.add("palavras");
  });

  /* ---------- Revelação ao rolar ---------- */
  if ("IntersectionObserver" in window && !reduz) {
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { const el = e.target; el.classList.add("vis"); io.unobserve(el); setTimeout(() => el.classList.remove("rv"), 2200); }
    }), { rootMargin: "0px 0px -6% 0px", threshold: .05 });
    $$(".rv").forEach(el => io.observe(el));
    const ioH = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("vis"); ioH.unobserve(e.target); } }), { rootMargin: "0px 0px -8% 0px" });
    $$("h2.palavras").forEach(h => ioH.observe(h));
  } else $$(".rv, h2").forEach(el => el.classList.add("vis"));

  /* ---------- Contadores: sobem de 0 até o número, com "estalo" no fim ---------- */
  const contar = el => {
    const fim = +el.dataset.conta; if (reduz || !fim) return;
    const dur = fim > 50 ? 2400 : 1200, t0 = performance.now();
    el.textContent = "0"; el.classList.add("contando");
    const passo = t => {
      const k = Math.min(1, (t - t0) / dur), ease = k === 1 ? 1 : 1 - Math.pow(2, -10 * k);
      el.textContent = Math.round(fim * ease).toLocaleString("pt-BR");
      if (k < 1) requestAnimationFrame(passo);
      else { el.classList.remove("contando"); el.classList.add("fim"); setTimeout(() => el.classList.remove("fim"), 600); }
    };
    requestAnimationFrame(passo);
  };
  const ioConta = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    ioConta.unobserve(e.target);
    const atraso = e.target.closest(".hero") ? 900 : 250;
    if (!reduz) e.target.textContent = "0";
    setTimeout(() => contar(e.target), atraso);
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
    $$(`.maq__cores button[data-cor="${b.dataset.cor}"], .peca__cores button[data-cor="${b.dataset.cor}"]`).forEach(x => x.click());
    // a página inteira troca o laranja pelo verde
    const verde = b.dataset.cor === "Verde";
    document.documentElement.dataset.tema = verde ? "verde" : "";
    if (!verde) delete document.documentElement.dataset.tema;
    const meta = $('meta[name="theme-color"]'); if (meta) meta.content = "#0B0B0B";
    $$(".mapa__pontos").forEach(im => { if (!im.dataset.laranja) im.dataset.laranja = im.getAttribute("src"); im.src = verde ? im.dataset.verde : im.dataset.laranja; });
    // a cor escolhida já vem marcada nos formulários
    $$('input[name=cor][value="' + b.dataset.cor + '"]').forEach(r => { if (!r.closest("[hidden]")) r.checked = true; });
    $$("#o-cores input[name=cor]").forEach(r => r.checked = r.value === b.dataset.cor);
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

  /* ---------- Peças e equipamentos: cores ---------- */
  $$(".peca").forEach(card => $$(".peca__cores button", card).forEach(b => b.addEventListener("click", () => {
    if (b.getAttribute("aria-pressed") === "true") return;
    $$(".peca__cores button", card).forEach(x => x.setAttribute("aria-pressed", x === b));
    $(".peca__cor-nome", card).textContent = b.dataset.cor;
    card.dataset.cor = b.dataset.cor;
    const a = $(".peca__pedir", card); if (a) a.href = b.dataset.wa;
    const im = $(".peca__foto img", card); im.classList.add("troca");
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
  let tipo = "todos";
  const filtraPecas = () => {
    const q = norm(busca.value.trim()); let n = 0;
    const livre = todas || !!q || tipo !== "todos";
    pecas.forEach(p => {
      const ok = (tipo === "todos" || p.dataset.tipo === tipo) && (q ? p.dataset.busca.includes(q) : (livre || !p.hasAttribute("data-extra")));
      p.hidden = !ok; if (ok) { n++; p.classList.add("vis"); }
    });
    vazio.hidden = n > 0; maisBtn.hidden = livre;
  };
  $$(".chips--claro .chip").forEach(c => c.addEventListener("click", () => {
    $$(".chips--claro .chip").forEach(x => x.setAttribute("aria-pressed", x === c));
    tipo = c.dataset.t; filtraPecas();
  }));
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
    const l = ["Olá! Quero um orçamento pelo site www.alemaoafiacao.com.br", ""];
    l.push(p ? `*${({ maquina: "Máquina", equipamento: "Equipamento" })[p.tipo] || "Peça"}:* ${p.nome} (${p.preco})` : "*Máquina:* ainda não sei, quero ajuda para escolher");
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

  /* ---------- Mapa de entregas: rotas e pacotes ---------- */
  const mapa = $(".mapa");
  if (mapa) {
    const pacotes = $$(".pacote", mapa);
    const enviar = () => pacotes.forEach((pc, i) => setTimeout(() => {
      const an = $("animateMotion", pc); if (!an || !an.beginElement) return;
      pc.style.opacity = 1; an.beginElement();
      setTimeout(() => { pc.style.opacity = 0; }, 2500);
    }, i * 700));
    const ioM = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return;
      ioM.disconnect(); mapa.classList.add("vis");
      if (reduz) return;
      setTimeout(() => { enviar(); setInterval(enviar, 6500); }, 400);
    }), { threshold: .25 });
    ioM.observe(mapa);
  }

  /* ---------- Ano no rodapé ---------- */
  $$("[data-ano]").forEach(el => el.textContent = new Date().getFullYear());
})();
