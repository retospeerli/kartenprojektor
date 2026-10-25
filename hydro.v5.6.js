'use strict';
/* Open data of Canton Zurich (GIS-ZH 45). Geometry always comes from official
   LV95 GeoJSON. Rivers / lakes are never sketched, interpolated or guessed. */
(function(root){
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
    {name:'Meilibach',aliases:['Meilibach']}
  ];
  const POND_CATALOG=[
    {name:'Sternenweiher',aliases:['Sternenweiher']},
    {name:'Reidbachweiher',aliases:['Reidbachweiher','Riedbachweiher']},
    {name:'Teufenbachweiher',aliases:['Teufenbachweiher']}
  ];
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
  function nameFor(f){return classify(f,STREAM_CATALOG);}
  function pondNameFor(f){return classify(f,POND_CATALOG);}
  function layerTypes(xml){
    const doc=new DOMParser().parseFromString(xml,'application/xml');
    if(doc.getElementsByTagName('parsererror').length)throw Error('WFS GetCapabilities liefert kein gültiges XML.');
    const found=[];
    for(const node of doc.getElementsByTagName('*')){
      if(node.localName!=='FeatureType')continue;
      for(const child of node.children){if(child.localName==='Name'){found.push(child.textContent.trim());break;}}
    }
    if(!found.length)throw Error('Der kantonale WFS nennt keine FeatureTypes.');
    const choose=needles=>found.find(s=>needles.some(n=>clean(s).includes(clean(n))))||null;
    return {
      lakes:choose(['wb_stehgewaesser_f','stehgewaesser_f']),
      shore:choose(['wb_zuerichsee_l','zuerichsee_l','zuerichseeufer','uferlinie_zuerichsee']),
      streams:choose(['wb_gewaesserbezeichnung_l','gewaesserbezeichnung_l'])||choose(['wb_fliessgewaesser_l_m','fliessgewaesser_l_m']),
      streamAxes:choose(['wb_fliessgewaesser_l_m','fliessgewaesser_l_m','wb_fliessgewaesser_l']),
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
  function empty(){return {lakes:[],shores:[],streams:[],streamAxes:[],found:[],pondsFound:[],totalFeatures:0};}
  function fromGeojson(json,role){
    const features=json?.type==='FeatureCollection'?json.features:json?.type==='Feature'?[json]:Array.isArray(json?.features)?json.features:[];
    if(!Array.isArray(features))throw Error('Ungültiges GeoJSON.');
    const result=empty();result.totalFeatures=features.length;
    for(const f of features){
      const g=f?.geometry;if(!validLV95(g))continue;
      if(g.type==='Polygon'||g.type==='MultiPolygon'){
        if(!role||role==='lakes')result.lakes.push({geometry:g,name:pondNameFor(f),id:canonicalId(f)});
      }else if(g.type==='LineString'||g.type==='MultiLineString'){
        if(role==='shore'||/zuerichsee|zürichsee|shore|ufer/i.test(String(f.properties?.__source_layer||''))){
          result.shores.push(g);continue;
        }
        if(role==='streamAxes'){
          result.streamAxes.push({geometry:g,id:canonicalId(f),name:nameFor(f)});continue;
        }
        const name=nameFor(f);
        if(name)result.streams.push({name,geometry:g,id:canonicalId(f)});
      }
    }
    result.found=STREAM_CATALOG.filter(x=>result.streams.some(s=>s.name===x.name)).map(x=>x.name);
    result.pondsFound=POND_CATALOG.filter(x=>result.lakes.some(l=>l.name===x.name)).map(x=>x.name);
    return result;
  }
  function combine(parts){
    const out=empty();const seen={lakes:new Set(),shores:new Set(),streams:new Set(),streamAxes:new Set()};
    for(const data of parts){
      if(!data)continue;
      out.totalFeatures+=data.totalFeatures||0;
      for(const key of Object.keys(seen))for(const item of data[key]||[]){
        const geom=key==='shores'?item:item.geometry;
        const identity=JSON.stringify([key==='streams'?item.name:'',key==='lakes'?item.name:'',key==='streamAxes'?item.id:'',geom.coordinates]);
        if(seen[key].has(identity))continue;seen[key].add(identity);out[key].push(item);
      }
    }
    // Use all recognised Sihl centreline segments from official route geometry,
    // not merely the named partial segments in the text-annotation layer.
    const sihlIds=new Set(out.streams.filter(s=>s.name==='Sihl'&&s.id).map(s=>s.id));
    const axes=out.streamAxes.filter(a=>a.name==='Sihl'||(a.id&&sihlIds.has(a.id)));
    if(axes.length){
      // Preserve the originally named segments as well: additional segments may
      // carry Sihl branches/tributary numbers in the official WFS.
      const have=new Set(out.streams.filter(s=>s.name==='Sihl').map(s=>JSON.stringify(s.geometry.coordinates)));
      for(const a of axes){const id=JSON.stringify(a.geometry.coordinates);if(!have.has(id)){out.streams.push({name:'Sihl',geometry:a.geometry,id:a.id,source:'route'});have.add(id);}}
    }
    out.sihlSegments=out.streams.filter(s=>s.name==='Sihl').length;
    out.sihlRouteSegments=out.streams.filter(s=>s.name==='Sihl'&&s.source==='route').length;
    out.found=STREAM_CATALOG.filter(item=>out.streams.some(s=>s.name===item.name)).map(item=>item.name);
    out.pondsFound=POND_CATALOG.filter(item=>out.lakes.some(s=>s.name===item.name)).map(item=>item.name);
    return out;
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
    const data=[],errors=[];
    for(const role of ['lakes','shore','streams','streamAxes']){
      const type=types[role];if(!type)continue;
      // If the named layer is the same as the route layer, we only request once.
      if(role==='streamAxes'&&type===types.streams)continue;
      try{data.push(await fetchRole(role,type,bbox));}
      catch(e){errors.push(e.message);}
    }
    const out=combine(data);out.errors=errors;out.types=types;
    if(!out.lakes.length&&!out.shores.length&&!out.streams.length)throw Error('Amtliche Gewässergeometrie nicht verfügbar: '+errors.join('; '));
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
    for(const lake of data.lakes)lines.push(`<path class="waterLake" fill-rule="evenodd" d="${path(geomOf(lake),bbox,w,h)}"/>`);
    for(const shore of data.shores)lines.push(`<path class="waterShore" d="${path(geomOf(shore),bbox,w,h)}"/>`);
    for(const s of data.streams)lines.push(`<path class="waterStream" d="${path(s.geometry,bbox,w,h)}"/>`);
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">${lines.join('')}</svg>`;
  }
  function paintCanvas(ctx,data,bbox,w,h){
    ctx.save();ctx.lineJoin='round';ctx.lineCap='round';
    for(const lake of data.lakes){const p=new Path2D(path(geomOf(lake),bbox,w,h));ctx.fillStyle='#92c6e3';ctx.fill(p,'evenodd');ctx.lineWidth=1.4;ctx.strokeStyle='#397da3';ctx.stroke(p);}
    for(const shore of data.shores){const p=new Path2D(path(geomOf(shore),bbox,w,h));ctx.lineWidth=1.6;ctx.strokeStyle='#397da3';ctx.stroke(p);}
    for(const s of data.streams){const p=new Path2D(path(s.geometry,bbox,w,h));ctx.lineWidth=1.7;ctx.strokeStyle='#367fb2';ctx.stroke(p);}
    ctx.restore();
  }
  const api={SOURCE,STREAM_CATALOG,POND_CATALOG,DESIRED,OTHER,clean,names,nameFor,pondNameFor,canonicalId,layerTypes,fromGeojson,combine,fetchOfficial,renderSVG,paintCanvas};
  root.GrossreliefHydro=api;
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
