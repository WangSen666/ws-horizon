import { Component } from '@theme/component';
import { prefersReducedMotion } from '@theme/utilities';

/**
 * Full-width hero carousel with image/video slides.
 *
 * @typedef {object} WsHeroCarouselRefs
 * @property {HTMLElement} viewport
 * @property {HTMLElement[]} slides
 * @property {HTMLElement[]} dots
 * @property {HTMLButtonElement} [previous]
 * @property {HTMLButtonElement} [next]
 */
export class WsHeroCarousel extends Component {
  requiredRefs = ['viewport'];

  /** @type {number} */
  #activeIndex = 0;

  /** @type {ReturnType<typeof setInterval> | null} */
  #autoplayTimer = null;

  /** @type {number} */
  #touchStartX = 0;

  /** @type {number} */
  #touchStartY = 0;

  /** @type {number} */
  #touchThreshold = 48;

  /** @type {number} */
  #lastInteractAt = 0;

  /** @type {number} */
  #cooldownMs = 450;

  connectedCallback() {
    super.connectedCallback();

    this.refs.previous?.addEventListener('click', this.#onPrevious);
    this.refs.next?.addEventListener('click', this.#onNext);

    this.refs.dots?.forEach((dot, index) => {
      dot.addEventListener('click', (event) => {
        event.preventDefault();
        this.#goTo(index);
      });
    });

    this.addEventListener('touchstart', this.#onTouchStart, { passive: true });
    this.addEventListener('touchend', this.#onTouchEnd, { passive: true });

    this.#setActiveIndex(this.#activeIndex, false);
    this.#startAutoplay();
  }

  disconnectedCallback() {
    this.#stopAutoplay();
    this.refs.previous?.removeEventListener('click', this.#onPrevious);
    this.refs.next?.removeEventListener('click', this.#onNext);
    this.removeEventListener('touchstart', this.#onTouchStart);
    this.removeEventListener('touchend', this.#onTouchEnd);
    super.disconnectedCallback();
  }

  #onPrevious = () => {
    this.#goTo(this.#activeIndex - 1);
  };

  #onNext = () => {
    this.#goTo(this.#activeIndex + 1);
  };

  /**
   * @param {TouchEvent} event
   */
  #onTouchStart = (event) => {
    const touch = event.touches[0];
    if (!touch) return;

    this.#touchStartX = touch.clientX;
    this.#touchStartY = touch.clientY;
  };

  /**
   * @param {TouchEvent} event
   */
  #onTouchEnd = (event) => {
    const { slides = [] } = this.refs;
    if (slides.length <= 1) return;

    const touch = event.changedTouches[0];
    if (!touch) return;

    const deltaX = this.#touchStartX - touch.clientX;
    const deltaY = this.#touchStartY - touch.clientY;

    if (Math.abs(deltaX) < this.#touchThreshold) return;
    if (Math.abs(deltaX) <= Math.abs(deltaY)) return;

    const now = Date.now();
    if (now - this.#lastInteractAt < this.#cooldownMs) return;
    this.#lastInteractAt = now;

    const direction = deltaX > 0 ? 1 : -1;
    this.#goTo(this.#activeIndex + direction);
  };

  /**
   * @param {number} index
   */
  #goTo(index) {
    const { slides = [] } = this.refs;
    if (!slides.length) return;

    const count = slides.length;
    const nextIndex = ((index % count) + count) % count;

    const now = Date.now();
    if (nextIndex === this.#activeIndex && now - this.#lastInteractAt < this.#cooldownMs) return;

    this.#lastInteractAt = now;
    this.#setActiveIndex(nextIndex);
    this.#restartAutoplay();
  }

  /**
   * @param {number} index
   * @param {boolean} [animate=true]
   */
  #setActiveIndex(index, animate = true) {
    const { slides = [], dots = [] } = this.refs;
    if (!slides.length) return;

    this.#activeIndex = index;

    slides.forEach((slide, slideIndex) => {
      const isActive = slideIndex === index;
      slide.classList.toggle('is-active', isActive);
      slide.setAttribute('aria-hidden', isActive ? 'false' : 'true');

      const video = slide.querySelector('video');
      if (!(video instanceof HTMLVideoElement)) return;

      if (isActive) {
        video.play().catch(() => {});
      } else {
        video.pause();
        if (!animate) video.currentTime = 0;
      }
    });

    dots.forEach((dot, dotIndex) => {
      const isActive = dotIndex === index;
      dot.setAttribute('aria-current', isActive ? 'true' : 'false');
      dot.classList.toggle('is-active', isActive);
    });
  }

  #startAutoplay() {
    if (prefersReducedMotion()) return;

    const intervalMs = this.#getAutoplayIntervalMs();
    if (!intervalMs) return;

    this.#autoplayTimer = window.setInterval(() => {
      this.#goTo(this.#activeIndex + 1);
    }, intervalMs);
  }

  #restartAutoplay() {
    this.#stopAutoplay();
    this.#startAutoplay();
  }

  #stopAutoplay() {
    if (this.#autoplayTimer) {
      window.clearInterval(this.#autoplayTimer);
      this.#autoplayTimer = null;
    }
  }

  /**
   * @returns {number}
   */
  #getAutoplayIntervalMs() {
    const seconds = parseInt(this.getAttribute('autoplay') || '', 10);
    if (!seconds || Number.isNaN(seconds)) return 0;
    return seconds * 1000;
  }
}

if (!customElements.get('ws-hero-carousel')) {
  customElements.define('ws-hero-carousel', WsHeroCarousel);
}
