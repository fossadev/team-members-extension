import { customElement, property } from "lit/decorators.js";
import { TwElement } from "./tw-element";
import { html } from "lit";
import { CachedEmitterController } from "./cached-emitter";
import { authorizedEvents } from "./twitch";
import { when } from "lit/directives/when.js";

import "./loading-spinner";
import "./teams/team-manager";

@customElement("ext-root")
export class ExtRoot extends TwElement {
  private authContext = new CachedEmitterController(this, authorizedEvents);

  @property()
  theme: Twitch.ext.Context["theme"] = "light";

  render() {
    return html`
      <main class="fixed w-full h-full top-0 left-0 bg-gray-200 dark:bg-stone-950 p-4">
        ${when(
          !!this.authContext?.value,
          () => html`<ext-team-manager></ext-team-manager>`,
          () => html`<ext-loading-spinner></ext-loading-spinner>`,
        )}
      </main>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ext-root": ExtRoot;
  }
}
