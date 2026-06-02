import { Component } from '@theme/component';

/**
 * Social gallery: optional horizontal slider with previous / next controls.
 *
 * @typedef {object} WsSocialGalleryRefs
 * @property {HTMLElement} track
 * @property {HTMLElement[]} slides
 * @property {HTMLButtonElement} [previousButton]
 * @property {HTMLButtonElement} [nextButton]
 */
class WsSocialGallery extends Component {
  requiredRefs = ['track'];

  /** @type {number} */
  #activeIndex = 0;

  connectedCallback() {
    super.connectedCallback();

    if (this.dataset.layout !== 'slider') return;

    this.refs.previousButton?.addEventListener('click', this.#onPrevious);
    this.refs.nextButton?.addEventListener('click', this.#onNext);
    this.refs.track.addEventListener('scroll', this.#onScroll, { passive: true });
    window.addEventListener('resize', this.#onResize);

    requestAnimationFrame(() => {
      this.#updateSlideWidth();
      this.#updateControls();
    });
  }

  disconnectedCallback() {
    this.refs.previousButton?.removeEventListener('click', this.#onPrevious);
    this.refs.nextButton?.removeEventListener('click', this.#onNext);
    this.refs.track?.removeEventListener('scroll', this.#onScroll);
    window.removeEventListener('resize', this.#onResize);

    super.disconnectedCallback();
  }

  #onPrevious = () => {
    this.#goToSlide(this.#getNearestIndex() - 1);
  };

  #onNext = () => {
    this.#goToSlide(this.#getNearestIndex() + 1);
  };

  #onScroll = () => {
    this.#activeIndex = this.#getNearestIndex();
    this.#updateControls();
  };

  #onResize = () => {
    this.#updateSlideWidth();
    this.#goToSlide(this.#activeIndex, false);
    this.#updateControls();
  };

  #updateSlideWidth() {
    if (window.matchMedia('(max-width: 749px)').matches) {
      this.style.removeProperty('--ws-social-gallery-slide-width');
      return;
    }

    const { track } = this.refs;
    const columns = this.#getColumnCount();
    const gap = this.#getGap();
    const width = (track.clientWidth - gap * (columns - 1)) / columns;

    this.style.setProperty('--ws-social-gallery-slide-width', `${Math.max(width, 0)}px`);
  }

  #getColumnCount() {
    const section = this.closest('.ws-social-gallery');
    const styles = section ? window.getComputedStyle(section) : window.getComputedStyle(this);
    const variable = window.matchMedia('(max-width: 1023px)').matches
      ? '--ws-social-gallery-columns-tablet'
      : '--ws-social-gallery-columns-pc';
    const columns = Number.parseInt(styles.getPropertyValue(variable), 10);

    return Number.isFinite(columns) && columns > 0 ? columns : 4;
  }

  #getGap() {
    const styles = window.getComputedStyle(this.refs.track);
    const gap = Number.parseFloat(styles.columnGap || styles.gap || '0');

    return Number.isFinite(gap) ? gap : 0;
  }

  /**
   * @param {number} index
   * @param {boolean} smooth
   */
  #goToSlide(index, smooth = true) {
    const { slides = [] } = this.refs;
    if (!slides.length) return;

    const targetIndex = Math.max(0, Math.min(index, slides.length - 1));
    const slide = slides[targetIndex];
    const targetLeft = this.#getSlideScrollLeft(slide);

    this.#activeIndex = targetIndex;
    this.refs.track.scrollTo({
      left: targetLeft,
      behavior: smooth ? 'smooth' : 'auto',
    });
    this.#updateControls();
  }

  /**
   * @param {HTMLElement} slide
   */
  #getSlideScrollLeft(slide) {
    const { track } = this.refs;
    const trackRect = track.getBoundingClientRect();
    const slideRect = slide.getBoundingClientRect();
    const styles = window.getComputedStyle(track);
    const paddingLeft = Number.parseFloat(styles.paddingLeft || '0') || 0;

    return slideRect.left - trackRect.left + track.scrollLeft - paddingLeft;
  }

  #getNearestIndex() {
    const { slides = [], track } = this.refs;
    if (!slides.length) return 0;

    let nearestIndex = 0;
    let nearestDistance = Number.POSITIVE_INFINITY;

    slides.forEach((slide, index) => {
      const distance = Math.abs(this.#getSlideScrollLeft(slide) - track.scrollLeft);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    });

    return nearestIndex;
  }

  #updateControls = () => {
    const { track, previousButton, nextButton } = this.refs;
    const maxScrollLeft = track.scrollWidth - track.clientWidth;
    const canScroll = maxScrollLeft > 1;
    const scrollLeft = Math.max(0, track.scrollLeft);

    if (previousButton) {
      previousButton.disabled = !canScroll || scrollLeft <= 1;
    }

    if (nextButton) {
      nextButton.disabled = !canScroll || scrollLeft >= maxScrollLeft - 1;
    }
  };
}

if (!customElements.get('ws-social-gallery')) {
  customElements.define('ws-social-gallery', WsSocialGallery);
}
