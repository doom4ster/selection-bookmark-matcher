# Contributing Guide

Thanks for considering contributing! ✨

## Getting Started
1. Fork the repo & clone locally
2. Create a branch: `git checkout -b feat/your-feature`
3. Install Node (no deps needed yet)
4. Build extension: `npm run build:mv2` or `npm run build:mv3`
5. Load into Firefox / Chrome for manual test

## Commit Convention (Recommended)
Format:
```
<type>: <short description>
```
Types:
- feat: new feature
- fix: bug fix
- docs: documentation only
- chore: build/script/config changes
- refactor: code restructuring without behavior change
- perf: performance improvement
- test: add or improve tests

## Pull Request Checklist
- [ ] Feature / fix described in PR body
- [ ] Screenshots added (UI impact) if applicable
- [ ] No unrelated formatting noise
- [ ] Build passes (`npm run build:mv2` and `npm run build:mv3`)

## File Overview
| File | Purpose |
|------|---------|
| `manifest.mv3.json` | Source manifest (MV3) |
| `scripts/build.js` | Converts MV3 -> MV2 and outputs dist |
| `background.js` | Bookmark search + message handler |
| `contentScript.js` | Selection detection & UI panel |

## Roadmap Ideas
See README roadmap section.

## License
By contributing you agree that your contributions will be licensed under the project MIT License.
