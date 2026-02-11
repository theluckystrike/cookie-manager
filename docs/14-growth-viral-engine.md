# MD 14 — Growth Viral Engine
## Cookie Manager — Phase 14 Complete

**Date:** February 2026 | **Status:** Complete
**Extension:** Cookie Manager v1.0.0

---

## Overview

Phase 14 implements a privacy-respecting growth engine for Cookie Manager. All growth mechanics are 100% local — no external tracking, no analytics servers, no referral endpoints. The system tracks user milestones locally and shows tasteful, dismissable prompts for reviews and sharing at natural value moments.

## Files Created

| File | Lines | Purpose |
|------|-------|---------|
| `src/shared/milestone-tracker.js` | ~130 | Usage milestone tracking (edits, exports, JWT decodes, sessions) |
| `src/shared/growth-prompts.js` | ~130 | Smart review/share prompt logic with rate limiting and user respect |

## Files Modified

| File | Changes |
|------|---------|
| `src/popup/popup.js` | Milestone recording on save/export/JWT/clear/session; growth banner UI |
| `src/popup/popup.css` | Growth banner styles with slide-in animation |
| `src/background/service-worker.js` | GET_MILESTONES and GET_GROWTH_STATS message handlers |

## Growth Mechanics

### Milestone Triggers
| Milestone | Threshold | Growth Action |
|-----------|-----------|---------------|
| First Edit | 1 edit | Welcome moment |
| Power Editor | 25 edits | Review prompt |
| First Export | 1 export | — |
| Export Pro | 5 exports | Share prompt |
| First JWT | 1 decode | Share prompt |
| First Clear | 1 clear | — |
| 5 Sessions | 5 opens | — |
| 25 Sessions | 25 opens | Review prompt |
| 100 Sessions | 100 opens | — |

### Share Templates
- Twitter: Developer-focused message with link
- LinkedIn: Professional recommendation
- Dev.to: Community-focused with privacy angle

### Review Prompt Rules
- Only shown after 25+ edits or 25+ sessions
- Never shown if user selected "never"
- 30-day cooldown after "later"
- Shown once per session maximum

## Privacy Guarantees

- Zero external network requests for growth
- All milestone data in chrome.storage.local
- No referral server or tracking pixels
- No user identification or fingerprinting
- Share links go to public pages only (CWS listing, zovo.one)
- User can dismiss prompts permanently

## Architecture

All growth modules use the same IIFE pattern as MD 11-12 shared modules. They integrate with the popup via `typeof` guards so the popup degrades gracefully if modules aren't loaded. The service worker provides read-only access to growth data via two new message types.

---

*Phase 14 — Growth Viral Engine — Complete*
*Part of Cookie Manager by Zovo (https://zovo.one)*
