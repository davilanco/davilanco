export async function onRequestPost({request,env}) {
  try {
    const body=await request.json();
    const firstname=String(body.firstname||'').trim(), lastname=String(body.lastname||'').trim();
    const nickname=String(body.nickname||'').trim(), phone=String(body.phone||'').trim();
    const email=String(body.email||'').trim().toLowerCase(), password=String(body.password||'');
    if(!firstname||!lastname||!nickname||!phone||!email||!password) return Response.json({error:'All fields are required'},{status:400});
    if(password.length<8||!/[A-Z]/.test(password)||!/[0-9]/.test(password)||!/[^A-Za-z0-9]/.test(password))
      return Response.json({error:'Password must be at least 8 characters and contain uppercase, number and symbol'},{status:400});
    const id=crypto.randomUUID(), code=String(Math.floor(100000+Math.random()*900000));
    const expires=new Date(Date.now()+30*60*1000).toISOString();
    const hashedPassword=await hashPassword(password);
    await env.DB.prepare(`INSERT INTO users (id,firstname,lastname,nickname,phone,email,password,role,status,verified,verify_code,verify_expires)
      VALUES (?,?,?,?,?, ?,?,'customer','active',0,?,?)`).bind(id,firstname,lastname,nickname,phone,email,hashedPassword,code,expires).run();
    let emailSent=false;
    if(env.RESEND_API_KEY) {
      try {
        const response=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+env.RESEND_API_KEY,'Content-Type':'application/json'},body:JSON.stringify({
          from:env.FROM_EMAIL||'Davilanco <onboarding@resend.dev>',to:[email],subject:'Verify your Davilanco account',
          html:'<div style="font-family:system-ui,sans-serif"><h2>Welcome to Davilanco</h2><p>Hi '+escapeHtml(firstname)+',</p><p>Your verification code is <strong style="font-size:24px">'+code+'</strong>.</p><p>This code expires in 30 minutes. Open <a href="https://shop.davilanco.com/verify.html?email='+encodeURIComponent(email)+'">the account verification page</a> to verify.</p></div>'
        })});
        emailSent=response.ok;
      } catch (_) {}
    }
    return Response.json({ok:true,email,email_sent:emailSent,message:emailSent?'Account created. Check your email for the verification code.':'Account created, but the verification email could not be sent. Please contact support.'});
  } catch(error) {
    if(String(error?.message||'').includes('UNIQUE')) return Response.json({error:'Nickname, phone or email already exists'},{status:400});
    return Response.json({error:'Signup service could not complete the request. Check the D1 binding and email environment variables.'},{status:500});
  }
}
async function hashPassword(password) {
  const salt=crypto.getRandomValues(new Uint8Array(16));
  const material=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveBits']);
  const bits=await crypto.subtle.deriveBits({name:'PBKDF2',salt,iterations:100000,hash:'SHA-256'},material,256);
  const hex=bytes=>Array.from(bytes).map(b=>b.toString(16).padStart(2,'0')).join('');
  return hex(salt)+':'+hex(new Uint8Array(bits));
}
function escapeHtml(value){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}