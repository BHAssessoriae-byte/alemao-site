// Idiomas do site: português (base), inglês e espanhol.
// Os textos em português ficam nos modelos (src/*.html) e nos JSONs. As traduções ficam em src/i18n/textos.json:
//   "texto em português": ["english", "español"]   ("=" = igual nos três idiomas)
// Se um texto novo em português não tiver tradução, o gerador PARA e lista o que falta (nada vai pro ar pela metade).
const fs = require("fs"), path = require("path");
const raiz = path.resolve(__dirname, "..");
const ARQ = path.join(raiz, "src/i18n/textos.json");
const DB = JSON.parse(fs.readFileSync(ARQ, "utf8"));

const IDIOMAS = {
  pt: { id: "pt", prefixo: "", html: "pt-BR", og: "pt_BR", nome: "Português", curto: "PT", pdf: "catalogo-alemao-afiacao.pdf" },
  en: { id: "en", prefixo: "/en", html: "en", og: "en_US", nome: "English", curto: "EN", pdf: "catalogo-alemao-afiacao-en.pdf" },
  es: { id: "es", prefixo: "/es", html: "es", og: "es_ES", nome: "Español", curto: "ES", pdf: "catalogo-alemao-afiacao-es.pdf" }
};
const LISTA = ["pt", "en", "es"];

const faltando = new Map();      // texto → Set(idiomas)
const marcadoresRuins = [];
const norm = s => String(s).replace(/\s+/g, " ").trim();
const temLetra = s => /\p{L}/u.test(s.replace(/{{[^}]+}}/g, "").replace(/\{\w+\}/g, "").replace(/&\w+;/g, ""));
const marcadores = s => s.match(/{{[^}]+}}|\{\w+\}/g) || [];

function tradutor(lang) {
  if (lang === "pt") return s => s;
  const i = lang === "en" ? 0 : 1;
  return s => {
    if (s == null) return s;
    const k = norm(s);
    if (!k || !temLetra(k)) return s;
    const v = DB.textos[k];
    if (v === undefined) { if (!faltando.has(k)) faltando.set(k, new Set()); faltando.get(k).add(lang); return s; }
    const r = v === "=" ? k : v[i];
    if (marcadores(r).some(x => !marcadores(k).includes(x))) marcadoresRuins.push(`${lang}: "${k}" → "${r}"`);
    const m = String(s).match(/^(\s*)[\s\S]*?(\s*)$/);
    return m[1] + r + m[2];
  };
}

// Traduz um modelo HTML: textos entre tags e alguns atributos. Não mexe em <script>, <style> e comentários.
const ATRIBUTOS = new Set(["alt", "title", "aria-label", "placeholder", "label", "data-nome", "data-preco", "data-wa", "data-titulo"]);
const META = /\b(name|property)="(description|og:title|og:description|og:site_name)"/;
function traduzTag(tag, t) {
  if (/^<!--|^<(script|style)\b/i.test(tag) || /^{{/.test(tag)) return tag;
  const ehMeta = /^<meta\b/i.test(tag) && META.test(tag), ehUso = /\bname="uso"/.test(tag);
  return tag.replace(/(\s)([\w:-]+)="([^"]*)"/g, (m, sp, nome, val) =>
    (ATRIBUTOS.has(nome) || (nome === "content" && ehMeta) || (nome === "value" && ehUso)) ? `${sp}${nome}="${t(val)}"` : m);
}
function traduzirHtml(html, t) {
  const re = /<!--[\s\S]*?-->|<(script|style)\b[^>]*>[\s\S]*?<\/\1>|<[^>]+>|{{ico:\w+}}/gi;
  let out = "", i = 0, m;
  while ((m = re.exec(html))) { out += t(html.slice(i, m.index)) + traduzTag(m[0], t); i = re.lastIndex; }
  return out + t(html.slice(i));
}

// Preço: R$ 4.350,00 (pt e es) · R$ 4,350.00 (en)
const brlDe = lang => v => lang === "en"
  ? "R$ " + v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  : v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// Configurações que mudam por idioma (horário, países, telefone com +55…)
const configDe = (C, lang) => ({ ...C, ...((DB.config || {})[lang] || {}) });

// Endereço da mesma página em outro idioma
const urlDe = (lang, pagina) => IDIOMAS[lang].prefixo + pagina;

// Seletor de idioma (PT · EN · ES) – mesmo HTML em todas as páginas
const GLOBO = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3Z"/></svg>';
const seletor = (lang, pagina) => `<nav class="idiomas" aria-label="Idioma · Language · Idioma">${GLOBO}${LISTA.map(l =>
  `<a href="${urlDe(l, pagina)}" hreflang="${IDIOMAS[l].html}" lang="${IDIOMAS[l].html}" data-idioma="${l}" title="${IDIOMAS[l].nome}"${l === lang ? ' aria-current="page"' : ""}>${IDIOMAS[l].curto}</a>`).join("")}</nav>`;
const hreflang = (pagina, site) => LISTA.map(l => `<link rel="alternate" hreflang="${IDIOMAS[l].html}" href="${site}${urlDe(l, pagina)}">`).join("\n")
  + `\n<link rel="alternate" hreflang="x-default" href="${site}${pagina}">`;

// Links internos apontam para a versão do mesmo idioma
function localizarLinks(html, lang) {
  const L = IDIOMAS[lang];
  if (lang === "pt") return html;
  return html
    .replace(/href="\/(catalogo|links|videos)\/(#[^"]*)?"/g, (m, p, h) => `href="${L.prefixo}/${p}/${h || ""}"`)
    .replace(/href="\/(#[^"]*)?"/g, (m, h) => `href="${L.prefixo}/${h || ""}"`)
    .replace(/(href="(?:\/catalogo\/)?)catalogo-alemao-afiacao\.pdf"/g, `$1${L.pdf}"`);
}

function conferir() {
  const erros = [];
  if (faltando.size) {
    const arq = path.join(raiz, "tools/.faltando-traducao.json");
    fs.writeFileSync(arq, JSON.stringify(Object.fromEntries([...faltando.keys()].map(k => [k, ["", ""]])), null, 1));
    erros.push(`${faltando.size} texto(s) sem tradução em src/i18n/textos.json (lista em tools/.faltando-traducao.json):\n  - ` + [...faltando.keys()].slice(0, 40).join("\n  - "));
  }
  if (marcadoresRuins.length) erros.push("Tradução com marcador diferente do original:\n  " + marcadoresRuins.join("\n  "));
  if (erros.length) { console.error("\nTRADUÇÕES:\n" + erros.join("\n")); process.exit(1); }
}

module.exports = { IDIOMAS, LISTA, DB, tradutor, traduzirHtml, brlDe, configDe, urlDe, seletor, hreflang, localizarLinks, conferir, norm };
