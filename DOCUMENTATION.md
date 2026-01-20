# 🎠 MerryGo - Complete Documentation

## Introduction

**MerryGo** is a highly customizable JavaScript carousel that supports multiple slides, drag & swipe, autoplay, navigation arrows, pagination, and responsive breakpoints.

### Key Features

✅ Infinite loop or limited navigation  
✅ Drag & swipe (mouse and touch)  
✅ Configurable autoplay  
✅ Arrow and pagination navigation  
✅ Responsive breakpoints  
✅ Horizontal or vertical orientation  
✅ Multiple visible slides  
✅ Automatic cloning for infinite loop  

---

## Table of Contents

- [Installation](#installation)
- [HTML Structure](#html-structure)
- [Initialization](#initialization)
- [Configuration Options](#configuration-options)
- [Responsive Breakpoints](#responsive-breakpoints)
- [CSS Styling](#css-styling)
- [Public Methods](#public-methods)
- [Practical Examples](#practical-examples)
- [Best Practices](#best-practices)

---

## Installation

### Via CDN
```html
<script src="https://cdn.jsdelivr.net/npm/merrygo-carousel@1.0.5/dist/merrygo.js"></script>
```

### Via NPM
```bash
npm install merrygo-carousel
```
```javascript
import MerryGo from 'merrygo-carousel';
```
---

## HTML Structure

### Minimum Structure
```html
<div class="carousel">
  <div class="carousel__inner">
    <div class="carousel__slide">Slide 1</div>
    <div class="carousel__slide">Slide 2</div>
    <div class="carousel__slide">Slide 3</div>
  </div>
</div>
```

### Complete Structure (with navigation and pagination)
```html
<div class="carousel-container">
  <!-- Gallery -->
  <div class="carousel">
    <div class="carousel__inner">
      <div class="carousel__slide">Slide 1</div>
      <div class="carousel__slide">Slide 2</div>
      <div class="carousel__slide">Slide 3</div>
    </div>
  </div>
  
  <!-- Navigation arrows -->
  <button class="carousel__arrow carousel__arrow--prev">←</button>
  <button class="carousel__arrow carousel__arrow--next">→</button>
  
  <!-- Pagination -->
  <div class="carousel__pagination"></div>
</div>
```

---

## Initialization

### Basic Initialization
```javascript
const carousel = new MerryGo({
  gallery: document.querySelector('.carousel'),
  galleryInner: document.querySelector('.carousel__inner')
});
```

### Complete Initialization
```javascript
const carousel = new MerryGo({
  gallery: document.querySelector('.carousel'),
  galleryInner: document.querySelector('.carousel__inner'),
  prevBtn: document.querySelector('.carousel__arrow--prev'),
  nextBtn: document.querySelector('.carousel__arrow--next'),
  pagination: document.querySelector('.carousel__pagination'),
  gap: 20,
  slidesVisible: 1,
  slidesToScroll: 1,
  infinityLoop: true,
  autoplay: 5000,
  enableDrag: true,
  orientation: 'horizontal'
});

// ⚠️ IMPORTANT: Save reference for destruction in PWA/SPA
window.activeCarousels = window.activeCarousels || [];
window.activeCarousels.push(carousel);
```

---

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `gallery` | Element | **required** | Main carousel container |
| `galleryInner` | Element | **required** | Slides container |
| `prevBtn` | Element | `null` | Previous button |
| `nextBtn` | Element | `null` | Next button |
| `pagination` | Element | `null` | Pagination container |
| `thumbs` | Array | `[]` | Array of radio inputs for thumbnails |
| `gap` | Number | `0` | Space between slides (px) |
| `slidesVisible` | Number | `1` | Number of visible slides |
| `slidesToScroll` | Number | `1` | Number of slides to scroll |
| `infinityLoop` | Boolean | `true` | Enable infinite loop |
| `autoplay` | Number/Boolean | `false` | Autoplay interval (ms) |
| `enableDrag` | Boolean | `true` | Enable drag/swipe |
| `orientation` | String | `'horizontal'` | `'horizontal'` or `'vertical'` |
| `breakpoints` | Object | `null` | Responsive configuration |

---

## Responsive Breakpoints

Breakpoints allow you to adjust carousel behavior at different screen sizes.

### Structure
```javascript
breakpoints: {
  [minWidth]: {
    slidesVisible: Number,
    slidesToScroll: Number,
    gap: Number,
    infinityLoop: Boolean,
    autoplay: Number/Boolean
  }
}
```

### Practical Example
```javascript
const carousel = new MerryGo({
  gallery: document.querySelector('.carousel'),
  galleryInner: document.querySelector('.carousel__inner'),
  breakpoints: {
    0: { 
      slidesVisible: 1, 
      gap: 0,
      infinityLoop: true 
    },
    561: { 
      slidesVisible: 2, 
      gap: 15 
    },
    769: { 
      slidesVisible: 3, 
      gap: 15 
    },
    1025: { 
      slidesVisible: 4, 
      gap: 30,
      infinityLoop: true 
    }
  }
});
```

**How it works:**
- The carousel applies the configuration from the closest breakpoint ≤ current width
- Example: at 800px width, applies settings from `769`
- At 400px, applies settings from `0`

---

## CSS Styling

### Required Base CSS
```css
/* Main container */
.carousel {
  width: 100%;
  overflow: hidden;
  user-select: none;
}

/* Slides container */
.carousel__inner {
  display: flex;
  gap: 30px; /* Must match JavaScript gap */
  transition: transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  will-change: transform;
}

/* Individual slides */
.carousel__slide {
  flex-shrink: 0;
  box-sizing: border-box;
  /* Width is calculated dynamically by JS */
}
```

### Slide Width Calculation

**Why calculate width?**

The carousel uses `display: flex` and controls slide position via `transform`. For this to work, each slide needs a fixed width defined in CSS. This width must account for how many slides are visible at once and the gap between them.

**The Formula:**
```
slide width = (100% - (gap × (slidesVisible - 1))) / slidesVisible
```

**Practical example:** For **4 visible slides** with **30px gap**:

- Total gaps = 30px × (4 - 1) = 90px
- Available space for slides = 100% - 90px
- Width of each slide = (100% - 90px) / 4
```css
.carousel__slide {
  width: calc((100% - 90px) / 4);
}
```

### Calculation Examples

| Visible Slides | Gap | CSS Formula |
|----------------|-----|-------------|
| 1 | 0px | `width: 100%` |
| 2 | 15px | `width: calc((100% - 15px) / 2)` |
| 3 | 15px | `width: calc((100% - 30px) / 3)` |
| 4 | 30px | `width: calc((100% - 90px) / 4)` |
| 6 | 16px | `width: calc((100% - 80px) / 6)` |

### Complete Example with Navigation
```css
.carousel-container {
  position: relative;
  padding: 40px 0;
}

.carousel {
  width: 100%;
  overflow: hidden;
  user-select: none;
}

.carousel__inner {
  display: flex;
  gap: 30px;
  transition: transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  will-change: transform;
}

.carousel__slide {
  flex-shrink: 0;
  width: calc((100% - 90px) / 4);
  box-sizing: border-box;
}

/* Navigation arrows */
.carousel__arrow {
  width: 50px;
  height: 50px;
  border-radius: 4px;
  background-color: #fff;
  border: 1px solid #e0e0e0;
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10;
  transition: opacity 0.3s ease;
}

.carousel__arrow--prev {
  left: -56px;
}

.carousel__arrow--next {
  right: -56px;
}

.carousel__arrow:hover {
  background-color: #f5f5f5;
}

/* Pagination */
.carousel__pagination {
  display: flex;
  gap: 8px;
  justify-content: center;
  margin-top: 24px;
}

.merrygo-bullet {
  width: 16px;
  height: 16px;
  border: 1px solid #e0e0e0;
  border-radius: 50%;
  background-color: #fff;
  cursor: pointer;
  transition: all 0.3s ease;
}

.merrygo-bullet-active {
  background-color: #007bff;
  border-color: #007bff;
}

/* Responsive */
@media (max-width: 1024px) {
  .carousel__inner {
    gap: 15px;
  }
  
  .carousel__slide {
    width: calc((100% - 30px) / 3);
  }
  
  .carousel__arrow {
    display: none;
  }
}

@media (max-width: 768px) {
  .carousel__slide {
    width: calc((100% - 15px) / 2);
  }
}

@media (max-width: 560px) {
  .carousel__inner {
    gap: 0;
  }
  
  .carousel__slide {
    width: 100%;
  }
}
```

---

## Public Methods

### `goToSlide(index)`
Navigate to a specific slide.
```javascript
carousel.goToSlide(2); // Go to the third slide (index 2)
```

### `nextSlide()`
Advance to the next slide.
```javascript
carousel.nextSlide();
```

### `prevSlide()`
Go back to the previous slide.
```javascript
carousel.prevSlide();
```

### `refresh()`
Reinitialize the carousel (useful after DOM changes).
```javascript
carousel.refresh();
```

### `destroy()`
Remove all event listeners and clean up the carousel.
```javascript
carousel.destroy();
```

### `startAutoplay()` / `stopAutoplay()`
Manually control autoplay.
```javascript
carousel.startAutoplay();
carousel.stopAutoplay();
```

---

## Practical Examples

### 1. Simple Banner Carousel
```html
<div class="main-banner">
  <div class="main-banner__inner">
    <div class="main-banner__slide">
      <img src="banner1.jpg" alt="Banner 1">
    </div>
    <div class="main-banner__slide">
      <img src="banner2.jpg" alt="Banner 2">
    </div>
    <div class="main-banner__slide">
      <img src="banner3.jpg" alt="Banner 3">
    </div>
  </div>
</div>

<button class="main-banner__prev">←</button>
<button class="main-banner__next">→</button>
```
```javascript
const bannerCarousel = new MerryGo({
  gallery: document.querySelector('.main-banner'),
  galleryInner: document.querySelector('.main-banner__inner'),
  prevBtn: document.querySelector('.main-banner__prev'),
  nextBtn: document.querySelector('.main-banner__next'),
  gap: 0,
  autoplay: 7000,
  infinityLoop: true
});

window.activeCarousels = window.activeCarousels || [];
window.activeCarousels.push(bannerCarousel);
```
```css
.main-banner {
  width: 100%;
  overflow: hidden;
}

.main-banner__inner {
  display: flex;
  gap: 0;
  transition: transform 0.4s ease;
}

.main-banner__slide {
  flex-shrink: 0;
  width: 100%;
}

.main-banner__slide img {
  width: 100%;
  height: auto;
  display: block;
}

.main-banner__arrow {
    background-color: #fff;
    width: 44px;
    height: 44px;
    border-radius: 800px;
    border: 1px solid #E6E6E6;
    box-shadow: 0px 1px 8px 0px #0000001F;
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
}

.main-banner__arrow svg {
    width: 16px;
    height: 16px;
}

.main-banner__arrow--prev {
    left: 15px;
} 

.main-banner__arrow--next {
    right: 15px;
}
```

### 2. Product Gallery (4 visible)
```html
<div class="products-carousel">
  <div class="products-carousel__inner">
    <div class="products-carousel__slide">Product 1</div>
    <div class="products-carousel__slide">Product 2</div>
    <div class="products-carousel__slide">Product 3</div>
    <div class="products-carousel__slide">Product 4</div>
    <div class="products-carousel__slide">Product 5</div>
    <div class="products-carousel__slide">Product 6</div>
  </div>
</div>

<button class="products-carousel__prev">←</button>
<button class="products-carousel__next">→</button>
<div class="products-carousel__pagination"></div>
```
```javascript
const productsCarousel = new MerryGo({
  gallery: document.querySelector('.products-carousel'),
  galleryInner: document.querySelector('.products-carousel__inner'),
  prevBtn: document.querySelector('.products-carousel__prev'),
  nextBtn: document.querySelector('.products-carousel__next'),
  pagination: document.querySelector('.products-carousel__pagination'),
  gap: 20,
  slidesVisible: 4,
  slidesToScroll: 4,
  infinityLoop: false,
  breakpoints: {
    0: { slidesVisible: 1, gap: 0 },
    561: { slidesVisible: 2, gap: 15 },
    769: { slidesVisible: 3, gap: 15 },
    1025: { slidesVisible: 4, gap: 20 }
  }
});

window.activeCarousels = window.activeCarousels || [];
window.activeCarousels.push(productsCarousel);
```
```css
.products-carousel {
  overflow: hidden;
}

.products-carousel__inner {
  display: flex;
  gap: 20px;
  transition: transform 0.4s ease;
}

.products-carousel__slide {
  width: calc((100% - 60px) / 4);
  flex-shrink: 0;
  box-sizing: border-box;
}

.products-carousel__arrow {
    background-color: #fff;
    width: 44px;
    height: 44px;
    border-radius: 800px;
    border: 1px solid #E6E6E6;
    box-shadow: 0px 1px 8px 0px #0000001F;
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
}

.products-carousel__arrow svg {
    width: 16px;
    height: 16px;
}

.products-carousel__arrow--prev {
    left: 15px;
} 

.products-carousel__arrow--next {
    right: 15px;
} 

.products-carousel__pagination {
  width: max-content;
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
  gap: 8px;
  height: 20px;
  margin-inline: auto;
}

.products-carousel__pagination .merrygo-bullet {
  width: 16px;
  min-width: 16px;
  height: 16px;
  border: 1px solid #e6e6e6;
  border-radius: 100%;
  transition: all .3s ease;
  background-color: #ffffff;
  cursor: pointer;
}

.products-carousel__pagination .merrygo-bullet-active {
  background-color: #000000;
  border-color: #000000;
}

@media (max-width: 1024px) {
  .products-carousel__inner { 
    gap: 15px; 
  }

  .products-carousel__slide { 
    width: calc((100% - 30px) / 3); 
  }
}

@media (max-width: 768px) {
  .products-carousel__slide { 
    width: calc((100% - 15px) / 2); 
  } 
}

@media (max-width: 560px) {
  .products-carousel__inner { 
    gap: 0; 
  }

  .products-carousel__slide { 
    width: 100%; 
  }
}
```

### 3. Product Gallery with Thumbnails
```html
<div class="product-gallery">
  <!-- Thumbnails -->
  <div class="product-gallery__thumbnails">
    <input type="radio" name="thumb" id="thumb-0" checked>
    <label class="product-gallery__thumbnail" for="thumb-0">
      <img src="product-1.jpg" alt="Product 1">
    </label>

    <input type="radio" name="thumb" id="thumb-1">
    <label class="product-gallery__thumbnail" for="thumb-1">
      <img src="product-2.jpg" alt="Product 2">
    </label>

    <input type="radio" name="thumb" id="thumb-2">
    <label class="product-gallery__thumbnail" for="thumb-2">
      <img src="product-3.jpg" alt="Product 3">
    </label>
  </div>

  <!-- Main gallery -->
  <div class="product-gallery__main">
    <div class="product-gallery__inner">
      <img src="product-1.jpg" alt="Product 1">
      <img src="product-2.jpg" alt="Product 2">
      <img src="product-3.jpg" alt="Product 3">
    </div>
  </div>
</div>
```
```javascript
const thumbInputs = Array.from(
  document.querySelectorAll('.product-gallery__thumbnails input[type="radio"]')
);

const productGallery = new MerryGo({
  gallery: document.querySelector('.product-gallery__main'),
  galleryInner: document.querySelector('.product-gallery__inner'),
  thumbs: thumbInputs,
  gap: 0,
  infinityLoop: true
});

window.activeCarousels = window.activeCarousels || [];
window.activeCarousels.push(productGallery);
```

### 4. Multiple Carousels on Same Page
```javascript
window.activeCarousels = window.activeCarousels || [];

const showcases = document.querySelectorAll('[data-carousel]');

showcases.forEach(showcase => {
  const carousel = new MerryGo({
    gallery: showcase.querySelector('.carousel'),
    galleryInner: showcase.querySelector('.carousel__inner'),
    prevBtn: showcase.querySelector('.carousel__prev'),
    nextBtn: showcase.querySelector('.carousel__next'),
    pagination: showcase.querySelector('.carousel__pagination'),
    breakpoints: {
      0: { slidesVisible: 1, gap: 0 },
      561: { slidesVisible: 2, gap: 15 },
      769: { slidesVisible: 3, gap: 15 },
      1025: { slidesVisible: 4, gap: 30 }
    }
  });
  
  window.activeCarousels.push(carousel);
});
```

---

## Best Practices

### 1. CSS-JS Synchronization

The CSS `gap` must be **identical** to the JavaScript `gap`:
```javascript
// JavaScript
gap: 30
```
```css
/* CSS */
.carousel__inner {
  gap: 30px;
}
```

### 2. Width Calculation

Use the correct formula for each breakpoint:
```
width = (100% - (gap × (slidesVisible - 1))) / slidesVisible
```

### 3. Instance Management

Save carousel references to destroy them when needed:
```javascript
window.activeCarousels = window.activeCarousels || [];
window.activeCarousels.push(carousel);

// Destroy all carousels
window.activeCarousels.forEach(c => c.destroy());
window.activeCarousels = [];
```

### ⚠️ CRITICAL: Destruction in PWA/SPA

**PWA or Single Page Applications require special attention!**

When users navigate between pages without reloading the browser, previous carousels remain in memory. This causes:

❌ Memory leaks  
❌ Duplicate event listeners  
❌ Unexpected carousel behavior  
❌ Progressive performance degradation  

**Mandatory solution:** Destroy all carousels before navigating to a new page.

#### Implementation Example:
```javascript
window.activeCarousels = window.activeCarousels || [];

window.onNavigate = (oldHref, newHref, state) => {
  const oldPath = oldHref.split('?')[0];
  const newPath = newHref.split('?')[0];

  // If changing pages (not just filters/query params)
  if (oldPath !== newPath) {
    if (state === 'start') {
      // CRITICAL: Destroy all carousels before navigating
      if (window.activeCarousels && window.activeCarousels.length > 0) {
        window.activeCarousels.forEach(carousel => {
          if (carousel && typeof carousel.destroy === 'function') {
            carousel.destroy();
          }
        });
        window.activeCarousels = [];
      }
    }
  }
}
```

#### Destruction Checklist:

✅ Always destroy before navigating  
✅ Check if destroy method exists (`typeof carousel.destroy === 'function'`)  
✅ Clear array after destruction (`window.activeCarousels = []`)  
✅ Do this in `state === 'start'` event (before loading new page)  

**Note:** If you don't destroy carousels in PWA, after 10-15 navigations users may experience crashes, high memory consumption, and erratic carousel behavior.

### 4. Performance

- Use `will-change: transform` on the slides container
- Use `loading="lazy"` on images outside the first slide
- Avoid transitions on heavy elements

### 5. Accessibility

- Add `aria-label` to navigation buttons
- Use descriptive `alt` text on images
- Ensure adequate contrast on pagination bullets

---

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- iOS Safari 10+
- Android Chrome

---

## Troubleshooting

### Slides not displaying correctly

Make sure:
- CSS `gap` matches JavaScript `gap`
- Slide width is calculated correctly with `calc()`
- Container has `overflow: hidden`

### Drag not working

Check that:
- `enableDrag` is not set to `false`
- Container doesn't have conflicting event listeners
- Touch events aren't being prevented elsewhere

### Loop not working

Verify:
- `infinityLoop` is set to `true`
- You have more than 1 slide
- Clones are being created (check DOM inspector)

---

## License

MIT License - see [LICENSE](LICENSE) file for details.

---

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

**Made with ❤️ inspired by the joy of merry-go-rounds 🎠**