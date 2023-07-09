import { customElement, property } from "lit/decorators.js";
import { TwElement } from "../tw-element";
import { html } from "lit";
import { BroadcasterTeam } from "../twitch";
import { when } from "lit/directives/when.js";

import "./team-select-menu";

@customElement("ext-team-selector")
export class ExtTeamSelector extends TwElement {
  @property()
  private selectedTeamId = "";

  @property()
  private teams: BroadcasterTeam[] = [];

  @property()
  private open = false;

  connectedCallback() {
    super.connectedCallback();
    document.addEventListener("click", this.handleOutsideClick);
    document.addEventListener("focus", this.handleOutsideClick);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener("click", this.handleOutsideClick);
    document.removeEventListener("focus", this.handleOutsideClick);
  }

  render() {
    const selectedTeam = this.teams.find((t) => t.id === this.selectedTeamId);
    if (!selectedTeam) {
      return html`<div></div>`;
    }

    return html`
      <div class="relative">
        <button
          class="block rounded-md w-full p-2 outline-none hover:bg-white active:bg-gray-300 focus:ring-2 focus:ring-blue-500 dark:hover:bg-neutral-700 dark:active:bg-neutral-900"
          @click=${this.handleButtonClick}
          id="selector"
        >
          <div class="flex items-center">
            <img
              src="${selectedTeam.thumbnail_url}"
              alt="${selectedTeam.team_name} avatar"
              class="h-10 w-10"
              loading="lazy"
            />
            <div class="flex min-w-0 flex-1 flex-col px-3">
              <span class="truncate text-sm font-medium text-gray-900 dark:text-zinc-300">Selected Team</span>
              <span class="truncate text-xs font-bold text-black dark:text-white">
                ${selectedTeam.team_display_name}
              </span>
            </div>
            <div class="text-gray-600 dark:text-zinc-500">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
                class="w-6 h-6"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9"
                />
              </svg>
            </div>
          </div>
        </button>

        ${when(
          this.open,
          () => html`
            <div class="absolute top-16 z-50 w-full">
              <ext-select-team-menu
                .teams=${this.teams}
                .selectedTeamId=${this.selectedTeamId}
                @close-menu=${this.handleCloseMenu}
                @change=${this.handleSelectTeam}
              ></ext-select-team-menu>
            </div>
          `,
        )}
      </div>
    `;
  }

  private handleButtonClick = (event: MouseEvent) => {
    event.preventDefault();
    this.open = !this.open;
  };

  private handleSelectTeam = (event: CustomEvent<{ teamId: string }>) => {
    const teamId = event.detail?.teamId;
    if (!teamId) return;

    this.dispatchEvent(new CustomEvent("change", { detail: { teamId } }));
    this.handleCloseMenu();
  };

  private handleOutsideClick = (event: MouseEvent | FocusEvent) => {
    if (!event.composedPath().includes(this) && this.open) {
      this.handleCloseMenu();
    }
  };

  private handleCloseMenu = () => {
    if (!this.open) return;

    this.open = false;
    this.shadowRoot?.getElementById("selector")?.focus();
  };
}

declare global {
  interface HTMLElementTagNameMap {
    "ext-team-selector": ExtTeamSelector;
  }
}
