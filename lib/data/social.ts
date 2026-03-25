import type { CoachProfile, MirroredSocialAccount, SocialMirrorRecord } from "@/lib/types";

export const headCoachProfile: CoachProfile = {
  name: "Cristian Chivu",
  role: "主教练",
  summary: "现在这一栏不再追 live，而是回到球队本身：主教练、核心球员和俱乐部社媒镜像集中展示。",
  badge: "一线队"
};

export const mirroredSocialAccounts: MirroredSocialAccount[] = [
  {
    sourceAccount: "inter",
    displayName: "Inter",
    sourceType: "club",
    roleLabel: "俱乐部官方",
    summary: "优先同步俱乐部官方发布的训练、海报、赛前赛后和更衣室内容。 "
  },
  {
    sourceAccount: "lautaromartinez",
    displayName: "劳塔罗",
    sourceType: "player",
    roleLabel: "队长 / 前锋",
    summary: "队长视角，通常最适合看比赛日、训练日和更衣室情绪。",
    lookupKeywords: ["lautaro", "martinez"]
  },
  {
    sourceAccount: "nicolo_barella",
    displayName: "巴雷拉",
    sourceType: "player",
    roleLabel: "中场核心",
    summary: "中场强度与比赛日表达最稳定的个人账号之一。",
    lookupKeywords: ["barella", "nicolo"]
  },
  {
    sourceAccount: "alebastoni95",
    displayName: "巴斯托尼",
    sourceType: "player",
    roleLabel: "后场核心",
    summary: "防线领袖之一，训练照和比赛内容价值很高。",
    lookupKeywords: ["bastoni", "alessandro"]
  },
  {
    sourceAccount: "thuram",
    displayName: "图拉姆",
    sourceType: "player",
    roleLabel: "锋线主力",
    summary: "更偏生活方式和比赛氛围，但比赛日内容通常很强。",
    lookupKeywords: ["thuram", "marcus"]
  }
];

export const corePlayerProfiles = [
  {
    displayName: "Yann Sommer",
    roleLabel: "主力门将",
    lookupKeywords: ["sommer"],
    socialAccount: null
  },
  {
    displayName: "Yann Bisseck",
    roleLabel: "机动中卫",
    lookupKeywords: ["bisseck"],
    socialAccount: null
  },
  {
    displayName: "Francesco Acerbi",
    roleLabel: "防线中枢",
    lookupKeywords: ["acerbi"],
    socialAccount: null
  },
  {
    displayName: "Alessandro Bastoni",
    roleLabel: "左中卫核心",
    lookupKeywords: ["bastoni", "alessandro"],
    socialAccount: "alebastoni95"
  },
  {
    displayName: "Denzel Dumfries",
    roleLabel: "右翼卫",
    lookupKeywords: ["dumfries"],
    socialAccount: null
  },
  {
    displayName: "Federico Dimarco",
    roleLabel: "左翼卫",
    lookupKeywords: ["dimarco"],
    socialAccount: null
  },
  {
    displayName: "Nicolò Barella",
    roleLabel: "中场推进核心",
    lookupKeywords: ["barella", "nicolo"],
    socialAccount: "nicolo_barella"
  },
  {
    displayName: "Hakan Calhanoglu",
    roleLabel: "中场节拍器",
    lookupKeywords: ["calhanoglu", "hakan"],
    socialAccount: null
  },
  {
    displayName: "Henrikh Mkhitaryan",
    roleLabel: "经验型中场",
    lookupKeywords: ["mkhitaryan", "henrikh"],
    socialAccount: null
  },
  {
    displayName: "Davide Frattesi",
    roleLabel: "前插型中场",
    lookupKeywords: ["frattesi", "davide"],
    socialAccount: null
  },
  {
    displayName: "Marcus Thuram",
    roleLabel: "锋线主力",
    lookupKeywords: ["thuram", "marcus"],
    socialAccount: "thuram"
  },
  {
    displayName: "Lautaro Martínez",
    roleLabel: "队长 / 中锋",
    lookupKeywords: ["lautaro", "martinez"],
    socialAccount: "lautaromartinez"
  }
] as const;

export const socialFeedSeed: SocialMirrorRecord[] = [
  {
    id: "mirror-inter-20260325-club-1",
    sourceAccount: "inter",
    sourceLabel: "Inter",
    sourceType: "club",
    postType: "post",
    caption: "训练基地最新一组镜像内容：比赛周节奏恢复、分组对抗和赛前定格。",
    publishedAt: "2026-03-25T08:00:00.000Z",
    permalink: "https://www.instagram.com/p/inter-20260325-1/",
    remoteThumbnailUrl: null,
    remoteMediaUrl: null
  },
  {
    id: "mirror-lautaro-20260325-reel-1",
    sourceAccount: "lautaromartinez",
    sourceLabel: "劳塔罗",
    sourceType: "player",
    postType: "reel",
    caption: "比赛周训练镜头，重点还是射门脚感和高压下第一步处理。",
    publishedAt: "2026-03-25T05:20:00.000Z",
    permalink: "https://www.instagram.com/reel/lautaro-20260325-1/",
    remoteThumbnailUrl: null,
    remoteMediaUrl: null
  },
  {
    id: "mirror-barella-20260324-post-1",
    sourceAccount: "nicolo_barella",
    sourceLabel: "巴雷拉",
    sourceType: "player",
    postType: "post",
    caption: "训练日常与队友互动，节奏轻，但很像赛前一天的更衣室气氛。",
    publishedAt: "2026-03-24T16:10:00.000Z",
    permalink: "https://www.instagram.com/p/barella-20260324-1/",
    remoteThumbnailUrl: null,
    remoteMediaUrl: null
  },
  {
    id: "mirror-bastoni-20260324-post-1",
    sourceAccount: "alebastoni95",
    sourceLabel: "巴斯托尼",
    sourceType: "player",
    postType: "post",
    caption: "后防训练镜像：站位、身体朝向和二点保护的内容比较明显。",
    publishedAt: "2026-03-24T10:30:00.000Z",
    permalink: "https://www.instagram.com/p/bastoni-20260324-1/",
    remoteThumbnailUrl: null,
    remoteMediaUrl: null
  },
  {
    id: "mirror-thuram-20260323-reel-1",
    sourceAccount: "thuram",
    sourceLabel: "图拉姆",
    sourceType: "player",
    postType: "reel",
    caption: "训练场轻松镜头，偏生活感，但能看到锋线状态保持得不错。",
    publishedAt: "2026-03-23T17:40:00.000Z",
    permalink: "https://www.instagram.com/reel/thuram-20260323-1/",
    remoteThumbnailUrl: null,
    remoteMediaUrl: null
  },
  {
    id: "mirror-inter-20260323-post-1",
    sourceAccount: "inter",
    sourceLabel: "Inter",
    sourceType: "club",
    postType: "post",
    caption: "俱乐部海报镜像：训练结束后的一组官方图，氛围比较克制但很有比赛周味道。",
    publishedAt: "2026-03-23T12:00:00.000Z",
    permalink: "https://www.instagram.com/p/inter-20260323-1/",
    remoteThumbnailUrl: null,
    remoteMediaUrl: null
  },
  {
    id: "mirror-lautaro-20260322-post-1",
    sourceAccount: "lautaromartinez",
    sourceLabel: "劳塔罗",
    sourceType: "player",
    postType: "post",
    caption: "经典的赛前合照型内容，适合做球队页的情绪补充。",
    publishedAt: "2026-03-22T18:20:00.000Z",
    permalink: "https://www.instagram.com/p/lautaro-20260322-1/",
    remoteThumbnailUrl: null,
    remoteMediaUrl: null
  },
  {
    id: "mirror-barella-20260322-reel-1",
    sourceAccount: "nicolo_barella",
    sourceLabel: "巴雷拉",
    sourceType: "player",
    postType: "reel",
    caption: "短视频镜像，节奏很快，适合在球队页里做近期氛围入口。",
    publishedAt: "2026-03-22T09:00:00.000Z",
    permalink: "https://www.instagram.com/reel/barella-20260322-1/",
    remoteThumbnailUrl: null,
    remoteMediaUrl: null
  }
];
