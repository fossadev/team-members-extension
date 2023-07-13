import { customElement } from "lit/decorators.js";
import { TwElement } from "../tw-element";
import { html } from "lit";

@customElement("ext-team-filter-placeholder")
export class ExtTeamFilterPlaceholder extends TwElement {
  render() {
    return html`
      <div class="flex items-center">
        <div class="block w-full h-[34px] rounded-md bg-gray-300 dark:bg-zinc-900"></div>
        <div class="pl-2">
          <div class="w-8 h-8 rounded bg-gray-300 dark:bg-zinc-900"></div>
        </div>
      </div>
    `;
  }
}
