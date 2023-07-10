import { css, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { EmitterController, createEmitter } from "./emitters";
import { repeat } from "lit/directives/repeat.js";
import { TwElement } from "./tw-element";

const portalEvents = createEmitter<{ type: "close"; id: string } | { type: "set"; content: Element[]; id: string }>();

function id() {
  return "xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

@customElement("ext-portal")
export class ExtPortal extends TwElement {
  static styles = css`
    :host {
      display: none;
    }
  `;

  private portalId = id();

  disconnectedCallback() {
    super.disconnectedCallback();

    portalEvents.emit({ type: "close", id: this.portalId });

    // reset portal id when unmounted
    this.portalId = id();
  }

  private projectSlot = (event: Event) => {
    const target = event.target as HTMLSlotElement;
    if (!target.assignedElements().length) return;

    // set new modal contents into portal
    portalEvents.emit({ type: "set", id: this.portalId, content: target.assignedElements() });
  };

  render() {
    return html`<slot @slotchange=${this.projectSlot}></slot>`;
  }
}

@customElement("ext-portal-root")
export class ExtPortalRoot extends TwElement {
  @property()
  private projectedRoots: Record<string, Element[]> = {};

  modalController = new EmitterController(this, portalEvents, (event) => {
    switch (event.type) {
      case "set": {
        this.projectedRoots[event.id] = event.content;
        this.requestUpdate();
        break;
      }

      case "close": {
        delete this.projectedRoots[event.id];
        this.requestUpdate();
        break;
      }
    }
  });

  render() {
    return html`${repeat(
      Object.entries(this.projectedRoots),
      ([k]) => k,
      ([, v]) => html`${v}`,
    )}`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ext-portal-root": ExtPortalRoot;
  }
}
