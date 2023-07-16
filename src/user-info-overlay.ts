import { customElement, property } from "lit/decorators.js";
import { TwElement } from "./tw-element";
import { RenderableUser, Stream, binViewCount } from "./twitch";
import { html } from "lit";
import { when } from "lit/directives/when.js";

import "./follow-button";

const UpRightIcon = html`
  <svg
    xmlns="http://www.w3.org/2000/svg"
    height="12px"
    class="pl-1 inline text-gray-600 dark:text-zinc-500"
    viewBox="0 0 512 512"
  >
    <!--! Font Awesome Free 6.4.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. -->
    <path
      d="M352 0c-12.9 0-24.6 7.8-29.6 19.8s-2.2 25.7 6.9 34.9L370.7 96 201.4 265.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L416 141.3l41.4 41.4c9.2 9.2 22.9 11.9 34.9 6.9s19.8-16.6 19.8-29.6V32c0-17.7-14.3-32-32-32H352zM80 32C35.8 32 0 67.8 0 112V432c0 44.2 35.8 80 80 80H400c44.2 0 80-35.8 80-80V320c0-17.7-14.3-32-32-32s-32 14.3-32 32V432c0 8.8-7.2 16-16 16H80c-8.8 0-16-7.2-16-16V112c0-8.8 7.2-16 16-16H192c17.7 0 32-14.3 32-32s-14.3-32-32-32H80z"
      fill="currentColor"
    />
  </svg>
`;

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
                  <h2 class="text-black font-bold text-xs line-clamp-2 dark:text-white">
                    ${this.stream!.title} ${UpRightIcon}
                  </h2>
                </a>
              </div>
            `,
          )}
          <div class="pb-4">
            <div class="flex items-center">
              <div class="w-10 h-10 flex-shrink-0 bg-gray-300 dark:bg-zinc-800 rounded-full overflow-hidden">
                <a
                  href="${renderStreamURL(this.user.login)}"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="cursor-pointer"
                >
                  <img src="${this.user.profile_image_url}" alt="${this.user.label}" width="40" height="40" />
                </a>
              </div>
              <div class="px-3 min-w-0">
                <a
                  href="${renderStreamURL(this.user.login)}"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="cursor-pointer"
                >
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
