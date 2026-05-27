import { Component } from '@theme/component';

/**
 * @typedef {object} WsTabCollectionsRefs
 * @property {HTMLButtonElement[]} tabButtons
 * @property {HTMLElement[]} tabPanels
 * @property {HTMLAnchorElement[]} viewMoreLinks
 */
export class WsTabCollections extends Component {
  connectedCallback() {
    super.connectedCallback();

    this.refs.tabButtons?.forEach((button, index) => {
      button.addEventListener('click', (event) => {
        event.preventDefault();
        this.#setActiveTab(index);
      });
    });
  }

  /**
   * @param {number} index
   */
  #setActiveTab(index) {
    const { tabButtons = [], tabPanels = [], viewMoreLinks = [] } = this.refs;
    if (!tabButtons[index] || !tabPanels[index]) return;

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
    });
  }
}

if (!customElements.get('ws-tab-collections')) {
  customElements.define('ws-tab-collections', WsTabCollections);
}
