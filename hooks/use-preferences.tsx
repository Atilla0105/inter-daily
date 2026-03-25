"use client";

import {
  createContext,
  type Dispatch,
  type PropsWithChildren,
  type SetStateAction,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";

import { userPreferencesSchema } from "@/lib/schemas";
import { DEFAULT_PREFERENCES, type UserPreferences } from "@/lib/types";

const STORAGE_KEY = "inter-daily/preferences/v1";

type PreferencesContextValue = {
  preferences: UserPreferences;
  setPreferences: Dispatch<SetStateAction<UserPreferences>>;
  toggleSavedFixture: (fixtureId: string) => void;
  toggleSavedNews: (newsId: string) => void;
  setTheme: (theme: UserPreferences["theme"]) => void;
  setMotion: (motion: UserPreferences["motion"]) => void;
  setRating: (fixtureId: string, rating: number) => void;
};

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

function readInitialPreferences() {
  if (typeof window === "undefined") {
    return DEFAULT_PREFERENCES;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return DEFAULT_PREFERENCES;
  }

  const parsed = userPreferencesSchema.safeParse(JSON.parse(raw));
  return parsed.success ? parsed.data : DEFAULT_PREFERENCES;
}

export function PreferencesProvider({ children }: PropsWithChildren) {
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);

  useEffect(() => {
    setPreferences(readInitialPreferences());
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = preferences.theme;
    document.documentElement.dataset.motion = preferences.motion;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  }, [preferences]);

  const value = useMemo<PreferencesContextValue>(
    () => ({
      preferences,
      setPreferences,
      toggleSavedFixture: (fixtureId) =>
        setPreferences((current) => ({
          ...current,
          savedFixtureIds: current.savedFixtureIds.includes(fixtureId)
            ? current.savedFixtureIds.filter((id) => id !== fixtureId)
            : [...current.savedFixtureIds, fixtureId]
        })),
      toggleSavedNews: (newsId) =>
        setPreferences((current) => ({
          ...current,
          savedNewsIds: current.savedNewsIds.includes(newsId)
            ? current.savedNewsIds.filter((id) => id !== newsId)
            : [...current.savedNewsIds, newsId]
        })),
      setTheme: (theme) => setPreferences((current) => ({ ...current, theme })),
      setMotion: (motion) => setPreferences((current) => ({ ...current, motion })),
      setRating: (fixtureId, rating) =>
        setPreferences((current) => ({
          ...current,
          ratingEntries: {
            ...current.ratingEntries,
            [fixtureId]: rating
          }
        }))
    }),
    [preferences]
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences() {
  const context = useContext(PreferencesContext);

  if (!context) {
    throw new Error("usePreferences must be used within PreferencesProvider");
  }

  return context;
}
