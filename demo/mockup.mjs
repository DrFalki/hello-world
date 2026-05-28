// Generates faithful PNG mockups of the four screens with sample data,
// so the system can be previewed without a browser. Run: node demo/mockup.mjs
import sharp from 'sharp';
import QRCode from 'qrcode';
import { mkdirSync } from 'node:fs';

const OUT = '/tmp/demo';
mkdirSync(OUT, { recursive: true });
const FONT = 'DejaVu Sans, sans-serif';

const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
async function render(name, w, h, body) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" font-family="${FONT}">${body}</svg>`;
  await sharp(Buffer.from(svg)).png().toFile(`${OUT}/${name}.png`);
  console.log(`wrote ${name}.png (${w}x${h})`);
}

const COL = { brand:'#2563eb', teal:'#0d9488', violet:'#7c3aed', amber:'#a16207', red:'#dc2626' };

function rrect(x,y,w,h,r,fill,extra='') { return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" ${extra}/>`; }
function txt(x,y,s,size,fill,weight='400',anchor='start') {
  return `<text x="${x}" y="${y}" font-size="${size}" fill="${fill}" font-weight="${weight}" text-anchor="${anchor}">${esc(s)}</text>`;
}

// ---------------- 1) Wartezimmer-Display (PAuL) ----------------
async function display() {
  const W=1280,H=720;
  let s = rrect(0,0,W,H,0,'#0b1220');
  // header
  s += txt(40,58,'Praxis Dr. Falk',32,'#e2e8f0','700');
  s += txt(40,90,'Herzlich willkommen – bitte achten Sie auf Ihren Aufruf',17,'#94a3b8');
  s += txt(W-40,58,'10:42',38,'#e2e8f0','800','end');
  s += `<circle cx="${W-52}" cy="84" r="6" fill="#22c55e"/>`;
  s += `<line x1="0" y1="118" x2="${W}" y2="118" stroke="#1e293b" stroke-width="2"/>`;
  // left current call (highlighted)
  s += rrect(0,118,800,H-118,0,'rgba(37,99,235,0.10)');
  s += txt(400,210,'AUFRUF',20,'#94a3b8','600','middle');
  s += txt(400,400,'N 03',230,COL.red,'900','middle');
  s += txt(400,500,'→ Raum 1',70,'#e2e8f0','800','middle');
  s += txt(400,560,'Dr. Falk',26,'#94a3b8','400','middle');
  // right sidebar
  s += `<line x1="800" y1="118" x2="800" y2="${H}" stroke="#1e293b" stroke-width="2"/>`;
  s += txt(840,170,'ZULETZT AUFGERUFEN',16,'#94a3b8','700');
  const recent=[['N 03','Raum 1',COL.red],['O 02','Raum 2',COL.teal],['T 05','Raum 3',COL.brand],['L 01','Labor',COL.violet],['T 04','Raum 1',COL.brand]];
  let ry=230;
  for(const [n,r,c] of recent){
    s += txt(840,ry,n,30,c,'900');
    s += txt(W-40,ry,r,24,'#94a3b8','400','end');
    s += `<line x1="840" y1="${ry+18}" x2="${W-40}" y2="${ry+18}" stroke="#1e293b" stroke-width="1"/>`;
    ry+=64;
  }
  s += txt(840,ry+30,'4 wartende Tickets',18,'#94a3b8');
  await render('1-display',W,H,s);
}

// ---------------- 2) Anmeldung (Reception) ----------------
async function reception() {
  const W=1120,H=780;
  let s = rrect(0,0,W,H,0,'#f1f5f9');
  // topbar
  s += rrect(0,0,W,52,0,'#0f172a');
  s += `<circle cx="26" cy="26" r="6" fill="#22c55e"/>`;
  s += txt(42,32,'Anmeldung',18,'#fff','700');
  s += txt(W-30,32,'Display öffnen   Kiosk   Hub',14,'#cbd5e1','400','end');
  // stats
  const stats=[['Wartend','4'],['Aufgerufen','1'],['In Behandlung','2'],['Erledigt','7']];
  let sx=22;
  for(const [l,n] of stats){ const w=(W-22*2-30)/4;
    s += rrect(sx,70,w,76,14,'#fff','stroke="#e2e8f0"');
    s += txt(sx+w/2,112,n,26,'#0f172a','800','middle');
    s += txt(sx+w/2,134,l,12,'#64748b','400','middle');
    sx+=w+10;
  }
  // left column cards
  const lx=22, lw=340;
  s += rrect(lx,166,lw,222,16,'#fff','stroke="#e2e8f0"');
  s += txt(lx+18,196,'Neues Ticket ziehen',16,'#0f172a','700');
  s += rrect(lx+18,212,lw-36,34,11,'#fff','stroke="#e2e8f0"');
  s += txt(lx+28,234,'Name / Kürzel (optional)',13,'#94a3b8');
  const cats=[['Termin',COL.brand],['Offene Sprechst.',COL.teal],['Labor / Blut',COL.violet],['Rezept / Verw.',COL.amber]];
  let cy=258, cxs=[lx+18, lx+18+(lw-46)/2+10];
  for(let i=0;i<cats.length;i++){ const col=i%2, rowi=Math.floor(i/2);
    const cw=(lw-46)/2, cx=cxs[col], yy=cy+rowi*44;
    s += rrect(cx,yy,cw,38,12,cats[i][1]);
    s += txt(cx+11,yy+24,cats[i][0],12,'#fff','700');
  }
  // notfall full width
  s += rrect(lx+18,cy+88,lw-36,34,12,COL.red);
  s += txt(lx+28,cy+110,'Notfall / dringend  · Priorität',12.5,'#fff','700');
  // call card
  s += rrect(lx,404,lw,150,16,'#fff','stroke="#e2e8f0"');
  s += txt(lx+18,434,'Aufrufen',16,'#0f172a','700');
  s += rrect(lx+18,448,(lw-46)/2,36,11,'#fff','stroke="#e2e8f0"'); s += txt(lx+30,471,'Raum 1',13,'#0f172a');
  s += rrect(lx+18+(lw-46)/2+10,448,(lw-46)/2,36,11,'#fff','stroke="#e2e8f0"'); s += txt(lx+30+(lw-46)/2+10,471,'Dr. Falk',13,'#0f172a');
  s += rrect(lx+18,496,lw-36,40,12,'#16a34a');
  s += txt(lx+lw/2,522,'▶  Nächsten aufrufen',15,'#fff','700','middle');
  // right: queue table
  const rx=lx+lw+18, rw=W-rx-22;
  s += rrect(rx,166,rw,592,16,'#fff','stroke="#e2e8f0"');
  s += txt(rx+18,196,'Warteschlange',16,'#0f172a','700');
  const cols=[['NR.',rx+18],['KATEGORIE',rx+120],['STATUS',rx+300],['RAUM',rx+420],['WARTET',rx+510]];
  for(const [h,x] of cols) s += txt(x,236,h,11,'#64748b','700');
  s += `<line x1="${rx+18}" y1="246" x2="${rx+rw-18}" y2="246" stroke="#e2e8f0"/>`;
  const rows=[
    ['N 03','Notfall','aufgerufen','s-called','Raum 1','2 min',COL.red],
    ['O 02','Offene','in Behandlung','s-serving','Raum 2','9 min',COL.teal],
    ['T 05','Termin','aufgerufen','s-called','Raum 3','4 min',COL.brand],
    ['T 06','Termin','wartet','s-waiting','—','3 min',COL.brand],
    ['O 03','Offene','wartet','s-waiting','—','6 min',COL.teal],
    ['L 02','Labor','wartet','s-waiting','—','8 min',COL.violet],
    ['V 01','Verwaltung','wartet','s-waiting','—','12 min',COL.amber],
  ];
  const badge={'s-called':['#dbeafe','#1e40af'],'s-serving':['#dcfce7','#166534'],'s-waiting':['#fef9c3','#854d0e']};
  let yy=274;
  for(const r of rows){
    s += txt(rx+18,yy+4,r[0],17,r[6],'800');
    s += txt(rx+120,yy+4,r[1],13,'#0f172a');
    const [bg,fg]=badge[r[3]];
    s += rrect(rx+296,yy-12,108,22,11,bg); s += txt(rx+350,yy+3,r[2],11,fg,'700','middle');
    s += txt(rx+420,yy+4,r[4],13,'#475569');
    s += txt(rx+510,yy+4,r[5],13,'#475569');
    s += `<line x1="${rx+18}" y1="${yy+22}" x2="${rx+rw-18}" y2="${yy+22}" stroke="#e2e8f0"/>`;
    yy+=44;
  }
  await render('2-anmeldung',W,H,s);
}

// ---------------- 3) Kiosk ----------------
async function kiosk() {
  const W=820,H=940;
  const qr = await QRCode.toString('http://192.168.1.50:3000/t/365813d3',{type:'svg',margin:0,width:300,color:{dark:'#0f172a',light:'#ffffff'}});
  let s = rrect(0,0,W,H,0,'#f8fafc');
  s += txt(W/2,80,'Willkommen',36,'#0f172a','800','middle');
  s += txt(W/2,116,'Praxis Dr. Falk',20,'#64748b','400','middle');
  s += txt(W/2,180,'Ihre Nummer',22,'#64748b','400','middle');
  s += txt(W/2,310,'O 02',130,COL.teal,'900','middle');
  s += txt(W/2,355,'Offene Sprechstunde',22,'#64748b','400','middle');
  // qr card
  const qs=300, qx=(W-qs)/2-16, qy=400;
  s += rrect(qx,qy,qs+32,qs+32,18,'#fff','stroke="#e2e8f0"');
  const qrNested = qr.replace(/<\?xml.*?\?>/,'').replace('<svg ', `<svg x="${qx+16}" y="${qy+16}" `);
  s += qrNested;
  s += `<text x="${W/2}" y="${qy+qs+90}" font-size="17" fill="#64748b" text-anchor="middle">📱 QR-Code scannen, um Ihr Ticket live</text>`;
  s += `<text x="${W/2}" y="${qy+qs+115}" font-size="17" fill="#64748b" text-anchor="middle">auf dem Handy zu verfolgen</text>`;
  s += txt(W/2,qy+qs+150,'Zurück zum Start in 12s …',14,'#94a3b8','400','middle');
  await render('3-kiosk',W,H,s);
}

// ---------------- 4) Smartphone ticket ----------------
async function phone() {
  const W=400,H=820;
  let s = rrect(0,0,W,H,0,'#f1f5f9');
  // card
  const cx=20, cw=W-40;
  s += rrect(cx,60,cw,560,18,'#fff','stroke="#e2e8f0"');
  s += txt(W/2,110,'Praxis Dr. Falk',15,'#64748b','400','middle');
  s += txt(W/2,210,'O 02',96,COL.teal,'900','middle');
  s += txt(W/2,248,'Offene Sprechstunde',15,'#64748b','400','middle');
  // statebox green
  s += rrect(cx+24,290,cw-48,72,16,'#dcfce7');
  s += txt(W/2,335,'Sie werden aufgerufen → Raum 2',17,'#166534','700','middle');
  s += txt(W/2,400,'bei Dr. Falk',16,'#64748b','400','middle');
  // drawn bell icon (emoji glyphs don't render in the server font)
  s += `<g transform="translate(${W/2},458)" fill="#16a34a">
    <path d="M0,-22 C11,-22 17,-13 17,-3 L17,7 L24,16 L-24,16 L-17,7 L-17,-3 C-17,-13 -11,-22 0,-22 Z"/>
    <circle cx="0" cy="-25" r="3.5"/>
    <circle cx="0" cy="22" r="5"/>
  </g>`;
  s += txt(W/2,540,'Bitte halten Sie diese',13,'#94a3b8','400','middle');
  s += txt(W/2,560,'Seite geöffnet.',13,'#94a3b8','400','middle');
  await render('4-handy',W,H,s);
}

await display();
await reception();
await kiosk();
await phone();
console.log('done');
