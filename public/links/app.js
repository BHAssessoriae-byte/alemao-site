// Número do WhatsApp vem do src/config.json (gerado no <body data-whatsapp>)
  const WHATSAPP = document.body.dataset.whatsapp;

  document.querySelectorAll("[data-wa]").forEach(a => {
    const msg = encodeURIComponent(a.dataset.wa);
    a.href = WHATSAPP ? `https://wa.me/${WHATSAPP}?text=${msg}` : "https://www.instagram.com/afiacaoalemao/";
    a.target = "_blank"; a.rel = "noopener";
  });
  // ===== interações =====
  const reduz = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const logo = document.querySelector(".logo");
  logo.addEventListener("animationend", () => logo.classList.add("parado"), { once: true });

  // onda no clique / toque
  document.querySelectorAll(".btn, .cat").forEach(el => {
    el.addEventListener("pointerdown", e => {
      if (reduz) return;
      const r = el.getBoundingClientRect(), o = document.createElement("span");
      o.className = "onda"; o.style.left = (e.clientX - r.left) + "px"; o.style.top = (e.clientY - r.top) + "px";
      el.appendChild(o); o.addEventListener("animationend", () => o.remove());
      if (navigator.vibrate) navigator.vibrate(8);
    });
  });

  // cartões inclinam seguindo o dedo/mouse
  if (!reduz) document.querySelectorAll(".cat").forEach(c => {
    c.addEventListener("pointermove", e => {
      const r = c.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      c.style.transform = `rotateY(${x * 14}deg) rotateX(${-y * 14}deg) translateY(-3px)`;
    });
    c.addEventListener("pointerleave", () => { c.style.transform = ""; });
  });

  // depois da entrada, os cartões ficam visíveis sem a animação (para a inclinação funcionar)
  document.querySelectorAll(".anima").forEach(el => el.addEventListener("animationend", () => {
    el.style.opacity = 1; el.style.animation = "none";
  }, { once: true }));
