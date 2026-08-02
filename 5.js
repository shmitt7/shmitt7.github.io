(function() {  
  if (window.fullCardMobile) return;  
  window.fullCardMobile = true;  
  
  var logoCache = {};  
  var logoCacheSize = 0;  
  var network = new Lampa.Reguest();  
  
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
  
  function init() {  
    if (Lampa.Platform.screen('tv')) return; // только мобильные/тач-устройства  
  
    // Цвет затемнения берём из реального фона приложения:  
    // обычная (серая) тема — #1d1f20 (rgb(29,31,32)), чёрная — #000  
    var isBlack = Lampa.Storage.field('black_style');  
    var baseRgb = isBlack ? '0,0,0' : '29,31,32';  
  
    var style = document.createElement('style');  
    style.textContent = ''  
      // ---- НЕ трогаем родную геометрию постера/картинки (padding-bottom, object-fit:cover) ----  
      + 'body.fcm--open .full-start-new__poster{position:relative!important;overflow:hidden!important;}'  
  
      // ---- Затемнение отдельным слоем над картинкой, без blur, начинается ниже (меньшая высота зоны) ----  
      + 'body.fcm--open .full-start-new__poster::after{'  
        + 'content:""!important;'  
        + 'position:absolute!important;'  
        + 'left:0!important;right:0!important;bottom:0!important;'  
        + 'height:38%!important;'  
        + 'background:linear-gradient(to bottom,'  
          + 'rgba(' + baseRgb + ',0) 0%,'  
          + 'rgba(' + baseRgb + ',0.5) 55%,'  
          + 'rgba(' + baseRgb + ',1) 100%'  
        + ')!important;'  
        + 'pointer-events:none!important;'  
        + 'z-index:1!important;'  
      + '}'  
  
      // ---- Панель текста поднята выше, заходит на картинку (было -2em) ----  
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
      + '.fcm-title-text{font-size:2em;font-weight:600;line-height:1.15;text-shadow:0 2px 10px rgba(0,0,0,.9);}'  
      + '.fcm-title-text.fcm-title-split{white-space:normal;}'  
      + '.fcm-logo{max-width:16em;max-height:4.5em;object-fit:contain;}'  
      + '.fcm-tagline{font-size:1.15em;opacity:.85;text-shadow:0 2px 8px rgba(0,0,0,.9);}'  
      + '.fcm-badge{display:inline-flex;align-items:center;height:1.6em;padding:0 .55em;background:rgba(255,255,255,.08);color:#fff;font-size:1.05em;font-weight:600;border-radius:.35em;white-space:nowrap;border:1px solid rgba(255,255,255,.2);margin:.12em;}'  
      + '.fcm-react-icon{width:1em;height:1em;flex-shrink:0;}'  
      + 'body.fcm--open .full-start-new__buttons{margin-top:.6em!important;}'  
      ;  
    document.head.appendChild(style);  
  
    var currentToken = null;  
    var currentFullComp = null;  
    var fullTimer;  
  
    Lampa.Listener.follow('full', function(e) {  
      if (e.type !== 'complite') return;  
  
      var fullComp = e.link;  
      var token = {};  
      currentToken = token;  
      currentFullComp = fullComp;  
  
      $('body').addClass('fcm--open');  
  
      clearTimeout(fullTimer);  
      fullTimer = setTimeout(function() {  
        if (currentToken !== token) return;  
  
        var render = fullComp.render ? fullComp.render() : fullComp.activity.render();  
        var right = render.find('.full-start-new__right');  
        if (!right.length) return;  
  
        var movie = (e.data && e.data.movie) || {};  
        var mediaType = movie.name ? 'tv' : 'movie';  
  
        var titleEl = right.find('.full-start-new__title');  
        var taglineEl = right.find('.full--tagline');  
        var buttons = right.find('.full-start-new__buttons');  
  
        // ---------- Строка 1: название/логотип ----------  
        var rowTitle = $('<div class="fcm-row fcm-row--title"></div>');  
        var titleSpan = $('<span class="fcm-title-text"></span>');  
        rowTitle.append(titleSpan);  
  
        // ---------- Строка 2: слоган ----------  
        var rowTagline = $('<div class="fcm-row fcm-row--tagline"></div>');  
        var taglineText = (movie.tagline || '').trim();  
        if (taglineText) {  
          rowTagline.append($('<span class="fcm-tagline"></span>').text(taglineText));  
        } else {  
          rowTagline.hide();  
        }  
  
        // ---------- Строка 3: статус (сериал — всегда, фильм — только если не вышел) ----------  
        var rowStatus = $('<div class="fcm-row fcm-row--status"></div>');  
        var isTv = !!movie.name;  
        var status = movie.status || '';  
        var showStatusRow = false;  
        if (status) {  
          if (isTv) showStatusRow = true;  
          else if (status.toLowerCase() !== 'released') showStatusRow = true;  
        }  
        if (showStatusRow) {  
          rowStatus.append($('<span class="fcm-badge"></span>').text(tvStatusLabel(status)));  
        } else {  
          rowStatus.hide();  
        }  
  
        // ---------- Строка 4: год • время • страны • статус(если фильм вышел) • quality ----------  
        var relise = (movie.release_date || movie.first_air_date || '') + '';  
        var year = relise ? relise.slice(0, 4) : '';  
        var runtimeText = movie.runtime > 0 ? Lampa.Utils.secondsToTime(movie.runtime * 60, true) : '';  
        var countries = (movie.production_countries || []).slice(0, 2).map(function(c) {  
          return Lampa.Lang.translate('country_' + (c.iso_3166_1 || '').toLowerCase()) || c.name;  
        }).filter(Boolean);  
        var currentQuality = null;  
  
        var infoParts = [];  
        if (year) infoParts.push(year);  
        if (runtimeText) infoParts.push(runtimeText);  
        if (countries.length) infoParts.push(countries.join(', '));  
        if (!isTv && status && status.toLowerCase() === 'released') infoParts.push(tvStatusLabel(status));  
  
        var row4 = $('<div class="fcm-row fcm-row--info"></div>');  
        var badge4 = $('<span class="fcm-badge"></span>');  
        row4.append(badge4);  
  
        function rebuildRow4() {  
          var parts = infoParts.slice();  
          if (currentQuality) parts.push(currentQuality);  
          if (parts.length) {  
            badge4.text(parts.join(' \u2022 '));  
            row4.show();  
          } else {  
            row4.hide();  
          }  
        }  
        rebuildRow4();  
  
        // ---------- Строка 5: рейтинг • жанры • возраст ----------  
        var tmdbRating = parseFloat((movie.vote_average || 0) + '');  
        var genreLabels = getGenreLabels(movie, 2);  
        var pg = '';  
        try { pg = Lampa.TMDB.parsePG(movie) || ''; } catch (err) {}  
  
        var currentKP = null;  
        var row5 = $('<div class="fcm-row fcm-row--rate"></div>');  
        var badge5 = $('<span class="fcm-badge"></span>');  
        row5.append(badge5);  
  
        function rebuildRow5() {  
          var parts = [];  
          if (currentKP !== null && currentKP >= 1) parts.push(currentKP.toFixed(1) + ' KP');  
          else if (tmdbRating >= 1) parts.push(tmdbRating.toFixed(1) + ' TMDB');  
          if (genreLabels.length) parts.push(genreLabels.join(', '));  
          if (pg) parts.push(pg);  
          if (parts.length) {  
            badge5.text(parts.join(' \u2022 '));  
            row5.show();  
          } else {  
            row5.hide();  
          }  
        }  
        rebuildRow5();  
  
        // ---------- Строка 6: производство • бюджет • реакции ----------  
        var companies = (movie.production_companies || []).slice(0, 2).map(function(c) { return c.name; }).filter(Boolean);  
        var budgetText = formatBudget(movie.budget);  
  
        var row6 = $('<div class="fcm-row fcm-row--prod"></div>');  
        var prodParts = [];  
        if (companies.length) prodParts.push(companies.join(', '));  
        if (budgetText) prodParts.push('\u0411\u044E\u0434\u0436\u0435\u0442 ' + budgetText);  
        if (prodParts.length) row6.append($('<span class="fcm-badge"></span>').text(prodParts.join(' \u2022 ')));  
  
        var reactEl = buildReactionsEl(e.data && e.data.reactions);  
        if (reactEl) row6.append(reactEl);  
  
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
