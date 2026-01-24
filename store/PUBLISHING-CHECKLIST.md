# Cookie Manager - Publishing Checklist

## Pre-Submission Checklist

### Code Quality
- [ ] Extension loads without console errors
- [ ] All features work correctly
- [ ] Dark mode tested
- [ ] Keyboard shortcuts work

### Files Required
- [x] manifest.json
- [x] All source files in src/
- [x] Icons (16, 48, 128px)
- [x] README.md
- [x] LICENSE

### Store Assets
- [x] Store description (description.txt)
- [x] Short description (short-description.txt)
- [x] Single purpose statement (privacy-single-purpose.txt)
- [x] Permission justifications (privacy-permissions.txt)
- [x] Privacy policy (privacy-policy.html)
- [ ] 5 screenshots (1280x800)
- [ ] Small promo tile (440x280)
- [ ] Marquee tile (1400x560)

---

## Chrome Web Store Dashboard Fields

### Store Listing
| Field | Value |
|-------|-------|
| Name | Cookie Manager |
| Summary | Simple cookie manager for developers. View, edit, export, and protect cookies with a clean UI. |
| Description | [Copy from description.txt] |
| Category | Developer Tools |
| Language | English |

### URLs
| Field | Value |
|-------|-------|
| Homepage | https://zovo.one |
| Support URL | https://github.com/nicholasip/cookie-manager/issues |
| Privacy Policy | https://zovo.one/privacy/cookie-manager |

### Privacy
| Field | Value |
|-------|-------|
| Single Purpose | [Copy from privacy-single-purpose.txt] |
| Permission Justifications | [Copy from privacy-permissions.txt] |
| Remote Code | No, I am not using remote code |
| Data Usage Certification | No user data collected |

---

## Package Extension

```bash
cd /Users/mike/cookie-manager
zip -r cookie-manager-v1.0.0.zip manifest.json src/ assets/ docs/ LICENSE README.md -x '*.DS_Store' -x '*/.git/*'
```

---

## Post-Submission

- [ ] Monitor review status
- [ ] Respond to any reviewer questions within 24 hours
- [ ] Once approved, update GitHub repo with store link
- [ ] Create GitHub release with v1.0.0 tag
- [ ] Update landing page with store link
