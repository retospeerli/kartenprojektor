'use strict';
/* Vectors and labels for one relief. No hardcoded coordinates or invented placements. */
(function(root){
const waters={
 lakes:['Zürichsee','Hüttnersee','Ausee','Sternenweiher','Teufenbachweiher','Freyenweiher','Bachgadenweiher'],
 streams:['Sihl','Reidbach','Gulmenbach','Zopfbach','Meilibach','Schlossbach','Risibach','Töbelibach','Winterbergholzbächli']
};
const lexicon=[
 ['Büel / Bühl','Hügel, rundliche Erhebung','Zopfisbüel','Bühl'],
 ['Egg','Hanggeländekante, Grat, Ecke','Langegg','Egg'],
 ['Ried / Riet','Sumpfiges, mit Schilf bewachsenes Land','Rietliau','Hüttnerried'],
 ['Weid','Eingezäuntes Weideland für Vieh','Eichweid','Feldweid'],
 ['Acher / Acker','Feld für Pflanzen- oder Getreideanbau','Breitacher','Chirchacher'],
 ['Schwand','Gerodeter Wald','Schwanden'],
 ['Rüti / Rütli','Durch Rodung gewonnenes Land','Langrüti','Wiesengrundrüti'],
 ['Moos','Moorlandschaft, nasser Torfboden','Segelmoos','Torfmoos'],
 ['Tobel','Tiefes, bewaldetes Kerbtal mit einem Bach','Gulmentobel','Reidbachtobel'],
 ['Halde','Steiler Berghang oder Abhang','Gishalden','Halden'],
 ['Holz','Wald oder grösseres Gehölz','Grossholz','Chaltenbodenholz'],
 ['Boden','Flaches Gelände oder Hochebene','Chaltenboden','Schönenboden'],
 ['Berg','Höher gelegener Ortsteil oder Hügelzug','Wädenswiler Berg','Winterberg'],
 ['Bach','Siedlung oder Flur an einem Fliessgewässer','Reidbach','Teufenbach'],
 ['Matt / Matte','Meist feuchte Wiese zur Heugewinnung','Mätteli','Breitmatten'],
 ['Hof','Eingefriedetes Gut, landwirtschaftlicher Betrieb','Meierhof','Neuhof'],
 ['Rain','Grenzstreifen, schmaler Hang am Feldrain','Felsenrain','Chirchrain'],
 ['Giessen','Rasch fliessendes Wasser, oft mit Wasserfall','Giessen'],
 ['Stocken','Fläche mit Baumstümpfen nach einer Rodung','Stocken']
];
const forests=['Grossholz','Chaltenbodenholz'];
const settlements=['Wädenswil','Au','Schönenberg','Hütten','Giessen','Stocken','Schwanden'];
const flurnamen=[...new Set(lexicon.flatMap(row=>row.slice(2)))].filter(name=>!waters.lakes.includes(name)&&!waters.streams.includes(name)&&!forests.includes(name)&&!settlements.includes(name));
const allNames=[...new Set([...waters.lakes,...waters.streams,...forests,...settlements,...flurnamen])];
const requests=new Map();
function lv95ToWgs(E,N){const y=(E-2600000)/1e6,x=(N-1200000)/1e6;
 const lat=16.9023892+3.238272*x-0.270978*y*y-0.002528*x*x-0.0447*y*y*x-0.0140*x*x*x;
 const lon=2.6779094+4.728982*y+0.791484*y*x+0.1306*y*x*x-0.0436*y*y*y;
 return [lat*100/36,lon*100/36];}
function wgsToLv95(lat,lon){const phi=(lat*3600-169028.66)/10000,lambda=(lon*3600-26782.5)/10000;
 const E=2600072.37+211455.93*lambda-10938.51*lambda*phi-0.36*lambda*phi*phi-44.54*lambda**3;
 const N=1200147.07+308807.95*phi+3745.25*lambda*lambda+76.63*phi*phi-194.56*lambda*lambda*phi+119.79*phi**3;
 return [E,N];}
function normalize(str){return (str||'').toString().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('de-CH').replace(/\s+/g,' ').trim();}
function inExtent(E,N,bbox,margin=0){return E>=bbox[0]-margin && E<=bbox[2]+margin && N>=bbox[1]-margin && N<=bbox[3]+margin;}
function bboxKey(layout){return layout.bbox_lv95.map(v=>v.toFixed(1)).join(',');}
async function fetchWithTimeout(url,opts={},ms=21000){const c=new AbortController(),t=setTimeout(()=>c.abort(),ms);try{const r=await fetch(url,{...opts,signal:c.signal});if(!r.ok)throw Error(`HTTP ${r.status}`);return await r.json();}finally{clearTimeout(t);}}
function parseGeoSearch(data,name,layout){
 const rows=(data.results||[]).map(item=>{
  const a=item.attrs||{}; const x=Number(a.x),y=Number(a.y);
  // GeoAdmin SearchServer uses x=northing, y=easting in the chosen Swiss reference.
  const E=y,N=x;
  const cleanLabel=String(a.label||'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
  const boldLabel=String(a.label||'').match(/<b[^>]*>(.*?)<\/b>/i)?.[1];
  const exact=normalize((boldLabel||cleanLabel).replace(/<[^>]*>/g,''))===normalize(name);
  return {E,N,exact,rank:Number(a.rank)||0,origin:a.origin||'',name};
 }).filter(p=>Number.isFinite(p.E)&&Number.isFinite(p.N)&&inExtent(p.E,p.N,layout.bbox_lv95)&&p.exact);
 rows.sort((a,b)=>a.rank-b.rank);return rows[0]||null;
}
async function fetchNamedPoint(name,layout){
 const q=new URLSearchParams({type:'locations',searchText:name,sr:'2056',origins:'gazetteer',limit:'50'});
 const data=await fetchWithTimeout('https://api3.geo.admin.ch/rest/services/ech/SearchServer?'+q.toString(),{},13000);
 return parseGeoSearch(data,name,layout);
}
function targetNames(selected,showFlur){return [...new Set(labelCategories(selected,showFlur).flatMap(row=>row[1]))];}
// Query the official swissNAMES3D gazetteer by the *whole relief extent*,
// instead of limiting names to the hand-authored teaching vocabulary.
function swissCategory(name, objectclass=''){
 const n=normalize(name),cls=normalize(objectclass);
 if([...waters.lakes,...waters.streams].some(s=>normalize(s)===n)||/gewaesser|fliess|see|wasserlauf|bach/.test(cls))return 'water';
 if(forests.some(s=>normalize(s)===n)||/wald|gehoelz/.test(cls))return 'forest';
 if(settlements.some(s=>normalize(s)===n)||/siedlung|ortschaft|populated/.test(cls))return 'settlement';
 if(flurnamen.some(s=>normalize(s)===n)||/flur|lokal|gelaende|gebiet|gelande/.test(cls))return 'flur';
 return null;
}
function parseBboxNames(data,layout){
 const out=[];
 for(const item of data.results||[]){
  const a=item.attrs||{};
  if(a.origin!=='gazetteer')continue;
  const E=Number(a.y),N=Number(a.x);
  if(!Number.isFinite(E)||!Number.isFinite(N)||!inExtent(E,N,layout.bbox_lv95))continue;
  // The bold span in SearchServer labels is the actual toponym, not the suffix
  // containing the commune / canton name.
  const bold=String(a.label||'').match(/<b[^>]*>(.*?)<\/b>/i)?.[1];
  const name=(bold||'').replace(/<[^>]*>/g,'').replace(/&amp;/g,'&').replace(/&quot;/g,'"').trim();
  if(!name)continue;
  const category=swissCategory(name,a.objectclass||'');
  if(category)out.push({E,N,rank:Number(a.rank)||10,origin:'gazetteer',name,category,objectclass:a.objectclass||''});
 }
 return out;
}
async function extentNames(layout){
 const key='extent:'+bboxKey(layout);
 if(requests.has(key))return requests.get(key);
 const promise=(async()=>{
  const [W,S,E,N]=layout.bbox_lv95,results=[];let successful=0;
  const grid=[];
  for(let y=0;y<4;y++)for(let x=0;x<3;x++){
   const bbox=[W+(E-W)*x/3,S+(N-S)*y/4,W+(E-W)*(x+1)/3,S+(N-S)*(y+1)/4];
   const q=new URLSearchParams({type:'locations',origins:'gazetteer',bbox:bbox.map(n=>n.toFixed(3)).join(','),sr:'2056',limit:'50'});
   grid.push('https://api3.geo.admin.ch/rest/services/ech/SearchServer?'+q.toString());
  }
  for(let i=0;i<grid.length;i+=4){
   const slice=await Promise.all(grid.slice(i,i+4).map(url=>fetchWithTimeout(url,{},11000).catch(()=>null)));
   for(const d of slice){if(!d)continue;successful++;results.push(...parseBboxNames(d,layout));}
  }
  if(!successful)throw Error('swissNAMES3D-Suche nicht erreichbar.');
  const unique=new Map();for(const p of results){const k=normalize(p.name)+':'+Math.round(p.E/40)+':'+Math.round(p.N/40);if(!unique.has(k))unique.set(k,p);}
  return [...unique.values()];
 })();requests.set(key,promise);promise.catch(()=>requests.delete(key));return promise;
}
async function geocodedNames(layout,selected,showFlur){
 let broad=[],lastError=null;
 try{broad=await extentNames(layout);}catch(e){lastError=e;}
 const wanted=targetNames(selected,showFlur);
 const foundNames=new Set(broad.map(p=>normalize(p.name)));
 // Re-query named priority features that are missing in bbox results: full
 // official location search can find names obscured by the bbox result limit.
 const priorities=wanted.filter(n=>!foundNames.has(normalize(n))).slice(0,38);
 const more=[];
 for(let start=0;start<priorities.length;start+=6){
  const found=await Promise.all(priorities.slice(start,start+6).map(async name=>{
   const key='name:'+bboxKey(layout)+':'+name;
   if(!requests.has(key)){
    const p=fetchNamedPoint(name,layout).catch(()=>null);
    requests.set(key,p);
   }
   return requests.get(key);
  }));more.push(...found.filter(Boolean).map(p=>({...p,category:swissCategory(p.name)||'flur'})));
 }
 if(!broad.length && !more.length && lastError)throw lastError;
 const seen=new Set(),out=[];
 for(const p of [...more,...broad]){
  const k=normalize(p.name)+':'+Math.round(p.E/40)+':'+Math.round(p.N/40);
  if(seen.has(k))continue;seen.add(k);out.push(p);
 }
 out.report={available:out.length,official:'swissNAMES3D',bboxCount:broad.length};
 return out;
}
// Query all explicitly named water features and stream sections. OSM often
// divides a single named brook into several ways; never assume one name = one way.
// Matching is performed on the actual returned name tags after retrieval.
function namePattern(){
 return [...waters.lakes,...waters.streams].map(name=>name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|');
}
function waterQuery(layout){
 const [W,S,E,N]=layout.bbox_lv95;
 const a=lv95ToWgs(W,S),b=lv95ToWgs(E,N);
 const bb=[Math.min(a[0],b[0])-.002,Math.min(a[1],b[1])-.002,Math.max(a[0],b[0])+.002,Math.max(a[1],b[1])+.002].map(v=>v.toFixed(6)).join(',');
 const filter=`^(${namePattern()})`;
 const parts=[];
 for(const type of ['way','relation']){
  for(const field of ['name','name:de','alt_name']){
   // Restrict to requested names in the query; validate water tags afterwards.
   parts.push(`${type}["${field}"~"${filter}",i](${bb});`);
  }
 }
 return `[out:json][timeout:40];(${parts.join('')});out geom;`;
}
function canonicalWaterName(tags){
 const candidates=[tags?.name,tags?.['name:de'],tags?.alt_name,tags?.official_name,tags?.loc_name]
  .flatMap(v=>String(v||'').split(';').map(s=>normalize(s).replace(/[’']/g,'')));
 for(const candidate of candidates){
  for(const target of [...waters.streams,...waters.lakes]){
   const ref=normalize(target);
   // Parenthetical qualifiers / compound labels are OK; unrelated names aren't.
   if(candidate===ref||candidate.startsWith(ref+' (')||candidate.startsWith(ref+' /')||candidate.startsWith(ref+' -'))return target;
  }
 }
 return null;
}
function extractNamedWaters(elements,layout){
 const result=[],unique=new Set();
 const bbox=layout.bbox_lv95;
 for(const el of elements||[]){
  const canonical=canonicalWaterName(el.tags);
  if(!canonical)continue;
  const kind=waters.lakes.includes(canonical)?'lake':'stream';
  const isWaterway=el.tags?.waterway||el.tags?.natural==='water'||el.tags?.water;
  if(!isWaterway)continue;
  const geometries=Array.isArray(el.geometry)?[el.geometry]:Array.isArray(el.members)?
   el.members.filter(m=>Array.isArray(m.geometry)&&(kind==='stream'||m.role==='outer')).map(m=>m.geometry):[];
  for(const geom of geometries){
   if(geom.length<2)continue;
   const coords=geom.map(v=>wgsToLv95(Number(v.lat),Number(v.lon)))
    .filter(p=>Number.isFinite(p[0])&&Number.isFinite(p[1]));
   if(coords.length<2)continue;
   // Do not accept a line that is entirely outside the current relief window.
   const extent=[Math.min(...coords.map(p=>p[0])),Math.min(...coords.map(p=>p[1])),
                 Math.max(...coords.map(p=>p[0])),Math.max(...coords.map(p=>p[1]))];
   if(extent[0]>bbox[2]||extent[2]<bbox[0]||extent[1]>bbox[3]||extent[3]<bbox[1])continue;
   const a=coords[0],b=coords.at(-1),endpoints=[a,b].map(q=>q.map(v=>Math.round(v/2)).join(',')).sort().join('|');
   const key=canonical+':'+endpoints+':'+coords.length;
   if(unique.has(key))continue;unique.add(key);
   result.push({name:canonical,kind,coords,osmName:el.tags?.name||''});
  }
 }
 const got=new Set(result.map(v=>v.name)),all=[...waters.lakes,...waters.streams];
 result.report={total:all.length,found:got.size,missing:all.filter(n=>!got.has(n)),
  streamsFound:waters.streams.filter(n=>got.has(n)),streamsMissing:waters.streams.filter(n=>!got.has(n)),
  lakesFound:waters.lakes.filter(n=>got.has(n)),lakesMissing:waters.lakes.filter(n=>!got.has(n))};
 return result;
}
// A strict 16-item whitelist. GeoJSON in LV95 can be checked into the
// GitHub repository once validated. Browser storage avoids needless re-queries.
const WATER_FILE='./data/selected-waters.geojson';
const waterOverlays=new Map();
const waterDbName='grossrelief-selected-water-v58';
function waterReport(features){
 const all=[...waters.lakes,...waters.streams],got=new Set(features.map(f=>f.name));
 features.report={total:all.length,found:got.size,missing:all.filter(n=>!got.has(n)),
 streamsFound:waters.streams.filter(n=>got.has(n)),streamsMissing:waters.streams.filter(n=>!got.has(n)),
 lakesFound:waters.lakes.filter(n=>got.has(n)),lakesMissing:waters.lakes.filter(n=>!got.has(n))};
 return features;
}
function toWaterGeojson(features,layout){
 return {type:'FeatureCollection',name:'Grossrelief · Gewässerauswahl',
  metadata:{crs:'EPSG:2056',bbox_lv95:layout.bbox_lv95,source:'OpenStreetMap · ODbL; benannte Geometrien – vor Verwendung verifizieren',
   names:[...waters.lakes,...waters.streams],missing:waterReport(features).report.missing},
  features:features.map(f=>({type:'Feature',properties:{name:f.name,kind:f.kind},
   geometry:{type:'LineString',coordinates:f.coords}}))};
}
function fromWaterGeojson(data,layout){
 if(data?.type!=='FeatureCollection'||!Array.isArray(data.features))throw Error('Ungültige GeoJSON-Gewässerdatei.');
 if(data.metadata?.crs!=='EPSG:2056')throw Error('Gewässerdatei muss LV95 (EPSG:2056) verwenden.');
 const expected=layout.bbox_lv95,got=data.metadata?.bbox_lv95;
 if(!Array.isArray(got)||got.length!==4||got.some((v,i)=>Math.abs(Number(v)-expected[i])>0.3))
  throw Error('Diese Gewässerdatei gehört nicht zum geladenen Gesamtrelief (andere LV95-Grenzen).');
 const result=[];
 for(const item of data.features){
  const name=[...waters.lakes,...waters.streams].find(n=>normalize(n)===normalize(item?.properties?.name));
  if(!name||item.geometry?.type!=='LineString'||!Array.isArray(item.geometry.coordinates))continue;
  const coords=item.geometry.coordinates.filter(pt=>Array.isArray(pt)&&pt.length>=2&&pt.slice(0,2).every(Number.isFinite))
   .map(pt=>pt.slice(0,2));
  if(coords.length<2)continue;
  const xs=coords.map(pt=>pt[0]),ys=coords.map(pt=>pt[1]);
  if(Math.min(...xs)>expected[2]||Math.max(...xs)<expected[0]||Math.min(...ys)>expected[3]||Math.max(...ys)<expected[1])continue;
  result.push({name,kind:waters.lakes.includes(name)?'lake':'stream',coords,verifiedSource:'local'});
 }
 return waterReport(result);
}
function openWaterDb(){
 if(!('indexedDB' in root))return Promise.resolve(null);
 return new Promise(resolve=>{
  let req;try{req=indexedDB.open(waterDbName,1);}catch(e){return resolve(null);}
  req.onupgradeneeded=()=>req.result.createObjectStore('features');
  req.onsuccess=()=>resolve(req.result);
  req.onerror=()=>resolve(null);
 });
}
async function cachedWaters(key){
 const db=await openWaterDb();if(!db)return null;
 return new Promise(resolve=>{
  let req;try{req=db.transaction('features','readonly').objectStore('features').get(key);}catch(e){db.close();return resolve(null);}
  req.onsuccess=()=>{db.close();resolve(req.result||null);};req.onerror=()=>{db.close();resolve(null);};
 });
}
async function storeWaters(key,geojson){
 const db=await openWaterDb();if(!db)return;
 await new Promise(resolve=>{try{const t=db.transaction('features','readwrite');t.objectStore('features').put(geojson,key);t.oncomplete=()=>resolve();t.onerror=()=>resolve();}catch(e){resolve();}});db.close();
}
function useWaterGeojson(data,layout){
 const f=fromWaterGeojson(data,layout);
 if(!f.length)throw Error('Die Datei enthält keine gültigen Wasserverläufe aus deiner Auswahl.');
 const key=bboxKey(layout);
 waterOverlays.set(key,f);requests.delete('waters:'+key);
 storeWaters(key,toWaterGeojson(f,layout)).catch(()=>{});
 return f;
}
async function loadBundledWaters(layout){
 try{const r=await fetch(WATER_FILE,{cache:'no-cache'});if(!r.ok)return null;
  const f=fromWaterGeojson(await r.json(),layout);return f.length?f:null;
 }catch(e){return null;}
}
function mergeWaterFeatures(primary,extra){
 // Add only missing named water bodies. Never overlay two independently sourced
 // versions of the SAME named stream or lake.
 const combined=[...(primary||[])],found=new Set(combined.map(f=>f.name));
 for(const name of [...waters.lakes,...waters.streams]){
  if(found.has(name))continue;
  const additions=(extra||[]).filter(f=>f.name===name);
  if(additions.length){combined.push(...additions);found.add(name);}
 }
 return waterReport(combined);
}
async function namedWaterGeometry(layout,opts={}){
 const key=bboxKey(layout),requestKey='waters:'+key;
 if(waterOverlays.has(key)&&!opts.refresh)return waterOverlays.get(key);
 if(requests.has(requestKey)&&!opts.refresh)return requests.get(requestKey);
 const promise=(async()=>{
  let fallback=waterReport([]),lastError=null;
  try{fallback=mergeWaterFeatures(fallback,await loadBundledWaters(layout));}catch(e){lastError=e;}
  try{const saved=await cachedWaters(key);if(saved)fallback=mergeWaterFeatures(fallback,fromWaterGeojson(saved,layout));}catch(e){lastError=e;}
  if(fallback.report.found===fallback.report.total&&!opts.refresh)return fallback;
  const q=waterQuery(layout);
  const endpoints=['https://overpass.osm.ch/api/interpreter','https://overpass.private.coffee/api/interpreter','https://overpass-api.de/api/interpreter'];
  for(const endpoint of endpoints){
   try{
    const data=await fetchWithTimeout(endpoint+'?data='+encodeURIComponent(q),{},18000);
    if(data.remark)throw Error('Overpass meldet unvollständige Antwort: '+String(data.remark));
    const live=extractNamedWaters(data.elements,layout);
    if(!live.length)continue;
    const combined=mergeWaterFeatures(fallback,live);
    if(combined.report.found>fallback.report.found)fallback=combined;
    if(fallback.report.found===fallback.report.total)break;
   }catch(error){lastError=error;}
  }
  if(fallback.length){
   await storeWaters(key,toWaterGeojson(fallback,layout)).catch(()=>{});
   return fallback;
  }
  throw Error('Keine ausgewählten Gewässergeometrien verfügbar. '+(lastError?.message||'Datenquelle ohne Treffer.')+' Bitte geprüfte GeoJSON importieren.');
 })();requests.set(requestKey,promise);promise.catch(()=>requests.delete(requestKey));return promise;
}
// Place a label using the river path itself if the name is missing in the
// official point catalogue. Anchors are never invented from approximate maps.
function waterLabelPoints(features,layout){
 const best=new Map(),extent=layout.bbox_lv95;
 for(const f of features){
  let distance=0,anchor=null;
  for(let i=1;i<f.coords.length;i++){
   const a=f.coords[i-1],b=f.coords[i],mid=[(a[0]+b[0])/2,(a[1]+b[1])/2];
   if(!inExtent(mid[0],mid[1],extent))continue;
   const len=Math.hypot(b[0]-a[0],b[1]-a[1]);
   if(len>distance){distance=len;anchor=mid;}
  }
  if(!anchor)continue;
  const prev=best.get(f.name);
  if(!prev||prev.distance<distance)best.set(f.name,{name:f.name,E:anchor[0],N:anchor[1],category:'water',rank:0,distance});
 }
 return [...best.values()].map(({distance,...p})=>p);
}
function position(p,layout,w,h){const [W,S,E,N]=layout.bbox_lv95;return [(p[0]-W)/(E-W)*w,(N-p[1])/(N-S)*h];}
function renderWaterCanvas(features,layout,w,h){
 const c=document.createElement('canvas');c.width=w;c.height=h;const ctx=c.getContext('2d');
 ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle='#147bca';ctx.fillStyle='#7cbee9';ctx.lineWidth=Math.max(2,w/650);
 for(const f of features){const points=f.coords.map(p=>position(p,layout,w,h));if(points.length<2)continue;
  ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));
  const [a,b]=[points[0],points[points.length-1]];const closed=Math.hypot(a[0]-b[0],a[1]-b[1])<10;
  if(f.kind==='lake'&&closed){ctx.closePath();ctx.fill();ctx.lineWidth=Math.max(1,w/1050);ctx.stroke();}
  else{ctx.lineWidth=Math.max(f.kind==='lake'?2.8:3.0,w/(f.kind==='lake'?470:450));ctx.stroke();}
 }
 return c;
}
function labelCategories(selected,showFlur=true){
 const categories=[];
 if(selected.has('gewaesser'))categories.push(['water',[...waters.lakes,...waters.streams]]);
 if(selected.has('wald'))categories.push(['forest',forests]);
 if(selected.has('siedlungen'))categories.push(['settlement',settlements]);
 if(showFlur)categories.push(['flur',flurnamen]);
 return categories;
}
function renderLabelCanvas(points,layout,w,h,selected,showFlur,fontBase){
 const c=document.createElement('canvas');c.width=w;c.height=h;const ctx=c.getContext('2d');
 const referenceScale=Math.max(w,h)/1400,fontSize=Math.max(14,Math.round(fontBase*referenceScale));
 const want=labelCategories(selected,showFlur);
 const active=new Set(want.map(pair=>pair[0]));
 const priority=new Set(want.flatMap(pair=>pair[1].map(normalize)));
 const candidates=points.filter(p=>active.has(p.category));
 // Important water names and teaching examples first; all other swissNAMES3D
 // objects within the extent are then eligible without an arbitrary 52-item cap.
 candidates.sort((a,b)=>(priority.has(normalize(b.name))?1:0)-(priority.has(normalize(a.name))?1:0)||a.rank-b.rank);
 const used=new Set(),boxes=[];let count=0;
 for(const pt of candidates){
   const name=pt.name,category=pt.category;
   if(used.has(normalize(name)))continue;
   const [x,y]=position([pt.E,pt.N],layout,w,h);
   if(!Number.isFinite(x)||!Number.isFinite(y)||x<0||y<0||x>w||y>h)continue;
   const size=category==='flur'?fontSize*.86:fontSize;
   ctx.font=`700 ${size}px Arial, sans-serif`;
   const tw=ctx.measureText(name).width;
   const box={x:x-tw/2-5,y:y-size*.65-4,w:tw+10,h:size+8};
   if(box.x<0||box.x+box.w>w||box.y<0||box.y+box.h>h)continue;
   if(boxes.some(b=>box.x<b.x+b.w&&box.x+box.w>b.x&&box.y<b.y+b.h&&box.y+box.h>b.y))continue;
   ctx.lineJoin='round';ctx.textAlign='center';ctx.textBaseline='middle';
   ctx.lineWidth=Math.max(3.5,size*.18);ctx.strokeStyle='rgba(255,255,255,.96)';ctx.strokeText(name,x,y);
   ctx.fillStyle=category==='water'?'#064e82':category==='forest'?'#176534':category==='settlement'?'#17272e':'#33373b';
   ctx.fillText(name,x,y);boxes.push(box);used.add(normalize(name));count++;
 }
 c.report={rendered:count,received:points.length,skipped:points.length-count};
 return c;
}
function worksheetCsv(){const q=s=>'"'+String(s).replace(/"/g,'""')+'"';return '\uFEFF'+[['Grundwort','Bedeutung','Beispiel 1','Beispiel 2'],...lexicon.map(a=>[a[0],a[1],a[2]||'',a[3]||''])].map(a=>a.map(q).join(';')).join('\r\n');}
root.GrossreliefSpecial={toWaterGeojson,fromWaterGeojson,useWaterGeojson,waters,lexicon,forests,settlements,flurnamen,geocodedNames,namedWaterGeometry,extractNamedWaters,canonicalWaterName,waterLabelPoints,renderWaterCanvas,renderLabelCanvas,worksheetCsv,waterQuery,lv95ToWgs,wgsToLv95,parseGeoSearch,parseBboxNames,swissCategory,normalize};
})(window);
