'use strict';
/* Vectors and labels for one relief. No hardcoded coordinates or invented placements. */
(function(root){
const waters={
 lakes:['Zürichsee','Hüttnersee','Ausee','Sternenweiher','Teufenbachweiher','Freyenweiher','Bachgadenweiher'],
 streams:['Reidbach','Gulmenbach','Zopfbach','Meilibach','Schlossbach','Risibach','Töbelibach','Winterbergholzbächli']
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
function waterQuery(layout){
 const [W,S,E,N]=layout.bbox_lv95;
 const a=lv95ToWgs(W,S),b=lv95ToWgs(E,N);
 const south=Math.min(a[0],b[0])-0.002,west=Math.min(a[1],b[1])-0.002,north=Math.max(a[0],b[0])+0.002,east=Math.max(a[1],b[1])+0.002;
 const filter=[...waters.lakes,...waters.streams].map(s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|');
 const bb=[south,west,north,east].map(v=>v.toFixed(6)).join(',');
 return `[out:json][timeout:40];(way["name"~"^(${filter})$",i]["waterway"](${bb});way["name"~"^(${filter})$",i]["natural"="water"](${bb});way["name"~"^(${filter})$",i]["water"](${bb});relation["name"~"^(${filter})$",i]["natural"="water"](${bb}););out geom;`;
}
async function namedWaterGeometry(layout){
 const key=bboxKey(layout);if(requests.has('waters:'+key))return requests.get('waters:'+key);
 const promise=(async()=>{
  const q=waterQuery(layout);
  let lastError;
  for(const endpoint of ['https://overpass.ch/api/interpreter','https://overpass.kumi.systems/api/interpreter','https://overpass-api.de/api/interpreter']){
   try{
    const data=await fetchWithTimeout(endpoint+'?data='+encodeURIComponent(q),{},14000);
    const allowed=new Set([...waters.lakes,...waters.streams].map(normalize));
    const result=[];
    for(const el of data.elements||[]){
      if(!allowed.has(normalize(el.tags?.name)))continue;
      const kind=waters.lakes.some(s=>normalize(s)===normalize(el.tags.name))?'lake':'stream';
      const geometrySets=Array.isArray(el.geometry)?[el.geometry]:(el.members||[]).filter(m=>m.role==='outer'&&Array.isArray(m.geometry)).map(m=>m.geometry);
      for(const geo of geometrySets){
        if(geo.length<2)continue;
        result.push({name:el.tags.name,kind,coords:geo.map(p=>wgsToLv95(p.lat,p.lon)).filter(p=>Number.isFinite(p[0])&&Number.isFinite(p[1]))});
      }
    }
    if(!result.length)throw Error('Keine der ausgewählten Gewässergeometrien gefunden.');
    const obtained=new Set(result.map(f=>normalize(f.name)));
    result.report={total:waters.lakes.length+waters.streams.length,found:obtained.size,
      missing:[...waters.lakes,...waters.streams].filter(n=>!obtained.has(normalize(n)))};
    return result;
   }catch(e){lastError=e;}
  }
  throw Error('Die Geometriedaten der ausgewählten Gewässer sind nicht erreichbar: '+(lastError?.message||'unbekannt'));
 })();requests.set('waters:'+key,promise);promise.catch(()=>requests.delete('waters:'+key));return promise;
}
function position(p,layout,w,h){const [W,S,E,N]=layout.bbox_lv95;return [(p[0]-W)/(E-W)*w,(N-p[1])/(N-S)*h];}
function renderWaterCanvas(features,layout,w,h){
 const c=document.createElement('canvas');c.width=w;c.height=h;const ctx=c.getContext('2d');
 ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle='#147bca';ctx.fillStyle='#7cbee9';ctx.lineWidth=Math.max(2,w/650);
 for(const f of features){const points=f.coords.map(p=>position(p,layout,w,h));if(points.length<2)continue;
  ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));
  const [a,b]=[points[0],points[points.length-1]];const closed=Math.hypot(a[0]-b[0],a[1]-b[1])<10;
  if(f.kind==='lake'&&closed){ctx.closePath();ctx.fill();ctx.lineWidth=Math.max(1,w/1050);ctx.stroke();}
  else{ctx.lineWidth=Math.max(f.kind==='lake'?2.3:1.7,w/(f.kind==='lake'?490:650));ctx.stroke();}
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
root.GrossreliefSpecial={waters,lexicon,forests,settlements,flurnamen,geocodedNames,namedWaterGeometry,renderWaterCanvas,renderLabelCanvas,worksheetCsv,waterQuery,lv95ToWgs,wgsToLv95,parseGeoSearch,parseBboxNames,swissCategory,normalize};
})(window);
