import { customElement, property } from "lit/decorators.js";
import { TwElement } from "./tw-element";
import { html } from "lit";
import { RenderableUser, followEvents } from "./twitch";
import { EmitterController } from "./emitters";
import { classMap } from "lit/directives/class-map.js";
import { when } from "lit/directives/when.js";

@customElement("ext-follow-button")
export class ExtFollowButton extends TwElement {
  controller = new EmitterController(this, followEvents, ({ login }) => this.handleFollow(login));

  @property()
  private user!: RenderableUser;

  @property()
  private following = false;

  render() {
    return html`
      <button
        class="rounded-md  text-white  px-1 w-7 h-7 flex items-center justify-center ${classMap({
          "bg-purple-500": !this.following,
          "hover:bg-purple-400": !this.following,
          "active:bg-purple-600": !this.following,
          "bg-green-600": this.following,
        })}"
        @click=${this.handleClick}
        title="Follow channel"
      >
        ${when(
          this.following,
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
          () => html`
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              class="w-4 h-4"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
              />
            </svg>
          `,
        )}

        <span class="sr-only">Follow ${this.user.label}</span>
      </button>
    `;
  }

  private handleClick = (event: MouseEvent) => {
    event.preventDefault();
    window.Twitch.ext.actions.followChannel(this.user.login);
  };

  private handleFollow = (login: string) => {
    if (login !== this.user.login) return;
    this.following = true;
  };
}

declare global {
  interface HTMLElementTagNameMap {
    "ext-follow-button": ExtFollowButton;
  }
}
