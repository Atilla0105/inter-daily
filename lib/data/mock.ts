import type {
  ChangeAlert,
  CompetitionKey,
  FixtureDetail,
  HomePayload,
  MatchStat,
  MemoryEntry,
  NewsDetail,
  NewsItem,
  ProviderCapability,
  SquadPlayer,
  StandingSummary
} from "@/lib/types";

import { DEFAULT_PROVIDER_CAPABILITIES, EMPTY_HOME_EDITORIAL } from "@/lib/types";

export type RawFixtureSeed = {
  id: string;
  competition: CompetitionKey;
  round: string;
  venue: string;
  stage: string;
  kickoffAtUtc: string;
  isHome: boolean;
  status: FixtureDetail["fixture"]["status"];
  homeTeam: FixtureDetail["fixture"]["homeTeam"];
  awayTeam: FixtureDetail["fixture"]["awayTeam"];
  keyStory?: string | null;
  hasReminder?: boolean;
};

const providerCapabilities: ProviderCapability = {
  ...DEFAULT_PROVIDER_CAPABILITIES,
  injuries: true
};

export const rawFixtures: RawFixtureSeed[] = [
  {
    id: "ucl-bayern-away-20260325",
    competition: "ucl",
    round: "1/4 决赛首回合",
    venue: "Allianz Arena",
    stage: "欧冠夜",
    kickoffAtUtc: "2026-03-25T20:00:00.000Z",
    isHome: false,
    status: "LIVE",
    homeTeam: {
      id: "team-bayern",
      name: "Bayern Munich",
      shortName: "拜仁",
      score: 1
    },
    awayTeam: {
      id: "team-inter",
      name: "Inter Milan",
      shortName: "国米",
      score: 1
    },
    keyStory: "欧冠客场强强对话，蓝黑军团正在争取带走主动权。",
    hasReminder: true
  },
  {
    id: "sa-napoli-home-20260328",
    competition: "serie-a",
    round: "第30轮",
    venue: "San Siro",
    stage: "争冠卡位",
    kickoffAtUtc: "2026-03-28T19:45:00.000Z",
    isHome: true,
    status: "SCHEDULED",
    homeTeam: {
      id: "team-inter",
      name: "Inter Milan",
      shortName: "国米"
    },
    awayTeam: {
      id: "team-napoli",
      name: "Napoli",
      shortName: "那不勒斯"
    },
    keyStory: "对榜首形势影响直接，赛前 24 小时将进入重点提醒。",
    hasReminder: true
  },
  {
    id: "sa-lazio-away-20260316",
    competition: "serie-a",
    round: "第29轮",
    venue: "Stadio Olimpico",
    stage: "联赛",
    kickoffAtUtc: "2026-03-16T19:45:00.000Z",
    isHome: false,
    status: "FINISHED",
    homeTeam: {
      id: "team-lazio",
      name: "Lazio",
      shortName: "拉齐奥",
      score: 1
    },
    awayTeam: {
      id: "team-inter",
      name: "Inter Milan",
      shortName: "国米",
      score: 2
    },
    keyStory: "客场带走 3 分，后程追击仍然稳住节奏。",
    hasReminder: false
  },
  {
    id: "coppa-milan-home-20260402",
    competition: "coppa-italia",
    round: "半决赛",
    venue: "San Siro",
    stage: "德比战",
    kickoffAtUtc: "2026-04-02T19:00:00.000Z",
    isHome: true,
    status: "SCHEDULED",
    homeTeam: {
      id: "team-inter",
      name: "Inter Milan",
      shortName: "国米"
    },
    awayTeam: {
      id: "team-milan",
      name: "AC Milan",
      shortName: "米兰"
    },
    keyStory: "杯赛德比，情绪与轮换都会被放大。",
    hasReminder: false
  }
];

export const changesSeed: ChangeAlert[] = [
  {
    id: "change-1",
    type: "ranking",
    title: "积分差缩小到 2 分",
    detail: "上一轮取胜后，国际米兰与榜首差距缩小，争冠压力重新回到一场球内。",
    occurredAt: "2026-03-24T22:00:00.000Z",
    severity: "high"
  },
  {
    id: "change-2",
    type: "injury",
    title: "中场轮换出现存疑",
    detail: "赛前训练后更新，1 名中场出战状态从可出场调整为存疑。",
    occurredAt: "2026-03-25T08:10:00.000Z",
    severity: "medium"
  },
  {
    id: "change-3",
    type: "transfer",
    title: "夏窗候选名单有新进展",
    detail: "高可信媒体新增了一条边翼卫目标的跟进报道。",
    occurredAt: "2026-03-25T10:30:00.000Z",
    severity: "low"
  }
];

export const topNewsSeed: NewsItem[] = [
  {
    id: "news-1",
    title: "欧冠夜前瞻：蓝黑军团在慕尼黑寻找节奏与耐心",
    excerpt: "官方赛前内容聚焦中场强度与防线距离，强调客场阶段管理会是今晚的关键。",
    sourceName: "Inter.it",
    sourceType: "official",
    sourceUrl: "https://www.inter.it/en/news",
    canonicalUrl: "https://www.inter.it/en/news/ucl-preview-2026-bayern-inter",
    publishedAt: "2026-03-25T06:00:00.000Z",
    coverImageUrl: null,
    category: "official",
    tags: ["官方", "比赛日"],
    priorityScore: 98
  },
  {
    id: "news-2",
    title: "训练课最后 15 分钟：后腰位置轮换仍在测试",
    excerpt: "Matchday 线关注阿斯拉尼与巴雷拉的搭配，比赛节奏控制成为主要讨论点。",
    sourceName: "Inter Daily Desk",
    sourceType: "media",
    sourceUrl: "https://example.com/matchday-desk",
    canonicalUrl: "https://example.com/matchday-desk/inter-training-rotation",
    publishedAt: "2026-03-25T09:20:00.000Z",
    coverImageUrl: null,
    category: "matchday",
    tags: ["比赛日", "阵容"],
    priorityScore: 92
  },
  {
    id: "news-3",
    title: "转会观察：夏窗补强名单继续围绕速度与压迫能力",
    excerpt: "多家媒体将蓝黑军团与一名边翼卫联系在一起，但仍未进入官方确认阶段。",
    sourceName: "Gazzetta",
    sourceType: "media",
    sourceUrl: "https://gazzetta.example.com",
    canonicalUrl: "https://gazzetta.example.com/inter-scouting-wingback-2026",
    publishedAt: "2026-03-25T04:40:00.000Z",
    coverImageUrl: null,
    category: "transfers",
    tags: ["转会"],
    priorityScore: 87
  },
  {
    id: "news-4",
    title: "更衣室声音：经验球员要求客场先控制比赛节拍",
    excerpt: "采访内容透露，球队内部将“前 20 分钟的压迫强度”视为今晚最重要指标之一。",
    sourceName: "Inter TV",
    sourceType: "official",
    sourceUrl: "https://www.inter.it/en/inter-tv",
    canonicalUrl: "https://www.inter.it/en/inter-tv/dressing-room-rhythm",
    publishedAt: "2026-03-24T18:00:00.000Z",
    coverImageUrl: null,
    category: "interviews",
    tags: ["采访"],
    priorityScore: 80
  }
];

export const memorySeed: MemoryEntry = {
  id: "memory-2010",
  title: "伯纳乌之夜",
  subtitle: "2010 三冠王",
  seasonLabel: "2009/10",
  blurb: "那一夜，国际米兰把欧洲之巅的硬度、秩序与情绪管理都打成了俱乐部记忆的一部分。",
  category: "classic-match",
  accentLabel: "经典战役",
  sourceUrl: "https://www.inter.it/en/hall-of-fame"
};

export const standingsSeed: StandingSummary = {
  competition: "serie-a",
  competitionLabel: "意甲",
  season: "2025/26",
  inter: {
    position: 2,
    gapToLeader: 2,
    gapToTopFour: -9,
    played: 29,
    wins: 19,
    draws: 6,
    losses: 4,
    goalsFor: 57,
    goalsAgainst: 24,
    points: 63
  },
  rows: [
    {
      position: 1,
      teamId: "team-napoli",
      teamName: "Napoli",
      played: 29,
      points: 65,
      goalDiff: 28,
      form: ["W", "W", "D", "W", "L"],
      highlight: "leader"
    },
    {
      position: 2,
      teamId: "team-inter",
      teamName: "Inter",
      played: 29,
      points: 63,
      goalDiff: 33,
      form: ["W", "D", "W", "W", "W"],
      highlight: "inter"
    },
    {
      position: 3,
      teamId: "team-juventus",
      teamName: "Juventus",
      played: 29,
      points: 58,
      goalDiff: 21,
      form: ["W", "L", "W", "D", "W"]
    },
    {
      position: 4,
      teamId: "team-atalanta",
      teamName: "Atalanta",
      played: 29,
      points: 54,
      goalDiff: 16,
      form: ["D", "W", "L", "W", "D"],
      highlight: "rival"
    },
    {
      position: 5,
      teamId: "team-milan",
      teamName: "Milan",
      played: 29,
      points: 51,
      goalDiff: 14,
      form: ["W", "W", "L", "D", "W"]
    }
  ],
  stale: false,
  syncedAt: "2026-03-25T09:30:00.000Z"
};

export const squadSeed: SquadPlayer[] = [
  {
    id: "player-sommer",
    name: "Yann Sommer",
    shirtNumber: 1,
    positionGroup: "门将",
    nationality: "瑞士",
    birthDate: "1988-12-17",
    heightCm: 183,
    photoUrl: null,
    status: "可出场"
  },
  {
    id: "player-bisseck",
    name: "Yann Bisseck",
    shirtNumber: 31,
    positionGroup: "后卫",
    nationality: "德国",
    birthDate: "2000-11-29",
    heightCm: 196,
    photoUrl: null,
    status: "可出场"
  },
  {
    id: "player-acerbi",
    name: "Francesco Acerbi",
    shirtNumber: 15,
    positionGroup: "后卫",
    nationality: "意大利",
    birthDate: "1988-02-10",
    heightCm: 192,
    photoUrl: null,
    status: "可出场"
  },
  {
    id: "player-bastoni",
    name: "Alessandro Bastoni",
    shirtNumber: 95,
    positionGroup: "后卫",
    nationality: "意大利",
    birthDate: "1999-04-13",
    heightCm: 190,
    photoUrl: null,
    status: "可出场"
  },
  {
    id: "player-dumfries",
    name: "Denzel Dumfries",
    shirtNumber: 2,
    positionGroup: "后卫",
    nationality: "荷兰",
    birthDate: "1996-04-18",
    heightCm: 188,
    photoUrl: null,
    status: "可出场"
  },
  {
    id: "player-dimarco",
    name: "Federico Dimarco",
    shirtNumber: 32,
    positionGroup: "后卫",
    nationality: "意大利",
    birthDate: "1997-11-10",
    heightCm: 175,
    photoUrl: null,
    status: "存疑"
  },
  {
    id: "player-barella",
    name: "Nicolò Barella",
    shirtNumber: 23,
    positionGroup: "中场",
    nationality: "意大利",
    birthDate: "1997-02-07",
    heightCm: 172,
    photoUrl: null,
    status: "可出场"
  },
  {
    id: "player-calhanoglu",
    name: "Hakan Çalhanoğlu",
    shirtNumber: 20,
    positionGroup: "中场",
    nationality: "土耳其",
    birthDate: "1994-02-08",
    heightCm: 178,
    photoUrl: null,
    status: "可出场"
  },
  {
    id: "player-mkhitaryan",
    name: "Henrikh Mkhitaryan",
    shirtNumber: 22,
    positionGroup: "中场",
    nationality: "亚美尼亚",
    birthDate: "1989-01-21",
    heightCm: 177,
    photoUrl: null,
    status: "可出场"
  },
  {
    id: "player-frattesi",
    name: "Davide Frattesi",
    shirtNumber: 16,
    positionGroup: "中场",
    nationality: "意大利",
    birthDate: "1999-09-22",
    heightCm: 178,
    photoUrl: null,
    status: "可出场"
  },
  {
    id: "player-lautaro",
    name: "Lautaro Martínez",
    shirtNumber: 10,
    positionGroup: "前锋",
    nationality: "阿根廷",
    birthDate: "1997-08-22",
    heightCm: 174,
    photoUrl: null,
    status: "可出场"
  },
  {
    id: "player-thuram",
    name: "Marcus Thuram",
    shirtNumber: 9,
    positionGroup: "前锋",
    nationality: "法国",
    birthDate: "1997-08-06",
    heightCm: 192,
    photoUrl: null,
    status: "伤停"
  }
];

const liveStats: MatchStat[] = [
  { label: "射门", home: "9", away: "7" },
  { label: "射正", home: "3", away: "2" },
  { label: "控球率", home: "54%", away: "46%" },
  { label: "角球", home: "5", away: "2" }
];

export const detailSeeds: Record<string, FixtureDetail> = {
  "ucl-bayern-away-20260325": {
    fixture: {
      id: "ucl-bayern-away-20260325",
      competition: "ucl",
      competitionLabel: "欧冠",
      round: "1/4 决赛首回合",
      venue: "Allianz Arena",
      stage: "欧冠夜",
      kickoffAtUtc: "2026-03-25T20:00:00.000Z",
      kickoffDisplay: "03月26日 03:00",
      localTimeLabel: "Thu 03:00 · Asia/Ho Chi Minh",
      isHome: false,
      status: "LIVE",
      statusLabel: "进行中",
      statusTone: "live",
      homeTeam: rawFixtures[0].homeTeam,
      awayTeam: rawFixtures[0].awayTeam,
      countdownLabel: "下半场 63'",
      keyStory: rawFixtures[0].keyStory,
      hasReminder: true
    },
    summary: "比赛正进入最需要情绪控制的阶段，国米在中后场的距离管理仍然是今晚成败关键。",
    storylines: [
      "拜仁边路推进频率更高，国米需要限制二次落点。",
      "蓝黑军团的反击质量正在提升，但终结还差最后一步。",
      "当前 provider 不提供完整实时事件流，时间线与阵容为降级状态。"
    ],
    timeline: null,
    lineups: null,
    stats: liveStats,
    capabilities: providerCapabilities,
    syncedAt: "2026-03-25T20:46:00.000Z",
    stale: false
  },
  "sa-lazio-away-20260316": {
    fixture: {
      id: "sa-lazio-away-20260316",
      competition: "serie-a",
      competitionLabel: "意甲",
      round: "第29轮",
      venue: "Stadio Olimpico",
      stage: "联赛",
      kickoffAtUtc: "2026-03-16T19:45:00.000Z",
      kickoffDisplay: "03月17日 02:45",
      localTimeLabel: "Tue 02:45 · Asia/Ho Chi Minh",
      isHome: false,
      status: "FINISHED",
      statusLabel: "已结束",
      statusTone: "success",
      homeTeam: rawFixtures[2].homeTeam,
      awayTeam: rawFixtures[2].awayTeam,
      countdownLabel: null,
      keyStory: rawFixtures[2].keyStory,
      hasReminder: false
    },
    summary: "国米在客场把比赛拆得很稳：先用纵向推进制造差异，再靠中后场回撤把节奏压住。",
    storylines: [
      "Lautaro 的跑位把拉齐奥的中卫线持续带偏。",
      "第 72 分钟换人后，中场保护明显增强。",
      "赛后积分差距被重新压缩到 2 分。"
    ],
    timeline: [
      {
        id: "event-1",
        minute: 18,
        team: "away",
        type: "goal",
        title: "Lautaro Martínez 破门",
        description: "小禁区前点抢射得分。"
      },
      {
        id: "event-2",
        minute: 54,
        team: "home",
        type: "goal",
        title: "Lazio 扳平",
        description: "定位球二点进攻形成补射。"
      },
      {
        id: "event-3",
        minute: 67,
        team: "away",
        type: "goal",
        title: "Barella 远射制胜",
        description: "禁区前沿二次进攻完成终结。"
      },
      {
        id: "event-4",
        minute: 90,
        extraMinute: 4,
        team: "neutral",
        type: "full-time",
        title: "全场结束",
        description: "国际米兰客场 2 比 1 获胜。"
      }
    ],
    lineups: {
      home: {
        formation: "4-3-3",
        coach: "Marco Baroni",
        starters: [
          { id: "l1", name: "Provedel", number: 94, position: "GK" },
          { id: "l2", name: "Romagnoli", number: 13, position: "CB" }
        ],
        bench: [{ id: "lb1", name: "Castellanos", number: 19, position: "FW" }]
      },
      away: {
        formation: "3-5-2",
        coach: "Simone Inzaghi",
        starters: [
          { id: "i1", name: "Sommer", number: 1, position: "GK" },
          { id: "i2", name: "Bastoni", number: 95, position: "LCB" },
          { id: "i3", name: "Barella", number: 23, position: "CM" },
          { id: "i4", name: "Lautaro Martínez", number: 10, position: "ST" }
        ],
        bench: [{ id: "ib1", name: "Arnautović", number: 8, position: "FW" }]
      }
    },
    stats: [
      { label: "射门", home: "13", away: "12" },
      { label: "射正", home: "5", away: "6" },
      { label: "控球率", home: "48%", away: "52%" },
      { label: "角球", home: "4", away: "6" }
    ],
    capabilities: {
      ...providerCapabilities,
      timeline: true,
      lineups: true,
      stats: true
    },
    syncedAt: "2026-03-16T21:50:00.000Z",
    stale: false
  }
};

export const newsDetailsSeed: Record<string, NewsDetail> = Object.fromEntries(
  topNewsSeed.map((item) => [
    item.id,
    {
      ...item,
      body: `${item.title}\n\n${item.excerpt}\n\n这一条内容在 MVP 中保留来源、摘要与原文跳转，不做第三方全文搬运。`,
      related: topNewsSeed.filter((candidate) => candidate.id !== item.id).slice(0, 2)
    }
  ])
);

export const homeSeed: HomePayload = {
  nextFixture: null,
  lastFixture: null,
  standingsSummary: standingsSeed,
  topNews: topNewsSeed.slice(0, 3),
  changes: changesSeed,
  memoryCard: memorySeed,
  injuriesAndTransfers: changesSeed.filter((item) =>
    ["injury", "suspension", "transfer"].includes(item.type)
  ),
  editorial: EMPTY_HOME_EDITORIAL,
  stale: false,
  syncedAt: "2026-03-25T09:40:00.000Z"
};
