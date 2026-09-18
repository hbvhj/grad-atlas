// D1's HTTPS API works in Vercel's Node.js runtime without Worker bindings.
export const configured = () => Boolean(process.env.CLOUDFLARE_ACCOUNT_ID && process.env.CLOUDFLARE_D1_DATABASE_ID && process.env.CLOUDFLARE_D1_API_TOKEN);
type Result<T> = {results:T[];meta:{changes:number};success:boolean};
async function query<T>(sql:string,params:unknown[]=[]):Promise<Result<T>> {
  if(!configured()) throw Error('Database is not configured. This deployment is read-only.');
  const {CLOUDFLARE_ACCOUNT_ID:account,CLOUDFLARE_D1_DATABASE_ID:id,CLOUDFLARE_D1_API_TOKEN:token}=process.env;
  const response=await fetch(`https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(account!)}/d1/database/${encodeURIComponent(id!)}/query`,{
    method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},
    body:JSON.stringify({sql,params}),cache:'no-store',signal:AbortSignal.timeout(10000)
  });
  const data=await response.json();
  if(!response.ok||!data.success||!data.result?.[0]?.success) throw Error('Database request failed. Check the D1 configuration and schema.');
  return data.result[0];
}
export function database(){return {prepare(sql:string){const statement=(params:unknown[])=>({
  bind:(...values:unknown[])=>statement(values),
  all:<T>()=>query<T>(sql,params),
  first:async<T>()=>(await query<T>(sql,params)).results[0]??null,
  run:()=>query(sql,params)
});return statement([])}};}
export async function read(id:string){return database().prepare('SELECT payload, version FROM records WHERE id = ?').bind(id).first<{payload:string;version:number}>();}
export async function write(id:string,value:unknown,version?:number){
  const text=JSON.stringify(value),now=new Date().toISOString();
  if(version!==undefined){
    const q=version===0?database().prepare('INSERT OR IGNORE INTO records (id,payload,version,updated_at) VALUES (?,?,1,?)').bind(id,text,now):database().prepare('UPDATE records SET payload = ?, version = version + 1, updated_at = ? WHERE id = ? AND version = ?').bind(text,now,id,version);
    const r=await q.run();if(!r.meta.changes)throw Error('记录已在其他窗口更新，请刷新后再编辑');
  }else await database().prepare('INSERT INTO records (id,payload,version,updated_at) VALUES (?,?,1,?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload,version=records.version+1,updated_at=excluded.updated_at').bind(id,text,now).run();
}
export function sameOrigin(req:Request){const origin=req.headers.get('origin');if(origin&&new URL(req.url).origin!==origin)throw Error('请求来源不正确');}
