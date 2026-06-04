import {
  ACHIEVEMENTS,
  CATS,
  COSMETICS,
  RARITIES,
  SKILLS,
  UPGRADES,
  ZONES
} from "./content.js";
import {
  applyCosmetic,
  applyOfflineProgress,
  buyCosmetic,
  buyUpgrade,
  calculateBattlePower,
  calculateClickValue,
  calculateIdleRate,
  canAfford,
  catLevelCost,
  claimDailyQuestBonus,
  claimDailyReward,
  claimQuestReward,
  currentZone,
  ensureDailyQuests,
  evaluateAchievements,
  formatNumber,
  getCat,
  getCosmetic,
  getCurrentEvent,
  getUpgradeCost,
  hasSkill,
  levelCat,
  normalizeSave,
  performClick,
  recoverEnergy,
  rewardMultiplier,
  setFeaturedCat,
  setZone,
  simulateBattle,
  tickIdle,
  todayKey,
  toggleTeamCat,
  unlockCat,
  unlockSkill,
  useAbility,
  xpForLevel
} from "./state.js";
import {
  fetchHistory,
  fetchLeaderboard,
  fetchSave,
  getToken,
  logout,
  restoreHistory,
  writeSave
} from "./api.js";
import { AudioDirector } from "./audio.js";

const audio = new AudioDirector();

let profile = null;
let save = null;
let activeView = "overview";
let combo = 0;
let comboTimer = null;
let dirty = false;
let saving = false;
let lastSaveMessage = "Not loaded";
let lastOffline = null;
let abilityReadyAt = 0;
let historyCache = null;
let historyLoading = false;
let leaderboardCache = null;
let leaderboardLoading = false;
let idleTimer = null;
let autosaveTimer = null;

const els = {};

document.addEventListener("DOMContentLoaded", () => {
  cacheElements();
  wireEvents();
  boot();
});

function cacheElements() {
  els.loading = document.querySelector("#loading-screen");
  els.game = document.querySelector("#game-shell");
  els.viewRoot = document.querySelector("#view-root");
  els.toastStack = document.querySelector("#toast-stack");
  els.profileName = document.querySelector("#profile-name");
  els.profileTitle = document.querySelector("#profile-title");
  els.coinReadout = document.querySelector("#coin-readout");
  els.gemReadout = document.querySelector("#gem-readout");
  els.idleReadout = document.querySelector("#idle-readout");
  els.saveStatus = document.querySelector("#save-status");
  els.nav = document.querySelector("#main-nav");
}

async function boot() {
  const token = getToken();
  if (!token) {
    window.location.replace('/auth.html');
    return;
  }
  showLoading(true);
  try {
    await loadAccount();
  } catch (error) {
    console.error('Boot failed:', error);
    // If auth failed, redirect to login
    if (error.message && (error.message.includes('401') || error.message.includes('session') || error.message.includes('Invalid'))) {
      localStorage.removeItem('catClickerToken');
      localStorage.removeItem('catClickerProfile');
      window.location.replace('/auth.html');
      return;
    }
    showToast(error.message, "danger");
  } finally {
    showLoading(false);
  }
}

function wireEvents() {
  document.body.addEventListener("click", handleClick);
  document.body.addEventListener("change", handleChange);
  document.body.addEventListener("input", handleInput);
  document.addEventListener("keydown", handleKey);
  window.addEventListener("beforeunload", () => {
    if (!save || !dirty) return;
    save.meta.lastSavedAt = new Date().toISOString();
    const token = getToken();
    if (!token) return;
    fetch("/api/save", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ save, reason: "autosave" }),
      keepalive: true
    }).catch(() => {});
  });
}

async function loadAccount() {
  const result = await fetchSave();
  profile = result.profile;
  save = normalizeSave(result.save, profile);
  lastOffline = applyOfflineProgress(save);
  audio.hydrate(save.settings);
  applyTheme();
  showGame();
  startLoops();
  render();
  if (!result.save) {
    showToast("Account created. Your permanent save slot is ready.", "success");
    markDirty();
    await saveNow("checkpoint");
  } else if (lastOffline.coins > 0) {
    showToast(`Offline income collected: ${formatNumber(lastOffline.coins)} coins.`, "success");
    markDirty();
    await saveNow("checkpoint");
  }
}

function showLoading(visible) {
  if (els.loading) {
    els.loading.classList.toggle("is-visible", visible);
  }
}

function showGame() {
  if (els.game) {
    els.game.hidden = false;
  }
}

function startLoops() {
  stopLoops();
  idleTimer = setInterval(() => {
    if (!save) return;
    recoverEnergy(save);
    tickIdle(save, 1);
    const unlocked = evaluateAchievements(save);
    for (const achievement of unlocked) {
      showToast(`Achievement unlocked: ${achievement.name}`, "success");
      audio.reward();
    }
    markDirty(false);
    updateHud();
    renderSmallDynamics();
  }, 1000);

  autosaveTimer = setInterval(() => {
    if (dirty && !saving) {
      saveNow("autosave");
    }
  }, 12000);
}

function stopLoops() {
  clearInterval(idleTimer);
  clearInterval(autosaveTimer);
  idleTimer = null;
  autosaveTimer = null;
  audio.stopMusic();
}

function markDirty(updateStatus = true) {
  dirty = true;
  if (updateStatus) {
    lastSaveMessage = "Unsaved changes";
    updateHud();
  }
}

async function saveNow(reason = "manual") {
  if (!save || saving) return;
  saving = true;
  lastSaveMessage = "Saving...";
  updateHud();
  try {
    save.meta.lastSavedAt = new Date().toISOString();
    save.stats.savesWritten += 1;
    const result = await writeSave(save, reason);
    dirty = false;
    lastSaveMessage = `Saved rev ${result.revision}`;
    if (reason === "manual") {
      historyCache = null;
      showToast("Manual save completed.", "success");
    }
  } catch (error) {
    lastSaveMessage = "Save failed";
    showToast(error.message, "danger");
  } finally {
    saving = false;
    updateHud();
  }
}
async function handleClick(event) {
  const viewButton = event.target.closest("[data-view]");
  if (viewButton) {
    activeView = viewButton.dataset.view;
    if (activeView === "inventory") refreshHistory();
    if (activeView === "leaderboard") refreshLeaderboard();
    render();
    return;
  }

  const action = event.target.closest("[data-action]");
  if (!action || !save) return;

  audio.ensureContext();
  audio.startMusic();

  const id = action.dataset.id;
  switch (action.dataset.action) {
    case "click-cat":
      handleCatClick(event);
      break;
    case "ability":
      handleAbility();
      break;
    case "buy-upgrade":
      handleResult(buyUpgrade(save, id), "upgrade");
      break;
    case "unlock-skill":
      handleResult(unlockSkill(save, id), "upgrade");
      break;
    case "unlock-cat":
      handleResult(unlockCat(save, id), "reward");
      break;
    case "level-cat":
      handleResult(levelCat(save, id), "upgrade");
      break;
    case "feature-cat":
      setFeaturedCat(save, id);
      showToast(`${getCat(id).name} is now featured.`, "success");
      markDirty();
      render();
      break;
    case "team-cat":
      handleResult(toggleTeamCat(save, id), "upgrade");
      break;
    case "claim-daily":
      handleResult(claimDailyReward(save), "reward");
      break;
    case "claim-quest":
      handleResult(claimQuestReward(save, id), "reward");
      break;
    case "claim-quest-bonus":
      handleResult(claimDailyQuestBonus(save), "reward");
      break;
    case "battle-arena":
      handleBattle("arena");
      break;
    case "battle-boss":
      handleBattle("boss");
      break;
    case "set-zone":
      setZone(save, id);
      showToast(`${currentZone(save).name} selected.`, "success");
      markDirty();
      render();
      break;
    case "buy-cosmetic":
      handleResult(buyCosmetic(save, id), "reward");
      break;
    case "apply-cosmetic":
      applyCosmetic(save, id);
      applyTheme();
      showToast(`${getCosmetic(id).name} equipped.`, "success");
      markDirty();
      render();
      break;
    case "save-manual":
      await saveNow("manual");
      break;
    case "restore-save":
      await handleRestore(id);
      break;
    case "logout":
      await saveNow("manual");
      await logout();
      break;
    default:
      break;
  }
}

function handleChange(event) {
  if (!save) return;
  const target = event.target;
  if (!target.matches("[data-setting]")) return;
  const key = target.dataset.setting;
  if (target.type === "checkbox") {
    save.settings[key] = target.checked;
  } else {
    save.settings[key] = target.value;
  }
  audio.hydrate(save.settings);
  if (key === "music") {
    save.settings.music ? audio.startMusic() : audio.stopMusic();
  }
  applyTheme();
  markDirty();
  render();
}

function handleInput(event) {
  if (!save) return;
  const target = event.target;
  if (!target.matches("[data-setting-range]")) return;
  const key = target.dataset.settingRange;
  save.settings[key] = Number(target.value);
  audio.hydrate(save.settings);
  markDirty();
  renderSmallDynamics();
}

function handleKey(event) {
  if (!save || els.game.hidden) return;
  if (event.code === "Space") {
    event.preventDefault();
    handleCatClick(event);
  }
  if (event.key.toLowerCase() === "b") {
    handleBattle("arena");
  }
  if (event.key.toLowerCase() === "s" && (event.ctrlKey || event.metaKey)) {
    event.preventDefault();
    saveNow("manual");
  }
}

function handleCatClick(event) {
  if (!save) return;
  combo += 1;
  clearTimeout(comboTimer);
  const duration = 1700 + (save.upgrades.comboCollars || 0) * 60 + (hasSkill(save, "steady-paws") ? 450 : 0);
  comboTimer = setTimeout(() => {
    combo = 0;
    renderSmallDynamics();
  }, duration);

  const result = performClick(save, combo);
  audio.click(result.crit);
  spawnFloatingText(event, `+${formatNumber(result.coins)}`, result.crit ? "crit" : "coin");
  spawnParticles(event, result.crit ? 18 : 9);
  const unlocked = evaluateAchievements(save);
  for (const achievement of unlocked) showToast(`Achievement unlocked: ${achievement.name}`, "success");
  markDirty(false);
  updateHud();
  renderSmallDynamics();
}

function handleAbility() {
  const now = Date.now();
  const featured = getCat(save.cats.featured);
  if (now < abilityReadyAt) {
    showToast("Ability is still cooling down.", "warning");
    return;
  }
  const result = useAbility(save);
  abilityReadyAt = now + featured.ability.cooldown * 1000;
  audio.ability();
  showToast(`${result.cat.ability.name}: +${formatNumber(result.reward.coins)} coins.`, "success");
  markDirty();
  render();
}

function handleBattle(mode) {
  const result = simulateBattle(save, mode);
  if (!result.ok) {
    showToast(result.message, "warning");
    render();
    return;
  }
  audio.battle(result.won);
  const label = mode === "boss" ? "Boss challenge" : "Arena battle";
  showToast(`${label} ${result.won ? "won" : "resolved"}: +${formatNumber(result.reward.coins || 0)} coins.`, result.won ? "success" : "warning");
  const unlocked = evaluateAchievements(save);
  for (const achievement of unlocked) showToast(`Achievement unlocked: ${achievement.name}`, "success");
  markDirty();
  render();
}

function handleResult(result, sound = "reward") {
  if (!result.ok) {
    showToast(result.message, "warning");
    return;
  }
  if (sound === "upgrade") audio.upgrade();
  if (sound === "reward") audio.reward();
  showToast(result.message, "success");
  evaluateAchievements(save);
  applyTheme();
  markDirty();
  render();
}

async function handleRestore(historyId) {
  try {
    showLoading(true);
    const result = await restoreHistory(historyId);
    save = normalizeSave(result.save, profile);
    historyCache = null;
    markDirty(false);
    showToast("Save history restored.", "success");
    render();
  } catch (error) {
    showToast(error.message, "danger");
  } finally {
    showLoading(false);
  }
}

function updateHud() {
  if (!save) return;
  const storedProfile = JSON.parse(localStorage.getItem('catClickerProfile') || '{}');
  els.profileName.textContent = save.player.displayName || storedProfile.displayName || "Cat Captain";
  els.profileTitle.textContent = `${save.player.title} - Lv ${save.player.level}`;
  els.coinReadout.textContent = formatNumber(save.currency.coins);
  els.gemReadout.textContent = formatNumber(save.currency.gems);
  els.idleReadout.textContent = `${formatNumber(calculateIdleRate(save))}/sec`;
  els.saveStatus.textContent = lastSaveMessage;
  for (const button of els.nav.querySelectorAll("[data-view]")) {
    button.classList.toggle("is-active", button.dataset.view === activeView);
  }
}

function renderSmallDynamics() {
  if (!save) return;
  const comboText = document.querySelector("[data-dynamic='combo']");
  if (comboText) comboText.textContent = `${combo} combo`;
  const clickText = document.querySelector("[data-dynamic='click-value']");
  if (clickText) clickText.textContent = `+${formatNumber(calculateClickValue(save, combo))}`;
  const energyText = document.querySelector("[data-dynamic='energy']");
  if (energyText) energyText.textContent = `${save.battle.energy}/${save.battle.maxEnergy}`;
  const cooldown = document.querySelector("[data-dynamic='ability-cooldown']");
  if (cooldown) cooldown.textContent = abilityCooldownText();
}

function render() {
  if (!save) return;
  ensureDailyQuests(save);
  recoverEnergy(save);
  updateHud();
  applyTheme();

  const views = {
    overview: renderOverview,
    cats: renderCats,
    shop: renderShop,
    battle: renderBattle,
    achievements: renderAchievements,
    inventory: renderInventory,
    leaderboard: renderLeaderboard,
    settings: renderSettings
  };
  els.viewRoot.innerHTML = (views[activeView] || renderOverview)();
}

function renderOverview() {
  const featuredOwned = save.cats.owned[save.cats.featured];
  const featured = getCat(featuredOwned.id);
  const event = getCurrentEvent();
  const zone = currentZone(save);
  const xpMax = xpForLevel(save.player.level);
  return `
    <section class="view-grid overview-grid">
      <div class="hero-panel cat-stage-panel">
        <div class="panel-kicker">Desktop adventure clicker</div>
        <div class="stage-copy">
          <h1>Cat Clicker</h1>
          <p>Built for large screens, precision mouse clicks, keyboard shortcuts, and high-performance browsers.</p>
        </div>
        <button class="cat-stage" id="cat-click-button" data-action="click-cat" aria-label="Click featured cat">
          <span class="stage-aura"></span>
          ${catAvatar(featured, "hero")}
          <span class="click-orbit orbit-one"></span>
          <span class="click-orbit orbit-two"></span>
        </button>
        <div class="stage-controls">
          <div class="metric-chip">
            <span>Click</span>
            <strong data-dynamic="click-value">+${formatNumber(calculateClickValue(save, combo))}</strong>
          </div>
          <div class="metric-chip">
            <span>Combo</span>
            <strong data-dynamic="combo">${combo} combo</strong>
          </div>
          <button class="primary-action" data-action="ability">
            <span>${featured.ability.name}</span>
            <small data-dynamic="ability-cooldown">${abilityCooldownText()}</small>
          </button>
        </div>
      </div>

      <div class="panel profile-panel">
        <div class="panel-heading">
          <span class="panel-kicker">Profile</span>
          <button class="ghost-button" data-action="save-manual">Save now</button>
        </div>
        <div class="profile-stat big">
          <span>${escapeHtml(save.player.title)}</span>
          <strong>Level ${save.player.level}</strong>
        </div>
        <div class="progress-track">
          <span style="width:${progress(save.player.xp, xpMax)}%"></span>
        </div>
        <div class="stat-grid">
          ${statCard("XP", `${formatNumber(save.player.xp)} / ${formatNumber(xpMax)}`)}
          ${statCard("Skill points", save.player.skillPoints)}
          ${statCard("Cats", Object.keys(save.cats.owned).length)}
          ${statCard("Power", calculateBattlePower(save).power)}
        </div>
      </div>

      <div class="panel event-panel">
        <div class="panel-kicker">Live event</div>
        <h2>${event.name}</h2>
        <p>${event.description}</p>
        <div class="event-zone">
          <span>Current zone</span>
          <strong>${zone.name}</strong>
        </div>
      </div>

      <div class="panel daily-panel">
        <div class="panel-heading">
          <span class="panel-kicker">Daily streak</span>
          <strong>${save.rewards.daily.streak || 0} days</strong>
        </div>
        <p>Daily rewards are account-saved. Missing a claim never deletes your cats, currency, upgrades, or story.</p>
        <button class="primary-action wide" data-action="claim-daily" ${save.rewards.daily.lastClaimedDate === todayKey() ? "disabled" : ""}>
          Claim daily reward
        </button>
      </div>

      <div class="panel quest-panel">
        <div class="panel-heading">
          <span class="panel-kicker">Quest board</span>
          <button class="ghost-button" data-action="claim-quest-bonus">Claim board bonus</button>
        </div>
        ${renderQuestList()}
      </div>

      <div class="panel dashboard-panel">
        <div class="panel-kicker">Permanent account stats</div>
        <div class="stat-grid tall">
          ${statCard("Total clicks", save.stats.totalClicks)}
          ${statCard("Coins earned", formatNumber(save.stats.totalCoinsEarned))}
          ${statCard("Offline earned", formatNumber(save.stats.totalOfflineEarned))}
          ${statCard("Arena wins", save.stats.arenaWins)}
          ${statCard("Bosses defeated", save.stats.bossesDefeated)}
          ${statCard("Achievements", `${save.achievements.unlocked.length}/${ACHIEVEMENTS.length}`)}
        </div>
        ${lastOffline && lastOffline.coins > 0 ? `<div class="offline-note">Last offline payout: ${formatNumber(lastOffline.coins)} coins.</div>` : ""}
      </div>
    </section>
  `;
}

function renderQuestList() {
  return save.quests.daily.items
    .map((quest) => {
      const complete = quest.progress >= quest.target;
      return `
        <div class="quest-row ${complete ? "is-complete" : ""}">
          <div>
            <strong>${escapeHtml(quest.title)}</strong>
            <span>${escapeHtml(quest.description)}</span>
            <div class="progress-track slim"><span style="width:${progress(quest.progress, quest.target)}%"></span></div>
          </div>
          <div class="quest-reward">
            <small>${formatNumber(quest.progress)} / ${formatNumber(quest.target)}</small>
            <button class="mini-button" data-action="claim-quest" data-id="${quest.id}" ${!complete || quest.claimed ? "disabled" : ""}>
              ${quest.claimed ? "Claimed" : "Claim"}
            </button>
          </div>
        </div>
      `;
    })
    .join("");
}

function renderCats() {
  const sorted = [...CATS].sort((a, b) => RARITIES[a.rarity].order - RARITIES[b.rarity].order);
  return `
    <section class="view-stack">
      <div class="view-heading">
        <div>
          <span class="panel-kicker">Collection gallery</span>
          <h2>Collect, level, style, and field battle cats</h2>
        </div>
        <div class="metric-chip"><span>Active team</span><strong>${save.cats.activeTeam.length}/3</strong></div>
      </div>
      <div class="cat-gallery">
        ${sorted.map(renderCatCard).join("")}
      </div>
    </section>
  `;
}

function renderCatCard(cat) {
  const owned = save.cats.owned[cat.id];
  const rarity = RARITIES[cat.rarity];
  const inTeam = save.cats.activeTeam.includes(cat.id);
  const isFeatured = save.cats.featured === cat.id;
  const recruitCost = costText(cat.unlock);
  const levelCost = owned ? catLevelCost(save, cat.id) : 0;
  return `
    <article class="cat-card ${owned ? "is-owned" : "is-locked"}" style="--rarity:${rarity.color};--rarity-soft:${rarity.soft}">
      <div class="cat-card-top">
        <span class="rarity-pill">${rarity.label}</span>
        <span class="role-pill">${cat.role}</span>
      </div>
      <div class="cat-portrait-wrap">${catAvatar(cat, "card")}</div>
      <h3>${cat.name}</h3>
      <p class="epithet">${cat.epithet}</p>
      <p>${cat.bio}</p>
      <div class="cat-stats">
        <span>ATK ${cat.base.atk}</span>
        <span>DEF ${cat.base.def}</span>
        <span>SPD ${cat.base.speed}</span>
      </div>
      <div class="ability-line">
        <strong>${cat.ability.name}</strong>
        <span>${cat.ability.description}</span>
      </div>
      ${
        owned
          ? `
            <div class="cat-actions">
              <button class="mini-button" data-action="level-cat" data-id="${cat.id}" ${save.currency.coins < levelCost ? "disabled" : ""}>Lv ${owned.level} - ${formatNumber(levelCost)}</button>
              <button class="mini-button" data-action="team-cat" data-id="${cat.id}">${inTeam ? "Reserve" : "Team"}</button>
              <button class="mini-button" data-action="feature-cat" data-id="${cat.id}" ${isFeatured ? "disabled" : ""}>${isFeatured ? "Featured" : "Feature"}</button>
            </div>
          `
          : `
            <div class="cat-actions">
              <button class="primary-action wide" data-action="unlock-cat" data-id="${cat.id}" ${!canAfford(save, cat.unlock) ? "disabled" : ""}>
                Recruit ${recruitCost}
              </button>
            </div>
          `
      }
    </article>
  `;
}

function renderShop() {
  return `
    <section class="view-stack">
      <div class="view-heading">
        <div>
          <span class="panel-kicker">Inventory and upgrade shop</span>
          <h2>Build a long-session strategy</h2>
        </div>
        <div class="metric-chip"><span>Reward boost</span><strong>${Math.round((rewardMultiplier(save) - 1) * 100)}%</strong></div>
      </div>
      <div class="shop-layout">
        <div class="panel">
          <div class="panel-heading">
            <span class="panel-kicker">Upgrade atelier</span>
            <strong>${save.stats.upgradesBought} bought</strong>
          </div>
          <div class="upgrade-list">
            ${UPGRADES.map(renderUpgrade).join("")}
          </div>
        </div>
        <div class="panel">
          <div class="panel-heading">
            <span class="panel-kicker">Skill tree</span>
            <strong>${save.player.skillPoints} points</strong>
          </div>
          <div class="skill-tree">
            ${SKILLS.map(renderSkill).join("")}
          </div>
        </div>
      </div>
    </section>
  `;
}

function renderUpgrade(upgrade) {
  const level = save.upgrades[upgrade.id] || 0;
  const cost = getUpgradeCost(save, upgrade);
  const maxed = level >= upgrade.max;
  return `
    <article class="upgrade-row">
      <div>
        <span class="category">${upgrade.category}</span>
        <strong>${upgrade.name}</strong>
        <p>${upgrade.description}</p>
        <div class="progress-track slim"><span style="width:${progress(level, upgrade.max)}%"></span></div>
      </div>
      <button class="mini-button" data-action="buy-upgrade" data-id="${upgrade.id}" ${maxed || save.currency.coins < cost ? "disabled" : ""}>
        ${maxed ? "Max" : `Lv ${level} - ${formatNumber(cost)}`}
      </button>
    </article>
  `;
}

function renderSkill(skill) {
  const unlocked = hasSkill(save, skill.id);
  const lockedByPrereq = skill.requires.some((id) => !hasSkill(save, id));
  return `
    <article class="skill-node ${unlocked ? "is-unlocked" : ""}">
      <span>${skill.branch}</span>
      <strong>${skill.name}</strong>
      <p>${skill.description}</p>
      <button class="mini-button" data-action="unlock-skill" data-id="${skill.id}" ${unlocked || lockedByPrereq || save.player.skillPoints < skill.cost ? "disabled" : ""}>
        ${unlocked ? "Unlocked" : `${skill.cost} SP`}
      </button>
    </article>
  `;
}

function renderBattle() {
  const team = calculateBattlePower(save, "arena");
  const bossTeam = calculateBattlePower(save, "boss");
  const zone = currentZone(save);
  const last = save.battle.lastResult;
  return `
    <section class="view-grid battle-grid">
      <div class="panel arena-panel">
        <div class="panel-heading">
          <span class="panel-kicker">Cat-versus-cat arena</span>
          <div class="metric-chip"><span>Energy</span><strong data-dynamic="energy">${save.battle.energy}/${save.battle.maxEnergy}</strong></div>
        </div>
        <div class="battle-stage">
          <div class="team-stack">
            ${save.cats.activeTeam.map((id) => catAvatar(getCat(id), "token")).join("")}
          </div>
          <div class="versus-mark">VS</div>
          <div class="enemy-card">
            <span>Rival squad</span>
            <strong>Scaled arena duel</strong>
            <small>Win coins, XP, gems, quest credit, and leaderboard score.</small>
          </div>
        </div>
        <div class="stat-grid">
          ${statCard("Power", team.power)}
          ${statCard("HP", team.hp)}
          ${statCard("Attack", team.atk)}
          ${statCard("Defense", team.def)}
        </div>
        <button class="primary-action wide" data-action="battle-arena" ${save.battle.energy < 1 ? "disabled" : ""}>Start arena battle</button>
      </div>

      <div class="panel boss-panel">
        <div class="panel-kicker">Boss challenge mode</div>
        <h2>${zone.boss.name}</h2>
        <p>${zone.boss.title}</p>
        <div class="boss-plate">
          <div class="boss-sigil">${catAvatar(getCat("atlas"), "boss")}</div>
          <div>
            <strong>${zone.name}</strong>
            <span>${zone.backdrop}</span>
          </div>
        </div>
        <div class="stat-grid">
          ${statCard("Boss HP", zone.boss.hp)}
          ${statCard("Team power", bossTeam.power)}
          ${statCard("Reward", `${formatNumber(zone.boss.reward.coins)}+`)}
          ${statCard("Clears", save.story.bossesCleared.filter((id) => id === zone.id).length)}
        </div>
        <button class="primary-action wide" data-action="battle-boss" ${save.battle.energy < 2 ? "disabled" : ""}>Challenge boss</button>
      </div>

      <div class="panel zone-panel">
        <div class="panel-heading">
          <span class="panel-kicker">Story zones</span>
          <strong>${save.story.unlockedZones.length}/${ZONES.length}</strong>
        </div>
        <div class="zone-list">
          ${ZONES.map((item) => {
            const unlocked = save.story.unlockedZones.includes(item.id);
            return `
              <button class="zone-row ${item.id === save.story.zone ? "is-active" : ""}" data-action="set-zone" data-id="${item.id}" ${!unlocked ? "disabled" : ""}>
                <span>Chapter ${item.chapter}</span>
                <strong>${item.name}</strong>
                <small>${unlocked ? item.backdrop : `Unlocks at level ${item.requiredLevel}`}</small>
              </button>
            `;
          }).join("")}
        </div>
      </div>

      <div class="panel result-panel">
        <div class="panel-kicker">Latest battle result</div>
        ${
          last
            ? `
              <h2>${last.won ? "Victory" : "Hard-fought result"} against ${escapeHtml(last.enemy.name)}</h2>
              <div class="stat-grid">
                ${statCard("Coins", formatNumber(last.reward.coins || 0))}
                ${statCard("Gems", last.reward.gems || 0)}
                ${statCard("XP", last.reward.xp || 0)}
                ${statCard("Enemy HP left", last.ending.enemyHp)}
              </div>
              <div class="battle-log">${last.log.slice(-6).map((line) => `<p class="${line.side}">${escapeHtml(line.text)}</p>`).join("")}</div>
            `
            : "<p>No battles yet. Start with the arena, then challenge bosses when your team feels sharp.</p>"
        }
      </div>
    </section>
  `;
}

function renderAchievements() {
  return `
    <section class="view-stack">
      <div class="view-heading">
        <div>
          <span class="panel-kicker">Achievements and badges</span>
          <h2>Permanent mastery goals</h2>
        </div>
        <div class="metric-chip"><span>Unlocked</span><strong>${save.achievements.unlocked.length}/${ACHIEVEMENTS.length}</strong></div>
      </div>
      <div class="achievement-grid">
        ${ACHIEVEMENTS.map((achievement) => {
          const unlocked = save.achievements.unlocked.includes(achievement.id);
          const current = achievement.metric === "playerLevel"
            ? save.player.level
            : achievement.metric === "catsOwned"
              ? Object.keys(save.cats.owned).length
              : save.stats[achievement.metric] || 0;
          return `
            <article class="achievement-card ${unlocked ? "is-unlocked" : ""}">
              <span class="badge-mark">${unlocked ? "Unlocked" : "Locked"}</span>
              <strong>${achievement.name}</strong>
              <p>${achievement.description}</p>
              <div class="progress-track slim"><span style="width:${progress(current, achievement.target)}%"></span></div>
              <small>${formatNumber(current)} / ${formatNumber(achievement.target)}</small>
            </article>
          `;
        }).join("")}
      </div>
    </section>
  `;
}

function renderInventory() {
  if (!historyCache && !historyLoading) refreshHistory();
  return `
    <section class="view-grid inventory-grid">
      <div class="panel cosmetic-panel">
        <div class="panel-heading">
          <span class="panel-kicker">Cosmetic customization</span>
          <strong>${save.inventory.cosmetics.length} owned</strong>
        </div>
        <div class="cosmetic-grid">
          ${COSMETICS.map((item) => {
            const owned = save.inventory.cosmetics.includes(item.id);
            const active =
              save.cosmetics.theme === item.id ||
              save.cosmetics.featuredHat === item.id ||
              save.cosmetics.frame === item.id;
            return `
              <article class="cosmetic-card ${active ? "is-active" : ""}">
                <span>${item.type}</span>
                <strong>${item.name}</strong>
                <p>${item.description}</p>
                <button class="mini-button" data-action="${owned ? "apply-cosmetic" : "buy-cosmetic"}" data-id="${item.id}" ${!owned && !canAfford(save, item.cost) ? "disabled" : ""}>
                  ${owned ? (active ? "Equipped" : "Equip") : `Buy ${costText(item.cost)}`}
                </button>
              </article>
            `;
          }).join("")}
        </div>
      </div>

      <div class="panel save-panel">
        <div class="panel-heading">
          <span class="panel-kicker">Cloud save history</span>
          <button class="ghost-button" data-action="save-manual">Create checkpoint</button>
        </div>
        <p>Autosave keeps your current slot updated. Checkpoints preserve earlier snapshots so progress is not erased by a bad session.</p>
        <div class="history-list">
          ${
            historyLoading
              ? "<p>Loading save history...</p>"
              : historyCache?.length
                ? historyCache.map(renderHistoryRow).join("")
                : "<p>No checkpoint history yet. Manual saves and major checkpoints will appear here.</p>"
          }
        </div>
      </div>
    </section>
  `;
}

function renderHistoryRow(entry) {
  return `
    <div class="history-row">
      <div>
        <strong>${new Date(entry.savedAt).toLocaleString()}</strong>
        <span>${entry.reason} - Lv ${entry.summary.level}, ${formatNumber(entry.summary.coins)} coins, ${entry.summary.catsOwned} cats</span>
      </div>
      <button class="mini-button" data-action="restore-save" data-id="${entry.id}">Restore</button>
    </div>
  `;
}

function renderLeaderboard() {
  if (!leaderboardCache && !leaderboardLoading) refreshLeaderboard();
  return `
    <section class="view-stack">
      <div class="view-heading">
        <div>
          <span class="panel-kicker">Leaderboard support</span>
          <h2>Account-based rankings</h2>
        </div>
        <button class="ghost-button" data-view="leaderboard">Refresh</button>
      </div>
      <div class="panel">
        <div class="leaderboard-list">
          ${
            leaderboardLoading
              ? "<p>Loading leaderboard...</p>"
              : leaderboardCache?.length
                ? leaderboardCache.map((leader, index) => `
                    <div class="leader-row ${leader.username === profile.username ? "is-you" : ""}">
                      <span class="rank">${index + 1}</span>
                      <div>
                        <strong>${escapeHtml(leader.displayName)}</strong>
                        <small>Lv ${leader.summary.level} - ${leader.summary.catsOwned} cats - ${leader.summary.bossesDefeated} bosses</small>
                      </div>
                      <b>${formatNumber(leader.score)}</b>
                    </div>
                  `).join("")
                : "<p>No leaderboard entries yet. Save your account once to appear here.</p>"
          }
        </div>
      </div>
    </section>
  `;
}

function renderSettings() {
  const storedProfile = JSON.parse(localStorage.getItem('catClickerProfile') || '{}');
  return `
    <section class="view-grid settings-grid">
      <div class="panel">
        <div class="panel-kicker">Audio and visual settings</div>
        <h2>Performance-tuned desktop controls</h2>
        <div class="settings-list">
          ${toggleRow("Music", "music", save.settings.music)}
          ${toggleRow("Sound effects", "sound", save.settings.sound)}
          ${rangeRow("Music volume", "musicVolume", save.settings.musicVolume)}
          ${rangeRow("SFX volume", "sfxVolume", save.settings.sfxVolume)}
          ${toggleRow("Particle effects", "particles", save.settings.particles)}
          <label class="setting-row">
            <span>
              <strong>Animation intensity</strong>
              <small>Lower this on older desktop browsers.</small>
            </span>
            <select data-setting="animation">
              <option value="high" ${save.settings.animation === "high" ? "selected" : ""}>High</option>
              <option value="balanced" ${save.settings.animation === "balanced" ? "selected" : ""}>Balanced</option>
              <option value="low" ${save.settings.animation === "low" ? "selected" : ""}>Low</option>
            </select>
          </label>
        </div>
      </div>
      <div class="panel account-panel">
        <div class="panel-kicker">Account</div>
        <h2>${escapeHtml(storedProfile.displayName || profile?.displayName || 'Player')}</h2>
        <p>Signed in as ${escapeHtml(storedProfile.email || profile?.username || 'unknown')}. Progress is saved to the cloud.</p>
        <div class="stat-grid">
          ${statCard("Autosaves", save.stats.savesWritten)}
          ${statCard("Created", new Date(save.meta.createdAt).toLocaleDateString())}
          ${statCard("Save status", lastSaveMessage)}
          ${statCard("Desktop", "1180px+")}
        </div>
        <button class="danger-button" data-action="logout">Save and sign out</button>
      </div>
    </section>
  `;
}

async function refreshHistory() {
  if (historyLoading) return;
  historyLoading = true;
  try {
    const result = await fetchHistory();
    historyCache = result.history.reverse();
  } catch (error) {
    showToast(error.message, "danger");
  } finally {
    historyLoading = false;
    if (activeView === "inventory") render();
  }
}

async function refreshLeaderboard() {
  if (leaderboardLoading) return;
  leaderboardLoading = true;
  try {
    const result = await fetchLeaderboard();
    leaderboardCache = result.leaders;
  } catch (error) {
    showToast(error.message, "danger");
  } finally {
    leaderboardLoading = false;
    if (activeView === "leaderboard") render();
  }
}

function applyTheme() {
  if (!save) return;
  document.body.dataset.theme = save.cosmetics.theme || "theme-midnight";
  document.body.dataset.animation = save.settings.animation || "high";
  document.body.classList.toggle("particles-off", !save.settings.particles);
}

function abilityCooldownText() {
  const remaining = Math.max(0, Math.ceil((abilityReadyAt - Date.now()) / 1000));
  return remaining > 0 ? `${remaining}s` : "Ready";
}

function statCard(label, value) {
  return `
    <div class="stat-card">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(String(value))}</strong>
    </div>
  `;
}

function toggleRow(label, key, checked) {
  return `
    <label class="setting-row">
      <span>
        <strong>${label}</strong>
        <small>${key === "music" ? "Procedural background track." : "Immediate feedback for clicks, upgrades, rewards, and battles."}</small>
      </span>
      <input type="checkbox" data-setting="${key}" ${checked ? "checked" : ""}>
    </label>
  `;
}

function rangeRow(label, key, value) {
  return `
    <label class="setting-row">
      <span>
        <strong>${label}</strong>
        <small>${Math.round(value * 100)}%</small>
      </span>
      <input type="range" min="0" max="1" step="0.01" value="${value}" data-setting-range="${key}">
    </label>
  `;
}

function costText(cost = {}) {
  const parts = [];
  if (cost.coins) parts.push(`${formatNumber(cost.coins)} coins`);
  if (cost.gems) parts.push(`${formatNumber(cost.gems)} gems`);
  if (cost.cosmeticTokens) parts.push(`${formatNumber(cost.cosmeticTokens)} tokens`);
  return parts.join(" + ") || "Free";
}

function progress(current, max) {
  if (!max || max === Infinity) return 0;
  return Math.max(0, Math.min(100, (current / max) * 100));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function catAvatar(cat, size = "card") {
  const [main, accent, ink] = cat.colors;
  const rarity = RARITIES[cat.rarity];
  const crown = rarity.order >= 4;
  const mythic = rarity.order >= 5;
  return `
    <svg class="cat-avatar cat-avatar-${size}" viewBox="0 0 220 220" role="img" aria-label="${cat.name}">
      <defs>
        <linearGradient id="fur-${cat.id}-${size}" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="${main}"/>
          <stop offset="100%" stop-color="${accent}"/>
        </linearGradient>
        <filter id="glow-${cat.id}-${size}" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="5" result="blur"/>
          <feMerge>
            <feMergeNode in="blur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      <circle cx="110" cy="112" r="86" fill="${rarity.soft}" />
      ${mythic ? `<circle cx="110" cy="112" r="96" fill="none" stroke="${rarity.color}" stroke-width="3" stroke-dasharray="10 10" opacity="0.85"/>` : ""}
      <path d="M54 88 L42 34 L88 60 Z" fill="url(#fur-${cat.id}-${size})" stroke="${ink}" stroke-width="6" stroke-linejoin="round"/>
      <path d="M166 88 L178 34 L132 60 Z" fill="url(#fur-${cat.id}-${size})" stroke="${ink}" stroke-width="6" stroke-linejoin="round"/>
      <path d="M58 96 C58 48 142 42 166 96 C194 158 157 196 110 196 C63 196 26 158 58 96Z" fill="url(#fur-${cat.id}-${size})" stroke="${ink}" stroke-width="7"/>
      <path d="M72 124 C88 112 99 112 106 126" fill="none" stroke="${ink}" stroke-width="7" stroke-linecap="round"/>
      <path d="M114 126 C121 112 134 112 150 124" fill="none" stroke="${ink}" stroke-width="7" stroke-linecap="round"/>
      <circle cx="92" cy="108" r="8" fill="${ink}"/>
      <circle cx="140" cy="108" r="8" fill="${ink}"/>
      <path d="M110 126 L102 139 L118 139 Z" fill="${ink}"/>
      <path d="M82 150 C96 164 124 164 138 150" fill="none" stroke="${ink}" stroke-width="6" stroke-linecap="round"/>
      <path d="M70 138 H34 M73 150 H38 M148 138 H186 M145 150 H182" stroke="${ink}" stroke-width="4" stroke-linecap="round" opacity="0.7"/>
      <circle cx="75" cy="87" r="9" fill="#ffffff" opacity="0.55"/>
      ${crown ? `<path d="M78 58 L92 30 L110 54 L128 30 L142 58 Z" fill="#ffd166" stroke="${ink}" stroke-width="5" stroke-linejoin="round" filter="url(#glow-${cat.id}-${size})"/>` : ""}
    </svg>
  `;
}

function spawnFloatingText(event, text, type = "coin") {
  const rect = event?.target?.getBoundingClientRect?.();
  const x = event?.clientX || (rect ? rect.left + rect.width / 2 : window.innerWidth / 2);
  const y = event?.clientY || (rect ? rect.top + rect.height / 2 : window.innerHeight / 2);
  const node = document.createElement("div");
  node.className = `floating-pop ${type}`;
  node.textContent = text;
  node.style.left = `${x}px`;
  node.style.top = `${y}px`;
  document.body.appendChild(node);
  setTimeout(() => node.remove(), 900);
}

function spawnParticles(event, count = 10) {
  if (!save?.settings.particles) return;
  const rect = event?.target?.getBoundingClientRect?.();
  const x = event?.clientX || (rect ? rect.left + rect.width / 2 : window.innerWidth / 2);
  const y = event?.clientY || (rect ? rect.top + rect.height / 2 : window.innerHeight / 2);
  for (let index = 0; index < count; index += 1) {
    const node = document.createElement("span");
    node.className = "spark-particle";
    const angle = Math.random() * Math.PI * 2;
    const distance = 40 + Math.random() * 90;
    node.style.left = `${x}px`;
    node.style.top = `${y}px`;
    node.style.setProperty("--dx", `${Math.cos(angle) * distance}px`);
    node.style.setProperty("--dy", `${Math.sin(angle) * distance}px`);
    document.body.appendChild(node);
    setTimeout(() => node.remove(), 850);
  }
}

function showToast(message, type = "info") {
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;
  els.toastStack.appendChild(toast);
  setTimeout(() => toast.classList.add("is-visible"), 20);
  setTimeout(() => {
    toast.classList.remove("is-visible");
    setTimeout(() => toast.remove(), 240);
  }, 3200);
}
