import { customElement } from "lit/decorators.js";
import { TwElement } from "./tw-element";
import { html } from "lit";

@customElement("ext-list-user-placeholder")
export class ExtListUserPlaceholder extends TwElement {
  render() {
    return html`
      <div class="p-1 flex items-center">
        <div class="rounded-full w-[30px] h-[30px] bg-gray-300 dark:bg-zinc-900"></div>
        <div class="pl-3">
          <div class="w-40 h-3 rounded-md bg-gray-300 dark:bg-zinc-900"></div>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ext-list-user-placeholder": ExtListUserPlaceholder;
  }
}
