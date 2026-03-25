export type MatchStatus =
  | "SCHEDULED"
  | "LIVE"
  | "HALF_TIME"
  | "EXTRA_TIME"
  | "PENALTIES"
  | "FINISHED"
  | "POSTPONED"
  | "CANCELLED";

export type CompetitionKey = "serie-a" | "ucl" | "coppa-italia" | "club-friendly";

export type NewsCategory =
  | "official"
  | "matchday"
  | "transfers"
  | "interviews"
  | "video"
  | "history";

export type ThemeMode = "classic" | "contrast";

export type MotionMode = "full" | "reduced";

export type AppLanguage = "zh" | "ug";

export type SocialSourceType = "club" | "player";

export type SocialPostType = "post" | "reel";

export type ProviderCapability = {
  timeline: boolean;
  lineups: boolean;
  stats: boolean;
  injuries: boolean;
  liveEvents: boolean;
  playerRatings: boolean;
  fanReaction: boolean;
};

export type TeamRecord = {
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
};

export type FixtureTeam = {
  id: string;
  name: string;
  shortName: string;
  crestUrl?: string | null;
  score?: number | null;
};

export type FixtureCard = {
  id: string;
  competition: CompetitionKey;
  competitionLabel: string;
  round: string;
  venue: string;
  stage: string;
  kickoffAtUtc: string;
  kickoffDisplay: string;
  localTimeLabel: string;
  isHome: boolean;
  status: MatchStatus;
  statusLabel: string;
  statusTone: "neutral" | "live" | "success" | "warning" | "danger";
  homeTeam: FixtureTeam;
  awayTeam: FixtureTeam;
  countdownLabel?: string | null;
  keyStory?: string | null;
  hasReminder: boolean;
  stale?: boolean;
};

export type TimelineEvent = {
  id: string;
  minute: number;
  extraMinute?: number | null;
  team: "home" | "away" | "neutral";
  type: "goal" | "own-goal" | "penalty" | "yellow-card" | "red-card" | "substitution" | "var" | "half-time" | "full-time" | "info";
  title: string;
  description?: string | null;
  playerIn?: string | null;
  playerOut?: string | null;
};

export type LineupPlayer = {
  id: string;
  name: string;
  number: number;
  position: string;
  status?: "fit" | "injured" | "suspended" | "doubtful";
};

export type TeamLineup = {
  formation: string;
  coach: string;
  starters: LineupPlayer[];
  bench: LineupPlayer[];
};

export type MatchStat = {
  label: string;
  home: string;
  away: string;
};

export type FixtureDetail = {
  fixture: FixtureCard;
  summary: string;
  storylines: string[];
  timeline: TimelineEvent[] | null;
  lineups: {
    home: TeamLineup;
    away: TeamLineup;
  } | null;
  stats: MatchStat[] | null;
  capabilities: ProviderCapability;
  syncedAt: string;
  stale: boolean;
  editorialSources?: string[];
};

export type StandingRow = {
  position: number;
  teamId: string;
  teamName: string;
  played: number;
  points: number;
  form: string[];
  goalDiff: number;
  highlight?: "inter" | "leader" | "rival";
};

export type StandingSummary = {
  competition: CompetitionKey;
  competitionLabel: string;
  season: string;
  inter: TeamRecord & {
    position: number;
    gapToLeader: number;
    gapToTopFour: number;
  };
  rows: StandingRow[];
  stale: boolean;
  syncedAt: string;
};

export type NewsItem = {
  id: string;
  title: string;
  excerpt: string;
  sourceName: string;
  sourceType: "official" | "media";
  sourceUrl: string;
  canonicalUrl: string;
  publishedAt: string;
  coverImageUrl?: string | null;
  category: NewsCategory;
  tags: string[];
  priorityScore: number;
  stale?: boolean;
};

export type NewsDetail = NewsItem & {
  body: string;
  related: NewsItem[];
};

export type ChangeAlert = {
  id: string;
  type:
    | "fixture-time"
    | "injury"
    | "suspension"
    | "ranking"
    | "lineup"
    | "result"
    | "news"
    | "transfer";
  title: string;
  detail: string;
  occurredAt: string;
  severity: "low" | "medium" | "high";
};

export type EditorialNewsSummary = {
  newsId: string;
  summary: string;
  sourceUrls: string[];
};

export type EditorialBrief = {
  title: string;
  detail: string;
  sourceUrls: string[];
  sourceTitles: string[];
  severity: "low" | "medium" | "high";
  type?: ChangeAlert["type"] | "club" | "player";
};

export type EditorialStoryline = {
  summary: string | null;
  bullets: string[];
  sourceUrls: string[];
};

export type HomeEditorial = {
  topNewsSummaries: EditorialNewsSummary[];
  clubUpdates: EditorialBrief[];
  playerUpdates: EditorialBrief[];
  injuryTransferWatch: EditorialBrief[];
  dailyChangeDigest: EditorialBrief[];
  preMatchStoryline: EditorialStoryline | null;
};

export type MemoryEntry = {
  id: string;
  title: string;
  subtitle: string;
  seasonLabel: string;
  blurb: string;
  category: "legend" | "hall-of-fame" | "classic-match" | "today-in-history";
  accentLabel: string;
  sourceUrl: string;
};

export type SquadPlayer = {
  id: string;
  name: string;
  shirtNumber: number;
  positionGroup: "门将" | "后卫" | "中场" | "前锋";
  nationality: string;
  birthDate?: string | null;
  heightCm?: number | null;
  photoUrl?: string | null;
  status: "可出场" | "伤停" | "停赛" | "存疑";
};

export type HomePayload = {
  nextFixture: FixtureCard | null;
  lastFixture: FixtureCard | null;
  standingsSummary: StandingSummary | null;
  topNews: NewsItem[];
  changes: ChangeAlert[];
  memoryCard: MemoryEntry | null;
  injuriesAndTransfers: ChangeAlert[];
  editorial: HomeEditorial;
  stale: boolean;
  syncedAt: string;
};

export type NotificationPreferences = {
  enabled: boolean;
  matchReminders: boolean;
  liveEvents: boolean;
  officialNews: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
};

export type UserPreferences = {
  language: AppLanguage;
  theme: ThemeMode;
  motion: MotionMode;
  notifications: NotificationPreferences;
  savedFixtureIds: string[];
  savedNewsIds: string[];
  ratingEntries: Record<string, number>;
  reactionPresets: string[];
  installTipDismissedAt: string | null;
};

export type CoachProfile = {
  name: string;
  role: string;
  summary: string;
  badge: string;
};

export type MirroredSocialAccount = {
  sourceAccount: string;
  displayName: string;
  sourceType: SocialSourceType;
  roleLabel: string;
  summary: string;
  lookupKeywords?: string[];
};

export type SocialFeedItem = {
  id: string;
  sourceAccount: string;
  sourceLabel: string;
  sourceType: SocialSourceType;
  postType: SocialPostType;
  caption: string;
  publishedAt: string;
  thumbnail: string | null;
  mediaUrl?: string | null;
  permalink?: string | null;
  stale?: boolean;
};

export type SocialMirrorRecord = Omit<SocialFeedItem, "thumbnail" | "mediaUrl"> & {
  remoteThumbnailUrl?: string | null;
  remoteMediaUrl?: string | null;
};

export type PushSubscriptionRecord = {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
};

export type ApiEnvelope<T> = {
  data: T;
  stale: boolean;
  syncedAt: string;
  offlineReady?: boolean;
};

export const DEFAULT_PROVIDER_CAPABILITIES: ProviderCapability = {
  timeline: false,
  lineups: false,
  stats: false,
  injuries: false,
  liveEvents: false,
  playerRatings: true,
  fanReaction: true
};

export const EMPTY_HOME_EDITORIAL: HomeEditorial = {
  topNewsSummaries: [],
  clubUpdates: [],
  playerUpdates: [],
  injuryTransferWatch: [],
  dailyChangeDigest: [],
  preMatchStoryline: null
};

export const DEFAULT_PREFERENCES: UserPreferences = {
  language: "zh",
  theme: "classic",
  motion: "full",
  notifications: {
    enabled: true,
    matchReminders: true,
    liveEvents: true,
    officialNews: true,
    quietHoursEnabled: false,
    quietHoursStart: "23:00",
    quietHoursEnd: "08:00"
  },
  savedFixtureIds: [],
  savedNewsIds: [],
  ratingEntries: {},
  reactionPresets: ["Forza Inter", "冷静一点", "这球真关键"],
  installTipDismissedAt: null
};
