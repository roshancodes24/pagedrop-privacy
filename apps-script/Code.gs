/**
 * PageDrop uninstall survey — Google Apps Script web app.
 * Paste into Extensions → Apps Script on your feedback Google Sheet.
 * See apps-script/README.md for deploy steps.
 */
'use strict';

/** Must match survey-config.js and PageDrop/background.js */
const SURVEY_SECRET_KEY = 'pagedrop-uninstall-8f2a1c9e';

const SHEET_NAME = 'Responses';

const HEADERS = [
  'timestamp',
  'submission_id',
  'step',
  'reason',
  'duration',
  'mode',
  'short_note',
  'goal',
  'frustration',
  'improvement',
  'rating',
  'email',
  'version',
];

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

    if (payload.key !== SURVEY_SECRET_KEY) {
      return jsonResponse({ ok: false, error: 'Unauthorized' }, 403);
    }

    const row = buildRow(payload);
    appendRow(row);
    return jsonResponse({ ok: true });
  } catch (err) {
    return jsonResponse({ ok: false, error: String(err.message || err) }, 500);
  }
}

/**
 * @param {GoogleAppsScript.Events.DoGet} _e
 * @returns {GoogleAppsScript.Content.TextOutput}
 */
function doGet() {
  return jsonResponse({ ok: true, service: 'pagedrop-uninstall-survey' });
}

/**
 * @param {GoogleAppsScript.Events.DoPost} e
 * @returns {Object<string, *>|null}
 */
function parseRequestPayload(e) {
  if (!e || !e.postData || !e.postData.contents) {
    return null;
  }

  try {
    return JSON.parse(e.postData.contents);
  } catch {
    return null;
  }
}

/**
 * @param {Object<string, *>} payload
 * @returns {Array<*>}
 */
function buildRow(payload) {
  const answers = payload.answers && typeof payload.answers === 'object'
    ? payload.answers
    : {};

  return [
    new Date().toISOString(),
    sanitize(answers.submission_id, 64),
    sanitize(payload.step, 8),
    sanitize(answers.reason, 120),
    sanitize(answers.duration, 64),
    sanitize(answers.mode, 64),
    sanitize(answers.short_note, 500),
    sanitize(answers.goal, 1000),
    sanitize(answers.frustration, 2000),
    sanitize(answers.improvement, 2000),
    sanitize(answers.rating, 8),
    sanitize(answers.email, 254),
    sanitize(payload.version, 32),
  ];
}

/**
 * @param {*} value
 * @param {number} maxLen
 * @returns {string}
 */
function sanitize(value, maxLen) {
  if (value === null || value === undefined) {
    return '';
  }
  return String(value).trim().slice(0, maxLen);
}

/**
 * @param {Array<*>} row
 */
function appendRow(row) {
  const sheet = getOrCreateSheet();
  ensureHeaders(sheet);
  sheet.appendRow(row);
}

/**
 * @returns {GoogleAppsScript.Spreadsheet.Sheet}
 */
function getOrCreateSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  return sheet;
}

/**
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet
 */
function ensureHeaders(sheet) {
  if (sheet.getLastRow() > 0) {
    return;
  }
  sheet.appendRow(HEADERS);
  sheet.setFrozenRows(1);
}

/**
 * @param {Object<string, *>} body
 * @param {number} _status
 * @returns {GoogleAppsScript.Content.TextOutput}
 */
function jsonResponse(body, _status) {
  return ContentService.createTextOutput(JSON.stringify(body)).setMimeType(
    ContentService.MimeType.JSON
  );
}
