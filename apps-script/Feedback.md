# PageDrop editor feedback — Google Apps Script setup

One-time setup so the editor **Feedback** form can email `developerchromextension@gmail.com`.

## 1. Create the script

1. Open [script.google.com](https://script.google.com) → **New project**.
2. Delete default code and paste [`Feedback.gs`](./Feedback.gs).
3. Confirm `FEEDBACK_SECRET_KEY` matches `PageDrop/feedback-config.js` → `secret`.

## 2. Deploy as web app

1. **Deploy → New deployment**.
2. Type: **Web app**.
3. Execute as: **Me**.
4. Who has access: **Anyone**.
5. Deploy and copy the **Web app URL** (ends with `/exec`).

## 3. Wire the extension

1. Open `PageDrop/feedback-config.js`.
2. Set `appsScriptUrl` to your Web app URL.
3. Reload the unpacked extension (or ship a build that includes the config).

## 4. Test

1. Open the Apps Script URL in a browser — you should see `{"ok":true,"service":"pagedrop-editor-feedback"}`.
2. In the PageDrop editor, open **Feedback** from the right toolbar (below Rotate), submit a short message, and check the inbox.

While `appsScriptUrl` is empty, Send uses a `mailto:` fallback instead of the web app.
