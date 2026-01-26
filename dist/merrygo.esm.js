class MerryGo {
    constructor(options) {
        this.gallery = options.gallery;
        this.galleryInner = options.galleryInner;
        this.thumbs = options.thumbs || [];
        this.prevBtn = options.prevBtn;
        this.nextBtn = options.nextBtn;
        this.pagination = options.pagination || null;
        this.gap = options.gap ?? 0;
        this.orientation = options.orientation || 'horizontal';
        this.enableDrag = options.enableDrag !== false;
        this.infinityLoop = options.infinityLoop ?? true;
        this.slidesToScroll = options.slidesToScroll || 1;
        this.slidesVisible = options.slidesVisible || 1;
        this.autoplay = options.autoplay ?? false;
        this.autoplayTimer = null;
        this.breakpoints = options.breakpoints || null;

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

        this.originalSlides = Array.from(this.galleryInner.children).filter(child =>                   !child.classList.contains('clone'));
        this.originalImages = Array.from(this.galleryInner.querySelectorAll('img:not(.clone)'));
        this.totalImages = this.originalSlides.length;

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
        this.maxTranslate = 0;
        this.minTranslate = 0;

        this.options = options;

        this.applyBreakpoints();
        this.init();
        this.setupEventListeners();
        this.setupResizeObserver();
    }

    calculateDimensions() {
        const isHorizontal = this.orientation === 'horizontal';

        const containerRect = this.galleryInner.getBoundingClientRect();
        const containerSize = isHorizontal ? containerRect.width : containerRect.height;
        const innerSize = isHorizontal ? this.galleryInner.scrollWidth : this.galleryInner.scrollHeight;

        const gapValue = Number(this.gap) || 0;
        const totalGaps = (this.slidesVisible - 1) * gapValue;
        const slideSize = (containerSize - totalGaps) / this.slidesVisible;

        this.cachedDimensions = {
            containerSize,
            innerSize,
            slideSize,
            timestamp: Date.now()
        };

        this.slideSize = slideSize;

        this.innerMaxTranslate = 0;
        this.innerMinTranslate = containerSize - innerSize;

        const maxIndexWhenNoLoop = Math.max(0, this.totalImages - this.slidesVisible);
        this.maxTranslate = 0;
        this.minTranslate = -(maxIndexWhenNoLoop * (slideSize + gapValue));

        return {
            slideSize,
            gapValue
        };
    }

    updateGallery(index, instant = false) {
        const isHorizontal = this.orientation === 'horizontal';

        if (this.originalSlides.length === 0) return;

        const { slideSize, gapValue } = this.calculateDimensions();

        let adjustedIndex;
        if (this.infinityLoop && this.slidesVisible === 1 && this.totalImages > 1) {
            adjustedIndex = index + 1;
        } else if (this.infinityLoop && this.totalImages > this.slidesVisible) {
            adjustedIndex = index + this.slidesVisible;
        } else {
            adjustedIndex = index;
        }

        const offset = adjustedIndex * (slideSize + gapValue);

        const transform = isHorizontal
            ? `translateX(-${offset}px)`
            : `translateY(-${offset}px)`;

        requestAnimationFrame(() => {
            this.galleryInner.style.transition = instant
                ? 'none'
                : 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
            this.galleryInner.style.transform = transform;
        });

        const realIndex = index < 0 ? this.totalImages - 1 : (index >= this.totalImages ? 0 : index);

        if (this.thumbs && this.thumbs.length > 0 && this.thumbs[realIndex]) {
            this.thumbs[realIndex].checked = true;
        }

        this.updateArrowsState();
        this.updatePagination && this.updatePagination();
    }

    handleDragStart = (e) => {
        this.stopAutoplay();

        if (!this.enableDrag || this.isTransitioning) return;

        const isTouch = e.type === 'touchstart';
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

        const slidePixel = this.slideSize + (Number(this.gap) || 0);
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
                const mod = ((0 % this.totalImages) + this.totalImages) % this.totalImages;
                this.currentIndex = mod;
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
                    const maxIndex = this.totalImages - this.slidesVisible;
                    targetIndex = Math.max(0, Math.min(targetIndex, maxIndex));
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
                this.gap = bpOptions.gap;
            }
            if (bpOptions.slidesVisible !== undefined) {
                this.slidesVisible = bpOptions.slidesVisible;
            }
            if (bpOptions.slidesToScroll !== undefined) {
                this.slidesToScroll = bpOptions.slidesToScroll;
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
    }

    setupInfiniteLoop() {
        if (!this.infinityLoop) {
            return;
        }

        if (this.totalImages <= 1 || this.totalImages <= this.slidesVisible) {
            return;
        }

        if (this.originalSlides.length > 0) {
            this.removeClones();

            if (this.slidesVisible === 1) {
                const firstClone = this.originalSlides[0].cloneNode(true);
                const lastClone = this.originalSlides[this.totalImages - 1].cloneNode(true);

                firstClone.classList.add('clone');
                lastClone.classList.add('clone');

                const markImagesAsClone = (element) => {
                    const imgs = element.querySelectorAll('img');
                    imgs.forEach(img => img.classList.add('clone'));
                };

                markImagesAsClone(firstClone);
                markImagesAsClone(lastClone);

                this.galleryInner.insertBefore(lastClone, this.galleryInner.firstChild);
                this.galleryInner.appendChild(firstClone);
                return;
            }

            const clonesToAdd = this.slidesVisible;

            for (let i = 0; i < clonesToAdd; i++) {
                const clone = this.originalSlides[i].cloneNode(true);
                clone.classList.add('clone');

                const imgs = clone.querySelectorAll('img');
                imgs.forEach(img => img.classList.add('clone'));

                this.galleryInner.appendChild(clone);
            }

            for (let i = this.totalImages - 1; i >= this.totalImages - clonesToAdd; i--) {
                const clone = this.originalSlides[i].cloneNode(true);
                clone.classList.add('clone');

                const imgs = clone.querySelectorAll('img');
                imgs.forEach(img => img.classList.add('clone'));

                this.galleryInner.insertBefore(clone, this.galleryInner.firstChild);
            }
        }
    }

    updateArrowsState() {
        if (!this.infinityLoop && (this.prevBtn || this.nextBtn)) {
            const maxIndex = this.totalImages - this.slidesVisible;

            if (this.prevBtn) {
                if (this.currentIndex <= 0) {
                    this.prevBtn.style.opacity = '0.5';
                    this.prevBtn.style.pointerEvents = 'none';
                } else {
                    this.prevBtn.style.opacity = '';
                    this.prevBtn.style.pointerEvents = '';
                }
            }

            if (this.nextBtn) {
                if (this.currentIndex >= maxIndex) {
                    this.nextBtn.style.opacity = '0.5';
                    this.nextBtn.style.pointerEvents = 'none';
                } else {
                    this.nextBtn.style.opacity = '';
                    this.nextBtn.style.pointerEvents = '';
                }
            }
        }
    }

    handleTransitionEnd = () => {
        if (!this.isTransitioning) return;

        this.isTransitioning = false;

        if (this.infinityLoop) {
            const hasClones = (this.slidesVisible === 1 && this.totalImages > 1) ||
                (this.totalImages > this.slidesVisible);

            if (hasClones) {
                if (this.currentIndex >= this.totalImages || this.currentIndex < 0) {
                    const mod = ((this.currentIndex % this.totalImages) + this.totalImages) % this.totalImages;
                    this.currentIndex = mod;
                    this.updateGallery(this.currentIndex, true);
                }
            }
        }
    }

    goToSlide(index) {
        this.stopAutoplay();
        if (this.isTransitioning) return;

        this.isTransitioning = true;
        this.currentIndex = index;

        this.updateGallery(this.currentIndex);
        this.updatePagination && this.updatePagination();

        this.restartAutoplay();
    }

    nextSlide = () => {
        this.stopAutoplay();

        if (this.isTransitioning) return;

        if (!this.infinityLoop) {
            const maxIndex = this.totalImages - this.slidesVisible;
            if (this.currentIndex >= maxIndex) {
                return;
            }
        }

        this.isTransitioning = true;
        this.currentIndex += this.slidesToScroll;
        this.updateGallery(this.currentIndex);
        this.updatePagination();

        this.restartAutoplay();
    }

    prevSlide = () => {
        this.stopAutoplay();

        if (this.isTransitioning) return;

        if (!this.infinityLoop && this.currentIndex <= 0) {
            return;
        }

        this.isTransitioning = true;
        this.currentIndex -= this.slidesToScroll;
        this.updateGallery(this.currentIndex);
        this.updatePagination();

        this.restartAutoplay();
    }

    handleDragMove = (e) => {
        if (!this.isDragging || this.isTransitioning) return;

        const isTouch = e.type === 'touchmove';
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
                const maxDrag = this.slideSize * this.slidesVisible;
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

        this.stopAutoplay();
        this.startAutoplay();
    }

    createPagination() {
        if (!this.pagination) return;

        this.pagination.innerHTML = "";

        if (this.infinityLoop) {
            this.totalPages = this.totalImages;
        } else {
            this.totalPages = Math.max(1, this.totalImages - this.slidesVisible + 1);
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

        const maxIndexWhenNoLoop = Math.max(0, this.totalImages - this.slidesVisible);

        let realSlideIndex = this.currentIndex;

        if (this.infinityLoop) {
            if (this.currentIndex < 0) {
                realSlideIndex = this.totalImages - 1;
            } else if (this.currentIndex >= this.totalImages) {
                realSlideIndex = 0;
            }
        } else {
            realSlideIndex = Math.min(Math.max(0, this.currentIndex), maxIndexWhenNoLoop);
        }

        let pageIndex;

        if (this.infinityLoop) {
            pageIndex = realSlideIndex;
        } else {
            pageIndex = Math.min(realSlideIndex, maxIndexWhenNoLoop);
        }

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

        const maxIndexWhenNoLoop = Math.max(0, this.totalImages - this.slidesVisible);
        let targetIndex;

        if (this.infinityLoop) {
            targetIndex = pageIndex;
        } else {
            targetIndex = Math.min(Math.max(0, pageIndex), maxIndexWhenNoLoop);
        }

        this.goToSlide(targetIndex);
    }

    setupEventListeners() {
        if (this.thumbs && this.thumbs.length > 0) {
            this.thumbs.forEach((thumb, i) => {
                thumb.addEventListener('change', () => {
                    this.goToSlide(i);
                });
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
            this.gallery.addEventListener('touchmove', this.handleDragMove, { passive: true });
            this.gallery.addEventListener('touchend', this.handleDragEnd);
            this.gallery.addEventListener('touchcancel', this.handleDragEnd);

            this.gallery.addEventListener('mousedown', this.handleDragStart);
            this.gallery.addEventListener('mousemove', this.handleDragMove);
            this.gallery.addEventListener('mouseup', this.handleDragEnd);
            this.gallery.addEventListener('mouseleave', this.handleDragEnd);

            this.gallery.addEventListener('click', this.handleClickPrevent, true);

            this.galleryInner.style.cursor = 'grab';
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
        
        const indexToUse = (this.currentIndex !== undefined && this.currentIndex !== null)
            ? this.currentIndex
            : 0;

        this.currentIndex = indexToUse;

        this.removeClones();

        if (this.totalImages <= 1 || this.totalImages <= this.slidesVisible) {
            this.infinityLoop = false;
        }

        if (this.totalImages > 1 && this.infinityLoop) {
            this.setupInfiniteLoop();
        }

        if (this.thumbs && this.thumbs.length > 0) {
            this.thumbs[indexToUse].checked = true;
        }

        if (this.pagination) {
            this.createPagination();
        }

        this.calculateDimensions();

        setTimeout(() => {
            this.updateGallery(indexToUse, true);
            this.startAutoplay();
        }, 10);
    }

    destroy() {
        if (this.thumbs && this.thumbs.length > 0) {
            this.thumbs.forEach((thumb, i) => {
                thumb.removeEventListener('change', () => this.goToSlide(i));
            });
        }

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

        this.stopAutoplay();
        this.removeClones();
    }

    refresh() {
        this.stopAutoplay();
        this.init();
    }
}

export default MerryGo;
