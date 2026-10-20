/*
 * Shmitt7 Plugins — сборка в один файл
 * Модули включаются в Настройки → Плагины (изменения после перезагрузки).
 * Сторонние плагины не загружаются. Ключ Кинопоиска задаёт сам пользователь.
 * Лицензия: укажите свою перед публикацией.
 */
(function () {
    'use strict';
    if (window.shmittPlugins) return;
    window.shmittPlugins = true;
    var registry = {};
    function mod(id, fn) { registry[id] = fn; }

    mod('labels', function () {
        document.head.insertAdjacentHTML('beforeend', '<style>.card__type--movie{background:#1565C0!important;color:#fff!important}</style>');
        var allGenres = {
            28:'Боевик',12:'Приключения',35:'Комедия',80:'Криминал',
            18:'Драма',10751:'Семейный',14:'Фэнтези',36:'История',
            27:'Ужасы',10402:'Музыка',9648:'Детектив',10749:'Мелодрама',
            878:'Фантастика',10770:'Телефильм',53:'Триллер',10752:'Военный',
            37:'Вестерн',10759:'Экшен',10762:'Детский',
            10765:'НФ и Фэнтези',10768:'Война и Политика'
        };
        function getLabel(d) {
            if (!d || d.profile_path !== undefined || d.known_for_department) return '';
            var isTv = !!d.name;
            var ids = Array.isArray(d.genres) ? d.genres.map(function(g) { return (g && typeof g === 'object') ? g.id : g; }) : (d.genre_ids || []);
            var isAnimation = ids.indexOf(16) !== -1;
            if (isAnimation && d.original_language === 'ja') return 'Аниме';
            if (ids.indexOf(10763) !== -1) return 'Новости';
            if (ids.indexOf(10767) !== -1) return 'Ток-шоу';
            if (ids.indexOf(10764) !== -1) return 'Реалити-шоу';
            if (ids.indexOf(99) !== -1) return 'Документальный';
            if (ids.indexOf(10766) !== -1) return 'Мыльная опера';
            if (isAnimation) return isTv ? 'Мультсериал' : 'Мультфильм';
            return allGenres[ids[0]] || (isTv ? 'Сериал' : 'Фильм');
        }
        function createLabel(label, isTv) {
            var el = document.createElement('div');
            el.className = 'card__type ' + (isTv ? 'card__type--tv' : 'card__type--movie');
            el.textContent = label;
            return el;
        }
        function processCard(card) {
            if (!card.card_data) return;
            [].forEach.call(card.querySelectorAll('.card__type'), function(el) { if (el.textContent === 'TV') el.remove(); });
            if (card.querySelector('.card__type')) return;
            var view = card.querySelector('.card__view');
            if (!view) return;
            var label = getLabel(card.card_data);
            if (label) view.appendChild(createLabel(label, !!card.card_data.name));
        }
        var cardObserver = new MutationObserver(function(mutations) {
            for (var mi = 0; mi < mutations.length; mi++) {
                var addedNodes = mutations[mi].addedNodes;
                for (var ni = 0; ni < addedNodes.length; ni++) {
                    var node = addedNodes[ni];
                    if (node.nodeType !== 1) continue;
                    if (node.classList && node.classList.contains('card')) processCard(node);
                    if (node.querySelectorAll) [].forEach.call(node.querySelectorAll('.card'), processCard);
                }
            }
        });
        cardObserver.observe(document.body, { childList: true, subtree: true });
        [].forEach.call(document.querySelectorAll('.card'), processCard);
        Lampa.Listener.follow('full', function(e) {
            if (e.type !== 'complite' || !e.data || !e.data.movie) return;
            var poster = e.body.find('.full-start-new__poster, .full-start__poster')[0];
            if (!poster) return;
            var existing = poster.querySelector('.card__type');
            if (existing) existing.remove();
            var label = getLabel(e.data.movie);
            if (label) poster.appendChild(createLabel(label, !!e.data.movie.name));
        });
        Lampa.Listener.follow('app', function(e) { if (e.type === 'destroy') cardObserver.disconnect(); });
    });

    mod('status', function () {
        var intersectionObserver = null;
        var mutationObserver = null;
        var initialized = false;
        var statusNet = new Lampa.Reguest();
        function daysUntil(dateStr) {
            if (!dateStr) return -1;
            var today = new Date();
            today.setHours(0, 0, 0, 0);
            var target = Lampa.Utils.parseToDate(dateStr);
            return Math.round((target.getTime() - today.getTime()) / 86400000);
        }
        function formatDateLabel(dateStr) {
            if (!dateStr) return null;
            var parts = dateStr.split('-');
            if (parts.length === 1 && parts[0].length === 4) return parts[0];
            if (parts.length === 2) return parts[1] + '.' + parts[0].slice(2);
            var days = daysUntil(dateStr);
            if (days <= 0) return null;
            if (days <= 30) return 'Премьера ' + days + ' дн.';
            return parts[2] + '.' + parts[1] + '.' + parts[0].slice(2);
        }
        function formatPremiereLabel(dateStr) {
            if (!dateStr) return 'Премьера';
            var parts = dateStr.split('-');
            if (parts.length === 1 && parts[0].length === 4) return 'Премьера ' + parts[0];
            if (parts.length === 2) return 'Премьера ' + parts[1] + '.' + parts[0].slice(2);
            var days = daysUntil(dateStr);
            if (days > 0 && days <= 30) return 'Премьера ' + days + ' дн.';
            return 'Премьера ' + parts[2] + '.' + parts[1] + '.' + parts[0].slice(2);
        }
        function formatYearLabel(dateStr) {
            if (!dateStr) return null;
            return dateStr.split('-')[0];
        }
        function buildEpisodeText(info) {
            var last = info.last_episode_to_air;
            var next = info.next_episode_to_air;
            var seasons = info.seasons || [];
            if (!last) return null;
            var currentSeason = last.season_number;
            var airedTotal = 0;
            for (var i = 0; i < seasons.length; i++) {
                var season = seasons[i];
                if (season.season_number > 0 && season.season_number < currentSeason) {
                    airedTotal += season.episode_count;
                }
            }
            airedTotal += last.episode_number;
            var seasonPart = 'S' + currentSeason;
            var episodePart = 'E' + airedTotal;
            if (next) {
                var totalEpisodes = info.number_of_episodes;
                if (next.season_number > currentSeason) {
                    seasonPart += '/S' + next.season_number;
                    if (totalEpisodes && totalEpisodes > airedTotal) episodePart += '/E' + totalEpisodes;
                } else if (next.season_number === currentSeason && totalEpisodes && totalEpisodes > airedTotal) {
                    episodePart += '/E' + totalEpisodes;
                }
            }
            return seasonPart + ':' + episodePart;
        }
        function getTVLabelInfo(info) {
            var last = info.last_episode_to_air;
            var next = info.next_episode_to_air;
            var status = info.status;
            var episodeText = buildEpisodeText(info);
            if (!last) {
                if (status === 'Returning Series') {
                    var dateLabel = formatDateLabel(info.first_air_date);
                    return { text: dateLabel || 'Онгоинг', icon: '▶', color: '#00E676' };
                }
                if (status === 'In Production') {
                    return { text: formatPremiereLabel(info.first_air_date), icon: '✦', color: '#E040FB' };
                }
                if (status === 'Planned') {
                    var year = formatYearLabel(info.first_air_date);
                    return { text: 'Запланировано' + (year ? ' ' + year : ''), icon: '❱', color: '#E040FB' };
                }
                if (status === 'Ended') return { text: 'Завершён', icon: '✔', color: '#FFD740' };
                if (status === 'Canceled') return { text: 'Отменён', icon: '✘', color: '#FF5252' };
                if (status === 'Pilot') return { text: 'Пилот', icon: '✔', color: '#FFD740' };
                return null;
            }
            if (status === 'Returning Series') {
                var nextDays = (next && next.air_date) ? daysUntil(next.air_date) : 999;
                if (nextDays >= 0 && nextDays <= 8) {
                    return { text: episodeText, icon: '▶', color: '#00E676' };
                }
                return { text: episodeText, icon: '⏯︎', color: '#40C4FF' };
            }
            if (status === 'Ended') return { text: episodeText, icon: '✔', color: '#FFD740' };
            if (status === 'Canceled') return { text: episodeText, icon: '✘', color: '#FF5252' };
            if (status === 'Pilot') return { text: 'Пилот', icon: '✔', color: '#FFD740' };
            if (status === 'In Production') {
                return { text: formatPremiereLabel(info.first_air_date), icon: '✦', color: '#E040FB' };
            }
            if (status === 'Planned') {
                var year2 = formatYearLabel(info.first_air_date);
                return { text: 'Запланировано' + (year2 ? ' ' + year2 : ''), icon: '❱', color: '#E040FB' };
            }
            return { text: episodeText, icon: '⏯︎', color: '#40C4FF' };
        }
        function getMovieLabelInfo(info) {
            var status = info.status;
            var releaseDate = info.release_date;
            if (status === 'Rumored') {
                var year = formatYearLabel(releaseDate);
                return { text: 'По слухам' + (year ? ' ' + year : ''), icon: '❱', color: '#E040FB' };
            }
            if (status === 'Planned') {
                var year2 = formatYearLabel(releaseDate);
                return { text: 'Запланировано' + (year2 ? ' ' + year2 : ''), icon: '❱', color: '#E040FB' };
            }
            if (status === 'In Production') {
                return { text: formatPremiereLabel(releaseDate), icon: '✦', color: '#E040FB' };
            }
            if (status === 'Post Production') {
                return { text: formatPremiereLabel(releaseDate), icon: '✦', color: '#E040FB' };
            }
            if (status === 'Released') return null;
            if (status === 'Canceled') return { text: 'Отменён', icon: '✘', color: '#FF5252' };
            return null;
        }
        function applyLabel(cardElem, info, isTV) {
            if (cardElem._tvsDone) return;
            cardElem._tvsDone = true;
            var labelInfo = isTV ? getTVLabelInfo(info) : getMovieLabelInfo(info);
            if (!labelInfo || !labelInfo.text) return;
            var viewElem = cardElem.querySelector('.card__view');
            if (!viewElem) return;
            var label = document.createElement('div');
            label.className = 'card__status';
            var iconSpan = document.createElement('span');
            iconSpan.className = 'tvs-icon';
            iconSpan.style.color = labelInfo.color;
            iconSpan.textContent = labelInfo.icon;
            var textSpan = document.createElement('span');
            textSpan.className = 'tvs-text';
            textSpan.textContent = labelInfo.text;
            label.appendChild(iconSpan);
            label.appendChild(textSpan);
            viewElem.appendChild(label);
        }
        function isPersonCard(data) {
            return !!(data.known_for_department !== undefined || (data.profile_path && !data.poster_path && !data.backdrop_path));
        }
        function loadCardStatus(cardElem, data) {
            if (cardElem._tvsDone) return;
            if (isPersonCard(data)) return;
            var isTV = !!(data.original_name || data.first_air_date);
            if (isTV) {
                var tvNetwork = statusNet;
                tvNetwork.silent(
                    Lampa.TMDB.api('tv/' + data.id + '?api_key=' + Lampa.TMDB.key()),
                    function(resp) {
                        if (resp && resp.id) applyLabel(cardElem, resp, true);
                    },
                    function() {},
                    false,
                    { cache: { life: 1440 } }
                );
            } else if (data.release_date || data.original_title) {
                var movieNetwork = statusNet;
                movieNetwork.silent(
                    Lampa.TMDB.api('movie/' + data.id + '?api_key=' + Lampa.TMDB.key()),
                    function(resp) {
                        if (resp && resp.id) applyLabel(cardElem, resp, false);
                    },
                    function() {},
                    false,
                    { cache: { life: 1440 } }
                );
            }
        }
        function observeCard(cardElem) {
            if (cardElem._tvsAttached) return;
            cardElem._tvsAttached = true;
            if (intersectionObserver) {
                intersectionObserver.observe(cardElem);
            } else {
                var cardData = cardElem.card_data;
                if (cardData) loadCardStatus(cardElem, cardData);
            }
        }
        function initMutationObserver() {
            mutationObserver = new MutationObserver(function(mutations) {
                for (var i = 0; i < mutations.length; i++) {
                    var nodes = mutations[i].addedNodes;
                    for (var j = 0; j < nodes.length; j++) {
                        var node = nodes[j];
                        if (node.nodeType !== 1) continue;
                        if (node.classList && node.classList.contains('card')) {
                            observeCard(node);
                        }
                        if (node.querySelectorAll) {
                            var cards = node.querySelectorAll('.card');
                            for (var k = 0; k < cards.length; k++) {
                                observeCard(cards[k]);
                            }
                        }
                    }
                }
            });
            mutationObserver.observe(document.body, { childList: true, subtree: true });
        }
        function injectStyles() {
            document.head.insertAdjacentHTML('beforeend', '<style>' +
                '.card__status{' +
                    'position:absolute;' +
                    'left:-0.8em;' +
                    'top:3.5em;' +
                    'padding:0.4em 0.4em;' +
                    'background:rgba(0,0,0,0.8);' +
                    'border-radius:0.3em;' +
                    'font-size:0.8em;' +
                    'display:flex;' +
                    'align-items:baseline;' +
                    'line-height:1;' +
                    'z-index:1;' +
                    'pointer-events:none;' +
                    'white-space:nowrap;' +
                '}' +
                '.card__status .tvs-icon{' +
                    'font-size:1.2em;' +
                    'margin-right:0.3em;' +
                    'transform:translateY(0.05em);' +
                '}' +
                '.card__status .tvs-text{' +
                    'font-size:1em;' +
                    'font-weight:600;' +
                    'color:#ffffff;' +
                    'letter-spacing:0.03em;' +
                    'line-height:1;' +
                '}' +
            '</style>');
        }
        function destroy() {
            if (mutationObserver) {
                mutationObserver.disconnect();
                mutationObserver = null;
            }
            if (intersectionObserver) {
                intersectionObserver.disconnect();
                intersectionObserver = null;
            }
        }
        function init() {
            if (initialized) return;
            initialized = true;
            injectStyles();
            if (typeof IntersectionObserver !== 'undefined') {
                intersectionObserver = new IntersectionObserver(function(entries) {
                    for (var i = 0; i < entries.length; i++) {
                        var entry = entries[i];
                        if (!entry.isIntersecting) continue;
                        var cardElem = entry.target;
                        intersectionObserver.unobserve(cardElem);
                        var cardData = cardElem.card_data;
                        if (cardData) loadCardStatus(cardElem, cardData);
                    }
                }, { threshold: 0.1 });
            }
            initMutationObserver();
        }
        Lampa.Listener.follow('app', function(e) {
            if (e.type === 'ready') init();
            if (e.type === 'destroy') destroy();
        });
        if (window.appready) init();
    });

    mod('quality', function () {
        var SERVERS = ['http://jac.red', 'https://jr.maxvol.pro'];
        var RE_TS = /\b(tsrip|ts|telesync|telecine|cam|camrip|workprint|wp|scr|screener|dvdscr|dcprip)\b/i;
        var RE_TS2 = /звук\s*с\s*ts|sound\s*ts|audio\s*ts|dub\s*ts/i;
        var RE_4K = /\b(2160p|2160р|4k|uhd|4к)\b/i;
        var RE_HD = /\b(1080p|1080р|720p|720р|blu\-ray|bdrip|bdremux|web\-dl|webdl|web\-dlrip|webrip|hdtv|hdtvrip|hddvd|hddvdrip|fullhd|fhd|hd|hdrip)\b/i;
        var network = new Lampa.Reguest();
        var qualityCache = {};
        var qualityCacheSize = 0;
        var intersectionObserver = null;
        function getQuality(t) {
            if (!t) return null;
            if (RE_TS.test(t) || RE_TS2.test(t)) return 'TS';
            if (RE_4K.test(t)) return '4K';
            if (RE_HD.test(t)) return 'HD';
            return null;
        }
        function setQualityCache(key, value) {
            if (qualityCacheSize > 200) { qualityCache = {}; qualityCacheSize = 0; }
            qualityCache[key] = value;
            qualityCacheSize++;
        }
        function fetchQuality(data, callback) {
            var key = data.id ? ((data.name || data.first_air_date) ? 'tv_' : 'movie_') + data.id : null;
            if (key && qualityCache[key] !== undefined) return callback(qualityCache[key]);
            var title = data.title || data.name;
            var targetYear = parseInt((data.release_date || data.first_air_date || '').substring(0, 4)) || null;
            var i = 0, titles = [];
            function done() {
                if (!titles.length) { if (key) setQualityCache(key, null); return callback(null); }
                var ts = 0, has4K = false, hasHD = false;
                for (var ti = 0; ti < titles.length; ti++) {
                    var q = getQuality(titles[ti]);
                    if (q === 'TS') ts++;
                    else if (q === '4K') has4K = true;
                    else if (q === 'HD') hasHD = true;
                }
                var r = ts / titles.length >= 0.5 ? 'TS' : has4K ? '4K' : hasHD ? 'HD' : null;
                if (key) setQualityCache(key, r);
                callback(r);
            }
            function next() {
                if (i >= SERVERS.length) return done();
                var url = SERVERS[i] + '/api/v2.0/indexers/all/results?apikey=&Query=' + encodeURIComponent(title) + (targetYear ? '&year=' + targetYear : '');
                network.silent(url, function(res) {
                    var results = (res && res.Results) || [];
                    for (var ri = 0; ri < results.length; ri++) {
                        var r = results[ri];
                        var y = parseInt((r.info && r.info.released) || r.year);
                        var inTitle = !targetYear || (r.Title && (r.Title.includes(String(targetYear)) || r.Title.includes(String(targetYear - 1)) || r.Title.includes(String(targetYear + 1))));
                        if ((y && Math.abs(y - targetYear) <= 1) || (!y && inTitle)) titles.push(r.Title);
                    }
                    i++; next();
                }, function() { i++; next(); });
            }
            next();
        }
        function makeBadge(q, cls) {
            var b = document.createElement('div');
            b.className = cls;
            var inner = document.createElement('div');
            inner.textContent = q;
            b.appendChild(inner);
            return b;
        }
        function updateCardQuality(card, q) {
            var view = card.querySelector('.card__view');
            if (!view) return;
            var existing = card.querySelector('.card__quality');
            if (existing) {
                var inner = existing.querySelector('div');
                if (inner) inner.textContent = q;
                return;
            }
            var badge = makeBadge(q, 'card__quality');
            var bottomInfo = view.querySelector('.card__bottom-info');
            if (bottomInfo) {
                bottomInfo.insertBefore(badge, bottomInfo.firstChild);
            } else {
                view.appendChild(badge);
            }
        }
        function processCardQuality(card) {
            var d = card.card_data;
            if (!d || !d.id) return;
            fetchQuality(d, function(q) {
                if (!q) return;
                updateCardQuality(card, q);
            });
        }
        function observeCard(card) {
            if (!card.card_data || !card.card_data.id || card.dataset.qlty) return;
            card.dataset.qlty = '1';
            if (intersectionObserver) intersectionObserver.observe(card);
            else processCardQuality(card);
        }
        if (typeof IntersectionObserver !== 'undefined') {
            intersectionObserver = new IntersectionObserver(function(entries) {
                for (var ei = 0; ei < entries.length; ei++) {
                    var entry = entries[ei];
                    if (!entry.isIntersecting) continue;
                    intersectionObserver.unobserve(entry.target);
                    processCardQuality(entry.target);
                }
            }, { rootMargin: '100px' });
        }
        var cardObserver = new MutationObserver(function(mutations) {
            for (var mi = 0; mi < mutations.length; mi++) {
                var addedNodes = mutations[mi].addedNodes;
                for (var ni = 0; ni < addedNodes.length; ni++) {
                    var node = addedNodes[ni];
                    if (node.nodeType !== 1) continue;
                    if (node.classList && node.classList.contains('card')) observeCard(node);
                    [].forEach.call(node.querySelectorAll('.card'), observeCard);
                }
            }
        });
        cardObserver.observe(document.body, { childList: true, subtree: true });
        Lampa.Listener.follow('full', function(e) {
            if (e.type !== 'complite' || !e.data || !e.data.movie) return;
            fetchQuality(e.data.movie, function(q) {
                if (!q) return;
                var cont = e.object.activity.render().find('.full-start-new__rate-line, .full-start__rate-line, .full-start__tags');
                if (!cont.length) return;
                cont.find('.tag--quality').remove();
                cont[0].appendChild(makeBadge(q, 'full-start__tag tag--quality'));
            });
        });
        Lampa.Listener.follow('app', function(e) {
            if (e.type === 'ready') [].forEach.call(document.querySelectorAll('.card'), observeCard);
            if (e.type === 'destroy') {
                if (intersectionObserver) intersectionObserver.disconnect();
                cardObserver.disconnect();
            }
        });
        if (window.appready) [].forEach.call(document.querySelectorAll('.card'), observeCard);
    });

    mod('rating', function () {
        var CACHE_SUCCESS = 15 * 24 * 60 * 60 * 1000;
        var CACHE_ERROR = 24 * 60 * 60 * 1000;
        var CACHE_SEARCH = 3 * 60 * 60 * 1000;
        function kpKey() { return (Lampa.Storage.get('shp_kp_key', '') || '') + ''; }
        function cid(card) { return ((card.name || card.first_air_date) ? 'tv_' : 'movie_') + card.id; }
        var saveTimer;
        function saveCache() { clearTimeout(saveTimer); saveTimer = setTimeout(function() { Lampa.Storage.set('kp_rating', ratingCache); }, 2000); }
        var network = new Lampa.Reguest();
        var ratingCache = Lampa.Storage.cache('kp_rating', 500, {});
        document.head.insertAdjacentHTML('beforeend', '<style>.card__vote{display:flex!important;align-items:center!important}.card__vote .source--name{width:0.85em;height:1.1em;background-repeat:no-repeat;background-position:center;background-size:contain;margin-left:0.2em;flex-shrink:0;background-image:url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\'%3E%3Cpath fill=\'white\' d=\'M12.049 0C5.45 0 .104 5.373.104 12S5.45 24 12.049 24c3.928 0 7.414-1.904 9.592-4.844l-9.803-5.174l6.256 6.418h-3.559l-4.373-6.086V20.4h-2.89V3.6h2.89v6.095L14.535 3.6h3.559l-6.422 6.627l9.98-5.368C19.476 1.911 15.984 0 12.05 0zm10.924 7.133l-9.994 4.027l10.917-.713a12 12 0 0 0-.923-3.314m-10.065 5.68l10.065 4.054c.458-1.036.774-2.149.923-3.314z\'/%3E%3C/svg%3E")}</style>');
        function getCache(id, type) {
            var key = type === 'search' ? 'search_' + id : id;
            var item = ratingCache[key];
            if (!item) return null;
            var ttl = type === 'search' ? CACHE_SEARCH : item.kp === 0 ? CACHE_ERROR : CACHE_SUCCESS;
            return (Date.now() - item.timestamp) < ttl ? item : null;
        }
        function setCache(id, data, type) {
            var key = type === 'search' ? 'search_' + id : id;
            ratingCache[key] = Object.assign({}, data, { timestamp: Date.now() });
            saveCache();
        }
        function showFullRating(kp, tmdb, render) {
            $('.wait_rating', render).remove();
            if (kp > 0) $('.rate--kp', render).removeClass('hide').find('> div').eq(0).text(kp.toFixed(1));
            if (tmdb > 0) $('.rate--tmdb', render).removeClass('hide').find('> div').eq(0).text(tmdb.toFixed(1));
        }
        function updateCardVote(card, kp, tmdb) {
            var el = card.querySelector('.card__vote');
            if (!el) {
                el = document.createElement('div');
                el.className = 'card__vote';
                var view = card.querySelector('.card__view');
                if (view) view.appendChild(el);
            }
            var rating = kp > 0 ? kp : tmdb;
            if (rating > 0) {
                el.innerHTML = '<span style="display:flex;align-items:center">' + rating.toFixed(1) + (kp > 0 ? '<span class="source--name"></span>' : '') + '</span>';
                el.style.display = '';
            } else {
                el.style.display = 'none';
            }
        }
        function fetchFromKpApi(id, card, callback) {
            var tmdb = card.vote_average || 0;
            network.silent('https://kinopoiskapiunofficial.tech/api/v2.2/films/' + id,
                function(data) { var kp = data.ratingKinopoisk || 0; setCache(cid(card), { kp: kp, tmdb: tmdb }); callback(kp, tmdb); },
                function() { setCache(cid(card), { kp: 0, tmdb: tmdb }); callback(0, tmdb); },
                false,
                { timeout: 3000, headers: { 'X-API-KEY': kpKey() } }
            );
        }
        function getRatingById(id, card, callback) {
            var tmdb = card.vote_average || 0;
            network.silent('https://rating.kinopoisk.ru/' + id + '.xml',
                function(str) {
                    if (str && str.includes('<rating>')) {
                        try {
                            var kp = parseFloat($($.parseXML(str)).find('kp_rating').text()) || 0;
                            if (kp > 0) { setCache(cid(card), { kp: kp, tmdb: tmdb }); callback(kp, tmdb); return; }
                        } catch (e) {}
                    }
                    fetchFromKpApi(id, card, callback);
                },
                function() { fetchFromKpApi(id, card, callback); },
                false,
                { timeout: 1000, dataType: 'text' }
            );
        }
        function fetchRating(card, callback) {
            if (!kpKey()) { callback(0, card.vote_average || 0); return; }
            var cached = getCache(cid(card));
            if (cached) { callback(cached.kp, cached.tmdb); return; }
            var searchCached = getCache(cid(card), 'search');
            if (searchCached) { getRatingById(searchCached.kp_id, card, callback); return; }
            var year = parseInt((card.release_date || card.first_air_date || '').slice(0, 4)) || null;
            var title = card.title || card.name;
            var tmdb = card.vote_average || 0;
            var processError = function() { setCache(cid(card), { kp: 0, tmdb: tmdb }); callback(0, tmdb); };
            function searchByTitle() {
                var query = (title || '').toLowerCase().replace(/[^\wа-яё\s]/gi, ' ').replace(/\s+/g, ' ').trim();
                network.silent('https://kinopoiskapiunofficial.tech/api/v2.1/films/search-by-keyword?keyword=' + encodeURIComponent(query),
                    function(json) {
                        if (!json.films || !json.films.length) { processError(); return; }
                        var films = json.films;
                        var best = null;
                        if (year) {
                            best = films.find(function(f) { return parseInt((f.year || '').slice(0, 4)) === year; });
                            if (!best) best = films.find(function(f) { var y = parseInt((f.year || '').slice(0, 4)); return y && y > year - 3 && y < year + 3; });
                        }
                        best = best || films[0];
                        if (best) { setCache(cid(card), { kp_id: best.filmId }, 'search'); getRatingById(best.filmId, card, callback); }
                        else processError();
                    },
                    processError,
                    false,
                    { timeout: 5000, headers: { 'X-API-KEY': kpKey() } }
                );
            }
            if (card.imdb_id) {
                network.silent('https://kinopoiskapiunofficial.tech/api/v2.2/films?imdbId=' + encodeURIComponent(card.imdb_id),
                    function(data) {
                        var firstItem = data.items && data.items[0];
                        var id = (firstItem && (firstItem.kinopoiskId || firstItem.filmId)) || data.kinopoiskId || data.filmId;
                        if (id) { setCache(cid(card), { kp_id: id }, 'search'); getRatingById(id, card, callback); }
                        else searchByTitle();
                    },
                    searchByTitle,
                    false,
                    { timeout: 5000, headers: { 'X-API-KEY': kpKey() } }
                );
            } else {
                searchByTitle();
            }
        }
        var intersectionObserver = null;
        if (typeof IntersectionObserver !== 'undefined') {
            intersectionObserver = new IntersectionObserver(function(entries) {
                for (var ei = 0; ei < entries.length; ei++) {
                    var entry = entries[ei];
                    if (!entry.isIntersecting) continue;
                    intersectionObserver.unobserve(entry.target);
                    (function(target) {
                        fetchRating(target.card_data, function(kp, tmdb) { updateCardVote(target, kp, tmdb); });
                    })(entry.target);
                }
            }, { rootMargin: '100px' });
        }
        function observeCard(card) {
            if (!card.card_data || !card.card_data.id || card.dataset.kp) return;
            var data = card.card_data;
            if (!data.release_date && !data.first_air_date) return;
            card.dataset.kp = 'true';
            if (intersectionObserver) intersectionObserver.observe(card);
            else fetchRating(data, function(kp, tmdb) { updateCardVote(card, kp, tmdb); });
        }
        var cardObserver = new MutationObserver(function(mutations) {
            for (var mi = 0; mi < mutations.length; mi++) {
                var addedNodes = mutations[mi].addedNodes;
                for (var ni = 0; ni < addedNodes.length; ni++) {
                    var node = addedNodes[ni];
                    if (node.nodeType !== 1) continue;
                    if (node.classList && node.classList.contains('card')) observeCard(node);
                    if (node.querySelectorAll) [].forEach.call(node.querySelectorAll('.card'), observeCard);
                }
            }
        });
        cardObserver.observe(document.body, { childList: true, subtree: true });
        Lampa.Listener.follow('full', function(e) {
            if (e.type !== 'complite' || !e.data || !e.data.movie) return;
            var card = e.data.movie;
            if (!card.release_date && !card.first_air_date) return;
            var render = e.object.activity.render();
            var cached = getCache(cid(card));
            if (cached) { showFullRating(cached.kp, cached.tmdb, render); return; }
            if ($('.rate--kp', render).hasClass('hide') && !$('.wait_rating', render).length) {
                $('.info__rate', render).after('<div style="width:2em;margin-top:1em;margin-right:1em" class="wait_rating"><div class="broadcast__scan"><div></div></div></div>');
                fetchRating(card, function(kp, tmdb) { showFullRating(kp, tmdb, render); });
            }
        });
        Lampa.Listener.follow('app', function(e) {
            if (e.type === 'destroy') {
                if (intersectionObserver) intersectionObserver.disconnect();
                cardObserver.disconnect();
            }
        });
        [].forEach.call(document.querySelectorAll('.card'), observeCard);
    });

    mod('cards', function () {
        document.head.insertAdjacentHTML('beforeend', '<style>' +
            '.card[data-list-card]{height:auto!important}' +
            '.card[data-list-card] .card__view{margin-bottom:0!important}' +
            '.card[data-list-card] .card__title{display:none!important}' +
            '.card[data-list-card] .card__age{display:none!important}' +
            '.card[data-list-card] .card__promo{display:none!important}' +
            '.card[data-list-card] .card-watched{display:none!important}' +
            '.card[data-list-card] .card__marker{display:none!important}' +
            '.card__view{background:#1a1a1a}' +
            '.card__icons{top:0.5em!important;left:auto!important;right:0.5em!important;justify-content:flex-end!important}' +
            '.card__icons-inner{background:none!important;border-radius:0!important;flex-direction:column!important}' +
            '.card__icons-inner>.card__icon{margin-bottom:0.2em}' +
            '.card__icon{filter:drop-shadow(0 1px 4px rgba(0,0,0,1)) drop-shadow(0 0 8px rgba(0,0,0,0.9))!important}' +
            '.card__overlay{position:absolute;left:0.2em;right:0.2em;bottom:0.2em;padding:0.35em 0.35em 0.2em 0.35em;background:#3c3c3c;border-radius:0.8em;box-shadow:0 0.3em 0.6em rgba(0,0,0,0.55), 0 0.05em 0.15em rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08);z-index:1;pointer-events:none;display:flex;flex-direction:column}' +
            '.card__overlay-title{font-size:1.45em;font-weight:600;line-height:1.15;color:#fff;overflow:hidden;margin-bottom:0.1em;white-space:normal;word-break:normal;max-height:2.5em;padding-bottom:0.08em}' +
            '.card--wide .card__overlay-title{font-size:1.2em;max-height:1.4em}' +
            '.card__status-row{display:flex;align-items:baseline;margin-bottom:0.1em;line-height:1;overflow:hidden;white-space:nowrap;min-width:0}' +
            '.card__status-row:empty{display:none}' +
            '.card__status-row .card__status{position:static!important;left:auto!important;top:auto!important;bottom:auto!important;background:none!important;padding:0!important;border-radius:0!important;font-size:0.95em!important;display:flex!important;align-items:baseline!important;pointer-events:none;white-space:nowrap}' +
            '.card__status-row .card__status .tvs-icon{font-size:1.1em;margin-right:0.2em;flex-shrink:0}' +
            '.card__status-row .card__status .tvs-text{font-size:0.95em;font-weight:500;color:#fff;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex-shrink:1;min-width:0}' +
            '.card__badge{display:flex;flex-wrap:nowrap;align-items:center;line-height:1;width:100%;overflow:hidden;margin-top:auto}' +
            '.card__badge-year{font-size:0.95em;line-height:1;color:#fff;flex-shrink:0}' +
            '.card__badge-genre,.card__badge .card__type{flex:1 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-left:0.4em;color:#fff;line-height:1}' +
            '.card__badge-year+.card__badge-genre::before,.card__badge-year+.card__type::before{content:none}' +
            '.card__badge .card__type{position:static!important;top:auto!important;left:auto!important;background:none!important;padding:0!important;border-radius:0!important;font-size:0.95em!important;line-height:1!important;color:#fff!important}' +
            '.card__badge-right{display:flex;align-items:center;flex-shrink:0;margin-left:auto}' +
            '.card__badge-right>*+*{margin-left:0.4em}' +
            '.card__badge-right .card__quality{position:static!important;left:auto!important;bottom:auto!important;padding:0!important;background:none!important;color:#fff!important;font-size:1.1em!important;line-height:1!important;font-weight:500;border-radius:0!important}' +
            '.card__badge-right .card__quality>div{display:inline}' +
            '.card__badge-right .card__vote{position:static!important;right:auto!important;bottom:auto!important;background:none!important;color:#fff!important;font-size:1.1em!important;line-height:1!important;font-weight:500;padding:0!important;border-radius:0!important}' +
            '.card__status,.card__type,.card__quality,.card__vote{visibility:hidden!important}' +
            '.card__status-row .card__status,.card__badge .card__type,.card__badge-right .card__quality,.card__badge-right .card__vote{visibility:visible!important}' +
        '</style>');
        var WATCH_TIMEOUT = 8000;
        var activeChildObservers = [];
        var pendingCards = [];
        var pendingTimer = null;
        function clampTitleByChars(el, text) {
            text = text || '';
            el.textContent = text;
            if (!text) return;
            el.textContent = 'A';
            var oneLineHeight = el.scrollHeight;
            el.textContent = text;
            var maxHeight = oneLineHeight * 2 + Math.max(4, oneLineHeight * 0.12);
            if (el.scrollHeight <= maxHeight) return;
            var lo = 1, hi = text.length, best = 1;
            while (lo <= hi) {
                var mid = (lo + hi) >> 1;
                var candidate = text.slice(0, mid).replace(/\s+$/, '');
                el.textContent = candidate + '...';
                if (el.scrollHeight <= maxHeight) { best = mid; lo = mid + 1; }
                else hi = mid - 1;
            }
            el.textContent = text.slice(0, best).replace(/\s+$/, '') + '...';
        }
        function relocateExisting(view, statusRow, badge, badgeRight) {
            var status = view.querySelector('.card__status');
            var type = view.querySelector('.card__type');
            var quality = view.querySelector('.card__quality');
            var vote = view.querySelector('.card__vote');
            if (status && status.parentNode !== statusRow) statusRow.appendChild(status);
            if (type && type.parentNode !== badge) badge.insertBefore(type, badgeRight);
            if (quality && (quality.parentNode !== badgeRight || quality.nextSibling !== vote)) {
                badgeRight.insertBefore(quality, vote && vote.parentNode === badgeRight ? vote : null);
            }
            if (vote && vote.parentNode !== badgeRight) badgeRight.appendChild(vote);
        }
        function watchOverlayInjects(view, statusRow, badge, badgeRight) {
            relocateExisting(view, statusRow, badge, badgeRight);
            var watchTimer;
            var childObserver = new MutationObserver(function () {
                relocateExisting(view, statusRow, badge, badgeRight);
            });
            function stopWatching() {
                clearTimeout(watchTimer);
                childObserver.disconnect();
                var idx = activeChildObservers.indexOf(childObserver);
                if (idx !== -1) activeChildObservers.splice(idx, 1);
            }
            watchTimer = setTimeout(stopWatching, WATCH_TIMEOUT);
            childObserver.observe(view, { childList: true });
            activeChildObservers.push(childObserver);
        }
        function getTitle(card) {
            var data = card.card_data || {};
            var titleEl = card.querySelector('.card__title');
            return data.title || data.name || (titleEl ? titleEl.textContent : '') || '';
        }
        function getYear(card) {
            var data = card.card_data || {};
            var year = ((data.release_date || data.first_air_date || data.release_year || '') + '').slice(0, 4);
            if (!year) {
                var ageEl = card.querySelector('.card__age');
                if (ageEl) year = (ageEl.textContent.match(/\d{4}/) || [''])[0];
            }
            return year;
        }
        function processCard(card) {
            var view = card.querySelector('.card__view');
            if (!view || view.querySelector('.card__overlay')) return;
            var icons = card.querySelector('.card__icons');
            if (icons) {
                icons.style.cssText = 'top:0.5em;left:auto;right:0.5em;justify-content:flex-end;';
                var iconsInner = icons.querySelector('.card__icons-inner');
                if (iconsInner) iconsInner.style.cssText = 'background:none;border-radius:0;flex-direction:column;';
            }
            var overlay = document.createElement('div');
            overlay.className = 'card__overlay';
            var overlayTitle = document.createElement('div');
            overlayTitle.className = 'card__overlay-title';
            overlay.appendChild(overlayTitle);
            var statusRow = document.createElement('div');
            statusRow.className = 'card__status-row';
            overlay.appendChild(statusRow);
            var badge = document.createElement('div');
            badge.className = 'card__badge';
            var year = getYear(card);
            if (year) {
                var yearEl = document.createElement('span');
                yearEl.className = 'card__badge-year';
                yearEl.textContent = year;
                badge.appendChild(yearEl);
            }
            var badgeRight = document.createElement('div');
            badgeRight.className = 'card__badge-right';
            badge.appendChild(badgeRight);
            overlay.appendChild(badge);
            view.appendChild(overlay);
            var title = getTitle(card);
            if (title) clampTitleByChars(overlayTitle, title);
            else overlayTitle.style.display = 'none';
            watchOverlayInjects(view, statusRow, badge, badgeRight);
        }
        function observe(card) {
            if (card.dataset.listCard) return;
            card.dataset.listCard = '1';
            pendingCards.push(card);
            if (!pendingTimer) {
                pendingTimer = setTimeout(function () {
                    pendingTimer = null;
                    var batch = pendingCards;
                    pendingCards = [];
                    for (var i = 0; i < batch.length; i++) processCard(batch[i]);
                }, 30);
            }
        }
        var mutationObserver = new MutationObserver(function (mutations) {
            for (var i = 0; i < mutations.length; i++) {
                var addedNodes = mutations[i].addedNodes;
                for (var j = 0; j < addedNodes.length; j++) {
                    var node = addedNodes[j];
                    if (node.nodeType !== 1) continue;
                    if (node.classList && node.classList.contains('card')) observe(node);
                    if (node.querySelectorAll) [].forEach.call(node.querySelectorAll('.card'), observe);
                }
            }
        });
        mutationObserver.observe(document.body, { childList: true, subtree: true });
        [].forEach.call(document.querySelectorAll('.card'), observe);
        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') [].forEach.call(document.querySelectorAll('.card'), observe);
            if (e.type === 'destroy') {
                clearTimeout(pendingTimer);
                mutationObserver.disconnect();
                for (var i = 0; i < activeChildObservers.length; i++) activeChildObservers[i].disconnect();
                activeChildObservers = [];
            }
        });
    });

    mod('buttons', function () {
        var ICONS = {
            play: '<svg width="24" height="24" viewBox="0 0 48 48"><path fill="#3B82F6" d="M16.5 7.4C13 5.5 8.6 7.4 8.6 11.6v24.8c0 4.2 4.4 6.1 7.9 4.2l21.8-12.4c3.5-2 3.5-6.4 0-8.4z"/></svg>',
            '.view--torrent': '<svg width="24" height="24" viewBox="0 0 48 48"><path fill="#4caf50" d="M23.501,44.125c11.016,0,20-8.984,20-20c0-11.015-8.984-20-20-20c-11.016,0-20,8.985-20,20C3.501,35.141,12.485,44.125,23.501,44.125z"/><path fill="#fff" d="M43.252,27.114C39.718,25.992,38.055,19.625,34,11l-7,1.077c1.615,4.905,8.781,16.872,0.728,18.853C20.825,32.722,17.573,20.519,15,14l-8,2l10.178,27.081c1.991,0.67,4.112,1.044,6.323,1.044c0.982,0,1.941-0.094,2.885-0.232l-4.443-8.376c6.868,1.552,12.308-0.869,12.962-6.203c1.727,2.29,4.089,3.183,6.734,3.172C42.419,30.807,42.965,29.006,43.252,27.114z"/></svg>',
            '.view--trailer': '<svg width="24" height="24" viewBox="0 0 48 48"><path d="M47.044 12.3709C46.7726 11.3497 46.2378 10.4178 45.493 9.66822C44.7483 8.91869 43.8197 8.37791 42.8003 8.1C39.0476 7.09091 24.0476 7.09091 24.0476 7.09091C24.0476 7.09091 9.04761 7.09091 5.29488 8.1C4.27547 8.37791 3.34693 8.91869 2.60218 9.66822C1.85744 10.4178 1.32262 11.3497 1.05124 12.3709C0.0476075 16.14 0.0476074 24 0.0476074 24C0.0476074 24 0.0476075 31.86 1.05124 35.6291C1.32262 36.6503 1.85744 37.5822 2.60218 38.3318C3.34693 39.0813 4.27547 39.6221 5.29488 39.9C9.04761 40.9091 24.0476 40.9091 24.0476 40.9091C24.0476 40.9091 39.0476 40.9091 42.8003 39.9C43.8197 39.6221 44.7483 39.0813 45.493 38.3318C46.2378 37.5822 46.7726 36.6503 47.044 35.6291C48.0476 31.86 48.0476 24 48.0476 24C48.0476 24 48.0476 16.14 47.044 12.3709Z" fill="#FF0302"/><path d="M19.1385 31.1373V16.8628L31.684 24.0001L19.1385 31.1373Z" fill="#FEFEFE"/></svg>'
        };
        var renderTimer = null;
        var focusTimer = null;
        var lastBtn = null;
        function setIcon(btn, svg) {
            var old = btn.find('svg');
            if (old.length) old.replaceWith(svg);
        }
        function trackFocus(el, start) {
            el.on('hover:focus hover:hover hover:touch', function (ev) {
                start.last = ev.target;
                lastBtn = ev.target;
            });
        }
        function makeClone(src, selector, start) {
            var clon = src.clone();
            clon.removeClass('hide').addClass('selector button--extracted');
            clon.on('hover:enter', function () { src.trigger('hover:enter'); });
            trackFocus(clon, start);
            setIcon(clon, ICONS[selector]);
            return clon;
        }
        function makePlayClone(card, play, start) {
            var clon = play.clone();
            clon.removeClass('hide button--play').addClass('selector button--extracted');
            clon.off();
            trackFocus(clon, start);
            clon.on('hover:enter', function () {
                var btns = card.find('.buttons--container > .button--menu-item');
                if (!btns.length) return;
                if (btns.length === 1) { btns.trigger('hover:enter'); return; }
                var items = [];
                btns.each(function () {
                    var icon = $(this).find('svg').prop('outerHTML');
                    items.push({
                        title: $(this).text(),
                        subtitle: $(this).data('subtitle'),
                        template: icon ? 'selectbox_icon' : 'selectbox_item',
                        icon: icon,
                        btn: $(this)
                    });
                });
                Lampa.Select.show({
                    title: Lampa.Lang.translate('settings_rest_source'),
                    items: items,
                    onSelect: function (a) { a.btn.trigger('hover:enter'); },
                    onLong: function () {},
                    onBack: function () { Lampa.Controller.toggle('content'); }
                });
            });
            setIcon(clon, ICONS.play);
            return clon;
        }
        function cleanup(card) {
            card.find('.full-start-new__buttons .button--priority').remove();
        }
        function buildButtons(card, start) {
            var cont = card.find('.full-start-new__buttons');
            var play = cont.find('.button--play').not('.button--extracted').first();
            if (!cont.length || !play.length) return;
            cleanup(card);
            cont.find('.button--extracted').remove();
            var torrent = card.find('.buttons--container > .view--torrent').first();
            var trailer = card.find('.buttons--container > .view--trailer').first();
            var firstBtn = null;
            if (torrent.length && !torrent.hasClass('hide')) {
                var tclon = makeClone(torrent, '.view--torrent', start);
                play.before(tclon);
                firstBtn = tclon;
            }
            var pclone = makePlayClone(card, play, start);
            play.before(pclone);
            if (!firstBtn) firstBtn = pclone;
            if (trailer.length && !trailer.hasClass('hide')) {
                var rclon = makeClone(trailer, '.view--trailer', start);
                pclone.after(rclon);
            }
            card.find('.buttons--container > .full-start__button').not('.view--torrent, .view--trailer').filter(function () {
                return !$(this).hasClass('hide');
            }).addClass('button--menu-item');
            card.find('.buttons--container > .full-start__button').addClass('hide');
            play.addClass('hide');
            if (focusTimer) clearTimeout(focusTimer);
            focusTimer = setTimeout(function () {
                Lampa.Controller.collectionSet(cont);
                var saved = (lastBtn && $.contains(cont[0], lastBtn)) ? lastBtn : null;
                Lampa.Controller.collectionFocus(saved || firstBtn[0], cont);
            }, 50);
        }
        Lampa.Listener.follow('full', function (e) {
            if (e.type !== 'complite') return;
            var act = e.object && e.object.activity;
            if (!act) return;
            var start = e.link && e.link.items && e.link.items[0];
            var card = $(act.render());
            if (renderTimer) clearTimeout(renderTimer);
            renderTimer = setTimeout(function () {
                buildButtons(card, start || {});
            }, 100);
        });
        Lampa.Controller.listener.follow('toggle', function (e) {
            if (e.name !== 'full_start' || !lastBtn) return;
            if (focusTimer) clearTimeout(focusTimer);
            focusTimer = setTimeout(function () {
                if (!$.contains(document.body, lastBtn)) { lastBtn = null; return; }
                var cont = $(lastBtn).closest('.full-start-new__buttons');
                if (cont.length) {
                    cont.find('.button--priority').remove();
                    Lampa.Controller.collectionSet(cont);
                    Lampa.Controller.collectionFocus(lastBtn, cont);
                }
            }, 60);
        });
        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'destroy') {
                if (renderTimer) clearTimeout(renderTimer);
                if (focusTimer) clearTimeout(focusTimer);
                lastBtn = null;
            }
        });
    });

    mod('cardMobile', function () {
        var logoCache = {};
        var logoCacheSize = 0;
        function logoRank(l) { return l.iso_639_1 === 'ru' ? 0 : (l.iso_639_1 === 'en' ? 1 : 2); }
        var network = new Lampa.Reguest();
        var FORMAT_PATTERNS = [
            { sep: ': ', keep: 1 },
            { sep: ' - ', keep: 2 },
            { sep: ' \u2013', keep: 2 },
            { sep: ' \u2014', keep: 2 }
        ];
        function escapeHtml(text) {
            return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
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
                var genre = genres[i];
                if (!genre) continue;
                var name = Lampa.Utils.capitalizeFirstLetter(typeof genre === 'object' ? genre.name : genre);
                if (name && result.indexOf(name) === -1) result.push(name);
            }
            return result;
        }
        function tvStatusLabel(status) {
            return Lampa.Lang.translate('tv_status_' + status.toLowerCase().replace(/ /g, '_'));
        }
        function formatRuntime(minutesTotal) {
            if (!minutesTotal || minutesTotal <= 0) return '';
            var hours = Math.floor(minutesTotal / 60);
            var minutes = minutesTotal % 60;
            return (hours > 0 ? hours + '\u0447 ' : '') + minutes + '\u043C';
        }
        function formatBudget(budget) {
            if (!budget || budget <= 0) return '';
            if (budget >= 1000000) return Math.round(budget / 1000000) + 'm $';
            return Math.round(budget / 1000) + '\u043A $';
        }
        function buildReactionsEl(reactionsData) {
            if (!Lampa.Storage.field('card_interfice_reactions') || (window.lampa_settings && window.lampa_settings.disable_features && window.lampa_settings.disable_features.reactions)) return null;
            if (!reactionsData || !reactionsData.result || !reactionsData.result.length) return null;
            var map = {};
            reactionsData.result.forEach(function (reaction) { map[reaction.type] = reaction.counter || 0; });
            var think = map.think || 0;
            var thinkPos = Math.floor(think / 2);
            var pos = (map.fire || 0) + (map.nice || 0) + thinkPos;
            var neg = (map.bore || 0) + (map.shit || 0) + (think - thinkPos);
            if (!pos && !neg) return null;
            var posStyle = pos > neg ? 'color:#6fcf6f' : 'color:#fff';
            var negStyle = neg > pos ? 'color:#e05555' : 'color:#fff';
            var base = Lampa.Utils.protocol() + Lampa.Manifest.cub_domain + '/img/reactions/';
            var el = $('<span class="fcm-badge fcm-reactions-badge"></span>');
            el.html('<span style="display:inline-flex;align-items:center;' + posStyle + '"><img class="fcm-react-icon" src="' + base + 'fire.svg" style="margin-right:0.2em">' + Lampa.Utils.bigNumberToShort(pos) + '</span><span style="color:#fff;margin:0 0.3em">\u2022</span><span style="display:inline-flex;align-items:center;' + negStyle + '"><img class="fcm-react-icon" src="' + base + 'shit.svg" style="margin-right:0.2em">' + Lampa.Utils.bigNumberToShort(neg) + '</span>');
            return el;
        }
        var styleEl = null;
        function getInterfaceRgb() {
            var computed = getComputedStyle(document.body).backgroundColor;
            var match = computed && computed.match(/(\d+),\s*(\d+),\s*(\d+)/);
            var alpha = computed && computed.match(/rgba\(\s*\d+,\s*\d+,\s*\d+,\s*([\d.]+)/);
            if (match && !(alpha && parseFloat(alpha[1]) === 0)) return match[1] + ',' + match[2] + ',' + match[3];
            return Lampa.Storage.field('black_style') ? '0,0,0' : '29,31,32';
        }
        function applyThemeStyle(gradientPercent) {
            var baseRgb = getInterfaceRgb();
            var gp = gradientPercent || 32;
            if (!styleEl) {
                styleEl = document.createElement('style');
                document.head.appendChild(styleEl);
            }
            styleEl.textContent = 'body.fcm--open .full-start-new__poster{position:relative!important;overflow:hidden!important;padding-bottom:150%!important;background:transparent!important;}body.fcm--open .full-start-new__poster::after{content:""!important;position:absolute!important;left:0!important;right:0!important;bottom:0!important;height:' + gp + '%!important;background:linear-gradient(to bottom,rgba(' + baseRgb + ',0) 0%,rgba(' + baseRgb + ',1) 100%)!important;pointer-events:none!important;z-index:1!important;}body.fcm--open .full-start-new__right{position:relative!important;z-index:2!important;border-radius:0!important;background:transparent!important;padding-top:0.6em!important;}body.fcm--open .full-start-new__right{display:flex!important;flex-direction:column!important;align-items:center!important;text-align:center!important;}body.fcm--open .full-start-new__right>*:not(.fcm-row):not(.full-start-new__buttons){display:none!important;}.fcm-row{width:100%;display:flex;flex-wrap:wrap;align-items:center;justify-content:center;margin-bottom:.35em;}.fcm-row:empty{display:none;}.fcm-row--title{margin-bottom:.15em;}.fcm-title-text{font-size:2em;font-weight:600;line-height:1.15;text-shadow:0 2px 10px rgba(0,0,0,.9);}.fcm-title-text.fcm-title-split{white-space:normal;}.fcm-logo{max-width:16em;max-height:4.5em;object-fit:contain;}.fcm-tagline{font-size:1.15em;opacity:.85;text-shadow:0 2px 8px rgba(0,0,0,.9);}.fcm-badge{display:inline-flex;align-items:center;height:1.6em;padding:0 .55em;background:rgba(255,255,255,.08);color:#fff;font-size:1.05em;font-weight:600;border-radius:.35em;white-space:nowrap;border:1px solid rgba(255,255,255,.2);margin:.12em;}.fcm-row--next-episode .fcm-badge{max-width:92%;white-space:normal;height:auto;text-align:center;}.fcm-react-icon{width:1em;height:1em;flex-shrink:0;}body.fcm--open .full-start-new__buttons{margin-top:.6em!important;order:99!important;}';
        }
        function init() {
            if (Lampa.Platform.screen('tv')) return;
            window.lampa_settings = window.lampa_settings || {};
            window.lampa_settings.blur_poster = false;
            applyThemeStyle(32);
            Lampa.Storage.listener.follow('change', function (event) {
                if (event.name === 'black_style' || event.name === 'cub_theme') applyThemeStyle(32);
            });
            var currentToken = null;
            var currentFullComp = null;
            var fullTimer;
            Lampa.Listener.follow('full', function (e) {
                if (e.type !== 'complite') return;
                var fullComp = e.link;
                var token = {};
                currentToken = token;
                currentFullComp = fullComp;
                $('body').addClass('fcm--open');
                clearTimeout(fullTimer);
                fullTimer = setTimeout(function () {
                    if (currentToken !== token) return;
                    var render = fullComp.render ? fullComp.render() : fullComp.activity.render();
                    var right = render.find('.full-start-new__right');
                    if (!right.length) return;
                    var buttons = render.find('.full-start-new__buttons');
                    var movie = (e.data && e.data.movie) || {};
                    var mediaType = movie.name ? 'tv' : 'movie';
                    var isTv = !!movie.name;
                    var titleEl = render.find('.full-start-new__title');
                    var rowTitle = $('<div class="fcm-row fcm-row--title"></div>');
                    var titleSpan = $('<span class="fcm-title-text"></span>');
                    rowTitle.append(titleSpan);
                    var taglineText = movie.tagline || '';
                    var rowTagline = $('<div class="fcm-row fcm-row--tagline"></div>');
                    if (taglineText) {
                        rowTagline.append($('<span class="fcm-tagline"></span>').text(taglineText));
                    } else {
                        rowTagline.hide();
                    }
                    var rowStatus = $('<div class="fcm-row fcm-row--status"></div>');
                    var rowNextEpisode = $('<div class="fcm-row fcm-row--next-episode"></div>');
                    if (isTv) {
                        var lastEpisode = movie.last_episode_to_air;
                        var currentSeason = lastEpisode ? lastEpisode.season_number : 0;
                        var totalSeasons = movie.number_of_seasons || 0;
                        var totalEpisodes = movie.number_of_episodes || 0;
                        var currentEpisode = lastEpisode ? lastEpisode.episode_number : 0;
                        var airedTotal = 0;
                        if (movie.seasons && lastEpisode) {
                            for (var si = 0; si < movie.seasons.length; si++) {
                                var season = movie.seasons[si];
                                if (season.season_number > 0 && season.season_number < currentSeason) airedTotal += season.episode_count || 0;
                            }
                            airedTotal += currentEpisode;
                        }
                        var tvStatus = movie.status || '';
                        var hasNextEpisode = false;
                        var nextEpisodeText = '';
                        var nextEpisode = movie.next_episode_to_air;
                        if (nextEpisode && nextEpisode.air_date) {
                            var daysLeft = Math.ceil((Lampa.Utils.parseToDate(nextEpisode.air_date).getTime() - Date.now()) / 86400000);
                            if (daysLeft > 0) {
                                hasNextEpisode = true;
                                nextEpisodeText = Lampa.Lang.translate('full_next_episode') + ': ' + Lampa.Utils.parseTime(nextEpisode.air_date).short + ' / ' + Lampa.Lang.translate('full_episode_days_left') + ': ' + daysLeft;
                            }
                        }
                        var serialParts = [];
                        if (tvStatus && !(tvStatus === 'Returning Series' && hasNextEpisode)) serialParts.push(tvStatusLabel(tvStatus));
                        if (totalSeasons > 0) {
                            var seasonsText = (currentSeason > 0 && currentSeason < totalSeasons) ? currentSeason + '/' + totalSeasons : totalSeasons;
                            serialParts.push(Lampa.Lang.translate('title_seasons') + ': ' + seasonsText);
                        }
                        if (totalEpisodes > 0) {
                            var episodesText = (airedTotal > 0 && airedTotal < totalEpisodes) ? airedTotal + '/' + totalEpisodes : totalEpisodes;
                            serialParts.push(Lampa.Lang.translate('title_episodes') + ': ' + episodesText);
                        }
                        if (serialParts.length) {
                            rowStatus.append($('<span class="fcm-badge"></span>').text(serialParts.join(' \u2022 ')));
                        } else {
                            rowStatus.hide();
                        }
                        if (hasNextEpisode) {
                            rowNextEpisode.append($('<span class="fcm-badge"></span>').text(nextEpisodeText));
                        } else {
                            rowNextEpisode.hide();
                        }
                    } else {
                        rowNextEpisode.hide();
                        var movieStatus = movie.status || '';
                        if (movieStatus && movieStatus.toLowerCase() !== 'released') {
                            var movieParts = [tvStatusLabel(movieStatus)];
                            if (movie.release_date) movieParts.push(Lampa.Utils.parseTime(movie.release_date).short);
                            rowStatus.append($('<span class="fcm-badge"></span>').text(movieParts.join(' \u2022 ')));
                        } else {
                            rowStatus.hide();
                        }
                    }
                    var relise = (movie.release_date || movie.first_air_date || '') + '';
                    var year = relise ? relise.slice(0, 4) : '';
                    var runtimeText = movie.runtime > 0 ? formatRuntime(movie.runtime) : '';
                    var countries = (movie.production_countries || []).slice(0, 2).map(function (country) {
                        return Lampa.Lang.translate('country_' + (country.iso_3166_1 || '').toLowerCase()) || country.name;
                    }).filter(Boolean);
                    var currentQuality = null;
                    var infoParts = [];
                    if (year) infoParts.push(year);
                    if (runtimeText) infoParts.push(runtimeText);
                    if (countries.length) infoParts.push(countries.join(', '));
                    if (!isTv && movie.status && movie.status.toLowerCase() === 'released') infoParts.push(tvStatusLabel(movie.status));
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
                    var tmdbRating = parseFloat((movie.vote_average || 0) + '');
                    var genreLabels = getGenreLabels(movie, 2);
                    var currentKP = null;
                    var currentImdb = null;
                    var currentPg = null;
                    var row5 = $('<div class="fcm-row fcm-row--rate"></div>');
                    var badge5 = $('<span class="fcm-badge"></span>');
                    row5.append(badge5);
                    function rebuildRow5() {
                        var ratingParts = [];
                        if (tmdbRating >= 1) ratingParts.push(tmdbRating.toFixed(1) + ' TMDB');
                        if (currentKP !== null && currentKP >= 1) ratingParts.push(currentKP.toFixed(1) + ' KP');
                        if (currentImdb !== null && currentImdb >= 1) ratingParts.push(currentImdb.toFixed(1) + ' IMDB');
                        var parts = ratingParts.slice();
                        if (genreLabels.length) parts.push(genreLabels.join(', '));
                        if (currentPg) parts.push(currentPg);
                        if (parts.length) {
                            badge5.text(parts.join(' \u2022 '));
                            row5.show();
                        } else {
                            row5.hide();
                        }
                    }
                    rebuildRow5();
                    var companies = (movie.production_companies || []).slice(0, 2).map(function (company) { return company.name; }).filter(Boolean);
                    var budgetText = formatBudget(movie.budget);
                    var row6 = $('<div class="fcm-row fcm-row--prod"></div>');
                    var prodParts = [];
                    if (companies.length) prodParts.push(companies.join(', '));
                    if (budgetText) prodParts.push('\u0411\u044E\u0434\u0436\u0435\u0442 ' + budgetText);
                    if (prodParts.length) row6.append($('<span class="fcm-badge"></span>').text(prodParts.join(' \u2022 ')));
                    var reactEl = buildReactionsEl(e.data && e.data.reactions);
                    if (reactEl) row6.append(reactEl);
                    right.find('.fcm-row').remove();
                    right.append(rowTitle);
                    right.append(rowTagline);
                    right.append(rowStatus);
                    right.append(rowNextEpisode);
                    right.append(row4);
                    right.append(row5);
                    right.append(row6);
                    right.append(buttons);
                    requestAnimationFrame(function () {
                        if (currentToken !== token) return;
                        var posterEl = render.find('.full-start-new__poster');
                        var posterHeight = posterEl.outerHeight() || 0;
                        var contentHeight = right.outerHeight() || 0;
                        var safeGap = 12;
                        var maxLift = Math.max(posterHeight * 0.6, 0);
                        var lift = Math.min(contentHeight + safeGap, maxLift);
                        right.css('margin-top', -lift + 'px');
                        right.css('padding-bottom', '');
                        var gradientPercent = posterHeight > 0 ? Math.min(78, Math.ceil((lift / posterHeight) * 100) + 12) : 32;
                        applyThemeStyle(gradientPercent);
                    });
                    function pollEl(selector, extract, onFound, attempt) {
                        if (currentToken !== token || attempt > 30) return;
                        var el = render.find(selector);
                        if (el.length) {
                            var val = extract(el);
                            if (val !== null && val !== undefined) { onFound(val); return; }
                        }
                        setTimeout(function () { pollEl(selector, extract, onFound, attempt + 1); }, 500);
                    }
                    pollEl('.rate--kp:not(.hide)', function (el) {
                        var val = parseFloat(el.find('> div').eq(0).text().replace(',', '.'));
                        return (!isNaN(val) && val > 0) ? val : null;
                    }, function (val) { currentKP = val; rebuildRow5(); }, 0);
                    pollEl('.rate--imdb:not(.hide)', function (el) {
                        var val = parseFloat(el.find('> div').eq(0).text().replace(',', '.'));
                        return (!isNaN(val) && val > 0) ? val : null;
                    }, function (val) { currentImdb = val; rebuildRow5(); }, 0);
                    pollEl('.full-start__pg:not(.hide)', function (el) {
                        var val = el.first().text().trim();
                        return val || null;
                    }, function (val) { currentPg = val; rebuildRow5(); }, 0);
                    setTimeout(function () {
                        pollEl('.tag--quality', function (el) {
                            return el.first().text().trim() || null;
                        }, function (val) { currentQuality = val; rebuildRow4(); }, 0);
                    }, 300);
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
                            var logoUrl = Lampa.TMDB.api(mediaType + '/' + movie.id + '/images?api_key=' + Lampa.TMDB.key() + '&language=ru&include_image_language=ru,en,null');
                            network.silent(logoUrl, function (data) {
                                if (currentToken !== token) return;
                                var logos = (data.logos || []).filter(function (logo) {
                                    return logo.file_path && logo.file_path.slice(-4) !== '.svg' && (logo.iso_639_1 === 'ru' || logo.iso_639_1 === 'en' || !logo.iso_639_1);
                                });
                                logos.sort(function(a, b) { return (logoRank(a) - logoRank(b)) || (b.vote_average - a.vote_average); });
                                if (logoCacheSize > 200) { logoCache = {}; logoCacheSize = 0; }
                                logoCache[cacheKey] = logos.length ? Lampa.TMDB.image('t/p/original' + logos[0].file_path) : null;
                                logoCacheSize++;
                                if (logoCache[cacheKey]) applyLogo(logoCache[cacheKey]);
                            }, function () {}, false, { cache: { life: 1440 } });
                        }
                    }
                }, 0);
            });
            Lampa.Listener.follow('activity', function (e) {
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
        else Lampa.Listener.follow('app', function (e) { if (e.type === 'ready') init(); });
    });

    mod('cardTV', function () {
        var logoCache = {};
        var logoCacheSize = 0;
        function logoRank(l) { return l.iso_639_1 === 'ru' ? 0 : (l.iso_639_1 === 'en' ? 1 : 2); }
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
            var isTv = !!movie.name;
            var genres = movie.genres || [];
            var ids = genres.map(function(g) { return typeof g === 'object' ? g.id : g; });
            var priority = null;
            if (ids.indexOf(16) !== -1 && movie.original_language === 'ja') priority = 'Аниме';
            else if (ids.indexOf(10763) !== -1) priority = 'Новости';
            else if (ids.indexOf(10767) !== -1) priority = 'Ток-шоу';
            else if (ids.indexOf(10764) !== -1) priority = 'Реалити-шоу';
            else if (ids.indexOf(99) !== -1) priority = 'Документальный';
            else if (ids.indexOf(10766) !== -1) priority = 'Мыльная опера';
            else if (ids.indexOf(16) !== -1) priority = isTv ? 'Мультсериал' : 'Мультфильм';
            var result = [];
            if (priority) result.push(priority);
            for (var i = 0; i < genres.length && result.length < (max || 2); i++) {
                var g = genres[i];
                if (!g) continue;
                var gId = typeof g === 'object' ? g.id : g;
                if ((priority === 'Аниме' || priority === 'Мультсериал' || priority === 'Мультфильм') && gId === 16) continue;
                var name = Lampa.Utils.capitalizeFirstLetter(g.name);
                if (name && result.indexOf(name) === -1) result.push(name);
            }
            return result;
        }
        function buildReactionsEl(reactionsData) {
            if (!Lampa.Storage.field('card_interfice_reactions') || (window.lampa_settings && window.lampa_settings.disable_features && window.lampa_settings.disable_features.reactions)) return null;
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
            var el = $('<span class="fsc-serial-badge fsc-reactions-badge"></span>');
            el.html(
                '<span style="display:inline-flex;align-items:center;' + posStyle + '"><img class="fsc-react-icon" src="' + base + 'fire.svg" style="margin-right:0.2em">' + Lampa.Utils.bigNumberToShort(pos) + '</span>' +
                '<span style="color:#fff;margin:0 0.3em">\u2022</span>' +
                '<span style="display:inline-flex;align-items:center;' + negStyle + '"><img class="fsc-react-icon" src="' + base + 'shit.svg" style="margin-right:0.2em">' + Lampa.Utils.bigNumberToShort(neg) + '</span>'
            );
            return el;
        }
        function tvStatusLabel(s) {
            return Lampa.Lang.translate('tv_status_' + s.toLowerCase().replace(/ /g, '_'));
        }
        function init() {
            if (!Lampa.Platform.screen('tv')) return;
            var style = document.createElement('style');
            style.textContent = 'body.fsc--open .full-start__background{position:fixed!important;top:0!important;right:0!important;bottom:0!important;left:0!important;width:100vw!important;height:100vh!important;z-index:0!important;object-fit:cover!important;-webkit-mask-image:none!important;mask-image:none!important;pointer-events:none!important;filter:none!important;opacity:0;transition:opacity 0.5s ease-in-out;}body.fsc--open .full-start__background.loaded{opacity:0.8!important;}body.fsc--open .full-start__background.dim{opacity:0!important;transition:opacity 0s!important;}body.fsc--open:not(.fsc--scrolled) .background{opacity:0!important;transition:none!important;}body.fsc--open.fsc--scrolled .background{opacity:1!important;transition:opacity 0.4s!important;}body.fsc--open:not(.fsc--scrolled) .head{background:transparent!important;}body.fsc--open .full-start-new{position:relative!important;overflow:visible!important;}body.fsc--open .full-start-new__body{min-height:calc(100vh - 6em)!important;align-items:stretch!important;justify-content:center!important;overflow:visible!important;}body.fsc--open .full-start-new__right{display:flex!important;flex-direction:column!important;min-height:calc(100vh - 6em)!important;justify-content:flex-end!important;align-items:center!important;text-align:center!important;padding-bottom:0.8em!important;overflow:visible!important;position:relative!important;}body.fsc--open.fsc--scrolled .full-start-new__right{min-height:0!important;}body.fsc--open .full-start-new__left{display:none!important;}body.fsc--open .full-start-new__right>*:not(.fsc-main):not(.fsc-poster-fallback):not(.fsc-reactions-badge){display:none!important;}.fsc-main{display:flex!important;flex-direction:column!important;align-items:center!important;text-align:center!important;margin-bottom:0.2em!important;width:100%!important;}body.fsc--open.fsc--scrolled .fsc-main{display:none!important;}body.fsc--open .full-start-new__title{text-align:center!important;max-width:100%!important;text-shadow:0 2px 12px rgba(0,0,0,0.95)!important;margin-bottom:0.15em!important;display:block!important;overflow:hidden!important;white-space:nowrap!important;text-overflow:ellipsis!important;-webkit-line-clamp:unset!important;line-clamp:unset!important;}body.fsc--open .full-start-new__title.fsc-title-split{white-space:normal!important;text-overflow:clip!important;display:-webkit-box!important;-webkit-box-orient:vertical!important;-webkit-line-clamp:2!important;line-clamp:2!important;}.fsc-logo{max-width:18em!important;max-height:5em!important;object-fit:contain!important;}.fsc-center-row{display:flex!important;flex-wrap:wrap!important;align-items:center!important;justify-content:center!important;margin-bottom:0.2em!important;}.fsc-serial-badge{display:inline-flex!important;align-items:center!important;height:1.5em!important;padding:0 0.5em!important;background:rgba(0,0,0,0.65)!important;color:#fff!important;font-size:1.25em!important;font-weight:600!important;border-radius:0.35em!important;white-space:nowrap!important;box-sizing:border-box!important;border:1px solid rgba(255,255,255,0.2)!important;margin:0.05em!important;text-shadow:none!important;}.fsc-poster-fallback{flex:1 1 0!important;min-height:0!important;max-width:60%!important;object-fit:cover!important;object-position:center top!important;margin-bottom:0.5em!important;border-radius:1em!important;}.fsc-react-icon{width:1em!important;height:1em!important;flex-shrink:0!important;}.fsc-reactions-badge{position:absolute!important;bottom:1em!important;right:0!important;z-index:10!important;}body.fsc--open.fsc--scrolled .fsc-reactions-badge{display:none!important;}body.fsc--open .fsc-main .full-start-new__buttons{margin-top: 0.5em !important;}';
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
                $('body').addClass('fsc--open').removeClass('fsc--scrolled');
                if (!Lampa.Storage.field('card_interfice_cover')) $('body').removeClass('card--no-cover');
                clearTimeout(fullTimer);
                fullTimer = setTimeout(function() {
                    if (currentToken !== token) return;
                    var render = fullComp.render();
                    var right = render.find('.full-start-new__right');
                    var title = render.find('.full-start-new__title');
                    var buttons = render.find('.full-start-new__buttons');
                    if (!right.length || !title.length || !buttons.length) return;
                    var movie = e.data.movie || {};
                    var isTv = !!movie.first_air_date;
                    var mediaType = isTv ? 'tv' : 'movie';
                    var relDate = movie.release_date || movie.first_air_date || '';
                    var year = relDate ? relDate.slice(0, 4) : '';
                    var runtimeRaw = (movie.episode_run_time || [])[0] || movie.runtime || 0;
                    var hours = Math.floor(runtimeRaw / 60);
                    var minutes = runtimeRaw % 60;
                    var runtime = runtimeRaw ? (hours > 0 ? hours + 'ч ' : '') + minutes + 'м' : '';
                    var pg = render.find('.full-start__pg').not('.hide').text().trim();
                    var countries = (movie.production_countries || []).slice(0, 2).map(function(c) {
                        var k = 'country_' + (c.iso_3166_1 || '').toLowerCase();
                        var t = Lampa.Lang.translate(k);
                        return (t && t !== k) ? t : (c.iso_3166_1 || '');
                    }).filter(Boolean);
                    var genreLabels = getGenreLabels(movie, 2);
                    var tmdbRating = movie.vote_average ? parseFloat(movie.vote_average) : 0;
                    var infoParts = [];
                    if (year) infoParts.push(year);
                    if (runtime) infoParts.push(runtime);
                    if (countries.length) infoParts.push(countries.join(', '));
                    if (genreLabels.length) infoParts.push(genreLabels.join(', '));
                    if (pg) infoParts.push(pg);
                    var currentKP = null;
                    var currentQuality = null;
                    var infoEl = $('<span class="fsc-serial-badge"></span>');
                    function rebuildInfo() {
                        var parts = infoParts.slice();
                        if (currentKP !== null && currentKP >= 1) parts.push(currentKP.toFixed(1) + ' KP');
                        else if (tmdbRating >= 1) parts.push(tmdbRating.toFixed(1) + ' TMDB');
                        if (currentQuality) parts.push(currentQuality);
                        infoEl.text(parts.join(' \u2022 '));
                    }
                    rebuildInfo();
                    function pollEl(selector, extract, onFound, attempt) {
                        if (currentToken !== token || attempt > 30) return;
                        var el = render.find(selector);
                        if (el.length) {
                            var val = extract(el);
                            if (val !== null && val !== undefined) { onFound(val); return; }
                        }
                        setTimeout(function() { pollEl(selector, extract, onFound, attempt + 1); }, 500);
                    }
                    pollEl('.rate--kp:not(.hide)', function(el) {
                        var val = parseFloat(el.find('> div').eq(0).text().replace(',', '.'));
                        return (!isNaN(val) && val > 0) ? val : null;
                    }, function(val) { currentKP = val; rebuildInfo(); }, 0);
                    setTimeout(function() {
                        pollEl('.tag--quality', function(el) { return el.first().text().trim() || null; },
                        function(val) { currentQuality = val; rebuildInfo(); }, 0);
                    }, 300);
                    var serialEl = null;
                    if (isTv) {
                        var lastEpisode = movie.last_episode_to_air;
                        var currentSeason = lastEpisode ? lastEpisode.season_number : 0;
                        var totalSeasons = movie.number_of_seasons || 0;
                        var totalEpisodes = movie.number_of_episodes || 0;
                        var currentEpisode = lastEpisode ? lastEpisode.episode_number : 0;
                        var airedTotal = 0;
                        if (movie.seasons && lastEpisode) {
                            for (var si = 0; si < movie.seasons.length; si++) {
                                var season = movie.seasons[si];
                                if (season.season_number > 0 && season.season_number < currentSeason) airedTotal += season.episode_count || 0;
                            }
                            airedTotal += currentEpisode;
                        }
                        var tvStatus = movie.status || '';
                        var hasNextEpisode = false;
                        var nextEpisodeText = '';
                        var nextEpisode = movie.next_episode_to_air;
                        if (nextEpisode && nextEpisode.air_date) {
                            var daysLeft = Math.ceil((Lampa.Utils.parseToDate(nextEpisode.air_date).getTime() - Date.now()) / 86400000);
                            if (daysLeft > 0) {
                                hasNextEpisode = true;
                                nextEpisodeText = Lampa.Lang.translate('full_next_episode') + ': '
                                    + Lampa.Utils.parseTime(nextEpisode.air_date).short + ' / '
                                    + Lampa.Lang.translate('full_episode_days_left') + ': ' + daysLeft;
                            }
                        }
                        var serialParts = [];
                        if (tvStatus && !(tvStatus === 'Returning Series' && hasNextEpisode))
                            serialParts.push(tvStatusLabel(tvStatus));
                        if (totalSeasons > 0) {
                            var seasonsText = (currentSeason > 0 && currentSeason < totalSeasons)
                                ? currentSeason + '/' + totalSeasons
                                : totalSeasons;
                            serialParts.push(Lampa.Lang.translate('title_seasons') + ': ' + seasonsText);
                        }
                        if (totalEpisodes > 0) {
                            var episodesText = (airedTotal > 0 && airedTotal < totalEpisodes)
                                ? airedTotal + '/' + totalEpisodes
                                : totalEpisodes;
                            serialParts.push(Lampa.Lang.translate('title_episodes') + ': ' + episodesText);
                        }
                        if (hasNextEpisode) serialParts.push(nextEpisodeText);
                        if (serialParts.length) serialEl = $('<span class="fsc-serial-badge"></span>').text(serialParts.join(' \u2022 '));
                    }
                    var movieStatusEl = null;
                    if (!isTv) {
                        var movieStatus = movie.status || '';
                        if (movieStatus && movieStatus.toLowerCase() !== 'released') {
                            var movieParts = [tvStatusLabel(movieStatus)];
                            if (movie.release_date) movieParts.push(Lampa.Utils.parseTime(movie.release_date).short);
                            movieStatusEl = $('<span class="fsc-serial-badge"></span>').text(movieParts.join(' \u2022 '));
                        }
                    }
                    var reactEl = buildReactionsEl(e.data && e.data.reactions);
                    var main = $('<div class="fsc-main"></div>');
                    main.append(title);
                    if (isTv && serialEl)
                        main.append($('<div class="fsc-center-row"></div>').append(serialEl));
                    else if (!isTv && movieStatusEl)
                        main.append($('<div class="fsc-center-row"></div>').append(movieStatusEl));
                    main.append($('<div class="fsc-center-row"></div>').append(infoEl));
                    main.append(buttons);
                    right.find('.fsc-main, .fsc-reactions-badge, .fsc-poster-fallback').remove();
                    right.append(main);
                    if (reactEl) right.append(reactEl);
                    if (!movie.backdrop_path && movie.poster_path)
                        right.prepend($('<img class="fsc-poster-fallback">').attr('src', Lampa.TMDB.image('t/p/original' + movie.poster_path)));
                    if (movie.id) {
                        var rawHtml = title.html();
                        var titleText = title.text().trim();
                        var formatted = formatTitle(titleText);
                        var origHtml = formatted !== null ? formatted : rawHtml;
                        if (formatted !== null) { title.html(origHtml); title.addClass('fsc-title-split'); }
                        function applyLogo(url) {
                            title.html('<img class="fsc-logo" src="' + url + '" alt="">');
                            title.removeClass('fsc-title-split');
                        }
                        var cacheKey = mediaType + '_' + movie.id;
                        if (logoCache[cacheKey] !== undefined) {
                            if (logoCache[cacheKey]) applyLogo(logoCache[cacheKey]);
                        } else {
                            var logoUrl = Lampa.TMDB.api(mediaType + '/' + movie.id + '/images?api_key=' + Lampa.TMDB.key() + '&language=ru&include_image_language=ru,en,null');
                            network.silent(logoUrl, function(data) {
                                if (currentToken !== token) return;
                                var logos = (data.logos || []).filter(function(l) { return l.file_path && l.file_path.slice(-4) !== '.svg' && (l.iso_639_1 === 'ru' || l.iso_639_1 === 'en' || !l.iso_639_1); });
                                logos.sort(function(a, b) { return (logoRank(a) - logoRank(b)) || (b.vote_average - a.vote_average); });
                                if (logoCacheSize > 200) { logoCache = {}; logoCacheSize = 0; }
                                logoCache[cacheKey] = logos.length ? Lampa.TMDB.image('t/p/original' + logos[0].file_path) : null;
                                logoCacheSize++;
                                if (logoCache[cacheKey]) applyLogo(logoCache[cacheKey]);
                            }, function() {}, false, { cache: { life: 1440 } });
                        }
                    }
                    if (fullComp.scroll && !fullComp.scroll._fscWrapped) {
                        fullComp.scroll._fscWrapped = true;
                        var origOnScroll = fullComp.scroll.onScroll;
                        fullComp.scroll.onScroll = function(pos) {
                            if (origOnScroll) origOnScroll(pos);
                            $('body').toggleClass('fsc--scrolled', pos > 30);
                        };
                    }
                }, 0);
            });
            Lampa.Listener.follow('activity', function(e) {
                if (e.type === 'archive' && e.component === 'full') {
                    $('body').addClass('fsc--open').removeClass('fsc--scrolled');
                    if (!Lampa.Storage.field('card_interfice_cover')) $('body').removeClass('card--no-cover');
                    currentFullComp = e.object && e.object.activity && e.object.activity.component;
                }
                if (e.type === 'destroy' && e.component === 'full') {
                    clearTimeout(fullTimer);
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
        else Lampa.Listener.follow('app', function(e) { if (e.type === 'ready') init(); });
    });

    mod('menu', function () {
        function startPlugin(){
            if(!Lampa.Platform.screen('tv')) return;
            var css = [
                '.wrap__left{position:fixed!important;margin-left:0!important;padding-top:0!important;height:auto!important;border-radius:1em!important;background:#262829!important;border:2px solid rgba(255,255,255,.25)!important;transform:translate3d(-17em,0,0)!important;overflow:hidden!important}',
                'body.black--style .wrap__left{background:#000!important}',
                'body.glass--style .wrap__left{background:rgba(0,0,0,.3)!important;-webkit-backdrop-filter:blur(1.6em)!important;backdrop-filter:blur(1.6em)!important}',
                'body.glass--style-opacity--medium .wrap__left{background:rgba(20,20,20,.6)!important;-webkit-backdrop-filter:blur(1.1em)!important;backdrop-filter:blur(1.1em)!important}',
                'body.glass--style-opacity--blacked .wrap__left{background:rgba(20,20,20,.9)!important;-webkit-backdrop-filter:blur(.5em)!important;backdrop-filter:blur(.5em)!important}',
                '.wrap__left>.scroll{height:auto!important;overflow:hidden!important}',
                '.wrap__left .scroll--mask{-webkit-mask-image:none!important;mask-image:none!important}',
                '.wrap__left .scroll--mask .scroll__content{padding:0!important}',
                '.wrap__left .menu__list{padding-left:0!important}',
                'body.menu--open:not(.light--version) .wrap__left{transform:translate3d(0,0,0)!important}',
                'body.menu--open:not(.light--version) .wrap__content{transform:translate3d(0,0,0)!important}',
                'body.menu--always:not(.light--version) .wrap__left{width:5em!important;transform:translate3d(0,0,0)!important}',
                'body.menu--always.menu--open:not(.light--version) .wrap__left{width:15em!important}',
                '.settings__content,.selectbox__content{top:.5em!important;bottom:.5em!important;height:auto!important;max-height:calc(100vh - 1em)!important;border-radius:1em!important;border:2px solid rgba(255,255,255,.25)!important;overflow:hidden!important}',
                'body.black--style .settings__content,body.black--style .selectbox__content{background:#000!important}',
                'body.settings--open .settings__content,body.selectbox--open .selectbox__content{transform:translate3d(calc(-100% - .5em),0,0)!important}',
                '.settings__content .scroll--mask .scroll__content,.selectbox__content .scroll--mask .scroll__content{padding-bottom:.5em!important}',
                '.modal__content{border:2px solid rgba(255,255,255,.25)!important}',
                'body.black--style .modal__content{background:#000!important}'
            ].join('');
            var updateTimer;
            function update(){
                var fs = parseFloat(getComputedStyle(document.body).fontSize);
                var head = document.querySelector('.head');
                var headH = head ? head.getBoundingClientRect().height : 0;
                var leftEl = document.querySelector('.wrap__left');
                if(leftEl){
                    var maxH = window.innerHeight - headH - fs * 0.5;
                    leftEl.style.setProperty('top', headH + 'px', 'important');
                    leftEl.style.setProperty('left', fs + 'px', 'important');
                    leftEl.style.setProperty('max-height', maxH + 'px', 'important');
                    var ls = leftEl.querySelect
