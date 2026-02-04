# Cookie Manager — Extension Specification
## v1.0 — Built from Competitive Research

---

## SECTION 1: PRODUCT OVERVIEW

### 1.1 Extension Identity
- **Name**: Cookie Manager
- **Tagline**: View, edit, export cookies with ease
- **Category**: Developer Tools
- **Target Users**: Developers, QA testers, privacy-focused users

### 1.2 Problem Statement
- **Pain**: Browser DevTools cookie UI is clunky and slow
- **Alternatives**: EditThisCookie (free/OSS), Cookie-Editor (cross-browser)
- **Why Us**: Clean UI, bulk operations, profile swapping, privacy-first

### 1.3 Success Metrics
| Metric | 30 Days | 60 Days | 90 Days |
|--------|---------|---------|---------|
| Installs | 300 | 1,000 | 2,500 |
| Conversion | 2% | 3% | 5% |
| MRR | $24 | $120 | $400 |
| Rating | 4.0+ | 4.3+ | 4.5+ |

---

## SECTION 2: FEATURE SPECIFICATION

### 2.1 Complete Feature Matrix

| Feature | Description | Free | Pro | Notes |
|---------|-------------|------|-----|-------|
| View cookies | See all cookies for current site | ✅ | ✅ | Core |
| Edit cookies | Modify value, expiry, flags | ✅ | ✅ | Core |
| Delete cookies | Remove individual or all | ✅ | ✅ | Core |
| Search | Filter by name/value/domain | ✅ | ✅ | Core |
| Export single | Export one cookie | ✅ | ✅ | Free limit |
| Export bulk | Export all cookies | 10 max | ✅ | Pro gate |
| Import | Import from file | ❌ | ✅ | Pro gate |
| Profiles | Save/switch cookie sets | 1 max | ✅ | Swap My Cookies |
| Sync | Cross-device sync | ❌ | ✅ | #1 upgrade driver |
| Protected | Prevent deletion | ❌ | ✅ | Pro feature |
| Alerts | Notification on change | ❌ | ✅ | Pro feature |

### 2.2 Free Tier Limits
- Export up to 10 cookies at a time
- 1 cookie profile
- No import, no sync

### 2.3 Pro Tier Value ($4/mo)
- Unlimited bulk export
- Multiple profiles for multi-account work
- Import/export in JSON, Netscape, CSV
- Cross-device sync
- Protected cookies

---

## SECTION 3: PAYWALL TRIGGERS

| Trigger | Condition | Type |
|---------|-----------|------|
| Bulk export | Export 11+ cookies | Soft |
| Profile limit | Create 2nd profile | Soft |
| Import | Click import button | Feature gate |
| Sync | Enable sync toggle | Feature gate |

---

## SECTION 4: TECHNICAL

### 4.1 Permissions
| Permission | Reason |
|------------|--------|
| cookies | Core functionality |
| storage | Save preferences/profiles |
| activeTab | Get current tab cookies |
| contextMenus | Right-click actions |
| notifications | Cookie alerts |

### 4.2 Pricing
| Tier | Monthly | Yearly |
|------|---------|--------|
| Free | $0 | $0 |
| Pro | $4 | $36 (25% off) |

---

## SECTION 5: LAUNCH CHECKLIST

- [x] Tier system created
- [ ] Upgrade modal added
- [ ] Store description updated
- [ ] Screenshots created
- [ ] Submit to CWS
