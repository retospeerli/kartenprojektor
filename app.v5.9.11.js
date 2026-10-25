'use strict';
const Core = window.GrossreliefCore;
const Hydro = window.GrossreliefHydro;
let hydroData = null, hydroLoading = null, hydroMessage = '';
function hydroGood(){return mapMode==='heute' && !!layout && !!hydroData;}
function hydroVisible(){return mapMode==='heute' && !!layout && selected.has('gewaesser') && !!hydroData;}
function hydroBbox(){return layout.bbox_lv95;}
function hydroMessageSet(text){hydroMessage=text;const el=$('hydroStatus');if(el)el.textContent=text;}
function renderHydroAudit(data){
  const details=$('hydroAudit'),rows=$('hydroAuditRows');
  if(!details||!rows)return;
  details.hidden=!data;rows.replaceChildren();
  if(!data)return;
  const streamNames=['Reidbach/Wildbach','Teufenbach','Sihl','Krebsbach','Schlossbach','Sagenbach','Miesbach',
    'Zopfbach','Gulmenbach','Töbelibach','Untermosenbach','Mülibach Richterswil'];
  const pondNames=['Sternenweiher','Reidbachweiher','Teufenbachweiher','Aabachweiher'];
  function add(name,detail,found){
    const row=document.createElement('div');row.className='hydroAuditRow';
    const label=document.createElement('strong');label.textContent=name;
    const status=document.createElement('span');status.textContent=detail;
    status.className=found?'found':'missing';row.append(label,status);rows.append(row);
  }
  for(const name of streamNames){
    const parts=data.streams.filter(item=>item.name===name);
    const routes=parts.filter(item=>item.source==='full-route').length;
    const direct=0;
    add(name,name==='Krebsbach' ? (data.krebsbachRoute?.state||'Nicht geprüft') : name==='Sihl' ? (data.sihlCoverage?.state||'Noch nicht geprüft') : parts.length?`${parts.length} ausgewählte Linienstück(e), davon ${routes} amtliche Routenteile`:'Keine Geometrie geliefert',parts.length>0);
  }
  for(const name of pondNames){
    const polygon=(data.lakes||[]).some(item=>item.name===name);
    const outline=(data.pondShore||[]).some(item=>item.name===name);
    add(name,polygon?'Wasserfläche verfügbar':outline?'Amtliche Uferlinie vorhanden (Fläche fehlt)':'Keine Geometrie geliefert',polygon||outline);
  }
  const footer=document.createElement('p');footer.className='hint';
  footer.textContent='Amtliche Datenquellen: '+(data.loadedRoles||[]).map(role=>({streamAxes:'45.2 Gewässerrouten',streams:'45.3 Benennung',lakes:'45.10 Seeflächen',shore:'45.13 Zürichseeufer',pondRights:'51.1 Wasserrechtsweiher'}[role]||role)).join(' · ')+'. Nicht gefundene Geometrien werden nicht erfunden.';
  rows.append(footer);
}

async function ensureHydro(){
  if(!layout)return null;
  if(hydroData)return hydroData;
  if(hydroLoading)return hydroLoading;
  const [w,s,e,n]=layout.bbox_lv95;
  hydroMessageSet('Lade präzise Uferlinie und benannte Bachläufe aus dem kantonalen Gewässer-WFS …');
  const originalLayout=layout;
  hydroLoading=Hydro.fetchOfficial([w-150,s-150,e+150,n+150], [w,s,e,n])
   .then(data=>{
     if(layout!==originalLayout)return null;
     hydroData=data;renderHydroAudit(data);
     // Grundkarte sofort anzeigen, auch wenn die separate Krebsbach- oder
     // Sihl-Nachlieferung ausfaellt. Nichts löschen oder ersetzen bei Fehlern.
     updateHydroViews();
     Hydro.fetchSupplemental(data,[w-150,s-150,e+150,n+150],[w,s,e,n])
       .then(next=>{if(layout!==originalLayout||hydroData!==data)return;
         hydroData=next;renderHydroAudit(next);updateHydroViews();
         hydroMessageSet(`Gewässer unverändert geladen · Zürichsee ${next.lakes.some(v=>v.name==='Zürichsee')?'vorhanden':'nicht geliefert'} · ${next.sihlCoverage?.state||'Sihl nicht nachgewiesen'} · Krebsbach ${next.krebsbachRoute?.state||'nicht bestätigt'}. ${next.errors?.length?'Teildaten: '+next.errors.join('; '):''}`);
       }).catch(error=>{if(layout===originalLayout&&hydroData===data) hydroMessageSet('Zürichsee und Sihl bleiben erhalten; Krebsbach-Einzelprüfung fehlgeschlagen: '+error.message);});
     hydroMessageSet(`Amtliche Vektordaten: ${data.lakes.length} Seen/Weiher, ${data.shores.length} Uferlinien. Bäche ${data.found.length}/${Hydro.STREAM_CATALOG.length}: ${data.found.join(', ')||'keine'}; Weiher ${data.pondsFound?.length||0}/${Hydro.POND_CATALOG.length}: ${data.pondsFound?.join(', ')||'keine'}. Krebsbach: ${data.krebsbachRoute?.state||'nicht geprüft'} (${data.krebsbachRoute?.pieces||0} belegte Linienteile). Sihl: ${data.sihlCoverage?.state||'noch nicht geprüft'}. Mülibach Richterswil (Nr. 2512): ${data.muelibachRouteParts||0} Routenteile; Mündung am Zürichsee ${data.muelibachMouth?.state==='atLake'?'geometrisch bestätigt':data.muelibachMouth?.state==='gap'?'NICHT bestätigt (nächster Endpunkt ca. '+data.muelibachMouth.distanceMetres+' m von der Seeuferlinie entfernt)':'noch nicht nachweisbar'}. Amtliche Routen für ${data.fullRoutes?.length||0}/${Hydro.STREAM_CATALOG.length} Bachgruppen. Fehlende: ${Hydro.STREAM_CATALOG.filter(item=>!data.found.includes(item.name)).map(item=>item.name).join(', ')||'keine'}. ${data.errors?.length?'Teilabfragen fehlgeschlagen: '+data.errors.join('; '):''}`);
     return data;
   })
   .catch(err=>{renderHydroAudit(null);hydroMessageSet('Amtliche Gewässerdaten nicht verfügbar: '+err.message+' – KEINE Ersatzbäche.');return null;})
   .finally(()=>{hydroLoading=null;});
  return hydroLoading;
}
function updateHydroViews(){
  const preview=$('previewHydro'),proj=$('projectionHydro');
  if(!hydroVisible()){
    preview.hidden=true;proj.hidden=true;preview.replaceChildren();proj.replaceChildren();return;
  }
  const [w,h]=previewBase();
  const markup=Hydro.renderSVG(hydroData,hydroBbox(),w,h);
  preview.innerHTML=markup;proj.innerHTML=markup;preview.hidden=false;proj.hidden=false;
  proj.style.width=w+'px';proj.style.height=h+'px';
  const clipped=maskActive();
  preview.style.clipPath=clipped?'url(#municipalClipGlobal)':'inset(0)';
  proj.style.clipPath=clipped?'url(#municipalClip)':'inset(0)';
  drawProjection();
}
function paintHydro(ctx,w,h){
  if(!hydroVisible())return;
  ctx.save();
  if(maskActive()){
    ctx.beginPath();
    const [west,south,east,north]=layout.bbox_lv95;
    const polys=municipalGeometry.type==='Polygon'?[municipalGeometry.coordinates]:municipalGeometry.coordinates;
    for(const poly of polys) for(const ring of poly){ring.forEach(([x,y],i)=>{const px=(x-west)/(east-west)*w,py=(north-y)/(north-south)*h;if(i===0)ctx.moveTo(px,py);else ctx.lineTo(px,py);});ctx.closePath();}
    ctx.clip('evenodd');
  }
  Hydro.paintCanvas(ctx,hydroData,hydroBbox(),w,h);
  ctx.restore();
}
const hasWhiteReliefBackground = ids => !ids.includes('luftbild') && !ids.includes('uebersicht') && !ids.includes('historisch');
const WMS_LAYERS = [
 ['luftbild','Luftbild','SWISSIMAGE-Orthofoto'],
 ['uebersicht','Landeskarte','Topografische Übersicht'],
 ['gewaesser','Gewässer','Flüsse, Bäche, Seen'],
 ['verkehr','Verkehrswege','Strassen, Bahn und Seilbahnen'],
 ['gemeinden','Gemeinden','Politische Gemeindegrenzen'],
 ['siedlungen','Siedlungen','Siedlungsflächen'],
 ['orte','Ortschaften','Ortsnamen'],
 ['bauten','Bauten','Gebäude, Anlagen und Einzelobjekte'],
 ['wald','Wald','Waldflächen, offener Wald und Gebüschwald']
];
const WMS_ORDER = WMS_LAYERS.map(v=>v[0]);
// Bedienreihenfolge: 1 Luftbild, 2 Landeskarte, 3–9 thematische Ebenen.
// Zeichnen: Grundkarten zuerst, dann Flächen, Linien und zuoberst Namen.
const DRAW_ORDER = ['luftbild','uebersicht','siedlungen','wald','gewaesser','verkehr','gemeinden','bauten','orte'];
const $ = id => document.getElementById(id);
// Ausgangslage: Quellbild proportional und maximal in den verfügbaren
// Projektorbereich einpassen. Die vier Punkte bleiben danach frei beweglich.
function defaults(){
  const [sw,sh]=previewBase();
  const vw=Math.max(1,window.innerWidth), vh=Math.max(1,window.innerHeight);
  const scale=Math.min(vw*.96/sw, vh*.96/sh);
  const w=sw*scale/vw, h=sh*scale/vh;
  const x=(1-w)/2, y=(1-h)/2;
  return [{x,y},{x:x+w,y},{x:x+w,y:y+h},{x,y:y+h}];
}
let layout = null, layoutName = '', layoutCsv = '';
let uploads = new Map(), uploadOrder = [], uploadCounter = 0;
let selected = new Set();
let corners = defaults();
let cache = new Map(), pending = new Map(), generation = 0;
let projectorActive = false, handlesVisible = false, dockVisible = true, exporting = false, railPage = 0;
let waterDetail = 'wichtig';
let mapMode='heute', historicYear=1900, waedenswilOnly=false, municipalGeometry=null;
const modeSelections={heute:new Set(),historisch:new Set(['historisch'])};


function setStatus(text,error=false){
  $('statusText').textContent = text;
  $('status').classList.toggle('err',!!error);
  if(projectorActive){ $('projectorError').hidden = !error; if(error) $('projectorError').textContent = text; }
}
function nice(n,d=0){return Number(n).toLocaleString('de-CH',{minimumFractionDigits:d,maximumFractionDigits:d});}
function hasProject(){return !!layout || uploadOrder.length>0;}
function previewBase(){
  if(layout) return Core.dimensions(layout,1400);
  const first = uploadOrder[0] && uploads.get(uploadOrder[0]);
  if(!first) return [1200,900];
  const long = 1400, scale = long/Math.max(first.w,first.h);
  return [Math.max(1,Math.round(first.w*scale)), Math.max(1,Math.round(first.h*scale))];
}
function exportBase(){
  const maxLong = Number($('exportSize').value);
  if(layout) return Core.dimensions(layout,maxLong);
  const first = uploadOrder[0] && uploads.get(uploadOrder[0]);
  if(!first) throw Error('Keine Karten geladen.');
  const scale = maxLong/Math.max(first.w,first.h);
  return [Math.max(1,Math.round(first.w*scale)), Math.max(1,Math.round(first.h*scale))];
}
function modeWmsOrder(){return mapMode==='heute'?WMS_ORDER:['historisch'];}
function activeIds(){
  const wms = mapMode==='heute' ? DRAW_ORDER : ['historisch'];
  return [...wms.filter(id=>selected.has(id)), ...uploadOrder.filter(id=>selected.has(id))];
}
function maskActive(){return mapMode==='heute'&&waedenswilOnly&&!!municipalGeometry&&!!layout;}

function contextSignature(){
  if(layout) return [...layout.bbox_lv95,layout.model_width_mm,layout.model_depth_mm].map(n=>Number(n).toFixed(3)).join(':');
  return 'uploads:'+uploadOrder.map(id=>{const u=uploads.get(id); return `${u.filename}:${u.w}x${u.h}`;}).join('|');
}
function validCorners(c){return Array.isArray(c)&&c.length===4&&c.every(p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y)&&p.x>=0&&p.x<=1&&p.y>=0&&p.y<=1);}
function saveCorners(){
  if(!hasProject()) return;
  try{ const d = JSON.parse(localStorage.getItem('grossrelief-calibration-v4')||'{}'); d[contextSignature()] = corners; localStorage.setItem('grossrelief-calibration-v4',JSON.stringify(d)); }
  catch(e){}
}
function loadCorners(){
  corners = defaults();
  try{ const d = JSON.parse(localStorage.getItem('grossrelief-calibration-v4')||'{}'); if(validCorners(d[contextSignature()])) corners = d[contextSignature()]; }
  catch(e){}
}
function clearCache(){generation++; pending.clear(); cache.clear(); $('previewTiles').replaceChildren(); $('projectionTiles').replaceChildren();}
function resetPreviewEmpty(){ $('previewTiles').hidden = true; $('emptyPreview').hidden = false; $('imageSize').textContent='–'; $('modeInfo').textContent='Noch keine Relief- oder Bilddaten geladen'; }
function ensureSelection(){
  const valid = new Set([...modeWmsOrder().filter(id=>layout), ...uploadOrder]);
  selected = new Set([...selected].filter(id=>valid.has(id)));
  // Kein erzwungenes Luftbild: Nutzer darf nur transparente Ebenen oder gar keine wählen.
}
function updateButtons(){
  const can = hasProject();
  $('openProjector').disabled = !can;
  $('downloadCurrent').disabled = !can;
  $('downloadAll').disabled = !can;
  $('saveCalibration').disabled = !can;
  $('reload').disabled = !layout;
}
function sanitize(name){return name.replace(/[^a-z0-9._-]+/gi,'_');}
function sourceMeta(id){
  if(Core.PRESETS[id]) return {id,label:Core.PRESETS[id].label, subtitle:WMS_LAYERS.find(v=>v[0]===id)?.[2]||'', type:'wms'};
  const u = uploads.get(id); if(u) return {id,label:u.label, subtitle:`Eigenes Bild · ${u.filename}`, type:'upload'};
  return null;
}

function renderInfo(){
  updateButtons();
  ensureSelection();
  if(!hasProject()){ resetPreviewEmpty(); return; }
  const [w,h] = previewBase();
  $('previewTiles').hidden = false; $('emptyPreview').hidden = true;
  updateWhiteBackground();
  $('previewFrame').style.aspectRatio = `${w}/${h}`;
  $('imageSize').textContent = `Vorschau ${w} × ${h} px`;
  $('modeInfo').textContent = layout ? (mapMode==='heute'?'Heute · swisstopo und eigene Bilder':'Historisch · swisstopo-Zeitreise '+historicYear) : 'Bildmodus ohne CSV · eigene Bilder';
}

function parseLoadedCSV(text, filename){
  let meta;
  try{ meta = Core.parseLayoutCsv(text); }
  catch(error){ setStatus('CSV-Fehler: '+error.message,true); return; }
  try{
    layout = meta; layoutCsv = text; layoutName = filename; hydroData=null; hydroLoading=null; renderHydroAudit(null);hydroMessageSet('Amtliche Wassergeometrie wird bei Bedarf geladen.');
    $('layoutInfo').hidden = false; $('layoutName').textContent = filename; $('fileTitle').textContent = filename;
    $('segments').textContent = `${meta.segments} (${meta.columns} × ${meta.rows})`;
    $('modelSize').textContent = `${nice(meta.model_width_mm,1)} × ${nice(meta.model_depth_mm,3)} mm`;
    $('areaSize').textContent = `${nice(meta.geo_width_m)} × ${nice(meta.geo_depth_m)} m`;
    $('coordinates').textContent = `E: ${nice(meta.bbox_lv95[0],3)} – ${nice(meta.bbox_lv95[2],3)} · N: ${nice(meta.bbox_lv95[1],3)} – ${nice(meta.bbox_lv95[3],3)}`;
    ensureSelection(); if(mapMode==='heute'&&!selected.has('luftbild')&&!selected.size)selected.add('luftbild');
    if(mapMode==='historisch'&&!selected.size)selected.add('historisch');
    clearCache(); loadCorners(); renderInfo(); renderLayerControls(); refreshViews(); loadSelected();
    if(waedenswilOnly) applyMaskState();
    setStatus(`CSV geladen: ${meta.segments} Segmente · swisstopo-Karten können erzeugt werden.`);
  }catch(error){ setStatus('Anwendungsfehler nach CSV-Import: '+error.message,true); }
}

async function fileToImage(file){
  const url = URL.createObjectURL(file);
  try{
    const img = await new Promise((resolve,reject)=>{
      const i = new Image(); i.decoding='async'; i.onload=()=>resolve(i); i.onerror=()=>reject(Error(`Bild konnte nicht geladen werden: ${file.name}`)); i.src=url;
    });
    return {img,url};
  }catch(e){ URL.revokeObjectURL(url); throw e; }
}
async function addUploads(files){
  const good = [...files].filter(f=>/^image\/(png|jpeg|webp)$/.test(f.type)||/\.(png|jpe?g|webp)$/i.test(f.name));
  if(!good.length){ setStatus('Bitte PNG-, JPG- oder WebP-Dateien wählen.',true); return; }
  let added = 0;
  for(const file of good){
    const {img,url} = await fileToImage(file);
    const id = `upload_${++uploadCounter}`;
    uploads.set(id,{id,label:file.name.replace(/\.[^.]+$/,''),filename:file.name,mime:file.type||'image/png',w:img.naturalWidth,h:img.naturalHeight,img,url});
    uploadOrder.push(id); selected.add(id); added++;
  }
  $('uploadInfo').classList.remove('muted');
  $('uploadInfo').textContent = `${uploadOrder.length} Kartenbild(er) geladen.`;
  clearCache(); loadCorners(); renderInfo(); renderLayerControls(); refreshViews(); loadSelected();
  setStatus(`${added} Kartenbild(er) geladen. Diese können jetzt verzerrt und projiziert werden.`);
}
function removeUpload(id){
  const u = uploads.get(id); if(!u) return;
  URL.revokeObjectURL(u.url); uploads.delete(id); uploadOrder = uploadOrder.filter(v=>v!==id); selected.delete(id);
  $('uploadInfo').textContent = uploadOrder.length ? `${uploadOrder.length} Kartenbild(er) geladen.` : 'Noch keine Kartenbilder geladen.';
  $('uploadInfo').classList.toggle('muted',uploadOrder.length===0);
  clearCache(); loadCorners(); renderInfo(); renderLayerControls(); refreshViews(); loadSelected();
  setStatus(uploadOrder.length ? 'Kartenbild entfernt.' : 'Kein Kartenbild mehr geladen.');
}

function updateWhiteBackground(){
  const white = hasProject() && (maskActive() || hasWhiteReliefBackground(activeIds()));
  $('previewWhite').hidden = !white;
  $('projectionWhite').hidden = !white;
  if(white && projectorActive) drawProjection();
}
function setLayer(id, checked){
  if(checked) selected.add(id);
  else selected.delete(id);
  renderLayerControls(); refreshViews(); loadSelected();
}

function renderLayerControls(){
  ensureSelection();
  $('layerList').replaceChildren(); $('uploadLayerList').replaceChildren();
  $('historicLayerInfo').hidden=mapMode!=='historisch';
  $('waterDetail').disabled=mapMode!=='heute';
  if(mapMode==='historisch'){
    const label=document.createElement('label');label.className='layeritem'+(layout?'':' disabled');
    const box=document.createElement('input');box.type='checkbox';box.value='historisch';box.checked=selected.has('historisch');box.disabled=!layout;box.addEventListener('change',()=>setLayer('historisch',box.checked));
    const txt=document.createElement('span');txt.className='layertext';txt.textContent=`Zeitreise · ${historicYear}`;
    const sub=document.createElement('small');sub.textContent='Historische Landeskarten 1844–2026';txt.append(sub);label.append(box,txt);$('layerList').append(label);
  }
  for(const [id,title,subtitle] of (mapMode==='heute'?WMS_LAYERS:[])){
    const label = document.createElement('label'); label.className = 'layeritem'+(layout?'':' disabled');
    const box = document.createElement('input'); box.type='checkbox'; box.value=id; box.checked = selected.has(id); box.disabled = !layout;
    box.addEventListener('change',()=>setLayer(id,box.checked));
    const text = document.createElement('span'); text.className='layertext'; text.textContent=title;
    const small = document.createElement('small'); small.textContent = layout ? subtitle : 'Erst nach CSV-Upload verfügbar'; text.append(small);
    const idx = document.createElement('span'); idx.className='index'; idx.textContent = String(WMS_ORDER.indexOf(id)+1);
    label.append(box,text,idx); $('layerList').append(label);
  }
  uploadOrder.forEach((id,i)=>{
    const u = uploads.get(id); if(!u) return;
    const label = document.createElement('label'); label.className='layeritem';
    const box = document.createElement('input'); box.type='checkbox'; box.checked=selected.has(id); box.addEventListener('change',()=>setLayer(id,box.checked));
    const text = document.createElement('span'); text.className='layertext'; text.textContent = u.label;
    const small = document.createElement('small'); small.textContent = `${u.filename} · ${u.w} × ${u.h} px`; text.append(small);
    const actions = document.createElement('span'); actions.className='layeractions';
    const idx = document.createElement('span'); idx.className='index'; idx.textContent = `B${i+1}`;
    const del = document.createElement('button'); del.type='button'; del.className='miniButton'; del.textContent='Entfernen'; del.addEventListener('click',ev=>{ev.preventDefault(); removeUpload(id);});
    actions.append(idx,del); label.append(box,text,actions); $('uploadLayerList').append(label);

  });
  if(!uploadOrder.length){ const p=document.createElement('div'); p.className='uploadinfo muted'; p.textContent='Keine hochgeladenen Kartenbilder.'; $('uploadLayerList').append(p); }
  renderProjectorRail();
}

function slots(){
  // Im Modus Heute zuerst die neun nummerierten Kartenebenen, danach lokale Bilder.
  return [...modeWmsOrder().filter(id=>!!layout),...uploadOrder];
}
function renderProjectorRail(){
  const all = slots(), pages = Math.max(1,Math.ceil(all.length/9));
  railPage = Math.max(0,Math.min(pages-1,railPage));
  const box = $('projectorLayers'); box.replaceChildren();
  all.slice(railPage*9, railPage*9+9).forEach((id,i)=>{
    const meta=sourceMeta(id),button=document.createElement('button');
    button.type='button';button.className='railLayer';button.dataset.layer=id;
    const selectedNow=selected.has(id);
    button.setAttribute('aria-pressed',String(selectedNow));
    button.title=`${i+1}: ${meta?.label||id} – ein-/ausschalten, Mehrfachauswahl möglich`;
    const num=document.createElement('span');num.className='railNumber';num.textContent=String(i+1);
    const label=document.createElement('span');label.className='railName';label.textContent=meta?.label||id;
    button.append(num,label);
    button.addEventListener('click',()=>chooseSlot(id));box.append(button);
  });
  $('railPages').hidden=pages<=1;
  $('railToday').classList.toggle('active',mapMode==='heute');$('railHistoric').classList.toggle('active',mapMode==='historisch');
  $('railHistoricYear').hidden=mapMode!=='historisch';$('railYearValue').textContent=String(historicYear);
  $('pageIndicator').textContent=`${railPage+1}/${pages}`;
  $('prevPage').disabled=railPage===0;$('nextPage').disabled=railPage===pages-1;
}
function chooseSlot(id){
  // Jeder Klick und jede Ziffer 1–9 schaltet ausschliesslich diese Ebene um.
  // Alle bereits aktiven Ebenen bleiben aktiv – keine Sondertaste nötig.
  if(!sourceMeta(id))return;
  selected.has(id) ? selected.delete(id) : selected.add(id);
  renderLayerControls();refreshViews();loadSelected();
}

function changeRailPage(delta){
  const pages=Math.max(1,Math.ceil(slots().length/9));
  railPage=Math.max(0,Math.min(pages-1,railPage+delta));
  renderProjectorRail();
}

function imageRequest(url, anonymous=true){
  return new Promise((resolve,reject)=>{
    const img = new Image(); if(anonymous) img.crossOrigin='anonymous'; img.decoding='async'; let done=false;
    const timeout = setTimeout(()=>finish(Error('Zeitüberschreitung beim swisstopo-WMS.')),24000);
    function finish(err){ if(done) return; done=true; clearTimeout(timeout); img.onload=img.onerror=null; err?reject(err):resolve(img); }
    img.onload=()=>finish(null); img.onerror=()=>finish(Error('Kartenbild nicht erreichbar.')); img.src=url;
  });
}
async function loadImage(url){
  try{return {img:await imageRequest(url,true), cors:true};}
  catch(e){ try{return {img:await imageRequest(url,false), cors:false};} catch(_) { throw Error('swisstopo-WMS lieferte kein Kartenbild.'); } }
}
async function loadTileSet(id,w,h){
  if(id==='gewaesser')throw Error('Ungefilterter WMS-Gewässerabruf gesperrt.');
  const tileSpecs = Core.tiles(layout,w,h,1024); const result=[];
  for(let start=0; start<tileSpecs.length; start+=3){
    const batch = await Promise.all(tileSpecs.slice(start,start+3).map(async tile=>{ const url=Core.wmsUrl(id,tile,{year:historicYear}); const {img,cors}=await loadImage(url); return {...tile,img,cors,url}; }));
    result.push(...batch);
  }
  return {id,w,h,tiles:result,cors:result.every(t=>t.cors)};
}
function uploadTileSet(id,w,h){
  const u = uploads.get(id); if(!u) throw Error('Unbekanntes Kartenbild.');
  return {id,w,h,tiles:[{x:0,y:0,w,h,bbox:null,img:u.img,cors:true,url:u.url}],cors:true};
}
function loadSelected(){
  if(!hasProject()) return;
  for(const id of activeIds()) loadPreviewLayer(id);
  if(!selected.size) setStatus('Alle Karten aus · das Relief wird weiss beleuchtet.');
}
async function loadPreviewLayer(id){
  if(cache.has(id) || pending.has(id)) return;
  const [w,h] = previewBase();
  if(uploads.has(id)){ cache.set(id, uploadTileSet(id,w,h)); refreshViews(); return; }
  if(!layout || !Core.PRESETS[id]) return;
  const gen = generation; pending.set(id,true); setStatus(`${Core.PRESETS[id].label} wird geladen …`); renderLayerControls();
  try{
    if(id==='gewaesser')await ensureHydro();
    // Gewaesser immer ausschliesslich aus der Positivliste. Auch bei WFS-Fehler:
    // leere Ebene, NIE ein ungefiltertes WMS als Ersatz.
    const tileset = id==='gewaesser' ? {id,w,h,tiles:[],cors:true,hydro:true} : await loadTileSet(id,w,h); if(gen!==generation) return;
    cache.set(id,tileset); refreshViews(); updateHydroViews();
    if(activeIds().every(v=>cache.has(v))) {
      if(selected.has('gewaesser') && !hydroGood())setStatus('Gewässerdaten konnten nicht geladen werden. Detailfehler unter „Gewässerdarstellung“.',true);
      else setStatus(activeIds().some(v=>cache.get(v) && !cache.get(v).cors) ? 'Karten sichtbar · PNG-Export hängt bei swisstopo von CORS ab.' : 'Karten bereit · Verzerrung und Download möglich.');
    }
  }catch(error){ if(gen===generation) setStatus(`${Core.PRESETS[id].label}: ${error.message}`,true); }
  finally{ if(gen===generation){ pending.delete(id); renderLayerControls(); } }
}
function makeTileElement(layer, projector){
  const el = document.createElement('div'); el.className='mapTileLayer';
  if(projector){ el.style.width=`${layer.w}px`; el.style.height=`${layer.h}px`; }
  const frag = document.createDocumentFragment();
  for(const t of layer.tiles){
    const img = t.img.cloneNode(false); img.alt=''; img.draggable=false; img.className='mapTileImage';
    if(projector){ img.style.left=t.x+'px'; img.style.top=t.y+'px'; img.style.width=t.w+'px'; img.style.height=t.h+'px'; }
    else { img.style.left=(t.x/layer.w*100)+'%'; img.style.top=(t.y/layer.h*100)+'%'; img.style.width=(t.w/layer.w*100)+'%'; img.style.height=(t.h/layer.h*100)+'%'; }
    frag.append(img);
  }
  el.append(frag); return el;
}
function refreshViews(){
  if(!hasProject()) return;
  renderInfo();
  const preview = document.createDocumentFragment(), projector = document.createDocumentFragment();
  for(const id of activeIds()){
    const layer = cache.get(id); if(!layer) continue;
    const a = makeTileElement(layer,false); a.dataset.layer=id; preview.append(a);
    const b = makeTileElement(layer,true); b.dataset.layer=id; projector.append(b);
  }
  $('previewTiles').replaceChildren(preview); $('projectionTiles').replaceChildren(projector); updateWhiteBackground(); applyMaskToViews(); updateHydroViews(); drawProjection();
}
function drawProjection(){
  if(!projectorActive || !hasProject()) return;
  $('outline').setAttribute('points', corners.map(p=>`${p.x*1000},${p.y*1000}`).join(' '));
  document.querySelectorAll('.handle').forEach((el,i)=>{ el.style.left=`${corners[i].x*100}%`; el.style.top=`${corners[i].y*100}%`; });
  try{
    const rect = $('projector').getBoundingClientRect();
    const white = $('projectionWhite');
    if(!white.hidden){
      const [sw,sh]=previewBase();
      white.style.width = sw+'px'; white.style.height = sh+'px';
      white.style.transform=Core.cssPerspective(corners,sw,sh,rect.width,rect.height);
    }
    for(const el of $('projectionTiles').children){ const source = cache.get(el.dataset.layer); if(source) el.style.transform = Core.cssPerspective(corners,source.w,source.h,rect.width,rect.height); }
    const hydro=$('projectionHydro'); if(!hydro.hidden){const [sw,sh]=previewBase(); hydro.style.transform=Core.cssPerspective(corners,sw,sh,rect.width,rect.height);}
    $('projectorError').hidden = true;
  }catch(error){ $('projectorError').textContent=error.message; $('projectorError').hidden=false; }
}
async function openProjector(){
  if(!hasProject())return;
  projectorActive=true;$('projector').hidden=false;
  setHandles(false);setDock(true);railPage=0;
  renderProjectorRail();loadSelected();refreshViews();drawProjection();
  try{await $('projector').requestFullscreen();}catch(e){} // Browser ohne Vollbildfreigabe: Overlay bleibt möglich.
  drawProjection();
}
async function closeProjector(){ if(!projectorActive) return; projectorActive=false; $('projector').hidden=true; if(document.fullscreenElement) try{ await document.exitFullscreen(); }catch(e){} }
function setHandles(v){ handlesVisible=v; $('handles').hidden=!v; $('cornerLines').hidden=!v; $('resetCorners').hidden=!v; $('toggleHandles').classList.toggle('active',v);$('toggleHandles').setAttribute('aria-pressed',String(v)); }
function setDock(v){ dockVisible=v; $('projectorDock').hidden=!v; $('showDock').hidden=v; }
function dragging(){
  document.querySelectorAll('.handle').forEach(handle=>{
    const index = Number(handle.dataset.index); let dragId = null;
    handle.addEventListener('pointerdown',ev=>{ dragId=ev.pointerId; handle.setPointerCapture(ev.pointerId); ev.preventDefault(); });
    handle.addEventListener('pointermove',ev=>{
      if(dragId!==ev.pointerId) return;
      const rect = $('projector').getBoundingClientRect();
      corners[index] = {x:Math.max(0,Math.min(1,(ev.clientX-rect.left)/rect.width)), y:Math.max(0,Math.min(1,(ev.clientY-rect.top)/rect.height))};
      drawProjection();
    });
    const stop = ev=>{ if(dragId===ev.pointerId){ dragId=null; saveCorners(); } };
    handle.addEventListener('pointerup',stop); handle.addEventListener('pointercancel',stop);
    handle.addEventListener('keydown',ev=>{
      const delta = ev.shiftKey ? .01 : .001, p = corners[index];
      if(ev.key==='ArrowLeft') p.x=Math.max(0,p.x-delta); else if(ev.key==='ArrowRight') p.x=Math.min(1,p.x+delta); else if(ev.key==='ArrowUp') p.y=Math.max(0,p.y-delta); else if(ev.key==='ArrowDown') p.y=Math.min(1,p.y+delta); else return;
      ev.preventDefault(); drawProjection(); saveCorners();
    });
  });
}
function calibrationJSON(){
  return JSON.stringify({
    schema:'grossrelief-projektor-github-pages-v4',
    mode: layout ? 'layout+images' : 'images-only',
    layout_name: layoutName || null,
    layout_signature: contextSignature(),
    bbox_lv95: layout ? layout.bbox_lv95 : null,
    model_width_mm: layout ? layout.model_width_mm : null,
    model_depth_mm: layout ? layout.model_depth_mm : null,
    uploaded_images: uploadOrder.map(id=>{ const u=uploads.get(id); return {filename:u.filename,width:u.w,height:u.h}; }),
    layers: activeIds(),
    water_detail: waterDetail,
    map_mode:mapMode, historical_year:historicYear, waedenswil_only:waedenswilOnly,
    projection_corners_normalized: corners
  },null,2);
}
function restoreCalibration(text){
  const data = JSON.parse(text);
  if(!hasProject()) throw Error('Zuerst CSV laden oder Kartenbilder hochladen.');
  if(data.layout_signature !== contextSignature()) throw Error('Die Kalibrierung gehört zu einer anderen Relief- oder Bildkonfiguration.');
  if(!validCorners(data.projection_corners_normalized)) throw Error('Ungültige Eckpunkte in der Kalibrierung.');
  corners = data.projection_corners_normalized; saveCorners();
  if(data.water_detail){waterDetail='wichtig';$('waterDetail').value='wichtig';clearCache();}
  if(Number.isInteger(data.historical_year)&&data.historical_year>=1844&&data.historical_year<=2026)historicYear=data.historical_year;
  if(data.map_mode==='historisch'||data.map_mode==='heute')setMode(data.map_mode);
  if(Array.isArray(data.layers)){ selected = new Set(data.layers.filter(id=>sourceMeta(id))); }
  renderLayerControls(); refreshViews(); loadSelected(); drawProjection(); setStatus('Kalibrierung geladen.');
  if(data.waedenswil_only&&mapMode==='heute')$('waedenswilOnly').click();
}
function downloadBlob(blob,name){ const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=name; document.body.append(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(url),30000); }
function toPng(canvas){ return new Promise((resolve,reject)=>{ try{canvas.toBlob(blob=>blob?resolve(blob):reject(Error('PNG konnte nicht erstellt werden.')),'image/png');} catch(error){ reject(Error('Direkter PNG-Export wurde vom Browser blockiert.')); } }); }
function paintMasked(ctx,layer,w,h){
  if(!maskActive()){paintTiles(ctx,layer);return;}
  ctx.save();ctx.beginPath();
  const shapes=municipalGeometry.type==='Polygon'?[municipalGeometry.coordinates]:municipalGeometry.coordinates;
  const [west,south,east,north]=layout.bbox_lv95;
  for(const poly of shapes)for(const ring of poly){
    ring.forEach(([x,y],i)=>{const px=(x-west)/(east-west)*w,py=(north-y)/(north-south)*h;
      if(i===0)ctx.moveTo(px,py);else ctx.lineTo(px,py);});ctx.closePath();
  }
  ctx.clip('evenodd');paintTiles(ctx,layer);ctx.restore();
}
function paintTiles(ctx,layer){
  if(layer.id && Core.PRESETS[layer.id] && !layer.cors) throw Error(`Direkter PNG-Export von „${Core.PRESETS[layer.id].label}“ ist wegen fehlender Browserfreigabe des WMS-Dienstes nicht möglich.`);
  layer.tiles.forEach(t=>ctx.drawImage(t.img,t.x,t.y,t.w,t.h));
}
async function layerForExport(id,w,h){
  if(uploads.has(id)) return uploadTileSet(id,w,h);
  if(layout && Core.PRESETS[id]){
    if(id==='gewaesser'){await ensureHydro();return {id,w,h,tiles:[],cors:true,hydro:true};}
    return await loadTileSet(id,w,h);
  }
  throw Error('Diese Karte kann aktuell nicht exportiert werden.');
}
async function exportMaps(zip){
  if(!hasProject() || exporting) return;
  if(!activeIds().length){ setStatus('Bitte mindestens eine Karte auswählen.',true); return; }
  exporting=true; $('downloadCurrent').disabled=true; $('downloadAll').disabled=true;
  try{
    const [w,h] = exportBase();
    const canvas = document.createElement('canvas'); canvas.width=w; canvas.height=h; const ctx=canvas.getContext('2d');
    const current = activeIds(); const all = zip ? [...modeWmsOrder().filter(id=>layout), ...uploadOrder] : current;
    const files = [], drawsets = new Map();
    for(let i=0;i<all.length;i++){
      const id = all[i], meta = sourceMeta(id); setStatus(`Lade Karte ${i+1}/${all.length}: ${meta?.label || id} …`);
      const layer = await layerForExport(id,w,h); drawsets.set(id,layer);
      if(zip){ ctx.clearRect(0,0,w,h); paintMasked(ctx,layer,w,h); if(id==='gewaesser')paintHydro(ctx,w,h); const blob = await toPng(canvas); files.push({name:`karten/${sanitize(meta?.label||id)}.png`,data:new Uint8Array(await blob.arrayBuffer())}); }
    }
    ctx.clearRect(0,0,w,h);
    if(maskActive()||hasWhiteReliefBackground(current)){ctx.fillStyle='#ffffff';ctx.fillRect(0,0,w,h);}
    for(const id of current){ paintMasked(ctx, drawsets.get(id) || await layerForExport(id,w,h),w,h); if(id==='gewaesser')paintHydro(ctx,w,h); }
    const combo = await toPng(canvas);
    if(zip){
      files.push({name:'karten/kombination.png',data:new Uint8Array(await combo.arrayBuffer())});
      files.push({name:'kalibrierung.json',data:calibrationJSON()});
      if(layoutCsv) files.push({name:'layout.csv',data:layoutCsv});
      files.push({name:'QUELLEN.txt',data:'Karten: © swisstopo und beteiligte Bundesämter, https://www.geo.admin.ch/\nEigene Kartenbilder: lokal vom Benutzer geladen\nKoordinatensystem neuer Karten: EPSG:2056 (LV95)\n'});
      downloadBlob(Core.storeZip(files),`Grossrelief-${mapMode}${mapMode==='historisch'?'-'+historicYear:''}${maskActive()?'-Waedenswil':''}.zip`);
    }else downloadBlob(combo,`Grossrelief-${mapMode}${mapMode==='historisch'?'-'+historicYear:''}${maskActive()?'-Waedenswil':''}.png`);
    setStatus('Download erstellt.');
  }catch(error){ setStatus(error.message,true); }
  finally{ exporting=false; updateButtons(); }
}


function syncModeControls(){
  $('modeToday').classList.toggle('active',mapMode==='heute');$('modeToday').setAttribute('aria-pressed',String(mapMode==='heute'));
  $('modeHistoric').classList.toggle('active',mapMode==='historisch');$('modeHistoric').setAttribute('aria-pressed',String(mapMode==='historisch'));
  $('todayOptions').hidden=mapMode!=='heute';$('historicOptions').hidden=mapMode!=='historisch';
  $('historicYear').value=String(historicYear);$('historicYearLabel').textContent=String(historicYear);
  $('railYearValue').textContent=String(historicYear);
  $('waedenswilOnly').checked=waedenswilOnly;
}
function setMode(mode){
  if(mode!== 'heute'&&mode!=='historisch')return;
  if(mode!==mapMode){
    modeSelections[mapMode]=new Set(selected);
    mapMode=mode;selected=new Set(modeSelections[mapMode]);
    if(mapMode==='historisch'&&layout&&!selected.size)selected.add('historisch');
    ensureSelection();railPage=0;clearCache();
  }
  syncModeControls();renderLayerControls();renderInfo();refreshViews();loadSelected();
  setStatus(mode==='historisch'?`Historische Zeitreise: ${historicYear}`:'Kartenmodus: Heute');
}
function setHistoricalYear(y){
  const n=Math.max(1844,Math.min(2026,Math.round(Number(y))));if(!Number.isFinite(n))return;
  if(n!==historicYear){historicYear=n;clearCache();}
  syncModeControls();renderLayerControls();refreshViews();loadSelected();
  setStatus(`Zeitreise: ${historicYear}`);
}
async function getMunicipalGeometry(){
  if(municipalGeometry)return municipalGeometry;
  const endpoint='https://api3.geo.admin.ch/rest/services/ech/MapServer/find';
  const q=new URLSearchParams({layer:'ch.swisstopo.swissboundaries3d-gemeinde-flaeche.fill',searchText:'293',searchField:'gde_nr',contains:'false',geometryFormat:'geojson',returnGeometry:'true',sr:'2056'});
  const res=await fetch(`${endpoint}?${q.toString()}`,{mode:'cors'});
  if(!res.ok)throw Error(`Gemeindegrenze nicht erreichbar (HTTP ${res.status}).`);
  const data=await res.json();
  const matches=(data.results||[]).filter(r=>{
    const a=r.properties||r.attributes||{};
    return Number(a.gde_nr)===293&&a.gemname==='Wädenswil';
  });
  const result=matches.find(r=>String((r.properties||r.attributes||{}).is_current_jahr).toLowerCase()==='true');
  if(!result)throw Error('Aktuelle Gemeindegrenze von Wädenswil (BFS 293) nicht gefunden; Maske bleibt ausgeschaltet.');
  const geom=result.geometry;
  if(!geom||!['Polygon','MultiPolygon'].includes(geom.type))throw Error('Gemeindegrenze ohne nutzbares GeoJSON-Polygon.');
  municipalGeometry=geom;
  return geom;
}
async function applyMaskState(){
  const checkbox=$('waedenswilOnly');
  if(!checkbox.checked){waedenswilOnly=false;applyMaskToViews();updateWhiteBackground();setStatus('Wädenswil-Begrenzung ausgeschaltet.');return;}
  if(!layout){checkbox.checked=false;waedenswilOnly=false;setStatus('Für Gemeinde Wädenswil zuerst eine layout.csv laden.',true);return;}
  checkbox.disabled=true;$('boundaryStatus').textContent='Lade die aktuelle amtliche Grenze von Wädenswil …';
  try{
    const geom=await getMunicipalGeometry();
    const path=Core.geojsonClipPath(geom,layout.bbox_lv95);
    $('municipalPathGlobal').setAttribute('d',path);$('municipalPath').setAttribute('d',path);
    waedenswilOnly=true;$('boundaryStatus').textContent='Aktuelle Gemeindegrenze BFS 293 geladen. Alle Kartendaten ausserhalb werden ausgeblendet.';
    applyMaskToViews();updateWhiteBackground();setStatus('Nur Gemeinde Wädenswil aktiv.');
  }catch(e){waedenswilOnly=false;checkbox.checked=false;$('boundaryStatus').textContent=e.message;setStatus(e.message,true);}
  finally{checkbox.disabled=false;}
}
function applyMaskToViews(){
  const clipped=maskActive();
  const path=clipped?Core.geojsonClipPath(municipalGeometry,layout.bbox_lv95):'';
  if(clipped){$('municipalPathGlobal').setAttribute('d',path);$('municipalPath').setAttribute('d',path);}
  for(const node of document.querySelectorAll('#previewTiles .mapTileLayer'))node.style.clipPath=clipped?'url(#municipalClipGlobal)':'inset(0)';
  for(const node of document.querySelectorAll('#projectionTiles .mapTileLayer'))node.style.clipPath=clipped?'url(#municipalClip)':'inset(0)';
  $('previewHydro').style.clipPath=clipped?'url(#municipalClipGlobal)':'inset(0)';
  $('projectionHydro').style.clipPath=clipped?'url(#municipalClip)':'inset(0)';
}

function bindUI(){
  dragging(); renderLayerControls(); renderInfo();syncModeControls();
  $('modeToday').addEventListener('click',()=>setMode('heute'));
  $('modeHistoric').addEventListener('click',()=>setMode('historisch'));
  $('railToday').addEventListener('click',()=>setMode('heute'));
  $('railHistoric').addEventListener('click',()=>setMode('historisch'));
  $('waedenswilOnly').addEventListener('change',applyMaskState);
  $('historicYear').addEventListener('change',e=>setHistoricalYear(Number(e.target.value)));
  $('railYearBack').addEventListener('click',()=>setHistoricalYear(historicYear-10));
  $('railYearForward').addEventListener('click',()=>setHistoricalYear(historicYear+10));
  for(const year of [1850,1880,1900,1920,1950,1980,2000,2020]){const b=document.createElement('button');b.textContent=String(year);b.type='button';b.addEventListener('click',()=>setHistoricalYear(year));$('yearPresets').append(b);}
  $('layoutFile').addEventListener('change', async ev=>{ const f=ev.target.files?.[0]; if(f) parseLoadedCSV(await f.text(),f.name); ev.target.value=''; });
  $('imageFiles').addEventListener('change', async ev=>{ const files=ev.target.files; if(files?.length) try{ await addUploads(files); } catch(e){ setStatus(e.message,true); } ev.target.value=''; });
  $('loadExample').addEventListener('click', async ()=>{ try{ const r=await fetch('./examples/layout.csv'); if(!r.ok) throw Error('Beispieldatei konnte nicht geladen werden.'); parseLoadedCSV(await r.text(),'Beispiel-layout.csv'); }catch(e){ setStatus(e.message,true); } });
  [['dropZoneCsv','csv'],['dropZoneImages','img']].forEach(([id,type])=>{
    const drop=$(id); ['dragenter','dragover'].forEach(name=>drop.addEventListener(name,e=>{e.preventDefault(); drop.classList.add('dragging');})); ['dragleave','drop'].forEach(name=>drop.addEventListener(name,e=>{e.preventDefault(); drop.classList.remove('dragging');}));
    drop.addEventListener('drop', async e=>{ const files=e.dataTransfer?.files; if(!files?.length) return; try{ if(type==='csv'){ const f=files[0]; if(!f.name.toLowerCase().endsWith('.csv')) throw Error('Bitte eine CSV-Datei ablegen.'); parseLoadedCSV(await f.text(),f.name); } else await addUploads(files); }catch(err){ setStatus(err.message,true); } });
  });
  $('reload').addEventListener('click',()=>{ clearCache(); refreshViews(); loadSelected(); });
  $('downloadCurrent').addEventListener('click',()=>exportMaps(false));
  $('downloadAll').addEventListener('click',()=>exportMaps(true));
  $('saveCalibration').addEventListener('click',()=>{ if(hasProject()) downloadBlob(new Blob([calibrationJSON()],{type:'application/json'}),'Grossrelief-Kalibrierung.json'); });
  $('calibrationFile').addEventListener('change', async e=>{ const f=e.target.files?.[0]; if(f) try{ restoreCalibration(await f.text()); } catch(err){ setStatus(err.message,true); } e.target.value=''; });
  $('openProjector').addEventListener('click',openProjector); $('exitProjector').addEventListener('click',closeProjector);
  $('toggleHandles').addEventListener('click',()=>setHandles(!handlesVisible)); $('resetCorners').addEventListener('click',()=>{ corners=defaults(); saveCorners(); drawProjection(); }); $('toggleDock').addEventListener('click',()=>setDock(false)); $('showDock').addEventListener('click',()=>setDock(true));
  $('prevPage').addEventListener('click',()=>changeRailPage(-1));$('nextPage').addEventListener('click',()=>changeRailPage(1));
  window.addEventListener('resize',drawProjection);
  document.addEventListener('fullscreenchange',()=>{ if(projectorActive && !document.fullscreenElement) closeProjector(); else drawProjection(); });
  document.addEventListener('keydown',e=>{
    if(!projectorActive || e.target.matches('input,select,textarea')) return;
    if(e.key==='Escape'){ closeProjector(); e.preventDefault(); return; }
    if(e.key.toLowerCase()==='h'){setMode(mapMode==='heute'?'historisch':'heute');e.preventDefault();}
    else if(e.key.toLowerCase()==='k' || e.key.toLowerCase()==='m'){setHandles(!handlesVisible);e.preventDefault();}
    else if(e.key.toLowerCase()==='t'){setDock(!dockVisible);e.preventDefault();}
    else if(/^(Digit|Numpad)[1-9]$/.test(e.code)){
      if(e.repeat){e.preventDefault();return;} // Gehaltene Taste nicht mehrfach umschalten.
      const slot=slots()[railPage*9+Number(e.code.slice(-1))-1];
      if(slot)chooseSlot(slot);
      e.preventDefault();
    }else if(e.key==='PageDown'){changeRailPage(1);e.preventDefault();}
    else if(e.key==='PageUp'){changeRailPage(-1);e.preventDefault();}
  });
}
if(!Core || Core.version !== '5.9.11' || !Hydro || Hydro.VERSION !== '5.9.11'){
  document.addEventListener('DOMContentLoaded',()=>{
    const status = document.getElementById('statusText');
    if(status) status.textContent='Versionskonflikt: Bitte alle Dateien der v5.9.11 hochladen und Seite mit Strg+F5 neu laden.';
  });
} else {
  bindUI();
}
