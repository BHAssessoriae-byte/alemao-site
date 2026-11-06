// ATUALIZA TUDO de uma vez: site, link na bio, catálogo online, PDF, vídeos, privacidade, termos e 404.
// Fonte única dos dados:
//   src/config.json            → WhatsApp, horário, redes, endereço, CNPJ, números (500+, 300+), garantia
//   public/catalogo/produtos.json → máquinas, equipamentos, peças, preços, medidas, cores
//   public/videos/videos.json  → vídeos
// Uso: node tools/atualizar.js   (depois: git add -A && git commit && git push → no ar em ~3 min)
const { execFileSync } = require("child_process");
const path = require("path"), fs = require("fs");
const raiz = path.resolve(__dirname, "..");
const rodar = (...a) => execFileSync(process.execPath, a, { cwd: raiz, stdio: "inherit" });
execFileSync("python3", ["tools/gerar-bordas.py"], { cwd: raiz, stdio: "inherit" }); // fotos com contorno branco (só catálogo)
rodar("tools/gerar-site.js");
rodar("tools/gerar-pdf.js");
// conferência: nenhum número/dado antigo esquecido fora da base
const C = JSON.parse(fs.readFileSync(path.join(raiz, "src/config.json"), "utf8"));
const arquivos = ["public/index.html", "public/links/index.html", "public/catalogo/index.html", "public/videos/index.html", "public/privacidade/index.html", "public/termos/index.html", "public/404.html"];
const ruim = [];
for (const f of arquivos) {
  const t = fs.readFileSync(path.join(raiz, f), "utf8");
  for (const m of t.matchAll(/wa\.me\/(\d+)/g)) if (m[1] !== C.whatsapp) ruim.push(`${f}: WhatsApp diferente (${m[1]})`);
  if (/{{[^}]+}}/.test(t)) ruim.push(`${f}: marcador sem valor`);
}
if (ruim.length) { console.error("ATENÇÃO:\n" + ruim.join("\n")); process.exit(1); }
console.log("\nTudo atualizado e conferido. Agora: git add -A && git commit -m \"...\" && git push");
