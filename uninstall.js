/**
 * Uninstall survey logic, shared by uninstall.html in every language folder.
 * Page text lives in each HTML file; only text this script writes is here.
 * Reason values stay in English so the Google Sheet groups them across languages.
 */
(function () {
  'use strict';

  const STRINGS = {
    en: {
      reasons: {
        buggy: "Didn't work as expected / buggy",
        missing_feature: 'Missing a feature I need',
        slow_complicated: 'Too slow or complicated',
        other: 'Other',
      },
      submit: 'Submit',
      submitting: 'Submitting…',
    },
    'pt-br': {
      reasons: {
        buggy: 'Não funcionou como esperado / com bugs',
        missing_feature: 'Falta um recurso de que preciso',
        slow_complicated: 'Lento ou complicado demais',
        other: 'Outro motivo',
      },
      submit: 'Enviar',
      submitting: 'Enviando…',
    },
    es: {
      reasons: {
        buggy: 'No funcionó como esperaba / tiene errores',
        missing_feature: 'Le falta una función que necesito',
        slow_complicated: 'Demasiado lento o complicado',
        other: 'Otro motivo',
      },
      submit: 'Enviar',
      submitting: 'Enviando…',
    },
    ja: {
      reasons: {
        buggy: '期待どおりに動かない／不具合がある',
        missing_feature: '必要な機能がない',
        slow_complicated: '遅い、または使い方が複雑',
        other: 'その他',
      },
      submit: '送信',
      submitting: '送信中…',
    },
    'zh-cn': {
      reasons: {
        buggy: '没有按预期工作 / 有 Bug',
        missing_feature: '缺少我需要的功能',
        slow_complicated: '太慢或太复杂',
        other: '其他',
      },
      submit: '提交',
      submitting: '正在提交…',
    },
    ru: {
      reasons: {
        buggy: 'Работало не так, как ожидалось / с ошибками',
        missing_feature: 'Не хватает нужной функции',
        slow_complicated: 'Слишком медленно или сложно',
        other: 'Другое',
      },
      submit: 'Отправить',
      submitting: 'Отправка…',
    },
  };

  const REASON_VALUES = ['buggy', 'missing_feature', 'slow_complicated', 'other'];

  const pageLang = String(document.documentElement.lang || 'en').toLowerCase();
  const T = STRINGS[pageLang] || STRINGS.en;

  // Footer default for direct visits. Survey submissions use only ?v= from
  // chrome.runtime.setUninstallURL (the user's installed extension version).
  const SITE_VERSION = '1.7.4';
  const params = new URLSearchParams(window.location.search);
  const extensionVersion = String(params.get('v') || '').trim();
  const urlSecretKey = params.get('key') || '';
  const daysSinceInstall = params.get('days') || '';

  const config = window.PAGEDROP_SURVEY || {};
  const secretKey = urlSecretKey || config.secretKey || '';
  const appsScriptUrl = (config.appsScriptUrl || '').trim();

  let submissionId = createSubmissionId();
  let surveySubmitted = false;
  let partialSent = false;
  let optedOut = false;

  function createSubmissionId() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return 'pd-' + Date.now() + '-' + Math.random().toString(36).slice(2, 10);
  }

  function buildReasonList() {
    const container = document.getElementById('reason-list');
    container.replaceChildren();
    for (const value of REASON_VALUES) {
      const li = document.createElement('li');
      const label = document.createElement('label');
      const input = document.createElement('input');
      input.type = 'radio';
      input.name = 'reason';
      input.value = value;
      label.appendChild(input);
      label.appendChild(document.createTextNode(T.reasons[value]));
      li.appendChild(label);
      container.appendChild(li);
    }
  }

  function buildRatingRow() {
    const row = document.getElementById('rating-row');
    row.replaceChildren();
    for (let i = 1; i <= 5; i++) {
      const label = document.createElement('label');
      const input = document.createElement('input');
      input.type = 'radio';
      input.name = 'rating';
      input.value = String(i);
      label.appendChild(input);
      label.appendChild(document.createTextNode(String(i)));
      row.appendChild(label);
    }
  }

  function getRadioValue(name) {
    const checked = document.querySelector('input[name="' + name + '"]:checked');
    return checked ? checked.value : '';
  }

  function collectAnswers() {
    return {
      submission_id: submissionId,
      reason: getRadioValue('reason'),
      short_note: document.getElementById('short-note').value.trim(),
      rating: getRadioValue('rating'),
      email: document.getElementById('email').value.trim(),
    };
  }

  function isSurveyConfigured() {
    return Boolean(appsScriptUrl && secretKey);
  }

  function hasPartialAnswers(answers) {
    return Boolean(
      answers.reason ||
      answers.short_note ||
      answers.rating ||
      answers.email
    );
  }

  function buildSurveyPayload(answers, abandoned) {
    return JSON.stringify({
      key: secretKey,
      step: '1',
      version: extensionVersion,
      days_since_install: daysSinceInstall,
      answers: abandoned
        ? Object.assign({}, answers, { abandoned: true })
        : answers,
    });
  }

  function submitSurvey(answers, options) {
    if (!isSurveyConfigured()) {
      return Promise.resolve({ ok: false, skipped: true });
    }

    const payload = buildSurveyPayload(answers, false);
    const fetchOptions = {
      method: 'POST',
      mode: 'no-cors',
      redirect: 'follow',
      headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
      body: payload,
    };
    if (options && options.keepalive) {
      fetchOptions.keepalive = true;
    }

    // sendBeacon often drops POST bodies on Apps Script redirect responses.
    // no-cors fetch with text/plain is a simple cross-origin request (no preflight).
    return fetch(appsScriptUrl, fetchOptions)
      .then(() => ({ ok: true }))
      .catch(() => submitSurveyViaForm(payload));
  }

  function sendPartialOnLeave() {
    if (!isSurveyConfigured()) return;
    if (partialSent || surveySubmitted || optedOut) return;

    const formPanel = document.getElementById('panel-form');
    if (!formPanel || formPanel.hidden) return;

    const answers = collectAnswers();
    if (!hasPartialAnswers(answers)) return;

    partialSent = true;
    const payload = buildSurveyPayload(answers, true);

    try {
      fetch(appsScriptUrl, {
        method: 'POST',
        mode: 'no-cors',
        keepalive: true,
        headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
        body: payload,
      });
    } catch {
      if (navigator.sendBeacon) {
        navigator.sendBeacon(
          appsScriptUrl,
          new Blob([payload], { type: 'text/plain;charset=UTF-8' })
        );
      }
    }
  }

  function submitSurveyViaForm(payloadJson) {
    return new Promise((resolve) => {
      const iframeName = 'pagedrop-survey-submit-' + Date.now();
      const iframe = document.createElement('iframe');
      iframe.name = iframeName;
      iframe.hidden = true;
      iframe.setAttribute('aria-hidden', 'true');
      document.body.appendChild(iframe);

      const form = document.createElement('form');
      form.method = 'POST';
      form.action = appsScriptUrl;
      form.target = iframeName;
      form.style.display = 'none';

      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = 'payload';
      input.value = payloadJson;
      form.appendChild(input);

      document.body.appendChild(form);
      form.submit();

      window.setTimeout(() => {
        form.remove();
        iframe.remove();
        resolve({ ok: true, form: true });
      }, 1500);
    });
  }

  function showPanel(panelId) {
    const panels = ['panel-form', 'panel-done'];
    for (const id of panels) {
      const el = document.getElementById(id);
      const active = id === panelId;
      el.classList.toggle('is-active', active);
      el.hidden = !active;
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }

  function showDone() {
    showPanel('panel-done');
  }

  function setSubmitting(submitting) {
    const btn = document.getElementById('submit-survey');
    if (!btn) return;
    btn.disabled = submitting;
    btn.textContent = submitting ? T.submitting : T.submit;
  }

  buildReasonList();
  buildRatingRow();

  if (!isSurveyConfigured()) {
    document.getElementById('config-warn').hidden = false;
  }

  const versionFoot = document.getElementById('version-foot');
  if (versionFoot) {
    versionFoot.textContent = 'PageDrop v' + (extensionVersion || SITE_VERSION);
    versionFoot.hidden = false;
  }

  document.getElementById('form-survey').addEventListener('submit', (event) => {
    event.preventDefault();
    const answers = collectAnswers();
    if (!answers.reason) {
      document.getElementById('reason-error').classList.add('is-visible');
      return;
    }
    document.getElementById('reason-error').classList.remove('is-visible');
    surveySubmitted = true;
    setSubmitting(true);
    submitSurvey(answers).finally(() => {
      setSubmitting(false);
      showDone();
    });
  });

  document.getElementById('skip-survey').addEventListener('click', () => {
    optedOut = true;
    showDone();
  });

  document.getElementById('close-done').addEventListener('click', () => {
    window.close();
  });

  window.addEventListener('pagehide', sendPartialOnLeave);
})();
