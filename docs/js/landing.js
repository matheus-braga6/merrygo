// Tab switching functionality
document.querySelectorAll('.demo__tab').forEach(tab => {
  tab.addEventListener('click', function() {
    const demo = this.dataset.demo;
    const targetTab = this.dataset.tab;
    
    // Remove active from all tabs in this demo
    document.querySelectorAll(`.demo__tab[data-demo="${demo}"]`).forEach(t => {
      t.classList.remove('demo__tab--active');
    });
    
    // Add active to clicked tab
    this.classList.add('demo__tab--active');
    
    // Hide all code contents in this demo
    document.querySelectorAll(`.demo__code-content[data-demo="${demo}"]`).forEach(content => {
      content.classList.remove('demo__code-content--active');
    });
    
    // Show target content
    document.querySelector(`.demo__code-content[data-demo="${demo}"][data-content="${targetTab}"]`).classList.add('demo__code-content--active');
  });
});

function copyCode(button) {
  const codeBlock = button.nextElementSibling;
  const code = codeBlock.textContent;

  navigator.clipboard.writeText(code).then(() => {
    const originalText = button.textContent;
    button.textContent = 'Copied!';

    setTimeout(() => {
      button.textContent = originalText;
    }, 2000);
  });
}

// Initialize Demo Carousels
window.addEventListener('DOMContentLoaded', function() {
  // Demo 1: Basic
  const demoBasic = new MerryGo({
    gallery: document.querySelector('.demo-basic__gallery'),
    galleryInner: document.querySelector('.demo-basic__inner'),
    prevBtn: document.querySelector('.demo-basic .demo__arrow--prev'),
    nextBtn: document.querySelector('.demo-basic .demo__arrow--next'),
    pagination: document.querySelector('.demo-basic .demo__pagination'),
    gap: 5,
    autoplay: 5000,
    infinityLoop: true
  });

  // Demo 2: Products
  const demoProducts = new MerryGo({
    gallery: document.querySelector('.demo-products__gallery'),
    galleryInner: document.querySelector('.demo-products__inner'),
    prevBtn: document.querySelector('.demo-products .demo__arrow--prev'),
    nextBtn: document.querySelector('.demo-products .demo__arrow--next'),
    pagination: document.querySelector('.demo-products .demo__pagination'),
    infinityLoop: false,
    breakpoints: {
      0: { slidesVisible: 1, gap: 5 },
      561: { slidesVisible: 2, gap: 15 },
      769: { slidesVisible: 3, gap: 15 },
      1025: { slidesVisible: 4, gap: 20 }
    }
  });

  // Demo 3: Thumbnails
  const thumbInputs = Array.from(document.querySelectorAll('.demo-thumbnails__thumbs input[type="radio"]'));

  const demoThumbnails = new MerryGo({
    gallery: document.querySelector('.demo-thumbnails__main'),
    galleryInner: document.querySelector('.demo-thumbnails__main-inner'),
    thumbs: thumbInputs,
    prevBtn: document.querySelector('.demo-thumbnails .demo__arrow--prev'),
    nextBtn: document.querySelector('.demo-thumbnails .demo__arrow--next'),
    gap: 5,
  });
});

// Installation tabs functionality
document.querySelectorAll('.get-started__tab').forEach(tab => {
  tab.addEventListener('click', function() {
    const targetInstall = this.dataset.install;
    
    // Remove active from all tabs
    document.querySelectorAll('.get-started__tab').forEach(t => {
      t.classList.remove('get-started__tab--active');
    });
    
    // Add active to clicked tab
    this.classList.add('get-started__tab--active');
    
    // Hide all install contents
    document.querySelectorAll('.get-started__install-content').forEach(content => {
      content.classList.remove('get-started__install-content--active');
    });
    
    // Show target content
    document.querySelector(`[data-install-content="${targetInstall}"]`).classList.add('get-started__install-content--active');
  });
});

// Copy installation code
function copyInstallCode(button) {
  const codeBlock = button.previousElementSibling;
  const code = codeBlock.textContent;
  
  navigator.clipboard.writeText(code).then(() => {
    const originalText = button.textContent;
    button.textContent = 'Copied!';
    
    setTimeout(() => {
      button.textContent = originalText;
    }, 2000);
  });
}