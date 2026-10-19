(function () {
  'use strict';

  var DEST = window.NAILONG_DEST || {};
  var I18N = window.NAILONG_I18N || {};

  var SUPPORTED = ['zh-hans', 'zh-hant', 'en'];
  var REDIRECT_MS = 4000; /* keep in sync with the 4s med-fill animation in style.css */
  var STORAGE_KEY = 'nailong.lang';

  var root = document.documentElement;
  var body = document.body;
  var lang = SUPPORTED.indexOf(window.__NAILONG_LANG__) > -1 ? window.__NAILONG_LANG__ : 'zh-hans';
  var state = 'init';
  var deadline = 0;
  var timer = 0;
  var lastCount = -1;
  var toastTimer = 0;
  var scrollCancelled = false;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  function $(selector) { return document.querySelector(selector); }
  function t(key) {
    var dict = I18N[lang] || I18N['zh-hans'];
    return Object.prototype.hasOwnProperty.call(dict, key) ? dict[key] : (I18N['zh-hans'][key] || '');
  }

  function setCountdownLabel(count) {
    var label = $('#countdown-label');
    if (!label) return;
    if (state === 'stayed') {
      label.textContent = t('hero.stayed');
      return;
    }
    var key = (lang === 'en' && count === 1) ? 'hero.countdownOne' : 'hero.countdown';
    label.textContent = t(key);
  }

  function updateCount(count) {
    var num = $('#countdown-num');
    if (!num || count === lastCount) return;
    num.textContent = String(count);
    lastCount = count;
    setCountdownLabel(count);
  }

  function applyLanguage(next, options) {
    options = options || {};
    lang = next;
    root.setAttribute('lang', lang === 'en' ? 'en' : (lang === 'zh-hant' ? 'zh-Hant' : 'zh-Hans'));
    root.setAttribute('data-lang', lang);

    var dict = I18N[lang];
    document.title = dict['meta.title'];
    var meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', dict['meta.desc']);

    Array.prototype.forEach.call(document.querySelectorAll('[data-i18n]'), function (el) {
      var value = dict[el.getAttribute('data-i18n')];
      if (typeof value === 'string') el.textContent = value;
    });
    Array.prototype.forEach.call(document.querySelectorAll('[data-i18n-html]'), function (el) {
      var value = dict[el.getAttribute('data-i18n-html')];
      if (typeof value === 'string') el.innerHTML = value;
    });
    Array.prototype.forEach.call(document.querySelectorAll('[data-i18n-aria-label]'), function (el) {
      var value = dict[el.getAttribute('data-i18n-aria-label')];
      if (typeof value === 'string') el.setAttribute('aria-label', value);
    });
    Array.prototype.forEach.call(document.querySelectorAll('[data-lang-btn]'), function (btn) {
      btn.setAttribute('aria-pressed', String(btn.getAttribute('data-lang-btn') === lang));
    });
    Array.prototype.forEach.call(document.querySelectorAll('[data-lang-card]'), function (card) {
      card.classList.toggle('is-current', card.getAttribute('data-lang-card') === lang);
    });

    var dest = DEST[lang];
    if ($('#go')) $('#go').setAttribute('href', dest);
    if ($('#dest-url')) $('#dest-url').setAttribute('href', dest);

    if (state === 'stayed') {
      setCountdownLabel(0);
    } else {
      setCountdownLabel(lastCount > 0 ? lastCount : Math.round(REDIRECT_MS / 1000));
    }

    if (options.updateUrl) {
      try {
        var url = new URL(location.href);
        url.searchParams.set('lang', lang);
        history.replaceState(null, '', url);
      } catch (e) { /* ignore */ }
    }
  }

  function showToast(message) {
    var toast = $('#toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('is-visible');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () {
      toast.classList.remove('is-visible');
    }, 4500);
  }

  function go() {
    window.clearInterval(timer);
    window.location.replace(DEST[lang]);
  }

  function tick() {
    var left = deadline - performance.now();
    if (left <= 0) {
      go();
      return;
    }
    updateCount(Math.ceil(left / 1000));
  }

  function begin() {
    state = 'running';
    body.classList.add('is-running');
    deadline = performance.now() + REDIRECT_MS;
    updateCount(Math.round(REDIRECT_MS / 1000));
    timer = window.setInterval(tick, 150);
  }

  function scrollToGateway() {
    var gateway = $('#gateway');
    if (!gateway) return;
    gateway.scrollIntoView({ behavior: reduceMotion.matches ? 'auto' : 'smooth', block: 'start' });
    var title = $('#gateway-title');
    if (title) {
      window.setTimeout(function () {
        try { title.focus({ preventScroll: true }); } catch (e) { title.focus(); }
      }, reduceMotion.matches ? 0 : 480);
    }
  }

  function stay(options) {
    options = options || {};
    if (state === 'stayed') {
      if (options.scroll) scrollToGateway();
      return;
    }
    state = 'stayed';
    window.clearInterval(timer);
    body.classList.remove('is-running');
    body.classList.add('is-stayed');
    var num = $('#countdown-num');
    if (num) num.hidden = true;
    setCountdownLabel(0);
    if (!options.silent) showToast(t('toast.stayed'));
    if (options.scroll) scrollToGateway();
  }

  /* Wire up controls */
  Array.prototype.forEach.call(document.querySelectorAll('[data-lang-btn]'), function (btn) {
    btn.addEventListener('click', function () {
      var next = btn.getAttribute('data-lang-btn');
      if (SUPPORTED.indexOf(next) === -1 || next === lang) return;
      try { localStorage.setItem(STORAGE_KEY, next); } catch (e) { /* ignore */ }
      applyLanguage(next, { updateUrl: true });
    });
  });

  var stayButton = $('#stay');
  if (stayButton) {
    stayButton.addEventListener('click', function () {
      if (state === 'stayed') { scrollToGateway(); return; }
      stay({ scroll: true });
    });
  }

  Array.prototype.forEach.call(document.querySelectorAll('[data-stay-link]'), function (link) {
    link.addEventListener('click', function () {
      if (state !== 'stayed') stay({ silent: true });
    });
  });

  window.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && state === 'running') stay();
  });

  window.addEventListener('scroll', function () {
    if (state !== 'running' || scrollCancelled) return;
    var y = window.scrollY || document.documentElement.scrollTop || 0;
    if (y > 48) {
      scrollCancelled = true;
      stay();
    }
  }, { passive: true });

  var year = $('#year');
  if (year) year.textContent = String(new Date().getFullYear());

  var params = new URLSearchParams(location.search);
  var forceStay = params.has('stay');

  applyLanguage(lang, { updateUrl: false });
  root.classList.add('i18n-ready');

  if (forceStay) {
    stay({ silent: true });
  } else {
    begin();
  }
})();
