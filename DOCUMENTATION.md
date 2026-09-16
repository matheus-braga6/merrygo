# 🎠 MerryGo - Complete Documentation

## Introduction

**MerryGo** is a highly customizable JavaScript carousel that supports multiple slides, drag & swipe, autoplay, navigation arrows, pagination and responsive breakpoints.

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
- [Styling](#styling)
- [Public Methods](#public-methods)
- [Practical Examples](#practical-examples)
- [Best Practices](#best-practices)
- [Migrating from 1.x](#migrating-from-1x)
- [Browser Support](#browser-support)
- [Troubleshooting](#troubleshooting)

---

## Installation

### Via CDN
```html
<script src="https://cdn.jsdelivr.net/npm/merrygo-carousel@2.0.0/dist/merrygo.js"></script>
```

### Via NPM
```bash
npm install merrygo-carousel
```
```javascript
import MerryGo from 'merrygo-carousel';        // ES modules
const MerryGo = require('merrygo-carousel');   // CommonJS
```

---

## HTML Structure

MerryGo needs two elements: the **gallery** (the viewport that clips the content) and the **inner** (the track). Every direct child of the inner is a slide.

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

### Recommended Structure (with navigation and pagination)
```html
<div class="carousel">
  <div class="carousel__inner">
    <div class="carousel__slide">Slide 1</div>
    <div class="carousel__slide">Slide 2</div>
    <div class="carousel__slide">Slide 3</div>
  </div>

  <button class="carousel__arrow--prev" type="button" aria-label="Previous">‹</button>
  <button class="carousel__arrow--next" type="button" aria-label="Next">›</button>
</div>

<div class="carousel__pagination"></div>
```

Class names are yours to choose: MerryGo finds the elements through the options and adds its own `merrygo-*` classes on top (see [Styling](#styling)).

**Where can the arrows go?** Anywhere. They are absolutely positioned, so they anchor to their nearest positioned ancestor. Inside the gallery, that is the gallery itself. If you place them in another wrapper that is `position: static`, MerryGo adds the class `merrygo-wrapper` (`position: relative`) to that wrapper.

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
  disableOnInteraction: true,
  enableDrag: true,
  orientation: 'horizontal',
  injectStyles: true
});

// ⚠️ IMPORTANT: Save reference for destruction in PWA/SPA
window.activeCarousels = window.activeCarousels || [];
window.activeCarousels.push(carousel);
```

---

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `gallery` | Element | **required** | Viewport that clips the slides. Receives `merrygo-gallery`. |
| `galleryInner` | Element | **required** | Track whose direct children are the slides. Receives `merrygo-inner`. |
| `prevBtn` | Element | `null` | Previous button. Receives `merrygo-arrow merrygo-arrow--left`. |
| `nextBtn` | Element | `null` | Next button. Receives `merrygo-arrow merrygo-arrow--right`. |
| `pagination` | Element | `null` | Container for the bullets. Receives `merrygo-pagination`. |
| `thumbs` | Array | `[]` | Radio inputs kept in sync with the slides. |
| `gap` | Number | `0` | Space between slides in px. Applied by the injected CSS through `--merrygo-gap`. |
| `slidesVisible` | Number | `1` | Slides visible at once. |
| `slidesToScroll` | Number | `1` | Slides moved by the arrows and by autoplay (integer ≥ 1). |
| `infinityLoop` | Boolean | `true` | Infinite loop with cloned slides. Turned off automatically when there are not more slides than `slidesVisible`. |
| `autoplay` | Number/Boolean | `false` | Autoplay interval in ms. |
| `disableOnInteraction` | Boolean | `false` | Pause autoplay while the mouse is over the carousel. |
| `enableDrag` | Boolean | `true` | Mouse drag and touch swipe. |
| `orientation` | String | `'horizontal'` | `'horizontal'` or `'vertical'`. |
| `breakpoints` | Object | `null` | Responsive configuration (see below). |
| `injectStyles` | Boolean | `true` | Inject the base stylesheet. Set to `false` to write all the CSS yourself. |

---

## Responsive Breakpoints

Breakpoints adjust the carousel at different screen widths. Because slide widths come from CSS custom properties, **you do not need matching media queries in your CSS**.

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
  gap: 16,
  breakpoints: {
    0: { slidesVisible: 1.5, gap: 12 },
    561: { slidesVisible: 2.5, gap: 16 },
    769: { slidesVisible: 3, gap: 16 },
    1025: { slidesVisible: 4, gap: 24, infinityLoop: false }
  }
});
```

**How it works:**
- The carousel applies the configuration of the closest breakpoint ≤ current width (at 800px, `769`; at 400px, `0`).
- Every time the active breakpoint changes, the options go back to the constructor values and the breakpoint values are applied on top. `infinityLoop: false` in `1025` does not leak into `769`.
- Breakpoints are re-evaluated on window resize (width changes bigger than 50px).

---

## Styling

### What MerryGo injects

On the first instance, MerryGo adds a `<style id="merrygo-styles">` tag as the **first node of `<head>`** and gives your elements these classes:

| Element | Class | Purpose |
|---|---|---|
| gallery | `merrygo-gallery` (+ `merrygo-gallery--vertical`) | `position: relative`, `overflow: hidden`, `user-select: none` |
| inner | `merrygo-inner` | flex track, `gap` from `--merrygo-gap`, transition |
| slides (and clones) | `merrygo-slide` | `flex-shrink: 0`, width (or height) from the custom properties |
| prevBtn / nextBtn | `merrygo-arrow` + `merrygo-arrow--left` / `merrygo-arrow--right` (+ `merrygo-arrow--disabled`) | round white button, absolutely positioned at the edges |
| arrows' parent (only if it is `position: static`) | `merrygo-wrapper` | `position: relative` |
| pagination | `merrygo-pagination` | centered flex row |
| bullets (created by MerryGo) | `merrygo-bullet`, `merrygo-bullet-active` | small round buttons |
| thumbs (radio inputs) | `merrygo-thumb-input` | visually hidden, still keyboard accessible |
| thumb labels (found through `for` or as the input's parent) | `merrygo-thumb`, `merrygo-thumb--active` | 80px block with a 3px border, black when active |
| image inside a thumb label | `merrygo-thumb-img` | `display: block`, full width of the label |

Because the stylesheet comes first in the cascade and uses single-class selectors without `!important`, **any rule you write with the same or higher specificity wins**. You never need to fight the defaults.

### CSS custom properties

MerryGo writes these properties on the gallery element and the injected CSS uses them to size the slides. They are updated on init, on `refresh()` and when a breakpoint changes.

| Property | Value |
|---|---|
| `--merrygo-gap` | `gap` in px, e.g. `16px` |
| `--merrygo-slides-visible` | `slidesVisible`, e.g. `1.5` |
| `--merrygo-gaps-visible` | `ceil(slidesVisible) - 1` |

You can use them in your own CSS, for example `padding-inline: var(--merrygo-gap)`.

### Customizing arrows

Give the buttons your own classes and override what you need. The defaults are 44px round white buttons at `left: 16px` / `right: 16px`, vertically centered.

```css
.carousel__arrow {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: #222;
  color: #fff;
  border: 0;
}

.carousel__arrow--prev { left: 8px; }
.carousel__arrow--next { right: 8px; }

/* Disabled state (only when infinityLoop is false) */
.carousel__arrow.merrygo-arrow--disabled { opacity: 0.3; }
```

Arrows keep the inline `opacity: 0.5; pointer-events: none` of 1.x when disabled, plus the `merrygo-arrow--disabled` class and `aria-disabled="true"`.

### Customizing pagination

```css
.carousel__pagination {
  justify-content: flex-start;
  gap: 6px;
  margin-top: 12px;
}

.carousel__pagination .merrygo-bullet {
  width: 24px;
  height: 4px;
  border-radius: 2px;
  background: #ddd;
}

.carousel__pagination .merrygo-bullet-active {
  background: #000000;
}
```

### Customizing thumbnails

The radio inputs passed in `thumbs` are hidden, their labels get a default look (80px wide, 3px border, black when active) and the image inside each label fills its width. Override what you need:

```css
.product-gallery__thumbnail {
  width: 60px;
  border-radius: 8px;
}

.product-gallery__thumbnail.merrygo-thumb--active {
  border-color: #000000;
}
```

### Vertical orientation

With `orientation: 'vertical'` the gallery receives `merrygo-gallery--vertical`, the track becomes a column and the slides get a height instead of a width. **The gallery needs a height** defined by you:

```css
.carousel { height: 400px; }
```

### Disabling style injection

```javascript
new MerryGo({ ..., injectStyles: false });
```

The `merrygo-*` classes are still added, but no stylesheet is injected. Use the reference below (or your 1.x CSS) to provide the structure yourself: `overflow: hidden` on the gallery, `display: flex; gap` on the inner and `flex-shrink: 0` plus a width on the slides.

### The injected CSS (reference)

```css
.merrygo-gallery {
  position: relative;
  width: 100%;
  overflow: hidden;
  -webkit-user-select: none;
  user-select: none;
}
.merrygo-inner {
  display: flex;
  flex-direction: row;
  gap: var(--merrygo-gap, 0px);
  transition: transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  will-change: transform;
}
.merrygo-slide {
  flex-shrink: 0;
  box-sizing: border-box;
  width: calc((100% - var(--merrygo-gap, 0px) * var(--merrygo-gaps-visible, 0)) / var(--merrygo-slides-visible, 1));
}
.merrygo-gallery--vertical .merrygo-inner {
  flex-direction: column;
  height: 100%;
}
.merrygo-gallery--vertical .merrygo-slide {
  width: 100%;
  height: calc((100% - var(--merrygo-gap, 0px) * var(--merrygo-gaps-visible, 0)) / var(--merrygo-slides-visible, 1));
}
.merrygo-wrapper {
  position: relative;
}
.merrygo-arrow {
  position: absolute;
  top: 50%;
  z-index: 2;
  width: 44px;
  height: 44px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #e6e6e6;
  border-radius: 50%;
  background: #fff;
  color: #000;
  cursor: pointer;
  transform: translateY(-50%);
  transition: opacity 0.3s ease;
}
.merrygo-arrow svg {
  width: 16px;
  height: 16px;
}
.merrygo-arrow--left {
  left: 16px;
}
.merrygo-arrow--right {
  right: 16px;
}
.merrygo-arrow--disabled {
  opacity: 0.5;
  pointer-events: none;
}
.merrygo-pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 16px;
}
.merrygo-bullet {
  width: 10px;
  height: 10px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: #ced1d3;
  cursor: pointer;
  transition: background-color 0.3s ease;
}
.merrygo-bullet-active {
  background: #000;
}
.merrygo-thumb-input {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
  border: 0;
}
.merrygo-thumb {
  display: inline-block;
  vertical-align: top;
  box-sizing: border-box;
  width: 80px;
  border: 3px solid transparent;
  overflow: hidden;
  cursor: pointer;
  transition: border-color 0.3s ease;
}
.merrygo-thumb-img {
  display: block;
  width: 100%;
  height: auto;
}
.merrygo-thumb--active {
  border-color: #000;
}
```

---

## Public Methods

### `goToSlide(index)`
Navigate to a specific slide (0-based). Without loop the index is limited to the valid range.
```javascript
carousel.goToSlide(2); // Go to the third slide
```

### `nextSlide()` / `prevSlide()`
Advance to the next slide.
```javascript
carousel.nextSlide();
carousel.prevSlide();
```

### `goToPage(page)`
Navigate to a pagination page (0-based).
```javascript
carousel.goToPage(1);
```

### `refresh()`
Reinitialize the carousel. It re-reads the slides from the DOM, so call it after adding or removing slides.
```javascript
carousel.refresh();
```

### `destroy()`
Remove all event listeners, clones and timers. The `merrygo-*` classes stay on the elements so the layout does not collapse.
```javascript
carousel.destroy();
```

### `startAutoplay()` / `stopAutoplay()`
Manually control autoplay (requires the `autoplay` option).
```javascript
carousel.startAutoplay();
carousel.stopAutoplay();
```

### Static members
```javascript
MerryGo.version;        // '2.0.0'
MerryGo.injectStyles(); // Inject the base stylesheet manually (idempotent)
```

---

## Practical Examples

### 1. Simple Banner Carousel
```html
<div class="main-banner">
  <div class="main-banner__inner">
    <div class="main-banner__slide"><img src="banner1.jpg" alt="Banner 1"></div>
    <div class="main-banner__slide"><img src="banner2.jpg" alt="Banner 2"></div>
    <div class="main-banner__slide"><img src="banner3.jpg" alt="Banner 3"></div>
  </div>
  <button class="main-banner__prev" type="button" aria-label="Previous">‹</button>
  <button class="main-banner__next" type="button" aria-label="Next">›</button>
</div>
```
```javascript
const bannerCarousel = new MerryGo({
  gallery: document.querySelector('.main-banner'),
  galleryInner: document.querySelector('.main-banner__inner'),
  prevBtn: document.querySelector('.main-banner__prev'),
  nextBtn: document.querySelector('.main-banner__next'),
  gap: 0,
  autoplay: 7000,
  disableOnInteraction: true,
  infinityLoop: true
});

window.activeCarousels = window.activeCarousels || [];
window.activeCarousels.push(bannerCarousel);
```
```css
/* Only the content needs CSS */
.main-banner__slide img {
  width: 100%;
  height: auto;
  display: block;
}
```

### 2. Product Gallery (fractional on mobile, 4 visible on desktop)
```html
<div class="products">
  <div class="products__inner">
    <div class="products__slide"><article class="product-card">Product 1</article></div>
    <div class="products__slide"><article class="product-card">Product 2</article></div>
    <div class="products__slide"><article class="product-card">Product 3</article></div>
    <div class="products__slide"><article class="product-card">Product 4</article></div>
    <div class="products__slide"><article class="product-card">Product 5</article></div>
    <div class="products__slide"><article class="product-card">Product 6</article></div>
  </div>
  <button class="products__arrow products__arrow--prev" type="button" aria-label="Previous">‹</button>
  <button class="products__arrow products__arrow--next" type="button" aria-label="Next">›</button>
</div>
<div class="products__pagination"></div>
```
```javascript
const productsCarousel = new MerryGo({
  gallery: document.querySelector('.products'),
  galleryInner: document.querySelector('.products__inner'),
  prevBtn: document.querySelector('.products__arrow--prev'),
  nextBtn: document.querySelector('.products__arrow--next'),
  pagination: document.querySelector('.products__pagination'),
  infinityLoop: false,
  breakpoints: {
    0: { slidesVisible: 1.5, gap: 12 },
    561: { slidesVisible: 2.5, gap: 16 },
    769: { slidesVisible: 3, gap: 16 },
    1025: { slidesVisible: 4, gap: 24, slidesToScroll: 4 }
  }
});

window.activeCarousels = window.activeCarousels || [];
window.activeCarousels.push(productsCarousel);
```
```css
/* Card look */
.product-card {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
}

/* Custom arrows: same specificity as the defaults and loaded later, so they win */
.products__arrow {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: #222;
  color: #fff;
  border: 0;
}

.products__arrow--prev { left: 8px; }
.products__arrow--next { right: 8px; }

/* Bars instead of dots */
.products__pagination .merrygo-bullet {
  width: 24px;
  height: 4px;
  border-radius: 2px;
}

.products__pagination .merrygo-bullet-active {
  background: #000000;
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
      0: { slidesVisible: 1.5, gap: 12 },
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

### 1. Instance Management

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

### 2. Overriding Styles

- Use your own classes on arrows and pagination and write normal rules: they win over the injected defaults.
- Do not use `!important` and do not rely on `.merrygo-*` classes for your visual identity; those are structural.
- Do not set `width` on slides or `gap` on the inner unless you also set `injectStyles: false`; the injected CSS keeps them in sync with your options.

### 3. Performance

- Use `loading="lazy"` on images outside the first slide
- Avoid transitions on heavy elements inside slides
- Call `destroy()` when the carousel leaves the page

### 4. Accessibility

- Add `aria-label` to navigation buttons
- Use descriptive `alt` text on images
- Ensure adequate contrast on pagination bullets (they are `<button>` elements with `aria-label` and `aria-current`)

---

## Migrating from 1.x

The API did not change: every 1.x option and method keeps working. What changes is what MerryGo does for you.

### 1. Update the package
```html
<script src="https://cdn.jsdelivr.net/npm/merrygo-carousel@2.0.0/dist/merrygo.js"></script>
```

### 2. Delete the structural CSS (optional)
These rules from the 1.x documentation are now injected, so you can remove them together with the media queries that mirrored your breakpoints:
```css
.carousel        { overflow: hidden; user-select: none; }
.carousel__inner { display: flex; gap: 30px; transition: transform 0.4s; will-change: transform; }
.carousel__slide { flex-shrink: 0; width: calc((100% - 90px) / 4); }
```
Keeping them is harmless as long as they match your options: they simply win over the injected ones.

### 3. Check the arrows
Arrows now have a default look (44px round white buttons) and are `position: absolute`, anchored to their parent. Inside the gallery nothing else is needed. In another wrapper, the wrapper becomes `position: relative` (class `merrygo-wrapper`) if it was static. Your existing arrow CSS still wins over the defaults.

### 4. Behavior changes
- `slidesVisible` accepts decimals, also in `breakpoints`.
- Without loop, `nextSlide()`, `prevSlide()` and `goToSlide()` never leave blank space at the end: the index is limited to the last valid position and the last slide aligns with the end of the container.
- Breakpoints reset to the constructor values before applying the active breakpoint, so options from a previous breakpoint no longer leak.
- `refresh()` re-reads the slides from the DOM.
- `destroy()` removes the thumbnail listeners and cancels pending timers.
- Disabled arrows receive `merrygo-arrow--disabled` and `aria-disabled="true"` in addition to the 1.x inline styles.
- Thumbnail radios, their labels and the image inside each label receive `merrygo-thumb-input` / `merrygo-thumb` (+ `merrygo-thumb--active`) / `merrygo-thumb-img` with a default look.
- `MerryGo.version` is available.

### 5. Opt out
`injectStyles: false` restores the 1.x contract (you provide all the CSS). The classes are still added.

---

## Browser Support

- Chrome / Edge 80+
- Firefox 75+
- Safari 14.1+ (iOS 14.5+)
- Android Chrome

---

## Troubleshooting

### Slides are stacked or all visible at once

- The base stylesheet is missing: check that `injectStyles` is not `false` and that `#merrygo-styles` exists in `<head>`.
- Your own CSS overrides `width` on the slides or `display` on the inner. Remove those rules or make them match your options.

### My arrow / bullet styles are not applied

Your rule needs at least the specificity of one class (`.my-arrow`) and must be loaded normally (the injected stylesheet is the first node of `<head>`, so anything loaded after it wins on ties). Stylesheets inserted at the top of `<head>` by other scripts can come before it; increase the specificity in that case.

### Arrows appear far from the carousel

They anchor to the nearest positioned ancestor. Put them inside the gallery, or give their wrapper `position: relative` (MerryGo does that automatically when the wrapper is static).

### Drag not working

- `enableDrag` is not set to `false`
- Container doesn't have conflicting event listeners
- Touch events aren't being prevented elsewhere

### Loop not working

- `infinityLoop` is set to `true`
- Clones are being created (check for `.clone` elements in the DOM inspector)

### Blank space at the end with a fractional value

Only possible with `injectStyles: false` and a slide width in your CSS that does not match the formula above. With the injected CSS the last position is always aligned with the end of the content.

---

## License

MIT License - see [LICENSE](LICENSE) file for details.

---

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

**Made with ❤️ inspired by the joy of merry-go-rounds 🎠**
