const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const fee=w=>w<=10?10000:w<=50?20000:45000, price=(w,p)=>Math.round(fee(w)*(p?1.15:1)), money=n=>'$'+n.toLocaleString('en-US');
let DB,me=null;
const users=()=>DB.clients.concat(DB.new_users);
const orders=()=>users().flatMap(u=>u.cargo.map((c,i)=>({u,c,i})));
const slotTxt=id=>{const s=DB.port.slots.find(s=>s.id===id);return s?`${s.date} ${s.time}`:'Awaiting port schedule'};
const slotOpts=sel=>DB.port.slots.map(s=>`<option value="${s.id}" ${s.id===sel?'selected':''}>${s.date} · ${s.time}</option>`).join('');
const ships=st=>DB.port.ships.filter(s=>s.status===st);
const pendingPrem=()=>orders().filter(o=>o.c.premium&&!o.c.loaded).length;
const premOK=()=>pendingPrem()<DB.port.premiumCapacity;
const status=c=>c.loaded?'Loaded':'Not loaded yet';

/* ---------- data layer: JSON via server.py, else browser fallback ---------- */
async function load(){
  try{const r=await fetch('/api/db');if(!r.ok)throw 0;DB=await r.json();DB.mode='server'}
  catch(e){DB=JSON.parse(localStorage.getItem('dockpoint_db')||'null')||JSON.parse(JSON.stringify(window.SEED));DB.mode='browser'}
}
async function save(){
  if(DB.mode==='server'){for(const k of['clients','new_users','port']){const r=await fetch('/api/save/'+k,{method:'POST',body:JSON.stringify(DB[k])});if(!r.ok)return false}}
  else localStorage.setItem('dockpoint_db',JSON.stringify(DB));
  return true;
}
function toast(t){const e=$('#toast');e.textContent=t;e.style.display='block';setTimeout(()=>e.style.display='none',2200)}
function modal(t,h){$('#mt').textContent=t;$('#mb').innerHTML=h;$('#modal').classList.add('on')}
function closeM(){$('#modal').classList.remove('on')}
function show(id){document.querySelectorAll('.view').forEach(v=>v.classList.toggle('on',v.id===id));scrollTo(0,0)}
function logout(){me=null;closeM();show('v-landing')}

/* ---------- login ---------- */
function clientLogin(){
  modal('Login as Client',`<form id="cf"><input name="name" placeholder="Full name (as per Aadhaar)" required>
  <input name="contact" placeholder="Contact number" inputmode="numeric" pattern="[0-9]{10}" maxlength="10" required>
  <input name="email" type="email" placeholder="Email id (as per Aadhaar)" required>
  <input name="password" type="password" placeholder="Password (10 digits)" pattern="[0-9]{10}" maxlength="10" required>
  <div class="cap"></div><p class="err"></p><button class="btn">Login</button></form>`);
  const f=$('#cf'),cap=Captcha.mount($('#cf .cap'));
  f.onsubmit=e=>{e.preventDefault();if(!cap.verify())return;const v=f.elements;
    const u=users().find(u=>u.name.toLowerCase()===v.name.value.trim().toLowerCase()&&u.contact===v.contact.value.trim()&&u.email.toLowerCase()===v.email.value.trim().toLowerCase()&&u.password===v.password.value);
    if(!u){modal('Invalid user','<p>No account matches these details. Would you like to sign up as a new user?</p><button class="btn" onclick="openSignup()">Yes, sign me up</button> <button class="link" onclick="clientLogin()">No, try again</button>');return}
    me=u;closeM();$('#cname').textContent=u.name;show('v-client')};
}
function authLogin(){
  modal('Login as Authority',`<form id="af"><input name="name" placeholder="Full name" required>
  <input name="oid" placeholder="Office ID (up to 12 digits)" inputmode="numeric" pattern="[0-9]{1,12}" maxlength="12" required>
  <input name="password" type="password" placeholder="Password (up to 7 characters)" maxlength="7" required>
  <div class="cap"></div><p class="err"></p><button class="btn">Login</button></form>`);
  const f=$('#af'),cap=Captcha.mount($('#af .cap'));
  f.onsubmit=e=>{e.preventDefault();if(!cap.verify())return;const v=f.elements,a=DB.authority;
    if(v.name.value.trim().toLowerCase()===a.name.toLowerCase()&&v.oid.value===a.officeId&&v.password.value===a.password){closeM();$('#aname').textContent=a.name+' (Authority)';show('v-auth')}
    else{$('#af .err').textContent='Invalid authority credentials.';cap.refresh()}};
}

/* ---------- sign up (clients only; no authority sign-up exists) ---------- */
let signCap;
function openSignup(){closeM();const f=$('#sf');f.reset();f.querySelector('.err').textContent='';show('v-signup');signCap=Captcha.mount(f.querySelector('.cap'))}
$('#sf').elements.pan.addEventListener('input',e=>e.target.value=e.target.value.toUpperCase());
$('#sf').onsubmit=async e=>{e.preventDefault();const f=e.target,v=f.elements,err=f.querySelector('.err');
  if(!signCap.verify())return;
  const email=v.email.value.trim().toLowerCase();
  if(users().some(u=>u.email.toLowerCase()===email)){err.textContent='This email id is already registered. Use a different email id.';return}
  const ok=ships('available'),ship=ok[users().length%ok.length].no;
  DB.new_users.push({name:v.name.value.trim(),contact:v.contact.value,email:v.email.value.trim(),password:v.password.value,business:v.business.value,pan:v.pan.value.toUpperCase(),aadhaar:v.aadhaar.value,ship,cargo:[]});
  if(!await save()){DB.new_users.pop();err.textContent='Could not save (email may already exist).';return}
  modal('Registered','<p>Your account has been created. Please log in.</p><button class="btn" onclick="show(\'v-login\');clientLogin()">Go to login</button>');
};

/* ---------- client dashboard ---------- */
function cargoM(msg){
  const rows=me.cargo.map((c,i)=>`<div class="row ${c.premium?'prem':''}"><div><b>Cargo ${i+1}</b> ${c.premium?'<span class="tag">PREMIUM</span>':''}<br>${c.weight} ton · ${c.containers} container(s) · ${money(c.price)}<br>${status(c)} · Slot: ${c.loaded?'—':slotTxt(c.slot)}</div><button class="del" onclick="rmCargo(${i})">Remove</button></div>`).join('')||'<p>No cargo registered yet.</p>';
  modal('My Cargo',rows+'<button class="btn" onclick="addM()">+ Add cargo</button>');
}
async function rmCargo(i){if(!confirm('Remove this cargo?'))return;me.cargo.splice(i,1);await save();cargoM();toast('Cargo removed')}
function addM(){
  const pa=premOK();
  modal('Add Cargo',`<form id="ac"><label>Weight (ton)<input name="w" type="number" min="0.1" step="0.1" required></label>
  <label>Preferred slot<select name="s">${slotOpts()}</select></label>
  <label class="chk"><input type="checkbox" name="p" ${pa?'':'disabled'}> Immediate loadout (+15% premium)</label>
  <p>${pa?'Immediate loading is available.':'Immediate loading is currently unavailable — your cargo will follow the port schedule.'}</p>
  <p>Charge: <b id="pc">—</b></p><button class="btn">Register cargo</button></form>`);
  const f=$('#ac'),v=f.elements;
  f.oninput=()=>$('#pc').textContent=+v.w.value>0?money(price(+v.w.value,v.p.checked)):'—';
  f.onsubmit=async e=>{e.preventDefault();const w=+v.w.value,p=v.p.checked&&premOK();
    me.cargo.push({id:'C'+Date.now(),weight:w,premium:p,loaded:false,slot:+v.s.value,containers:Math.ceil(w/DB.port.containerCapacityTon),price:price(w,p)});
    await save();cargoM();toast('Cargo registered')};
}
function contM(){
  const mine=me.cargo.reduce((a,c)=>a+c.containers,0),used=orders().reduce((a,o)=>a+o.c.containers,0);
  modal('Containers',`<p>Container capacity: <b>${DB.port.containerCapacityTon} ton</b> each</p><p>Containers assigned to you: <b>${mine}</b></p>
  <table><tr><th>Cargo</th><th>Weight</th><th>Containers</th></tr>${me.cargo.map((c,i)=>`<tr><td>Cargo ${i+1}</td><td>${c.weight} t</td><td>${c.containers}</td></tr>`).join('')}</table>
  <p>Available at port: <b>${DB.port.totalContainers-used}</b> of ${DB.port.totalContainers}</p>`);
}
function shipM(){
  const my=DB.port.ships.find(s=>s.no===me.ship);
  modal('Ship',`<p>Total ships at dock: <b>${DB.port.ships.length}</b> (${ships('available').length} available for loading)</p>
  <p>Your assigned ship: <b>Ship ${me.ship}</b> — ${my&&my.status==='available'?'available':'under maintenance'}</p>`);
}
function schedM(){
  const m={};users().forEach(u=>u.cargo.forEach(c=>{if(!c.loaded&&c.slot&&(!m[u.ship]||c.slot<m[u.ship]))m[u.ship]=c.slot}));
  const sch=Object.keys(m).sort((a,b)=>m[a]-m[b]);
  modal('My Schedule',`<table><tr><th>Cargo</th><th>Shipping slot</th></tr>${me.cargo.map((c,i)=>`<tr><td>Cargo ${i+1} ${c.premium?'(premium)':''}</td><td>${c.loaded?'Loaded':slotTxt(c.slot)}</td></tr>`).join('')||'<tr><td colspan=2>No cargo</td></tr>'}</table>
  <h3>Port ship schedule</h3><table>${sch.map(s=>`<tr><td>Ship ${s}</td><td>${slotTxt(m[s])}</td></tr>`).join('')}</table>
  <p>Ships yet to be scheduled: <b>${ships('available').filter(s=>!m[s.no]).length}</b></p>`);
}

/* ---------- authority dashboard ---------- */
function aShips(){
  const mt=ships('maintenance');
  modal('Ships',`<p>Ships available for loading: <b>${ships('available').length}</b> of ${DB.port.ships.length}</p><p>Ships needing maintenance: <b>${mt.length}</b></p>
  <table><tr><th>Ship</th><th>Maintenance time</th></tr>${mt.map(s=>`<tr><td>Ship ${s.no}</td><td>${s.maintenanceDays} days</td></tr>`).join('')}</table>`);
}
function aOrders(){
  const o=orders().filter(x=>!x.c.loaded),tot=o.reduce((a,x)=>a+x.c.price,0),line=x=>`<tr><td>${esc(x.u.name)} · Cargo ${x.i+1}</td><td>${x.c.weight} t</td><td>${money(x.c.price)}</td></tr>`;
  modal('Orders',`<p>Available orders: <b>${o.length}</b> · Total value: <b>${money(tot)}</b></p>
  <h3>Premium</h3><table>${o.filter(x=>x.c.premium).map(line).join('')||'<tr><td>None</td></tr>'}</table>
  <h3>Normal</h3><table>${o.filter(x=>!x.c.premium).map(line).join('')||'<tr><td>None</td></tr>'}</table>`);
}
function aSched(msg){
  const o=orders().filter(x=>!x.c.loaded).sort((a,b)=>b.c.price-a.c.price);
  modal('Schedule',`<p>Time slots available for shipping: <b>${DB.port.slots.length}</b></p>
  <form id="sc"><p>Orders by value (highest first) — select one:</p>${o.map((x,k)=>`<label class="row ${x.c.premium?'prem':''}"><input type="radio" name="o" value="${k}" ${k?'':'checked'}><span>${esc(x.u.name)} · Cargo ${x.i+1} · ${x.c.weight} t · <b>${money(x.c.price)}</b><br>Current slot: ${slotTxt(x.c.slot)}</span></label>`).join('')}
  <label>Preferred time<select name="s">${slotOpts()}</select></label><button class="btn">Assign</button></form>`);
  const f=$('#sc');f.onsubmit=async e=>{e.preventDefault();const x=o[f.elements.o.value];if(!x)return;x.c.slot=+f.elements.s.value;await save();aSched();toast('Order assigned to '+slotTxt(x.c.slot))};
}
function labourReq(){const L=DB.port.labour;return Math.max(0,Math.round(orders().filter(o=>!o.c.loaded).reduce((a,o)=>a+o.c.weight,0)*L.perTon)-L.assigned)}
function aLabour(){
  const L=DB.port.labour,req=labourReq();
  modal('Labour',`<p>Total labour available: <b>${(L.total-L.assigned).toLocaleString()}</b></p><p>Labour already assigned: <b>${L.assigned.toLocaleString()}</b></p><p>Total labour required: <b>${req.toLocaleString()}</b></p>
  <button class="btn" onclick="assignLabour()">Assign</button>`);
}
async function assignLabour(){const L=DB.port.labour,n=Math.min(labourReq(),L.total-L.assigned);L.assigned+=n;await save();aLabour();toast(n+' labourers assigned')}
function aPrem(){
  const p=orders().filter(o=>o.c.premium),sh=p.filter(o=>o.c.loaded).length;
  modal('Premium',`<p>Premium orders: <b>${p.length}</b> · Shipped: <b>${sh}</b> · Pending: <b>${p.length-sh}</b></p>
  ${p.map(x=>`<div class="row prem"><div><b>${esc(x.u.name)}</b> · Cargo ${x.i+1}<br>${x.c.weight} t · ${money(x.c.price)}</div><b>${x.c.loaded?'Shipped':'Not shipped'}</b></div>`).join('')}`);
}
load();
