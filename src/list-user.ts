import { customElement, property } from "lit/decorators.js";
import { TwElement } from "./tw-element";
import { TemplateResult, html } from "lit";
import { RenderableUser, Stream } from "./twitch";
import type Fuse from "fuse.js";
import { when } from "lit/directives/when.js";

@customElement("ext-list-user")
export class ExtListUser extends TwElement {
  @property()
  private stream: Stream | null = null;

  @property()
  private user!: RenderableUser;

  @property()
  private fuseMatches: Fuse.FuseResultMatch[] = [];

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
          <span
            class="pl-3 truncate flex-1 min-w-0 text-xs dark:text-gray-200"
            tabindex="0"
            aria-label="${this.user.label}"
            >${renderHighlightedText(this.user.label, this.fuseMatches)}</span
          >
        </div>
        ${when(
          !!this.stream,
          () => html`
            <div class="flex items-center">
              <div class="w-2 h-2 rounded-full bg-red-600"></div>
              <span
                class="text-gray-700 dark:text-gray-300 pl-2 text-xs font-bold"
                tabindex="0"
                aria-label="${this.stream!.viewer_count} viewers"
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
