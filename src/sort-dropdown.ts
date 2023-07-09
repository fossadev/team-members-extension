import { customElement, property } from "lit/decorators.js";
import { TwElement } from "./tw-element";
import { html } from "lit";
import { when } from "lit/directives/when.js";
import { classMap } from "lit/directives/class-map.js";

export type SortType = "a-z" | "z-a" | "live-asc" | "live-desc";

@customElement("ext-sort-dropdown")
export class ExtSortDropdown extends TwElement {
  @property()
  private open = false;

  @property()
  private type: SortType = "a-z";

  connectedCallback() {
    super.connectedCallback();
    document.addEventListener("keydown", this.handleKeydown);
    document.addEventListener("click", this.handleOutsideClick);
    document.addEventListener("focusin", this.handleOutsideClick);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener("keydown", this.handleKeydown);
    document.removeEventListener("click", this.handleOutsideClick);
    document.removeEventListener("focusin", this.handleOutsideClick);
  }

  render() {
    return html`
      <div class="relative">
        <button
          class="p-0.25 rounded text-gray-800 dark:text-zinc-400 outline-none focus:ring-2 focus:ring-blue-500 flex justify-center items-center hover:bg-gray-300 dark:hover:bg-zinc-800 active:bg-gray-400 dark:active:bg-zinc-700${classMap(
            {
              "bg-gray-300": this.open,
              "dark:bg-zinc-800": this.open,
            },
          )}"
          title="Toggle filter dropdown"
          id="selector"
          @click=${this.handleButtonClick}
        >
          <div class="flex items-center justify-center h-8 w-8">
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
                d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75"
              />
            </svg>

            <span class="sr-only">Toggle filter dropdown</span>
          </div>
        </button>

        ${when(
          this.open,
          () => html`
            <div class="absolute right-0 top-9 z-50 pt-1">
              <div
                class="max-h-40 p-1 w-56 rounded-lg shadow-md bg-white dark:border dark:border-neutral-600 dark:bg-neutral-700"
                id="menu"
              >
                <ext-sort-option .selected=${this.type === "a-z"} type="a-z" @change=${this.handleButtonChange}
                  >By name (a-z)</ext-sort-option
                >
                <ext-sort-option .selected=${this.type === "z-a"} type="z-a" @change=${this.handleButtonChange}
                  >By name (z-a)</ext-sort-option
                >
                <ext-sort-option
                  .selected=${this.type === "live-desc"}
                  type="live-desc"
                  @change=${this.handleButtonChange}
                  >Viewers (High to Low)</ext-sort-option
                >
                <ext-sort-option
                  .selected=${this.type === "live-asc"}
                  type="live-asc"
                  @change=${this.handleButtonChange}
                  >Viewers (Low to High)</ext-sort-option
                >
              </div>
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
        this.handleCloseMenu();
        break;
      }
    }
  };

  private handleButtonChange = (event: CustomEvent<SortType>) => {
    this.dispatchEvent(new CustomEvent("change", { detail: event.detail }));
    this.handleCloseMenu();
  };

  private switchFocus(down: boolean) {
    if (!this.open) return;

    const activeElement = this.shadowRoot?.activeElement || document.activeElement;
    if (!activeElement) return;

    const items = this.shadowRoot?.getElementById("menu")?.children;
    if (!items) return;

    const currentIndex = Array.from(items).indexOf(activeElement);
    if (currentIndex === -1) {
      (items.item(0) as HTMLElement)?.shadowRoot?.getElementById("button")?.focus();
      return;
    }

    if (down) {
      if (currentIndex < items.length - 1) {
        (items.item(currentIndex + 1) as HTMLElement)?.shadowRoot?.getElementById("button")?.focus();
      }
    } else {
      if (currentIndex > 0) {
        (items.item(currentIndex - 1) as HTMLElement)?.shadowRoot?.getElementById("button")?.focus();
      }
    }
  }
}

@customElement("ext-sort-option")
export class ExtSortOption extends TwElement {
  @property()
  private selected = false;

  @property()
  private type!: SortType;

  render() {
    return html`
      <button
        role="option"
        class="pl-3 pr-2 w-full h-9 rounded-md text-sm ${classMap({
          "text-black": !this.selected,
          "dark:text-gray-100": !this.selected,
          "hover:bg-gray-200": !this.selected,
          "active:bg-gray-300": !this.selected,
          "dark:hover:bg-neutral-800": !this.selected,
          "dark:active:bg-neutral-900": !this.selected,
          "bg-blue-500": this.selected,
          "text-white": this.selected,
        })}"
        @click=${this.handleClick}
        tabindex="0"
        id="button"
      >
        <div class="flex items-center justify-between">
          <span><slot></slot></span>
          ${when(
            this.selected,
            () => html`
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
                class="w-4 h-4"
              >
                <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            `,
          )}
        </div>
      </button>
    `;
  }

  private handleClick = (event: MouseEvent) => {
    event.preventDefault();
    this.dispatchEvent(new CustomEvent("change", { detail: this.type }));
  };
}

declare global {
  interface HTMLElementTagNameMap {
    "ext-sort-dropdown": ExtSortDropdown;
    "ext-sort-option": ExtSortOption;
  }
}
