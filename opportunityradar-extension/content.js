// Runs only after the user presses "Scan this page".
function cleanText(value) {
  return (value || "").replace(/\s+/g, " ").trim();
}
function findMatch(text, patterns) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return cleanText(match[1] || match[0]).slice(0,180);
  }
  return "";
}
function detectOpportunity() {
  const title = cleanText(document.querySelector("h1")?.innerText || document.title).slice(0,180);
  const description = cleanText(
    document.querySelector('meta[name="description"]')?.content ||
    document.querySelector('meta[property="og:description"]')?.content ||
    document.querySelector("main")?.innerText ||
    document.body.innerText
  ).slice(0,12000);
  const fullText = cleanText(document.body.innerText).slice(0,30000);
  const haystack = `${title} ${description} ${fullText}`.toLowerCase();

  const categories = [
    ["Scholarship", /scholarship|financial aid|tuition grant/],
    ["Hackathon", /hackathon|coding marathon/],
    ["Internship", /internship|intern role|summer intern/],
    ["Fellowship", /fellowship/],
    ["Competition", /competition|contest|challenge/],
    ["Workshop", /workshop|bootcamp|training programme|training program/],
    ["Student Program", /student ambassador|student program|student programme/]
  ];
  const found = categories.find(([,re]) => re.test(haystack));
  const applicationSignal = /apply now|application deadline|register now|eligibility|applications open|last date to apply|apply by/.test(haystack);
  const isOpportunity = Boolean(found && (applicationSignal || /opportunity|apply|registration/.test(haystack)));

  const deadline = findMatch(fullText, [
    /(?:application )?(?:deadline|last date|apply by|closing date)\s*[:\-]?\s*([A-Za-z]{3,9}\s+\d{1,2},?\s+\d{4}|\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
    /(?:deadline|last date|apply by)\s*[:\-]?\s*([^.\n]{3,45})/i
  ]);
  const organisation = cleanText(document.querySelector('meta[property="og:site_name"]')?.content || location.hostname.replace(/^www\./,""));
  const locationText = findMatch(fullText, [/(?:location|work mode|workplace)\s*[:\-]\s*([^\n.]{3,55})/i]);
  const eligibility = findMatch(fullText, [/(?:eligibility|who can apply|eligible candidates)\s*[:\-]?\s*([^\n]{5,160})/i]);
  const benefit = findMatch(fullText, [/(?:stipend|prize|rewards|benefits|compensation)\s*[:\-]?\s*([^\n]{3,100})/i]);
  const summary = description || fullText.slice(0,260);
  return {
    isOpportunity, title, category:found?.[0] || "Opportunity", organisation,
    deadline:deadline || "", location:locationText || "", eligibility:eligibility || "",
    benefit:benefit || "", summary:summary.slice(0,320),
    source:"page extraction", confidence: isOpportunity ? (applicationSignal ? "STRONG" : "POSSIBLE") : "LOW",
    extractedAt:new Date().toISOString()
  };
}
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "OR_SCAN_PAGE") {
    try { sendResponse({ok:true,data:detectOpportunity()}); }
    catch (e) { sendResponse({ok:false,error:"Unable to analyse this page."}); }
  }
  return true;
});