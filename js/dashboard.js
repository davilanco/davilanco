(() => {
 const API='https://shop.davilanco.com/api/music-comments';
 const token=localStorage.getItem('token');
 const message=document.getElementById('dashboardMessage');
 const commentsBox=document.getElementById('myComments');
 const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
 const showMessage=(text,error=false)=>{message.textContent=text;message.className='dashboard-message'+(error?' error':'');};
 const headers={'Authorization':'Bearer '+token,'Content-Type':'application/json'};
 if(!token){showMessage('Please log in to view your dashboard. Opening the music page will let you sign in.',true);commentsBox.innerHTML='<a class="btn" href="music.html#account">Log in / Create account</a>';document.getElementById('profileCard').hidden=true;return;}
 async function load(){
  try{
   const response=await fetch(API+'?mine=1',{headers:{'Authorization':'Bearer '+token}});
   const data=await response.json();
   if(!response.ok||!data.ok)throw new Error(data.error||'Could not load dashboard');
   const user=data.user||{};document.getElementById('profileCard').hidden=false;
   const fullName=[user.firstname,user.lastname].filter(Boolean).join(' ')||user.nickname||'Davilanco listener';
   document.getElementById('profileName').textContent=fullName;
   document.getElementById('profileEmail').textContent=user.email||'Email not available';
   document.getElementById('profileNickname').textContent=user.nickname?'@'+user.nickname:'';
   document.getElementById('profileAvatar').textContent=(fullName.trim()[0]||'D').toUpperCase();
   showMessage('Your account is ready.');
   const comments=data.comments||[];document.getElementById('commentCount').textContent=comments.length+' comment'+(comments.length===1?'':'s');
   if(!comments.length){commentsBox.innerHTML='<div class="empty-comments">You have not commented on any music yet. <a href="music.html">Listen to music and leave the first comment.</a></div>';return;}
   commentsBox.innerHTML=comments.map(c=>'<article class="my-comment" data-id="'+Number(c.id)+'"><div class="my-comment-top"><span class="comment-track">'+escapeHtml(c.track_id)+'</span><time>'+escapeHtml(c.created_at)+'</time></div><p>'+escapeHtml(c.comment)+'</p><button type="button" class="delete-comment" data-delete="'+Number(c.id)+'">Delete comment</button></article>').join('');
   commentsBox.querySelectorAll('[data-delete]').forEach(button=>button.addEventListener('click',async()=>{
    if(!confirm('Delete this comment? This cannot be undone.'))return;
    button.disabled=true;button.textContent='Deleting…';
    try{const res=await fetch(API+'?id='+encodeURIComponent(button.dataset.delete),{method:'DELETE',headers});const result=await res.json();if(!res.ok||!result.ok)throw new Error(result.error||'Delete failed');await load();}
    catch(error){showMessage(error.message||'Could not delete comment.',true);button.disabled=false;button.textContent='Delete comment';}
   }));
  }catch(error){showMessage(error.message||'Could not load your dashboard.',true);commentsBox.innerHTML='<a class="btn" href="music.html#account">Return to music page</a>';}
 }
 document.getElementById('dashboardLogout').addEventListener('click',()=>{localStorage.removeItem('token');localStorage.removeItem('user');location.href='music.html#account';});
 load();
})();