(function() {  
  if (window.fullCardMobile) return;  
  window.fullCardMobile = true;  
  
  var logoCache = {};  
  var logoCacheSize = 0;  
  var network = new Lampa.Reguest();  
  var styleTag = null;  
  
  var FORMAT_PATTERNS = [  
    { sep: ': ', keep: 1 },  
    { sep: ' - ', keep: 2 },  
    { sep: ' \u2013', keep: 2 },  
    { sep: ' \u2014', keep: 2 }  
  ];  
  
  function escapeHtml(s) {  
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');  
  }  
  
  function formatTitle(text) {  
    if (!text || text.length <= 30) return null;  
    for (var pi = 0; pi < FORMAT_PATTERNS.length; pi++) {  
      var sep = FORMAT_PATTERNS[pi].sep;  
      var keep = FORMAT_PATTERNS[pi].keep;  
      var idx = text.indexOf(sep);  
      if (idx > 2 && idx + sep.length < text.length - 2) {  
        var part1 = text.slice(0, idx + keep);  
        var part2 = text.slice(idx + keep).replace(/^\s+/, '');  
        if (part2.length >= 3) return escapeHtml(part1) + '<br>' + escapeHtml(part2);  
      }  
    }  
    return null;  
  }  
  
  function getGenreLabels(movie, max) {  
    var genres = movie.genres || [];  
    var result = [];  
    for (var i = 0; i < genres.length && result.length < (max || 2); i++) {  
      var g = genres[i];  
      if (!g) continue;  
      var name = Lampa.Utils.capitalizeFirstLetter(typeof g === 'object' ? g.name : g);  
      if (name && result.indexOf(name) === -1) result.push(name);  
    }  
    return result;  
  }  
  
  function tvStatusLabel(s) {  
    return Lampa.Lang.translate('tv_status_' + s.toLowerCase().replace(/ /g, '_'));  
  }  
  
  function formatBudget(budget) {  
    if (!budget || budget <= 0) return '';  
    if (budget >= 1000000) return Math.round(budget / 1000000) + 'm $';  
    return Math.round(budget / 1000) + '\u043A $';  
  }  
  
  function buildReactionsEl(reactionsData) {  
    if (!Lampa.Storage.field('card_interfice_reactions') ||  
      (window.lampa_settings && window.lampa_settings.disable_features && window.lampa_settings.disable_features.reactions)) return null;  
    if (!reactionsData || !reactionsData.result || !reactionsData.result.length) return null;  
  
    var map = {};  
    reactionsData.result.forEach(function(r) { map[r.type] = r.counter || 0; });  
  
    var think = map['think'] || 0;  
    var thinkPos = Math.floor(think / 2);  
    var pos = (map['fire'] || 0) + (map['nice'] || 0) + thinkPos;  
    var neg = (map['bore'] || 0) + (map['shit'] || 0) + (think - thinkPos);  
  
    if (!pos && !neg) return null;  
  
    var posStyle = pos > neg ? 'color:#6fcf6f' : 'color:#fff';  
    var negStyle = neg > pos ? 'color:#e05555' : 'color:#fff';  
    var base = Lampa.Utils.protocol() + Lampa.Manifest.cub_domain + '/img/reactions/';  
  
    var el = $('<span class="fcm-badge fcm-reactions-badge"></span>');  
    el.html(  
      '<span style="display:inline-flex;align-items:center;' + posStyle + '"><img class="fcm-react-icon" src="' + base + 'fire.svg" style="margin-right:0.2em">' + Lampa.Utils.bigNumberToShort(pos) + '</span>' +  
      '<span style="color:#fff;margin:0 0.3em">\u2022</span>' +  
      '<span style="display:inline-flex;align-items:center;' + negStyle + '"><img class="fcm-react-icon" src="' + base + 'shit.svg" style="margin-right:0.2em">' + Lampa.Utils.bigNumberToShort(neg) + '</span>'  
    );  
    return el;  
  }  
  
  // ---------- Реальный цвет интерфейса из самой Lampa ----------  
  // Не хардкодим RGB — читаем актуальный вычисленный фон <body>.  
  // Если пользователь переключит тему (black_style / кастомная CSS-тема),  
  // тут будет уже новое значение автоматически.  
  function getInterfaceRgb() {  
    try {  
      var c = window.getComputedStyle(document.body).backgroundColor;  
      var m = c && c.match(/\d+(\.\d+)?/g);  
      if (m && m.length >= 3) return m[0] + ',' + m[1] + ',' + m[2];  
    } catch (e) {}  
    // запасной вариант — базовый фон Lampa, если что-то пошло не так  
    return Lampa.Storage.field('black_style') ? '0,0,0' : '29,31,32';  
  }  
  
  function buildStyleCss(baseRgb) {  
    return ''  
      // ---- НЕ трогаем родную геометрию постера/картинки (padding-bottom, object-fit:cover) ----  
      + 'body.fcm--open .full-start-new__poster{position:relative!important;overflow:hidden!important;}'  
  
      // ---- Затемнение отдельным слоем над картинкой: чёткий переход без "блюра", ----  
      // ---- начинается ниже, конечный цвет = реальный цвет интерфейса Lampa      ----  
      + 'body.fcm--open .full-start-new__poster::after{'  
        + 'content:""!important;'  
        + 'position:absolute!important;'  
        + 'left:0!important;right:0!important;bottom:0!important;'  
        + 'height:32%!important;'  
        + 'background:linear-gradient(to bottom,'  
          + 'rgba(' + baseRgb + ',0) 0%,'  
          + 'rgba(' + baseRgb + ',1) 100%'  
        + ')!important;'  
        + 'pointer-events:none!important;'  
        + 'z-index:1!important;'  
      + '}'  
  
      // ---- Панель текста продолжает тот же цвет — переход выглядит единым целым ----  
      + 'body.fcm--open .full-start-new__right{'  
        + 'position:relative!important;'  
        + 'z-index:2!important;'  
        + 'margin-top:-6em!important;'  
        + 'border-radius:0!important;'  
        + 'background:rgb(' + baseRgb + ')!important;'  
        + 'padding-top:0.6em!important;'  
      + '}'  
  
      + 'body.fcm--open .full-start-new__right{display:flex!important;flex-direction:column!important;align-items:center!important;text-align:center!important;}'  
      + 'body.fcm--open .full-start-new__right>*:not(.fcm-row):not(.full-start-new__buttons){display:none!important;}'  
      + '.fcm-row{width:100%;display:flex;flex-wrap:wrap;align-items:center;justify-content:center;margin-bottom:.35em;}'  
      + '.fcm-row:empty{display:none;}'  
      + '.fcm-row--title{margin-bottom:.15em;}'  
      + '.fcm-title-text{font-size:2em;font-weight:600;line-height:1.2;text-shadow:0 2px 10px rgba(0,0,0,.9);}'  
      + '.fcm-title-text.fcm-title-split{white-space:normal;}'  
      + '.fcm-logo{max-width:16em;max-height:4.5em;object-fit:contain;}'  
      + '.fcm-tagline{font-size:1.1em;opacity:.85;}'  
      + '.fcm-status{font-size:.95em;opacity:.9;}'  
      + '.fcm-badge{display:inline-flex;align-items:center;font-size:.95em;opacity:.95;}'  
      + '.fcm-badge+.fcm-badge{margin-left:.5em;}'  
      + '.fcm-row--info .fcm-badge:not(:last-child)::after,'  
      + '.fcm-row--rate .fcm-badge:not(:last-child)::after,'  
      + '.fcm-row--prod .fcm-badge:not(:last-child)::after{content:"\u2022";margin:0 .5em;opacity:.6;}'  
      + '.fcm-react-icon{width:1em;height:1em;}'  
      + '.fcm-reactions-badge{font-size:.95em;}';  
  }  
  
  function applyThemeStyle() {  
    var css = buildStyleCss(getInterfaceRgb());  
    if (!styleTag) {  
      styleTag = document.createElement('style');  
      styleTag.id = 'fcm-theme-style';  
      document.head.appendChild(styleTag);  
    }  
    styleTag.textContent = css;  
  }  
  
  function init() {  
    if (Lampa.Platform.screen('tv')) return; // только мобильные/тач-устройства  
  
    applyThemeStyle();  
  
    // Если сменится тема (чёрная/обычная, кастомная CSS-тема) — пересоберём цвет  
    Lampa.Storage.listener.follow('change', function(event) {  
      if (event.name === 'black_style' || event.name === 'cub_theme') {  
        setTimeout(applyThemeStyle, 50); // небольшая задержка, чтобы класс/CSS темы успел применится  
      }  
    });  
  
    var currentToken = null;  
    var currentFullComp = null;  
    var currentKP = null;  
    var currentQuality = null;  
    var fullTimer = null;  
  
    Lampa.Listener.follow('full', function(e) {  
      if (e.type !== 'complite') return;  
  
      var fullComp = e.object;  
      if (!fullComp || !fullComp.render) return;  
  
      var token = {};  
      currentToken = token;  
      currentKP = null;  
      currentQuality = null;  
  
      clearTimeout(fullTimer);  
      fullTimer = setTimeout(function() {  
        if (currentToken !== token) return;  
  
        var render = fullComp.render();  
        var right = render.find('.full-start-new__right');  
        if (!right.length) return;  
  
        var movie = (e.data && e.data.movie) || {};  
        var mediaType = movie.name ? 'tv' : 'movie';  
  
        var titleEl = render.find('.full-start-new__title');  
        var taglineEl = render.find('.full--tagline');  
  
        // ---------- Строка 1: Название / логотип ----------  
        var rowTitle = $('<div class="fcm-row fcm-row--title"></div>');  
        var titleSpan = $('<div class="fcm-title-text"></div>');  
        rowTitle.append(titleSpan);  
  
        // ---------- Строка 2: Слоган ----------  
        var rowTagline = $('<div class="fcm-row fcm-row--tagline"></div>');  
        var taglineText = (movie.tagline || '').trim();  
        if (taglineText) rowTagline.append($('<span class="fcm-tagline"></span>').text(taglineText));  
  
        // ---------- Строка 3: Статус (сериал — всегда, фильм — только если не вышел) ----------  
        var rowStatus = $('<div class="fcm-row fcm-row--status"></div>');  
        var isSerial = !!movie.name;  
        var status = (movie.status || '').trim();  
        if (status) {  
          var showStatusRow3 = isSerial || status.toLowerCase() !== 'released';  
          if (showStatusRow3) rowStatus.append($('<span class="fcm-status"></span>').text(tvStatusLabel(status)));  
        }  
  
        // ---------- Строка 4: Год • Время • Страны • Статус(для фильма, если вышел) • Quality ----------  
        var row4 = $('<div class="fcm-row fcm-row--info"></div>');  
        function rebuildRow4() {  
          row4.empty();  
          var parts = [];  
  
          var relise = (movie.release_date || movie.first_air_date || '') + '';  
          var year = relise ? relise.slice(0, 4) : '';  
          if (year) parts.push(year);  
  
          if (movie.runtime > 0) {  
            var h = Math.floor(movie.runtime / 60);  
            var m = movie.runtime % 60;  
            parts.push((h ? h + '\u0447' : '') + m + '\u043C');  
          }  
  
          var countries = (movie.production_countries || []).slice(0, 2).map(function(c) {  
            return Lampa.Lang.translate('country_' + (c.iso_3166_1 || '').toLowerCase()) || c.name;  
          }).filter(Boolean);  
          if (countries.length) parts.push(countries.join(', '));  
  
          if (!isSerial && status && status.toLowerCase() === 'released') {  
            parts.push(tvStatusLabel(status));  
          }  
  
          if (currentQuality) parts.push(currentQuality);  
  
          parts.forEach(function(p) { row4.append($('<span class="fcm-badge"></span>').text(p)); });  
        }  
        rebuildRow4();  
  
        // ---------- Строка 5: Рейтинг (KP приоритетнее) • Жанры • PG ----------  
        var row5 = $('<div class="fcm-row fcm-row--rate"></div>');  
        function rebuildRow5() {  
          row5.empty();  
          var parts = [];  
  
          var rating = currentKP ? (currentKP + ' KP') : (movie.vote_average ? parseFloat(movie.vote_average).toFixed(1) + ' TMDB' : '');  
          if (rating) parts.push(rating);  
  
          var genres = getGenreLabels(movie, 2);  
          if (genres.length) parts.push(genres.join(', '));  
  
          var pg = render.find('.full-start__pg').text().trim();  
          if (pg) parts.push(pg);  
  
          parts.forEach(function(p) { row5.append($('<span class="fcm-badge"></span>').text(p)); });  
        }  
        rebuildRow5();  
  
        // ---------- Строка 6: Производство • Бюджет • Реакции ----------  
        var companies = (movie.production_companies || []).slice(0, 2).map(function(c) { return c.name; }).filter(Boolean);  
        var budgetText = formatBudget(movie.budget);  
  
        var row6 = $('<div class="fcm-row fcm-row--prod"></div>');  
        var prodParts = [];  
        if (companies.length) prodParts.push(companies.join(', '));  
        if (budgetText) prodParts.push('\u0411\u044E\u0434\u0436\u0435\u0442 ' + budgetText);  
        if (prodParts.length) row6.append($('<span class="fcm-badge"></span>').text(prodParts.join(' \u2022 ')));  
  
        var reactEl = buildReactionsEl(e.data && e.data.reactions);  
        if (reactEl) row6.append(reactEl);  
  
        // ---------- Строка 7: Кнопки ----------  
        var buttons = render.find('.full-start-new__buttons');  
  
        // ---------- Сборка ----------  
        right.find('.fcm-row').remove();  
        right.append(rowTitle);  
        right.append(rowTagline);  
        right.append(rowStatus);  
        right.append(row4);  
        right.append(row5);  
        right.append(row6);  
        right.append(buttons);  
  
        // polling KP  
        function pollEl(selector, extract, onFound, attempt) {  
          if (currentToken !== token || attempt > 30) return;  
          var el = render.find(selector);  
          if (el.length) {  
            var val = extract(el);  
            if (val !== null && val !== undefined) onFound(val);  
          } else {  
            setTimeout(function() { pollEl(selector, extract, onFound, attempt + 1); }, 500);  
          }  
        }  
  
        pollEl('.rate--kp:not(.hide)', function(el) {  
          var val = parseFloat(el.find('> div').eq(0).text().replace(',', '.'));  
          return (!isNaN(val) && val > 0) ? val : null;  
        }, function(val) { currentKP = val; rebuildRow5(); }, 0);  
  
        setTimeout(function() {  
          pollEl('.tag--quality', function(el) {  
            return el.first().text().trim() || null;  
          }, function(val) { currentQuality = val; rebuildRow4(); }, 0);  
        }, 300);  
  
        // Название / логотип  
        if (movie.id) {  
          var rawText = titleEl.text().trim();  
          var formatted = formatTitle(rawText);  
          if (formatted !== null) {  
            titleSpan.html(formatted);  
            titleSpan.addClass('fcm-title-split');  
          } else {  
            titleSpan.text(rawText);  
          }  
  
          function applyLogo(url) {  
            titleSpan.html('<img class="fcm-logo" src="' + url + '" alt="">');  
            titleSpan.removeClass('fcm-title-split');  
          }  
  
          var cacheKey = mediaType + '_' + movie.id;  
          if (logoCache[cacheKey] !== undefined) {  
            if (logoCache[cacheKey]) applyLogo(logoCache[cacheKey]);  
          } else {  
            var logoUrl = Lampa.TMDB.api(mediaType + '/' + movie.id + '/images?api_key=' + Lampa.TMDB.key() + '&language=ru&include_image_language=ru');  
            network.silent(logoUrl, function(data) {  
              if (currentToken !== token) return;  
              var logos = (data.logos || []).filter(function(l) {  
                return l.file_path && l.file_path.slice(-4) !== '.svg' && l.iso_639_1 === 'ru';  
              });  
              logos.sort(function(a, b) { return b.vote_average - a.vote_average; });  
              if (logoCacheSize > 200) { logoCache = {}; logoCacheSize = 0; }  
              logoCache[cacheKey] = logos.length ? Lampa.TMDB.image('t/p/original' + logos[0].file_path) : null;  
              logoCacheSize++;  
              if (logoCache[cacheKey]) applyLogo(logoCache[cacheKey]);  
            }, function() {}, false, { cache: { life: 1440 } });  
          }  
        }  
      }, 0);  
    });  
  
    Lampa.Listener.follow('activity', function(e) {  
      if (e.type === 'archive' && e.component === 'full') {  
        $('body').addClass('fcm--open');  
        applyThemeStyle(); // на случай, если тема сменилась пока карточка была закрыта  
        currentFullComp = e.object && e.object.activity && e.object.activity.component;  
      }  
      if (e.type === 'destroy' && e.component === 'full') {  
        clearTimeout(fullTimer);  
        var destroyedComp = e.object && e.object.activity && e.object.activity.component;  
        if (destroyedComp === currentFullComp) {  
          currentToken = null;  
          currentFullComp = null;  
          $('body').removeClass('fcm--open');  
        }  
      }  
    });  
  }  
  
  if (window.appready) init();  
  else Lampa.Listener.follow('app', function(e) { if (e.type === 'ready') init(); });  
})();
