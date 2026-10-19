// Per-browser travel history; no account or location tracking is required.
window.AtlasVisited=(()=>{
 const key='atlas-visited-v1';
 function read(){try{const value=JSON.parse(localStorage.getItem(key)||'[]');return new Set(Array.isArray(value)?value.filter(v=>typeof v==='string'):[])}catch{return new Set()}}
 let entries=read();
 return {has:country=>entries.has(country),all:()=>[...entries].sort((a,b)=>a.localeCompare(b)),reload(){entries=read()},set(country,checked){const next=new Set(entries);if(checked)next.add(country);else next.delete(country);localStorage.setItem(key,JSON.stringify([...next]));entries=next;}};
})();
