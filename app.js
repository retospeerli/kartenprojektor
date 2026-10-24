'use strict';
const Core = window.GrossreliefCore;
const WMS_LAYERS = [
 ['luftbild','Luftbild','SWISSIMAGE-Orthofoto'],
 ['gewaesser','Gewässer','Flüsse, Bäche, Seen'],
 ['verkehr','Verkehrswege','Strassen, Bahn und Seilbahnen'],
 ['gemeinden','Gemeinden','Politische Gemeindegrenzen'],
 ['siedlungen','Siedlungen','Siedlungsflächen'],
 ['orte','Ortschaften','Ortsnamen'],
 ['bauten','Bauten','Gebäude, Anlagen und Einzelobjekte'],
 ['uebersicht','Landeskarte','Topografische Übersicht']
];
const WMS_ORDER = WMS_LAYERS.map(v=>v[0]);
const $ = id => document.getElementById(id);
const defaults = () => [{x:.14,y:.20},{x:.86,y:.20},{x:.86,y:.82},{x:.14,y:.82}];
let layout = null, layoutName = '', layoutCsv = '';
let uploads = new Map(), uploadOrder = [], uploadCounter = 0;
let selected = new Set();
let corners = defaults();
let cache = new Map(), pending = new Map(), generation = 0;
let projectorActive = false, handlesVisible = true, dockVisible = true, exporting = false;

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
function activeIds(){return [...WMS_ORDER.filter(id=>selected.has(id)), ...uploadOrder.filter(id=>selected.has(id))];}
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
  const valid = new Set([...WMS_ORDER.filter(id=>layout), ...uploadOrder]);
  selected = new Set([...selected].filter(id=>valid.has(id)));
  if(layout && ![...selected].some(id=>WMS_ORDER.includes(id)) && uploadOrder.length===0) selected.add('luftbild');
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
  $('previewFrame').style.aspectRatio = `${w}/${h}`;
  $('imageSize').textContent = `Vorschau ${w} × ${h} px`;
  $('modeInfo').textContent = layout ? 'Reliefmodus mit layout.csv · swisstopo-Karten und eigene Bilder kombinierbar' : 'Bildmodus ohne CSV · hochgeladene Kartenbilder projizierbar';
}

function parseLoadedCSV(text, filename){
  try{
    const meta = Core.parseLayoutCsv(text);
    layout = meta; layoutCsv = text; layoutName = filename;
    $('layoutInfo').hidden = false; $('layoutName').textContent = filename; $('fileTitle').textContent = filename;
    $('segments').textContent = `${meta.segments} (${meta.columns} × ${meta.rows})`;
    $('modelSize').textContent = `${nice(meta.model_width_mm,1)} × ${nice(meta.model_depth_mm,3)} mm`;
    $('areaSize').textContent = `${nice(meta.geo_width_m)} × ${nice(meta.geo_depth_m)} m`;
    $('coordinates').textContent = `E: ${nice(meta.bbox_lv95[0],3)} – ${nice(meta.bbox_lv95[2],3)} · N: ${nice(meta.bbox_lv95[1],3)} – ${nice(meta.bbox_lv95[3],3)}`;
    ensureSelection(); if(![...selected].some(id=>WMS_ORDER.includes(id))) selected.add('luftbild');
    clearCache(); loadCorners(); renderInfo(); renderLayerControls(); refreshViews(); loadSelected();
    setStatus(`CSV geladen: ${meta.segments} Segmente · swisstopo-Karten können erzeugt werden.`);
  }catch(error){ setStatus('CSV-Fehler: '+error.message,true); }
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

function setLayer(id, checked){
  if(checked){ if(id==='luftbild') selected.delete('uebersicht'); if(id==='uebersicht') selected.delete('luftbild'); selected.add(id); }
  else selected.delete(id);
  renderLayerControls(); refreshViews(); loadSelected();
}

function renderLayerControls(){
  ensureSelection();
  $('layerList').replaceChildren(); $('uploadLayerList').replaceChildren(); $('projectorLayers').replaceChildren();
  for(const [id,title,subtitle] of WMS_LAYERS){
    const label = document.createElement('label'); label.className = 'layeritem'+(layout?'':' disabled');
    const box = document.createElement('input'); box.type='checkbox'; box.value=id; box.checked = selected.has(id); box.disabled = !layout;
    box.addEventListener('change',()=>setLayer(id,box.checked));
    const text = document.createElement('span'); text.className='layertext'; text.textContent=title;
    const small = document.createElement('small'); small.textContent = layout ? subtitle : 'Erst nach CSV-Upload verfügbar'; text.append(small);
    const idx = document.createElement('span'); idx.className='index'; idx.textContent = String(WMS_ORDER.indexOf(id)+1);
    label.append(box,text,idx); $('layerList').append(label);
    if(layout){
      const button = document.createElement('button'); button.type='button'; button.dataset.layer=id; button.className='layerpill';
      button.setAttribute('aria-pressed',String(selected.has(id))); button.append(document.createTextNode(title));
      button.addEventListener('click',()=>setLayer(id,!selected.has(id))); $('projectorLayers').append(button);
    }
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

    const button = document.createElement('button'); button.type='button'; button.dataset.layer=id; button.className='layerpill';
    button.setAttribute('aria-pressed',String(selected.has(id))); button.append(document.createTextNode(u.label));
    button.addEventListener('click',()=>setLayer(id,!selected.has(id))); $('projectorLayers').append(button);
  });
  if(!uploadOrder.length){ const p=document.createElement('div'); p.className='uploadinfo muted'; p.textContent='Keine hochgeladenen Kartenbilder.'; $('uploadLayerList').append(p); }
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
  const tileSpecs = Core.tiles(layout,w,h,1024); const result=[];
  for(let start=0; start<tileSpecs.length; start+=3){
    const batch = await Promise.all(tileSpecs.slice(start,start+3).map(async tile=>{ const url=Core.wmsUrl(id,tile); const {img,cors}=await loadImage(url); return {...tile,img,cors,url}; }));
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
  if(!selected.size) setStatus('Alle Karten ausgeschaltet: schwarze Projektion.');
}
async function loadPreviewLayer(id){
  if(cache.has(id) || pending.has(id)) return;
  const [w,h] = previewBase();
  if(uploads.has(id)){ cache.set(id, uploadTileSet(id,w,h)); refreshViews(); return; }
  if(!layout || !Core.PRESETS[id]) return;
  const gen = generation; pending.set(id,true); setStatus(`${Core.PRESETS[id].label} wird geladen …`); renderLayerControls();
  try{
    const tileset = await loadTileSet(id,w,h); if(gen!==generation) return;
    cache.set(id,tileset); refreshViews();
    if(activeIds().every(v=>cache.has(v))) setStatus(activeIds().some(v=>cache.get(v) && !cache.get(v).cors) ? 'Karten sichtbar · PNG-Export hängt bei swisstopo von CORS ab.' : 'Karten bereit · Verzerrung und Download möglich.');
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
  $('previewTiles').replaceChildren(preview); $('projectionTiles').replaceChildren(projector); drawProjection();
}
function drawProjection(){
  if(!projectorActive || !hasProject()) return;
  $('outline').setAttribute('points', corners.map(p=>`${p.x*1000},${p.y*1000}`).join(' '));
  document.querySelectorAll('.handle').forEach((el,i)=>{ el.style.left=`${corners[i].x*100}%`; el.style.top=`${corners[i].y*100}%`; });
  try{
    const rect = $('projector').getBoundingClientRect();
    for(const el of $('projectionTiles').children){ const source = cache.get(el.dataset.layer); if(source) el.style.transform = Core.cssPerspective(corners,source.w,source.h,rect.width,rect.height); }
    $('projectorError').hidden = true;
  }catch(error){ $('projectorError').textContent=error.message; $('projectorError').hidden=false; }
}
async function openProjector(){ if(!hasProject()) return; projectorActive=true; $('projector').hidden=false; loadSelected(); refreshViews(); drawProjection(); try{await $('projector').requestFullscreen();}catch(e){} drawProjection(); }
async function closeProjector(){ if(!projectorActive) return; projectorActive=false; $('projector').hidden=true; if(document.fullscreenElement) try{ await document.exitFullscreen(); }catch(e){} }
function setHandles(v){ handlesVisible=v; $('handles').hidden=!v; $('cornerLines').hidden=!v; $('toggleHandles').textContent=v?'Ecken ausblenden (M)':'Ecken zeigen (M)'; }
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
    projection_corners_normalized: corners
  },null,2);
}
function restoreCalibration(text){
  const data = JSON.parse(text);
  if(!hasProject()) throw Error('Zuerst CSV laden oder Kartenbilder hochladen.');
  if(data.layout_signature !== contextSignature()) throw Error('Die Kalibrierung gehört zu einer anderen Relief- oder Bildkonfiguration.');
  if(!validCorners(data.projection_corners_normalized)) throw Error('Ungültige Eckpunkte in der Kalibrierung.');
  corners = data.projection_corners_normalized; saveCorners();
  if(Array.isArray(data.layers)){ selected = new Set(data.layers.filter(id=>sourceMeta(id))); if(selected.has('luftbild')&&selected.has('uebersicht')) selected.delete('uebersicht'); }
  renderLayerControls(); refreshViews(); loadSelected(); drawProjection(); setStatus('Kalibrierung geladen.');
}
function downloadBlob(blob,name){ const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=name; document.body.append(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(url),30000); }
function toPng(canvas){ return new Promise((resolve,reject)=>{ try{canvas.toBlob(blob=>blob?resolve(blob):reject(Error('PNG konnte nicht erstellt werden.')),'image/png');} catch(error){ reject(Error('Direkter PNG-Export wurde vom Browser blockiert.')); } }); }
function paintTiles(ctx,layer){
  if(layer.id && Core.PRESETS[layer.id] && !layer.cors) throw Error(`Direkter PNG-Export von „${Core.PRESETS[layer.id].label}“ ist wegen fehlender Browserfreigabe des WMS-Dienstes nicht möglich.`);
  layer.tiles.forEach(t=>ctx.drawImage(t.img,t.x,t.y,t.w,t.h));
}
async function layerForExport(id,w,h){
  if(uploads.has(id)) return uploadTileSet(id,w,h);
  if(layout && Core.PRESETS[id]) return await loadTileSet(id,w,h);
  throw Error('Diese Karte kann aktuell nicht exportiert werden.');
}
async function exportMaps(zip){
  if(!hasProject() || exporting) return;
  if(!activeIds().length){ setStatus('Bitte mindestens eine Karte auswählen.',true); return; }
  exporting=true; $('downloadCurrent').disabled=true; $('downloadAll').disabled=true;
  try{
    const [w,h] = exportBase();
    const canvas = document.createElement('canvas'); canvas.width=w; canvas.height=h; const ctx=canvas.getContext('2d');
    const current = activeIds(); const all = zip ? [...WMS_ORDER.filter(id=>layout), ...uploadOrder] : current;
    const files = [], drawsets = new Map();
    for(let i=0;i<all.length;i++){
      const id = all[i], meta = sourceMeta(id); setStatus(`Lade Karte ${i+1}/${all.length}: ${meta?.label || id} …`);
      const layer = await layerForExport(id,w,h); drawsets.set(id,layer);
      if(zip){ ctx.clearRect(0,0,w,h); paintTiles(ctx,layer); const blob = await toPng(canvas); files.push({name:`karten/${sanitize(meta?.label||id)}.png`,data:new Uint8Array(await blob.arrayBuffer())}); }
    }
    ctx.clearRect(0,0,w,h); for(const id of current) paintTiles(ctx, drawsets.get(id) || await layerForExport(id,w,h));
    const combo = await toPng(canvas);
    if(zip){
      files.push({name:'karten/kombination.png',data:new Uint8Array(await combo.arrayBuffer())});
      files.push({name:'kalibrierung.json',data:calibrationJSON()});
      if(layoutCsv) files.push({name:'layout.csv',data:layoutCsv});
      files.push({name:'QUELLEN.txt',data:'Karten: © swisstopo und beteiligte Bundesämter, https://www.geo.admin.ch/\nEigene Kartenbilder: lokal vom Benutzer geladen\nKoordinatensystem neuer Karten: EPSG:2056 (LV95)\n'});
      downloadBlob(Core.storeZip(files),'Grossrelief-Kartenpaket.zip');
    }else downloadBlob(combo,'Grossrelief-sichtbare-Karten.png');
    setStatus('Download erstellt.');
  }catch(error){ setStatus(error.message,true); }
  finally{ exporting=false; updateButtons(); }
}

function bindUI(){
  dragging(); renderLayerControls(); renderInfo();
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
  $('toggleHandles').addEventListener('click',()=>setHandles(!handlesVisible)); $('resetCorners').addEventListener('click',()=>{ corners=defaults(); saveCorners(); drawProjection(); }); $('showDock').addEventListener('click',()=>setDock(true));
  window.addEventListener('resize',drawProjection);
  document.addEventListener('fullscreenchange',()=>{ if(projectorActive && !document.fullscreenElement) closeProjector(); else drawProjection(); });
  document.addEventListener('keydown',e=>{
    if(!projectorActive || e.target.matches('input,select,textarea')) return;
    if(e.key==='Escape'){ closeProjector(); return; }
    if(e.key.toLowerCase()==='m'){ setHandles(!handlesVisible); e.preventDefault(); }
    else if(e.key.toLowerCase()==='t'){ setDock(!dockVisible); e.preventDefault(); }
  });
}
bindUI();
