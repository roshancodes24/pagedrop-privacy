# PageDrop uninstall survey — Google Apps Script setup

One-time setup to store voluntary uninstall feedback in a Google Sheet.

## 1. Create the Sheet

1. Open [Google Sheets](https://sheets.google.com) and create a spreadsheet named **PageDrop Uninstall Feedback**.
2. Rename the first tab to **Responses** (or leave it — the script creates **Responses** if missing).

## 2. Add the script

1. In the spreadsheet: **Extensions → Apps Script**.
2. Delete any default `Code.gs` content and paste the contents of [`Code.gs`](./Code.gs) from this folder.
3. Confirm `SURVEY_SECRET_KEY` matches [`../survey-config.js`](../survey-config.js) and `PageDrop/background.js` (`UNINSTALL_SURVEY_SECRET`).

## 3. Deploy as web app

1. **Deploy → New deployment**.
2. Type: **Web app**.
3. Execute as: **Me**.
4. Who has access: **Anyone**.
5. Deploy and copy the **Web app URL** (ends with `/exec`).

## 4. Wire the survey page

1. Open [`../survey-config.js`](../survey-config.js).
2. Set `appsScriptUrl` to your Web app URL.
3. Deploy the privacy site (see root `deploy.ps1`).

## 5. Test

1. Open the web app URL in a browser — you should see `{"ok":true,"service":"pagedrop-uninstall-survey"}`.
2. Open `uninstall.html` locally or on GitHub Pages, submit Step 1, confirm a row appears in the Sheet.

## Sheet columns

| Column | Step 1 | Step 2 |
|--------|--------|--------|
| timestamp | yes | yes |
| submission_id | yes | same ID links both rows |
| step | `1` | `2` |
| reason | yes | — |
| duration | yes | yes (if re-submitted) |
| mode | yes | yes (if re-submitted) |
| short_note | yes | — |
| goal | — | yes |
| frustration | — | yes |
| improvement | — | yes |
| rating | — | yes |
| email | — | optional |
| version | from URL `?v=` | same |
| days_since_install | from URL `?days=` | same (days since first install) |
| abandoned | `yes` if tab closed on step 1 with answers but no Submit | — |

**Existing Sheets:** If you already have a Responses tab, add **`days_since_install`** and **`abandoned`** column headers after `version`, then redeploy the Apps Script web app.

## Security note

The shared secret in the URL reduces casual spam; it is not a strong secret (it ships in the extension). Rotate `SURVEY_SECRET_KEY` in all three places if abused.
