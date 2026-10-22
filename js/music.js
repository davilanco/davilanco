(() => {
  const API = 'https://shop.davilanco.com/api';
  const grid = document.getElementById('musicGrid');
  const count = document.getElementById('musicCount');
  const status = document.getElementById('accountStatus');
  const token = () => localStorage.getItem('token');
  const user = () => { try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch (_) { return null; } };
  const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const showStatus = (message, kind = '') => { status.textContent = message || ''; status.className = 'status-message' + (kind ? ' ' + kind : ''); };
  const authHeaders = () => ({ 'Authorization': 'Bearer ' + token(), 'Content-Type': 'application/json' });

  function updateAccount() {
    const current = user();
    document.getElementById('signedInPanel').hidden = !token() || !current;
    document.getElementById('authForms').hidden = !!token() && !!current;
    document.getElementById('signedInName').textContent = current ? (current.nickname || current.firstname || current.email) : '';
    document.getElementById('accountButton').textContent = current && token() ? 'Your account' : 'Log in to comment';
    if (current && token()) document.getElementById('accountHeading').textContent = 'Welcome back';
  }
  function switchTab(which) {
    const login = which === 'login';
    document.getElementById('loginForm').hidden = !login;
    document.getElementById('signupForm').hidden = login;
    document.getElementById('loginTab').classList.toggle('active', login);
    document.getElementById('signupTab').classList.toggle('active', !login);
    document.getElementById('loginTab').setAttribute('aria-selected', String(login));
    document.getElementById('signupTab').setAttribute('aria-selected', String(!login));
    showStatus('');
  }
  document.getElementById('loginTab').addEventListener('click', () => switchTab('login'));
  document.getElementById('signupTab').addEventListener('click', () => switchTab('signup'));
  document.getElementById('logoutButton').addEventListener('click', () => {
    localStorage.removeItem('token'); localStorage.removeItem('user');
    updateAccount(); showStatus('You have logged out.', 'success'); renderTracks();
  });
  document.getElementById('loginForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    showStatus('Signing in…');
    try {
      const response = await fetch(API + '/login', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({login:form.get('login'),password:form.get('password')}) });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        showStatus(data.error || 'Could not sign in.', 'error');
        if (data.needs_verification && data.email) showStatus('Please verify your email first at shop.davilanco.com/verify.html, then log in again.', 'error');
        return;
      }
      localStorage.setItem('token', data.token); localStorage.setItem('user', JSON.stringify(data.user));
      event.currentTarget.reset(); updateAccount(); showStatus('You are signed in. You can now comment on tracks.', 'success'); await renderTracks();
    } catch (_) { showStatus('Could not connect to the account service. Please try again.', 'error'); }
  });
  document.getElementById('signupForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const body = Object.fromEntries(form.entries());
    showStatus('Creating your account…');
    try {
      const response = await fetch(API + '/signup', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) });
      const data = await response.json();
      if (!response.ok || !data.ok) { showStatus(data.error || 'Could not create account.', 'error'); return; }
      event.currentTarget.reset(); switchTab('login');
      showStatus((data.message || 'Account created.') + ' Check your email and verify your account at shop.davilanco.com/verify.html before logging in.', data.email_sent ? 'success' : 'error');
    } catch (_) { showStatus('Could not connect to the account service. Please try again.', 'error'); }
  });
  async function loadComments(trackId) {
    const list = document.querySelector('[data-comments="' + CSS.escape(trackId) + '"]');
    if (!list) return;
    try {
      const response = await fetch(API + '/music-comments?track=' + encodeURIComponent(trackId));
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not load comments');
      if (!data.comments.length) { list.innerHTML = '<p class="muted">No comments yet. Start the conversation.</p>'; return; }
      list.innerHTML = data.comments.map(c => '<article class="comment-item"><div class="comment-meta"><strong>' + escapeHtml(c.nickname || [c.firstname,c.lastname].filter(Boolean).join(' ') || 'Listener') + '</strong><time>' + escapeHtml(c.created_at) + '</time></div><p class="comment-body">' + escapeHtml(c.comment) + '</p></article>').join('');
    } catch (_) { list.innerHTML = '<p class="muted">Comments are temporarily unavailable.</p>'; }
  }
  async function renderTracks() {
    try {
      const response = await fetch('music/manifest.json', {cache:'no-store'});
      if (!response.ok) throw new Error('Music manifest not found');
      const tracks = await response.json();
      count.textContent = tracks.length + (tracks.length === 1 ? ' track' : ' tracks');
      if (!tracks.length) { grid.innerHTML = '<p class="muted">Music is coming soon.</p>'; return; }
      grid.innerHTML = tracks.map(track => {
        const image = track.image ? 'music/' + encodeURIComponent(track.image.split('/').pop()) : '';
        const audio = track.audio ? 'music/' + encodeURIComponent(track.audio.split('/').pop()) : '';
        return '<article class="music-card" id="track-' + escapeHtml(track.id) + '">' +
          '<div class="music-cover-wrap">' + (image ? '<img class="music-cover" src="' + image + '" alt="' + escapeHtml(track.title) + ' cover art" loading="lazy" onerror="this.style.display=\'none\'">' : '<div class="music-cover"></div>') + '</div>' +
          '<div class="music-card-content"><h3>' + escapeHtml(track.title) + '</h3><p class="track-description">' + escapeHtml(track.description || 'Davilanco') + '</p>' +
          (audio ? '<audio controls preload="none" src="' + audio + '">Your browser does not support audio playback.</audio><a class="btn btn-download" href="' + audio + '" download="' + escapeHtml(track.downloadName || track.audio) + '">⬇ Download audio</a>' : '<p class="muted">Audio coming soon.</p>') + '</div>' +
          '<section class="track-comments"><h4>Comments</h4><div class="comment-list" data-comments="' + escapeHtml(track.id) + '"><p class="muted">Loading comments…</p></div>' +
          '<form class="comment-form" data-track="' + escapeHtml(track.id) + '"><label class="muted" for="comment-' + escapeHtml(track.id) + '">Add your comment</label><textarea id="comment-' + escapeHtml(track.id) + '" name="comment" maxlength="1000" placeholder="' + (token() ? 'What do you think of this track?' : 'Log in to leave a comment') + '" required ' + (token() ? '' : 'disabled') + '></textarea>' +
          '<button class="btn" type="submit" ' + (token() ? '' : 'disabled') + '>' + (token() ? 'Post comment' : 'Log in to comment') + '</button></form></section></article>';
      }).join('');
      tracks.forEach(t => loadComments(t.id));
      grid.querySelectorAll('.comment-form').forEach(form => form.addEventListener('submit', async event => {
        event.preventDefault();
        if (!token()) { document.getElementById('account').scrollIntoView({behavior:'smooth'}); switchTab('login'); showStatus('Log in to your account before commenting.', 'error'); return; }
        const trackId = form.dataset.track, textarea = form.elements.comment, button = form.querySelector('button'), comment = textarea.value.trim();
        if (!comment) return;
        button.disabled = true; button.textContent = 'Posting…';
        try {
          const response = await fetch(API + '/music-comments', {method:'POST',headers:authHeaders(),body:JSON.stringify({track_id:trackId,comment})});
          const data = await response.json();
          if (!response.ok || !data.ok) throw new Error(data.error || 'Could not post comment');
          textarea.value = ''; await loadComments(trackId);
        } catch (error) { showStatus(error.message || 'Could not post comment.', 'error'); }
        finally { button.disabled = !token(); button.textContent = token() ? 'Post comment' : 'Log in to comment'; }
      }));
    } catch (_) { count.textContent = ''; grid.innerHTML = '<p class="muted">Music list could not be loaded. Please try again later.</p>'; }
  }
  updateAccount(); renderTracks();
})();