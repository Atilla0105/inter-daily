import { formatDistanceToNowStrict } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";

import type { CompetitionKey, MatchStatus } from "@/lib/types";

export function formatKickoff(iso: string, timeZone: string) {
  return formatInTimeZone(iso, timeZone, "MM月dd日 HH:mm");
}

export function formatTimeZoneLabel(iso: string, timeZone: string) {
  return `${formatInTimeZone(iso, timeZone, "EEE HH:mm")} · ${timeZone.replace("_", " ")}`;
}

export function countdownLabel(iso: string, now = new Date()) {
  const kickoff = new Date(iso);
  if (kickoff <= now) {
    return "正在进行";
  }

  return formatDistanceToNowStrict(kickoff, {
    addSuffix: true
  })
    .replace("about ", "")
    .replace(" hours", "小时")
    .replace(" hour", "小时")
    .replace(" minutes", "分钟")
    .replace(" minute", "分钟")
    .replace(" days", "天")
    .replace(" day", "天")
    .replace("in ", "还有");
}

export function statusLabel(status: MatchStatus) {
  switch (status) {
    case "SCHEDULED":
      return "未开始";
    case "LIVE":
      return "进行中";
    case "HALF_TIME":
      return "中场";
    case "EXTRA_TIME":
      return "加时";
    case "PENALTIES":
      return "点球";
    case "FINISHED":
      return "已结束";
    case "POSTPONED":
      return "延期";
    case "CANCELLED":
      return "取消";
    default:
      return status;
  }
}

export function statusTone(status: MatchStatus) {
  switch (status) {
    case "LIVE":
    case "HALF_TIME":
    case "EXTRA_TIME":
    case "PENALTIES":
      return "live" as const;
    case "FINISHED":
      return "success" as const;
    case "POSTPONED":
      return "warning" as const;
    case "CANCELLED":
      return "danger" as const;
    default:
      return "neutral" as const;
  }
}

export function competitionLabel(competition: CompetitionKey) {
  switch (competition) {
    case "serie-a":
      return "意甲";
    case "ucl":
      return "欧冠";
    case "coppa-italia":
      return "意大利杯";
    case "club-friendly":
      return "热身赛";
    default:
      return competition;
  }
}
