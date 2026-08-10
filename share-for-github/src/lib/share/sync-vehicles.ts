import { useShareStore } from "@/lib/share/store";
import type { SavedVehicle } from "@/lib/share/data";
import {
  listMyVehiclesFn,
  syncMyVehiclesFn,
} from "@/lib/share/server-fns";

function payloadFromLocal(vehicles: SavedVehicle[]) {
  return vehicles.map((v) => ({
    id: v.id,
    label: v.label,
    vehicleType: v.vehicleType,
    licensePlate: v.licensePlate,
    photoUrl: v.photoUrl,
    isDefault: v.isDefault,
    createdAt: v.createdAt,
  }));
}

/** Push this device's garage (incl. photos) to the cloud for the signed-in email. */
export async function pushMyVehiclesToCloud(
  email?: string | null,
): Promise<{ ok: boolean; error?: string }> {
  const e = (email || "").trim().toLowerCase();
  if (!e.includes("@")) {
    return { ok: false, error: "sign-in-required" };
  }
  const vehicles = useShareStore.getState().myVehicles;
  try {
    await syncMyVehiclesFn({
      data: { email: e, vehicles: payloadFromLocal(vehicles) },
    });
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "sync-failed",
    };
  }
}

/**
 * Load garage from cloud. If cloud is empty but this phone has cars, push them.
 * Cloud wins when it has rows (so iPad/phone stay aligned).
 */
export async function pullMyVehiclesFromCloud(
  email?: string | null,
): Promise<{ ok: boolean; count: number }> {
  const e = (email || "").trim().toLowerCase();
  if (!e.includes("@")) return { ok: false, count: 0 };
  try {
    const res = await listMyVehiclesFn({ data: { email: e } });
    const cloud = res.vehicles as SavedVehicle[];
    if (cloud.length > 0) {
      useShareStore.setState({ myVehicles: cloud });
      return { ok: true, count: cloud.length };
    }
    const local = useShareStore.getState().myVehicles;
    if (local.length > 0) {
      await syncMyVehiclesFn({
        data: { email: e, vehicles: payloadFromLocal(local) },
      });
      return { ok: true, count: local.length };
    }
    return { ok: true, count: 0 };
  } catch {
    return { ok: false, count: 0 };
  }
}
