import { customElement, property } from "lit/decorators.js";
import { TwElement } from "./tw-element";
import { html } from "lit";
import { Stream, User } from "./twitch";
import { when } from "lit/directives/when.js";

@customElement("ext-list-user")
export class ExtListUser extends TwElement {
  @property()
  private stream: Stream | null = null;

  @property()
  private user!: User;

  render() {
    if (!this.user) return null;

    return html`
      <div class="flex items-center">
        <div class="flex items-center flex-1 min-w-0">
          <img
            src="${this.user.profile_image_url}"
            alt="${this.user.display_name}"
            width="30"
            height="30"
            loading="lazy"
            class="rounded-full"
          />
          <span class="pl-3 truncate flex-1 min-w-0 text-xs dark:text-gray-200">${renderDisplayName(this.user)}</span>
        </div>
        ${when(
          !!this.stream,
          () => html`
            <div class="flex items-center">
              <div class="w-2 h-2 rounded-full bg-red-600"></div>
              <span class="text-gray-700 dark:text-gray-300 pl-2 text-xs font-bold"
                >${renderViewerCount(this.stream!.viewer_count)}</span
              >
            </div>
          `,
        )}
      </div>
    `;
  }
}

function renderViewerCount(viewCount: number) {
  if (viewCount >= 1_000_000) {
    return `${(viewCount / 1_000_000).toPrecision(1)}M`;
  }
  if (viewCount >= 1_000) {
    return `${(viewCount / 1_000).toPrecision(1)}M`;
  }
  return viewCount.toString();
}

function renderDisplayName(user: User) {
  if (user.display_name.toLowerCase() === user.login) {
    return user.display_name;
  }
  return `${user.display_name} (${user.login})`;
}

declare global {
  interface HTMLElementTagNameMap {
    "ext-list-user": ExtListUser;
  }
}
