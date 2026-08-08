import { useEffect, useState } from "react";
import {
  authClient,
  authEnabled,
  getBearerToken,
  readCachedAuthUser,
  cacheAuthUser,
  type CachedAuthUser,
} from "./client";

/** Normalized user shape used across the app, auth on or off. */
export type AppUser = {
  id: string;
  displayName: string | null;
  primaryEmail: string | null;
  profileImageUrl: string | null;
  /** True when this is the sandbox/dev fallback (auth not configured). */
  isDevFallback: boolean;
};

export const DEV_USER: AppUser = {
  id: "dev-user",
  displayName: "Dev User",
  primaryEmail: "dev@example.com",
  profileImageUrl: null,
  isDevFallback: true,
};

export type CurrentUserState = {
  user: AppUser | null;
  isPending: boolean;
};

function toAppUser(
  u: { id: string; name?: string | null; email?: string | null; image?: string | null } | CachedAuthUser,
): AppUser {
  if ("displayName" in u) {
    return {
      id: u.id,
      displayName: u.displayName,
      primaryEmail: u.primaryEmail,
      profileImageUrl: u.profileImageUrl,
      isDevFallback: false,
    };
  }
  return {
    id: u.id,
    displayName: u.name ?? null,
    primaryEmail: u.email ?? null,
    profileImageUrl: u.image ?? null,
    isDevFallback: false,
  };
}

/**
 * Current user + loading state.
 * Uses Better Auth session, and a short local cache so You doesn't flash
 * "Sign in" / email-username right after login (before cookies hydrate).
 */
export function useCurrentUserState(): CurrentUserState {
  if (!authEnabled) return { user: DEV_USER, isPending: false };

  // eslint-disable-next-line react-hooks/rules-of-hooks -- authEnabled is constant for the app's lifetime
  const { data, isPending, refetch } = authClient.useSession();
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [cached, setCached] = useState<CachedAuthUser | null>(() =>
    readCachedAuthUser(),
  );

  // Keep local cache in sync when session resolves
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (data?.user) {
      const next: CachedAuthUser = {
        id: data.user.id,
        displayName: data.user.name ?? null,
        primaryEmail: data.user.email ?? null,
        profileImageUrl: data.user.image ?? null,
      };
      cacheAuthUser(next);
      setCached(next);
    } else if (!isPending && !data?.user && !getBearerToken()) {
      // Confirmed signed out (no session and no bearer) — drop cache
      cacheAuthUser(null);
      setCached(null);
    }
  }, [data?.user, isPending]);

  // Soft refresh when app returns to foreground (phones kill network)
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "visible") {
        void refetch?.();
      }
    };
    document.addEventListener("visibilitychange", onVis);
    // periodic soft refresh every 10 min while open
    const id = window.setInterval(() => {
      void refetch?.();
    }, 10 * 60 * 1000);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.clearInterval(id);
    };
  }, [refetch]);

  if (data?.user) {
    return { user: toAppUser(data.user), isPending: false };
  }

  // While loading, show cached user so UI doesn't flash Guest / Sign in
  if (isPending && cached) {
    return { user: toAppUser(cached), isPending: true };
  }

  // Session null but we still have bearer + cache — treat as signed in until proven otherwise
  if (!data?.user && cached && getBearerToken()) {
    return { user: toAppUser(cached), isPending: isPending };
  }

  return { user: null, isPending };
}

export function useCurrentUser(): AppUser | null {
  return useCurrentUserState().user;
}
