import { createSessionToken } from '../lib/auth.js';
export async function onRequestPost({request,env}) {
  try {
    const body = await request.json();
    const login = String(body.login || '').trim();
    const password = String(body.password || '');
    if (!login || !password) return Response.json({error:'Login and password are required'},{status:400});
    const user = await env.DB.prepare('SELECT * FROM users WHERE nickname = ? OR email = ? OR phone = ?').bind(login,login,login).first();
    if (!user) return Response.json({error:'Invalid login or password'},{status:401});
    if (user.status === 'suspended') return Response.json({error:'Your account has been suspended'},{status:403});
    if (!await verifyPassword(password,user.password)) return Response.json({error:'Invalid login or password'},{status:401});
    if (Number(user.verified) !== 1) return Response.json({error:'Please verify your email first',needs_verification:true,email:user.email},{status:403});
    const token = await createSessionToken({id:user.id,nickname:user.nickname,role:user.role,exp:Date.now()+7*24*60*60*1000},env);
    return Response.json({ok:true,token,user:{id:user.id,firstname:user.firstname,lastname:user.lastname,nickname:user.nickname,phone:user.phone,email:user.email,role:user.role}});
  } catch (error) {
    return Response.json({error:'Login service could not complete the request. Check the D1 binding and environment secrets.'},{status:500});
  }
}
async function verifyPassword(password,stored) {
  if (!stored || typeof stored !== 'string') return false;
  const colon = stored.indexOf(':');
  if (colon < 1) return false;
  try {
    const saltHex=stored.slice(0,colon), hashHex=stored.slice(colon+1);
    const salt=new Uint8Array((saltHex.match(/.{1,2}/g)||[]).map(x=>parseInt(x,16)));
    if (!salt.length || !hashHex) return false;
    const material=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveBits']);
    const bits=await crypto.subtle.deriveBits({name:'PBKDF2',salt,iterations:100000,hash:'SHA-256'},material,256);
    return Array.from(new Uint8Array(bits)).map(b=>b.toString(16).padStart(2,'0')).join('')===hashHex;
  } catch (_) { return false; }
}