const $ = (id) => document.getElementById(id);
let currentOpportunity = null;
let currentUrl = "";

document.addEventListener("DOMContentLoaded", async () => {
  $("scanBtn").addEventListener("click", scanCurrentPage);
  $("retryBtn").addEventListener("click", scanCurrentPage);
  $("saveBtn").addEventListener("click", saveOpportunity);
  $("openSourceBtn").addEventListener("click", () => currentUrl && chrome.tabs.create({url: currentUrl}));
  $("settingsBtn").addEventListener("click", () => chrome.runtime.openOptionsPage());
  $("openDashboard").addEventListener("click", openDashboard);
  await updateSavedCount();
  document.addEventListener("keydown", e => { if (e.key === "Enter") scanCurrentPage(); });
});

async function scanCurrentPage() {
  setBusy(true);
  try {
    const [tab] = await chrome.tabs.query({active:true, currentWindow:true});
    if (!tab?.id || !tab.url || !/^https?:/.test(tab.url)) throw new Error("Open a regular webpage first. Chrome system pages cannot be scanned.");
    currentUrl = tab.url;
    const response = await chrome.tabs.sendMessage(tab.id, {type:"OR_SCAN_PAGE"}).catch(async () => {
      // Some pages do not have the content script yet; inject it only after the user clicks Scan.
      await chrome.scripting?.executeScript?.({target:{tabId:tab.id}, files:["content.js"]});
      return chrome.tabs.sendMessage(tab.id, {type:"OR_SCAN_PAGE"});
    });
    if (!response?.ok) throw new Error(response?.error || "Could not read this page.");
    const data = response.data;
    currentOpportunity = data;
    if (!data.isOpportunity) {
      $("emptyState").classList.add("hidden");
      $("resultSection").classList.add("hidden");
      $("noMatch").classList.remove("hidden");
    } else {
      renderOpportunity(data);
    }
  } catch (error) {
    showToast(error.message || "Something went wrong.");
  } finally { setBusy(false); }
}

function setBusy(busy) {
  $("scanBtn").disabled = busy;
  $("scanBtn").innerHTML = busy ? "<span>◌</span> Scanning page…" : "<span>✦</span> Scan this page <kbd>↵</kbd>";
}
function renderOpportunity(o) {
  $("emptyState").classList.add("hidden");
  $("noMatch").classList.add("hidden");
  $("resultSection").classList.remove("hidden");
  $("categoryTag").textContent = (o.category || "OPPORTUNITY").toUpperCase();
  $("confidence").textContent = `${o.confidence || "PAGE"} MATCH`;
  $("oppTitle").textContent = o.title || "Untitled opportunity";
  $("oppOrg").textContent = o.organisation || "Organisation not identified";
  $("oppDeadline").textContent = o.deadline || "Not specified";
  $("oppLocation").textContent = o.location || "Not specified";
  $("oppEligibility").textContent = o.eligibility || "Needs review";
  $("oppBenefit").textContent = o.benefit || "Not specified";
  $("oppSummary").textContent = o.summary || "Review the official page for full details.";
  $("saveBtn").textContent = "＋ Save opportunity";
}
async function saveOpportunity() {
  if (!currentOpportunity) return;
  const {savedOpportunities=[]} = await chrome.storage.local.get("savedOpportunities");
  const exists = savedOpportunities.some(x => x.url === currentUrl);
  if (exists) return showToast("Already in your saved opportunities.");
  const item = {...currentOpportunity, url:currentUrl, savedAt:new Date().toISOString(), status:"Saved"};
  await chrome.storage.local.set({savedOpportunities:[item,...savedOpportunities]});
  $("saveBtn").textContent = "✓ Saved";
  await updateSavedCount();
  showToast("Saved to your OpportunityRadar list.");
}
async function updateSavedCount() {
  const {savedOpportunities=[]} = await chrome.storage.local.get("savedOpportunities");
  $("savedCount").textContent = `${savedOpportunities.length} saved`;
}
async function openDashboard() {
  const {dashboardUrl="http://localhost:3000"} = await chrome.storage.sync.get("dashboardUrl");
  chrome.tabs.create({url:dashboardUrl});
}
function showToast(message) {
  $("toast").textContent = message;
  $("toast").classList.add("show");
  setTimeout(()=>$("toast").classList.remove("show"),2600);
}