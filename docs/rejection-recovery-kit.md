# Rejection Recovery Kit

**Cookie Manager** | Prepared: February 2026

Ready-to-use appeal templates and emergency procedures if Cookie Manager is rejected or removed from the Chrome Web Store.

---

## 1. Permission Justification Appeal

**Use if:** `<all_urls>` host permission is questioned.

> **Subject:** Appeal for Cookie Manager -- host_permissions: `<all_urls>`
>
> Cookie Manager is a developer tool whose core purpose is to let users view, edit, export, and delete browser cookies on any website they visit.
>
> The `<all_urls>` host permission is required because:
>
> 1. The `chrome.cookies` API requires explicit host_permissions for every domain it accesses. Without `<all_urls>`, cookie operations would be limited to a hardcoded list of domains, making the extension non-functional for its stated purpose.
> 2. Users expect to manage cookies for any site they visit -- the target domain is unknown until runtime.
> 3. The extension does not track browsing history, transmit data, or make any network requests. All operations are local.
> 4. The extension is open source (https://github.com/theluckystrike/cookie-manager) and can be audited to verify these claims.
>
> This permission is the minimum required to fulfill the extension's single purpose: browser cookie management.

---

## 2. Privacy Policy Appeal

**Use if:** Privacy practices or data handling is questioned.

> **Subject:** Appeal for Cookie Manager -- Privacy Policy Clarification
>
> Cookie Manager's privacy policy is published at `docs/PRIVACY.md` in our repository and is accessible from the extension's Chrome Web Store listing.
>
> Key facts:
>
> - **All data is stored locally** via `chrome.storage.local`. No external databases or servers.
> - **Zero network requests.** The extension contains no fetch calls, no XMLHttpRequest, no WebSocket connections. The CSP is `script-src 'self'; object-src 'none'`.
> - **Zero data collection.** No analytics servers, no telemetry endpoints, no third-party SDKs.
> - **Open source** at https://github.com/theluckystrike/cookie-manager for full verification.
>
> Local diagnostic data (error logs, startup history, load times) is capped, never transmitted, and exists solely for the user's own troubleshooting.

---

## 3. Single Purpose Statement

**Use in any appeal where purpose clarity is needed:**

> Cookie Manager serves one purpose: allowing users to view, edit, export, and manage browser cookies for web development, testing, and privacy.

---

## 4. Emergency Contacts

| Channel | Location |
|---------|----------|
| Standard Appeals | Chrome Web Store Developer Console > Published Items > [Extension] > Appeal |
| Developer Support | https://support.google.com/chrome_webstore/contact |
| Policy Reference | https://developer.chrome.com/docs/webstore/program_policies |
| CWS Troubleshooter | https://support.google.com/chrome_webstore/troubleshooter |

**Response timeline:** Appeals typically receive a response within 3-7 business days. Repeat appeals may take longer.

---

## 5. Pre-Takedown Backup Checklist

If a takedown notice is received, verify the following immediately:

- [ ] Extension source code is backed up on GitHub (https://github.com/theluckystrike/cookie-manager)
- [ ] Store listing content is documented in `docs/store-listing.md`
- [ ] Privacy policy is available at `docs/PRIVACY.md`
- [ ] All user settings and diagnostic data is 100% local -- no server backup needed
- [ ] Alternative distribution ready: users can sideload via GitHub releases
- [ ] Screenshots and promotional images are saved locally in `assets/`
- [ ] Current `manifest.json` version noted: check before re-submission
- [ ] Appeal submitted within 30 days of rejection notice

---

## 6. Post-Rejection Action Plan

1. **Read the rejection email carefully.** Identify the exact policy cited.
2. **Copy the relevant appeal template** from this document.
3. **Submit appeal** through the Developer Console within 7 days.
4. **If code changes are required**, fix the issue, increment version, and re-submit.
5. **If the extension is removed**, publish a GitHub release with sideload instructions.
6. **Document the outcome** for future reference.

---

*Cookie Manager by Zovo (https://zovo.one)*
