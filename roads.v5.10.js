 'use strict';
/* Offline-ready renderer for width-filtered official swissTLM3D road GeoJSON.
 * Source must be genuine swissTLM3D export in EPSG:2056. Do not invent features.
 */
(function(root){
const VERSION='5.10';
function roadClass(props){
  const entries=Object.entries(props||{});
  const norm=s=>String(s).toLowerCase().normalize('NFKD').replace(/[^a-z0-9]/g,'');
  const fields=entries.filter(([k])=>/objektart|objecttype|strassentyp|streettype|roadclass|breitenklasse|widthclass|klasse|type/.test(norm(k)));
  for(const [,v] of fields){
    const s=norm(v);
    if(/autobahn|motorway/.test(s))return 'autobahn';
    if(/autostrasse|expressway/.test(s))return 'autostrasse';
    const match=s.match(/(10|8|6|4|3|2)mstrasse/)||s.match(/strasse(10|8|6|4|3|2)m/);
    if(match)return Number(match[1]);
  }
  return null;
}
function classify(feature){const kind=roadClass(feature.properties);return kind==='autobahn'||kind==='autostrasse'||(typeof kind==='number'&&kind>=6)?kind:null;}
function lineParts(g){if(!g)return [];if(g.type==='LineString')return [g.coordinates];if(g.type==='MultiLineString')return g.coordinates;return [];}
function isLV95(p){return Array.isArray(p)&&Number.isFinite(p[0])&&Number.isFinite(p[1])&&p[0]>2400000&&p[0]<2900000&&p[1]>1000000&&p[1]<1350000;}
function read(json){const fs=json?.type==='FeatureCollection'?json.features:json?.type==='Feature'?[json]:null;if(!Array.isArray(fs))throw Error('GeoJSON FeatureCollection erwartet.');let accepted=0,skipped=0,lines=[];for(const f of fs){const category=classify(f);if(category===null){skipped++;continue;}for(const points of lineParts(f.geometry)){if(points.length<2||!points.every(isLV95)){skipped++;continue;}lines.push({points,category});accepted++;}}if(!lines.length)throw Error('Keine klassifizierbaren Strassen ab 6 m gefunden. GeoJSON benötigt swissTLM3D-Objektart und LV95-Koordinaten.');return {lines,accepted,skipped};}
function paint(ctx,data,bbox,w,h){if(!data)return;const [x0,y0,x1,y1]=bbox;const px=p=>[(p[0]-x0)/(x1-x0)*w,(y1-p[1])/(y1-y0)*h];ctx.save();ctx.lineJoin='round';ctx.lineCap='round';for(const item of data.lines){const pts=item.points;if(!pts.some(p=>p[0]>=x0-50&&p[0]<=x1+50&&p[1]>=y0-50&&p[1]<=y1+50))continue;ctx.beginPath();pts.forEach((p,i)=>{const [x,y]=px(p);i?ctx.lineTo(x,y):ctx.moveTo(x,y)});
// Two-stroke casing, conventional topographic road emphasis. A visual approximation,
// NOT an authenticated reproduction of the swisstopo cartographic style sheet.
const weight=item.category===10?4.7:item.category===8?4.0:3.4;ctx.strokeStyle='#555454';ctx.lineWidth=weight+1.5;ctx.stroke();ctx.strokeStyle='#f4c99a';ctx.lineWidth=weight;ctx.stroke();}
ctx.restore();}
function canvas(data,bbox,w,h){const c=document.createElement('canvas');c.width=w;c.height=h;paint(c.getContext('2d'),data,bbox,w,h);return c;}
root.GrossreliefRoads={VERSION,roadClass,classify,read,paint,canvas};
})(window);
