/* Language bootstrap: runs before the first paint so the right language is shown. */
(function () {
  'use strict';
  var KEY = 'nailong.lang';
  var SUPPORTED = { 'zh-hans': 1, 'zh-hant': 1, 'en': 1 };

  function normalise(value) {
    if (!value) return null;
    var v = String(value).toLowerCase();
    if (v.indexOf('zh') === 0) {
      return /hant|tw|hk|mo/.test(v) ? 'zh-hant' : 'zh-hans';
    }
    if (v.indexOf('en') === 0) return 'en';
    return null;
  }

  var lang = null;
  try {
    lang = normalise(new URLSearchParams(location.search).get('lang'));
    if (!lang) lang = normalise(localStorage.getItem(KEY));
  } catch (e) { /* storage can be unavailable */ }

  if (!lang) {
    var list = (navigator.languages && navigator.languages.length) ? navigator.languages : [navigator.language || ''];
    for (var i = 0; i < list.length; i++) {
      var candidate = normalise(list[i]);
      if (candidate) { lang = candidate; break; }
    }
  }
  if (!SUPPORTED[lang]) lang = 'en';

  var root = document.documentElement;
  var langTag = lang === 'en' ? 'en' : (lang === 'zh-hant' ? 'zh-Hant' : 'zh-Hans');
  root.setAttribute('lang', langTag);
  root.setAttribute('data-lang', lang);
  window.__NAILONG_LANG__ = lang;

  /* Safety net: if app.js never loads, reveal the fallback copy instead of hiding it. */
  window.setTimeout(function () { root.classList.add('i18n-ready'); }, 2500);
})();
