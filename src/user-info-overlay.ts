import { customElement, property } from "lit/decorators.js";
import { TwElement } from "./tw-element";
import { RenderableUser, Stream, binViewCount } from "./twitch";
import { html } from "lit";
import { when } from "lit/directives/when.js";

import "./follow-button";

@customElement("ext-user-info-overlay")
export class ExtUserInfoOverlay extends TwElement {
  @property()
  private user!: RenderableUser;

  @property()
  private stream: Stream | null = null;

  render() {
    return html`
      <ext-portal>
        <ext-modal @close=${this.handleClose}>
          ${when(
            !!this.stream,
            () => html`
              <div class="pb-4">
                <a href="${renderStreamURL(this.user.login)}" target="_blank" rel="noopener noreferrer">
                  <div class="pb-2">
                    <div
                      class="aspect-video relative rounded-md overflow-hidden bg-gray-300 dark:bg-zinc-800 shadow-lg"
                    >
                      <img
                        src="${renderStreamThumbnail(this.stream!.thumbnail_url)}"
                        class="absolute left-0 top-0 w-full h-full"
                        alt="${this.user.label} stream thumbnail"
                      />
                    </div>
                  </div>
                  <h2 class="text-black font-bold text-xs line-clamp-2 dark:text-white">${this.stream!.title}</h2>
                </a>
              </div>
            `,
          )}
          <div class="pb-4">
            <div class="flex items-center">
              <div class="w-10 h-10 flex-shrink-0 bg-gray-300 dark:bg-zinc-800 rounded-full overflow-hidden">
                <a href="${renderStreamURL(this.user.login)}" target="_blank" rel="noopener noreferrer">
                  <img src="${this.user.profile_image_url}" alt="${this.user.label}" width="40" height="40" />
                </a>
              </div>
              <div class="px-3 min-w-0">
                <a href="${renderStreamURL(this.user.login)}" target="_blank" rel="noopener noreferrer">
                  <h1 class="text-black font-bold text-sm dark:text-white truncate">${this.user.label}</h1>
                </a>
                ${when(
                  this.stream,
                  () => html`
                    <p class="text-[11px] text-gray-600 dark:text-gray-200">
                      ${this.stream!.game_name} | ${binViewCount(this.stream!.viewer_count)} viewers
                    </p>
                  `,
                )}
              </div>
              <div class="flex-shrink-0 ml-auto">
                <ext-follow-button .user=${this.user}></ext-follow-button>
              </div>
            </div>
          </div>
          <div class="p-4 rounded-lg bg-gray-300 dark:bg-zinc-800">
            <h3 class="uppercase text-xs font-bold truncate pb-3 text-gray-800 dark:text-gray-300">
              About ${this.user.display_name}
            </h3>

            <p class="text-sm text-black dark:text-white">${this.user?.description || "<no bio>"}</p>
          </div>
        </ext-modal>
      </ext-portal>
    `;
  }

  private handleClose = () => {
    this.dispatchEvent(new CustomEvent("close"));
  };
}

function renderStreamThumbnail(thumbnailURL: string) {
  return thumbnailURL.replace("{width}", "294").replace("{height}", "165");
}

function renderStreamURL(login: string) {
  return "https://twitch.tv/" + login;
}

declare global {
  interface HTMLElementTagNameMap {
    "ext-user-info-overlay": ExtUserInfoOverlay;
  }
}
