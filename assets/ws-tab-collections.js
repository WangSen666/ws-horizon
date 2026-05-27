import { Component } from '@theme/component';

/**
 * Tabbed collection carousel: tabs switch panels; each panel has a horizontal product track.
 *
 * @typedef {object} WsTabCollectionsRefs
 * @property {HTMLButtonElement[]} tabButtons
 * @property {HTMLElement[]} tabPanels
 * @property {HTMLElement[]} tracks
 * @property {HTMLAnchorElement[]} viewMoreLinks
 * @property {HTMLButtonElement[]} previousButtons
 * @property {HTMLButtonElement[]} nextButtons
 */
export class WsTabCollections extends Component {
  /** @type {number} */
  #activeIndex = 0;

  connectedCallback() {
    super.connectedCallback();

    this.refs.tabButtons?.forEach((button, index) => {
      button.addEventListener('click', (event) => {
        event.preventDefault();
        this.#setActiveTab(index);
      });
    });

    this.refs.previousButtons?.forEach((button, index) => {
      button.addEventListener('click', (event) => {
        event.preventDefault();
        this.#scrollTrack(index, -1);
      });
    });

    this.refs.nextButtons?.forEach((button, index) => {
      button.addEventListener('click', (event) => {
        event.preventDefault();
        this.#scrollTrack(index, 1);
      });
    });

    this.#setActiveTab(this.#activeIndex, false);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
  }

  /**
   * @param {number} index
   * @param {boolean} [animate=true]
   */
  #setActiveTab(index, animate = true) {
    const { tabButtons = [], tabPanels = [], viewMoreLinks = [] } = this.refs;
    if (!tabPanels.length) return;

    this.#activeIndex = index;

    tabButtons.forEach((button, buttonIndex) => {
      const isActive = buttonIndex === index;
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });

    tabPanels.forEach((panel, panelIndex) => {
      const isActive = panelIndex === index;
      panel.classList.toggle('is-active', isActive);
      panel.hidden = !isActive;
    });

    viewMoreLinks.forEach((link, linkIndex) => {
      link.hidden = linkIndex !== index;
      link.classList.toggle('is-active', linkIndex === index);
    });

    if (animate) {
      const track = this.refs.tracks?.[index];
      track?.scrollTo({ left: 0, behavior: 'smooth' });
    }
  }

  /**
   * @param {number} panelIndex
   * @param {number} direction
   */
  #scrollTrack(panelIndex, direction) {
    const track = this.refs.tracks?.[panelIndex];
    if (!track) return;

    const firstSlide = track.querySelector('.ws-tab-collections__slide');
    if (!firstSlide) return;

    const gap = parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap || '0') || 0;
    const scrollAmount = firstSlide.getBoundingClientRect().width + gap;

    track.scrollBy({
      left: direction * scrollAmount,
      behavior: 'smooth',
    });
  }
}

if (!customElements.get('ws-tab-collections')) {
  customElements.define('ws-tab-collections', WsTabCollections);
}
