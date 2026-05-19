import { Component } from '@theme/component';
import { prefersReducedMotion } from '@theme/utilities';

/**
 * Horizontal media carousel: vertical wheel scroll moves slides left/right.
 *
 * @typedef {object} WsRecommendedCarouselRefs
 * @property {HTMLElement} track
 * @property {HTMLElement[]} slides - Slide elements
 * @property {HTMLElement[]} dots - Pagination buttons
 */
export class WsRecommendedCarousel extends Component {
  requiredRefs = ['track'];

  /** @type {number} */
  #activeIndex = 0;

  /** @type {boolean} */
  #isWheeling = false;

  connectedCallback() {
    super.connectedCallback();
    const { track } = this.refs;

    track.addEventListener('wheel', this.#onWheel, { passive: false });
    track.addEventListener('scroll', this.#onScroll, { passive: true });

    this.refs.dots?.forEach((dot, index) => {
      dot.addEventListener('click', () => this.#goToSlide(index));
    });

    this.#updateActiveFromScroll();
  }

  disconnectedCallback() {
    track.removeEventListener('wheel', this.#onWheel);
    this.refs.track?.removeEventListener('scroll', this.#onScroll);
  }

  /**
   * @param {WheelEvent} event
   */
  #onWheel = (event) => {
    if (prefersReducedMotion()) return;

    const { track } = this.refs;
    const { deltaY, deltaX } = event;

    if (Math.abs(deltaY) <= Math.abs(deltaX)) return;

    const maxScroll = track.scrollWidth - track.clientWidth;
    if (maxScroll <= 0) return;

    const scrollingDown = deltaY > 0;
    const atStart = track.scrollLeft <= 0;
    const atEnd = track.scrollLeft >= maxScroll - 1;

    if ((scrollingDown && atEnd) || (!scrollingDown && atStart)) return;

    event.preventDefault();
    track.scrollLeft += deltaY;
  };

  #onScroll = () => {
    if (this.#isWheeling) return;
    this.#updateActiveFromScroll();
  };

  #updateActiveFromScroll() {
    const { track, slides = [] } = this.refs;
    if (!slides.length) return;

    const trackCenter = track.scrollLeft + track.clientWidth / 2;
    let closestIndex = 0;
    let closestDistance = Infinity;

    slides.forEach((slide, index) => {
      const slideCenter = slide.offsetLeft + slide.offsetWidth / 2;
      const distance = Math.abs(trackCenter - slideCenter);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });

    this.#setActiveIndex(closestIndex);
  }

  /**
   * @param {number} index
   */
  #goToSlide(index) {
    const { track, slides = [] } = this.refs;
    const slide = slides[index];
    if (!slide) return;

    this.#isWheeling = true;
    const prefersReduced = prefersReducedMotion();

    track.scrollTo({
      left: slide.offsetLeft,
      behavior: prefersReduced ? 'auto' : 'smooth',
    });

    this.#setActiveIndex(index);

    window.setTimeout(() => {
      this.#isWheeling = false;
    }, prefersReduced ? 0 : 400);
  }

  /**
   * @param {number} index
   */
  #setActiveIndex(index) {
    const { dots = [] } = this.refs;
    if (index === this.#activeIndex && dots[index]?.getAttribute('aria-current') === 'true') return;

    this.#activeIndex = index;

    dots.forEach((dot, dotIndex) => {
      const isActive = dotIndex === index;
      dot.setAttribute('aria-current', isActive ? 'true' : 'false');
      dot.classList.toggle('is-active', isActive);
    });
  }
}

if (!customElements.get('ws-recommended-carousel')) {
  customElements.define('ws-recommended-carousel', WsRecommendedCarousel);
}
