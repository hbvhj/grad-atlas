import {NextRequest,NextResponse} from 'next/server';
import {timingSafeEqual} from 'node:crypto';
export function proxy(req:NextRequest){
  const password=process.env.APP_PASSWORD;
  const hasDatabase=Boolean(process.env.CLOUDFLARE_ACCOUNT_ID&&process.env.CLOUDFLARE_D1_DATABASE_ID&&process.env.CLOUDFLARE_D1_API_TOKEN);
  if(!hasDatabase&&!password)return NextResponse.next();
  if(!password)return new NextResponse('Set APP_PASSWORD before enabling the personal database.',{status:503});
  let supplied='';
  try{const header=req.headers.get('authorization')||'';if(header.startsWith('Basic ')){const decoded=Buffer.from(header.slice(6),'base64').toString('utf8');supplied=decoded.slice(decoded.indexOf(':')+1);}}catch{}
  const a=Buffer.from(supplied),b=Buffer.from(password);
  if(a.length===b.length&&timingSafeEqual(a,b))return NextResponse.next();
  return new NextResponse('Sign in to Grad Atlas. Use any username and the workspace password.',{status:401,headers:{'WWW-Authenticate':'Basic realm="Grad Atlas", charset="UTF-8"','Cache-Control':'no-store'}});
}
export const config={matcher:['/((?!_next/static|_next/image|favicon.svg).*)']};
