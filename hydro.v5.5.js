'use strict';
/* Official canton Zurich open-water data. All features must carry real LV95
 * geometry; this code never invents or approximates a stream alignment. */
(function(root){
  const SOURCE = 'https://maps.zh.ch/wfs/OGDZHWFS';
  const DESIRED = ['Zopfbach','Gulmenbach','Töbelibach','Untermosenbach'];
  const OTHER = ['Sihl','Aabach','Meilibach','Riedbach'];
  const clean = value => String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z]/g,'');
  const desired = new Map([...DESIRED,...OTHER].map(name=>[clean(name),name]));
  function names(f){
    const p=f.properties||{};
    return ['gewaessername','GEWAESSERNAME','name','NAME','gewname','name_de'].map(k=>p[k]).filter(v=>typeof v==='string');
  }
  function nameFor(f){
    for(const str of names(f))for(const part of str.split(/[,;/]/)){
      const n=clean(part);
      if(desired.has(n))return desired.get(n);
    }
    return null;
  }
  function layerTypes(xml){
    const doc = new DOMParser().parseFromString(xml,'application/xml');
    if(doc.getElementsByTagName('parsererror').length)throw Error('WFS GetCapabilities liefert kein gültiges XML.');
    const found=[];
    for(const node of doc.getElementsByTagName('*')){
      if(node.localName!=='FeatureType')continue;
      for(const kid of node.children){if(kid.localName==='Name'){found.push(kid.textContent.trim());break;}}
    }
    if(!found.length)throw Error('Der kantonale WFS nennt keine FeatureTypes.');
    const choose = needles => found.find(s=>needles.some(n=>clean(s).includes(clean(n))))||null;
    return {
      lakes:choose(['wb_stehgewaesser_f','stehgewaesser_f']),
      shore:choose(['wb_zuerichsee_l','zuerichsee_l']),
      streams:choose(['wb_gewaesserbezeichnung_l','gewaesserbezeichnung_l'])||choose(['wb_fliessgewaesser_l','fliessgewaesser_l']),
      available:found.length
    };
  }
  function validLV95(geometry){
    if(!geometry || !['Polygon','MultiPolygon','LineString','MultiLineString'].includes(geometry.type))return false;
    const first=geometry.type==='Polygon'?geometry.coordinates?.[0]?.[0]
      :geometry.type==='MultiPolygon'?geometry.coordinates?.[0]?.[0]?.[0]
      :geometry.type==='MultiLineString'?geometry.coordinates?.[0]?.[0]
      :geometry.coordinates?.[0];
    return Array.isArray(first)&&first.length>=2&&first[0]>2000000&&first[0]<3100000&&first[1]>700000&&first[1]<1500000;
  }
  function fromGeojson(json){
    const features = json?.type==='FeatureCollection'?json.features:json?.type==='Feature'?[json]:Array.isArray(json?.features)?json.features:[];
    if(!Array.isArray(features))throw Error('Ungültiges GeoJSON.');
    const lakes=[],shores=[],streams=[],seen=new Set();
    for(const f of features){
      const g=f?.geometry; if(!validLV95(g))continue;
      const nm=nameFor(f);
      if(g.type==='Polygon'||g.type==='MultiPolygon')lakes.push(g);
      else if(g.type==='LineString'||g.type==='MultiLineString'){
        const isShore = /zuerichsee|zürichsee|shore|ufer/i.test(String(f.properties?.__source_layer||''));
        if(isShore)shores.push(g);
        if(nm){
          const id=JSON.stringify([nm,g.coordinates]);
          if(!seen.has(id)){streams.push({name:nm,geometry:g});seen.add(id);}
        }
      }
    }
    return {lakes,shores,streams,found:DESIRED.filter(n=>streams.some(s=>s.name===n)),totalFeatures:features.length};
  }
  function combine(parts){
    const all={lakes:[],shores:[],streams:[],found:[],totalFeatures:0};
    const seen=new Set();
    for(const a of parts){
      all.lakes.push(...a.lakes);all.shores.push(...a.shores);all.totalFeatures+=a.totalFeatures;
      for(const s of a.streams){ const id=JSON.stringify([s.name,s.geometry.coordinates]);if(!seen.has(id)){all.streams.push(s);seen.add(id);} }
    }
    all.found=DESIRED.filter(n=>all.streams.some(s=>s.name===n));
    return all;
  }
  async function getText(url,limit=12000000){
    const control=new AbortController();const timeout=setTimeout(()=>control.abort(),10000);
    try{const response=await fetch(url,{mode:'cors',signal:control.signal});
      if(!response.ok)throw Error(`HTTP ${response.status}`);
      if(Number(response.headers.get('Content-Length')||0)>limit)throw Error('WFS-Antwort zu gross.');
      const text=await response.text();if(text.length>limit)throw Error('WFS-Antwort zu gross.');return text;
    }finally{clearTimeout(timeout);}
  }
  async function fetchOfficial(bbox){
    const cap=new URLSearchParams({SERVICE:'WFS',VERSION:'2.0.0',REQUEST:'GetCapabilities'});
    const types=layerTypes(await getText(`${SOURCE}?${cap}`));
    if(!types.lakes&&!types.shore&&!types.streams)throw Error('WFS enthält keine passenden Gewässergeometrien.');
    const parts=[],errors=[];
    for(const [role,type] of Object.entries(types)){
      if(!['lakes','shore','streams'].includes(role)||!type)continue;
      const options=[
        {VERSION:'2.0.0',TYPENAMES:type,COUNT:'5000',OUTPUTFORMAT:'application/json',BBOX:`${bbox.join(',')},EPSG:2056`},
        {VERSION:'2.0.0',TYPENAMES:type,COUNT:'5000',OUTPUTFORMAT:'geojson',BBOX:`${bbox.join(',')},EPSG:2056`},
        {VERSION:'1.0.0',TYPENAME:type,MAXFEATURES:'5000',OUTPUTFORMAT:'application/json',BBOX:bbox.join(',')}
      ];
      let loaded=false,reason='Dienst lieferte kein GeoJSON';
      for(const option of options){
        try{
          const q=new URLSearchParams({SERVICE:'WFS',REQUEST:'GetFeature',SRSNAME:'EPSG:2056',...option});
          const payload=await getText(`${SOURCE}?${q}`,25000000);
          const json=JSON.parse(payload);
          if(json.type!=='FeatureCollection')throw Error('Unerwartetes GeoJSON-Format.');
          // Only accept queried geometries in LV95, never interpret WGS84 as metres.
          if(role==='shore')for(const f of json.features||[]){f.properties={...f.properties,__source_layer:'zuerichseeufer'};}
          const data=fromGeojson(json);
          if(!data.lakes.length&&!data.shores.length&&!data.streams.length && json.features?.length){
            throw Error('GeoJSON ohne LV95-Geometrie oder ohne benannte Bachläufe.');
          }
          parts.push(data);loaded=true;break;
        }catch(err){reason=err.message; if(err.name==='AbortError'||err instanceof TypeError)break;}
      }
      if(!loaded)errors.push(`${role}: ${reason}`);
    }
    const result=combine(parts);result.errors=errors;result.types=types;
    if(!result.lakes.length&&!result.shores.length&&!result.streams.length)throw Error('Amtliche Gewässer-Geometrie nicht abrufbar: '+(errors.join('; ')||'keine Linien/Polygone geliefert'));
    return result;
  }
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
        const pt=ring[i];if(!pt||!Number.isFinite(pt[0])||!Number.isFinite(pt[1]))continue;
        const x=(pt[0]-west)/(east-west)*w,y=(north-pt[1])/(north-south)*h;
        d+=`${i?'L':'M'}${x.toFixed(2)} ${y.toFixed(2)} `;
      }
      if(/Polygon/.test(geom.type))d+='Z ';
    }
    return d;
  }
  function renderSVG(data,bbox,w,h){
    const lines=[];for(const g of data.lakes)lines.push(`<path class="waterLake" d="${path(g,bbox,w,h)}"/>`);
    for(const g of data.shores)lines.push(`<path class="waterShore" d="${path(g,bbox,w,h)}"/>`);
    for(const s of data.streams)lines.push(`<path class="waterStream" d="${path(s.geometry,bbox,w,h)}"/>`);
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">${lines.join('')}</svg>`;
  }
  function paintCanvas(ctx,data,bbox,w,h){
    ctx.save();ctx.lineJoin='round';ctx.lineCap='round';
    for(const g of data.lakes){ctx.beginPath();const p=new Path2D(path(g,bbox,w,h));ctx.fillStyle='#92c6e3';ctx.fill(p,'evenodd');ctx.lineWidth=1.4;ctx.strokeStyle='#397da3';ctx.stroke(p);}
    for(const g of data.shores){const p=new Path2D(path(g,bbox,w,h));ctx.lineWidth=1.6;ctx.strokeStyle='#397da3';ctx.stroke(p);}
    for(const s of data.streams){const p=new Path2D(path(s.geometry,bbox,w,h));ctx.lineWidth=1.7;ctx.strokeStyle='#367fb2';ctx.stroke(p);}
    ctx.restore();
  }
  root.GrossreliefHydro={SOURCE,DESIRED,OTHER,clean,layerTypes,fromGeojson,combine,fetchOfficial,renderSVG,paintCanvas};
  if(typeof module!=='undefined'&&module.exports)module.exports=root.GrossreliefHydro;
})(typeof globalThis!=='undefined'?globalThis:this);
