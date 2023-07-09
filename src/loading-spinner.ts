import { customElement } from "lit/decorators.js";
import { TwElement } from "./tw-element";
import { html } from "lit";

@customElement("ext-loading-spinner")
export class ExtLoadingSpinner extends TwElement {
  render() {
    return html`
      <div class="absolute w-full h-full left-0 top-0 flex items-center justify-center">
        <div class="inline-block mx-auto">
          <div
            class="border-4 border-solid rounded-full w-10 h-10 border-slate-400 dark:border-stone-700 border-r-blue-500 dark:border-r-blue-500 animate-spin"
          ></div>
          <span class="sr-only">Loading...</span>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ext-loading-spinner": ExtLoadingSpinner;
  }
}
