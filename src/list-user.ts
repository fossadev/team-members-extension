import { customElement, property } from "lit/decorators.js";
import { TwElement } from "./tw-element";
import { TemplateResult, html } from "lit";
import { RenderableUser, Stream, binViewCount } from "./twitch";
import type Fuse from "fuse.js";
import { when } from "lit/directives/when.js";

import "./user-info-overlay";

@customElement("ext-list-user")
export class ExtListUser extends TwElement {
  @property()
  private stream: Stream | null = null;

  @property()
  private user!: RenderableUser;

  @property()
  private fuseMatches: Fuse.FuseResultMatch[] = [];

  @property()
  private modalOpen = false;

  render() {
    if (!this.user) return null;

    return html`
      <div
        role="button"
        class="block cursor-pointer p-1 w-full rounded-md hover:bg-gray-100 active:bg-gray-300 dark:hover:bg-stone-800 dark:active:bg-stone-900"
        @click=${this.handleOpen}
        aria-label="${renderAriaLabel(this.user, this.stream)}"
        tabindex="0"
      >
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
            <span class="pl-3 truncate flex-1 min-w-0 text-xs dark:text-gray-200"
              >${renderHighlightedText(this.user.label, this.fuseMatches)}</span
            >
          </div>
          ${when(
            !!this.stream,
            () => html`
              <div class="flex items-center">
                <div class="w-2 h-2 rounded-full bg-red-600"></div>
                <span class="text-gray-700 dark:text-gray-300 pl-2 text-xs font-bold"
                  >${binViewCount(this.stream!.viewer_count)}</span
                >
              </div>
            `,
          )}
        </div>
      </div>

      ${when(
        this.modalOpen,
        () => html`
          <ext-user-info-overlay
            .stream=${this.stream}
            .user=${this.user}
            @close=${this.handleClose}
          ></ext-user-info-overlay>
        `,
      )}
    `;
  }

  private handleOpen = (event: MouseEvent) => {
    event.preventDefault();
    this.modalOpen = true;
  };

  private handleClose = () => {
    this.modalOpen = false;
  };
}

function renderAriaLabel(user: RenderableUser, stream: Stream | null) {
  return `${user.label}${stream ? `, live with ${stream.viewer_count} viewers` : ""}`;
}

function renderHighlightedText(content: string, matches: readonly Fuse.FuseResultMatch[]) {
  if (!matches?.length) {
    // if no matches given, we can simply render back the string - upstream there's a lit html template literal
    // which handles escaping, this saves a bunch of work in the rendering engine
    return content;
  }

  const s: (TemplateResult<1> | string | null)[] = Array.from(content);

  for (const match of matches) {
    for (const [start, end] of match.indices) {
      s[start] = html`<mark>${s.slice(start, end + 1)}</mark>`;

      // remove all others in highlight
      for (let k = start + 1; k <= end; ++k) {
        s[k] = null;
      }
    }
  }

  // implementing it this way ensures html is properly sanitized using lit's template engine
  return html`${s}`;
}

declare global {
  interface HTMLElementTagNameMap {
    "ext-list-user": ExtListUser;
  }
}
