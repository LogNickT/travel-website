window.AtlasPlaceJournal=(()=>{
 const storageKey='atlas-place-journal-v1';
 let data;try{data=JSON.parse(localStorage.getItem(storageKey)||'{}');if(!data||typeof data!=='object'||Array.isArray(data))data={};}catch{data={};}
 let current='',starters=[];
 const el=(tag,value)=>{const node=document.createElement(tag);if(value!==undefined)node.textContent=value;return node;};
 function state(country){return data[country]||(data[country]={custom:[],records:{},hideStarters:false,visitedOnly:false});}
 function save(){localStorage.setItem(storageKey,JSON.stringify(data));}
 function commit(change){const backup=JSON.stringify(data);try{change();save();return true;}catch{data=JSON.parse(backup);document.querySelector('#placeFeedback').textContent='Could not save. Enable browser storage and try again.';return false;}}
 function checkbox(label,checked,onchange){const wrapper=el('label');wrapper.className='place-check';const input=el('input');input.type='checkbox';input.checked=checked;input.onchange=()=>onchange(input.checked);wrapper.append(input,el('span',label));return wrapper;}
 function render(){
 const country=current,s=state(country),root=document.querySelector('#places');root.replaceChildren();
 const toolbar=el('div');toolbar.className='place-toolbar';
 toolbar.append(checkbox('Hide starter suggestions',s.hideStarters,value=>{if(commit(()=>state(country).hideStarters=value))render();}),checkbox('Show visited places only',s.visitedOnly,value=>{if(commit(()=>state(country).visitedOnly=value))render();}));
 root.append(toolbar);
 const feedback=el('p');feedback.id='placeFeedback';feedback.className='place-feedback';feedback.setAttribute('aria-live','polite');root.append(feedback);
 const all=[...starters.map(p=>({...p,id:'starter:'+p.title,starter:true})),...s.custom];
 const shown=all.filter(p=>(!s.hideStarters||!p.starter)&&(!s.visitedOnly||s.records[p.id]?.visited));
 const count=el('p',`${shown.length} places shown · ${all.filter(p=>s.records[p.id]?.visited).length} visited`);count.className='muted';root.append(count);
 if(!shown.length)root.append(el('p',s.visitedOnly?'No visited places match these filters yet. Untick the filter to find places to mark.':'Starter suggestions are hidden. Add a place below or show the starters again.'));
 for(const place of shown){
  const record=s.records[place.id]||{},card=el('article');card.className='place journal-place';card.append(el('small',place.starter?'STARTER SUGGESTION':'YOUR PLACE'),el('h3',place.title),el('p',place.description));
  card.append(checkbox('I’ve been here',!!record.visited,value=>{if(commit(()=>{const entry=state(country).records[place.id]||(state(country).records[place.id]={});entry.visited=value;}))render();}));
  if(place.url){const link=el('a','Explore destination guide ↗');link.href=place.url;link.target='_blank';link.rel='noopener noreferrer';link.className='place-guide';card.append(link);}
  const details=el('details');const summary=el('summary',record.review?'Your review · Edit':'Write a review');details.append(summary);
  const form=el('form');form.className='review-form';const ratingLabel=el('label','Your rating');const rating=el('select');rating.append(new Option('Choose a rating',''));for(let i=1;i<=5;i++)rating.append(new Option(`${i} / 5`,String(i)));rating.value=record.rating||'';ratingLabel.append(rating);
  const notesLabel=el('label','Your review');const notes=el('textarea');notes.rows=4;notes.maxLength=4000;notes.required=true;notes.value=record.review||'';notes.placeholder='What was it like? What would you recommend?';notesLabel.append(notes);
  const button=el('button','Save review');button.className='primary';const message=el('p');message.setAttribute('aria-live','polite');form.append(ratingLabel,notesLabel,button,message);
  form.onsubmit=event=>{event.preventDefault();const review=notes.value.trim();if(!review){notes.focus();return;}if(commit(()=>{const entry=state(country).records[place.id]||(state(country).records[place.id]={});entry.review=review;entry.rating=rating.value;})){message.textContent='Review saved in this browser.';summary.textContent='Your review · Edit';}};
  details.append(form);card.append(details);if(record.review){const saved=el('div');saved.className='saved-review';saved.append(el('strong',record.rating?`Your review · ${record.rating}/5`:'Your review'),el('p',record.review));card.append(saved);}root.append(card);
 }
 const add=el('details');add.className='add-place';const summary=el('summary','＋ Add your own place');add.append(summary);const form=el('form');
 const titleLabel=el('label','Place or city name');const title=el('input');title.required=true;title.maxLength=120;title.placeholder='e.g. a café, viewpoint, town or museum';titleLabel.append(title);
 const descriptionLabel=el('label','Description');const description=el('textarea');description.required=true;description.maxLength=4000;description.rows=3;description.placeholder='Describe this place and why it belongs in your journal.';descriptionLabel.append(description);
 let been=false;const checked=checkbox('I’ve already been here',false,value=>been=value);const button=el('button','Add place');button.className='primary';form.append(titleLabel,descriptionLabel,checked,button);form.onsubmit=event=>{event.preventDefault();const name=title.value.trim(),body=description.value.trim();if(!name||!body)return;if(all.some(p=>p.title.toLowerCase()===name.toLowerCase())){feedback.textContent='That place already exists in this country journal.';return;}const id='custom:'+crypto.randomUUID();if(commit(()=>{state(country).custom.push({id,title:name,description:body});state(country).records[id]={visited:been};})){render();document.querySelector('#placeFeedback').textContent='Your place was added.';}};add.append(form);root.append(add);
 const browse=el('a',`Find more places in ${country} ↗`);browse.href='https://en.wikivoyage.org/w/index.php?search='+encodeURIComponent(country);browse.target='_blank';browse.rel='noopener noreferrer';browse.className='place-guide';root.append(browse,el('p','Your places, visits and reviews are saved in this browser and are not shared publicly or synced across devices.'));
 }
 return {show(country,places){current=country;starters=places;render();}};
})();
