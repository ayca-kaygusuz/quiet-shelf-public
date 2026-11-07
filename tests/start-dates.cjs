const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('src/index.html','utf8').match(/<script>([\s\S]*)<\/script>/)[1];
const book=(extra={})=>({id:'story',title:'A story',author:'',status:'Unread',history:[],...extra});
function app(records=[book()],day='2025-03-01'){
 let clock=day+'T12:00:00Z',elements={},storage={'quiet-shelf-v1':JSON.stringify(records)},handlers={},allowFinish=true;
 class ClockDate extends Date{constructor(...args){super(...(args.length?args:[clock]))}}
 function element(s){return elements[s]??={value:'',textContent:'',innerHTML:'',hidden:false,setAttribute(){},setCustomValidity(){},reportValidity(){},focus(){},showModal(){},close(){handlers.close?.()},addEventListener:(name,cb)=>handlers[name]=cb,querySelector:()=>({disabled:false}),reset(){for(let id of ['#title','#author','#description','#completionDate','#addSeriesName','#addSeriesVolume'])element(id).value='';element('#addStatus').value='Unread'}}}
 let ctx={console,URL,AbortController,Date:ClockDate,setTimeout,clearTimeout,location:{hostname:'localhost'},crypto:require('node:crypto').webcrypto,confirm:()=>allowFinish,localStorage:{getItem:k=>storage[k],setItem:(k,v)=>storage[k]=v},document:{querySelector:element,querySelectorAll:()=>[],addEventListener(){}}};
 vm.createContext(ctx);vm.runInContext(source,ctx);
 return {run:s=>vm.runInContext(s,ctx),element,storage,setDay:day=>clock=day+'T12:00:00Z',allowFinish:v=>allowFinish=v};
}
const click=(a,id)=>a.element('#detail').onclick({target:{id,dataset:{},closest:()=>null}});
const edit=(a,id,value,dataset={})=>a.element('#detail').onchange({target:{id,value,dataset}});
let a=app();a.run("setStatus('In progress')");assert.equal(a.run('current().startedOn'),'2025-03-01');assert.equal(a.run('current().history.length'),0);
a.setDay('2025-03-04');a.run("setStatus('In progress')");assert.equal(a.run('current().startedOn'),'2025-03-01','reselecting the current status does not restart the clock');
a=app(JSON.parse(a.storage['quiet-shelf-v1']),'2025-03-04');assert.equal(a.run('current().startedOn'),'2025-03-01');a.run("setCollection('archive');setCollection('library')");assert.equal(a.run('current().startedOn'),'2025-03-01');
a.allowFinish(false);click(a,'finish');assert.equal(a.run('current().status'),'In progress');assert.equal(a.run('current().startedOn'),'2025-03-01');assert.equal(a.run('current().history.length'),0);
a.allowFinish(true);click(a,'finish');assert.equal(a.run('current().history[0].startDate'),'2025-03-01');assert.equal(a.run('current().history[0].date'),'2025-03-04');assert.equal(a.run('current().startedOn'),undefined);
a.setDay('2025-03-08');click(a,'reread');assert.equal(a.run('current().startedOn'),'2025-03-08');a.setDay('2025-03-10');click(a,'finish');assert.equal(a.run('current().history.length'),2);assert.equal(a.run('current().history[0].startDate'),'2025-03-01');assert.equal(a.run('current().history[1].startDate'),'2025-03-08');assert.equal(a.run('current().history[1].date'),'2025-03-10');
a.run("setStatus('In progress');setStatus('Unread')");assert.equal(a.run('current().startedOn'),undefined);click(a,'finish');assert.equal(a.run('current().history[2].startDate'),'2025-03-10');assert.equal(a.run('current().history[2].date'),'2025-03-10');
let directId=a.run('current().history[2].id');edit(a,'date-'+directId,'2025-03-09',{history:directId});assert.equal(a.run('current().history[2].startDate'),'2025-03-09','start default follows an edited finish date');
edit(a,'start-'+directId,'2025-03-07',{startHistory:directId});assert.equal(a.run('current().history[2].startDate'),'2025-03-07');edit(a,'date-'+directId,'2025-03-06',{history:directId});assert.equal(a.run('current().history[2].date'),'2025-03-09');assert.match(a.element('#message').textContent,/on or before/);
edit(a,'start-'+directId,'2025-03-11',{startHistory:directId});assert.equal(a.run('current().history[2].startDate'),'2025-03-07');assert.match(a.element('#message').textContent,/today or earlier/);
a.run("tab='history';render()");assert.match(a.element('#detail').innerHTML,/data-start-history=/);assert.match(a.element('#detail').innerHTML,/Started/);
a.element('#pastDate').value='2025-02-01';click(a,'past');assert.equal(a.run('current().history.at(-1).startDate'),'2025-02-01');assert.equal(a.run('current().history.at(-1).date'),'2025-02-01');
let restored=app(JSON.parse(a.storage['quiet-shelf-v1']),'2025-03-10');assert.equal(restored.run('current().history[0].startDate'),'2025-03-01');assert.equal(restored.run('current().history[2].startDate'),'2025-03-07');
// Legacy records retain dates; missing completed starts default to their finish, active starts stay unknown.
let legacy=app([book({status:'Done',history:[{id:'old',date:'2024-01-01'}]})]);assert.equal(legacy.run('current().history[0].startDate'),'2024-01-01');edit(legacy,'date-old','2023-12-31',{history:'old'});assert.equal(legacy.run('current().history[0].startDate'),'2023-12-31');
let ongoing=app([book({status:'In progress'})]);ongoing.run("tab='history';render()");assert.match(ongoing.element('#detail').innerHTML,/not recorded/);edit(ongoing,'currentStartDate','2025-02-20');assert.equal(ongoing.run('current().startedOn'),'2025-02-20');click(ongoing,'finish');assert.equal(ongoing.run('current().history[0].startDate'),'2025-02-20');
let unknown=app([book({status:'In progress'})]);click(unknown,'finish');assert.equal(unknown.run('current().history[0].startDate'),'2025-03-01');
assert.throws(()=>app([book({status:'Done',history:[{id:'bad',date:'2025-02-01',startDate:'2025-02-02'}]})]).run("validate([{id:'bad',title:'Invalid',status:'Done',history:[{id:'bad-date',date:'2025-02-01',startDate:'2025-02-02'}]}])"));
// Adding with each initial status follows the same rules, including a backdated completion.
let adding=app();adding.element('#add').onclick();adding.element('#title').value='Already reading';adding.element('#addStatus').value='In progress';adding.element('#addForm').onsubmit({preventDefault(){},target:adding.element('#addForm')});assert.equal(adding.run('current().startedOn'),'2025-03-01');
adding.element('#add').onclick();adding.element('#title').value='Finished earlier';adding.element('#addStatus').value='Done';adding.element('#completionDate').value='2024-11-15';adding.element('#addForm').onsubmit({preventDefault(){},target:adding.element('#addForm')});assert.equal(adding.run('current().history[0].startDate'),'2024-11-15');assert.equal(adding.run('current().history[0].date'),'2024-11-15');
console.log('PASS: automatic start dates, direct completion/backdated defaults, rereads, cancelled finishes, date editing/order validation, collection moves, reload/backup compatibility and legacy entries');

let removedId=a.run('current().history[0].id'),beforeRemoval=a.run('current().history.length');
const removeClick={target:{id:'',dataset:{remove:removedId},closest:()=>null}};
a.allowFinish(false);a.element('#detail').onclick(removeClick);assert.equal(a.run('current().history.length'),beforeRemoval);
a.allowFinish(true);a.element('#detail').onclick(removeClick);assert.equal(a.run('current().history.length'),beforeRemoval-1);assert.equal(a.run('current().history[0].startDate'),'2025-03-08');
