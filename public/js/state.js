import {
  ACHIEVEMENTS,
  BATTLE_NAMES,
  CATS,
  COSMETICS,
  QUEST_TEMPLATES,
  RARITIES,
  SKILLS,
  SPECIAL_EVENTS,
  UPGRADES,
  ZONES
} from "./content.js";

export function clone(value) {
  return structuredClone(value);
}

export function todayKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function yesterdayKey() {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return todayKey(date);
}

function numeric(value, fallback = 0) {
  return Number.isFinite(Number(value)) ? Number(value) : fallback;
}

export function formatNumber(value) {
  const number = Math.floor(numeric(value));
  if (number >= 1_000_000_000) return `${(number / 1_000_000_000).toFixed(1)}B`;
  if (number >= 1_000_000) return `${(number / 1_000_000).toFixed(1)}M`;
  if (number >= 10_000) return `${(number / 1_000).toFixed(1)}K`;
  return new Intl.NumberFormat("en-US").format(number);
}

export function getCat(id) {
  return CATS.find((cat) => cat.id === id) || CATS[0];
}

export function getUpgrade(id) {
  return UPGRADES.find((upgrade) => upgrade.id === id);
}

export function getSkill(id) {
  return SKILLS.find((skill) => skill.id === id);
}

export function getCosmetic(id) {
  return COSMETICS.find((item) => item.id === id);
}

export function xpForLevel(level) {
  return Math.floor(160 + Math.pow(level, 1.38) * 115);
}

export function catXpForLevel(level) {
  return Math.floor(80 + Math.pow(level, 1.48) * 64);
}

export function createDefaultSave(profile = {}) {
  const now = new Date().toISOString();
  return {
    version: 1,
    meta: {
      createdAt: now,
      lastSavedAt: now,
      lastServerSavedAt: null,
      accountId: profile.id || null
    },
    player: {
      displayName: profile.displayName || "Cat Captain",
      title: "Rookie Whisker",
      level: 1,
      xp: 0,
      skillPoints: 1
    },
    currency: {
      coins: 80,
      gems: 5,
      cosmeticTokens: 0
    },
    stats: {
      totalClicks: 0,
      totalCoinsEarned: 80,
      totalGemsEarned: 5,
      totalIdleEarned: 0,
      totalOfflineEarned: 0,
      upgradesBought: 0,
      catsOwned: 1,
      catLevelsPurchased: 0,
      battlesWon: 0,
      arenaWins: 0,
      bossesDefeated: 0,
      bossAttempts: 0,
      questsCompleted: 0,
      abilitiesUsed: 0,
      dailyClaims: 0,
      bestDailyStreak: 0,
      highestCombo: 0,
      savesWritten: 0
    },
    cats: {
      owned: {
        miso: {
          id: "miso",
          level: 1,
          xp: 0,
          stars: 1,
          recruitedAt: now,
          cosmetic: null
        }
      },
      featured: "miso",
      activeTeam: ["miso"]
    },
    upgrades: Object.fromEntries(UPGRADES.map((upgrade) => [upgrade.id, 0])),
    skills: {
      unlocked: []
    },
    inventory: {
      cosmetics: ["theme-midnight"],
      materials: {
        stardust: 0,
        ribbons: 0
      }
    },
    cosmetics: {
      theme: "theme-midnight",
      featuredHat: null,
      frame: null
    },
    quests: {
      daily: {
        date: "",
        items: [],
        bonusClaimed: false
      }
    },
    rewards: {
      daily: {
        lastClaimedDate: null,
        streak: 0,
        bestStreak: 0
      }
    },
    achievements: {
      unlocked: []
    },
    story: {
      zone: "velvet-lounge",
      unlockedZones: ["velvet-lounge"],
      bossesCleared: []
    },
    battle: {
      energy: 10,
      maxEnergy: 10,
      lastEnergyAt: now,
      bossTickets: 1,
      lastResult: null,
      log: []
    },
    settings: {
      music: true,
      sound: true,
      musicVolume: 0.45,
      sfxVolume: 0.75,
      animation: "high",
      particles: true
    }
  };
}

export function normalizeSave(save, profile = {}) {
  const base = createDefaultSave(profile);
  const source = save && typeof save === "object" ? save : {};
  const normalized = {
    ...base,
    ...source,
    meta: { ...base.meta, ...(source.meta || {}) },
    player: { ...base.player, ...(source.player || {}) },
    currency: { ...base.currency, ...(source.currency || {}) },
    stats: { ...base.stats, ...(source.stats || {}) },
    cats: {
      ...base.cats,
      ...(source.cats || {}),
      owned: { ...base.cats.owned, ...((source.cats && source.cats.owned) || {}) },
      activeTeam: Array.isArray(source.cats?.activeTeam) ? source.cats.activeTeam : base.cats.activeTeam
    },
    upgrades: { ...base.upgrades, ...(source.upgrades || {}) },
    skills: {
      unlocked: Array.isArray(source.skills?.unlocked) ? source.skills.unlocked : base.skills.unlocked
    },
    inventory: {
      ...base.inventory,
      ...(source.inventory || {}),
      cosmetics: Array.isArray(source.inventory?.cosmetics)
        ? source.inventory.cosmetics
        : base.inventory.cosmetics,
      materials: { ...base.inventory.materials, ...(source.inventory?.materials || {}) }
    },
    cosmetics: { ...base.cosmetics, ...(source.cosmetics || {}) },
    quests: {
      daily: { ...base.quests.daily, ...(source.quests?.daily || {}) }
    },
    rewards: {
      daily: { ...base.rewards.daily, ...(source.rewards?.daily || {}) }
    },
    achievements: {
      unlocked: Array.isArray(source.achievements?.unlocked)
        ? source.achievements.unlocked
        : base.achievements.unlocked
    },
    story: {
      ...base.story,
      ...(source.story || {}),
      unlockedZones: Array.isArray(source.story?.unlockedZones)
        ? source.story.unlockedZones
        : base.story.unlockedZones,
      bossesCleared: Array.isArray(source.story?.bossesCleared)
        ? source.story.bossesCleared
        : base.story.bossesCleared
    },
    battle: { ...base.battle, ...(source.battle || {}) },
    settings: { ...base.settings, ...(source.settings || {}) }
  };

  if (!normalized.cats.owned.miso) {
    normalized.cats.owned.miso = base.cats.owned.miso;
  }
  normalized.cats.activeTeam = normalized.cats.activeTeam
    .filter((id) => normalized.cats.owned[id])
    .slice(0, 3);
  if (!normalized.cats.activeTeam.length) {
    normalized.cats.activeTeam = ["miso"];
  }
  if (!normalized.cats.owned[normalized.cats.featured]) {
    normalized.cats.featured = normalized.cats.activeTeam[0];
  }

  refreshDerivedStats(normalized);
  ensureDailyQuests(normalized);
  recoverEnergy(normalized);
  unlockAvailableZones(normalized);
  return normalized;
}

export function getCurrentEvent() {
  const daySeed = todayKey()
    .split("")
    .reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return SPECIAL_EVENTS[daySeed % SPECIAL_EVENTS.length];
}

export function ensureDailyQuests(save) {
  const date = todayKey();
  if (save.quests.daily.date === date && save.quests.daily.items.length) {
    return save.quests.daily.items;
  }

  const daySeed = date
    .split("")
    .reduce((sum, char, index) => sum + char.charCodeAt(0) * (index + 1), 0);
  const levelScale = 1 + Math.max(0, save.player.level - 1) * 0.1;
  const chosen = [];
  for (let index = 0; index < 4; index += 1) {
    const template = QUEST_TEMPLATES[(daySeed + index * 2) % QUEST_TEMPLATES.length];
    chosen.push({
      id: `${template.id}-${date}-${index}`,
      templateId: template.id,
      title: template.title,
      description: template.description,
      type: template.type,
      target: Math.ceil(template.target * levelScale),
      progress: 0,
      reward: scaleReward(template.reward, 1 + index * 0.1),
      claimed: false
    });
  }
  save.quests.daily = {
    date,
    items: chosen,
    bonusClaimed: false
  };
  return save.quests.daily.items;
}

export function scaleReward(reward, multiplier = 1) {
  return {
    coins: Math.floor((reward.coins || 0) * multiplier),
    gems: Math.floor((reward.gems || 0) * multiplier),
    xp: Math.floor((reward.xp || 0) * multiplier),
    cosmetic: reward.cosmetic
  };
}

export function hasSkill(save, id) {
  return save.skills.unlocked.includes(id);
}

export function skillEffectTotal(save, key) {
  return save.skills.unlocked.reduce((sum, skillId) => {
    const skill = getSkill(skillId);
    return sum + numeric(skill?.effect?.[key], 0);
  }, 0);
}

export function getUpgradeLevel(save, id) {
  return numeric(save.upgrades[id], 0);
}

export function getUpgradeCost(save, upgrade) {
  const level = getUpgradeLevel(save, upgrade.id);
  if (level >= upgrade.max) {
    return Infinity;
  }
  return Math.floor(upgrade.baseCost * Math.pow(upgrade.growth, level));
}

export function globalMultiplier(save) {
  return 1 + skillEffectTotal(save, "globalMultiplier");
}

export function rewardMultiplier(save) {
  const bank = getUpgradeLevel(save, "royalBank") * 0.04;
  return (1 + bank) * globalMultiplier(save) * getCurrentEvent().multiplier;
}

export function idleMultiplier(save) {
  const cushions = getUpgradeLevel(save, "silkCushions") * 0.08;
  const skills = skillEffectTotal(save, "idleMultiplier");
  return (1 + cushions + skills) * globalMultiplier(save);
}

export function calculateClickValue(save, combo = 0) {
  const featured = save.cats.owned[save.cats.featured] || save.cats.owned.miso;
  const cat = getCat(featured.id);
  const catLevel = numeric(featured.level, 1);
  const pawTraining = getUpgradeLevel(save, "pawTraining");
  const comboCollars = getUpgradeLevel(save, "comboCollars");
  const comboStart = skillEffectTotal(save, "startingCombo");
  const comboStrength = 0.012 + comboCollars * 0.0018;
  const comboBonus = 1 + Math.min(combo + comboStart, 180) * comboStrength;
  const base = 1 + cat.base.click * (1 + catLevel * 0.42) + pawTraining * 1.6;
  return Math.max(1, Math.floor(base * comboBonus * rewardMultiplier(save)));
}

export function calculateCritChance(save) {
  return Math.min(0.42, 0.05 + skillEffectTotal(save, "critChance") + getUpgradeLevel(save, "comboCollars") * 0.003);
}

export function calculateIdleRate(save) {
  const catIncome = Object.values(save.cats.owned).reduce((sum, owned) => {
    const cat = getCat(owned.id);
    return sum + cat.base.idle * (1 + numeric(owned.level, 1) * 0.34);
  }, 0);
  const foundry = getUpgradeLevel(save, "treatFoundry") * 0.7;
  return Math.max(0.2, (catIncome + foundry) * idleMultiplier(save) * getCurrentEvent().multiplier);
}

export function offlineCapHours(save) {
  const bank = getUpgradeLevel(save, "royalBank") * 0.35;
  const skill = hasSkill(save, "night-bakery") ? 2.5 : 0;
  return 8 + bank + skill;
}

export function applyOfflineProgress(save) {
  const lastSavedAt = Date.parse(save.meta.lastSavedAt || save.meta.lastServerSavedAt || new Date().toISOString());
  if (!Number.isFinite(lastSavedAt)) {
    save.meta.lastSavedAt = new Date().toISOString();
    return { seconds: 0, coins: 0 };
  }
  const elapsedSeconds = Math.max(0, Math.floor((Date.now() - lastSavedAt) / 1000));
  const cappedSeconds = Math.min(elapsedSeconds, Math.floor(offlineCapHours(save) * 3600));
  const multiplier = 0.72 + getUpgradeLevel(save, "royalBank") * 0.025 + skillEffectTotal(save, "offlineMultiplier");
  const coins = Math.floor(calculateIdleRate(save) * cappedSeconds * multiplier);
  if (coins > 0) {
    grantReward(save, { coins, xp: Math.floor(Math.sqrt(coins)) }, "offline");
    save.stats.totalOfflineEarned += coins;
  }
  save.meta.lastSavedAt = new Date().toISOString();
  return { seconds: cappedSeconds, coins };
}

export function recoverEnergy(save) {
  const maxEnergy = 10 + Math.floor(save.player.level / 8);
  save.battle.maxEnergy = maxEnergy;
  if (save.battle.energy >= maxEnergy) {
    save.battle.energy = maxEnergy;
    save.battle.lastEnergyAt = new Date().toISOString();
    return 0;
  }
  const last = Date.parse(save.battle.lastEnergyAt || new Date().toISOString());
  const elapsed = Math.max(0, Date.now() - last);
  const gained = Math.floor(elapsed / (1000 * 60 * 8));
  if (gained > 0) {
    save.battle.energy = Math.min(maxEnergy, save.battle.energy + gained);
    save.battle.lastEnergyAt = new Date(last + gained * 1000 * 60 * 8).toISOString();
  }
  return gained;
}

export function grantReward(save, reward = {}, source = "reward") {
  const coins = Math.floor(numeric(reward.coins));
  const gems = Math.floor(numeric(reward.gems));
  const xp = Math.floor(numeric(reward.xp));

  if (coins > 0) {
    save.currency.coins += coins;
    save.stats.totalCoinsEarned += coins;
    if (source !== "offline") {
      recordQuestProgress(save, "earn", coins);
    }
  }
  if (gems > 0) {
    save.currency.gems += gems;
    save.stats.totalGemsEarned += gems;
  }
  if (xp > 0) {
    addPlayerXp(save, xp);
  }
  if (reward.cosmetic && !save.inventory.cosmetics.includes(reward.cosmetic)) {
    save.inventory.cosmetics.push(reward.cosmetic);
  }
  refreshDerivedStats(save);
}

export function addPlayerXp(save, amount) {
  save.player.xp += Math.floor(numeric(amount));
  let gained = 0;
  while (save.player.xp >= xpForLevel(save.player.level)) {
    save.player.xp -= xpForLevel(save.player.level);
    save.player.level += 1;
    save.player.skillPoints += save.player.level % 5 === 0 ? 2 : 1;
    gained += 1;
  }
  if (save.player.level >= 18) {
    save.player.title = "Royal Cat Tactician";
  } else if (save.player.level >= 10) {
    save.player.title = "Arena Whisker";
  } else if (save.player.level >= 5) {
    save.player.title = "Gallery Scout";
  }
  unlockAvailableZones(save);
  return gained;
}

export function spendCurrency(save, cost = {}) {
  const coins = Math.floor(numeric(cost.coins));
  const gems = Math.floor(numeric(cost.gems));
  const cosmeticTokens = Math.floor(numeric(cost.cosmeticTokens));
  if (save.currency.coins < coins || save.currency.gems < gems || save.currency.cosmeticTokens < cosmeticTokens) {
    return false;
  }
  save.currency.coins -= coins;
  save.currency.gems -= gems;
  save.currency.cosmeticTokens -= cosmeticTokens;
  return true;
}

export function canAfford(save, cost = {}) {
  return (
    save.currency.coins >= Math.floor(numeric(cost.coins)) &&
    save.currency.gems >= Math.floor(numeric(cost.gems)) &&
    save.currency.cosmeticTokens >= Math.floor(numeric(cost.cosmeticTokens))
  );
}

export function buyUpgrade(save, upgradeId) {
  const upgrade = getUpgrade(upgradeId);
  if (!upgrade) return { ok: false, message: "Upgrade not found." };
  const level = getUpgradeLevel(save, upgradeId);
  if (level >= upgrade.max) return { ok: false, message: "This upgrade is already maxed." };
  const cost = { coins: getUpgradeCost(save, upgrade) };
  if (!spendCurrency(save, cost)) return { ok: false, message: "Not enough coins." };
  save.upgrades[upgradeId] = level + 1;
  save.stats.upgradesBought += 1;
  grantReward(save, { xp: 24 + level * 3 }, "upgrade");
  recordQuestProgress(save, "upgrade", 1);
  return { ok: true, message: `${upgrade.name} upgraded to ${level + 1}.` };
}

export function unlockSkill(save, skillId) {
  const skill = getSkill(skillId);
  if (!skill) return { ok: false, message: "Skill not found." };
  if (hasSkill(save, skillId)) return { ok: false, message: "Skill already unlocked." };
  if (skill.requires.some((id) => !hasSkill(save, id))) {
    return { ok: false, message: "Unlock the prerequisite skills first." };
  }
  if (save.player.skillPoints < skill.cost) {
    return { ok: false, message: "Not enough skill points." };
  }
  save.player.skillPoints -= skill.cost;
  save.skills.unlocked.push(skillId);
  refreshDerivedStats(save);
  return { ok: true, message: `${skill.name} unlocked.` };
}

export function unlockCat(save, catId) {
  const cat = getCat(catId);
  if (!cat) return { ok: false, message: "Cat not found." };
  if (save.cats.owned[catId]) return { ok: false, message: `${cat.name} already lives in your gallery.` };
  if (!spendCurrency(save, cat.unlock)) return { ok: false, message: "Not enough coins or gems for this recruit." };
  save.cats.owned[catId] = {
    id: catId,
    level: 1,
    xp: skillEffectTotal(save, "catXp"),
    stars: 1,
    recruitedAt: new Date().toISOString(),
    cosmetic: null
  };
  if (save.cats.activeTeam.length < 3) {
    save.cats.activeTeam.push(catId);
  }
  save.cats.featured = catId;
  grantReward(save, { xp: 90 * RARITIES[cat.rarity].order }, "cat");
  refreshDerivedStats(save);
  return { ok: true, message: `${cat.name}, ${cat.epithet}, joined your collection.` };
}

export function catLevelCost(save, catId) {
  const owned = save.cats.owned[catId];
  if (!owned) return Infinity;
  const cat = getCat(catId);
  const rarity = RARITIES[cat.rarity].order;
  return Math.floor((110 + rarity * 55) * Math.pow(numeric(owned.level, 1), 1.48));
}

export function levelCat(save, catId) {
  const owned = save.cats.owned[catId];
  if (!owned) return { ok: false, message: "Recruit this cat first." };
  const cost = { coins: catLevelCost(save, catId) };
  if (!spendCurrency(save, cost)) return { ok: false, message: "Not enough coins to level this cat." };
  owned.level += 1;
  owned.xp = 0;
  save.stats.catLevelsPurchased += 1;
  grantReward(save, { xp: 50 + owned.level * 8 }, "cat-level");
  recordQuestProgress(save, "catLevel", 1);
  return { ok: true, message: `${getCat(catId).name} reached level ${owned.level}.` };
}

export function setFeaturedCat(save, catId) {
  if (!save.cats.owned[catId]) return;
  save.cats.featured = catId;
}

export function toggleTeamCat(save, catId) {
  if (!save.cats.owned[catId]) return { ok: false, message: "Recruit this cat first." };
  const index = save.cats.activeTeam.indexOf(catId);
  if (index >= 0) {
    if (save.cats.activeTeam.length === 1) {
      return { ok: false, message: "Your team needs at least one cat." };
    }
    save.cats.activeTeam.splice(index, 1);
    return { ok: true, message: `${getCat(catId).name} moved to reserve.` };
  }
  if (save.cats.activeTeam.length >= 3) {
    return { ok: false, message: "Arena teams can include up to three cats." };
  }
  save.cats.activeTeam.push(catId);
  return { ok: true, message: `${getCat(catId).name} joined the active team.` };
}

export function buyCosmetic(save, cosmeticId) {
  const cosmetic = getCosmetic(cosmeticId);
  if (!cosmetic) return { ok: false, message: "Cosmetic not found." };
  if (save.inventory.cosmetics.includes(cosmeticId)) {
    applyCosmetic(save, cosmeticId);
    return { ok: true, message: `${cosmetic.name} equipped.` };
  }
  if (!spendCurrency(save, cosmetic.cost)) return { ok: false, message: "Not enough currency for this cosmetic." };
  save.inventory.cosmetics.push(cosmeticId);
  applyCosmetic(save, cosmeticId);
  return { ok: true, message: `${cosmetic.name} unlocked and equipped.` };
}

export function applyCosmetic(save, cosmeticId) {
  const cosmetic = getCosmetic(cosmeticId);
  if (!cosmetic || !save.inventory.cosmetics.includes(cosmeticId)) return;
  if (cosmetic.type === "theme") save.cosmetics.theme = cosmeticId;
  if (cosmetic.type === "hat") save.cosmetics.featuredHat = cosmeticId;
  if (cosmetic.type === "frame") save.cosmetics.frame = cosmeticId;
}

export function claimDailyReward(save) {
  const date = todayKey();
  const daily = save.rewards.daily;
  if (daily.lastClaimedDate === date) {
    return { ok: false, message: "Daily reward already claimed today." };
  }
  daily.streak = daily.lastClaimedDate === yesterdayKey() ? daily.streak + 1 : 1;
  daily.lastClaimedDate = date;
  daily.bestStreak = Math.max(daily.bestStreak || 0, daily.streak);
  save.stats.dailyClaims += 1;
  save.stats.bestDailyStreak = Math.max(save.stats.bestDailyStreak, daily.bestStreak);
  const reward = {
    coins: Math.floor((420 + save.player.level * 110 + daily.streak * 140) * rewardMultiplier(save)),
    gems: 1 + Math.floor(daily.streak / 3) + (getUpgradeLevel(save, "gemfinder") > 0 ? 1 : 0),
    xp: 80 + daily.streak * 20
  };
  grantReward(save, reward, "daily");
  return { ok: true, message: `Daily streak ${daily.streak} claimed.`, reward };
}

export function recordQuestProgress(save, type, amount = 1) {
  ensureDailyQuests(save);
  let touched = false;
  for (const quest of save.quests.daily.items) {
    if (quest.type === type && !quest.claimed) {
      quest.progress = Math.min(quest.target, numeric(quest.progress) + amount);
      touched = true;
    }
  }
  return touched;
}

export function claimQuestReward(save, questId) {
  ensureDailyQuests(save);
  const quest = save.quests.daily.items.find((item) => item.id === questId);
  if (!quest) return { ok: false, message: "Quest not found." };
  if (quest.claimed) return { ok: false, message: "Quest already claimed." };
  if (quest.progress < quest.target) return { ok: false, message: "Quest is not complete yet." };
  quest.claimed = true;
  save.stats.questsCompleted += 1;
  const reward = scaleReward(quest.reward, 1 + getUpgradeLevel(save, "gemfinder") * 0.015);
  grantReward(save, reward, "quest");
  return { ok: true, message: `${quest.title} complete.`, reward };
}

export function claimDailyQuestBonus(save) {
  ensureDailyQuests(save);
  if (save.quests.daily.bonusClaimed) {
    return { ok: false, message: "Daily quest bonus already claimed." };
  }
  const allDone = save.quests.daily.items.every((quest) => quest.claimed);
  if (!allDone) {
    return { ok: false, message: "Finish and claim every daily quest first." };
  }
  save.quests.daily.bonusClaimed = true;
  const reward = { coins: 1600 + save.player.level * 260, gems: 4, xp: 320 };
  grantReward(save, reward, "quest-bonus");
  return { ok: true, message: "Daily quest board cleared.", reward };
}

export function calculateBattlePower(save, mode = "arena") {
  const teamIds = save.cats.activeTeam.filter((id) => save.cats.owned[id]).slice(0, 3);
  const cats = teamIds.map((id) => ({ def: getCat(id), owned: save.cats.owned[id] }));
  const raw = cats.reduce(
    (sum, entry) => {
      const level = numeric(entry.owned.level, 1);
      const scale = 1 + (level - 1) * 0.18;
      sum.hp += entry.def.base.hp * scale;
      sum.atk += entry.def.base.atk * scale;
      sum.def += entry.def.base.def * scale;
      sum.speed += entry.def.base.speed * scale;
      return sum;
    },
    { hp: 0, atk: 0, def: 0, speed: 0 }
  );

  const arenaGym = getUpgradeLevel(save, "arenaGym") * 0.07;
  const battleSkill = mode === "arena" ? skillEffectTotal(save, "arenaMultiplier") : 0;
  const bossBoost = mode === "boss" ? getUpgradeLevel(save, "bossTactics") * 0.1 : 0;
  const multiplier = (1 + arenaGym + battleSkill + bossBoost) * globalMultiplier(save);
  return {
    hp: Math.floor(raw.hp * (1 + arenaGym * 0.5)),
    atk: Math.floor(raw.atk * multiplier),
    def: Math.floor(raw.def * (1 + arenaGym + battleSkill)),
    speed: Math.floor(raw.speed * (1 + battleSkill)),
    power: Math.floor((raw.hp * 0.22 + raw.atk * 3.6 + raw.def * 2.4 + raw.speed * 1.8) * multiplier),
    cats
  };
}

export function currentZone(save) {
  return ZONES.find((zone) => zone.id === save.story.zone) || ZONES[0];
}

export function unlockAvailableZones(save) {
  for (const zone of ZONES) {
    if (save.player.level >= zone.requiredLevel && !save.story.unlockedZones.includes(zone.id)) {
      save.story.unlockedZones.push(zone.id);
    }
  }
  if (!save.story.unlockedZones.includes(save.story.zone)) {
    save.story.zone = save.story.unlockedZones[save.story.unlockedZones.length - 1] || "velvet-lounge";
  }
}

export function setZone(save, zoneId) {
  if (save.story.unlockedZones.includes(zoneId)) {
    save.story.zone = zoneId;
  }
}

function createArenaEnemy(save) {
  const level = save.player.level;
  const zoneIndex = Math.max(0, ZONES.findIndex((zone) => zone.id === save.story.zone));
  const power = calculateBattlePower(save, "arena").power;
  const name = BATTLE_NAMES[Math.floor(Math.random() * BATTLE_NAMES.length)];
  const variance = 0.86 + Math.random() * 0.32;
  return {
    name,
    title: "Rival Gallery Squad",
    hp: Math.floor((130 + level * 35 + zoneIndex * 120) * variance),
    atk: Math.floor((24 + level * 7 + power * 0.018) * variance),
    def: Math.floor((10 + level * 3 + zoneIndex * 9) * variance),
    speed: Math.floor(8 + level * 1.4 + Math.random() * 12),
    reward: {
      coins: Math.floor((500 + level * 130 + zoneIndex * 650) * rewardMultiplier(save)),
      gems: Math.random() < 0.22 + getUpgradeLevel(save, "gemfinder") * 0.015 ? 1 : 0,
      xp: Math.floor(95 + level * 24 + zoneIndex * 40)
    }
  };
}

function createBossEnemy(save) {
  const zone = currentZone(save);
  const cleared = save.story.bossesCleared.filter((id) => id === zone.id).length;
  const scale = 1 + cleared * 0.32;
  return {
    name: zone.boss.name,
    title: zone.boss.title,
    hp: Math.floor(zone.boss.hp * scale),
    atk: Math.floor(zone.boss.atk * scale),
    def: Math.floor(zone.boss.def * scale),
    speed: 9 + zone.chapter * 2,
    reward: scaleReward(zone.boss.reward, (1 + cleared * 0.16 + skillEffectTotal(save, "bossRewards")) * rewardMultiplier(save))
  };
}

export function simulateBattle(save, mode = "arena") {
  recoverEnergy(save);
  const cost = mode === "boss" ? 2 : 1;
  if (save.battle.energy < cost) {
    return { ok: false, message: "Not enough battle energy." };
  }
  save.battle.energy -= cost;
  save.battle.lastEnergyAt = new Date().toISOString();

  const team = calculateBattlePower(save, mode);
  const enemy = mode === "boss" ? createBossEnemy(save) : createArenaEnemy(save);
  if (mode === "boss") {
    save.stats.bossAttempts += 1;
    recordQuestProgress(save, "bossAttempt", 1);
  }

  let playerHp = Math.max(1, team.hp);
  let enemyHp = Math.max(1, enemy.hp);
  const log = [];
  const playerStarts = team.speed >= enemy.speed || Math.random() > 0.45;

  for (let round = 1; round <= 12 && playerHp > 0 && enemyHp > 0; round += 1) {
    const playerStrike = () => {
      const abilityBonus =
        round === 3 || round === 7
          ? team.cats.reduce((sum, entry) => sum + entry.def.ability.power * (1 + (entry.owned.level - 1) * 0.08), 0) * 0.28
          : 0;
      const crit = Math.random() < 0.12 + skillEffectTotal(save, "critChance");
      const damage = Math.max(
        6,
        Math.floor((team.atk * (0.76 + Math.random() * 0.48) + abilityBonus - enemy.def * 0.42) * (crit ? 1.75 : 1))
      );
      enemyHp -= damage;
      log.push({
        side: "player",
        text: `${round}. Your cats hit ${enemy.name} for ${damage}${crit ? " critical" : ""}.`,
        damage
      });
    };
    const enemyStrike = () => {
      const damage = Math.max(4, Math.floor(enemy.atk * (0.72 + Math.random() * 0.45) - team.def * 0.32));
      playerHp -= damage;
      log.push({
        side: "enemy",
        text: `${round}. ${enemy.name} answers for ${damage}.`,
        damage
      });
    };

    if (playerStarts) {
      playerStrike();
      if (enemyHp > 0) enemyStrike();
    } else {
      enemyStrike();
      if (playerHp > 0) playerStrike();
    }
  }

  const won = enemyHp <= 0 || (playerHp > 0 && playerHp / team.hp >= enemyHp / enemy.hp);
  const reward = won ? enemy.reward : { coins: Math.floor(enemy.reward.coins * 0.22), xp: Math.floor(enemy.reward.xp * 0.35) };

  if (won) {
    save.stats.battlesWon += 1;
    if (mode === "arena") {
      save.stats.arenaWins += 1;
      recordQuestProgress(save, "battleWin", 1);
    }
    if (mode === "boss") {
      save.stats.bossesDefeated += 1;
      save.story.bossesCleared.push(save.story.zone);
      unlockAvailableZones(save);
    }
  }

  grantReward(save, reward, mode);
  const result = {
    ok: true,
    mode,
    won,
    enemy,
    team: {
      hp: team.hp,
      atk: team.atk,
      def: team.def,
      speed: team.speed,
      power: team.power
    },
    ending: {
      playerHp: Math.max(0, Math.floor(playerHp)),
      enemyHp: Math.max(0, Math.floor(enemyHp))
    },
    reward,
    log
  };
  save.battle.lastResult = result;
  save.battle.log = log.slice(-12);
  return result;
}

export function performClick(save, combo = 0) {
  const base = calculateClickValue(save, combo);
  const crit = Math.random() < calculateCritChance(save);
  const coins = crit ? Math.floor(base * 2.25) : base;
  grantReward(save, { coins, xp: crit ? 2 : 1 }, "click");
  save.stats.totalClicks += 1;
  recordQuestProgress(save, "click", 1);
  save.stats.highestCombo = Math.max(save.stats.highestCombo, combo);
  return { coins, crit };
}

export function useAbility(save) {
  const owned = save.cats.owned[save.cats.featured] || save.cats.owned.miso;
  const cat = getCat(owned.id);
  save.stats.abilitiesUsed += 1;
  const reward = { coins: Math.floor((cat.ability.power * (1 + owned.level * 0.45)) * rewardMultiplier(save)), xp: 12 };
  if (cat.ability.type === "income") {
    reward.coins += Math.floor(calculateIdleRate(save) * 60);
  }
  if (cat.ability.type === "reward" || cat.ability.type === "mythic") {
    reward.gems = Math.random() < 0.35 ? 1 : 0;
  }
  grantReward(save, reward, "ability");
  return { cat, reward };
}

export function tickIdle(save, seconds = 1) {
  const coins = Math.floor(calculateIdleRate(save) * seconds);
  if (coins > 0) {
    save.currency.coins += coins;
    save.stats.totalCoinsEarned += coins;
    save.stats.totalIdleEarned += coins;
    recordQuestProgress(save, "earn", coins);
  }
  return coins;
}

export function achievementMetric(save, metric) {
  if (metric === "playerLevel") return save.player.level;
  if (metric === "catsOwned") return Object.keys(save.cats.owned).length;
  return numeric(save.stats[metric]);
}

export function evaluateAchievements(save) {
  const unlocked = [];
  for (const achievement of ACHIEVEMENTS) {
    if (save.achievements.unlocked.includes(achievement.id)) continue;
    if (achievementMetric(save, achievement.metric) >= achievement.target) {
      save.achievements.unlocked.push(achievement.id);
      const reward = {
        ...achievement.reward,
        gems: (achievement.reward.gems || 0) + skillEffectTotal(save, "achievementGems")
      };
      grantReward(save, reward, "achievement");
      unlocked.push(achievement);
    }
  }
  refreshDerivedStats(save);
  return unlocked;
}

export function refreshDerivedStats(save) {
  save.stats.catsOwned = Object.keys(save.cats.owned || {}).length;
  save.stats.bestDailyStreak = Math.max(save.stats.bestDailyStreak || 0, save.rewards.daily?.bestStreak || 0);
}

export function saveSummary(save) {
  return {
    level: save.player.level,
    title: save.player.title,
    coins: save.currency.coins,
    gems: save.currency.gems,
    catsOwned: Object.keys(save.cats.owned).length,
    battlesWon: save.stats.battlesWon,
    bossesDefeated: save.stats.bossesDefeated,
    achievements: save.achievements.unlocked.length,
    zone: save.story.zone
  };
}
