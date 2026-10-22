// Authentication helper for this site's own Cloudflare Pages Functions.
// Configure SESSION_SECRET (or AE_APP_SECRET) to the same value used by the Store project.
const encoder = new TextEncoder();
function secretFor(env) { return String(env.SESSION_SECRET || env.AE_APP_SECRET || ''); }
function b64url(bytes) {
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}
function fromB64url(value) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(normalized + '='.repeat((4 - normalized.length % 4) % 4));
  return Uint8Array.from(binary, c => c.charCodeAt(0));
}
export async function createSessionToken(payload, env) {
  const secret = secretFor(env);
  if (!secret) throw new Error('SESSION_SECRET or AE_APP_SECRET must be configured');
  const encoded = b64url(encoder.encode(JSON.stringify(payload)));
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), {name:'HMAC',hash:'SHA-256'}, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(encoded));
  return encoded + '.' + b64url(new Uint8Array(signature));
}
export async function requireSession(request, env) {
  const secret = secretFor(env);
  if (!secret) return {ok:false,response:Response.json({error:'Server authentication is not configured'},{status:503})};
  const match = (request.headers.get('Authorization') || '').match(/^Bearer\s+([A-Za-z0-9_.-]+)$/i);
  if (!match) return unauthorized();
  const parts = match[1].split('.');
  if (parts.length !== 2) return unauthorized();
  try {
    const key = await crypto.subtle.importKey('raw', encoder.encode(secret), {name:'HMAC',hash:'SHA-256'}, false, ['verify']);
    const valid = await crypto.subtle.verify('HMAC', key, fromB64url(parts[1]), encoder.encode(parts[0]));
    if (!valid) return unauthorized();
    const payload = JSON.parse(new TextDecoder().decode(fromB64url(parts[0])));
    if (!payload || !payload.id || !Number.isFinite(payload.exp) || payload.exp <= Date.now()) return unauthorized();
    const current = await env.DB.prepare('SELECT id, role, status, verified FROM users WHERE id = ?').bind(String(payload.id)).first();
    if (!current || current.status === 'suspended' || Number(current.verified) !== 1) return unauthorized();
    return {ok:true,user:{id:String(current.id),role:String(current.role || 'customer'),nickname:payload.nickname || ''}};
  } catch (_) { return unauthorized(); }
}
function unauthorized() {
  return {ok:false,response:Response.json({error:'Authentication required; please sign in again.'},{status:401})};
}