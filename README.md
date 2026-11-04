# RAVA – Residential Vastu Analysis (Bilingual Course App)

Astrosutras by Anoopam. A self-paced, 14-day Vastu Awareness Programme in English and Hindi.
Presented by Anoopam Shukla and Shweta Vijayvargiya.

This is a static site: no build step and no server needed.

## Files
- `index.html`, `style.css`, `app.js`: the app
- `content.js`: all course content (English and Hindi), interface text and glossary

## Publish with GitHub Pages
1. On github.com click **New repository**, name it (for example `rava-course`), keep it Public, and create it.
2. Click **uploading an existing file** (or Add file > Upload files) and drag in all 10 files (everything except this README is required; README is optional). Click **Commit changes**.
3. Open **Settings > Pages**. Under Build and deployment choose **Deploy from a branch**, Branch **main**, folder **/ (root)**, then Save.
4. After about a minute the course is live at `https://<your-username>.github.io/<repo-name>/`.

Optional: to use your own address, add a custom domain or subdomain under Settings > Pages, or link to the GitHub Pages URL from astrosutras.in.

## Notes
- Learner progress, worksheets and the certificate name are saved in the learner's own browser (localStorage), so they do not sync between devices.
- Certificate: unlocked after the learner submits the assignment of all 14 modules.
- Disclaimer: this is a general awareness programme on residential Vastu; a government-approved degree is required for professional practice.
## Install on a phone
Open the live link in Chrome (Android) and choose **Add to Home screen / Install app**; on iPhone use Safari > Share > **Add to Home Screen**. After the first visit the course also works offline.
When you upload new content later, change VERSION in sw.js (for example ava-v2) so phones fetch the update.
