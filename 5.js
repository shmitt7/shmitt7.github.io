(function () {
'use strict';
var _logoCache = {};
var CACHE_MAX = 200;
var GENRE_NAMES = {
28:'Экшен',12:'Приключ.',16:'Мультфильм',35:'Комедия',
80:'Криминал',99:'Докум.',18:'Драма',10751:'Семейный',
14:'Фэнтези',36:'История',27:'Ужасы',10402:'Музыка',
9648:'Детектив',10749:'Мелодрама',878:'Фантастика',10770:'ТВ-фильм',
53:'Триллер',10752:'Военный',37:'Вестерн',
10759:'Экшен',10762:'Детский',10763:'Новости',10764:'Реалити',
10765:'Фантастика',10766:'Мыльная',10767:'Ток-шоу',10768:'Военный'
};
function fmtTime(mins) {
if (!mins || mins <= 0) return '';
var h = Math.floor(mins / 60), m = mins % 60;
return h > 0 ? (h + 'ч' + (m > 0 ? ' ' + m + 'м' : '')) : (m + 'м');
}
function getGenreLabels(movie, max) {
var genres = movie.genres || [];
var result = [];
for (var i = 0; i < genres.length && result.length < (max || 2); i++) {
var g = genres[i];
var id = typeof g === 'object' ? g.id : g;
var name = GENRE_NAMES[id] || (g.name ? (g.name.charAt(0).toUpperCase() + g.name.slice(1)) : null);
if (name) result.push(name);
}
return result;
}
var style = document.createElement('style');
style.textContent = [
'body.fsc--open .full-start__background {',
'  position: fixed !important; inset: 0 !important;',
'  width: 100vw !important; height: 100vh !important;',
'  z-index: 0 !important; object-fit: cover !important;',
'  mask-image: none !important; -webkit-mask-image: none !important;',
'  pointer-events: none !important;',
'  filter: brightness(0.7) !important;',
'  opacity: 0; transition: opacity 0.5s ease-in-out;',
'}',
'body.fsc--open .full-start__background.loaded { opacity: 1 !important; }',
'body.fsc--open .full-start__background.dim { opacity: 0 !important; transition: opacity 0s !important; }',
'body.fsc--open:not(.fsc--scrolled) .background { opacity: 0 !important; transition: none !important; }',
'body.fsc--open.fsc--scrolled .background { opacity: 1 !important; transition: opacity 0.4s !important; }',
'body.fsc--open:not(.fsc--scrolled) .head { background: transparent !important; }',
'body.fsc--open .full-start-new { position: relative !important; }',
'body.fsc--open .full-start-new__body {',
'  min-height: calc(100vh - 6em) !important;',
'  align-items: stretch !important;',
'  justify-content: center !important;',
'}',
'body.fsc--open .full-start-new__right {',
'  display: flex !important; flex-direction: column !important;',
'  min-height: calc(100vh - 6em) !important;',
'  justify-content: flex-end !important;',
'  align-items: center !important; text-align: center !important;',
'  padding-bottom: 0.8em !important;',
'}',
'body.fsc--open .full-start-new__left { display: none !important; }',
'body.fsc--open .full-start-new__right > *:not(.fsc-main) { display: none !important; }',
'.fsc-main {',
'  display: flex !important; flex-direction: column !important;',
'  align-items: center !important; text-align: center !important;',
'  margin-bottom: 0.2em !important;',
'}',
'body.fsc--open .full-start-new__title {',
'  text-align: center !important; max-width: 100% !important;',
'  text-shadow: 0 2px 12px rgba(0,0,0,0.95) !important;',
'  margin-bottom: 0.15em !important;',
'  display: block !important;',
'  overflow: visible !important;',
'  -webkit-line-clamp: unset !important;',
'  line-clamp: unset !important;',
'}',
'.fsc-logo {',
'  max-width: 18em !important; max-height: 5em !important;',
'  object-fit: contain !important;',
'  margin-bottom: 0.15em !important;',
'}',
'.fsc-center-row {',
'  display: flex !important; flex-wrap: wrap !important;',
'  align-items: center !important; justify-content: center !important;',
'  gap: 0.35em !important; margin-bottom: 0.2em !important;',
'}',
'.fsc-serial-badge {',
'  display: inline-flex !important; align-items: center !important;',
'  height: 1.5em !important; padding: 0 0.5em !important;',
'  background: rgba(0,0,0,0.6) !important;',
'  color: #fff !important;',
'  font-size: 1.25em !important; font-weight: 550 !important;',
'  border-radius: 0.35em !important; white-space: nowrap !important;',
'  box-sizing: border-box !important;',
'  backdrop-filter: blur(20px) saturate(180%) !important;',
'  -webkit-backdrop-filter: blur(20px) saturate(180%) !important;',
'  border: 1px solid rgba(255,255,255,0.25) !important;',
'  margin: 0 !important;',
'  text-shadow: none !important;',
'}'
].join('\n');
document.head.appendChild(style);
function init() {
var qualityObserver = null;
var currentToken = null;
var currentFullComp = null;
var rateAnchorEl = null;
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
var movie = (e.object && (e.object.movie || e.object.card)) || {};
var right = render.find('.full-start-new__right');
var title = render.find('.full-start-new__title');
var buttons = render.find('.full-start-new__buttons');
var year = (movie.release_date || movie.first_air_date || '').slice(0, 4);
var runtime = fmtTime(movie.runtime || ((movie.episode_run_time || [])[0]));
var countries = (movie.production_countries || []).slice(0, 2).map(function (c) { return c.name || c.iso_3166_1 || ''; }).filter(Boolean);
var genres = getGenreLabels(movie, 2);
var tmdbVal = movie.vote_average && parseFloat(movie.vote_average) > 0 ? parseFloat(movie.vote_average).toFixed(1) : '';
var kpVal = movie.kp_rating && parseFloat(movie.kp_rating) > 0 ? parseFloat(movie.kp_rating).toFixed(1) : '';
var pg = render.find('.full-start__pg').not('.hide').text().trim();
var infoParts = [];
if (year) infoParts.push(year);
if (runtime) infoParts.push(runtime);
if (countries.length) infoParts.push(countries.join(', '));
if (genres.length) infoParts.push(genres.join(', '));
if (tmdbVal) infoParts.push('TMDB ' + tmdbVal);
if (kpVal) infoParts.push('KP ' + kpVal);
if (pg) infoParts.push(pg);
var infoEl = $('<span class="fsc-serial-badge"></span>').text(infoParts.join(' • '));
var serialEl = null;
if (movie.first_air_date) {
var sp = [];
var last = movie.last_episode_to_air;
var curSeas = last ? last.season_number : 0;
var totSeas = movie.number_of_seasons || 0;
var totEps = movie.number_of_episodes || 0;
var airedEps = 0;
if (movie.seasons && last) {
for (var i = 0; i < movie.seasons.length; i++) {
var s = movie.seasons[i];
if (s.season_number === 0) continue;
if (s.season_number < curSeas) airedEps += s.episode_count || 0;
else if (s.season_number === curSeas) airedEps += last.episode_number || 0;
}
}
if (totSeas) sp.push(Lampa.Lang.translate('title_seasons') + ': ' + (curSeas < totSeas ? curSeas + '/' + totSeas : totSeas));
if (totEps) sp.push(Lampa.Lang.translate('title_episodes') + ': ' + (curSeas < totSeas && airedEps ? airedEps + '/' + totEps : totEps));
var status = movie.status || '';
var hideStatuses = ['released', 'ended', 'canceled', 'cancelled'];
if (status && hideStatuses.indexOf(status.toLowerCase()) === -1) {
sp.push(Lampa.Lang.translate('tv_status_' + status.toLowerCase().replace(/ /g, '_')));
}
var hasNextEp = false;
if (movie.next_episode_to_air) {
var airStr = movie.next_episode_to_air.air_date;
if (airStr) {
var daysLeft = Math.ceil((Lampa.Utils.parseToDate(airStr).getTime() - Date.now()) / 86400000);
if (daysLeft > 0) {
hasNextEp = true;
sp.push(Lampa.Lang.translate('full_next_episode') + ': ' + Lampa.Utils.parseTime(airStr).short + ' / ' + Lampa.Lang.translate('full_episode_days_left') + ': ' + daysLeft);
}
}
if (!hasNextEp) {
var nextSeas = movie.next_episode_to_air.season_number;
var nextEp = movie.next_episode_to_air.episode_number;
var found = episodesList.filter(function (ep) { return ep.season_number === nextSeas && ep.episode_number === nextEp && ep.air_date; });
if (found.length) {
var foundAirStr = found[0].air_date;
var foundDays = Math.ceil((Lampa.Utils.parseToDate(foundAirStr).getTime() - Date.now()) / 86400000);
if (foundDays > 0) {
sp.push(Lampa.Lang.translate('full_next_episode') + ': ' + Lampa.Utils.parseTime(foundAirStr).short + ' / ' + Lampa.Lang.translate('full_episode_days_left') + ': ' + foundDays);
}
}
}
}
if (sp.length) serialEl = $('<span class="fsc-serial-badge"></span>').text(sp.join(' • '));
}
if (qualityObserver) { qualityObserver.disconnect(); qualityObserver = null; }
if (rateAnchorEl) { rateAnchorEl.remove(); rateAnchorEl = null; }
rateAnchorEl = $('<div class="full-start-new__rate-line fsc-rate-anchor" style="display:none"></div>');
render.find('.full-start-new').append(rateAnchorEl);
qualityObserver = new MutationObserver(function (mutations) {
mutations.forEach(function (m) {
m.addedNodes.forEach(function (node) {
if (node.nodeType === 1 && $(node).hasClass('quality-badge-custom')) {
var qt = $(node).text().trim();
if (qt && infoEl.text().indexOf(qt) === -1) infoEl.text(infoEl.text() + ' • ' + qt);
}
});
});
});
qualityObserver.observe(rateAnchorEl[0], { childList: true });
setTimeout(function () {
if (currentToken !== token) return;
render.find('.quality-badge-custom').each(function () {
if (!$(this).closest('.fsc-main').length) {
var qt = $(this).text().trim();
if (qt && infoEl.text().indexOf(qt) === -1) infoEl.text(infoEl.text() + ' • ' + qt);
}
});
}, 100);
var main = $('<div class="fsc-main"></div>');
main.append(title);
main.append($('<div class="fsc-center-row"></div>').append(infoEl));
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
if (rateAnchorEl) { rateAnchorEl.remove(); rateAnchorEl = null; }
var destroyedComp = e.object && e.object.activity && e.object.activity.component;
if (destroyedComp && destroyedComp.scroll) destroyedComp.scroll._fscWrapped = false;
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
