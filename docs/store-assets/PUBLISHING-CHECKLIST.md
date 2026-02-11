# Publishing Checklist: Zovo Cookie Manager

## Chrome Web Store Submission | Generated 2026-02-11

Use this checklist before every Chrome Web Store submission. Every box must be checked before uploading. Reference documents are linked for each section.

---

## Pre-Submission

### CODE

- [ ] Extension loads without console errors (open DevTools on popup, background service worker, and options page -- zero errors/warnings)
- [ ] All features work as documented (run the 63 test procedures from 05-debugging-protocol.md Agent 3)
- [ ] Manifest version is 3 (`"manifest_version": 3` in manifest.json)
- [ ] All icons are custom cookie-with-bite icons -- NOT default Chrome puzzle-piece icons
- [ ] Icon sizes provided: icon-16.png, icon-32.png, icon-48.png, icon-128.png (see agent4-icon-promo-specs.md Section 1)
- [ ] icon-16.png is recognizable as a cookie at actual toolbar size
- [ ] Permissions are minimal and justified:
  - `cookies` -- core CRUD functionality
  - `storage` -- persist profiles, rules, settings locally
  - `tabs` -- read active tab URL for domain filtering, detect tab close for auto-delete
  - `alarms` -- schedule auto-delete rule timers (MV3 service workers cannot use setInterval)
  - `clipboardWrite` -- copy cookie values, cURL commands, exported data
  - `activeTab` -- determine current page URL on user click only
  - `contextMenus` -- right-click menu for quick cookie actions
  - `identity` is runtime-only (optional) -- requested only when user clicks "Sign in to Zovo"
- [ ] No unnecessary permissions remain in manifest (no `<all_urls>`, no `host_permissions`)
- [ ] CSP is strict: `script-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'`
- [ ] No `eval()`, `new Function()`, `innerHTML` with dynamic content, or `document.write` in codebase
- [ ] Service worker registers and survives idle termination (30-second Chrome timeout)
- [ ] Build output contains no source maps, no `.env` files, no development-only code

### STORE LISTING

Reference: [agent1-store-listing.md](agent1-store-listing.md)

- [ ] Description is 2,000-4,000 characters (agent1 provides ~3,640 characters -- paste from description.txt section)
- [ ] Description follows the structure: Hook, Value Prop, Why Section, Features, Perfect For, How It Works, Keyboard Shortcuts, Privacy & Trust, Permissions Explained, Built by Zovo
- [ ] Short description is under 132 characters (agent1 provides 121-character version -- paste from short-description.txt section)
- [ ] Short description starts with action verb ("View, edit, and manage...")
- [ ] All 5 screenshots uploaded (1280x800 PNG each):
  - Screenshot 1: Hero -- "All Your Cookies, One Click" (Cookies tab, github.com data)
  - Screenshot 2: Profiles -- "Switch Environments in Seconds" (Profiles tab, 3 profiles)
  - Screenshot 3: Rules -- "Automatic Cookie Cleanup" (Rules tab, 3 auto-delete rules)
  - Screenshot 4: Export -- "Developer-Friendly Cookie Tools" (Export dropdown + JSON code panel)
  - Screenshot 5: Health -- "Know Your Cookie Health" (Health tab, B+ score, blur-to-clear presell)
- [ ] Screenshots follow the style guide: gradient background `#f0f3ff` to `#f8fafc`, Inter font, 42px headlines, Zovo logo at 60% opacity bottom-right (see agent3-screenshot-specs.md)
- [ ] Small promo tile uploaded (440x280 PNG) -- purple gradient background, white cookie icon, "Zovo Cookie Manager" headline, "by Zovo" badge (see agent4-icon-promo-specs.md Section 2.1)
- [ ] Marquee promo tile uploaded (1400x560 PNG) -- two-column layout with left text + right popup mockup (see agent4-icon-promo-specs.md Section 2.2)
- [ ] Category set to: **Developer Tools**
- [ ] Language set to: **English**

### PRIVACY

Reference: [agent2-privacy-content.md](agent2-privacy-content.md)

- [ ] Single purpose description written and pasted into CWS Developer Dashboard (copy from privacy-single-purpose.txt section of agent2)
- [ ] Single purpose statement begins with: "Zovo Cookie Manager serves a single purpose: manage browser cookies..."
- [ ] All permissions justified individually in the Developer Dashboard:
  - `cookies` -- justification pasted (see agent2 privacy-permissions.txt, PERMISSION: cookies)
  - `storage` -- justification pasted
  - `tabs` -- justification pasted
  - `alarms` -- justification pasted
  - `clipboardWrite` -- justification pasted
  - `activeTab` -- justification pasted
  - `identity` (optional/runtime) -- justification pasted
- [ ] "No, I am not using remote code" selected in the remote code question
- [ ] Caveat documented internally: Pro tier makes network requests to LemonSqueezy (license validation), Google OAuth (authentication), and Zovo API (license verify, profile sync, anonymized analytics) -- but NO remote code is loaded or executed. These are data-only API calls. (See agent2 privacy-remote-code.txt for full explanation.)
- [ ] All data type boxes UNCHECKED (no data collection):
  - [ ] Personally identifiable information -- NOT COLLECTED
  - [ ] Health information -- NOT COLLECTED
  - [ ] Financial and payment information -- NOT COLLECTED
  - [ ] Authentication information -- NOT COLLECTED
  - [ ] Personal communications -- NOT COLLECTED
  - [ ] Location -- NOT COLLECTED
  - [ ] Web history -- NOT COLLECTED
  - [ ] User activity -- NOT COLLECTED
  - [ ] Website content -- NOT COLLECTED
- [ ] All three certifications CHECKED:
  - [x] Does not sell user data to third parties
  - [x] Does not use/transfer data for purposes unrelated to core functionality
  - [x] Does not use/transfer data to determine creditworthiness or for lending
- [ ] Privacy policy URL entered and works: **https://zovo.one/privacy/cookie-manager**
- [ ] Privacy policy page is live, loads without errors, and returns HTTP 200
- [ ] Privacy policy mentions "Zovo Cookie Manager" by name (not just "the extension")
- [ ] Privacy policy includes the "Last updated: February 2026" date
- [ ] Privacy policy covers: Data Collection, Local Storage, Data Transmission, Third-Party Services, Permissions, Data Security, Data Retention, Your Rights, Children's Privacy, Open Source, Changes, Contact (see agent2 privacy-policy-page.md for complete text)

### LINKS

- [ ] Homepage URL: **https://zovo.one/tools/cookie-manager**
- [ ] Support URL: **https://zovo.one/support**
- [ ] Privacy Policy URL: **https://zovo.one/privacy/cookie-manager**
- [ ] All three URLs return HTTP 200 (not 404, not redirect loop)
- [ ] Homepage mentions the extension and links to the CWS listing
- [ ] Support page has a contact method (email form or support@zovo.one)

### BRANDING

Reference: [agent4-icon-promo-specs.md](agent4-icon-promo-specs.md)

- [ ] Cookie icon uses Zovo brand purple gradient (`#6366f1` to `#4f46e5`) with white cookie silhouette
- [ ] Icon follows the Zovo icon system: rounded square container + white function symbol
- [ ] All 5 screenshots include the Zovo wordmark logo at bottom-right, 80px wide, 60% opacity
- [ ] Store description includes "BUILT BY ZOVO" section at the bottom with website, support email, and feedback line
- [ ] Small promo tile includes "by Zovo" badge
- [ ] Marquee promo tile includes Zovo logo at bottom-right, 80px wide, 60% opacity
- [ ] All visual assets use Inter font family exclusively (no system fonts in screenshots)

### FINAL VERIFICATION

- [ ] Loaded extension as unpacked in a clean Chrome profile -- all features work
- [ ] Packed extension as .zip -- file size is under 500KB
- [ ] Unzipped the .zip and loaded it as unpacked -- confirms the zip is valid
- [ ] Ran `chrome://extensions` Developer mode error check -- zero errors
- [ ] Verified no `console.log` statements remain in production build (or they are behind a debug flag)
- [ ] Version number in manifest.json is correct and incremented from any previous submission
- [ ] `default_locale` is set to `"en"` and `_locales/en/messages.json` exists

---

## Post-Submission

- [ ] Save the submission confirmation page (screenshot or PDF)
- [ ] Note the submission date and expected review time: **1-3 business days** (first submissions may take longer)
- [ ] Record the submission ID / item ID from the CWS Developer Dashboard
- [ ] Monitor the registered developer email for rejection notices or review questions
- [ ] Test the extension immediately after approval goes live:
  - [ ] Install from the Chrome Web Store link
  - [ ] Verify popup opens and displays cookies
  - [ ] Verify all icons display correctly (toolbar, extensions page, store listing)
  - [ ] Verify all 5 screenshots appear in the listing
  - [ ] Verify promo tiles render correctly
- [ ] Check all store links work:
  - [ ] Direct CWS listing URL
  - [ ] Homepage URL links back to CWS
  - [ ] Privacy policy URL
  - [ ] Support URL
- [ ] Search verification -- extension appears in results for:
  - [ ] "cookie manager"
  - [ ] "cookie editor"
  - [ ] "zovo cookie"
  - [ ] "manage cookies chrome"
- [ ] Share the listing URL on social media and verify OG image renders correctly (see agent4 Section 2.3 for social share image specs and OG meta tag recommendations)

---

## If Rejected

Chrome Web Store rejections are common, especially for first submissions. Follow this protocol:

1. **Read the rejection email carefully.** The email specifies which policy was violated. Common reasons for cookie extensions:
   - Excessive permissions (requesting more than needed)
   - Missing or inadequate permission justifications
   - Privacy policy does not match declared data practices
   - "Single purpose" description is too vague
   - Remote code detected (inline scripts, eval patterns)

2. **Reference 13-REVIEW-REJECTION-RECOVERY.md** for Zovo-specific solutions to common rejection scenarios.

3. **Fix ALL issues mentioned in the rejection** -- not just the first one. Reviewers often list multiple problems; fixing only one guarantees another rejection cycle.

4. **Update the version number** in manifest.json (e.g., 1.0.0 -> 1.0.1) before resubmitting. CWS may require a new version for resubmission.

5. **Resubmit with a detailed appeal note** if the rejection seems incorrect:
   - Quote the specific policy the reviewer cited
   - Explain precisely why the extension complies
   - Reference specific code files or manifest entries as evidence
   - Link to the open-source repository for full auditability

6. **Track rejection history** in a log file. Pattern recognition helps prevent repeat issues across future Zovo extensions.

---

## Quick Reference: What to Paste Where

| CWS Dashboard Field | Source Document | Section |
|---------------------|-----------------|---------|
| Description (detailed) | agent1-store-listing.md | Section 1: description.txt |
| Short description | agent1-store-listing.md | Section 2: short-description.txt |
| Category / Language / URLs | agent1-store-listing.md | Section 3: store-metadata.txt |
| Single purpose description | agent2-privacy-content.md | Section 1: privacy-single-purpose.txt |
| Permission justifications | agent2-privacy-content.md | Section 2: privacy-permissions.txt |
| Remote code declaration | agent2-privacy-content.md | Section 3: privacy-remote-code.txt |
| Data usage checkboxes | agent2-privacy-content.md | Section 4: privacy-data-usage.txt |
| Privacy policy (host at URL) | agent2-privacy-content.md | Section 5: privacy-policy-page.md |
| Screenshots (5x) | agent3-screenshot-specs.md | Screenshots 1-5 |
| Icon files (4 PNGs + SVG) | agent4-icon-promo-specs.md | Section 1 |
| Small promo tile | agent4-icon-promo-specs.md | Section 2.1 |
| Marquee promo tile | agent4-icon-promo-specs.md | Section 2.2 |

---

*Checklist generated for Zovo Cookie Manager Phase 06 submission. Every item must be verified before uploading to the Chrome Web Store Developer Dashboard.*
