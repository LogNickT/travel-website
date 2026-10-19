const $=s=>document.querySelector(s);let globe,countries=[],selected=null,spinning=true;let mobileGlobeActive=false;let lastGlobeWidth=0;let placeGuides={};let stories=[];try{stories=JSON.parse(localStorage.getItem('atlas-stories')||'[]')}catch{}const name=d=>d.properties.name||d.properties.ADMIN||d.properties.NAME;const slug=s=>encodeURIComponent(s.toLowerCase().replaceAll(' ','-'));const featured={Portugal:[['Lisbon','Wander the lanes of Alfama and follow the riverfront.'],['Porto','Explore the Douro waterfront and the city’s tiled streets.'],['Sintra','Discover wooded trails, gardens and hilltop palaces.']],Japan:[['Kyoto','Temple gardens and quiet neighbourhood walks.'],['Tokyo','Explore distinct neighbourhoods, museums and food markets.'],['Nara','Historic temples and green parkland.']],'New Zealand':[['Queenstown','An alpine base for lakeside walks and mountain scenery.'],['Rotorua','Geothermal landscapes and Māori cultural experiences.'],['Wellington','Harbour walks, cafés and museums.']]};
const countryPalette=['#f6e5d9','#eee7f6','#e0ead6'];function countryColor(d){const fixed={'Portugal':'#f6e5d9','Japan':'#eee7f6','New Zealand':'#e0ead6'};if(fixed[name(d)])return fixed[name(d)];let h=0;for(const c of name(d))h=(h*31+c.charCodeAt(0))>>>0;return countryPalette[h%countryPalette.length]}
function text(tag,value){let a=document.createElement(tag);a.textContent=value;return a}function list(){let q=$('#search').value.toLowerCase();let matches=countries.filter(d=>name(d).toLowerCase().includes(q));$('#results').replaceChildren();matches.slice(0,q?260:4).forEach(d=>{let b=text('button',name(d)+' ↗');b.onclick=()=>openCountry(d);$('#results').append(b)});$('#coverage').textContent=countries.length+' countries & territories · Search to find small islands'}
function openCountry(d){selected=d;const target='country/'+slug(name(d));if(location.hash.slice(1)===target)renderCountry(d);else location.hash=target}function renderCountry(d){if(globe){globe.controls().autoRotate=false;globe.controls().enabled=false;}$('#home').hidden=true;$('#journal').hidden=false;$('#countryTitle').textContent=name(d);$('#region').textContent='THE COUNTRY JOURNAL / '+name(d).toUpperCase();$('#places').replaceChildren();const places=featured[name(d)]?featured[name(d)].map(([title,description])=>({title,description,url:'https://en.wikivoyage.org/w/index.php?search='+encodeURIComponent(title+' '+name(d))})):(placeGuides[name(d)]||[]);for(const place of places){const card=text('article','');card.className='place';const guide=text('a','Explore destination guide ↗');guide.href=place.url;guide.target='_blank';guide.rel='noopener noreferrer';guide.className='place-guide';card.append(text('h3',place.title),text('p',place.description),guide);$('#places').append(card)}$('#flightLink').href='https://www.google.com/travel/flights?q='+encodeURIComponent('Flights to '+name(d));renderStories();requestAnimationFrame(()=>{$('#journal').scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth',block:'start'});$('#countryTitle').setAttribute('tabindex','-1');$('#countryTitle').focus({preventScroll:true});})}function renderStories(){$('#stories').replaceChildren();stories.filter(s=>s.country===name(selected)).forEach(s=>{let a=text('article','');a.className='story';a.append(text('small',s.kind+' · Saved on this device'),text('h3',s.title),text('p',s.body));$('#stories').append(a)});if(!$('#stories').children.length)$('#stories').append(text('p','No stories yet. Be the first to leave a little inspiration.'))}function route(){let part=location.hash.slice(1);if(part.startsWith('country/')){let d=countries.find(d=>slug(name(d))===part.slice(8));if(d){selected=d;renderCountry(d);return}}$('#home').hidden=false;$('#journal').hidden=true;requestAnimationFrame(()=>{resize();if(globe){mobileGlobeActive=false;configureGlobeInput();globe.controls().autoRotate=spinning;globe.controls().update();}})}function isMobileGlobe(){return window.matchMedia('(max-width:850px)').matches||window.matchMedia('(pointer:coarse)').matches}
function configureGlobeInput(){if(!globe)return;const mobile=isMobileGlobe(),controls=globe.controls();controls.enabled=$('#journal').hidden&&!mobile;controls.enableZoom=!mobile;controls.enableRotate=!mobile;const canvas=globe.renderer().domElement;canvas.style.touchAction=mobile?'pan-y pinch-zoom':'none';$('#globe').style.touchAction=canvas.style.touchAction;$('.hint').textContent=mobile?'Drag sideways to turn · Swipe up to scroll · Tap a country':'Drag to turn · Scroll to zoom · Click to discover';}
function resize(){if(!globe||$('#home').hidden)return;const e=$('#globe'),w=e.clientWidth,h=e.clientHeight;if(!w||!h)return;globe.width(w).height(h);if(w!==lastGlobeWidth){globe.pointOfView({altitude:innerWidth<=850?3.2:1.85},0);lastGlobeWidth=w;}configureGlobeInput();}

// One textured sphere: no per-country meshes, tessellation, or polygon raycasting.
async function init(){try{const guidesResponse=await fetch('places.json');if(!guidesResponse.ok)throw Error('Destination guides unavailable');placeGuides=await guidesResponse.json();
const response=await fetch('assets/countries-lite.geojson');if(!response.ok)throw Error('Country data unavailable');
countries=(await response.json()).features.filter(d=>name(d)).sort((a,b)=>name(a).localeCompare(name(b)));
const width=2048,height=1024,base=document.createElement('canvas');base.width=width;base.height=height;
const ctx=base.getContext('2d');ctx.fillStyle='#9fc9e4';ctx.fillRect(0,0,width,height);
function draw(context,d,color,outlineOnly=false){context.fillStyle=color;context.strokeStyle='rgba(255,255,255,.85)';context.lineWidth=.35;
const polygons=d.geometry.type==='Polygon'?[d.geometry.coordinates]:d.geometry.coordinates;
for(const polygon of polygons){context.beginPath();for(const ring of polygon){let previous=null,offset=0;ring.forEach((p,i)=>{if(previous!==null&&name(d)!=="Antarctica"){let diff=p[0]-previous;if(diff>180)offset-=360;if(diff< -180)offset+=360}const x=(p[0]+offset+180)/360*width,y=(90-p[1])/180*height;if(i===0)context.moveTo(x,y);else context.lineTo(x,y);previous=p[0]});context.closePath()}if(!outlineOnly)context.fill('evenodd');context.stroke()}}
for(const d of countries)draw(ctx,d,countryColor(d));
// Soft five-tone illustrated Earth; downsample reference to avoid fine satellite detail.
const reference=new Image();reference.src='assets/earth.jpg';await reference.decode();
const miniature=document.createElement('canvas');miniature.width=512;miniature.height=256;miniature.getContext('2d').drawImage(reference,0,0,512,256);
const source=document.createElement('canvas');source.width=width;source.height=height;const sourceCtx=source.getContext('2d');sourceCtx.drawImage(miniature,0,0,width,height);
const real=sourceCtx.getImageData(0,0,width,height).data,pixels=ctx.getImageData(0,0,width,height),rgba=pixels.data;
// Low-frequency reference removes isolated pixel-scale terrain fragments.
const broad=document.createElement('canvas');broad.width=40;broad.height=20;const broadCtx=broad.getContext('2d');broadCtx.drawImage(reference,0,0,40,20);
const smoothed=document.createElement('canvas');smoothed.width=width;smoothed.height=height;const smoothedCtx=smoothed.getContext('2d');smoothedCtx.filter='blur(18px)';smoothedCtx.drawImage(broad,0,0,width,height);const regional=smoothedCtx.getImageData(0,0,width,height).data;

const parse=hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));
const land=['#abc1a3','#adc4a2','#bed0b0','#ccdabd','#e2e8db'].map(parse);
const water=['#79a7c7','#88b3ce','#98bfd6','#a8cbdc','#b9d7e3'].map(parse);
for(let i=0;i<rgba.length;i+=4){
 const ocean=rgba[i]===159&&rgba[i+1]===201&&rgba[i+2]===228;
 const r=ocean?real[i]:regional[i],g=ocean?real[i+1]:regional[i+1],b=ocean?real[i+2]:regional[i+2],light=(r+g+b)/3;
 let tone;
 if(ocean)tone=water[Math.min(4,Math.floor((r*.22+g*.5+b*.28)/255*8))];
 else{let index=light>190&&Math.max(r,g,b)-Math.min(r,g,b)<38?4:r>g*1.1&&r>b*1.2?3:light>125?2:light>70?1:0;tone=land[index];}
 rgba[i]=tone[0];rgba[i+1]=tone[1];rgba[i+2]=tone[2];
}
// Raster country ownership lets accent coverage be capped independently per country.
const ownership=document.createElement('canvas');ownership.width=width;ownership.height=height;const ownerCtx=ownership.getContext('2d',{willReadFrequently:true});
countries.forEach((d,index)=>draw(ownerCtx,d,'#'+(index+1).toString(16).padStart(6,'0')));
const owners=ownerCtx.getImageData(0,0,width,height).data;
const areas=new Uint32Array(countries.length+1),ownerIds=new Uint16Array(width*height),seeds=new Int32Array(countries.length+1).fill(-1),best=new Float32Array(countries.length+1).fill(-Infinity),scores=new Float32Array(width*height);
for(let pixel=0;pixel<width*height;pixel++){
 const j=pixel*4,id=(owners[j]<<16)|(owners[j+1]<<8)|owners[j+2];if(!id||id>countries.length)continue;
 ownerIds[pixel]=id;areas[id]++;
 const score=(regional[j+1]-regional[j])*.012+(regional[j+1]-regional[j+2])*.006+(regional[j]+regional[j+1]+regional[j+2])*.001;scores[pixel]=score;
 if(score>best[id]){best[id]=score;seeds[id]=pixel;}
 // A clean sage foundation removes the old disconnected islands of colour.
 const sage=land[Math.min(2,Math.max(0,Math.floor((regional[j]+regional[j+1]+regional[j+2])/3/65)))];rgba[j]=sage[0];rgba[j+1]=sage[1];rgba[j+2]=sage[2];
}
// Continuous geographic colour field: regions cross political borders naturally.
const hash=(x,y)=>{let n=Math.imul(x,374761393)^Math.imul(y,668265263);n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967295};
function field(x,y,sx,sy){x/=sx;y/=sy;const ix=Math.floor(x),iy=Math.floor(y);let u=x-ix,v=y-iy;u=u*u*(3-2*u);v=v*v*(3-2*v);return (hash(ix,iy)*(1-u)+hash(ix+1,iy)*u)*(1-v)+(hash(ix,iy+1)*(1-u)+hash(ix+1,iy+1)*u)*v;}
for(let pixel=0;pixel<ownerIds.length;pixel++){
 if(!ownerIds[pixel])continue;const j=pixel*4,x=pixel%width,y=Math.floor(pixel/width);
 // Large and medium regions, with smaller irregular edges; no country-based resets.
 const terrain=(regional[j+1]-regional[j])*.012+(regional[j+1]-regional[j+2])*.006;
 let value=field(x,y,220,145)*.48+field(x,y,95,67)*.25+field(x,y,35,24)*.08+terrain*.19;const longitude=x/width*360-180,latitude=90-y/height*180;if(longitude>-83&&longitude< -33&&latitude<13&&latitude> -57){value=.37+(field(x+73,y-21,115,90)-.5)*.9+(field(x,y,48,38)-.5)*.28+(field(x,y,20,17)-.5)*.06;}
 const shade=value>.49?[198,212,176]:value>.37?[190,208,176]:value>.27?[173,196,163]:[163,187,155];
 rgba[j]=shade[0];rgba[j+1]=shade[1];rgba[j+2]=shade[2];
}
ctx.putImageData(pixels,0,0);for(const d of countries)draw(ctx,d,'rgba(0,0,0,0)',true);


const live=document.createElement('canvas');live.width=width;live.height=height;const paint=live.getContext('2d');paint.drawImage(base,0,0);
globe=Globe({rendererConfig:{antialias:true,powerPreference:'high-performance'}})($('#globe')).backgroundColor('#00000000').globeImageUrl(base.toDataURL()).showAtmosphere(true).atmosphereColor('#b4d3e4').atmosphereAltitude(.025);
globe.renderer().setPixelRatio(1);const material=globe.globeMaterial();material.color.set('#ffffff');material.emissive.set('#202832');material.emissiveIntensity=.04;material.shininess=3;material.specular.set('#141414');
function texture(){if(material.map){material.map.image=live;material.map.needsUpdate=true}else requestAnimationFrame(texture)}texture();
const entries=countries.map(d=>({d,polygons:(d.geometry.type==='Polygon'?[d.geometry.coordinates]:d.geometry.coordinates).map(rings=>{const ring=rings[0];return {rings,minX:Math.min(...ring.map(p=>p[0])),maxX:Math.max(...ring.map(p=>p[0])),minY:Math.min(...ring.map(p=>p[1])),maxY:Math.max(...ring.map(p=>p[1]))}})}));
function inside(ring,x,y){let hit=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){const a=ring[i],b=ring[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])hit=!hit}return hit}
function find(lat,lng){for(const e of entries)for(const p of e.polygons){if(lng<p.minX||lng>p.maxX||lat<p.minY||lat>p.maxY)continue;if(inside(p.rings[0],lng,lat)&&!p.rings.slice(1).some(r=>inside(r,lng,lat)))return e.d}return null}
let hovered=null,dragging=false,last=0;
function highlight(d){if(d===hovered)return;hovered=d;paint.clearRect(0,0,width,height);paint.drawImage(base,0,0);if(d){paint.save();paint.globalAlpha=.58;draw(paint,d,'#ffffff');paint.restore();}if(material.map)material.map.needsUpdate=true;$('#hover').textContent=d?name(d):'';$('#hover').hidden=!d;$('#globe').style.cursor=d?'pointer':'grab'}
const surface=$('#globe');$('#hover').hidden=true;$('#hover').setAttribute('role','tooltip');surface.addEventListener('pointerdown',()=>{dragging=true});window.addEventListener('pointerup',()=>{dragging=false});
surface.addEventListener('pointermove',event=>{if(event.pointerType==='touch'||dragging||performance.now()-last<60)return;last=performance.now();const bounds=surface.getBoundingClientRect();const point=globe.toGlobeCoords(event.clientX-bounds.left,event.clientY-bounds.top);highlight(point?find(point.lat,point.lng):null);if(hovered){const bubble=$('#hover');const stage=$('.earth-stage').getBoundingClientRect();bubble.style.left=Math.min(stage.width-bubble.offsetWidth-12,Math.max(12,event.clientX-stage.left+22))+'px';bubble.style.top=Math.max(12,event.clientY-stage.top-48)+'px';}});
let touchDrag=null,lastSwipe=0;
surface.addEventListener('pointerdown',event=>{if(!isMobileGlobe()||event.pointerType==='mouse')return;touchDrag={id:event.pointerId,x:event.clientX,y:event.clientY,view:globe.pointOfView(),horizontal:false};});
surface.addEventListener('pointermove',event=>{if(!touchDrag||touchDrag.id!==event.pointerId)return;const dx=event.clientX-touchDrag.x,dy=event.clientY-touchDrag.y;if(!touchDrag.horizontal){if(Math.abs(dy)>Math.abs(dx)&&Math.abs(dy)>8){touchDrag=null;return;}if(Math.abs(dx)<10)return;touchDrag.horizontal=true;globe.controls().autoRotate=false;highlight(null);}globe.pointOfView({lng:touchDrag.view.lng-dx*.35,lat:touchDrag.view.lat},0);lastSwipe=performance.now();});
function endTouch(){if(touchDrag?.horizontal)lastSwipe=performance.now();touchDrag=null;dragging=false;if(globe&&$('#journal').hidden)globe.controls().autoRotate=spinning;}
window.addEventListener('pointerup',endTouch);window.addEventListener('pointercancel',endTouch);
surface.addEventListener('pointerleave',()=>highlight(null));globe.onGlobeClick(point=>{if(performance.now()-lastSwipe<350)return;const d=find(point.lat,point.lng);if(d)openCountry(d)});
globe.controls().autoRotate=true;globe.controls().autoRotateSpeed=.3;globe.controls().enablePan=false;globe.controls().minDistance=140;globe.controls().maxDistance=650;globe.pointOfView({lat:23,lng:12,altitude:1.85});resize();$('#loading').hidden=true;list();$('#storyCountry').replaceChildren(...countries.map(d=>{const o=text('option',name(d));o.value=name(d);return o}));route();
}catch(e){$('#loading').textContent='The globe could not load. Please refresh with WebGL enabled.';console.error(e)}}
$('#search').oninput=list;$('#browse').onclick=()=>{location.hash='';setTimeout(()=>$('#search').focus(),0)};$('#back').onclick=()=>location.hash='';window.onhashchange=route;window.onresize=resize;$('#rotate').onclick=()=>{spinning=!spinning;if(globe)globe.controls().autoRotate=spinning;$('#rotate').textContent=spinning?'Pause rotation':'Resume rotation'};for(const [id,factor] of [['plus',.8],['minus',1.2]])$('#'+id).onclick=()=>{if(globe)globe.pointOfView({altitude:Math.max(.25,Math.min(4,globe.pointOfView().altitude*factor))},500)};document.querySelectorAll('[data-name]').forEach(b=>b.onclick=()=>{let d=countries.find(d=>name(d)===b.dataset.name);if(d)openCountry(d)});function edit(){if(!countries.length)return;if(selected)$('#storyCountry').value=name(selected);$('#editor').showModal()}$('#share').onclick=edit;$('#addStory').onclick=edit;$('#close').onclick=()=>$('#editor').close();$('#storyForm').onsubmit=e=>{e.preventDefault();let item={country:$('#storyCountry').value,title:$('#title').value.trim(),body:$('#body').value.trim(),kind:$('#kind').value};if(!item.title||!item.body)return;stories.push(item);try{localStorage.setItem('atlas-stories',JSON.stringify(stories))}catch{alert('Storage is unavailable; your story could not be saved.');stories.pop();return}$('#editor').close();$('#storyForm').reset();openCountry(countries.find(d=>name(d)===item.country))};$('#flightLink').onclick=()=>{$('#flightLink').href='https://www.google.com/travel/flights?q='+encodeURIComponent('Flights from '+$('#origin').value+' to '+name(selected)+' on '+$('#date').value)};init();


document.addEventListener('visibilitychange',()=>{if(globe)globe.controls().autoRotate=!document.hidden&&$('#journal').hidden&&spinning;});

























