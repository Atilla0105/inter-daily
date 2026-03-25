import type { UserPreferences } from "@/lib/types";
import { DEFAULT_PREFERENCES } from "@/lib/types";

const preferencesStore = new Map<string, UserPreferences>();

export async function getPreferences(deviceId?: string | null) {
  if (!deviceId) {
    return DEFAULT_PREFERENCES;
  }

  return preferencesStore.get(deviceId) ?? DEFAULT_PREFERENCES;
}

export async function savePreferences(deviceId: string, preferences: UserPreferences) {
  preferencesStore.set(deviceId, preferences);
  return preferences;
}
