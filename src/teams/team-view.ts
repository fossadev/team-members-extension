import { customElement, property } from "lit/decorators.js";
import { TwElement } from "../tw-element";
import { html } from "lit";
import {
  RenderableUser,
  Stream,
  Team,
  authorizedEvents,
  generateRenderableUser,
  getStreams,
  getTeam,
  getUsers,
} from "../twitch";
import { CachedEmitterController } from "../emitters";
import { classMap } from "lit/directives/class-map.js";
import { repeat } from "lit/directives/repeat.js";

import "../list-user";
import "./team-filter";
import { TeamFilterParams } from "./team-filter";
import Fuse from "fuse.js";

interface TeamCache {
  team: Team;
  users: RenderableUser[];
  userIndex: Fuse<RenderableUser>;
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
    const users = (
      await Promise.all(
        chunkArray(
          team.users.map((u) => u.user_id),
          100,
        ).map((ids) => getUsers(ids, auth)),
      )
    ).reduce((acc: RenderableUser[], cur) => {
      acc.push(...cur.map((v) => generateRenderableUser(v)));
      return acc;
    }, [] as RenderableUser[]);

    return {
      team: team,
      users: users,
      userIndex: new Fuse([...users], {
        keys: ["label"],
        shouldSort: false,
        includeMatches: true,
      }),
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

interface FilteredUser {
  item: RenderableUser;
  matches?: readonly Fuse.FuseResultMatch[];
}

function applyFilters(teamData: TeamCache, streamData: StreamCache, filterParams: TeamFilterParams) {
  // apply any fuzzy searches if requested
  let users: FilteredUser[] =
    filterParams.search.length > 0
      ? teamData.userIndex.search(filterParams.search)
      : teamData.users.map((v) => ({ item: v, matches: [] }));

  // lastly, sort the results accordingly
  switch (filterParams.sortBy) {
    case "a-z": {
      return users.sort((a, b) => a.item.login.localeCompare(b.item.login));
    }

    case "z-a": {
      return users.sort((a, b) => b.item.login.localeCompare(a.item.login));
    }

    case "live-asc":
    case "live-desc": {
      return sortByLiveStatus(users, streamData, filterParams.sortBy === "live-asc");
    }

    default: {
      // could not find a sort option, this means something fucked up at runtime
      return users;
    }
  }
}

function sortByLiveStatus(users: FilteredUser[], streamData: StreamCache, sortAscending: boolean) {
  // break down the full list into a set of users who are live and offline, we apply different sorting in these modes
  // depending on whether the user is live or not - we always prioritise live users first in the list.
  const out = users.reduce(
    (acc, cur) => {
      !!streamData.streamsMap[cur.item.id] ? acc.liveUsers.push(cur) : acc.offlineUsers.push(cur);
      return acc;
    },
    {
      liveUsers: [] as FilteredUser[],
      offlineUsers: [] as FilteredUser[],
    },
  );

  // live users are sorted by user chosen index
  out.liveUsers = out.liveUsers.sort((a, b) => {
    const streamA = streamData.streamsMap[a.item.id];
    const streamB = streamData.streamsMap[b.item.id];
    if (!(streamA && streamB)) {
      return 0;
    }

    if (streamA.viewer_count > streamB.viewer_count) return sortAscending ? 1 : -1;
    if (streamA.viewer_count < streamB.viewer_count) return sortAscending ? -1 : 1;
    return 0;
  });

  // offline users when in live only are sorted alphabetically when in live sort modes
  out.offlineUsers = out.offlineUsers.sort((a, b) => a.item.login.localeCompare(b.item.login));

  // combine the separate list, the outcome is a prioritised list where live user selections show up first
  return [...out.liveUsers, ...out.offlineUsers];
}

@customElement("ext-team-view")
export class ExtTeamView extends TwElement {
  private authContext = new CachedEmitterController(this, authorizedEvents);

  @property()
  private filterParams: TeamFilterParams = {
    search: "",
    sortBy: "a-z",
  };

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
      <div class="flex-1 h-full min-h-0 w-full flex flex-col">
        <div class="pb-3">
          <ext-team-filter .params=${this.filterParams} @change=${this.handleFilterChange}></ext-team-filter>
        </div>
        <div class="overflow-y-auto flex-1 min-h-0">
          <ul
            class="${classMap({
              "list-none": true,
              "opacity-75": this.teamId !== this.teamData.team.id,
            })}"
            role="list"
          >
            ${repeat(
              applyFilters(this.teamData, this.streamCache || { nextUpdateDue: 0, streamsMap: {} }, this.filterParams),
              (user) => user.item.id,
              (user) => html`
                <li role="listitem">
                  <ext-list-user
                    .user=${user.item}
                    .fuseMatches=${user.matches}
                    .stream=${this.streamCache?.streamsMap[user.item.id] || null}
                  ></ext-list-user>
                </li>
              `,
            )}
          </ul>
        </div>
      </div>
    `;
  }

  private handleFilterChange = (event: CustomEvent<TeamFilterParams>) => {
    this.filterParams = event.detail;
  };

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
