import { customElement, property } from "lit/decorators.js";
import { TwElement } from "../tw-element";
import { html } from "lit";
import { BroadcasterTeam, authorizedEvents, getBroadcasterTeams } from "../twitch";
import { CachedEmitterController } from "../cached-emitter";
import { when } from "lit/directives/when.js";

import "./team-selector";
import "./team-view";

@customElement("ext-team-manager")
export class ExtTeamManager extends TwElement {
  private authContext = new CachedEmitterController(this, authorizedEvents);

  @property()
  private broadcasterTeams: BroadcasterTeam[] | null = null;

  @property()
  private selectedTeamId: string | null = null;

  connectedCallback() {
    super.connectedCallback();

    if (!this.authContext?.value || this.broadcasterTeams !== null) return;
    getBroadcasterTeams(this.authContext.value.channelId, this.authContext.value).then((v) => {
      this.broadcasterTeams = v;
      !!v.length && (this.selectedTeamId = v[0].id);
    });
  }

  render() {
    if (this.broadcasterTeams === null) {
      return html`<ext-loading-spinner></ext-loading-spinner>`;
    }
    return html`
      <div class="flex flex-col flex-1 min-w-0 min-h-0 w-full h-full">
        <div class="pb-4">
          <ext-team-selector
            .selectedTeamId=${this.selectedTeamId || ""}
            .teams=${this.broadcasterTeams || []}
            @change=${this.handleTeamChange}
          ></ext-team-selector>
        </div>

        ${when(
          !!this.selectedTeamId,
          () => html`
            <div class="relative flex-1 min-h-0 overflow-auto">
              <ext-team-view .teamId=${this.selectedTeamId}></ext-team-view>
            </div>
          `,
        )}
      </div>
    `;
  }

  private handleTeamChange = (event: CustomEvent<{ teamId: string }>) => {
    const teamId = event?.detail?.teamId;
    if (!teamId) return;

    this.selectedTeamId = teamId;
  };
}

declare global {
  interface HTMLElementTagNameMap {
    "ext-team-manager": ExtTeamManager;
  }
}
