class ScrollImageSequenceElement extends HTMLElement {
  static observedAttributes = [
    "images",
    "frame-height",
    "total-scroll-height",
    "object-fit",
    "sticky",
  ];

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.currentFrame = 0;
    this.rafId = 0;
    this.preloaded = [];
    this.handleScroll = this.handleScroll.bind(this);
  }

  connectedCallback() {
    this.render();
  }

  disconnectedCallback() {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.preloaded = [];
  }

  attributeChangedCallback() {
    if (this.isConnected) this.render();
  }

  get images() {
    const attr = this.getAttribute("images") || "";
    return attr
      .split(",")
      .map((src) => src.trim())
      .filter(Boolean)
      .slice(0, 65);
  }

  get frameHeight() {
    return this.getAttribute("frame-height") || "100vh";
  }

  get totalScrollHeight() {
    return this.getAttribute("total-scroll-height") || "420vh";
  }

  get objectFit() {
    return this.getAttribute("object-fit") || "cover";
  }

  get sticky() {
    return this.getAttribute("sticky") !== "false";
  }

  preload(images) {
    this.preloaded = images.map((src) => {
      const image = new Image();
      image.decoding = "async";
      image.src = src;
      return image;
    });
  }

  syncFrame() {
    this.rafId = 0;
    if (!this.scroller || this.images.length <= 1) {
      this.setFrame(0);
      return;
    }

    const maxScroll = Math.max(1, this.scroller.scrollHeight - this.scroller.clientHeight);
    const progress = Math.min(1, Math.max(0, this.scroller.scrollTop / maxScroll));
    this.setFrame(Math.round(progress * (this.images.length - 1)));
  }

  setFrame(index) {
    if (!this.image || index === this.currentFrame) return;
    this.currentFrame = index;
    this.image.src = this.images[index] || this.images[0] || "";
  }

  handleScroll() {
    if (this.rafId) return;
    this.rafId = requestAnimationFrame(() => this.syncFrame());
  }

  render() {
    const images = this.images;
    this.preload(images);

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          width: 100%;
          height: ${this.frameHeight};
          overflow: hidden;
        }

        .scroller {
          height: 100%;
          overflow-y: auto;
          overflow-x: hidden;
          overscroll-behavior: contain;
          scrollbar-gutter: stable;
        }

        .scroll-space {
          position: relative;
          min-height: ${this.totalScrollHeight};
        }

        .preview {
          position: ${this.sticky ? "sticky" : "relative"};
          top: 0;
          width: 100%;
          height: ${this.frameHeight};
          overflow: hidden;
          background: #020713;
        }

        img {
          display: block;
          width: 100%;
          height: 100%;
          object-fit: ${this.objectFit};
          user-select: none;
          pointer-events: none;
        }

        @media (max-width: 760px) {
          :host {
            height: min(${this.frameHeight}, 100svh);
          }

          .preview {
            height: min(${this.frameHeight}, 100svh);
          }
        }
      </style>
      <div class="scroller" part="scroller">
        <div class="scroll-space" part="scroll-space">
          <div class="preview" part="preview">
            <img part="image" alt="" aria-hidden="true" draggable="false" decoding="async" src="${images[0] || ""}" />
          </div>
        </div>
      </div>
    `;

    this.scroller = this.shadowRoot.querySelector(".scroller");
    this.image = this.shadowRoot.querySelector("img");
    this.currentFrame = 0;
    this.scroller.addEventListener("scroll", this.handleScroll, { passive: true });
  }
}

if (!customElements.get("scroll-image-sequence")) {
  customElements.define("scroll-image-sequence", ScrollImageSequenceElement);
}

