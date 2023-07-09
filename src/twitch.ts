import { createCachedEmitter } from "./cached-emitter";

export const authorizedEvents = createCachedEmitter<Twitch.ext.Authorized>();
export const contextEvents = createCachedEmitter<Partial<Twitch.ext.Context>>();

// by setting a single entry point for these callbacks from the extension sdk, we can manage fanout on our own, and lazy components
// can immediately receive the latest value that Twitch has given us.
//
// Use the relevant EmitController instance in Lit elements to automatically manage subscriptions to the cache emit events
window.Twitch.ext.onAuthorized((v) => authorizedEvents.set(v));
window.Twitch.ext.onContext((v) => contextEvents.set(v));

interface DataResponse<T> {
  data: T;
}

export interface BroadcasterTeam {
  thumbnail_url: string;
  team_name: string;
  team_display_name: string;
  id: string;
}

export function getBroadcasterTeams(channelId: string, auth: Twitch.ext.Authorized) {
  return twitchRequest<DataResponse<BroadcasterTeam[]>>(
    "https://api.twitch.tv/helix/teams/channel",
    { broadcaster_id: channelId },
    auth,
  )
    .then((r) => r?.data || [])
    .catch(errorFallback("Failed to fetch broadcaster teams", [] as BroadcasterTeam[]));
}

export interface TeamUser {
  user_id: string;
  user_name: string;
  user_login: string;
}

export interface Team {
  team_name: string;
  team_display_name: string;
  id: string;
  thumbnail_url: string;
  users: TeamUser[];
}

export function getTeam(teamId: string, auth: Twitch.ext.Authorized) {
  return twitchRequest<DataResponse<Team[]>>("https://api.twitch.tv/helix/teams", { id: teamId }, auth)
    .then((r) => r?.data?.[0] || null)
    .catch(errorFallback("Failed to fetch team", null));
}

export interface Stream {
  id: string;
  user_id: string;
  user_login: string;
  user_name: string;
  type: "live" | "";
  title: string;
  viewer_count: number;
  started_at: string;
  thumbnail_url: string;
}

export function getStreams(userIds: string[], auth: Twitch.ext.Authorized) {
  return twitchRequest<DataResponse<Stream[]>>("https://api.twitch.tv/helix/streams", { user_id: userIds }, auth)
    .then((r) => r?.data || [])
    .catch(errorFallback("Failed to fetch Twitch streams", [] as Stream[]));
}

export interface User {
  id: string;
  login: string;
  display_name: string;
  broadcaster_type: "affiliate" | "partner" | "";
  description: string;
  profile_image_url: string;
  offline_image_url: string;
}

export function getUsers(userIds: string[], auth: Twitch.ext.Authorized) {
  return twitchRequest<DataResponse<User[]>>("https://api.twitch.tv/helix/users", { id: userIds }, auth)
    .then((r) => r?.data || [])
    .catch(errorFallback("Failed to fetch Twitch users", [] as User[]));
}

export type RenderableUser = ReturnType<typeof generateRenderableUser>;

export function generateRenderableUser(user: User) {
  return { ...user, label: renderUserLabel(user) };
}

function renderUserLabel(user: User) {
  if (user.display_name.toLowerCase() === user.login) {
    return user.display_name;
  }

  return `${user.display_name} (${user.login})`;
}

/**
 * Provides a simple wrapper for querying Helix, and ensures auth is set up properly to use the frontend API authentication:
 * See: https://dev.twitch.tv/docs/extensions/frontend-api-usage/
 */
function twitchRequest<T>(url: string, params: Record<string, string | string[]>, auth: Twitch.ext.Authorized) {
  return fetch(
    url +
      "?" +
      new URLSearchParams(
        Object.entries(params).reduce((acc, [key, value]) => {
          acc.push(...(Array.isArray(value) ? value : [value]).map((v) => [key, v]));
          return acc;
        }, [] as string[][]),
      ).toString(),
    { headers: { Authorization: `Extension ${auth.helixToken}`, "Client-ID": auth.clientId } },
  ).then((r) => {
    if (!r.ok) throw new Error(`unhandled status code: ${r.status}`);
    return r.json() as T;
  });
}

function errorFallback<T>(message: string, defaultValue: T) {
  return (error: unknown) => {
    console.error(`[TeamMembers] [Twitch] ${message}`, error);
    return defaultValue;
  };
}
