const $ = id => document.getElementById(id);
async function load() {
  const data = await chrome.storage.local.get(["dashboardUrl","notificationsEnabled","savedOpportunities"]);
  $("dashboardUrl").value = data.dashboardUrl || "http://localhost:3000";
  $("notificationsEnabled").checked = data.notificationsEnabled !== false;
  $("count").textContent = `${(data.savedOpportunities || []).length} saved opportunities`;
}
$("saveSettings").addEventListener("click", async () => {
  const url = $("dashboardUrl").value.trim();
  if (!/^https?:\/\/.+/i.test(url)) { $("message").textContent = "Enter a valid website URL."; return; }
  await chrome.storage.local.set({dashboardUrl:url,notificationsEnabled:$("notificationsEnabled").checked});
  $("message").textContent = "Preferences saved.";
});
$("clearSaved").addEventListener("click", async () => {
  if (!confirm("Delete all locally saved opportunities? This cannot be undone.")) return;
  await chrome.storage.local.set({savedOpportunities:[]});
  $("count").textContent = "0 saved opportunities";
  $("message").textContent = "Saved list cleared.";
});
load();