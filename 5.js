(function () {
'use strict';
var _logoCache = {};
var CACHE_MAX = 200;
var style = document.createElement('style');
style.textContent = [
'body.fsc--open .full-start__background { position: fixed !important; inset: 0 !important; width: 100vw !important; height: 100vh !important; z-index: 0 !important; object-fit: cover !important; mask-image: none !important; -webkit-mask-image: none !important; pointer-events: none !important; filter: brightness(0.7) !important; opacity: 0; transition: opacity 0.5s ease-in-out; }',
'body.fsc--open .full-start__background.loaded { opacity: 1 !important; }',
'body.fsc--open .full-start__background.dim { opacity: 0 !important; transition: opacity 0s !important; }',
'body.fsc--open:not(.fsc--scrolled) .background { opacity: 0 !important; transition: none !important; }',
'body.fsc--open.fsc--scrolled .background { opacity: 1 !important; transition: opacity 0.4s !important; }',
'body.fsc--open:not(.fsc--scrolled) .head { background: transparent !important; }',
'body.fsc--open .full-start-new { position: relative !important; }',
'body.fsc--open .full-start-new__body { min-height: calc(100vh - 6em) !important; align-items: stretch !important; justify-content: center !important; }',
'body.fsc--open .full-start-new__right { display: flex !important; flex-direction: column !important; min-height: calc(100vh - 6em) !important; justify-content: flex-end !important; align-items: center !important; text-align: center !important; padding-bottom: 0.8em !important; }',
'body.fsc--open .full-start-new__left { display: none !important; }',
'body.fsc--open .full-start-new__right > *:not(.fsc-main) { display: none !important; }',
'.fsc-main { display: flex !important; flex-direction: column !important; align-items: center !important; text-align: center !important; margin-bottom: 0.2em !important; }',
'body.fsc--open .full-start-new__title { text-align: center !important; max-width: 100% !important; text-shadow: 0 2px 12px rgba(0,0,0,0.95) !important; margin-bottom: 0.15em !important; display: block !important; overflow: visible !important; -webkit-line-clamp: unset !important; line-clamp: unset !important; }',
'.fsc-logo { max-width: 18em !important; max-height: 5em !important; object-fit: contain !important; margin-bottom: 0.15em !important; }',
'.fsc-center-row { display: flex !important; flex-wrap: wrap !important; align-items: center !important; justify-content: center !important; gap: 0.35em !important; margin-bottom: 0.2em !important; }',
'.fsc-serial-badge { display: inline-flex !important; align-items: center !important; height: 1.5em !important; padding: 0 0.5em !important; background: rgba(0,0,0,0.6) !important; color: #fff !important; font-size: 1.25em !important; font-weight: 550 !important; border-radius: 0.35em !important; white-space: nowrap !important; box-sizing: border-box !important; backdrop-filter: blur(20px) saturate(180%) !important; -webkit-backdrop-filter: blur(20px) saturate(180%) !important; border: 1px solid rgba(255,255,255,0.25) !important; margin: 0 0 0.3em 0 !important; text-shadow: none !important; }',
'body.fsc--open .full-start-new__buttons .full-start__button { height: 2.2em !important; }',
'.fsc-meta-box { position: absolute !important; bottom: 5em !important; left: 1.5em !important; z-index: 10 !important; }',
'.fsc-meta-label { background: rgba(0,0,0,0.6) !important; backdrop-filter: blur(20px) saturate(180%) !important; -webkit-backdrop-filter: blur(20px) saturate(180%) !important; border: 1px solid rgba(255,255,255,0.25) !important; border-radius: 0.5em !important; padding: 0.4em 0.7em !important; display: flex !important; flex-direction: column !important; gap: 0.25em !important; font-size: 1em !important; font-weight: 550 !important; color: #fff !important; max-width: 40vw !important; }',
'.fsc-meta-line { display: flex !important; align-items: center !important; gap: 0.35em !important; white-space: nowrap !important; }',
'.fsc-sep { opacity: 0.5 !important; }',
'.fsc-meta-label .full-start__rate { display: inline-flex !important; align-items: center !important; height: auto !important; background: none !important; border: none !important; backdrop-filter: none !important; -webkit-backdrop-filter: none !important; padding: 0 !important; font-size: 1em !important; font-weight: 600 !important; color: #fff !important; gap: 0.2em !important; box-shadow: none !important; }',
'.fsc-meta-label .full-start__rate.hide { display: none !important; }',
'.fsc-meta-label .full-start__rate > div { display: inline-flex !important; align-items: center !important; height: auto !important; width: auto !important; background: none !important; border-radius: 0 !important; font-size: 1em !important; font-weight: 600 !important; color: #fff !important; padding: 0 !important; }',
'.fsc-meta-label .full-start__pg { display: inline-flex !important; align-items: center !important; height: auto !important; background: none !important; border: none !important; backdrop-filter: none !important; -webkit-backdrop-filter: none !important; padding: 0 !important; font-size: 1em !important; font-weight: 600 !important; color: #fff !important; }',
'.fsc-meta-label .quality-badge-custom { display: inline-flex !important; align-items: center !important; height: auto !important; background: none !important; border: none !important; backdrop-filter: none !important; -webkit-backdrop-filter: none !important; padding: 0 !important; font-size: 1em !important; font-weight: 600 !important; color: #fff !important; }',
'.fsc-meta-label .reaction { display: inline-flex !important; flex-direction: row !important; align-items: center !important; height: auto !important; background: none !important; border: none !important; backdrop-filter: none !important; -webkit-backdrop-filter: none !important; padding: 0 !important; font-size: 1em !important; font-weight: 600 !important; color: #fff !important; gap: 0.2em !important; }',
'.fsc-meta-label .reaction__icon { width: 1.1em !important; height: 1.1em !important; }',
'.fsc-meta-label .reaction__count { font-size: 1em !important; font-weight: 600 !important; color: #fff !important; padding: 0 !important; }',
'.fsc-meta-label .reaction__name { display: none !important; }',
].join('\n');
document.head.appendChild(style);
var GENRE_BY_ID = {
28:'Боевик',12:'Приключения',16:'Мультфильм',35:'Комедия',80:'Криминал',
99:'Документальный',18:'Драма',10751:'Семейный',14:'Фэнтези',36:'История',
27:'Ужасы',10402:'Музыка',9648:'Детектив',10749:'Мелодрама',878:'Фантастика',
10770:'ТВ-фильм',53:'Триллер',10752:'Военный',37:'Вестерн',
10759:'Боевик и приключения',10762:'Детский',10763:'Новости',10764:'Реалити-шоу',
10765:'Фантастика и фэнтези',10766:'Мыльная опера',10767:'Ток-шоу',10768:'Война и политика'
};
function getGenreLabels(movie, max) {
var genres = movie.genres || [];
var genreIds = genres.map(function (g) { return typeof g === 'object' ? g.id : g; });
var isTv = !!movie.name;
if (genreIds.indexOf(16) !== -1 && movie.original_language === 'ja') return ['Аниме'];
if (genreIds.indexOf(10763) !== -1) return ['Новости'];
if (genreIds.indexOf(10767) !== -1) return ['Ток-шоу'];
if (genreIds.indexOf(10764) !== -1) return ['Реалити-шоу'];
if (genreIds.indexOf(99) !== -1) return ['Документальный'];
if (genreIds.indexOf(10766) !== -1) return ['Мыльная опера'];
if (genreIds[0] === 16) return [isTv ? 'Мультсериал' : 'Мультфильм'];
var result = [];
for (var i = 0; i < genreIds.length && result.length < (max || 2); i++) {
var label = GENRE_BY_ID[genreIds[i]];
if (!label) { var n = genres[i] && (genres[i].name || ''); label = n ? (n.charAt(0).toUpperCase() + n.slice(1)) : null; }
if (label) result.push(label);
}
return result;
}
function fmtTime(mins) {
if (!mins || mins <= 0) return '';
var h = Math.floor(mins / 60), m = mins % 60;
return h ? (h + 'ч' + (m ? ' ' + m + 'м' : '')) : (m + 'м');
}
function parseCountry(code) {
var map = {RU:'Россия',US:'США',GB:'Великобритания',FR:'Франция',DE:'Германия',IT:'Италия',ES:'Испания',JP:'Япония',KR:'Корея',CN:'Китай',IN:'Индия',CA:'Канада',AU:'Австралия',BR:'Бразилия',MX:'Мексика',SE:'Швеция',NO:'Норвегия',DK:'Дания',FI:'Финляндия',PL:'Польша',CZ:'Чехия',HU:'Венгрия',UA:'Украина',TR:'Турция',IR:'Иран',TH:'Таиланд',HK:'Гонконг',TW:'Тайвань',NZ:'Новая Зеландия',ZA:'ЮАР',AR:'Аргентина',BE:'Бельгия',NL:'Нидерланды',CH:'Швейцария',AT:'Австрия',PT:'Португалия',GR:'Греция',RO:'Румыния',BG:'Болгария',HR:'Хорватия',SK:'Словакия',RS:'Сербия',IL:'Израиль',EG:'Египет',NG:'Нигерия'};
return map[code] || code;
}
function parseCount(str) {
if (!str) return 0;
str = str.trim();
if (str.indexOf('K') !== -1 || str.indexOf('k') !== -1) return parseFloat(str) * 1000;
if (str.indexOf('M') !== -1 || str.indexOf('m') !== -1) return parseFloat(str) * 1000000;
return parseFloat(str) || 0;
}
function sep() { return $('<span class="fsc-sep">•</span>'); }
function init() {
var qualityObserver = null;
var kpObserver = null;
var currentToken = null;
var currentFullComp = null;
var _compData = new Map();
Lampa.Listener.follow('full', function (e) {
if (e.type !== 'complite') return;
var fullComp = e.link;
var token = {};
currentToken = token;
currentFullComp = fullComp;
var episodesList = (e.data && e.data.episodes && e.data.episodes.episodes) || [];
$('body').addClass('fsc--open');
if (!Lampa.Storage.field('card_interfice_cover')) $('body').removeClass('card--no-cover');
setTimeout(function () {
if (currentToken !== token) return;
var render = $(fullComp.render());
var movie = e.object.movie || e.object.card || {};
var right = render.find('.full-start-new__right');
var title = render.find('.full-start-new__title');
var buttons = render.find('.full-start-new__buttons');
var statusEl = render.find('.full-start__status');
var pgEl = render.find('.full-start__pg:not(.hide)');
var rateEls = render.find('.full-start__rate:not(.hide)');
var showStatus = !!(movie.status && movie.status !== 'Released' && movie.status !== 'Ended');
var hasKP = !!(movie.kp_rating && parseFloat(movie.kp_rating) > 0);
var relDate = movie.release_date || movie.first_air_date || '';
var year = relDate ? relDate.slice(0, 4) : '';
var countriesText = (movie.production_countries || []).slice(0, 2).map(function (c) {
return parseCountry(c.iso_3166_1 || c.name || '');
}).filter(Boolean).join(', ');
var genreLabels = getGenreLabels(movie, 2);
var runtime = fmtTime(movie.runtime);
var reactionItems = render.find('.full-start-new__reactions .reaction').toArray();
reactionItems.sort(function (a, b) {
return parseCount($(b).find('.reaction__count').text()) - parseCount($(a).find('.reaction__count').text());
});
var reactions = reactionItems.slice(0, 4).map(function (el) { el.style.cssText = ''; return el; });
var serialEl = null;
if (movie.first_air_date) {
var sp = [];
var last = movie.last_episode_to_air;
var totSeas = movie.number_of_seasons || 0;
var totEps = movie.number_of_episodes || 0;
var hasNextEp = false;
if (last) {
var curSeas = last.season_number || 0;
var totalAired = last.episode_number || 0;
if (curSeas && totSeas) {
var seasStr = Lampa.Lang.translate('title_seasons') + ': ';
seasStr += (curSeas < totSeas) ? curSeas + '/' + totSeas : totSeas;
sp.push(seasStr);
if (totalAired > 0 && totEps > 0) sp.push(Lampa.Lang.translate('title_episodes') + ': ' + totalAired + '/' + totEps);
else if (totEps > 0) sp.push(Lampa.Lang.translate('title_episodes') + ': ' + totEps);
} else {
if (totSeas) sp.push(Lampa.Lang.translate('title_seasons') + ': ' + totSeas);
if (totEps) sp.push(Lampa.Lang.translate('title_episodes') + ': ' + totEps);
}
} else {
if (totSeas) sp.push(Lampa.Lang.translate('title_seasons') + ': ' + totSeas);
if (totEps) sp.push(Lampa.Lang.translate('title_episodes') + ': ' + totEps);
}
var now = Date.now();
if (movie.next_episode_to_air && movie.next_episode_to_air.air_date) {
var airStr = movie.next_episode_to_air.air_date;
var daysLeft = Math.ceil((Lampa.Utils.parseToDate(airStr).getTime() - now) / 86400000);
if (daysLeft > 0) {
hasNextEp = true;
sp.push(Lampa.Lang.translate('full_next_episode') + ': ' + Lampa.Utils.parseTime(airStr).short + ' / ' + Lampa.Lang.translate('full_episode_days_left') + ': ' + daysLeft);
}
}
if (!hasNextEp && episodesList.length) {
for (var i = 0; i < episodesList.length; i++) {
if (episodesList[i].air_date && Lampa.Utils.parseToDate(episodesList[i].air_date).getTime() > now) {
var airStr2 = episodesList[i].air_date;
var daysLeft2 = Math.ceil((Lampa.Utils.parseToDate(airStr2).getTime() - now) / 86400000);
hasNextEp = true;
sp.push(Lampa.Lang.translate('full_next_episode') + ': ' + Lampa.Utils.parseTime(airStr2).short + ' / ' + Lampa.Lang.translate('full_episode_days_left') + ': ' + daysLeft2);
break;
}
}
}
if (!hasNextEp && showStatus) sp.unshift(statusEl.text());
if (sp.length) serialEl = $('<span class="fsc-serial-badge"></span>').text(sp.join(' · '));
}
var existingData = _compData.get(fullComp);
if (existingData) { existingData.metaBox.remove(); existingData.rateAnchor.remove(); }
var metaBox = $('<div class="fsc-meta-box"></div>');
var metaLabel = $('<div class="fsc-meta-label"></div>');
var line1 = $('<div class="fsc-meta-line"></div>');
if (year) line1.append($('<span></span>').text(year));
if (countriesText) { if (line1.children().length) line1.append(sep()); line1.append($('<span></span>').text(countriesText)); }
if (line1.children(':not(.fsc-sep)').length) metaLabel.append(line1);
var line2 = $('<div class="fsc-meta-line"></div>');
if (runtime) line2.append($('<span></span>').text(runtime));
genreLabels.forEach(function (g) { if (line2.children(':not(.fsc-sep)').length) line2.append(sep()); line2.append($('<span></span>').text(g)); });
if (line2.children(':not(.fsc-sep)').length) metaLabel.append(line2);
var line3 = $('<div class="fsc-meta-line fsc-rate-line"></div>');
rateEls.each(function (i) { if (i > 0) line3.append(sep()); line3.append(this); });
if (pgEl.length && pgEl.text().trim()) { if (line3.children(':not(.fsc-sep)').length) line3.append(sep()); line3.append(pgEl); }
if (line3.children(':not(.fsc-sep)').length) metaLabel.append(line3);
if (reactions.length) {
var line4 = $('<div class="fsc-meta-line"></div>');
reactions.forEach(function (r, i) { if (i > 0) line4.append(sep()); line4.append(r); });
metaLabel.append(line4);
}
metaBox.append(metaLabel);
render.find('.full-start-new').append(metaBox);
if (qualityObserver) { qualityObserver.disconnect(); qualityObserver = null; }
var rateAnchor = $('<div class="full-start-new__rate-line fsc-rate-anchor" style="display:none"></div>');
render.find('.full-start-new').append(rateAnchor);
_compData.set(fullComp, { metaBox: metaBox, rateAnchor: rateAnchor });
qualityObserver = new MutationObserver(function (mutations) {
mutations.forEach(function (m) {
m.addedNodes.forEach(function (node) {
if (node.nodeType === 1 && $(node).hasClass('quality-badge-custom')) {
node.style.cssText = '';
line3.find('.quality-badge-custom').remove();
line3.find('.fsc-quality-sep').remove();
if (line3.children(':not(.fsc-sep)').length) { var qs = sep(); qs.addClass('fsc-quality-sep'); line3.append(qs); }
line3.append(node);
if (!$.contains(metaLabel[0], line3[0])) metaLabel.append(line3);
}
});
});
});
qualityObserver.observe(rateAnchor[0], { childList: true });
setTimeout(function () {
if (currentToken !== token) return;
render.find('.quality-badge-custom').each(function () {
if (!$(this).closest('.fsc-meta-box').length) {
this.style.cssText = '';
line3.find('.quality-badge-custom').remove();
line3.find('.fsc-quality-sep').remove();
if (line3.children(':not(.fsc-sep)').length) { var qs = sep(); qs.addClass('fsc-quality-sep'); line3.append(qs); }
line3.append(this);
if (!$.contains(metaLabel[0], line3[0])) metaLabel.append(line3);
}
});
}, 100);
if (kpObserver) { kpObserver.disconnect(); kpObserver = null; }
if (!hasKP) {
var kpEl = line3.find('.rate--kp')[0];
if (kpEl) {
kpObserver = new MutationObserver(function () {
if (!$(kpEl).hasClass('hide')) {
line3.find('.rate--tmdb').addClass('hide');
kpObserver.disconnect();
kpObserver = null;
}
});
kpObserver.observe(kpEl, { attributes: true, attributeFilter: ['class'] });
}
}
var main = $('<div class="fsc-main"></div>');
main.append(title);
if (movie.first_air_date && serialEl) {
main.append($('<div class="fsc-center-row"></div>').append(serialEl));
}
if (!movie.first_air_date && movie.release_date) {
var releaseTs = Lampa.Utils.parseToDate(movie.release_date).getTime();
if (releaseTs > Date.now()) {
main.append($('<div class="fsc-center-row"></div>').append(
$('<span class="fsc-serial-badge"></span>').text('Скоро • ' + Lampa.Utils.parseTime(movie.release_date).short)
));
}
}
main.append(buttons);
right.empty();
right.append(main);
if (movie.id) {
var origHtml = title.html();
var mediaType = movie.name ? 'tv' : 'movie';
var cacheKey = mediaType + '_' + movie.id;
var applyLogo = function (src) {
var img = document.createElement('img');
img.className = 'fsc-logo';
img.onerror = function () { title.html(origHtml); };
img.src = src;
title.empty().append(img);
};
if (cacheKey in _logoCache) {
if (_logoCache[cacheKey]) applyLogo(_logoCache[cacheKey]);
} else {
$.get(
Lampa.TMDB.api(mediaType + '/' + movie.id + '/images?api_key=' + Lampa.TMDB.key() + '&language=ru&include_image_language=ru'),
function (data) {
if (currentToken !== token) return;
var logos = (data.logos || []).filter(function (l) { return l.file_path && !l.file_path.endsWith('.svg') && l.iso_639_1 === 'ru'; });
logos.sort(function (a, b) { return b.vote_average - a.vote_average; });
if (Object.keys(_logoCache).length > CACHE_MAX) _logoCache = {};
_logoCache[cacheKey] = logos.length ? Lampa.TMDB.image('t/p/w500' + logos[0].file_path) : null;
if (_logoCache[cacheKey]) applyLogo(_logoCache[cacheKey]);
}
);
}
}
if (fullComp.scroll && !fullComp.scroll._fscWrapped) {
fullComp.scroll._fscWrapped = true;
var _orig = fullComp.scroll.onScroll;
fullComp.scroll.onScroll = function (pos) {
if (_orig) _orig(pos);
$('body').toggleClass('fsc--scrolled', pos > 30);
};
}
}, 0);
});
Lampa.Listener.follow('activity', function (e) {
if (e.type === 'archive' && e.component === 'full') {
$('body').addClass('fsc--open').removeClass('fsc--scrolled');
if (!Lampa.Storage.field('card_interfice_cover')) $('body').removeClass('card--no-cover');
currentFullComp = e.object.activity.component;
}
if (e.type === 'destroy' && e.component === 'full') {
if (qualityObserver) { qualityObserver.disconnect(); qualityObserver = null; }
if (kpObserver) { kpObserver.disconnect(); kpObserver = null; }
var destroyedComp = e.object && e.object.activity && e.object.activity.component;
if (destroyedComp) {
if (destroyedComp.scroll) destroyedComp.scroll._fscWrapped = false;
_compData.delete(destroyedComp);
}
if (destroyedComp === currentFullComp) {
currentToken = null;
currentFullComp = null;
$('body').removeClass('fsc--open fsc--scrolled');
if (!Lampa.Storage.field('card_interfice_cover')) $('body').addClass('card--no-cover');
}
}
});
}
if (window.appready) init();
else Lampa.Listener.follow('app', function (e) { if (e.type === 'ready') init(); });
})();
