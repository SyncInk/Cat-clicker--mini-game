export const RARITIES = Object.freeze({
  common: {
    label: "Common",
    color: "#6ee7d8",
    soft: "rgba(110, 231, 216, 0.18)",
    order: 1
  },
  rare: {
    label: "Rare",
    color: "#7aa7ff",
    soft: "rgba(122, 167, 255, 0.18)",
    order: 2
  },
  epic: {
    label: "Epic",
    color: "#d28cff",
    soft: "rgba(210, 140, 255, 0.2)",
    order: 3
  },
  legendary: {
    label: "Legendary",
    color: "#ffd166",
    soft: "rgba(255, 209, 102, 0.22)",
    order: 4
  },
  mythic: {
    label: "Mythic",
    color: "#ff6b8b",
    soft: "rgba(255, 107, 139, 0.22)",
    order: 5
  }
});

export const CATS = Object.freeze([
  {
    id: "miso",
    name: "Miso",
    epithet: "Velvet Paw",
    rarity: "common",
    role: "Click striker",
    element: "Aqua",
    bio: "A sunny starter cat with clean combo timing and reliable idle income.",
    colors: ["#73eadf", "#ffe08a", "#18314f"],
    unlock: { coins: 0, gems: 0 },
    base: { click: 2, idle: 0.25, hp: 95, atk: 12, def: 6, speed: 9 },
    ability: {
      name: "Paw Flurry",
      type: "burst",
      description: "Deals quick bonus damage and gives the next 12 clicks a small boost.",
      power: 28,
      cooldown: 12
    }
  },
  {
    id: "mochi",
    name: "Mochi",
    epithet: "Kitchen Star",
    rarity: "common",
    role: "Idle cook",
    element: "Sugar",
    bio: "Turns spare treats into steady coin flow while you plan bigger battles.",
    colors: ["#fff3bd", "#ff8fab", "#33384d"],
    unlock: { coins: 260, gems: 0 },
    base: { click: 1, idle: 0.55, hp: 110, atk: 9, def: 9, speed: 5 },
    ability: {
      name: "Snack Cache",
      type: "income",
      description: "Instantly earns coins based on idle income.",
      power: 18,
      cooldown: 18
    }
  },
  {
    id: "pixel",
    name: "Pixel",
    epithet: "Neon Hacker",
    rarity: "rare",
    role: "Combo tuner",
    element: "Circuit",
    bio: "A bright, twitchy cat who makes long click chains feel electric.",
    colors: ["#9bffcb", "#4d7cff", "#10131f"],
    unlock: { coins: 900, gems: 3 },
    base: { click: 4, idle: 0.7, hp: 125, atk: 18, def: 8, speed: 14 },
    ability: {
      name: "Combo Script",
      type: "combo",
      description: "Extends combo duration and adds extra critical chance.",
      power: 16,
      cooldown: 16
    }
  },
  {
    id: "ember",
    name: "Ember",
    epithet: "Lantern Duelist",
    rarity: "rare",
    role: "Battle attacker",
    element: "Flame",
    bio: "A dramatic arena cat with precise strikes and boss-breaking pressure.",
    colors: ["#ff8a5c", "#ffd166", "#3a1f2b"],
    unlock: { coins: 1350, gems: 5 },
    base: { click: 3, idle: 0.45, hp: 135, atk: 24, def: 10, speed: 10 },
    ability: {
      name: "Lantern Lunge",
      type: "battle",
      description: "Adds burst damage in battles and weakens boss defense.",
      power: 42,
      cooldown: 20
    }
  },
  {
    id: "velvet",
    name: "Velvet",
    epithet: "Gallery Muse",
    rarity: "epic",
    role: "Reward stylist",
    element: "Silk",
    bio: "A glamorous cat who raises gem odds, reward quality, and badge sparkle.",
    colors: ["#e0aaff", "#f7d6ff", "#2d1b42"],
    unlock: { coins: 3500, gems: 12 },
    base: { click: 7, idle: 1.05, hp: 160, atk: 27, def: 15, speed: 11 },
    ability: {
      name: "Runway Radiance",
      type: "reward",
      description: "Temporarily increases coins from all sources.",
      power: 30,
      cooldown: 28
    }
  },
  {
    id: "luna",
    name: "Luna",
    epithet: "Moonlight Sage",
    rarity: "epic",
    role: "Support mage",
    element: "Moon",
    bio: "A calm celestial cat who shields the team and recovers battle energy.",
    colors: ["#b8c0ff", "#f7f7ff", "#263159"],
    unlock: { coins: 5200, gems: 15 },
    base: { click: 5, idle: 1.2, hp: 190, atk: 20, def: 24, speed: 8 },
    ability: {
      name: "Lunar Ward",
      type: "guard",
      description: "Reduces incoming battle damage and grants bonus energy.",
      power: 34,
      cooldown: 30
    }
  },
  {
    id: "saffron",
    name: "Saffron",
    epithet: "Royal Chef",
    rarity: "epic",
    role: "Economy captain",
    element: "Gold",
    bio: "Stacks idle multipliers and turns daily rewards into a long-term plan.",
    colors: ["#ffd166", "#ffadad", "#43351a"],
    unlock: { coins: 6800, gems: 18 },
    base: { click: 6, idle: 1.55, hp: 175, atk: 22, def: 18, speed: 8 },
    ability: {
      name: "Golden Biscuit",
      type: "income",
      description: "Doubles idle income briefly and grants a gem on perfect timing.",
      power: 44,
      cooldown: 32
    }
  },
  {
    id: "atlas",
    name: "Atlas",
    epithet: "Titan Tabby",
    rarity: "legendary",
    role: "Boss breaker",
    element: "Stone",
    bio: "A mighty cat built for long boss fights and high-health arena rivals.",
    colors: ["#8ecae6", "#ffd166", "#1f2937"],
    unlock: { coins: 14500, gems: 40 },
    base: { click: 12, idle: 2.2, hp: 320, atk: 44, def: 34, speed: 6 },
    ability: {
      name: "Mountain Pounce",
      type: "boss",
      description: "Deals heavy boss damage and grants a defensive stance.",
      power: 86,
      cooldown: 38
    }
  },
  {
    id: "nova",
    name: "Nova",
    epithet: "Starlit Ace",
    rarity: "legendary",
    role: "Critical striker",
    element: "Star",
    bio: "A rare duelist whose critical hits can flip arena battles instantly.",
    colors: ["#f15bb5", "#fee440", "#242038"],
    unlock: { coins: 22000, gems: 55 },
    base: { click: 15, idle: 1.8, hp: 245, atk: 58, def: 22, speed: 18 },
    ability: {
      name: "Supernova Scratch",
      type: "critical",
      description: "Creates a critical burst and increases combo rewards.",
      power: 110,
      cooldown: 42
    }
  },
  {
    id: "onyx",
    name: "Onyx",
    epithet: "Midnight Myth",
    rarity: "mythic",
    role: "Shadow champion",
    element: "Void",
    bio: "A mysterious endgame cat with unmatched arena control and reward scaling.",
    colors: ["#111827", "#ff6b8b", "#6ee7d8"],
    unlock: { coins: 60000, gems: 120 },
    base: { click: 28, idle: 4.8, hp: 430, atk: 92, def: 46, speed: 20 },
    ability: {
      name: "Eclipse Claw",
      type: "mythic",
      description: "Shreds enemy stats, pays bonus gems on boss wins, and resets combo decay.",
      power: 190,
      cooldown: 55
    }
  }
]);

export const UPGRADES = Object.freeze([
  {
    id: "pawTraining",
    name: "Velvet Paw Training",
    category: "Clicking",
    description: "Increases coin value from every click.",
    max: 40,
    baseCost: 35,
    growth: 1.42,
    effect: { clickFlat: 1 }
  },
  {
    id: "treatFoundry",
    name: "Treat Foundry",
    category: "Idle",
    description: "Raises automatic coin income every second.",
    max: 35,
    baseCost: 90,
    growth: 1.5,
    effect: { idleFlat: 0.7 }
  },
  {
    id: "silkCushions",
    name: "Silk Cushion Suites",
    category: "Idle",
    description: "Multiplies idle income from owned cats.",
    max: 25,
    baseCost: 240,
    growth: 1.58,
    effect: { idleMultiplier: 0.08 }
  },
  {
    id: "comboCollars",
    name: "Combo Collars",
    category: "Mastery",
    description: "Improves combo bonus and combo duration.",
    max: 25,
    baseCost: 180,
    growth: 1.56,
    effect: { combo: 0.04 }
  },
  {
    id: "arenaGym",
    name: "Arena Gym",
    category: "Battle",
    description: "Raises attack and defense for every cat on your team.",
    max: 30,
    baseCost: 420,
    growth: 1.52,
    effect: { battle: 0.07 }
  },
  {
    id: "gemfinder",
    name: "Gemfinder Whiskers",
    category: "Rewards",
    description: "Improves gem drops from quests, bosses, and streaks.",
    max: 18,
    baseCost: 900,
    growth: 1.67,
    effect: { gems: 0.04 }
  },
  {
    id: "bossTactics",
    name: "Boss Tactics Board",
    category: "Boss",
    description: "Adds bonus damage during boss challenges.",
    max: 20,
    baseCost: 1200,
    growth: 1.62,
    effect: { boss: 0.1 }
  },
  {
    id: "royalBank",
    name: "Royal Cat Bank",
    category: "Economy",
    description: "Increases offline earnings cap and coin rewards.",
    max: 15,
    baseCost: 2600,
    growth: 1.7,
    effect: { offline: 0.12, reward: 0.04 }
  }
]);

export const SKILLS = Object.freeze([
  {
    id: "steady-paws",
    name: "Steady Paws",
    branch: "Click",
    cost: 2,
    requires: [],
    description: "Click chains start at a higher multiplier.",
    effect: { startingCombo: 4 }
  },
  {
    id: "critical-whiskers",
    name: "Critical Whiskers",
    branch: "Click",
    cost: 3,
    requires: ["steady-paws"],
    description: "Adds critical coin chance while a combo is active.",
    effect: { critChance: 0.04 }
  },
  {
    id: "purr-engine",
    name: "Purr Engine",
    branch: "Idle",
    cost: 2,
    requires: [],
    description: "Owned cats generate more idle coins.",
    effect: { idleMultiplier: 0.14 }
  },
  {
    id: "night-bakery",
    name: "Night Bakery",
    branch: "Idle",
    cost: 4,
    requires: ["purr-engine"],
    description: "Offline earnings last longer and pay better.",
    effect: { offlineMultiplier: 0.2 }
  },
  {
    id: "duelist-instinct",
    name: "Duelist Instinct",
    branch: "Battle",
    cost: 3,
    requires: [],
    description: "Your team gains attack and speed in arena battles.",
    effect: { arenaMultiplier: 0.12 }
  },
  {
    id: "boss-reader",
    name: "Boss Reader",
    branch: "Battle",
    cost: 5,
    requires: ["duelist-instinct"],
    description: "Boss challenge rewards scale higher with each cleared zone.",
    effect: { bossRewards: 0.18 }
  },
  {
    id: "collector-spark",
    name: "Collector Spark",
    branch: "Collection",
    cost: 4,
    requires: [],
    description: "New cats arrive with bonus XP and gallery badges.",
    effect: { catXp: 40 }
  },
  {
    id: "radiant-badges",
    name: "Radiant Badges",
    branch: "Collection",
    cost: 6,
    requires: ["collector-spark"],
    description: "Achievements pay more gems and cosmetic tokens.",
    effect: { achievementGems: 1 }
  },
  {
    id: "mastery-crown",
    name: "Mastery Crown",
    branch: "Legend",
    cost: 10,
    requires: ["critical-whiskers", "night-bakery", "boss-reader", "radiant-badges"],
    description: "A prestige-style capstone that boosts every major system.",
    effect: { globalMultiplier: 0.18 }
  }
]);

export const ZONES = Object.freeze([
  {
    id: "velvet-lounge",
    name: "Velvet Lounge",
    chapter: 1,
    requiredLevel: 1,
    backdrop: "A warm elite lounge where new champions learn the rhythm of rewards.",
    boss: {
      name: "Baron Biscuit",
      title: "Keeper of the Silver Bowl",
      hp: 260,
      atk: 20,
      def: 8,
      reward: { coins: 650, gems: 2, xp: 110 }
    }
  },
  {
    id: "neon-docks",
    name: "Neon Docks",
    chapter: 2,
    requiredLevel: 5,
    backdrop: "A glossy harbor of glowing fish markets and rival cat crews.",
    boss: {
      name: "Captain Static",
      title: "Storm of the Night Pier",
      hp: 680,
      atk: 42,
      def: 18,
      reward: { coins: 1850, gems: 5, xp: 260 }
    }
  },
  {
    id: "crystal-rooftops",
    name: "Crystal Rooftops",
    chapter: 3,
    requiredLevel: 10,
    backdrop: "A skyline of reflective towers, rooftop duels, and rare recruit rumors.",
    boss: {
      name: "Prism Duchess",
      title: "Queen of Sharp Light",
      hp: 1450,
      atk: 78,
      def: 33,
      reward: { coins: 5200, gems: 12, xp: 620 }
    }
  },
  {
    id: "royal-comet",
    name: "Royal Comet",
    chapter: 4,
    requiredLevel: 18,
    backdrop: "An airborne palace that appears during perfect streaks.",
    boss: {
      name: "Comet Rex",
      title: "The Crowned Meteor",
      hp: 3200,
      atk: 138,
      def: 60,
      reward: { coins: 14500, gems: 24, xp: 1500 }
    }
  },
  {
    id: "midnight-observatory",
    name: "Midnight Observatory",
    chapter: 5,
    requiredLevel: 30,
    backdrop: "The endgame tower where mythic cats test long-session mastery.",
    boss: {
      name: "Nocturne Prime",
      title: "Mirror of the Final Purr",
      hp: 7600,
      atk: 260,
      def: 120,
      reward: { coins: 42000, gems: 60, xp: 4200 }
    }
  }
]);

export const QUEST_TEMPLATES = Object.freeze([
  {
    id: "click-chain",
    title: "Polished Paw Chain",
    type: "click",
    target: 120,
    reward: { coins: 350, xp: 60 },
    description: "Build a clean clicking rhythm."
  },
  {
    id: "coin-cache",
    title: "Treat Vault Sweep",
    type: "earn",
    target: 1500,
    reward: { coins: 500, gems: 1, xp: 80 },
    description: "Earn coins from any source."
  },
  {
    id: "upgrade-craft",
    title: "Atelier Upgrade",
    type: "upgrade",
    target: 3,
    reward: { coins: 700, xp: 90 },
    description: "Buy upgrades for your cats."
  },
  {
    id: "arena-night",
    title: "Arena Night Card",
    type: "battleWin",
    target: 2,
    reward: { coins: 950, gems: 2, xp: 130 },
    description: "Win arena battles."
  },
  {
    id: "boss-scout",
    title: "Boss Scout Report",
    type: "bossAttempt",
    target: 1,
    reward: { coins: 1200, xp: 120 },
    description: "Attempt a boss challenge."
  },
  {
    id: "gallery-work",
    title: "Gallery Polish",
    type: "catLevel",
    target: 1,
    reward: { coins: 900, gems: 1, xp: 110 },
    description: "Level any cat once."
  }
]);

export const ACHIEVEMENTS = Object.freeze([
  {
    id: "first-clicks",
    name: "First Fancy Clicks",
    description: "Click 100 times.",
    metric: "totalClicks",
    target: 100,
    reward: { gems: 2, xp: 80 }
  },
  {
    id: "big-combo",
    name: "Combo Conductor",
    description: "Reach a 40-click combo.",
    metric: "highestCombo",
    target: 40,
    reward: { gems: 3, xp: 150 }
  },
  {
    id: "coin-collector",
    name: "Coin Couture",
    description: "Earn 25,000 total coins.",
    metric: "totalCoinsEarned",
    target: 25000,
    reward: { gems: 4, xp: 320 }
  },
  {
    id: "upgrade-lover",
    name: "Workshop Regular",
    description: "Buy 25 upgrades.",
    metric: "upgradesBought",
    target: 25,
    reward: { gems: 4, xp: 260 }
  },
  {
    id: "arena-opener",
    name: "Arena Debut",
    description: "Win 5 arena battles.",
    metric: "arenaWins",
    target: 5,
    reward: { gems: 5, xp: 340 }
  },
  {
    id: "boss-breaker",
    name: "Boss Breaker",
    description: "Defeat 3 bosses.",
    metric: "bossesDefeated",
    target: 3,
    reward: { gems: 8, xp: 700 }
  },
  {
    id: "cat-collector",
    name: "Gallery Curator",
    description: "Own 5 cats.",
    metric: "catsOwned",
    target: 5,
    reward: { gems: 8, xp: 520, cosmetic: "theme-aurora" }
  },
  {
    id: "daily-style",
    name: "Streak Stylist",
    description: "Reach a 5-day daily reward streak.",
    metric: "bestDailyStreak",
    target: 5,
    reward: { gems: 10, xp: 650 }
  },
  {
    id: "quest-master",
    name: "Quest Board Royalty",
    description: "Complete 20 daily quests.",
    metric: "questsCompleted",
    target: 20,
    reward: { gems: 12, xp: 900 }
  },
  {
    id: "myth-seeker",
    name: "Myth Seeker",
    description: "Reach player level 25.",
    metric: "playerLevel",
    target: 25,
    reward: { gems: 20, xp: 1400, cosmetic: "frame-mythic" }
  }
]);

export const COSMETICS = Object.freeze([
  {
    id: "theme-midnight",
    name: "Midnight Club",
    type: "theme",
    description: "A dark premium UI treatment with aqua and gold highlights.",
    cost: { coins: 0, gems: 0 }
  },
  {
    id: "theme-aurora",
    name: "Aurora Gallery",
    type: "theme",
    description: "A cooler display theme unlocked by collection mastery.",
    cost: { coins: 6000, gems: 10 }
  },
  {
    id: "theme-sunrise",
    name: "Sunrise Atelier",
    type: "theme",
    description: "A brighter warm theme for long play sessions.",
    cost: { coins: 9000, gems: 14 }
  },
  {
    id: "hat-crown",
    name: "Tiny Crown",
    type: "hat",
    description: "A polished crown for your featured cat.",
    cost: { coins: 4500, gems: 8 }
  },
  {
    id: "hat-headset",
    name: "Neon Headset",
    type: "hat",
    description: "A stylish headset for combo-focused cats.",
    cost: { coins: 3600, gems: 6 }
  },
  {
    id: "frame-mythic",
    name: "Mythic Portrait Frame",
    type: "frame",
    description: "A radiant gallery frame for endgame collectors.",
    cost: { coins: 18000, gems: 25 }
  }
]);

export const SPECIAL_EVENTS = Object.freeze([
  {
    id: "moon-market",
    name: "Moon Market Weekend",
    description: "Arena wins and idle rewards pay bonus coins while the market is active.",
    multiplier: 1.12
  },
  {
    id: "neon-festival",
    name: "Neon Fish Festival",
    description: "Click combos build faster and rare cats are easier to afford.",
    multiplier: 1.1
  },
  {
    id: "royal-gala",
    name: "Royal Gallery Gala",
    description: "Daily quests pay extra gems and achievements glow brighter.",
    multiplier: 1.15
  }
]);

export const BATTLE_NAMES = Object.freeze([
  "Chrome Calico",
  "Velvet Rival",
  "Clockwork Siamese",
  "Ribbon Rogue",
  "Marble Mouser",
  "Static Shorthair",
  "Pearl Guardian",
  "Gilded Lynx"
]);
