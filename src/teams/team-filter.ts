import { customElement, property } from "lit/decorators.js";
import { TwElement } from "../tw-element";
import { html } from "lit";
import { live } from "lit/directives/live.js";

import "../sort-dropdown";
import { SortType } from "../sort-dropdown";

export interface TeamFilterParams {
  search: string;
  sortBy: SortType;
}

@customElement("ext-team-filter")
export class ExtTeamFilter extends TwElement {
  @property()
  private params!: TeamFilterParams;

  render() {
    return html`
      <div class="flex items-center">
        <input
          type="text"
          class="block w-full rounded-md border border-gray-300 bg-white py-1.5 px-3 outline-none focus:border-blue-500 dark:border-neutral-500 dark:bg-neutral-700 dark:text-gray-100 dark:focus:border-blue-500 text-sm"
          placeholder="Search users..."
          .value=${live(this.params.search)}
          @change=${this.handleInputChange}
          @input=${this.handleInputChange}
        />
        <div class="pl-2">
          <ext-sort-dropdown .type=${this.params.sortBy} @change=${this.handleSortChange}></ext-sort-dropdown>
        </div>
      </div>
    `;
  }

  private handleInputChange = (event: Event) => {
    this.emitChange({ search: (event.target as HTMLInputElement).value });
  };

  private handleSortChange = (event: CustomEvent<SortType>) => {
    this.emitChange({ sortBy: event.detail });
  };

  private emitChange(changed: Partial<TeamFilterParams>) {
    this.dispatchEvent(
      new CustomEvent("change", {
        detail: { ...this.params, ...changed },
      }),
    );
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ext-team-filter": ExtTeamFilter;
  }
}
