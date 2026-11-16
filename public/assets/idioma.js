/* Seletor de idioma: lembra a escolha e, para quem chega na versão em português com o
   navegador em outro idioma (ou já escolheu inglês/espanhol antes), mostra um aviso para trocar.
   Não redireciona sozinho. Sem cookies: a escolha fica só no navegador da pessoa. */
(() => {
  "use strict";
  const K = "alemao-idioma";
  const ler = () => { try { return localStorage.getItem(K); } catch (e) { return null; } };
  const gravar = v => { try { localStorage.setItem(K, v); } catch (e) { /* navegador sem armazenamento */ } };
  const atual = (document.documentElement.lang || "pt").slice(0, 2).toLowerCase();

  // clicar num idioma: lembra a escolha e continua na mesma parte da página (#)
  document.querySelectorAll(".idiomas a").forEach(a => a.addEventListener("click", () => {
    gravar(a.dataset.idioma);
    if (location.hash) a.href = a.getAttribute("href").split("#")[0] + location.hash;
  }));

  if (atual !== "pt") return;
  const salvo = ler();
  if (salvo === "pt") return;
  const nav = ((navigator.languages && navigator.languages[0]) || navigator.language || "").slice(0, 2).toLowerCase();
  const alvo = salvo === "en" || salvo === "es" ? salvo : (!nav || nav === "pt" ? null : nav === "es" ? "es" : "en");
  if (!alvo) return;
  const link = document.querySelector(`.idiomas a[data-idioma="${alvo}"]`); if (!link) return;

  const T = alvo === "es"
    ? { msg: "Este sitio también está en español.", ver: "Ver en español", fechar: "Cerrar" }
    : { msg: "This website is also available in English.", ver: "View in English", fechar: "Close" };
  const box = document.createElement("div");
  box.className = "idioma-aviso"; box.lang = alvo; box.setAttribute("role", "region"); box.setAttribute("aria-label", T.msg);
  const s = document.createElement("span"); s.textContent = T.msg;
  const a = document.createElement("a"); a.textContent = T.ver; a.href = link.getAttribute("href") + location.hash; a.hreflang = alvo;
  a.addEventListener("click", () => gravar(alvo));
  const b = document.createElement("button"); b.type = "button"; b.textContent = "×"; b.setAttribute("aria-label", T.fechar);
  b.addEventListener("click", () => { gravar("pt"); box.classList.remove("vis"); setTimeout(() => box.remove(), 600); });
  box.append(s, a, b);
  document.body.appendChild(box);
  setTimeout(() => box.classList.add("vis"), 1200);
})();
