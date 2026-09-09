// BlueNav - Pure, Fast & Minimalist Browser Core

let tabs = [];
let activeTabId = null;
let tabCounter = 0;

// DOM Elements
const tabsListEl = document.getElementById("tabs-list");
const btnNewTabEl = document.getElementById("btn-new-tab");
const omniboxInputEl = document.getElementById("omnibox-input");
const btnBackEl = document.getElementById("btn-back");
const btnForwardEl = document.getElementById("btn-forward");
const btnReloadEl = document.getElementById("btn-reload");
const webviewHostEl = document.getElementById("webview-host");
const ntpDashboardEl = document.getElementById("new-tab-dashboard");

// Shields Elements
const btnShieldEl = document.getElementById("btn-shield");
const shieldPanelEl = document.getElementById("shield-panel");
const toggleShieldInput = document.getElementById("toggle-shield-input");
const shieldBadgeCountEl = document.getElementById("shield-badge-count");
const statSessionBlockedEl = document.getElementById("stat-session-blocked");

// NTP Search Elements
const ntpSearchInputEl = document.getElementById("ntp-search-input");

// ================= TABS =================

function createTab(url = null) {
  tabCounter++;
  const id = "tab-" + tabCounter;
  const isNewTab = !url || url === "bluenav://newtab";

  const tab = {
    id,
    title: isNewTab ? "Nouvel onglet" : "Chargement...",
    url: isNewTab ? "bluenav://newtab" : url,
    isNewTab,
    canGoBack: false,
    canGoForward: false,
    webview: null
  };

  if (!isNewTab) {
    tab.webview = createWebviewForTab(tab, url);
  }

  tabs.push(tab);
  renderTabs();
  activateTab(id);
}

function createWebviewForTab(tab, url) {
  const wv = document.createElement("webview");
  wv.setAttribute("src", url);
  wv.setAttribute("allowpopups", "true");
  wv.style.display = "none";

  wv.addEventListener("did-start-loading", () => {
    tab.title = "Chargement...";
    renderTabs();
    if (activeTabId === tab.id) {
      btnReloadEl.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
    }
  });

  wv.addEventListener("did-stop-loading", () => {
    tab.canGoBack = wv.canGoBack();
    tab.canGoForward = wv.canGoForward();
    updateNavigationControls();
    if (activeTabId === tab.id) {
      btnReloadEl.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>';
    }
  });

  wv.addEventListener("page-title-updated", (e) => {
    tab.title = e.title || wv.getURL();
    renderTabs();
  });

  wv.addEventListener("did-navigate", (e) => {
    tab.url = e.url;
    tab.isNewTab = false;
    if (activeTabId === tab.id) {
      omniboxInputEl.value = e.url;
    }
    tab.canGoBack = wv.canGoBack();
    tab.canGoForward = wv.canGoForward();
    updateNavigationControls();
  });

  webviewHostEl.appendChild(wv);
  return wv;
}

function activateTab(id) {
  activeTabId = id;
  const currentTab = tabs.find(t => t.id === id);
  if (!currentTab) return;

  renderTabs();

  const allWebviews = webviewHostEl.querySelectorAll("webview");
  allWebviews.forEach(wv => wv.style.display = "none");

  if (currentTab.isNewTab) {
    ntpDashboardEl.style.display = "flex";
    webviewHostEl.classList.remove("active");
    omniboxInputEl.value = "";
    omniboxInputEl.placeholder = "Rechercher ou entrer une URL";
  } else {
    ntpDashboardEl.style.display = "none";
    webviewHostEl.classList.add("active");
    if (currentTab.webview) {
      currentTab.webview.style.display = "flex";
      omniboxInputEl.value = currentTab.url;
    }
  }

  updateNavigationControls();
}

function closeTab(id, e) {
  if (e) e.stopPropagation();
  const index = tabs.findIndex(t => t.id === id);
  if (index === -1) return;

  const [removedTab] = tabs.splice(index, 1);
  if (removedTab.webview) {
    removedTab.webview.remove();
  }

  if (tabs.length === 0) {
    createTab();
  } else if (activeTabId === id) {
    const nextTab = tabs[Math.max(0, index - 1)];
    activateTab(nextTab.id);
  } else {
    renderTabs();
  }
}

function renderTabs() {
  tabsListEl.innerHTML = "";
  tabs.forEach(tab => {
    const tabEl = document.createElement("div");
    tabEl.className = "tab-item " + (tab.id === activeTabId ? "active" : "");
    tabEl.innerHTML = `
      <span class="tab-title">${escapeHtml(tab.title)}</span>
      <span class="tab-close" title="Fermer">✕</span>
    `;

    tabEl.addEventListener("click", () => activateTab(tab.id));
    tabEl.querySelector(".tab-close").addEventListener("click", (e) => closeTab(tab.id, e));

    tabsListEl.appendChild(tabEl);
  });
}

function updateNavigationControls() {
  const currentTab = tabs.find(t => t.id === activeTabId);
  if (!currentTab || currentTab.isNewTab || !currentTab.webview) {
    btnBackEl.disabled = true;
    btnForwardEl.disabled = true;
  } else {
    btnBackEl.disabled = !currentTab.canGoBack;
    btnForwardEl.disabled = !currentTab.canGoForward;
  }
}

// ================= NAVIGATION =================

function navigateTo(input) {
  if (!input || !input.trim()) return;
  const raw = input.trim();

  let targetUrl = raw;
  const isUrl = /^https?:\/\//i.test(raw) || (/^([a-z0-9-]+\.)+[a-z]{2,}(:\d+)?(\/.*)?$/i.test(raw) && !raw.includes(" "));

  if (!isUrl) {
    targetUrl = "https://www.google.com/search?q=" + encodeURIComponent(raw);
  } else if (!/^https?:\/\//i.test(targetUrl)) {
    targetUrl = "https://" + targetUrl;
  }

  const currentTab = tabs.find(t => t.id === activeTabId);
  if (currentTab) {
    currentTab.isNewTab = false;
    currentTab.url = targetUrl;
    ntpDashboardEl.style.display = "none";
    webviewHostEl.classList.add("active");

    if (!currentTab.webview) {
      currentTab.webview = createWebviewForTab(currentTab, targetUrl);
    } else {
      currentTab.webview.loadURL(targetUrl);
    }
    currentTab.webview.style.display = "flex";
    omniboxInputEl.value = targetUrl;
    renderTabs();
  }
}

omniboxInputEl.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    navigateTo(omniboxInputEl.value);
  }
});

btnBackEl.addEventListener("click", () => {
  const currentTab = tabs.find(t => t.id === activeTabId);
  if (currentTab && currentTab.webview && currentTab.webview.canGoBack()) {
    currentTab.webview.goBack();
  }
});

btnForwardEl.addEventListener("click", () => {
  const currentTab = tabs.find(t => t.id === activeTabId);
  if (currentTab && currentTab.webview && currentTab.webview.canGoForward()) {
    currentTab.webview.goForward();
  }
});

btnReloadEl.addEventListener("click", () => {
  const currentTab = tabs.find(t => t.id === activeTabId);
  if (currentTab && currentTab.webview) {
    if (currentTab.webview.isLoading()) {
      currentTab.webview.stop();
    } else {
      currentTab.webview.reload();
    }
  }
});

btnNewTabEl.addEventListener("click", () => createTab());

document.querySelectorAll(".speed-dial-item").forEach(dial => {
  dial.addEventListener("click", (e) => {
    e.preventDefault();
    const url = dial.getAttribute("data-url");
    navigateTo(url);
  });
});

if (ntpSearchInputEl) {
  ntpSearchInputEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter") navigateTo(ntpSearchInputEl.value);
  });
}

// ================= SHIELDS =================

btnShieldEl.addEventListener("click", () => {
  shieldPanelEl.classList.toggle("hidden");
});

document.addEventListener("click", (e) => {
  if (!shieldPanelEl.contains(e.target) && !btnShieldEl.contains(e.target)) {
    shieldPanelEl.classList.add("hidden");
  }
});

toggleShieldInput.addEventListener("change", async () => {
  if (window.blueNav) {
    await window.blueNav.toggleShield(toggleShieldInput.checked);
  }
});

if (window.blueNav) {
  window.blueNav.onShieldUpdate((data) => {
    shieldBadgeCountEl.textContent = data.sessionBlocked;
    if (statSessionBlockedEl) {
      statSessionBlockedEl.textContent = data.sessionBlocked;
    }
  });
}

// Minimal Clock
function updateClock() {
  const clockEl = document.getElementById("ntp-clock");
  if (clockEl) {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    clockEl.textContent = hours + ":" + minutes;
  }
}
setInterval(updateClock, 1000);
updateClock();

function escapeHtml(str) {
  return (str || "").replace(/[&<>"']/g, m => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[m]));
}

// Init first tab
createTab();
