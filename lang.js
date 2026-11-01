/**
 * Site languages for the PageDrop website.
 *
 * English pages live at the site root; each translation lives in its own
 * folder with the same file names (ja/index.html, ja/privacy.html, ...).
 *
 * - English pages send visitors arriving from outside the site to their
 *   browser language when a translation exists, or to the language they
 *   picked before. Load this script synchronously in <head> so the English
 *   page never flashes first.
 * - Links marked data-set-lang (the language menu) remember the choice.
 *
 * Keep LANGS in sync with the folders and the language menu in each page.
 */
(function () {
  'use strict';

  var LANGS = ['en', 'pt-br', 'es', 'ja', 'zh-cn', 'ru'];
  var STORAGE_KEY = 'pagedrop-site-lang';

  var script = document.currentScript;
  var root = script ? script.src.replace(/lang\.js(?:[?#].*)?$/, '') : '';

  var pageLang = String(document.documentElement.lang || 'en').toLowerCase();
  if (LANGS.indexOf(pageLang) === -1) pageLang = 'en';

  function readChoice() {
    try {
      return localStorage.getItem(STORAGE_KEY) || '';
    } catch (e) {
      return '';
    }
  }

  function saveChoice(lang) {
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch (e) {
      // Storage blocked: the menu link still works, it just isn't remembered.
    }
  }

  // Map a browser language tag to one of our folders, or '' if we have none.
  function fromBrowserTag(tag) {
    tag = String(tag || '').toLowerCase();
    var primary = tag.split('-')[0];
    if (primary === 'en') return 'en';
    if (primary === 'pt') return 'pt-br';
    if (primary === 'es') return 'es';
    if (primary === 'ja') return 'ja';
    if (primary === 'ru') return 'ru';
    // Simplified Chinese only; Traditional (TW/HK/MO) readers can pick it in the menu.
    if (primary === 'zh') {
      if (/-hans(-|$)/.test(tag)) return 'zh-cn';
      return /-(tw|hk|mo|hant)(-|$)/.test(tag) ? '' : 'zh-cn';
    }
    return '';
  }

  function browserLang() {
    var list = navigator.languages && navigator.languages.length
      ? navigator.languages
      : [navigator.language];
    for (var i = 0; i < list.length; i++) {
      var lang = fromBrowserTag(list[i]);
      if (lang) return lang;
    }
    return 'en';
  }

  // Someone clicking around the site chose this page on purpose.
  function cameFromThisSite() {
    return Boolean(root && document.referrer && document.referrer.indexOf(root) === 0);
  }

  // This page's path inside its language folder: '' (home), 'privacy.html', ...
  function pagePath() {
    var here = location.href.split(/[?#]/)[0];
    if (!root || here.indexOf(root) !== 0) return null;
    var rel = here.slice(root.length);
    if (pageLang !== 'en') {
      if (rel.indexOf(pageLang + '/') !== 0) return null;
      rel = rel.slice(pageLang.length + 1);
    }
    return rel === 'index.html' ? '' : rel;
  }

  if (pageLang === 'en' && !cameFromThisSite()) {
    var choice = readChoice();
    var target = LANGS.indexOf(choice) !== -1 ? choice : browserLang();
    var path = pagePath();
    if (target !== 'en' && path !== null) {
      // Keep ?v=&key= (uninstall survey) and #anchors.
      location.replace(root + target + '/' + path + location.search + location.hash);
      return;
    }
  }

  function initMenu() {
    var links = document.querySelectorAll('a[data-set-lang]');
    for (var i = 0; i < links.length; i++) {
      var link = links[i];
      if (location.search || location.hash) {
        link.href = link.href.split(/[?#]/)[0] + location.search + location.hash;
      }
      link.addEventListener('click', function () {
        saveChoice(this.getAttribute('data-set-lang'));
      });
    }

    var menus = document.querySelectorAll('details.lang-menu');
    if (!menus.length) return;

    document.addEventListener('click', function (event) {
      for (var j = 0; j < menus.length; j++) {
        if (menus[j].open && !menus[j].contains(event.target)) menus[j].open = false;
      }
    });

    document.addEventListener('keydown', function (event) {
      if (event.key !== 'Escape') return;
      for (var j = 0; j < menus.length; j++) {
        if (menus[j].open) {
          menus[j].open = false;
          menus[j].querySelector('summary').focus();
        }
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMenu);
  } else {
    initMenu();
  }
})();
