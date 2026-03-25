const env = {
  appBaseUrl: process.env.APP_BASE_URL ?? "http://localhost:3000",
  sportsProvider: process.env.SPORTS_PROVIDER ?? "football-data",
  sportsApiKey: process.env.SPORTS_API_KEY ?? "",
  sportsTeamId: process.env.SPORTS_TEAM_ID ?? "",
  sportsCompetitionIdSerieA: process.env.SPORTS_COMPETITION_ID_SERIE_A ?? "",
  sportsCompetitionIdUcl: process.env.SPORTS_COMPETITION_ID_UCL ?? "",
  sportsCompetitionIdCoppa: process.env.SPORTS_COMPETITION_ID_COPPA ?? "",
  interOfficialBaseUrl: process.env.INTER_OFFICIAL_BASE_URL ?? "https://www.inter.it/en",
  databaseUrl: process.env.DATABASE_URL ?? "",
  redisUrl: process.env.REDIS_URL ?? "",
  cronSecret: process.env.CRON_SECRET ?? "",
  apifyToken: process.env.APIFY_TOKEN ?? "",
  apifyInstagramActorId: process.env.APIFY_INSTAGRAM_ACTOR_ID ?? "viralanalyzer~instagram-reels-scraper",
  socialSyncHours: Number(process.env.SOCIAL_SYNC_HOURS ?? "6"),
  socialClubAccount: process.env.SOCIAL_CLUB_ACCOUNT ?? "inter",
  socialPlayerAccounts: process.env.SOCIAL_PLAYER_ACCOUNTS ?? "lautaromartinez,nicolo_barella,alebastoni95,thuram",
  openAiApiKey: process.env.OPENAI_API_KEY ?? "",
  openAiModel: process.env.OPENAI_MODEL ?? "gpt-5-mini",
  aiSummaryEnabled: process.env.AI_SUMMARY_ENABLED === "true",
  vapidPublicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "",
  vapidSubject: process.env.VAPID_SUBJECT ?? "mailto:inter@example.com",
  vapidPrivateKey: process.env.VAPID_PRIVATE_KEY ?? ""
};

export default env;
