/**
 * PageDrop editor feedback — emails submissions to the developer inbox.
 * Deploy as a separate Apps Script web app (Execute as: Me, Who has access: Anyone).
 * See Feedback.md for steps.
 */
'use strict';

/** Must match PageDrop/feedback-config.js `secret` */
const FEEDBACK_SECRET_KEY = 'pagedrop-feedback-7c3e9a2b';

const INBOX_EMAIL = 'developerchromextension@gmail.com';
const MAX_MESSAGE_CHARS = 4000;
const MAX_REPLY_EMAIL_CHARS = 320;

/**
 * @param {GoogleAppsScript.Events.DoPost} e
 * @returns {GoogleAppsScript.Content.TextOutput}
 */
function doPost(e) {
  try {
    const payload = parseRequestPayload(e);
    if (!payload) {
      return jsonResponse({ ok: false, error: 'Invalid JSON body' }, 400);
    }

    if (payload.key !== FEEDBACK_SECRET_KEY) {
      return jsonResponse({ ok: false, error: 'Unauthorized' }, 403);
    }

    const message = String(payload.message || '').trim();
    if (!message) {
      return jsonResponse({ ok: false, error: 'Message is required' }, 400);
    }
    if (message.length > MAX_MESSAGE_CHARS) {
      return jsonResponse({ ok: false, error: 'Message too long' }, 400);
    }

    const replyEmail = String(payload.replyEmail || '').trim();
    if (replyEmail.length > MAX_REPLY_EMAIL_CHARS) {
      return jsonResponse({ ok: false, error: 'Reply email too long' }, 400);
    }

    const version = String(payload.version || '').trim().slice(0, 32);
    const subject = version
      ? 'PageDrop feedback (v' + version + ')'
      : 'PageDrop feedback';

    const lines = [
      'PageDrop editor feedback',
      '',
      'Message:',
      message,
      '',
    ];
    if (replyEmail) {
      lines.push('Reply-to (user provided): ' + replyEmail);
      lines.push('');
    }
    if (version) {
      lines.push('Extension version: ' + version);
    }

    const options = {};
    if (replyEmail && replyEmail.indexOf('@') !== -1) {
      options.replyTo = replyEmail;
    }

    GmailApp.sendEmail(INBOX_EMAIL, subject, lines.join('\n'), options);
    return jsonResponse({ ok: true });
  } catch (err) {
    return jsonResponse({ ok: false, error: String(err.message || err) }, 500);
  }
}

/**
 * @returns {GoogleAppsScript.Content.TextOutput}
 */
function doGet() {
  return jsonResponse({ ok: true, service: 'pagedrop-editor-feedback' });
}

/**
 * @param {GoogleAppsScript.Events.DoPost} e
 * @returns {Object<string, *>|null}
 */
function parseRequestPayload(e) {
  if (!e) {
    return null;
  }

  if (e.postData && e.postData.contents) {
    try {
      return JSON.parse(e.postData.contents);
    } catch {
      // Fall through to form-encoded payload.
    }
  }

  if (e.parameter && e.parameter.payload) {
    try {
      return JSON.parse(e.parameter.payload);
    } catch {
      return null;
    }
  }

  return null;
}

/**
 * @param {Object<string, *>} body
 * @param {number} [_status]
 * @returns {GoogleAppsScript.Content.TextOutput}
 */
function jsonResponse(body) {
  return ContentService.createTextOutput(JSON.stringify(body)).setMimeType(
    ContentService.MimeType.JSON
  );
}
