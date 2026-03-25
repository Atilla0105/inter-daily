import { formatDistanceToNowStrict } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";

import type {
  AppLanguage,
  CompetitionKey,
  MatchStatus,
  MotionMode,
  NewsCategory,
  SocialPostType,
  SocialSourceType,
  ThemeMode
} from "@/lib/types";

export const languageOptions = [
  { value: "zh", label: "中文" },
  { value: "ug", label: "ئۇيغۇرچە" }
] as const;

export function getLanguageLocale(language: AppLanguage) {
  return language === "ug" ? "ug-CN" : "zh-CN";
}

export function formatUiDateTime(iso: string, language: AppLanguage) {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) {
    return language === "ug" ? "ۋاقىت جەزملەشتۈرۈلمىدى" : "时间待确认";
  }

  try {
    return new Intl.DateTimeFormat(getLanguageLocale(language), {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    }).format(parsed);
  } catch {
    return parsed.toLocaleString("zh-CN");
  }
}

export function formatUiMonthDayTime(iso: string, timeZone: string, language: AppLanguage) {
  return formatInTimeZone(iso, timeZone, language === "ug" ? "MM-dd HH:mm" : "MM月dd日 HH:mm");
}

export function formatUiTimeZoneLabel(iso: string, timeZone: string, language: AppLanguage) {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) {
    return timeZone.replaceAll("_", " ");
  }

  try {
    const weekdayTime = new Intl.DateTimeFormat(getLanguageLocale(language), {
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone
    }).format(parsed);

    return `${weekdayTime} · ${timeZone.replaceAll("_", " ")}`;
  } catch {
    return `${formatInTimeZone(iso, timeZone, "EEE HH:mm")} · ${timeZone.replaceAll("_", " ")}`;
  }
}

export function formatUiCountdown(iso: string, language: AppLanguage, now = new Date()) {
  const kickoff = new Date(iso);
  if (Number.isNaN(kickoff.getTime())) {
    return language === "ug" ? "ۋاقىت ساقلىنىۋاتىدۇ" : "等待赛程";
  }

  if (kickoff <= now) {
    return language === "ug" ? "باشلاندى" : "正在进行";
  }

  const distance = formatDistanceToNowStrict(kickoff, { addSuffix: true }).replace("about ", "");
  if (language === "ug") {
    return distance
      .replace(" months", " ئاي")
      .replace(" month", " ئاي")
      .replace(" years", " يىل")
      .replace(" year", " يىل")
      .replace(" hours", " سائەت")
      .replace(" hour", " سائەت")
      .replace(" minutes", " مىنۇت")
      .replace(" minute", " مىنۇت")
      .replace(" days", " كۈن")
      .replace(" day", " كۈن")
      .replace("in ", "يەنە ");
  }

  return distance
    .replace(" months", "个月")
    .replace(" month", "个月")
    .replace(" years", "年")
    .replace(" year", "年")
    .replace(" hours", "小时")
    .replace(" hour", "小时")
    .replace(" minutes", "分钟")
    .replace(" minute", "分钟")
    .replace(" days", "天")
    .replace(" day", "天")
    .replace("in ", "还有");
}

export function getMatchStatusLabel(language: AppLanguage, status: MatchStatus) {
  const zh: Record<MatchStatus, string> = {
    SCHEDULED: "未开始",
    LIVE: "进行中",
    HALF_TIME: "中场",
    EXTRA_TIME: "加时",
    PENALTIES: "点球",
    FINISHED: "已结束",
    POSTPONED: "延期",
    CANCELLED: "取消"
  };
  const ug: Record<MatchStatus, string> = {
    SCHEDULED: "تېخى باشلانمىدى",
    LIVE: "جەرياندا",
    HALF_TIME: "ئارام",
    EXTRA_TIME: "قوشۇمچە ۋاقىت",
    PENALTIES: "نۇقتا توپ",
    FINISHED: "ئاخىرلاشتى",
    POSTPONED: "كېچىكتۈرۈلدى",
    CANCELLED: "بىكار قىلىندى"
  };

  return (language === "ug" ? ug : zh)[status];
}

export function getCompetitionLabel(language: AppLanguage, competition: CompetitionKey) {
  const zh: Record<CompetitionKey, string> = {
    "serie-a": "意甲",
    ucl: "欧冠",
    "coppa-italia": "意大利杯",
    "club-friendly": "热身赛"
  };
  const ug: Record<CompetitionKey, string> = {
    "serie-a": "ئىتالىيە A بىرلەشمىسى",
    ucl: "ياۋروپا چېمپىيونلار بىرلەشمىسى",
    "coppa-italia": "ئىتالىيە لوڭقىسى",
    "club-friendly": "دوستانە مۇسابىقە"
  };

  return (language === "ug" ? ug : zh)[competition];
}

export function getNewsCategoryLabel(language: AppLanguage, category: NewsCategory) {
  const zh: Record<NewsCategory, string> = {
    official: "官方",
    matchday: "比赛日",
    transfers: "转会",
    interviews: "专访",
    video: "视频",
    history: "历史"
  };
  const ug: Record<NewsCategory, string> = {
    official: "رەسمىي",
    matchday: "مۇسابىقە كۈنى",
    transfers: "يۆتكىلىش",
    interviews: "سۆھبەت",
    video: "سىن",
    history: "تارىخ"
  };

  return (language === "ug" ? ug : zh)[category];
}

export function getSocialSourceLabel(language: AppLanguage, sourceType: SocialSourceType) {
  if (language === "ug") {
    return sourceType === "club" ? "كۇلۇب نۇسخىسى" : "توپچى نۇسخىسى";
  }

  return sourceType === "club" ? "俱乐部镜像" : "球员镜像";
}

export function getSocialPostLabel(language: AppLanguage, postType: SocialPostType) {
  if (language === "ug") {
    return postType === "reel" ? "قىسقا سىن" : "يوللانما";
  }

  return postType === "reel" ? "短视频" : "帖子";
}

export function getPositionLabel(language: AppLanguage, positionGroup: "门将" | "后卫" | "中场" | "前锋") {
  const map = {
    门将: { zh: "门将", ug: "ۋاراتار" },
    后卫: { zh: "后卫", ug: "ئارقا سەپ" },
    中场: { zh: "中场", ug: "ئوتتۇرا سەپ" },
    前锋: { zh: "前锋", ug: "ھۇجۇمچى" }
  } as const;

  return map[positionGroup][language];
}

export function getPlayerStatusLabel(language: AppLanguage, status: "可出场" | "伤停" | "停赛" | "存疑") {
  const map = {
    可出场: { zh: "可出场", ug: "مەيدانغا چۈشەلەيدۇ" },
    伤停: { zh: "伤停", ug: "يارىدار" },
    停赛: { zh: "停赛", ug: "توختىتىلغان" },
    存疑: { zh: "存疑", ug: "گۇمان بار" }
  } as const;

  return map[status][language];
}

export function getThemeLabel(language: AppLanguage, theme: ThemeMode) {
  const map = {
    classic: { zh: "经典夜色", ug: "كلاسسىك قاراڭغۇ" },
    contrast: { zh: "高对比", ug: "يۇقىرى سېلىشتۇرما" }
  } as const;

  return map[theme][language];
}

export function getMotionLabel(language: AppLanguage, motion: MotionMode) {
  const map = {
    full: { zh: "细微动效", ug: "يېنىك ھەرىكەت" },
    reduced: { zh: "减弱动效", ug: "ھەرىكەتنى ئازايتىش" }
  } as const;

  return map[motion][language];
}

export const copy = {
  zh: {
    appName: "国米日报",
    homeTagline: "10 秒内读完今天最重要的国米变化",
    language: "语言",
    tabHome: "首页",
    tabMatches: "赛程",
    tabTeam: "球队",
    tabNews: "新闻",
    tabMy: "我的",
    offlineMode: "离线模式",
    syncedEvery: "2-6 小时同步",
    stalePrefix: "当前展示最近一次成功同步结果，最后同步于",
    homeNews: "今日重点新闻",
    homeChanges: "伤停 / 停赛 / 转会变化",
    homeBreaking: "关键变化",
    homeMemory: "蓝黑记忆",
    briefingEyebrow: "今日简报",
    briefingTitle: "官方源整理",
    briefingPending: "正在整理今天的官方简报",
    briefingPendingDesc: "新闻源已接入，当前正在生成更紧凑的摘要内容。",
    briefingStoryline: "比赛线索",
    briefingTopNews: "简报",
    briefingClub: "俱乐部更新",
    briefingChanges: "今日变化",
    briefingSourceOnly: "仅基于官方源",
    homeAllNews: "全部新闻",
    homeNoNews: "暂无新闻",
    homeNoNewsDesc: "新闻同步完成后会在这里显示。",
    homeMatches: "赛程",
    homeTeam: "球队",
    homeHistory: "历史",
    homeSquad: "阵容",
    matchesLocalTime: (timeZone: string) => `已按 ${timeZone.replaceAll("_", " ")} 显示本地时间`,
    filterAll: "全部",
    filterUpcoming: "未开赛",
    filterFinished: "已结束",
    filterCompetitions: "赛事筛选",
    matchesEmpty: "当前筛选下暂无比赛",
    matchesEmptyDesc: "切换赛事或时间状态后再看一下。",
    matchesError: "赛程同步失败",
    matchesErrorDesc: "无法载入赛程列表，请稍后再试。",
    reminderOn: "已提醒",
    reminderOff: "可提醒",
    teamFullSquad: "完整阵容",
    teamDeskTitle: "球队中枢",
    teamIntro:
      "球队信息、主教练、12 名主力球员和站内社媒镜像都压缩到同一个移动端页面里。",
    teamInfo: "球队信息",
    teamInfoDesc: "主教练、主力框架和社媒镜像统一收口。",
    teamMirrorAccounts: "镜像账号",
    teamMirrorAccountsDesc: (count: number) => `${count} 个账号，面向大陆网络做后端代理。`,
    teamCoreSetup: "主力框架",
    teamCoreSetupDesc: "固定展示 12 名主力球员，避免阵容接口顺序干扰阅读。",
    teamCurrentSync: "当前同步",
    teamCurrentSyncDesc: (count: number, total: number) => `${count}/${total} 名主力已匹配到实时阵容数据。`,
    coach: "主教练",
    coreTwelve: "十二名主力球员",
    coreNote: "默认主力框架，不等于赛前首发",
    teamNoSquad: "主力球员信息暂不可用",
    teamNoSquadDesc: "阵容数据暂时没有完成同步。",
    teamSocial: "球队社媒镜像",
    teamSocialEmpty: "当前没有镜像内容",
    teamSocialEmptyDesc: "等待下一个同步周期，或稍后刷新再看。",
    teamSocialError: "社媒镜像暂时不可用",
    teamSocialErrorDesc: "当前无法同步球队社媒内容，请稍后再试。",
    syncPending: "资料补齐中",
    syncPendingDesc: "等待阵容接口补齐号码、国籍和状态后自动同步。",
    birthYear: (year: string) => `${year} 年生`,
    newsOfficial: "官方",
    newsMatchday: "比赛日",
    newsTransfers: "转会",
    newsEmpty: "该分类暂无内容",
    newsEmptyDesc: "切换其他标签或稍后再看。",
    newsError: "新闻加载失败",
    newsErrorDesc: "新闻源暂时不可用，请稍后刷新。",
    newsDetailError: "新闻详情加载失败",
    newsDetailErrorDesc: "请稍后重试或直接打开原文。",
    save: "收藏",
    unsave: "取消收藏",
    openSource: "打开原文",
    relatedNews: "相关内容",
    fixtureDetailBack: "返回赛程",
    fixtureDetailError: "比赛详情加载失败",
    fixtureDetailErrorDesc: "当前无法读取这场比赛的详细信息。",
    fixtureDetailEmpty: "暂无详情",
    fixtureDetailEmptyDesc: "该场比赛尚未生成详细面板。",
    fixtureSummary: "比赛摘要",
    fixtureTimeline: "时间线",
    fixtureLineups: "阵容",
    fixtureStats: "技术统计",
    noTimeline: "当前没有分钟级事件",
    noTimelineDesc: "该 provider 不提供完整时间线或比赛尚未进入对应阶段。",
    noLineups: "阵容未提供",
    noLineupsDesc: "阵容与替补信息将在后续 provider 升级后自动接入。",
    noStats: "技术统计未提供",
    noStatsDesc: "当前 provider 只提供基础比分与赛果。",
    mySaved: "已保存内容",
    mySync: "最近同步",
    myWaitingSync: "等待首次同步",
    myNotFetched: "尚未获取",
    notifications: "通知偏好",
    notifyAll: "总通知开关",
    notifyMatch: "赛前提醒",
    notifyLive: "比赛进程提醒",
    notifyNews: "官方新闻提醒",
    on: "开",
    off: "关",
    pushSubscribe: "Web Push 订阅",
    subscriptionIdle: "未订阅",
    subscriptionUnsupported: "当前浏览器不支持",
    subscriptionMissingKey: "缺少 VAPID 公钥",
    subscriptionDenied: "通知权限未开启",
    subscriptionReady: "已订阅",
    appearance: "主题与动效",
    darkTheme: "深色主题",
    motionDensity: "动效密度",
    pwa: "安装与离线",
    addToHome: "添加到主屏幕",
    addToHomeDesc: "安装后可离线打开最近同步过的首页与赛程。",
    installPwa: "安装 PWA",
    installUnavailable: "浏览器暂未提供安装入口",
    squadTitle: "一线队阵容",
    squadError: "阵容同步失败",
    squadErrorDesc: "当前无法获取一线队名单。",
    memoryTitle: "蓝黑记忆",
    memoryDesc: "给老球迷留一块情绪与记忆的空间，而不只是今天的结果。",
    memoryError: "历史记忆暂不可用",
    memoryErrorDesc: "稍后再回来，或者先看首页的记忆卡片。",
    memoryFuture:
      "MVP 阶段的历史内容以聚合卡片和官方来源跳转为主，后续可以扩展 Hall of Fame、传奇球员和“今天在国米历史上”。",
    memoryEnter: "进入蓝黑记忆",
    standingsTitle: "争冠位置",
    standingsPoints: "积分",
    standingsLeaderGap: "距榜首",
    standingsGoalDiff: "净胜球",
    standingsMore: "查看赛程与走势",
    scoreLastResult: "上一场结果",
    scoreAndStatus: "比分与状态",
    matchDetail: "比赛详情",
    cacheFallback: "缓存回退",
    reminderSettings: "提醒设置",
    loadingApp: "正在装载国米日报...",
    errorSync: "同步异常",
    errorLoad: "页面加载失败",
    tryLater: "请稍后再试。",
    reload: "重新加载",
    awaitingSchedule: "等待赛程",
    importantRank: (index: number) => `重点 ${index}`,
    socialTimeUnknown: "时间待确认"
  },
  ug: {
    appName: "ئىنتېر كۈندىلىكى",
    homeTagline: "بۈگۈنكى ئەڭ مۇھىم ئىنتېر ئۆزگىرىشلىرىنى 10 سېكۇنتتا كۆرۈپ چىقىڭ",
    language: "تىل",
    tabHome: "باش بەت",
    tabMatches: "مۇسابىقە",
    tabTeam: "كوماندا",
    tabNews: "خەۋەر",
    tabMy: "مىنىڭ",
    offlineMode: "تورسىز ھالەت",
    syncedEvery: "2-6 سائەتتە بىر يېڭىلىنىدۇ",
    stalePrefix: "ھازىر ئەڭ ئاخىرقى مۇۋەپپەقىيەتلىك ماسقەدەم نەتىجىسى كۆرسىتىلىۋاتىدۇ، ئاخىرقى ۋاقىت",
    homeNews: "بۈگۈنكى مۇھىم خەۋەرلەر",
    homeChanges: "يارىدار / توختىتىلغان / يۆتكىلىش ئۆزگىرىشى",
    homeBreaking: "مۇھىم ئۆزگىرىشلەر",
    homeMemory: "نېراززۇررى خاتىرىسى",
    briefingEyebrow: "بۈگۈنكى قىسقا بايان",
    briefingTitle: "رەسمىي مەنبە يىغىندىسى",
    briefingPending: "بۈگۈنكى رەسمىي قىسقا بايان تەييارلىنىۋاتىدۇ",
    briefingPendingDesc: "خەۋەر مەنبەسى ئۇلاندى، ھازىر تېخىمۇ ئىخچام خۇلاسىلەر تەييارلىنىۋاتىدۇ.",
    briefingStoryline: "مۇسابىقە تېمىسى",
    briefingTopNews: "قىسقا خەۋەر",
    briefingClub: "كۇلۇب يېڭىلىنىشى",
    briefingChanges: "بۈگۈنكى ئۆزگىرىش",
    briefingSourceOnly: "پەقەت رەسمىي مەنبە",
    homeAllNews: "بارلىق خەۋەر",
    homeNoNews: "خەۋەر يوق",
    homeNoNewsDesc: "خەۋەر ماسقەدەملەنگەندىن كېيىن بۇ يەردە كۆرۈنىدۇ.",
    homeMatches: "مۇسابىقە",
    homeTeam: "كوماندا",
    homeHistory: "تارىخ",
    homeSquad: "تەشكىل",
    matchesLocalTime: (timeZone: string) => `ۋاقىت ${timeZone.replaceAll("_", " ")} بويىچە كۆرسىتىلدى`,
    filterAll: "ھەممىسى",
    filterUpcoming: "تېخى باشلانمىدى",
    filterFinished: "ئاخىرلاشتى",
    filterCompetitions: "مۇسابىقە سۈزگۈچى",
    matchesEmpty: "بۇ سۈزگۈچتە مۇسابىقە يوق",
    matchesEmptyDesc: "مۇسابىقە ياكى ۋاقىت ھالىتىنى ئالماشتۇرۇپ قايتا كۆرۈپ بېقىڭ.",
    matchesError: "مۇسابىقە ماسقەدەملەش مەغلۇپ بولدى",
    matchesErrorDesc: "مۇسابىقە تىزىملىكىنى ئوقۇيالمىدى، كېيىن قايتا سىناڭ.",
    reminderOn: "ئەسكەرتىلگەن",
    reminderOff: "ئەسكەرتكىلى بولىدۇ",
    teamFullSquad: "تولۇق تەشكىل",
    teamDeskTitle: "كوماندا مەركىزى",
    teamIntro: "كوماندا ئۇچۇرى، باش مەشقاۋۇل، 12 نەپەر ئاساسىي توپچى ۋە ئىچكى ئىجتىمائىي نۇسخا بىر بەتتە جەم بولدى.",
    teamInfo: "كوماندا ئۇچۇرى",
    teamInfoDesc: "باش مەشقاۋۇل، ئاساسىي رامكا ۋە نۇسخا مەزمۇنى بىر يەرگە يىغىلدى.",
    teamMirrorAccounts: "نۇسخا ھېساباتلىرى",
    teamMirrorAccountsDesc: (count: number) => `${count} ھېسابات، قۇرۇقلۇق تورىغا ماسلاشتۇرۇلغان ئارقا مۇلازىمەت ئارقىلىق يۈكلىنىدۇ.`,
    teamCoreSetup: "ئاساسىي رامكا",
    teamCoreSetupDesc: "12 نەپەر ئاساسىي توپچى مۇقىم كۆرسىتىلىدۇ، تەشكىل كۆرۈنمە تەرتىپىگە باغلىنىپ قالمايدۇ.",
    teamCurrentSync: "نۆۋەتتىكى ماسقەدەم",
    teamCurrentSyncDesc: (count: number, total: number) => `${count}/${total} نەپەر ئاساسىي توپچى ھەقىقىي تەشكىل ئۇچۇرىغا ماسلاشتۇرۇلدى.`,
    coach: "باش مەشقاۋۇل",
    coreTwelve: "ئون ئىككى ئاساسىي توپچى",
    coreNote: "بۇ كۆڭۈلدىكى ئاساسىي رامكا، مۇسابىقە ئالدىدىكى باشلىنىش تىزىملىكى ئەمەس",
    teamNoSquad: "ئاساسىي توپچى ئۇچۇرى ۋاقىتلىق ئىشلىمەيدۇ",
    teamNoSquadDesc: "تەشكىل ئۇچۇرى ھازىرچە تولۇق ماسقەدەملەنمىدى.",
    teamSocial: "كوماندا ئىجتىمائىي نۇسخىسى",
    teamSocialEmpty: "ھازىر نۇسخا مەزمۇنى يوق",
    teamSocialEmptyDesc: "كېيىنكى ماسقەدەم دەۋرىنى ساقلاڭ ياكى كېيىن يېڭىلاپ كۆرۈڭ.",
    teamSocialError: "ئىجتىمائىي نۇسخا ۋاقىتلىق ئىشلىمەيدۇ",
    teamSocialErrorDesc: "كوماندا ئىجتىمائىي مەزمۇنىنى ھازىرچە ماسقەدەملەيالمىدى، كېيىن قايتا سىناڭ.",
    syncPending: "ماتېرىيال تولۇقلىنىۋاتىدۇ",
    syncPendingDesc: "نومۇر، دۆلەت ۋە ھالەت تولۇقلانغاندىن كېيىن ئاپتوماتىك يېڭىلىنىدۇ.",
    birthYear: (year: string) => `${year} يىلى تۇغۇلغان`,
    newsOfficial: "رەسمىي",
    newsMatchday: "مۇسابىقە كۈنى",
    newsTransfers: "يۆتكىلىش",
    newsEmpty: "بۇ تۈرگە مەزمۇن يوق",
    newsEmptyDesc: "باشقا بەتكۈچنى ئالماشتۇرۇڭ ياكى كېيىن قايتا كۆرۈڭ.",
    newsError: "خەۋەر يۈكلەش مەغلۇپ بولدى",
    newsErrorDesc: "خەۋەر مەنبەسى ۋاقىتلىق ئىشلىمەيدۇ، كېيىن يېڭىلاڭ.",
    newsDetailError: "خەۋەر تەپسىلاتى يۈكلەش مەغلۇپ بولدى",
    newsDetailErrorDesc: "كېيىن قايتا سىناڭ ياكى ئەسلى مەنبەنى ئېچىڭ.",
    save: "ساقلاش",
    unsave: "ساقلاشنى بىكار قىلىش",
    openSource: "ئەسلى مەنبەنى ئېچىش",
    relatedNews: "مۇناسىۋەتلىك مەزمۇن",
    fixtureDetailBack: "مۇسابىقىگە قايتىش",
    fixtureDetailError: "مۇسابىقە تەپسىلاتى يۈكلەش مەغلۇپ بولدى",
    fixtureDetailErrorDesc: "بۇ مۇسابىقە تەپسىلاتىنى ھازىرچە ئوقۇيالمىدى.",
    fixtureDetailEmpty: "تەپسىلات يوق",
    fixtureDetailEmptyDesc: "بۇ مۇسابىقە ئۈچۈن تەپسىلىي تاختا تېخى ھاسىل بولمىدى.",
    fixtureSummary: "مۇسابىقە خۇلاسىسى",
    fixtureTimeline: "ۋاقىت سىزىقى",
    fixtureLineups: "تەپسىلىي تىزىملىك",
    fixtureStats: "تېخنىكىلىق سانلىق مەلۇمات",
    noTimeline: "مىنۇتلۇق ۋەقەلەر يوق",
    noTimelineDesc: "بۇ مەنبە تولۇق ۋاقىت سىزىقىنى تەمىنلىمەيدۇ ياكى مۇسابىقە بۇ باسقۇچقا يەتمىدى.",
    noLineups: "تىزىملىك تەمىنلەنمىدى",
    noLineupsDesc: "باشلىنىش ۋە زاپاس تىزىملىك كېيىنكى مەنبە يېڭىلانغاندىن كېيىن ئاپتوماتىك كىرىدۇ.",
    noStats: "سانلىق مەلۇمات تەمىنلەنمىدى",
    noStatsDesc: "ھازىرقى مەنبە پەقەت ئاساسىي نومۇر ۋە نەتىجىنىلا تەمىنلەيدۇ.",
    mySaved: "ساقلانغان مەزمۇن",
    mySync: "ئەڭ يېقىن ماسقەدەم",
    myWaitingSync: "تۇنجى ماسقەدەم ساقلىنىۋاتىدۇ",
    myNotFetched: "تېخى ئېلىنمىدى",
    notifications: "ئۇقتۇرۇش تەڭشىكى",
    notifyAll: "ئومۇمىي ئۇقتۇرۇش",
    notifyMatch: "مۇسابىقە ئالدى ئۇقتۇرۇشى",
    notifyLive: "مۇسابىقە جەريانى ئۇقتۇرۇشى",
    notifyNews: "رەسمىي خەۋەر ئۇقتۇرۇشى",
    on: "ئېچىلغان",
    off: "تاقالغان",
    pushSubscribe: "Web Push مۇشتەرىلىكى",
    subscriptionIdle: "مۇشتەرى بولمىغان",
    subscriptionUnsupported: "بۇ توركۆرگۈچ قوللىمايدۇ",
    subscriptionMissingKey: "VAPID ئاچقۇچى كەم",
    subscriptionDenied: "ئۇقتۇرۇش رۇخسىتى ئېچىلمىغان",
    subscriptionReady: "مۇشتەرى بولدى",
    appearance: "تېما ۋە ھەرىكەت",
    darkTheme: "قاراڭغۇ تېما",
    motionDensity: "ھەرىكەت زىچلىقى",
    pwa: "ئورنىتىش ۋە تورسىز",
    addToHome: "باش ئېكرانغا قوشۇش",
    addToHomeDesc: "ئورناتقاندىن كېيىن يېقىندا ماسقەدەملەنگەن باش بەت ۋە مۇسابىقىلەرنى تورسىز ئاچقىلى بولىدۇ.",
    installPwa: "PWA نى ئورنىتىش",
    installUnavailable: "توركۆرگۈچتە ئورنىتىش كىرىش ئېغىزى يوق",
    squadTitle: "بىرىنچى سەپ تەشكىلى",
    squadError: "تەشكىل ماسقەدەملەش مەغلۇپ بولدى",
    squadErrorDesc: "بىرىنچى سەپ ناملىقىنى ھازىرچە ئالالمىدى.",
    memoryTitle: "نېراززۇررى خاتىرىسى",
    memoryDesc: "بۇ بۆلەك پەقەت بۈگۈنكى نەتىجە ئۈچۈنلا ئەمەس، كونا مەستانىلەرگە ھېسسىيات ۋە خاتىرە بوشلۇقى قالدۇرىدۇ.",
    memoryError: "تارىخىي خاتىرە ۋاقىتلىق ئىشلىمەيدۇ",
    memoryErrorDesc: "كېيىن قايتا كېلىڭ ياكى باش بەتتىكى خاتىرە كارتىسىنى ئالدى بىلەن كۆرۈڭ.",
    memoryFuture:
      "MVP باسقۇچىدا تارىخىي مەزمۇن ئاساسەن يىغىلما كارتا ۋە رەسمىي مەنبەگە ئاتلىنىشتىن تەركىب تاپىدۇ، كېيىنچە شان-شەرىپ سارىيى، رىۋايەت توپچىلار ۋە «بۈگۈن ئىنتېر تارىخىدا» غا كېڭەيتكىلى بولىدۇ.",
    memoryEnter: "نېراززۇررى خاتىرىسىگە كىرىش",
    standingsTitle: "چېمپىيونلۇق ئورنى",
    standingsPoints: "نومۇر",
    standingsLeaderGap: "باشتىكى كوماندىدىن پەرق",
    standingsGoalDiff: "توپ پەرقى",
    standingsMore: "مۇسابىقە ۋە يۈزلىنىشنى كۆرۈش",
    scoreLastResult: "ئالدىنقى نەتىجە",
    scoreAndStatus: "نومۇر ۋە ھالەت",
    matchDetail: "مۇسابىقە تەپسىلاتى",
    cacheFallback: "كاش قايتىشى",
    reminderSettings: "ئەسكەرتىش تەڭشىكى",
    loadingApp: "ئىنتېر كۈندىلىكى يۈكلىنىۋاتىدۇ...",
    errorSync: "ماسقەدەم خاتالىقى",
    errorLoad: "بەت يۈكلەش مەغلۇپ بولدى",
    tryLater: "كېيىن قايتا سىناڭ.",
    reload: "قايتا يۈكلەش",
    awaitingSchedule: "مۇسابىقە ساقلىنىۋاتىدۇ",
    importantRank: (index: number) => `مۇھىم ${index}`,
    socialTimeUnknown: "ۋاقىت جەزملەشتۈرۈلمىدى"
  }
} as const;

export function getCopy(language: AppLanguage) {
  return copy[language];
}
