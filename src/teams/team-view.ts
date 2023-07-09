import { customElement, property } from "lit/decorators.js";
import { TwElement } from "../tw-element";
import { html } from "lit";
import { Stream, Team, User, authorizedEvents, getStreams, getTeam, getUsers } from "../twitch";
import { CachedEmitterController } from "../cached-emitter";
import { classMap } from "lit/directives/class-map.js";
import { repeat } from "lit/directives/repeat.js";

import "../list-user";

interface TeamCache {
  team: Team;
  users: User[];
}

interface StreamCache {
  nextUpdateDue: number;
  streamsMap: Record<string, Stream>;
}

const streamDataCache = new Map<string, StreamCache>();
const teamDataCache = new Map<string, TeamCache | null>();

async function fetchExtendedTeamData(teamId: string, auth: Twitch.ext.Authorized) {
  try {
    const team = await getTeam(teamId, auth);
    if (!team) {
      return null;
    }

    // the /users endpoint supports up to 100 users at once
    const users = await Promise.all(
      chunkArray(
        team.users.map((u) => u.user_id),
        100,
      ).map((ids) => getUsers(ids, auth)),
    );

    return {
      team: team,
      users: users
        .reduce((acc, cur) => {
          acc.push(...cur);
          return acc;
        }, [] as User[])
        .sort((a, b) => a.login.localeCompare(b.login)),
    };
  } catch (error) {
    console.error("Failed to load and hydrate team data", error);
    return null;
  }
}

function syncLiveStatus(userIds: string[], auth: Twitch.ext.Authorized) {
  return Promise.all(chunkArray(userIds, 100).map((chunk) => getStreams(chunk, auth)))
    .then(flattenArray)
    .catch((error) => {
      console.error("Failed to sync Twitch live status", error);
      return [] as Stream[];
    });
}

function randomValue(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function flattenArray<T>(input: T[][]) {
  return input.reduce((acc, cur) => {
    acc.push(...cur);
    return acc;
  }, [] as T[]);
}

function chunkArray<T>(arr: Array<T>, len: number) {
  const chunks = [];
  let i = 0;
  let n = arr.length;

  while (i < n) {
    chunks.push(arr.slice(i, (i += len)));
  }

  return chunks;
}

@customElement("ext-team-view")
export class ExtTeamView extends TwElement {
  private authContext = new CachedEmitterController(this, authorizedEvents);

  @property()
  private teamId?: string;

  @property()
  private teamData: TeamCache | null = null;

  @property()
  private streamCache: StreamCache | null = null;

  private timer?: ReturnType<typeof setTimeout>;

  disconnectedCallback() {
    super.disconnectedCallback();
    this.timer && clearTimeout(this.timer);
  }

  protected updated(changed: Map<string, string>): void {
    if (!changed.has("teamId") || !this.teamId) return;

    if (teamDataCache.has(this.teamId)) {
      // already cached data, skip
      this.teamData = teamDataCache.get(this.teamId) || null;
      return;
    }

    const teamId = this.teamId.toString();

    // on a cache miss, build a new cached team
    fetchExtendedTeamData(teamId, this.authContext.value!).then((data) => {
      teamDataCache.set(teamId, data);
      this.teamId?.toString() === teamId && (this.teamData = data);
      this.resetLiveData();
    });
  }

  render() {
    if (!this.teamData) {
      return html`<ext-loading-spinner></ext-loading-spinner>`;
    }

    return html`
      <ul
        class="${classMap({
          "list-none": true,
          "opacity-75": this.teamId !== this.teamData.team.id,
        })}"
      >
        ${repeat(
          this.teamData.users,
          (user) => user.id,
          (user) => html`
            <li class="py-1">
              <ext-list-user .user=${user} .stream=${this.streamCache?.streamsMap[user.id] || null}></ext-list-user>
            </li>
          `,
        )}
      </ul>
    `;
  }

  private resetLiveData() {
    if (!this.teamData?.team.id) return;

    const cachedData = streamDataCache.get(this.teamData.team.id);
    if (cachedData) {
      this.streamCache = cachedData;
    }

    // live status hydration is a lazy step in this component, punting to the next caller will ensure
    // we handle gracefully when twitch falls over, and reset jittered timers accordingly to back off or re-poll
    this.requestLiveStatusHydration();
  }

  private evictTimer() {
    this.timer && clearTimeout(this.timer);
  }

  private requestLiveStatusHydration() {
    if (!this.authContext.value || !this.teamData?.users) return;
    if (this.streamCache && this.streamCache.nextUpdateDue < Date.now()) {
      this.setupNextLivePoll();
      return;
    }

    const teamData = this.teamData;
    syncLiveStatus(
      teamData.users.map((u) => u.id),
      this.authContext.value,
    ).then((streams) => {
      const cachedItem: StreamCache = {
        // find a random time between the next 5 and 10 minutes, giving a jitter space
        // across all viewers of 5 minutes.
        //
        // this jitter helps reduce the burden to twitch when users spam refresh the page during
        // outages, rather than all viewers essentially polling at once and giving load spikes, we
        // can instead spread them out randomly across 5 minutes.
        nextUpdateDue: Date.now() + (300 + randomValue(0, 300) * 1000),
        streamsMap: streams.reduce(
          (acc, cur) => {
            acc[cur.user_id] = cur;
            return acc;
          },
          {} as Record<string, Stream>,
        ),
      };

      streamDataCache.set(teamData.team.id, cachedItem);
      teamData.team.id === this.teamData?.team.id && (this.streamCache = cachedItem);
    });
  }

  private setupNextLivePoll() {
    if (!this.streamCache) return;
    this.evictTimer();
    this.timer = setTimeout(() => this.requestLiveStatusHydration(), this.streamCache.nextUpdateDue - Date.now());
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ext-team-view": ExtTeamView;
  }
}
