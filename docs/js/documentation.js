// Activate sidebar items
document.addEventListener('DOMContentLoaded', () => {
  const container = document.querySelector('.docs-main');
  const links = document.querySelectorAll('.docs-sidebar__link');

  if (!container || !links.length) return;

  const sections = Array.from(links)
    .map(link => {
      const id = link.getAttribute('href')?.replace('#', '');
      const section = document.getElementById(id);
      return section ? { link, section } : null;
    })
    .filter(Boolean);

  const offset = 400;

  let lockSpy = false;
  let scrollTimeout = null;

  function setActiveLink(activeLink) {
    links.forEach(link =>
      link.classList.toggle('active', link === activeLink)
    );
  }

  function scrollSpy() {
    if (lockSpy) return;

    const scrollTop = container.scrollTop;

    if (scrollTop <= 10) {
      setActiveLink(sections[0].link);
      return;
    }

    let current = sections[0];

    for (const item of sections) {
      if (item.section.offsetTop - offset <= scrollTop) {
        current = item;
      }
    }

    setActiveLink(current.link);
  }

  function handleScrollEnd() {
    clearTimeout(scrollTimeout);

    scrollTimeout = setTimeout(() => {
      lockSpy = false;   
      scrollSpy();      
    }, 120); 
  }

  container.addEventListener('scroll', () => {
    scrollSpy();
    handleScrollEnd();
  });

  sections.forEach(({ link }) => {
    link.addEventListener('click', () => {
      lockSpy = true;       
      setActiveLink(link);  

      if (window.innerWidth < 1025) {
        toggleSidebar();
      }
    });
  });

  scrollSpy();
});

// Copy code functionality
document.querySelectorAll('pre').forEach(pre => {
  const button = document.createElement('button');
  button.className = 'docs-copy-btn';
  button.textContent = 'Copy';
  button.addEventListener('click', () => {
    const code = pre.querySelector('code').textContent;
    navigator.clipboard.writeText(code).then(() => {
      button.textContent = 'Copied!';
      setTimeout(() => {
        button.textContent = 'Copy';
      }, 2000);
    }).catch(err => {
      console.error('Failed to copy:', err);
    });
  });
  pre.appendChild(button);
});

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const targetId = this.getAttribute('href').substring(1);
    const target = document.getElementById(targetId);
    
    if (target) {
      const docsMain = document.querySelector('.docs-main');
      if (docsMain) {
        const targetPosition = target.offsetTop - docsMain.offsetTop - 20;
        docsMain.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      } else {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    }
  });
});

// Share page function
function sharePage() {
  if (!navigator.share) {
    alert('Sharing is not supported on this browser');
    return;
  }

  navigator.share({
    title: document.title,
    text: 'Check out MerryGo documentation!',
    url: window.location.href
  }).catch(() => {});
}

// Sidebar & Overlay Mobile
function toggleSidebar () {
  const sidebar = document.querySelector('.docs-sidebar');
  const overlay = document.querySelector('.docs-overlay');

  sidebar.classList.toggle('--open');
  overlay.classList.toggle('--active');
}