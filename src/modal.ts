import { customElement } from "lit/decorators.js";
import { TwElement } from "./tw-element";
import { html } from "lit";

@customElement("ext-modal")
export class ExtModal extends TwElement {
  connectedCallback() {
    super.connectedCallback();
    document.addEventListener("keydown", this.handleKeydown);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener("keydown", this.handleKeydown);
  }

  render() {
    return html`
      <div class="fixed left-0 w-full h-full top-0 bg-gray-200 dark:bg-zinc-900 p-3 overflow-y-auto overflow-x-hidden">
        <div class="flex justify-end pb-3">
          <button
            class="w-8 h-8 flex items-center justify-center rounded-md text-gray-600 dark:text-gray-200 hover:bg-gray-300 active:bg-gray-400 dark:hover:bg-zinc-700 dark:active:bg-zinc-800"
            title="Close modal"
            @click=${this.emitClose}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              class="w-6 h-6"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>

            <span class="sr-only">Close overlay</span>
          </button>
        </div>
        <slot></slot>
      </div>
    `;
  }

  private emitClose() {
    this.dispatchEvent(new CustomEvent("close"));
  }

  private handleKeydown = (event: KeyboardEvent) => {
    event.key === "Escape" && this.emitClose();
  };
}
