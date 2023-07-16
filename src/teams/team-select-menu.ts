import { customElement, property } from "lit/decorators.js";
import { TwElement } from "../tw-element";
import { html } from "lit";
import { BroadcasterTeam } from "../twitch";
import { repeat } from "lit/directives/repeat.js";

@customElement("ext-select-team-menu")
export class ExtSelectTeamMenu extends TwElement {
  @property()
  private selectedTeamId = "";

  @property()
  private teams: BroadcasterTeam[] = [];

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
      <div
        class="max-h-40 p-2 divide-gray-200 rounded-lg bg-white shadow-lg border dark:border-neutral-600 ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-neutral-700 overflow-y-auto"
      >
        <ul class="list-none" role="listbox" tabindex="-1" id="menu">
          ${repeat(
            this.teams.sort((a, b) =>
              a.team_display_name.toLowerCase().localeCompare(b.team_display_name.toLowerCase()),
            ),
            (team) => team.id,
            (team) => html`
              <li
                class="rounded-md hover:bg-gray-200 dark:hover:bg-neutral-800 active:bg-gray-300 dark:active:bg-neutral-900 block p-2 w-full my-0.5 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                tabindex="${this.selectedTeamId === team.id ? "0" : "-1"}"
                role="option"
                aria-selected="${this.selectedTeamId === team.id}"
                data-value="${team.id}"
                @click=${this.handleSelect}
              >
                <div class="flex items-center">
                  <img
                    src="${team.thumbnail_url}"
                    width="20"
                    height="20"
                    loading="lazy"
                    alt="${team.team_display_name}"
                    class="block"
                  />
                  <div class="flex-1 min-w-0 pl-3 text-left">
                    <span class="text-xs text-black dark:text-white block truncate">${team.team_display_name}</span>
                  </div>
                </div>
              </li>
            `,
          )}
        </ul>
      </div>
    `;
  }

  private handleSelect = (event: MouseEvent) => {
    event.preventDefault();
    const teamId = (event.currentTarget as HTMLElement)?.dataset?.value;
    if (!teamId) return;

    this.dispatchEvent(
      new CustomEvent("change", {
        detail: { teamId },
      }),
    );
  };

  private handleKeydown = (event: KeyboardEvent) => {
    switch (event.key) {
      case "ArrowDown": {
        this.switchFocus(true);
        break;
      }

      case "ArrowUp": {
        this.switchFocus(false);
        break;
      }

      case "Escape": {
        this.dispatchEvent(new CustomEvent("close-menu"));
        break;
      }

      case "Space":
      case "Enter": {
        event.preventDefault();
        this.attemptKeyboardSelection();
        break;
      }
    }
  };

  private attemptKeyboardSelection() {
    const activeElement = this.shadowRoot?.activeElement;
    if (!activeElement) return;

    const teamId = (activeElement as HTMLElement)?.dataset.value;

    this.dispatchEvent(
      new CustomEvent("change", {
        detail: { teamId },
      }),
    );
  }

  private switchFocus(down: boolean) {
    // turns out *good* keyboard navigation is pretty hard to do right
    // - this is mostly shared with the sort-dropdown code, i'll consolidate these later

    const activeElement = this.shadowRoot?.activeElement || document.activeElement;
    if (!activeElement) return;

    const items = this.shadowRoot?.getElementById("menu")?.children;
    if (!items) return;

    const currentIndex = Array.from(items).indexOf(activeElement);
    if (currentIndex === -1) {
      (items.item(0) as HTMLElement)?.focus();
      return;
    }

    if (down) {
      if (currentIndex < items.length - 1) {
        (items.item(currentIndex + 1) as HTMLElement)?.focus();
      }
    } else {
      if (currentIndex > 0) {
        (items.item(currentIndex - 1) as HTMLElement)?.focus();
      }
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ext-select-team-view": ExtSelectTeamMenu;
  }
}
