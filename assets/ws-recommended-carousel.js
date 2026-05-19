import { Component } from '@theme/component';
import { prefersReducedMotion } from '@theme/utilities';

/**
 * Recommended carousel: wheel anywhere in component switches slides;
 * left content panel and right media stay in sync.
 *
 * @typedef {object} WsRecommendedCarouselRefs
 * @property {HTMLElement} track
 * @property {HTMLElement[]} slides
 * @property {HTMLElement[]} contentPanels
 * @property {HTMLElement[]} dots
 */
export class WsRecommendedCarousel extends Component {
  requiredRefs = ['track'];

  /** @type {number} */
  #activeIndex = 0;

  /** @type {boolean} */
  #isProgrammaticScroll = false;

  /** @type {number} */
  #lastWheelAt = 0;

  /** @type {number} */
  #wheelCooldownMs = 500;

  connectedCallback() {
    super.connectedCallback();

    const { track } = this.refs;

    this.addEventListener('wheel', this.#onWheel, { passive: false });
    track.addEventListener('scroll', this.#onScroll, { passive: true });

    this.refs.dots?.forEach((dot, index) => {
      dot.addEventListener('click', (event) => {
        event.preventDefault();
        this.#goToSlide(index);
      });
    });

    requestAnimationFrame(() => {
      this.#goToSlide(this.#activeIndex, false);
    });
  }

  disconnectedCallback() {
    this.removeEventListener('wheel', this.#onWheel);
    this.refs.track?.removeEventListener('scroll', this.#onScroll);
    super.disconnectedCallback();
  }

  /**
   * @param {WheelEvent} event
   */
  #onWheel = (event) => {
    if (prefersReducedMotion()) return;

    const { slides = [] } = this.refs;
    if (slides.length <= 1) return;

    const { deltaY, deltaX } = event;
    if (Math.abs(deltaY) <= Math.abs(deltaX)) return;

    const direction = deltaY > 0 ? 1 : -1;
    const atStart = this.#activeIndex === 0;
    const atEnd = this.#activeIndex === slides.length - 1;

    if ((direction > 0 && atEnd) || (direction < 0 && atStart)) return;

    event.preventDefault();

    const now = Date.now();
    if (now - this.#lastWheelAt < this.#wheelCooldownMs) return;
    this.#lastWheelAt = now;

    const nextIndex = this.#activeIndex + direction;
    this.#goToSlide(nextIndex);
  };

  #onScroll = () => {
    if (this.#isProgrammaticScroll) return;
    this.#syncActiveIndexFromScroll();
  };

  #syncActiveIndexFromScroll() {
    const { track, slides = [] } = this.refs;
    if (!slides.length) return;

    const scrollLeft = track.scrollLeft;
    let closestIndex = 0;
    let closestDistance = Infinity;

    slides.forEach((slide, index) => {
      const slideOffset = this.#getSlideScrollLeft(slide);
      const distance = Math.abs(scrollLeft - slideOffset);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });

    this.#setActiveIndex(closestIndex);
  };

  /**
   * @param {HTMLElement} slide
   * @returns {number}
   */
  #getSlideScrollLeft(slide) {
    const { track } = this.refs;
    const trackRect = track.getBoundingClientRect();
    const slideRect = slide.getBoundingClientRect();
    return track.scrollLeft + (slideRect.left - trackRect.left);
  }

  /**
   * @param {number} index
   * @param {boolean} [animate=true]
   */
  #goToSlide(index, animate = true) {
    const { track, slides = [] } = this.refs;
    const slide = slides[index];
    if (!slide) return;

    const scrollLeft = this.#getSlideScrollLeft(slide);
    const useAnimation = animate && !prefersReducedMotion();

    this.#isProgrammaticScroll = true;
    this.#setActiveIndex(index);

    track.scrollTo({
      left: scrollLeft,
      behavior: useAnimation ? 'smooth' : 'auto',
    });

    const unlock = () => {
      this.#isProgrammaticScroll = false;
    };

    if (useAnimation) {
      window.setTimeout(unlock, 450);
    } else {
      requestAnimationFrame(unlock);
    }
  }

  /**
   * @param {number} index
   */
  #setActiveIndex(index) {
    const { dots = [], contentPanels = [], slides = [] } = this.refs;

    if (index === this.#activeIndex && dots[index]?.classList.contains('is-active')) return;

    this.#activeIndex = index;

    contentPanels.forEach((panel, panelIndex) => {
      panel.classList.toggle('is-active', panelIndex === index);
      panel.hidden = panelIndex !== index;
    });

    dots.forEach((dot, dotIndex) => {
      const isActive = dotIndex === index;
      dot.setAttribute('aria-current', isActive ? 'true' : 'false');
      dot.classList.toggle('is-active', isActive);
    });

    slides.forEach((slide, slideIndex) => {
      const video = slide.querySelector('video');
      if (!(video instanceof HTMLVideoElement)) return;
      if (slideIndex === index) {
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    });
  }
}

if (!customElements.get('ws-recommended-carousel')) {
  customElements.define('ws-recommended-carousel', WsRecommendedCarousel);
}
