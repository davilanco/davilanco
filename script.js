document.addEventListener('DOMContentLoaded', () => {

  // 1. HAMBURGER MENU + X ANIMATION
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('navLinks');

  if(hamburger && navLinks){
    hamburger.addEventListener('click', () => {
      navLinks.classList.toggle('active'); // open/close menu
      hamburger.classList.toggle('active'); // animate to X
    });

    // Close menu when you click a link
    document.querySelectorAll('.nav-links a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('active');
        hamburger.classList.remove('active'); // reset to 3 lines
      });
    });
  }

  // 2. SMOOTH SCROLL WITH OFFSET FOR FIXED NAV
  const nav = document.querySelector('nav');
  if(nav){
    const navHeight = nav.offsetHeight;
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function(e) {
        const targetId = this.getAttribute('href');
        if(targetId === "#") return;
        const target = document.querySelector(targetId);
        if(target) {
          e.preventDefault();
          const top = target.offsetTop - navHeight + 5; // 5px extra space
          window.scrollTo({ top: top, behavior: 'smooth' });
        }
      });
    });
  }

  // 3. ACTIVE NAV LINK HIGHLIGHT ON SCROLL
  const sections = document.querySelectorAll('section[id]');
  const navLi = document.querySelectorAll('.nav-links li a');

  window.addEventListener('scroll', () => {
    let current = '';
    const navHeight = nav? nav.offsetHeight : 70;

    sections.forEach(section => {
      const sectionTop = section.offsetTop - navHeight - 60;
      const sectionHeight = section.clientHeight;
      if(pageYOffset >= sectionTop && pageYOffset < sectionTop + sectionHeight) {
        current = section.getAttribute('id');
      }
    });

    navLi.forEach(a => {
      a.classList.remove('active');
      if(a.getAttribute('href') === `#${current}`) {
        a.classList.add('active'); // add active class for CSS
      }
    });
  });

  // 4. FORM SUBMIT FEEDBACK - NO PAGE RELOAD
  const forms = document.querySelectorAll('form');
  forms.forEach(form => {
    const btn = form.querySelector('button[type="submit"]');
    if(btn) btn.dataset.original = btn.innerText;

    form.addEventListener('submit', (e) => {
      if(btn){
        btn.innerText = 'Sending...';
        btn.disabled = true;

        // Let formspree submit, then reset after 2s
        setTimeout(() => {
          btn.innerText = 'Sent! ✓';
          form.reset(); // clear inputs
          setTimeout(() => {
            btn.innerText = btn.dataset.original || 'Send';
            btn.disabled = false;
          }, 2000);
        }, 800);
      }
    });
  });

  // 5. PAUSE OTHER AUDIO WHEN ONE PLAYS
  const audios = document.querySelectorAll('audio');
  audios.forEach(audio => {
    audio.addEventListener('play', () => {
      audios.forEach(other => {
        if(other!== audio) other.pause();
      });
    });
  });

  // 6. ADD CURRENT YEAR TO FOOTER
  const yearSpan = document.querySelector('footer p');
  if(yearSpan){
    yearSpan.innerHTML = `© ${new Date().getFullYear()} Davilanco.com | FELO ME Out Now`;
  }

});
const API_URL = "https://davilanco-api.davilanco.workers.dev"; 

// SUBMIT POST
document.getElementById('postForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('name').value;
  const message = document.getElementById('message').value;
  
  await fetch(API_URL, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({name, message})
  });
  
  document.getElementById('postForm').reset();
  loadPosts();
  alert('Post sent! Waiting for approval ❤️');
});

// LOAD POSTS
async function loadPosts() {
  const res = await fetch(API_URL);
  const posts = await res.json();
  const feed = document.getElementById('postsFeed');
  feed.innerHTML = "";
  
  posts.forEach(post => {
    feed.innerHTML += `
      <div class="support-card" style="margin-bottom:15px; text-align:left;">
        <h4>${post.name}</h4>
        <p>${post.message}</p>
        <small style="opacity:0.6;">${new Date(post.created_at).toLocaleString()}</small>
      </div>
    `;
  });
}
loadPosts();