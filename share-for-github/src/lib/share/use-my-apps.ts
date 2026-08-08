import { useEffect } from "react";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import { lookupMyAppsFn } from "@/lib/share/server-fns";
import { useShareStore } from "@/lib/share/store";
import type { ApplicationStatus } from "@/lib/share/data";

const ACTIVE: ApplicationStatus[] = ["active", "approved"];
const BLOCK_REAPPLY: ApplicationStatus[] = [
  "active",
  "approved",
  "pending_interview",
  "scheduled",
];

export function isActiveStatus(s?: ApplicationStatus | null) {
  return !!s && ACTIVE.includes(s);
}

export function blocksReapply(s?: ApplicationStatus | null) {
  return !!s && BLOCK_REAPPLY.includes(s);
}

export function statusLabel(s?: ApplicationStatus | null): string {
  if (!s) return "Not applied";
  switch (s) {
    case "active":
    case "approved":
      return "ACTIVE";
    case "pending_interview":
      return "Pending interview";
    case "scheduled":
      return "Interview scheduled";
    case "declined":
      return "Declined";
    case "inactive":
      return "Inactive";
    default:
      return String(s).replace(/_/g, " ");
  }
}

/** Keep local driver/rider apps in sync with cloud for the signed-in email. */
export function useSyncMyApps() {
  const user = useCurrentUser();
  const syncMyApps = useShareStore((s) => s.syncMyApps);

  useEffect(() => {
    const email = user?.primaryEmail;
    if (!email) return;
    let cancelled = false;
    lookupMyAppsFn({ data: { email } })
      .then((res) => {
        if (cancelled) return;
        syncMyApps({
          drivers: res.drivers,
          riders: res.riders,
        });
        const activeDriver = res.drivers.find((d) => isActiveStatus(d.status));
        if (activeDriver?.fullName) {
          useShareStore.setState({ riderName: activeDriver.fullName });
        } else {
          const activeRider = res.riders.find((r) => isActiveStatus(r.status));
          if (activeRider?.fullName) {
            useShareStore.setState({ riderName: activeRider.fullName });
          }
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [user?.primaryEmail, syncMyApps]);
}

export function useMyAppStatus() {
  useSyncMyApps();
  const driverApps = useShareStore((s) => s.driverApps);
  const riderApps = useShareStore((s) => s.riderApps);
  const isDriverApproved = useShareStore((s) => s.isDriverApproved);
  const isRiderApproved = useShareStore((s) => s.isRiderApproved);
  const user = useCurrentUser();
  const email = user?.primaryEmail?.toLowerCase();

  const myDrivers = email
    ? driverApps.filter((a) => a.email?.toLowerCase() === email)
    : driverApps;
  const myRiders = email
    ? riderApps.filter((a) => a.email?.toLowerCase() === email)
    : riderApps;

  const latestDriver = myDrivers[0] ?? (email ? undefined : driverApps[0]);
  const latestRider = myRiders[0] ?? (email ? undefined : riderApps[0]);

  const driverStatus: ApplicationStatus | null =
    latestDriver?.status ?? (isDriverApproved ? "active" : null);
  const riderStatus: ApplicationStatus | null =
    latestRider?.status ?? (isRiderApproved ? "active" : null);

  return {
    latestDriver,
    latestRider,
    driverStatus,
    riderStatus,
    driverActive: isActiveStatus(driverStatus) || isDriverApproved,
    riderActive: isActiveStatus(riderStatus) || isRiderApproved,
    canApplyDriver: !blocksReapply(driverStatus) && !isDriverApproved,
    canApplyRider: !blocksReapply(riderStatus) && !isRiderApproved,
  };
}
