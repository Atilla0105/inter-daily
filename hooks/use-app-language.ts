"use client";

import {
  getCompetitionLabel,
  getCopy,
  getLanguageLocale,
  getMatchStatusLabel,
  getMotionLabel,
  getNewsCategoryLabel,
  getPlayerStatusLabel,
  getPositionLabel,
  getSocialPostLabel,
  getSocialSourceLabel,
  getThemeLabel,
  languageOptions,
  formatUiCountdown,
  formatUiDateTime,
  formatUiMonthDayTime,
  formatUiTimeZoneLabel
} from "@/lib/i18n";

import { usePreferences } from "./use-preferences";

export function useAppLanguage() {
  const { preferences, setLanguage } = usePreferences();
  const language = preferences.language;

  return {
    language,
    locale: getLanguageLocale(language),
    copy: getCopy(language),
    languageOptions,
    setLanguage,
    getCompetitionLabel: (competition: Parameters<typeof getCompetitionLabel>[1]) =>
      getCompetitionLabel(language, competition),
    getMatchStatusLabel: (status: Parameters<typeof getMatchStatusLabel>[1]) => getMatchStatusLabel(language, status),
    getNewsCategoryLabel: (category: Parameters<typeof getNewsCategoryLabel>[1]) =>
      getNewsCategoryLabel(language, category),
    getSocialSourceLabel: (sourceType: Parameters<typeof getSocialSourceLabel>[1]) =>
      getSocialSourceLabel(language, sourceType),
    getSocialPostLabel: (postType: Parameters<typeof getSocialPostLabel>[1]) =>
      getSocialPostLabel(language, postType),
    getPositionLabel: (positionGroup: Parameters<typeof getPositionLabel>[1]) => getPositionLabel(language, positionGroup),
    getPlayerStatusLabel: (status: Parameters<typeof getPlayerStatusLabel>[1]) => getPlayerStatusLabel(language, status),
    getThemeLabel: (theme: Parameters<typeof getThemeLabel>[1]) => getThemeLabel(language, theme),
    getMotionLabel: (motion: Parameters<typeof getMotionLabel>[1]) => getMotionLabel(language, motion),
    formatUiDateTime: (iso: string) => formatUiDateTime(iso, language),
    formatUiMonthDayTime: (iso: string, timeZone: string) => formatUiMonthDayTime(iso, timeZone, language),
    formatUiTimeZoneLabel: (iso: string, timeZone: string) => formatUiTimeZoneLabel(iso, timeZone, language),
    formatUiCountdown: (iso: string) => formatUiCountdown(iso, language)
  };
}
