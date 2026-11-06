# Gera public/assets/img/mapa-pontos.svg (mapa pontilhado) e src/mapa.html (rotas animadas)
# Uso: python3 tools/gerar-mapa.py   · base: tools/countries.geo.json (johan/world.geo.json, domínio público)
import json, math, os
from matplotlib.path import Path
R = os.path.dirname(os.path.abspath(__file__)) + "/.."
G = json.load(open(R + "/tools/countries.geo.json"))
LON0, LON1, LAT0, LAT1 = -170, 190, -56, 76
W = 1200
def my(lat): return 1.25 * math.log(math.tan(math.pi/4 + 0.4*math.radians(lat)))   # Miller
Y0, Y1 = my(LAT1), my(LAT0)
H = round(W * (Y0 - Y1) / math.radians(LON1 - LON0))
def proj(lon, lat):
    x = (lon - LON0) / (LON1 - LON0) * W
    y = (Y0 - my(lat)) / (Y0 - Y1) * H
    return x, y
polys = []
for f in G["features"]:
    iso = f.get("id"); g = f["geometry"]
    rings = [g["coordinates"]] if g["type"] == "Polygon" else g["coordinates"]
    for poly in rings:
        ring = poly[0]
        xs = [p[0] for p in ring]; ys = [p[1] for p in ring]
        polys.append((iso, (min(xs), min(ys), max(xs), max(ys)), Path(ring)))
DESTAQUE = {"BRA": "b", "USA": "u", "PRT": "u", "ITA": "u"}
passo = 1.9
pts = []
lat = LAT1
while lat >= LAT0:
    lon = LON0
    off = (passo / 2) if round((LAT1 - lat) / passo) % 2 else 0
    while lon <= LON1:
        lo = lon + off
        for iso, (a, b, c, d), p in polys:
            if a <= lo <= c and b <= lat <= d and p.contains_point((lo, lat)):
                pts.append((proj(lo, lat), DESTAQUE.get(iso, "")))
                break
        lon += passo
    lat -= passo
cls = {"": "#3a3a3a", "u": "#8a8a8a", "b": "#F36C10"}
op = {"": "1", "u": "1", "b": ".55"}
circ = "".join(f'<path stroke="{cls[k]}" stroke-opacity="{op[k]}" d="' + "".join(f"M{x:.1f} {y:.1f}h0" for (x, y), kk in pts if kk == k) + '"/>' for k in cls)
circ = f'<g fill="none" stroke-width="4.2" stroke-linecap="round">{circ}</g>'
svgp = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}">{circ}</svg>'
open(R + "/public/assets/img/mapa-pontos.svg", "w").write(svgp)
open(R + "/public/assets/img/mapa-pontos-verde.svg", "w").write(svgp.replace("#F36C10", "#6CC72B"))

ORIGEM = (-49.97, -20.42)  # Votuporanga/SP
DEST = [  # (nome, lon, lat, rótulo?)
    ("Estados Unidos", -96.0, 38.5, True), ("Portugal", -8.1, 39.6, True), ("Itália", 12.6, 42.5, True),
    ("Manaus", -60.0, -3.1, False), ("Belém", -48.5, -1.46, False), ("Macapá", -51.07, 0.03, False),
    ("Boa Vista", -60.67, 2.82, False), ("São Luís", -44.3, -2.53, False), ("Fortaleza", -38.5, -3.73, False),
    ("Natal", -35.2, -5.8, False), ("Recife", -34.9, -8.05, False), ("Salvador", -38.5, -12.97, False),
    ("Teresina", -42.8, -5.09, False), ("Palmas", -48.3, -10.2, False), ("Porto Velho", -63.9, -8.76, False),
    ("Rio Branco", -67.8, -9.97, False), ("Cuiabá", -56.1, -15.6, False), ("Brasília", -47.9, -15.8, False),
    ("Campo Grande", -54.6, -20.5, False), ("Belo Horizonte", -43.9, -19.9, False), ("Vitória", -40.3, -20.3, False),
    ("Rio de Janeiro", -43.2, -22.9, False), ("São Paulo", -46.6, -23.55, False), ("Curitiba", -49.3, -25.4, False),
    ("Florianópolis", -48.5, -27.6, False), ("Porto Alegre", -51.2, -30.0, False),
]
ox, oy = proj(*ORIGEM)
rotas, alvos, rotulos = [], [], []
for i, (n, lo, la, rot) in enumerate(DEST):
    x, y = proj(lo, la)
    dx, dy = x - ox, y - oy; d = math.hypot(dx, dy)
    k = 0.32 if rot else 0.22
    cx, cy = ox + dx/2 - dy*k, oy + dy/2 + dx*k
    if rot and n == "Estados Unidos": cx, cy = ox + dx/2 + dy*0.28, oy + dy/2 - dx*0.28
    longa = "longa" if rot else "curta"
    rotas.append(f'<path id="r{i}" class="rota {longa}" d="M{ox:.1f} {oy:.1f}Q{cx:.1f} {cy:.1f} {x:.1f} {y:.1f}" pathLength="1" style="--i:{i}"/>')
    alvos.append(f'<g class="alvo {longa}" style="--i:{i}"><circle class="pulso" cx="{x:.1f}" cy="{y:.1f}" r="{6 if rot else 3.5}"/><circle cx="{x:.1f}" cy="{y:.1f}" r="{4 if rot else 2.6}"/><title>{n}</title></g>')
    if rot:
        alvos.append(f'<circle class="pacote" r="4"><animateMotion dur="2.4s" begin="indefinite" fill="freeze" calcMode="spline" keyTimes="0;1" keySplines=".4 0 .2 1"><mpath href="#r{i}"/></animateMotion></circle>')
        if n == "Portugal": tx, ty, anchor = x - 12, y - 12, "end"
        elif n == "Itália": tx, ty, anchor = x + 12, y - 12, "start"
        else: tx, ty, anchor = x + 6, y - 18, "middle"
        rotulos.append(f'<g class="rot" style="--i:{i}"><text x="{tx:.1f}" y="{ty:.1f}" text-anchor="{anchor}">{n}</text></g>')
rotulos.append(f'<g class="rot origem"><text x="{ox+12:.1f}" y="{oy+26:.1f}">Votuporanga/SP</text></g>')
bx, by = proj(-64, -24)
rotulos.append(f'<g class="rot" style="--i:8"><text x="{bx:.1f}" y="{by:.1f}" text-anchor="end" class="br">TODO O BRASIL</text></g>')
svg = f'''<div class="mapa__arte">
        <img class="mapa__pontos" src="/assets/img/mapa-pontos.svg" data-verde="/assets/img/mapa-pontos-verde.svg" alt="" width="{W}" height="{H}" loading="lazy">
        <svg class="mapa__rotas" viewBox="0 0 {W} {H}" aria-hidden="true">
          {"".join(rotas)}
          {"".join(alvos)}
          <g class="origem-pt"><circle class="pulso" cx="{ox:.1f}" cy="{oy:.1f}" r="9"/><circle cx="{ox:.1f}" cy="{oy:.1f}" r="6"/></g>
          {"".join(rotulos)}
        </svg>
      </div>'''
open(R + "/src/mapa.html", "w").write(svg)
print("pontos", len(pts), "viewBox", W, H, "svg KB", os.path.getsize(R + "/public/assets/img/mapa-pontos.svg")//1024)
