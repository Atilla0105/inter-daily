import { z } from "zod";

const matchStatusSchema = z.enum([
  "SCHEDULED",
  "LIVE",
  "HALF_TIME",
  "EXTRA_TIME",
  "PENALTIES",
  "FINISHED",
  "POSTPONED",
  "CANCELLED"
]);

const competitionKeySchema = z.enum(["serie-a", "ucl", "coppa-italia", "club-friendly"]);

const fixtureTeamSchema = z.object({
  id: z.string(),
  name: z.string(),
  shortName: z.string(),
  crestUrl: z.string().nullable().optional(),
  score: z.number().nullable().optional()
});

export const fixtureCardSchema = z.object({
  id: z.string(),
  competition: competitionKeySchema,
  competitionLabel: z.string(),
  round: z.string(),
  venue: z.string(),
  stage: z.string(),
  kickoffAtUtc: z.string(),
  kickoffDisplay: z.string(),
  localTimeLabel: z.string(),
  isHome: z.boolean(),
  status: matchStatusSchema,
  statusLabel: z.string(),
  statusTone: z.enum(["neutral", "live", "success", "warning", "danger"]),
  homeTeam: fixtureTeamSchema,
  awayTeam: fixtureTeamSchema,
  countdownLabel: z.string().nullable().optional(),
  keyStory: z.string().nullable().optional(),
  hasReminder: z.boolean(),
  stale: z.boolean().optional()
});

export const newsItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  excerpt: z.string(),
  sourceName: z.string(),
  sourceType: z.enum(["official", "media"]),
  sourceUrl: z.string().url(),
  canonicalUrl: z.string().url(),
  publishedAt: z.string(),
  coverImageUrl: z.string().nullable().optional(),
  category: z.enum(["official", "matchday", "transfers", "interviews", "video", "history"]),
  tags: z.array(z.string()),
  priorityScore: z.number(),
  stale: z.boolean().optional()
});

export const changeAlertSchema = z.object({
  id: z.string(),
  type: z.enum([
    "fixture-time",
    "injury",
    "suspension",
    "ranking",
    "lineup",
    "result",
    "news",
    "transfer"
  ]),
  title: z.string(),
  detail: z.string(),
  occurredAt: z.string(),
  severity: z.enum(["low", "medium", "high"])
});

export const standingSummarySchema = z.object({
  competition: competitionKeySchema,
  competitionLabel: z.string(),
  season: z.string(),
  inter: z.object({
    position: z.number(),
    gapToLeader: z.number(),
    gapToTopFour: z.number(),
    played: z.number(),
    wins: z.number(),
    draws: z.number(),
    losses: z.number(),
    goalsFor: z.number(),
    goalsAgainst: z.number(),
    points: z.number()
  }),
  rows: z.array(
    z.object({
      position: z.number(),
      teamId: z.string(),
      teamName: z.string(),
      played: z.number(),
      points: z.number(),
      form: z.array(z.string()),
      goalDiff: z.number(),
      highlight: z.enum(["inter", "leader", "rival"]).optional()
    })
  ),
  stale: z.boolean(),
  syncedAt: z.string()
});

export const memoryEntrySchema = z.object({
  id: z.string(),
  title: z.string(),
  subtitle: z.string(),
  seasonLabel: z.string(),
  blurb: z.string(),
  category: z.enum(["legend", "hall-of-fame", "classic-match", "today-in-history"]),
  accentLabel: z.string(),
  sourceUrl: z.string().url()
});

export const homePayloadSchema = z.object({
  nextFixture: fixtureCardSchema.nullable(),
  lastFixture: fixtureCardSchema.nullable(),
  standingsSummary: standingSummarySchema.nullable(),
  topNews: z.array(newsItemSchema),
  changes: z.array(changeAlertSchema),
  memoryCard: memoryEntrySchema.nullable(),
  injuriesAndTransfers: z.array(changeAlertSchema),
  stale: z.boolean(),
  syncedAt: z.string()
});

export const providerCapabilitySchema = z.object({
  timeline: z.boolean(),
  lineups: z.boolean(),
  stats: z.boolean(),
  injuries: z.boolean(),
  liveEvents: z.boolean(),
  playerRatings: z.boolean(),
  fanReaction: z.boolean()
});

export const fixtureDetailSchema = z.object({
  fixture: fixtureCardSchema,
  summary: z.string(),
  storylines: z.array(z.string()),
  timeline: z
    .array(
      z.object({
        id: z.string(),
        minute: z.number(),
        extraMinute: z.number().nullable().optional(),
        team: z.enum(["home", "away", "neutral"]),
        type: z.enum([
          "goal",
          "own-goal",
          "penalty",
          "yellow-card",
          "red-card",
          "substitution",
          "var",
          "half-time",
          "full-time",
          "info"
        ]),
        title: z.string(),
        description: z.string().nullable().optional(),
        playerIn: z.string().nullable().optional(),
        playerOut: z.string().nullable().optional()
      })
    )
    .nullable(),
  lineups: z
    .object({
      home: z.object({
        formation: z.string(),
        coach: z.string(),
        starters: z.array(
          z.object({
            id: z.string(),
            name: z.string(),
            number: z.number(),
            position: z.string(),
            status: z.enum(["fit", "injured", "suspended", "doubtful"]).optional()
          })
        ),
        bench: z.array(
          z.object({
            id: z.string(),
            name: z.string(),
            number: z.number(),
            position: z.string(),
            status: z.enum(["fit", "injured", "suspended", "doubtful"]).optional()
          })
        )
      }),
      away: z.object({
        formation: z.string(),
        coach: z.string(),
        starters: z.array(
          z.object({
            id: z.string(),
            name: z.string(),
            number: z.number(),
            position: z.string(),
            status: z.enum(["fit", "injured", "suspended", "doubtful"]).optional()
          })
        ),
        bench: z.array(
          z.object({
            id: z.string(),
            name: z.string(),
            number: z.number(),
            position: z.string(),
            status: z.enum(["fit", "injured", "suspended", "doubtful"]).optional()
          })
        )
      })
    })
    .nullable(),
  stats: z
    .array(
      z.object({
        label: z.string(),
        home: z.string(),
        away: z.string()
      })
    )
    .nullable(),
  capabilities: providerCapabilitySchema,
  syncedAt: z.string(),
  stale: z.boolean()
});

export const squadPlayerSchema = z.object({
  id: z.string(),
  name: z.string(),
  shirtNumber: z.number(),
  positionGroup: z.enum(["门将", "后卫", "中场", "前锋"]),
  nationality: z.string(),
  birthDate: z.string().nullable().optional(),
  heightCm: z.number().nullable().optional(),
  photoUrl: z.string().nullable().optional(),
  status: z.enum(["可出场", "伤停", "停赛", "存疑"])
});

export const userPreferencesSchema = z.object({
  theme: z.enum(["classic", "contrast"]),
  motion: z.enum(["full", "reduced"]),
  notifications: z.object({
    enabled: z.boolean(),
    matchReminders: z.boolean(),
    liveEvents: z.boolean(),
    officialNews: z.boolean(),
    quietHoursEnabled: z.boolean(),
    quietHoursStart: z.string(),
    quietHoursEnd: z.string()
  }),
  savedFixtureIds: z.array(z.string()),
  savedNewsIds: z.array(z.string()),
  ratingEntries: z.record(z.number()),
  reactionPresets: z.array(z.string()),
  installTipDismissedAt: z.string().nullable()
});

export const apiEnvelopeSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    data: dataSchema,
    stale: z.boolean(),
    syncedAt: z.string(),
    offlineReady: z.boolean().optional()
  });
