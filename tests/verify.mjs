import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import ts from 'typescript';
const seed=JSON.parse(readFileSync(new URL('../lib/seed.json',import.meta.url),'utf8'));
assert.equal(seed.length,32);assert.equal(new Set(seed.map(p=>p.id)).size,32);
for(const p of seed){
  for(const key of ['rounds','requirements','tracks'])assert.ok(Array.isArray(p[key]),`${p.id}: ${key}`);
  assert.ok(p.name&&p.school);assert.equal(p.fit,'');assert.equal(p.risk,'');
  assert.ok(!p.selectedRound||p.rounds.some(r=>r.id===p.selectedRound));
  for(const r of p.rounds)if(r.date)assert.equal(new Date(r.date).toISOString().slice(0,10),r.date);
}
const source=readFileSync(new URL('../lib/store.ts',import.meta.url),'utf8');
const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const store=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
for(const key of ['CLOUDFLARE_ACCOUNT_ID','CLOUDFLARE_D1_DATABASE_ID','CLOUDFLARE_D1_API_TOKEN'])delete process.env[key];
assert.equal(store.configured(),false);await assert.rejects(()=>store.read('mock:x'),/read-only/);
process.env.CLOUDFLARE_ACCOUNT_ID='test-account';process.env.CLOUDFLARE_D1_DATABASE_ID='test-db';process.env.CLOUDFLARE_D1_API_TOKEN='test-token';
const db=new DatabaseSync(':memory:');db.exec(readFileSync(new URL('../drizzle/0000_early_the_watchers.sql',import.meta.url),'utf8'));
globalThis.fetch=async(url,options)=>{
  assert.equal(options.headers.Authorization,'Bearer test-token');assert.equal(options.cache,'no-store');
  const {sql,params}=JSON.parse(options.body);const stmt=db.prepare(sql);const isRead=/^SELECT/.test(sql);
  return Response.json({success:true,result:[{success:true,results:isRead?stmt.all(...params):[],meta:{changes:isRead?0:Number(stmt.run(...params).changes)}}]});
};
await store.write('mock:1',{scores:[160,168,4]},0);
assert.equal((await store.read('mock:1')).version,1);
await assert.rejects(()=>store.write('mock:1',{},0),/其他窗口/);
await store.write('mock:1',{scores:[162,169,4]},1);
await assert.rejects(()=>store.write('mock:1',{},1),/其他窗口/);
assert.deepEqual(JSON.parse((await store.read('mock:1')).payload).scores,[162,169,4]);
await store.write('mock:1',{deleted:true},2);assert.equal((await store.read('mock:1')).version,3);
await store.write('check:01',{hash:'a'});await store.write('check:01',{hash:'b'});assert.equal((await store.read('check:01')).version,2);
assert.throws(()=>store.sameOrigin(new Request('https://example.com/api/data',{headers:{origin:'https://other.com'}})));
globalThis.fetch=async()=>Response.json({success:false},{status:403});await assert.rejects(()=>store.read('mock:1'),/Database request failed/);
console.log('PASS: 32 complete programs, privacy fields, round references, D1 HTTP adapter, persistence, optimistic conflicts, errors and origin checks.');
