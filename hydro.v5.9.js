'use strict';
/* Open data of Canton Zurich (GIS-ZH 45). Geometry always comes from official
   LV95 GeoJSON. Rivers / lakes are never sketched, interpolated or guessed. */
(function(root){
  const VERSION='5.9.0';
  const SOURCE='https://maps.zh.ch/wfs/OGDZHWFS';
  const STREAM_CATALOG=[
    {name:'Zopfbach',aliases:['Zopfbach']},
    {name:'Gulmenbach',aliases:['Gulmenbach']},
    {name:'Töbelibach',aliases:['Töbelibach','Toebelibach']},
    {name:'Untermosenbach',aliases:['Untermosenbach']},
    {name:'Reidbach/Wildbach',aliases:['Reidbach','Riedbach','Wildbach']},
    {name:'Teufenbach',aliases:['Teufenbach']},
    {name:'Sihl',aliases:['Sihl']},
    {name:'Krebsbach',aliases:['Krebsbach']}, // NOT Chrebsbach!
    {name:'Schlossbach',aliases:['Schlossbach']},
    {name:'Sagenbach',aliases:['Sagenbach','Hüttener Sagenbach','Huettener Sagenbach']},
    {name:'Miesbach',aliases:['Miesbach']},
    // Previously supported named watercourses stay available.
    {name:'Aabach',aliases:['Aabach']},
    {name:'Meilibach',aliases:['Meilibach']},
    // Richterswil, Gewaessernummer laut amtlichem Gewaesserraumplan: 2512.
    {name:'Mülibach Richterswil',aliases:['Mülibach','Muelibach','Mühlibach','Muehlibach','Mülibach Richterswil'],ids:['2512']}
  ];
  const POND_CATALOG=[
    {name:'Sternenweiher',aliases:['Sternenweiher']},
    {name:'Reidbachweiher',aliases:['Reidbachweiher','Riedbachweiher']},
    {name:'Teufenbachweiher',aliases:['Teufenbachweiher']}
  ];
  const LAKE_ALIASES={'Zürichsee':['Zürichsee','Zuerichsee','Zurichsee'],'Hüttenersee':['Hüttenersee','Hüttnersee'],'Ausee':['Ausee']};
  const ALLOWED_STREAMS=new Set(STREAM_CATALOG.map(item=>item.name));
  const ALLOWED_PONDS=new Set(POND_CATALOG.map(item=>item.name));
  const ALLOWED_WATERBODIES=new Set(['Zürichsee','Hüttenersee','Ausee',...ALLOWED_PONDS]);
  const DESIRED=STREAM_CATALOG.slice(0,4).map(x=>x.name);
  const OTHER=STREAM_CATALOG.slice(4).map(x=>x.name);
  const clean=value=>String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
  const nameKeys=['gewaessername','gewname','name','name_de','bezeichnung','objektname','gewassername'];
  const idKeys=['gewaessernummer','gewaesser_nr','gewaessernr','gewaessernummer_aktuell','gewaesserid','gwnr'];
  function lookup(p,keys){
    const values=[];
    for(const [key,value] of Object.entries(p||{})){
      if(keys.some(w=>clean(key)===clean(w)) && value!==null && value!==undefined)values.push(value);
    }
    return values;
  }
  function names(f){return lookup(f?.properties,nameKeys).filter(v=>typeof v==='string'&&v.trim());}
  function canonicalId(f){
    const values=lookup(f?.properties,idKeys);
    for(const raw of values){const n=Number(String(raw).replace(',','.'));if(Number.isFinite(n)&&n>0)return String(n);}
    return null;
  }
  function classify(f,catalog){
    for(const raw of names(f)){
      const parts=raw.split(/[,;/]|\s+\(.*?\)\s*/).map(clean).filter(Boolean);
      for(const item of catalog){
        if(item.aliases.some(a=>parts.includes(clean(a))))return item.name;
      }
    }
    return null;
  }
  function nameFor(f){
    const id=canonicalId(f);
    // Unter verschiedenen lokalen Schreibungen derselbe amtliche Bach,
    // aber keine anderen Muelibaeche ausserhalb von Richterswil hinzunehmen.
    if(id==='2512')return 'Mülibach Richterswil';
    const match=classify(f,STREAM_CATALOG);
    if(match==='Mülibach Richterswil' && id && id!=='2512')return null;
    return match;
  }
  function pondNameFor(f){return classify(f,POND_CATALOG);}
  function lakeNameFor(f){
    for(const v of names(f)){
      const k=clean(v);
      for(const [label,aliases] of Object.entries(LAKE_ALIASES)){
        if(aliases.some(s=>clean(s)===k))return label;
      }
    }
    return null;
  }
  function layerTypes(xml){
    // Explicit 45.x layer names; substring searches previously confused 45.1
    // WB_FLIESSGEWAESSER_L with 45.2 WB_FLIESSGEWAESSER_L_M.
    const doc=new DOMParser().parseFromString(xml,'application/xml');
    if(doc.getElementsByTagName('parsererror').length)throw Error('WFS GetCapabilities liefert kein gültiges XML.');
    const found=[];
    for(const node of doc.getElementsByTagName('*')){
      if(node.localName!=='FeatureType')continue;
      for(const child of node.children){if(child.localName==='Name'){found.push(child.textContent.trim());break;}}
    }
    if(!found.length)throw Error('Der kantonale WFS nennt keine FeatureTypes.');
    const exact=layer=>found.find(s=>clean(s.split(':').at(-1))===clean(layer))||null;
    return {
      lakes:exact('WB_STEHGEWAESSER_F'),          // 45.10: lake/pond filled geometries
      shore:exact('WB_ZUERICHSEEUFER_L')||exact('WB_ZUERICHSEE_L')||found.find(s=>/zuerichsee.*(ufer|linie)/.test(clean(s)))||null, // 45.13
      streams:exact('WB_GEWAESSERBEZEICHNUNG_L'), // 45.3: naming events
      streamAxes:exact('WB_FLIESSGEWAESSER_L_M'), // 45.2: connected stream routes
      available:found.length
    };
  }
  function firstCoord(g){
    return g.type==='Polygon'?g.coordinates?.[0]?.[0]:g.type==='MultiPolygon'?g.coordinates?.[0]?.[0]?.[0]:g.type==='MultiLineString'?g.coordinates?.[0]?.[0]:g.coordinates?.[0];
  }
  function validLV95(g){
    if(!g||!['Polygon','MultiPolygon','LineString','MultiLineString'].includes(g.type))return false;
    const p=firstCoord(g);return Array.isArray(p)&&p.length>=2&&Number.isFinite(p[0])&&Number.isFinite(p[1])&&p[0]>2e6&&p[0]<3.1e6&&p[1]>700000&&p[1]<1.5e6;
  }
  function empty(){return {lakes:[],shores:[],pondShore:[],streams:[],streamAxes:[],found:[],pondsFound:[],totalFeatures:0};}
  function fromGeojson(json,role){
    const features=json?.type==='FeatureCollection'?json.features:json?.type==='Feature'?[json]:Array.isArray(json?.features)?json.features:[];
    if(!Array.isArray(features))throw Error('Ungültiges GeoJSON.');
    const result=empty();result.totalFeatures=features.length;
    for(const f of features){
      const g=f?.geometry;if(!validLV95(g))continue;
      if(g.type==='Polygon'||g.type==='MultiPolygon'){
        const pond=pondNameFor(f);
        // 45.16 contains *all* legally designated water bodies including stream
        // polygons. Accept only the three explicitly requested ponds as extras.
        const approvedName=pond||lakeNameFor(f);
        if((!role||role==='lakes')&&approvedName&&ALLOWED_WATERBODIES.has(approvedName))result.lakes.push({geometry:g,name:approvedName,id:canonicalId(f),source:'45.10'});

      }else if(g.type==='LineString'||g.type==='MultiLineString'){
        if(role==='shore'){
          if(!names(f).length || lakeNameFor(f)==='Zürichsee')result.shores.push(g);
          continue;
        }
        if(role==='pondShore'||(!role&&pondNameFor(f))){
          const name=pondNameFor(f);
          if(name)result.pondShore.push({geometry:g,name,id:canonicalId(f),source:role==='pondShore'?'45.11':'geojson'});
          continue;
        }
        if(!role && names(f).some(n=>clean(n)==='zurichsee'||clean(n)==='zuerichsee')){
          result.shores.push(g);continue;
        }
        if(role==='streamAxes'){
          result.streamAxes.push({geometry:g,id:canonicalId(f),name:nameFor(f)});continue;
        }
        // 45.1 = actual public watercourse axes already carrying the names.
        // 45.3 = potentially incomplete text-labelled sections.
        const name=nameFor(f);
        if(name)result.streams.push({name,geometry:g,id:canonicalId(f),source:role==='publicStreams'?'45.1':'45.3'});
      }
    }
    result.found=STREAM_CATALOG.filter(x=>result.streams.some(s=>s.name===x.name)).map(x=>x.name);
    result.pondsFound=POND_CATALOG.filter(x=>result.lakes.some(l=>l.name===x.name)||result.pondShore.some(l=>l.name===x.name)).map(x=>x.name);
    return result;
  }
  // 45.3 liefert haeufig nur Abschnitte der Namensbezeichnung (Events).
  // 45.2 enthaelt die vollstaendigen Gewaesserachsen. Die offizielle
  // Gewaessernummer ist der einzige zulaessige Join-Schluessel.
  // Keine direkte Punkt-zu-Punkt-Verbindung und KEINE ungepruefte
  // Nachbarschafts- oder Aehnlichkeitssuche entlang fremder Baeche.
  function combine(parts){
    const out=empty(), seen={lakes:new Set(),shores:new Set(),pondShore:new Set(),streams:new Set(),streamAxes:new Set()};
    for(const data of parts){
      if(!data)continue;
      out.totalFeatures+=data.totalFeatures||0;
      for(const key of Object.keys(seen))for(const item of data[key]||[]){
        const geom=key==='shores'?item:item.geometry;
        if(!geom?.coordinates)continue;
        const identity=JSON.stringify([key==='streams'?item.name:'',key==='lakes'||key==='pondShore'?item.name:'',key==='streamAxes'?item.id:'',geom.coordinates]);
        if(seen[key].has(identity))continue;
        seen[key].add(identity);out[key].push(item);
      }
    }
    const namesById=new Map();
    for(const item of out.streams){
      if(item.id && item.name && !namesById.has(item.id))namesById.set(item.id,item.name);
    }
    for(const item of out.streamAxes){
      if(item.id && item.name && !namesById.has(item.id))namesById.set(item.id,item.name);
    }
    // Der amtliche Richterswiler Muelibach wird auch gefunden, wenn seine
    // Bezeichnungsabschnitte fehlen oder anders geschrieben sind.
    namesById.set('2512','Mülibach Richterswil');
    for(const item of STREAM_CATALOG)for(const id of item.ids||[]){
      if(!namesById.has(id))namesById.set(id,item.name);
    }
    const matchedAxes=out.streamAxes.filter(a=>a.id&&namesById.has(a.id));
    const geometryKey=g=>JSON.stringify(g.coordinates);
    const routeGeometries=new Set(matchedAxes.map(a=>geometryKey(a.geometry)));
    // Route-Chunks werden bei vorhandenem ID-Join bevorzugt; unverknuepfbare
    // Namensabschnitte bleiben erhalten (z.B. kantonsuebergreifende Teile).
    const augmented=[];
    const seenFinal=new Set();
    const add=s=>{
      const key=JSON.stringify([s.name,s.geometry.coordinates]);
      if(!seenFinal.has(key)){seenFinal.add(key);augmented.push(s);}
    };
    // Prefer complete 45.2 route geometries where the IDs match, but retain
    // 45.1 public-stream geometry on waterways lacking a matching route ID.
    // 45.3 name events serve as backup, not a reason to omit longer axes.
    for(const s of [...out.streams].sort((a,b)=>({'45.1':0,'45.3':1}[a.source]??2)-({'45.1':0,'45.3':1}[b.source]??2))){
      if(!routeGeometries.has(geometryKey(s.geometry)))add(s);
    }
    for(const a of matchedAxes){
      add({name:namesById.get(a.id),geometry:a.geometry,id:a.id,source:'full-route'});
    }
    // Named but not numbered datasets continue to be usable.
    out.streams=augmented;
    out.routeIds=[...new Set(matchedAxes.map(a=>a.id))];
    out.namedIds=[...new Set(out.streams.filter(s=>s.id).map(s=>s.id))];
    out.fullRoutes=STREAM_CATALOG.filter(item=>out.streams.some(s=>s.name===item.name&&s.source==='full-route')).map(item=>item.name);
    out.muelibachRouteParts=out.streams.filter(s=>s.name==='Mülibach Richterswil'&&s.source==='full-route').length;
    out.muelibachMouth=assessMuelibachMouth(out);
    out.sihlSegments=out.streams.filter(s=>s.name==='Sihl').length;
    out.sihlRouteSegments=out.streams.filter(s=>s.name==='Sihl'&&s.source==='full-route').length;
    out.found=STREAM_CATALOG.filter(item=>out.streams.some(s=>s.name===item.name)).map(item=>item.name);
    // A named 45.11 outline is useful even when 45.10 does not include the
    // water body. Fill it ONLY if the official shoreline is already a closed
    // ring (<= 1 m endpoint difference); never invent a connecting section.
    const outlinesById=new Set(out.lakes.filter(l=>l.id).map(l=>l.id));
    const outlinesByName=new Set(out.lakes.filter(l=>l.name).map(l=>l.name));
    for(const pond of out.pondShore){
      if((pond.id && outlinesById.has(pond.id)) || outlinesByName.has(pond.name))continue;
      const coords=pond.geometry.type==='LineString'?[pond.geometry.coordinates]:pond.geometry.coordinates;
      const rings=coords.filter(line=>line.length>=4&&Math.hypot(line[0][0]-line.at(-1)[0],line[0][1]-line.at(-1)[1])<=1);
      if(rings.length){
        out.lakes.push({name:pond.name,id:pond.id,source:'45.11-closed-shore',geometry:{type:'Polygon',coordinates:[rings[0]]}});
        if(pond.id)outlinesById.add(pond.id);outlinesByName.add(pond.name);
      }
    }
    out.pondsFound=POND_CATALOG.filter(item=>out.lakes.some(l=>l.name===item.name)||out.pondShore.some(l=>l.name===item.name)).map(item=>item.name);
    out.pondsFilled=POND_CATALOG.filter(item=>out.lakes.some(l=>l.name===item.name)).map(item=>item.name);
    out.pondsOutlined=POND_CATALOG.filter(item=>out.pondShore.some(l=>l.name===item.name)).map(item=>item.name);
    out.unresolvedStreams=STREAM_CATALOG.filter(item=>!out.found.includes(item.name)).map(item=>item.name);
    out.unresolvedPonds=POND_CATALOG.filter(item=>!out.pondsFound.includes(item.name)).map(item=>item.name);
    return out;
  }
  // Nur Diagnose – keine kuenstliche Verbindung zum See ziehen.
  // Der groesste stehende Wasserkörper im Reliefausschnitt ist der Zürichsee.
  function assessMuelibachMouth(data, toleranceMetres=60){
    const parts=(data?.streams||[]).filter(s=>s.name==='Mülibach Richterswil'&&s.source==='full-route');
    if(!parts.length)return {state:'missing',parts:0,distanceMetres:null};
    const lakes=(data?.lakes||[]).map(l=>l.geometry||l).filter(g=>['Polygon','MultiPolygon'].includes(g?.type));
    if(!lakes.length)return {state:'unverifiable',parts:parts.length,distanceMetres:null};
    const outerRings=g=>g.type==='Polygon'?[g.coordinates[0]]:g.coordinates.map(poly=>poly[0]);
    function area(ring){let a=0;for(let i=1;i<ring.length;i++)a+=ring[i-1][0]*ring[i][1]-ring[i][0]*ring[i-1][1];return Math.abs(a/2);}
    const lake=lakes.map(g=>({g,area:outerRings(g).reduce((v,r)=>v+area(r),0)})).sort((a,b)=>b.area-a.area)[0].g;
    const rings=outerRings(lake);
    function distanceToSegment(p,a,b){const dx=b[0]-a[0],dy=b[1]-a[1],dd=dx*dx+dy*dy;const t=dd?Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/dd)):0;return Math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dy);}
    let closest=Infinity;
    for(const item of parts){
      const paths=item.geometry.type==='LineString'?[item.geometry.coordinates]:item.geometry.coordinates;
      for(const line of paths){
        if(!line?.length)continue;
        for(const p of [line[0],line.at(-1)])for(const ring of rings){
          for(let i=1;i<ring.length;i++)closest=Math.min(closest,distanceToSegment(p,ring[i-1],ring[i]));
        }
      }
    }
    return {state:closest<=toleranceMetres?'atLake':'gap',parts:parts.length,distanceMetres:Math.round(closest)};
  }
  async function getText(url,limit=25000000){
    const abort=new AbortController(),timer=setTimeout(()=>abort.abort(),12000);
    try{
      const res=await fetch(url,{mode:'cors',signal:abort.signal});
      if(!res.ok)throw Error(`HTTP ${res.status}`);
      if(Number(res.headers.get('Content-Length')||0)>limit)throw Error('WFS-Antwort zu gross.');
      const body=await res.text();if(body.length>limit)throw Error('WFS-Antwort zu gross.');return body;
    }finally{clearTimeout(timer);}
  }
  function bboxQuery(bbox){return bbox.map(n=>Number(n.toFixed(2))).join(',')+',EPSG:2056';}
  async function fetchRole(role,type,bbox){
    if(!type)return empty();
    const perPage=1200,maxPages=15,parts=[];
    const options=[
      {VERSION:'2.0.0',TYPENAMES:type,OUTPUTFORMAT:'application/json',COUNT:String(perPage)},
      {VERSION:'2.0.0',TYPENAMES:type,OUTPUTFORMAT:'geojson',COUNT:String(perPage)},
      {VERSION:'1.0.0',TYPENAME:type,OUTPUTFORMAT:'application/json',MAXFEATURES:String(perPage)}
    ];
    let lastError=null;
    for(const choice of options){
      const loaded=[];let previousSignature='';try{
        for(let page=0;page<maxPages;page++){
          const query=new URLSearchParams({SERVICE:'WFS',REQUEST:'GetFeature',SRSNAME:'EPSG:2056',BBOX:bboxQuery(bbox),...choice});
          if(choice.VERSION==='2.0.0')query.set('STARTINDEX',String(page*perPage));
          const raw=await getText(`${SOURCE}?${query.toString()}`);
          const json=JSON.parse(raw);
          if(json.type!=='FeatureCollection'||!Array.isArray(json.features))throw Error('Kein gültiges GeoJSON-FeatureCollection.');
          // Some servers ignore STARTINDEX; stop instead of issuing repeated pages.
          const signature=JSON.stringify([json.features.length,json.features[0]?.id,json.features[0]?.geometry?.coordinates?.[0],json.features.at(-1)?.id]);
          if(page>0 && signature===previousSignature)break;
          previousSignature=signature;
          if(role==='shore')for(const f of json.features){f.properties={...f.properties,__source_layer:'zuerichseeufer'};}
          loaded.push(fromGeojson(json,role));
          const numberMatched=Number(json.numberMatched);
          if(choice.VERSION!=='2.0.0'||json.features.length<perPage||(Number.isFinite(numberMatched)&&(page+1)*perPage>=numberMatched))break;
          if(page===maxPages-1)throw Error(`WFS-Limit ${perPage*maxPages} Objekte für ${role} überschritten.`);
        }
        return combine(loaded);
      }catch(e){lastError=e;}
    }
    throw Error(`${role}: ${lastError?.message||'WFS-Abfrage fehlgeschlagen'}`);
  }
  async function fetchOfficial(bbox){
    const capabilities=new URLSearchParams({SERVICE:'WFS',VERSION:'2.0.0',REQUEST:'GetCapabilities'});
    const types=layerTypes(await getText(`${SOURCE}?${capabilities.toString()}`));
    if(!types.lakes&&!types.shore&&!types.streams)throw Error('WFS enthält keine passenden Gewässergeometrien.');
    // Ausschliesslich aus dem zuvor festgelegten Quellumfang.
    // KEINE 45.1-, 45.11- oder 45.16-Massenabfragen; ausschliesslich bereits vorhandene
    // 45.3-Benennungen, 45.2-Routen, 45.10-Seen/Weiher und Zürichsee-Ufer.
    const roles=['lakes','shore','streams','streamAxes'];
    const jobs=roles.filter(role=>types[role]).map(async role=>({role,data:await fetchRole(role,types[role],bbox)}));
    const settled=await Promise.allSettled(jobs),data=[],errors=[],loadedRoles=[];
    for(let i=0;i<settled.length;i++){
      const row=settled[i],role=roles.filter(key=>types[key])[i];
      if(row.status==='fulfilled'){data.push(row.value.data);loadedRoles.push(role);}
      else errors.push(`${role}: ${row.reason?.message||'keine WFS-Antwort'}`);
    }
    const out=combine(data);out.errors=errors;out.types=types;out.loadedRoles=loadedRoles;
    if(!types.streamAxes)errors.push('Kantonaler Layer der vollständigen Gewässerachsen (45.2) fehlt.');

    if(!out.lakes.length&&!out.shores.length&&!out.streams.length&&!out.pondShore.length)throw Error('Amtliche Gewässergeometrie nicht verfügbar: '+errors.join('; '));
    return out;
  }
  function geomOf(item){return item?.geometry||item;}
  function allCoords(geom){
    if(geom.type==='Polygon')return [geom.coordinates];
    if(geom.type==='MultiPolygon')return geom.coordinates;
    if(geom.type==='LineString')return [[geom.coordinates]];
    if(geom.type==='MultiLineString')return geom.coordinates.map(v=>[v]);
    return [];
  }
  function path(geom,bbox,w,h){
    const [west,south,east,north]=bbox;let d='';
    for(const poly of allCoords(geom))for(const ring of poly){
      if(!Array.isArray(ring)||ring.length<2)continue;
      for(let i=0;i<ring.length;i++){
        const point=ring[i];if(!Number.isFinite(point?.[0])||!Number.isFinite(point?.[1]))continue;
        const x=(point[0]-west)/(east-west)*w,y=(north-point[1])/(north-south)*h;
        d+=`${i?'L':'M'}${x.toFixed(2)} ${y.toFixed(2)} `;
      }
      if(/Polygon/.test(geom.type))d+='Z ';
    }
    return d;
  }
  function renderSVG(data,bbox,w,h){
    const lines=[];
    for(const lake of (data.lakes||[]).filter(v=>ALLOWED_WATERBODIES.has(v.name)))lines.push(`<path class="waterLake" fill-rule="evenodd" d="${path(geomOf(lake),bbox,w,h)}"/>`);
    for(const shore of data.shores)lines.push(`<path class="waterShore" d="${path(geomOf(shore),bbox,w,h)}"/>`);
    // Only requested small pond shorelines, not all ponds and reservoirs.
    for(const shore of (data.pondShore||[]).filter(v=>ALLOWED_PONDS.has(v.name)))lines.push(`<path class="waterShore" d="${path(shore.geometry,bbox,w,h)}"/>`);
    for(const s of (data.streams||[]).filter(v=>ALLOWED_STREAMS.has(v.name)))lines.push(`<path class="waterStream" d="${path(s.geometry,bbox,w,h)}"/>`);
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">${lines.join('')}</svg>`;
  }
  function paintCanvas(ctx,data,bbox,w,h){
    ctx.save();ctx.lineJoin='round';ctx.lineCap='round';
    for(const lake of (data.lakes||[]).filter(v=>ALLOWED_WATERBODIES.has(v.name))){const p=new Path2D(path(geomOf(lake),bbox,w,h));ctx.fillStyle='#92c6e3';ctx.fill(p,'evenodd');ctx.lineWidth=1.4;ctx.strokeStyle='#397da3';ctx.stroke(p);}
    for(const shore of data.shores){const p=new Path2D(path(geomOf(shore),bbox,w,h));ctx.lineWidth=1.6;ctx.strokeStyle='#397da3';ctx.stroke(p);}
    for(const shore of (data.pondShore||[]).filter(v=>ALLOWED_PONDS.has(v.name))){const p=new Path2D(path(shore.geometry,bbox,w,h));ctx.lineWidth=1.6;ctx.strokeStyle='#397da3';ctx.stroke(p);}
    for(const s of (data.streams||[]).filter(v=>ALLOWED_STREAMS.has(v.name))){const p=new Path2D(path(s.geometry,bbox,w,h));ctx.lineWidth=1.7;ctx.strokeStyle='#367fb2';ctx.stroke(p);}
    ctx.restore();
  }
  const api={VERSION,SOURCE,STREAM_CATALOG,POND_CATALOG,ALLOWED_STREAMS,ALLOWED_PONDS,ALLOWED_WATERBODIES,DESIRED,OTHER,clean,names,nameFor,pondNameFor,canonicalId,layerTypes,fromGeojson,combine,assessMuelibachMouth,fetchOfficial,renderSVG,paintCanvas};
  root.GrossreliefHydro=api;
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
