class MerryGo {
    static version = '2.0.0';
    static STYLE_ID = 'merrygo-styles';
    static TRANSITION = 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    static TRANSITION_MS = 400;

    static STYLES = `/* MerryGo ${MerryGo.version} - base styles (injected once, first node of <head>) */
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
`;

    static injectStyles() {
        if (typeof document === 'undefined' || !document.head) return null;

        let style = document.getElementById(MerryGo.STYLE_ID);
        if (style) return style;

        style = document.createElement('style');
        style.id = MerryGo.STYLE_ID;
        style.setAttribute('data-merrygo-version', MerryGo.version);
        style.textContent = MerryGo.STYLES;
        document.head.insertBefore(style, document.head.firstChild);

        return style;
    }

    static sanitizeSlidesVisible(value) {
        const number = Number(value);
        return Number.isFinite(number) && number > 0 ? number : 1;
    }

    static sanitizeSlidesToScroll(value) {
        const number = Math.floor(Number(value));
        return Number.isFinite(number) && number >= 1 ? number : 1;
    }

    static sanitizeGap(value) {
        const number = Number(value);
        return Number.isFinite(number) && number >= 0 ? number : 0;
    }

    static ceil(value) {
        return Math.ceil(value - 1e-9);
    }

    constructor(options) {
        options = options || {};

        this.options = options;
        this.gallery = options.gallery;
        this.galleryInner = options.galleryInner;
        this.thumbs = options.thumbs || [];
        this.prevBtn = options.prevBtn || null;
        this.nextBtn = options.nextBtn || null;
        this.pagination = options.pagination || null;
        this.orientation = options.orientation === 'vertical' ? 'vertical' : 'horizontal';
        this.enableDrag = options.enableDrag !== false;
        this.disableOnInteraction = options.disableOnInteraction ?? false;
        this.shouldInjectStyles = options.injectStyles !== false;
        this.breakpoints = options.breakpoints || null;

        this.baseSettings = {
            gap: MerryGo.sanitizeGap(options.gap),
            slidesVisible: MerryGo.sanitizeSlidesVisible(options.slidesVisible),
            slidesToScroll: MerryGo.sanitizeSlidesToScroll(options.slidesToScroll),
            infinityLoop: options.infinityLoop ?? true,
            autoplay: options.autoplay ?? false
        };

        this.gap = this.baseSettings.gap;
        this.slidesVisible = this.baseSettings.slidesVisible;
        this.slidesToScroll = this.baseSettings.slidesToScroll;
        this.infinityLoop = this.baseSettings.infinityLoop;
        this.autoplay = this.baseSettings.autoplay;
        this.autoplayTimer = null;

        this.cachedDimensions = {
            containerSize: 0,
            innerSize: 0,
            slideSize: 0,
            timestamp: 0
        };

        if (!this.galleryInner || !this.gallery) {
            console.error('Gallery ou galleryInner não encontrados');
            return;
        }

        this.originalSlides = [];
        this.originalImages = [];
        this.totalImages = 0;

        this.currentIndex = 0;
        this.startPos = 0;
        this.endPos = 0;
        this.isDragging = false;
        this.startTranslate = 0;
        this.isTransitioning = false;
        this.rafId = null;
        this.startTime = 0;
        this.velocity = 0;
        this.isDragged = false;
        this.slideSize = 0;
        this.maxOffset = 0;
        this.isHovered = false;
        this.touchLocked = false;
        this.touchDirection = null;
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.hasClones = false;
        this.cloneCount = 0;
        this.destroyed = false;
        this.initTimer = null;
        this.transitionTimer = null;
        this.lastTransform = null;
        this.thumbHandlers = [];

        if (this.shouldInjectStyles) {
            MerryGo.injectStyles();
        }

        this.applyBreakpoints();
        this.init();
        this.setupEventListeners();
        this.setupResizeObserver();
    }

    getSlidesVisible() {
        return MerryGo.sanitizeSlidesVisible(this.slidesVisible);
    }

    getGap() {
        return MerryGo.sanitizeGap(this.gap);
    }

    getGapsVisible() {
        return Math.max(0, MerryGo.ceil(this.getSlidesVisible()) - 1);
    }

    getCloneCount() {
        const slidesToScroll = MerryGo.sanitizeSlidesToScroll(this.slidesToScroll);
        return Math.max(1, MerryGo.ceil(this.getSlidesVisible()) + slidesToScroll - 1);
    }

    getMaxIndex() {
        return Math.max(0, MerryGo.ceil(this.totalImages - this.getSlidesVisible()));
    }

    clampIndex(index) {
        return Math.max(0, Math.min(index, this.getMaxIndex()));
    }

    mod(index) {
        if (this.totalImages <= 0) return 0;
        return ((index % this.totalImages) + this.totalImages) % this.totalImages;
    }

    getThumbInputs() {
        return this.thumbs ? Array.from(this.thumbs) : [];
    }

    getThumbLabel(input) {
        if (!input) return null;

        if (input.labels && input.labels.length) {
            return input.labels[0];
        }

        const parentLabel = typeof input.closest === 'function' ? input.closest('label') : null;
        if (parentLabel) return parentLabel;

        const next = input.nextElementSibling;
        return next && next.tagName === 'LABEL' ? next : null;
    }

    setActiveThumb(index) {
        const inputs = this.getThumbInputs();
        if (!inputs.length) return;

        inputs.forEach((input, i) => {
            const active = i === index;

            if (active && !input.checked) {
                input.checked = true;
            }

            const label = this.getThumbLabel(input);
            if (label) {
                label.classList.toggle('merrygo-thumb--active', active);
            }
        });
    }

    readSlides() {
        this.originalSlides = Array.from(this.galleryInner.children).filter(child => !child.classList.contains('clone'));
        this.originalImages = Array.from(this.galleryInner.querySelectorAll('img:not(.clone)'));
        this.totalImages = this.originalSlides.length;
    }

    applyClasses() {
        this.gallery.classList.add('merrygo-gallery');
        this.gallery.classList.toggle('merrygo-gallery--vertical', this.orientation === 'vertical');
        this.galleryInner.classList.add('merrygo-inner');
        this.originalSlides.forEach(slide => slide.classList.add('merrygo-slide'));

        if (this.prevBtn) {
            this.prevBtn.classList.add('merrygo-arrow', 'merrygo-arrow--left');
        }
        if (this.nextBtn) {
            this.nextBtn.classList.add('merrygo-arrow', 'merrygo-arrow--right');
        }
        if (this.pagination) {
            this.pagination.classList.add('merrygo-pagination');
        }

        this.getThumbInputs().forEach(input => {
            input.classList.add('merrygo-thumb-input');

            const label = this.getThumbLabel(input);
            if (label) {
                label.classList.add('merrygo-thumb');

                const image = label.querySelector('img');
                if (image) {
                    image.classList.add('merrygo-thumb-img');
                }
            }
        });

        this.ensurePositionedParent(this.prevBtn);
        this.ensurePositionedParent(this.nextBtn);
    }

    ensurePositionedParent(element) {
        if (!element || !element.parentElement) return;
        if (typeof window === 'undefined' || typeof window.getComputedStyle !== 'function') return;

        const parent = element.parentElement;
        if (parent.classList.contains('merrygo-wrapper')) return;

        if (window.getComputedStyle(parent).position === 'static') {
            parent.classList.add('merrygo-wrapper');
        }
    }

    applyCssVars() {
        const vars = {
            '--merrygo-gap': `${this.getGap()}px`,
            '--merrygo-slides-visible': String(this.getSlidesVisible()),
            '--merrygo-gaps-visible': String(this.getGapsVisible())
        };

        Object.keys(vars).forEach(name => {
            if (this.gallery.style.getPropertyValue(name) !== vars[name]) {
                this.gallery.style.setProperty(name, vars[name]);
            }
        });
    }

    calculateDimensions() {
        const isHorizontal = this.orientation === 'horizontal';

        const containerRect = this.galleryInner.getBoundingClientRect();
        const containerSize = isHorizontal ? containerRect.width : containerRect.height;
        const innerSize = isHorizontal ? this.galleryInner.scrollWidth : this.galleryInner.scrollHeight;

        const gapValue = this.getGap();
        const slidesVisible = this.getSlidesVisible();
        const totalGaps = this.getGapsVisible() * gapValue;
        const slideSize = Math.max(0, (containerSize - totalGaps) / slidesVisible);

        const contentSize = this.totalImages * slideSize + Math.max(0, this.totalImages - 1) * gapValue;
        const maxOffset = Math.max(0, contentSize - containerSize);

        this.cachedDimensions = {
            containerSize,
            innerSize,
            slideSize,
            timestamp: Date.now()
        };

        this.slideSize = slideSize;
        this.maxOffset = maxOffset;

        this.innerMaxTranslate = 0;
        this.innerMinTranslate = containerSize - innerSize;

        return {
            slideSize,
            gapValue,
            maxOffset
        };
    }

    updateGallery(index, instant = false) {
        const isHorizontal = this.orientation === 'horizontal';

        if (this.originalSlides.length === 0) return false;

        const { slideSize, gapValue, maxOffset } = this.calculateDimensions();
        const step = slideSize + gapValue;

        const adjustedIndex = this.hasClones ? index + this.cloneCount : index;

        let offset = adjustedIndex * step;
        if (!this.infinityLoop) {
            offset = Math.min(Math.max(0, offset), maxOffset);
        }
        offset = Math.round(offset * 100) / 100;

        const transform = isHorizontal
            ? `translateX(${-offset}px)`
            : `translateY(${-offset}px)`;

        const changed = this.lastTransform !== transform;
        this.lastTransform = transform;

        requestAnimationFrame(() => {
            if (this.destroyed) return;
            this.galleryInner.style.transition = instant ? 'none' : MerryGo.TRANSITION;
            this.galleryInner.style.transform = transform;
        });

        clearTimeout(this.transitionTimer);
        if (!instant && changed && this.isTransitioning) {
            this.transitionTimer = setTimeout(() => this.handleTransitionEnd(), MerryGo.TRANSITION_MS + 100);
        }

        const realIndex = this.infinityLoop ? this.mod(index) : this.clampIndex(index);

        this.setActiveThumb(realIndex);

        this.updateArrowsState();
        this.updatePagination();

        return changed;
    }

    moveTo(index) {
        this.isTransitioning = true;
        this.currentIndex = index;

        const changed = this.updateGallery(index);
        if (!changed) {
            this.isTransitioning = false;
        }
    }

    handleDragStart = (e) => {
        this.stopAutoplay();

        if (!this.enableDrag || this.isTransitioning) return;

        const isTouch = e.type === 'touchstart';

        this.touchLocked = false;
        this.touchDirection = null;

        if (isTouch) {
            this.touchStartX = e.touches[0].clientX;
            this.touchStartY = e.touches[0].clientY;
        }

        this.startPos = isTouch ? e.touches[0][this.orientation === 'horizontal' ? 'clientX' : 'clientY'] : e[this.orientation === 'horizontal' ? 'clientX' : 'clientY'];
        this.endPos = this.startPos;
        this.startTime = Date.now();
        this.velocity = 0;
        this.isDragging = true;
        this.isDragged = false;

        const transform = window.getComputedStyle(this.galleryInner).transform;
        if (transform && transform !== 'none') {
            const match = transform.match(/matrix.*\((.+)\)/);
            if (match) {
                const values = match[1].split(',').map(v => parseFloat(v.trim()));
                this.startTranslate = this.orientation === 'horizontal' ? values[4] : values[5];
            } else {
                this.startTranslate = 0;
            }
        } else {
            this.startTranslate = 0;
        }

        this.dragStart = this.startPos;
        this.dragStartTranslate = this.startTranslate;

        requestAnimationFrame(() => {
            this.galleryInner.style.transition = 'none';
            this.galleryInner.style.cursor = 'grabbing';
        });

        if (!isTouch) {
            e.preventDefault();
        }
    }

    handleDragEnd = () => {
        if (!this.isDragging || this.isTransitioning) return;

        this.isDragging = false;

        if (this.rafId) cancelAnimationFrame(this.rafId);

        const diff = this.endPos - this.startPos;

        if (Math.abs(diff) <= 5) {
            this.isDragged = false;
            this.startPos = 0;
            this.endPos = 0;
            this.velocity = 0;

            requestAnimationFrame(() => {
                this.galleryInner.style.cursor = 'grab';
            });

            this.restartAutoplay();
            return;
        }

        const slidePixel = this.slideSize + this.getGap();
        let movedSlides = Math.round(Math.abs(diff) / slidePixel);
        if (movedSlides === 0) movedSlides = 1;

        const transform = window.getComputedStyle(this.galleryInner).transform;
        let currentTranslate = 0;
        if (transform && transform !== 'none') {
            const match = transform.match(/matrix.*\((.+)\)/);
            if (match) {
                const values = match[1].split(',').map(v => parseFloat(v.trim()));
                currentTranslate = this.orientation === 'horizontal' ? values[4] : values[5];
            }
        }

        requestAnimationFrame(() => {
            this.galleryInner.style.cursor = 'grab';
        });

        if (currentTranslate <= this.innerMinTranslate || currentTranslate >= this.innerMaxTranslate) {
            if (this.infinityLoop) {
                this.currentIndex = 0;
                this.updateGallery(this.currentIndex, true);
            } else {
                this.updateGallery(this.currentIndex, true);
            }
        } else {
            const swipeTime = Date.now() - this.startTime;
            const minSwipeDistance = 30;
            const maxSwipeTime = 300;
            const isQuickSwipe = swipeTime < maxSwipeTime && Math.abs(diff) > minSwipeDistance;
            const isFastSwipe = Math.abs(this.velocity) > 0.3;

            let targetIndex;
            if (isQuickSwipe || isFastSwipe || Math.abs(diff) > slidePixel / 2) {
                if (diff > 0 || this.velocity > 0) {
                    targetIndex = this.currentIndex - movedSlides;
                } else {
                    targetIndex = this.currentIndex + movedSlides;
                }

                if (!this.infinityLoop) {
                    targetIndex = this.clampIndex(targetIndex);
                }
            } else {
                targetIndex = this.currentIndex;
            }

            this.goToSlide(targetIndex);
        }

        this.startPos = 0;
        this.endPos = 0;
        this.velocity = 0;

        setTimeout(() => {
            this.isDragged = false;
        }, 100);

        this.restartAutoplay();
    };

    applyBreakpoints() {
        if (!this.breakpoints) return;

        this.gap = this.baseSettings.gap;
        this.slidesVisible = this.baseSettings.slidesVisible;
        this.slidesToScroll = this.baseSettings.slidesToScroll;
        this.infinityLoop = this.baseSettings.infinityLoop;
        this.autoplay = this.baseSettings.autoplay;

        const width = window.innerWidth;

        const breakpointKeys = Object.keys(this.breakpoints)
            .map(Number)
            .sort((a, b) => a - b);

        let activeBreakpoint = null;
        for (const bp of breakpointKeys) {
            if (width >= bp) {
                activeBreakpoint = bp;
            } else {
                break;
            }
        }

        if (activeBreakpoint !== null && this.breakpoints[activeBreakpoint]) {
            const bpOptions = this.breakpoints[activeBreakpoint];

            if (bpOptions.gap !== undefined) {
                this.gap = MerryGo.sanitizeGap(bpOptions.gap);
            }
            if (bpOptions.slidesVisible !== undefined) {
                this.slidesVisible = MerryGo.sanitizeSlidesVisible(bpOptions.slidesVisible);
            }
            if (bpOptions.slidesToScroll !== undefined) {
                this.slidesToScroll = MerryGo.sanitizeSlidesToScroll(bpOptions.slidesToScroll);
            }
            if (bpOptions.infinityLoop !== undefined) {
                this.infinityLoop = bpOptions.infinityLoop;
            }
            if (bpOptions.autoplay !== undefined) {
                this.autoplay = bpOptions.autoplay;
            }
        }
    }

    removeClones() {
        const clones = this.galleryInner.querySelectorAll('.clone');
        clones.forEach(clone => clone.remove());
        this.hasClones = false;
        this.cloneCount = 0;
    }

    makeClone(slide) {
        const clone = slide.cloneNode(true);
        clone.classList.add('clone', 'merrygo-slide');

        const imgs = clone.querySelectorAll('img');
        imgs.forEach(img => img.classList.add('clone'));

        return clone;
    }

    setupInfiniteLoop() {
        if (!this.infinityLoop) {
            return;
        }

        if (this.totalImages <= 1 || this.totalImages <= this.getSlidesVisible()) {
            return;
        }

        if (this.originalSlides.length === 0) {
            return;
        }

        this.removeClones();

        const total = this.totalImages;
        const clonesToAdd = this.getCloneCount();

        const endFragment = document.createDocumentFragment();
        for (let i = 0; i < clonesToAdd; i++) {
            endFragment.appendChild(this.makeClone(this.originalSlides[i % total]));
        }
        this.galleryInner.appendChild(endFragment);

        const startFragment = document.createDocumentFragment();
        for (let i = clonesToAdd; i >= 1; i--) {
            const sourceIndex = (((total - i) % total) + total) % total;
            startFragment.appendChild(this.makeClone(this.originalSlides[sourceIndex]));
        }
        this.galleryInner.insertBefore(startFragment, this.galleryInner.firstChild);

        this.hasClones = true;
        this.cloneCount = clonesToAdd;
    }

    setArrowState(button, disabled) {
        if (!button) return;

        button.classList.toggle('merrygo-arrow--disabled', disabled);

        if (disabled) {
            button.setAttribute('aria-disabled', 'true');
            button.style.opacity = '0.5';
            button.style.pointerEvents = 'none';
        } else {
            button.removeAttribute('aria-disabled');
            button.style.opacity = '';
            button.style.pointerEvents = '';
        }
    }

    updateArrowsState() {
        if (!this.prevBtn && !this.nextBtn) return;

        let prevDisabled = false;
        let nextDisabled = false;

        if (!this.infinityLoop) {
            const maxIndex = this.getMaxIndex();
            prevDisabled = this.currentIndex <= 0;
            nextDisabled = this.currentIndex >= maxIndex;
        }

        this.setArrowState(this.prevBtn, prevDisabled);
        this.setArrowState(this.nextBtn, nextDisabled);
    }

    handleTransitionEnd = (e) => {
        if (e && e.target && e.target !== this.galleryInner) return;
        if (e && e.propertyName && e.propertyName !== 'transform' && e.propertyName !== '-webkit-transform') return;

        clearTimeout(this.transitionTimer);
        this.transitionTimer = null;

        if (!this.isTransitioning) return;

        this.isTransitioning = false;

        if (this.infinityLoop && this.hasClones) {
            if (this.currentIndex >= this.totalImages || this.currentIndex < 0) {
                this.currentIndex = this.mod(this.currentIndex);
                this.updateGallery(this.currentIndex, true);
            }
        }
    }

    goToSlide(index) {
        this.stopAutoplay();
        if (this.isTransitioning) return;

        let target = Math.round(Number(index));
        if (!Number.isFinite(target)) return;

        if (this.infinityLoop) {
            const reach = this.hasClones ? this.cloneCount : 0;
            target = Math.max(-reach, Math.min(target, this.totalImages - 1 + reach));
        } else {
            target = this.clampIndex(target);
        }

        this.moveTo(target);
        this.restartAutoplay();
    }

    nextSlide = () => {
        this.stopAutoplay();

        if (this.isTransitioning) return;

        let target = this.currentIndex + this.slidesToScroll;

        if (!this.infinityLoop) {
            const maxIndex = this.getMaxIndex();
            if (this.currentIndex >= maxIndex) {
                return;
            }
            target = Math.min(target, maxIndex);
        }

        this.moveTo(target);
        this.restartAutoplay();
    }

    prevSlide = () => {
        this.stopAutoplay();

        if (this.isTransitioning) return;

        let target = this.currentIndex - this.slidesToScroll;

        if (!this.infinityLoop) {
            if (this.currentIndex <= 0) {
                return;
            }
            target = Math.max(target, 0);
        }

        this.moveTo(target);
        this.restartAutoplay();
    }

    handleDragMove = (e) => {
        if (!this.isDragging || this.isTransitioning) return;

        const isTouch = e.type === 'touchmove';

        if (isTouch && !this.touchLocked) {
            const dx = Math.abs(e.touches[0].clientX - this.touchStartX);
            const dy = Math.abs(e.touches[0].clientY - this.touchStartY);

            if (dx < 5 && dy < 5) return;

            this.touchDirection = dx >= dy ? 'horizontal' : 'vertical';
            this.touchLocked = true;
        }

        if (isTouch && this.touchDirection === 'vertical') {
            this.isDragging = false;
            return;
        }

        if (isTouch && this.touchDirection === 'horizontal') {
            e.preventDefault();
        }

        const currentPos = isTouch ? e.touches[0][this.orientation === 'horizontal' ? 'clientX' : 'clientY'] : e[this.orientation === 'horizontal' ? 'clientX' : 'clientY'];

        const previousPos = this.endPos;
        this.endPos = currentPos;
        const diff = this.endPos - this.startPos;

        if (Math.abs(diff) > 5) this.isDragged = true;

        const timeDiff = Date.now() - this.startTime;
        if (timeDiff > 0) {
            this.velocity = (this.endPos - previousPos) / timeDiff;
        }

        if (this.rafId) cancelAnimationFrame(this.rafId);

        this.rafId = requestAnimationFrame(() => {
            const transformProp = this.orientation === 'horizontal' ? 'translateX' : 'translateY';
            let nextTranslate = this.startTranslate + diff;

            if (typeof this.innerMinTranslate !== 'number' || typeof this.innerMaxTranslate !== 'number') {
                const maxDrag = this.slideSize * this.getSlidesVisible();
                if (nextTranslate - this.startTranslate > maxDrag) {
                    nextTranslate = this.startTranslate + maxDrag;
                }
                if (nextTranslate - this.startTranslate < -maxDrag) {
                    nextTranslate = this.startTranslate - maxDrag;
                }
            } else {
                if (nextTranslate > this.innerMaxTranslate) {
                    nextTranslate = this.innerMaxTranslate;
                }
                if (nextTranslate < this.innerMinTranslate) {
                    nextTranslate = this.innerMinTranslate;
                }
            }

            this.galleryInner.style.transform = `${transformProp}(${nextTranslate}px)`;
            this.lastTransform = null;
        });

        if (!isTouch) {
            e.preventDefault();
        }
    }

    handleClickPrevent = (e) => {
        if (this.isDragged) {
            e.preventDefault();
            e.stopPropagation();
        }
    }

    startAutoplay() {
        if (this.destroyed) return;
        if (!this.autoplay || typeof this.autoplay !== 'number') return;

        this.stopAutoplay();
        this.autoplayTimer = setInterval(() => {
            if (!this.isDragging && !this.isTransitioning) {
                this.nextSlide();
            }
        }, this.autoplay);
    }

    stopAutoplay() {
        if (this.autoplayTimer) {
            clearInterval(this.autoplayTimer);
            this.autoplayTimer = null;
        }
    }

    restartAutoplay() {
        if (!this.autoplay || typeof this.autoplay !== 'number') return;
        if (this.isHovered) return;

        this.stopAutoplay();
        this.startAutoplay();
    }

    handleHoverEnter = () => {
        this.isHovered = true;
        this.stopAutoplay();
    }

    handleHoverLeave = () => {
        this.isHovered = false;
        this.restartAutoplay();
    }

    createPagination() {
        if (!this.pagination) return;

        this.pagination.innerHTML = "";

        if (this.infinityLoop) {
            this.totalPages = this.totalImages;
        } else {
            this.totalPages = this.getMaxIndex() + 1;
        }

        this.bullets = [];

        for (let i = 0; i < this.totalPages; i++) {
            const bullet = document.createElement("button");
            bullet.classList.add("merrygo-bullet");
            bullet.dataset.index = i;
            bullet.setAttribute("aria-label", `Ir para slide ${i + 1} de ${this.totalPages}`);
            bullet.setAttribute("type", "button");

            bullet.addEventListener("click", () => {
                this.goToPage(i);
            });

            this.pagination.appendChild(bullet);
            this.bullets.push(bullet);
        }

        this.updatePagination();
    }

    updatePagination() {
        if (!this.bullets || this.bullets.length === 0) return;

        const pageIndex = this.infinityLoop
            ? this.mod(this.currentIndex)
            : this.clampIndex(this.currentIndex);

        this.bullets.forEach((b, i) => {
            b.classList.toggle('merrygo-bullet-active', i === pageIndex);

            if (i === pageIndex) {
                b.setAttribute('aria-current', 'true');
            } else {
                b.removeAttribute('aria-current');
            }
        });
    }

    goToPage(pageIndex) {
        this.stopAutoplay();
        if (this.isTransitioning) return;

        const page = Math.round(Number(pageIndex));
        if (!Number.isFinite(page)) return;

        const targetIndex = this.infinityLoop
            ? this.mod(page)
            : this.clampIndex(page);

        this.goToSlide(targetIndex);
    }

    setupEventListeners() {
        this.thumbHandlers = [];

        if (this.thumbs && this.thumbs.length > 0) {
            Array.from(this.thumbs).forEach((thumb, i) => {
                const handler = () => this.goToSlide(i);
                this.thumbHandlers.push({ thumb, handler });
                thumb.addEventListener('change', handler);
            });
        }

        if (this.prevBtn) {
            this.prevBtn.addEventListener('click', this.prevSlide);
        }

        if (this.nextBtn) {
            this.nextBtn.addEventListener('click', this.nextSlide);
        }

        this.galleryInner.addEventListener('transitionend', this.handleTransitionEnd);

        if (this.enableDrag) {
            this.gallery.addEventListener('touchstart', this.handleDragStart, { passive: true });
            this.gallery.addEventListener('touchmove', this.handleDragMove, { passive: false });
            this.gallery.addEventListener('touchend', this.handleDragEnd);
            this.gallery.addEventListener('touchcancel', this.handleDragEnd);

            this.gallery.addEventListener('mousedown', this.handleDragStart);
            this.gallery.addEventListener('mousemove', this.handleDragMove);
            this.gallery.addEventListener('mouseup', this.handleDragEnd);
            this.gallery.addEventListener('mouseleave', this.handleDragEnd);

            this.gallery.addEventListener('click', this.handleClickPrevent, true);

            this.galleryInner.style.cursor = 'grab';
        }

        if (this.autoplay && this.disableOnInteraction) {
            this.gallery.addEventListener('mouseenter', this.handleHoverEnter);
            this.gallery.addEventListener('mouseleave', this.handleHoverLeave);
        }
    }

    setupResizeObserver() {
        let resizeTimer;
        let lastWidth = window.innerWidth;

        this.handleResize = () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                const currentWidth = window.innerWidth;
                const widthDiff = Math.abs(currentWidth - lastWidth);

                if (widthDiff > 50) {
                    lastWidth = currentWidth;

                    this.applyBreakpoints();
                    this.refresh();
                }
            }, 250);
        };

        window.addEventListener('resize', this.handleResize);
    }

    init() {
        this.isTransitioning = false;
        this.lastTransform = null;
        clearTimeout(this.transitionTimer);
        clearTimeout(this.initTimer);

        const indexToUse = (this.currentIndex !== undefined && this.currentIndex !== null)
            ? this.currentIndex
            : 0;

        this.currentIndex = indexToUse;

        this.removeClones();
        this.readSlides();
        this.applyClasses();
        this.applyCssVars();

        if (this.totalImages <= 1 || this.totalImages <= this.getSlidesVisible()) {
            this.infinityLoop = false;
        }

        if (this.totalImages > 1 && this.infinityLoop) {
            this.setupInfiniteLoop();
        }

        this.currentIndex = this.infinityLoop
            ? this.mod(this.currentIndex)
            : this.clampIndex(this.currentIndex);

        this.setActiveThumb(this.currentIndex);

        if (this.pagination) {
            this.createPagination();
        }

        this.calculateDimensions();

        this.initTimer = setTimeout(() => {
            if (this.destroyed) return;
            this.updateGallery(this.currentIndex, true);
            this.startAutoplay();
        }, 10);
    }

    destroy() {
        this.destroyed = true;

        clearTimeout(this.initTimer);
        clearTimeout(this.transitionTimer);
        if (this.rafId) cancelAnimationFrame(this.rafId);

        this.thumbHandlers.forEach(({ thumb, handler }) => {
            thumb.removeEventListener('change', handler);
        });
        this.thumbHandlers = [];

        if (this.prevBtn) {
            this.prevBtn.removeEventListener('click', this.prevSlide);
        }

        if (this.nextBtn) {
            this.nextBtn.removeEventListener('click', this.nextSlide);
        }

        this.galleryInner.removeEventListener('transitionend', this.handleTransitionEnd);

        if (this.enableDrag) {
            this.gallery.removeEventListener('touchstart', this.handleDragStart);
            this.gallery.removeEventListener('touchmove', this.handleDragMove);
            this.gallery.removeEventListener('touchend', this.handleDragEnd);
            this.gallery.removeEventListener('touchcancel', this.handleDragEnd);
            this.gallery.removeEventListener('mousedown', this.handleDragStart);
            this.gallery.removeEventListener('mousemove', this.handleDragMove);
            this.gallery.removeEventListener('mouseup', this.handleDragEnd);
            this.gallery.removeEventListener('mouseleave', this.handleDragEnd);
            this.gallery.removeEventListener('click', this.handleClickPrevent, true);
        }

        if (this.handleResize) {
            window.removeEventListener('resize', this.handleResize);
        }

        if (this.autoplay && this.disableOnInteraction) {
            this.gallery.removeEventListener('mouseenter', this.handleHoverEnter);
            this.gallery.removeEventListener('mouseleave', this.handleHoverLeave);
        }

        this.stopAutoplay();
        this.removeClones();
    }

    refresh() {
        this.stopAutoplay();
        this.init();
    }
}

if (typeof window !== 'undefined') {
  window.MerryGo = MerryGo;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = MerryGo;
}
