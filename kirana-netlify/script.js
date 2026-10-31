const KEY='kiranaKhataV1';
const PAL=['#e4572e','#2b6fd6','#2e9e5b','#8e44ad','#d98200','#0f8b8d','#c2185b'];
const col=id=>PAL[id%PAL.length];
const ini=n=>n.trim().split(/\s+/).slice(0,2).map(w=>w[0]).join('').toUpperCase();
const today=()=>new Date().toISOString().slice(0,10);
const inr=n=>'₹'+Number(n).toLocaleString('en-IN',{maximumFractionDigits:2});
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let data=null,sel=null,filt='all';
const sample=()=>({customers:[
 {id:1,name:'Sharma Ji',mobile:'9876501234',tx:[{d:'2026-10-20',t:'c',desc:'Atta 10kg, Dal 2kg, Oil 1L',a:850},{d:'2026-10-25',t:'p',mode:'Cash',a:300}]},
 {id:2,name:'Meena Devi',mobile:'9812345678',tx:[{d:'2026-10-22',t:'c',desc:'Rice 5kg, Sugar 2kg',a:420},{d:'2026-10-28',t:'p',mode:'UPI',a:420}]},
 {id:3,name:'Gurpreet Singh',mobile:'9988776655',tx:[{d:'2026-10-27',t:'c',desc:'Chai patti, Biscuits, Milk',a:265}]}],next:4});
function load(){try{const r=localStorage.getItem(KEY);if(r)return JSON.parse(r)}catch(e){}return sample()}
function save(){try{localStorage.setItem(KEY,JSON.stringify(data))}catch(e){}}
const bal=c=>c.tx.reduce((s,x)=>s+(x.t==='c'?x.a:-x.a),0);
function balView(b){return b>0?['red','Baaki (Due)']:b<0?['green','Advance']:['green','Clear']}
let shown=0;
function countUp(to){const el=document.getElementById('amt');if(matchMedia('(prefers-reduced-motion:reduce)').matches){shown=to;return}const from=shown,t0=performance.now();shown=to;(function f(t){const p=Math.min((t-t0)/600,1);el.textContent=inr(Math.round(from+(to-from)*p));if(p<1)requestAnimationFrame(f);else el.textContent=inr(to)})(t0)}
function toast(m){const t=document.getElementById('toast');t.textContent=m;t.classList.add('show');clearTimeout(toast.h);toast.h=setTimeout(()=>t.classList.remove('show'),2200)}
function renderTotal(){
  const sum=data.customers.reduce((s,c)=>s+Math.max(bal(c),0),0);
  const owing=data.customers.filter(c=>bal(c)>0).length;
  const el=document.getElementById('total');
  el.className='total '+(sum>0?'red':'green');
  el.innerHTML=`<div><span class="lbl">Total outstanding store credit</span><small>${owing} of ${data.customers.length} customers owe you</small></div><div class="amt num" id="amt">${inr(sum)}</div>`;countUp(sum);
}
function renderList(){
  const q=document.getElementById('search').value.trim().toLowerCase();
  let rows=data.customers.filter(c=>(c.name.toLowerCase().includes(q)||c.mobile.includes(q))&&(filt==='all'||(filt==='due'?bal(c)>0:bal(c)<=0)));
  if(document.getElementById('sort').value==='high')rows=rows.slice().sort((a,b)=>bal(b)-bal(a));
  const ul=document.getElementById('list');
  if(!rows.length){ul.innerHTML='<li class="empty">No customer found. Add one below.</li>';return}
  ul.innerHTML=rows.map(c=>{const b=bal(c),[cl,lb]=balView(b);
   return `<li class="cust ${c.id===sel?'sel':''}" tabindex="0" role="button" data-id="${c.id}"><div class="av" style="background:${col(c.id)}">${esc(ini(c.name))}</div><div class="nm"><b>${esc(c.name)}</b><span class="num">${esc(c.mobile)}</span></div><div class="bal ${cl} num">${inr(Math.abs(b))}<small>${lb}</small></div></li>`}).join('');
}
function renderDetail(){
  const box=document.getElementById('detail');
  const c=data.customers.find(x=>x.id===sel);
  if(!c){box.innerHTML='<div class="empty"><h2>Select a customer</h2>Pick a name from the directory to add udhaar or record a payment.</div>';return}
  const b=bal(c),[cl,lb]=balView(b);
  let run=0;const rows=c.tx.map((x,i)=>{run+=x.t==='c'?x.a:-x.a;return{...x,run,i}}).reverse();
  box.innerHTML=`<div class="head"><div style="display:flex;gap:12px;align-items:center"><div class="av" style="background:${col(c.id)};width:52px;height:52px;font-size:1.2rem">${esc(ini(c.name))}</div><div><h2>${esc(c.name)}</h2><span class="num" style="color:var(--muted)">📱 ${esc(c.mobile)}</span></div></div><div class="big ${cl} num" style="color:var(--${cl})">${inr(Math.abs(b))}<small style="display:block;font-size:.85rem;font-weight:600">${lb}</small></div></div>
  <div class="forms">
   <div class="form c"><h3>🛍️ Credit transaction entry</h3>
    <label for="cd">Date</label><input id="cd" type="date" value="${today()}">
    <label for="ci">Item descriptions</label><input id="ci" placeholder="e.g. Atta 5kg, Dal 1kg">
    <label for="ca">Amount added to credit (₹)</label><input id="ca" type="number" min="1" step="0.01" inputmode="decimal">
    <div class="qc" data-for="ca"><button type="button" data-add="50">+₹50</button><button type="button" data-add="100">+₹100</button><button type="button" data-add="500">+₹500</button></div>
    <button class="btn credit" id="cBtn" type="button">Add to credit</button><div id="cMsg" class="msg" role="alert"></div></div>
   <div class="form p"><h3>💰 Payment settlement entry</h3>
    <label for="pd">Date</label><input id="pd" type="date" value="${today()}">
    <label for="pm">Payment type</label><select id="pm"><option value="Cash">Cash received</option><option value="UPI">UPI payment</option></select>
    <label for="pa">Amount received / balance reduced (₹)</label><input id="pa" type="number" min="1" step="0.01" inputmode="decimal">
    <div class="qc" data-for="pa"><button type="button" data-add="100">+₹100</button><button type="button" data-add="500">+₹500</button></div>
    <div class="prev" id="pPrev">Balance reduced by ₹0. New balance: ${inr(b)}</div>${b>0?'<button class="btn ghost" id="fullBtn" type="button">Pay full balance ('+inr(b)+')</button>':''}
    <button class="btn pay" id="pBtn" type="button">Record payment</button><div id="pMsg" class="msg" role="alert"></div></div>
  </div>
  <div class="tablewrap"><table><thead><tr><th>Date</th><th>Details</th><th class="r">Credit added</th><th class="r">Paid</th><th class="r">Balance</th><th></th></tr></thead><tbody>
  ${rows.length?rows.map(x=>`<tr><td class="num">${x.d.split('-').reverse().join('/')}</td><td>${x.t==='c'?esc(x.desc):'Payment · '+x.mode}</td><td class="r num tag red">${x.t==='c'?inr(x.a):''}</td><td class="r num tag green">${x.t==='p'?inr(x.a):''}</td><td class="r num">${inr(x.run)}</td><td class="r"><button class="del" type="button" data-i="${x.i}" aria-label="Delete this entry" title="Delete entry">✕</button></td></tr>`).join(''):'<tr><td colspan="6" class="empty">No entries yet.</td></tr>'}
  </tbody></table></div>
  <button class="btn ghost" id="delBtn" type="button">Delete this customer</button>`;
  const msg=(id,t,ok)=>{const m=document.getElementById(id);m.textContent=t;m.className='msg '+(ok?'ok':'err')};
  document.getElementById('cBtn').onclick=()=>{
    const d=cd.value,desc=ci.value.trim(),a=parseFloat(ca.value);
    if(!d)return msg('cMsg','Choose a date.');
    if(!desc)return msg('cMsg','Write what items were taken.');
    if(!(a>0))return msg('cMsg','Enter an amount above ₹0.');
    c.tx.push({d,t:'c',desc,a});sortTx(c);commit('cMsg','Added '+inr(a)+' to credit.')};
  document.getElementById('pBtn').onclick=()=>{
    const d=pd.value,a=parseFloat(pa.value);
    if(!d)return msg('pMsg','Choose a date.');
    if(!(a>0))return msg('pMsg','Enter an amount above ₹0.');
    if(a>bal(c)&&!confirm('Payment is more than the due balance ('+inr(Math.max(b,0))+'). Save as advance?'))return;
    c.tx.push({d,t:'p',mode:pm.value,a});sortTx(c);commit('pMsg','Received '+inr(a)+' via '+pm.value+'.')};
  document.getElementById('delBtn').onclick=()=>{
    if(confirm('Delete '+c.name+' and all entries?')){data.customers=data.customers.filter(x=>x.id!==c.id);sel=null;save();renderAll()}};
  const fb=document.getElementById('fullBtn');if(fb)fb.onclick=()=>{pa.value=b;pa.dispatchEvent(new Event('input'));pa.focus()};
  document.querySelectorAll('.del').forEach(bt=>bt.onclick=()=>{const i=+bt.dataset.i,x=c.tx[i];if(confirm('Delete this '+(x.t==='c'?'credit':'payment')+' entry of '+inr(x.a)+'?')){c.tx.splice(i,1);save();renderAll();toast('Entry deleted')}});
  document.getElementById('pa').oninput=()=>{const a=parseFloat(pa.value)||0;document.getElementById('pPrev').textContent='Balance reduced by '+inr(a)+'. New balance: '+inr(b-a)};
  function commit(id,t){save();renderAll();msg(id,t,true);toast(t)}
}
const sortTx=c=>c.tx.sort((x,y)=>x.d.localeCompare(y.d));
function renderAll(){renderTotal();renderList();renderDetail()}
function pick(id){sel=id;renderList();renderDetail()}
document.getElementById('list').addEventListener('click',e=>{const li=e.target.closest('.cust');if(li)pick(+li.dataset.id)});
document.getElementById('list').addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){const li=e.target.closest('.cust');if(li){e.preventDefault();pick(+li.dataset.id)}}});
document.getElementById('search').addEventListener('input',renderList);
document.getElementById('sort').addEventListener('change',renderList);
document.getElementById('chips').addEventListener('click',e=>{const b=e.target.closest('.chip');if(!b)return;filt=b.dataset.f;document.querySelectorAll('.chip').forEach(x=>x.classList.toggle('on',x===b));renderList()});
document.getElementById('addBtn').onclick=()=>{
  const n=nn.value.trim(),m=nm.value.trim(),out=document.getElementById('addMsg');
  const bad=t=>{out.textContent=t;out.className='msg err'};
  if(!n)return bad('Enter the customer name.');
  if(!/^\d{10}$/.test(m))return bad('Mobile number must be 10 digits.');
  if(data.customers.some(c=>c.mobile===m))return bad('This mobile number is already in your khata.');
  const c={id:data.next++,name:n,mobile:m,tx:[]};data.customers.push(c);save();
  nn.value='';nm.value='';out.textContent='';document.getElementById('addbox').open=false;sel=c.id;renderAll()};
document.getElementById('detail').addEventListener('click',e=>{const b=e.target.closest('.qc button');if(!b)return;const i=document.getElementById(b.parentNode.dataset.for);i.value=(parseFloat(i.value)||0)+Number(b.dataset.add);i.dispatchEvent(new Event('input'));i.focus()});
data=load();sel=data.customers[0]?data.customers[0].id:null;renderAll();
