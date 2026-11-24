# OpportunityRadar Chrome Extension

A Chrome Manifest V3 MVP for detecting opportunity-like information on the page a student chooses to scan, extracting visible details, and saving opportunities locally.

## Included in this MVP
- Polished popup UI
- User-triggered page scan (no continuous browsing monitoring)
- Basic rule-based detection for internships, scholarships, hackathons, fellowships, competitions, workshops and student programmes
- Extraction of title, organisation, deadline, location, eligibility and benefits when visible
- Local save list with duplicate URL protection
- Settings page for dashboard URL and deadline notifications
- Basic deadline reminders for saved items with parseable dates

## Important current limitations
- Detection is heuristic, not AI. It can miss opportunities or produce false positives.
- Eligibility is shown as extracted page text / needs review; there is no profile-based eligibility decision yet.
- Saved items are stored locally in the browser, not synced to a backend account.
- Deadline reminders work best when a date is parseable by JavaScript. Verify every deadline on the official source.
- The dashboard URL defaults to `http://localhost:3000`; change it in extension settings.
- The extension intentionally scans only after the user clicks the scan button.

## Install locally
1. Extract the ZIP.
2. Open `chrome://extensions` in Chrome.
3. Turn on **Developer mode**.
4. Click **Load unpacked**.
5. Select the `opportunityradar-extension` folder.
6. Open an ordinary webpage containing an internship, scholarship or hackathon announcement.
7. Click the OpportunityRadar icon and choose **Scan this page**.

## Backend / AI integration next
Keep AI provider keys on your Node/Express backend, never in extension files. A sensible next API contract:
- `POST /api/opportunities/analyze` – accepts page text + source URL; returns structured opportunity fields and evidence.
- `POST /api/opportunities/save` – saves a validated opportunity to the authenticated student's account.
- `GET /api/student/profile` – returns education, skills, interests and experience.
- `POST /api/opportunities/check-eligibility` – compares profile with explicit opportunity criteria and returns eligible / possibly eligible / not eligible / insufficient information with reasons.
- `GET /api/student/saved-opportunities` – returns saved items.

Before shipping publicly, add authentication, server-side validation, rate limiting, privacy disclosures, robust date parsing, tests and a clear deletion/export flow.
