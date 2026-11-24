chrome.runtime.onInstalled.addListener(async () => {
  const defaults = {savedOpportunities:[], dashboardUrl:"http://localhost:3000", notificationsEnabled:true};
  const existing = await chrome.storage.local.get(Object.keys(defaults));
  await chrome.storage.local.set(Object.fromEntries(Object.entries(defaults).filter(([k]) => existing[k] === undefined)));
});

// Lightweight deadline checks for saved items. No browsing activity is monitored.
chrome.alarms?.create("opportunityradar-deadline-check", {periodInMinutes: 60});
chrome.alarms?.onAlarm.addListener(async alarm => {
  if (alarm.name !== "opportunityradar-deadline-check") return;
  const settings = await chrome.storage.local.get(["savedOpportunities","notificationsEnabled"]);
  if (settings.notificationsEnabled === false) return;
  const items = settings.savedOpportunities || [];
  const today = new Date(); today.setHours(0,0,0,0);
  for (const item of items) {
    if (!item.deadline || item.reminded) continue;
    const parsed = new Date(item.deadline);
    if (Number.isNaN(parsed.getTime())) continue;
    const days = Math.ceil((parsed - today) / 86400000);
    if (days >= 0 && days <= 2) {
      chrome.notifications.create(`or-${btoa(unescape(encodeURIComponent(item.url))).slice(0,30)}`, {
        type:"basic", iconUrl:"assets/icon128.png", title:"Opportunity deadline coming up",
        message:`${item.title || "Saved opportunity"} · ${days === 0 ? "Deadline today" : `${days} day(s) left`}`
      });
      item.reminded = true;
    }
  }
  await chrome.storage.local.set({savedOpportunities:items});
});