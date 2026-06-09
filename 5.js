(function () {
    'use strict';

    var _logoCache = {};
    var CACHE_MAX = 200;

    var GENRE_LABELS = {
        28:'Боевик', 12:'Приключения', 35:'Комедия', 80:'Криминал',
        18:'Драма', 10751:'Семейный', 14:'Фэнтези', 36:'История',
        27:'Ужасы', 10402:'Музыка', 9648:'Детектив', 10749:'Мелодрама',
        878:'Фантастика', 10770:'Телефильм', 53:'Триллер', 10752:'Военный',
        37:'Вестерн', 10759:'Экшен', 10762:'Детский', 10765:'НФ и Фэнтези',
        10768:'Война и Политика'
    };

    function fmtTime(mins) {
        if (!mins || mins <= 0) return '';
        var h = Math.floor(mins / 60), m = mins % 60;
        return h > 0 ? (h + 'ч' + (m > 0 ? ' ' + m + 'м' : '')) : (m + 'м');
    }

    // Исправление 1: перевод стран через Lampa.Lang
    function parseCountry(iso) {
        if (!iso) return '';
        var key = 'country_' + iso.toLowerCase();
        var t = Lampa.Lang.translate(key);
        return (t && t !== key) ? t : iso;
    }

    function getGenreLabels(movie, max) {
        var isTv = !!movie.name;
        var genres = movie.genres || [];
        var ids = genres.map(function(g) {
            return typeof g === 'object' ? (g.id !== undefined ? g.id : g) : g;
        });

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

        for (var i = 0; i < ids.length && result.length < (max || 2); i++) {
            var label = GENRE_LABELS[ids[i]];
            if (!label) {
                var n = genres[i] && (genres[i].name || '');
                label = n ? (n.charAt(0).toUpperCase() + n.slice(1)) : null;
            }
            if (label && result.indexOf(label) === -1) result.push(label);
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
        var currentToken = null;
        var currentFullComp = null;
        var kpObs = null;

        Lampa.Listener.follow('full', function (e) {
            if (e.type !== 'complite') return;

            var fullComp = e.link;
            var token = {};
            currentToken = token;
            currentFullComp = fullComp;

            var episodesList = (e.data && e.data.episodes && e.data.episodes.episodes) || null;

            $('body').addClass('fsc--open').removeClass('fsc--scrolled');
            if (!Lampa.Storage.field('card_interfice_cover')) $('body').removeClass('card--no-cover');

            setTimeout(function () {
                if (currentToken !== token) return;

                // Сбрасываем предыдущий KP observer
                if (kpObs) { kpObs.disconnect(); kpObs = null; }

                var render = $(fullComp.render());
                var movie = (e.data && e.data.movie) || (e.object && (e.object.movie || e.object.card)) || {};
                var right = render.find('.full-start-new__right');
                var title = render.find('.full-start-new__title');
                var buttons = render.find('.full-start-new__buttons');

                // ── Строка инфы ──
                var relDate = movie.release_date || movie.first_air_date || '';
                var year = relDate ? relDate.slice(0, 4) : '';
                var runtime = movie.first_air_date
                    ? fmtTime((movie.episode_run_time || [])[0])
                    : fmtTime(movie.runtime);

                // Исправление 1: страны через Lampa.Lang.translate('country_XX')
                var countries = (movie.production_countries || []).slice(0, 2).map(function(c) {
                    return parseCountry(c.iso_3166_1 || '') || c.name || '';
                }).filter(Boolean);

                var genreLabels = getGenreLabels(movie, 2);
                var tmdbRating = movie.vote_average ? parseFloat(movie.vote_average) : 0;
                var pg = render.find('.full-start__pg').not('.hide').text().trim();

                var infoParts = [];
                if (year) infoParts.push(year);
                if (runtime) infoParts.push(runtime);
                if (countries.length) infoParts.push(countries.join(', '));
                if (genreLabels.length) infoParts.push(genreLabels.join(', '));

                // Исправление 2: рейтинг — изначально TMDB, заменяется на KP через observer
                var currentRating = tmdbRating > 0 ? 'TMDB ' + tmdbRating.toFixed(1) : '';
                var currentQuality = '';
                var infoEl = $('<span class="fsc-serial-badge"></span>');

                function rebuildInfo() {
                    var p = infoParts.slice();
                    if (currentRating) p.push(currentRating);
                    if (pg) p.push(pg);
                    if (currentQuality) p.push(currentQuality);
                    infoEl.text(p.join(' • '));
                }
                rebuildInfo();

                // Наблюдаем за DOM-элементом .rate--kp (обновляется плагином kpRating)
                var kpDomEl = render.find('.rate--kp')[0];
                if (kpDomEl) {
                    var checkKP = function() {
                        if (!$(kpDomEl).hasClass('hide')) {
                            var kpVal = parseFloat($(kpDomEl).find('> div').eq(0).text().trim());
                            if (kpVal > 0) {
                                currentRating = 'KP ' + kpVal.toFixed(1);
                                rebuildInfo();
                            }
                            if (kpObs) { kpObs.disconnect(); kpObs = null; }
                        }
                    };
                    checkKP(); // Проверяем сразу (если KP уже был загружен из кэша)
                    if ($(kpDomEl).hasClass('hide')) {
                        kpObs = new MutationObserver(checkKP);
                        kpObs.observe(kpDomEl, { attributes: true, attributeFilter: ['class'] });
                    }
                }

                // Качество ищем с задержкой
                setTimeout(function () {
                    if (currentToken !== token) return;
                    var qBadge = render.find('.quality-badge-custom').first();
                    if (qBadge.length && !currentQuality) {
                        currentQuality = qBadge.text().trim();
                        rebuildInfo();
                    }
                }, 300);

                // ── Строка о сериале ──
                var serialEl = null;
                if (movie.first_air_date) {
                    var last = movie.last_episode_to_air;
                    var curSeas = last ? last.season_number : 0;
                    var totSeas = movie.number_of_seasons || 0;
                    var totEps = movie.number_of_episodes || 0;
                    var curEps = last ? last.episode_number : 0;

                    var airedTotal = 0;
                    if (movie.seasons) {
                        for (var i = 0; i < movie.seasons.length; i++) {
                            var s = movie.seasons[i];
                            if (s.season_number > 0 && s.season_number < curSeas) {
                                airedTotal += s.episode_count || 0;
                            }
                        }
                    }
                    airedTotal += curEps;

                    var sp = [];

                    if (totSeas > 0) {
                        sp.push(Lampa.Lang.translate('title_seasons') + ': ' +
                            (curSeas < totSeas ? curSeas + '/' + totSeas : totSeas));
                    }

                    if (totEps > 0) {
                        var epsStr = (airedTotal > 0 && airedTotal < totEps)
                            ? airedTotal + '/' + totEps
                            : String(totEps);
                        sp.push(Lampa.Lang.translate('title_episodes') + ': ' + epsStr);
                    }

                    var hasNextEp = false;
                    var nextEpData = movie.next_episode_to_air;
                    if (nextEpData) {
                        var airStr = nextEpData.air_date;
                        if (airStr) {
                            var daysLeft = Math.ceil(
                                (Lampa.Utils.parseToDate(airStr).getTime() - Date.now()) / 86400000
                            );
                            if (daysLeft > 0) {
                                hasNextEp = true;
                                sp.push(
                                    Lampa.Lang.translate('full_next_episode') + ': ' +
                                    Lampa.Utils.parseTime(airStr).short + ' / ' +
                                    Lampa.Lang.translate('full_episode_days_left') + ': ' + daysLeft
                                );
                            }
                        }
                        if (!hasNextEp && nextEpData.episode_number) {
                            var epNum = nextEpData.episode_number;
                            var seasNum = nextEpData.season_number;
                            var found = null;
                            if (episodesList) {
                                for (var j = 0; j < episodesList.length; j++) {
                                    if (episodesList[j].season_number === seasNum &&
                                        episodesList[j].episode_number === epNum) {
                                        found = episodesList[j];
                                        break;
                                    }
                                }
                            }
                            if (found && found.air_date) {
                                var daysLeft2 = Math.ceil(
                                    (Lampa.Utils.parseToDate(found.air_date).getTime() - Date.now()) / 86400000
                                );
                                if (daysLeft2 > 0) {
                                    hasNextEp = true;
                                    sp.push(
                                        Lampa.Lang.translate('full_next_episode') + ': ' +
                                        Lampa.Utils.parseTime(found.air_date).short + ' / ' +
                                        Lampa.Lang.translate('full_episode_days_left') + ': ' + daysLeft2
                                    );
                                }
                            }
                        }
                    }

                    var status = movie.status || '';
                    var showStatus = status && status.toLowerCase() !== 'released';
                    var hideOngoing = hasNextEp && status === 'Returning Series';

                    if (showStatus && !hideOngoing) {
                        var statusKey = 'tv_status_' + status.toLowerCase().replace(/ /g, '_');
                        sp.unshift(Lampa.Lang.translate(statusKey));
                    }

                    if (sp.length) {
                        serialEl = $('<span class="fsc-serial-badge"></span>').text(sp.join(' • '));
                    }
                }

                // ── Сборка блока ──
                var main = $('<div class="fsc-main"></div>');
                main.append(title);

                // 1. Строка о сериале — ПЕРВАЯ (статус + сезоны/серии/следующий эпизод)
                if (movie.first_air_date && serialEl) {
                    main.append($('<div class="fsc-center-row"></div>').append(serialEl));
                }

                // Исправление 3: для фильмов "Скоро" тоже идёт ПЕРЕД строкой инфы
                if (!movie.first_air_date && movie.release_date) {
                    var releaseTs = Lampa.Utils.parseToDate(movie.release_date).getTime();
                    if (releaseTs > Date.now()) {
                        main.append($('<div class="fsc-center-row"></div>').append(
                            $('<span class="fsc-serial-badge"></span>').text(
                                'Скоро • ' + Lampa.Utils.parseTime(movie.release_date).short
                            )
                        ));
                    }
                }

                // 2. Строка инфы — ВТОРАЯ
                main.append($('<div class="fsc-center-row"></div>').append(infoEl));

                main.append(buttons);

                right.empty();
                right.append(main);

                // ── Логотип ──
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
                            Lampa.TMDB.api(
                                mediaType + '/' + movie.id +
                                '/images?api_key=' + Lampa.TMDB.key() +
                                '&language=ru&include_image_language=ru'
                            ),
                            function (data) {
                                if (currentToken !== token) return;
                                var logos = (data.logos || []).filter(function (l) {
                                    return l.file_path && !l.file_path.endsWith('.svg') && l.iso_639_1 === 'ru';
                                });
                                logos.sort(function (a, b) { return b.vote_average - a.vote_average; });
                                if (Object.keys(_logoCache).length > CACHE_MAX) _logoCache = {};
                                _logoCache[cacheKey] = logos.length
                                    ? Lampa.TMDB.image('t/p/w500' + logos[0].file_path)
                                    : null;
                                if (_logoCache[cacheKey]) applyLogo(_logoCache[cacheKey]);
                            }
                        );
                    }
                }

                // ── Скролл ──
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
                if (kpObs) { kpObs.disconnect(); kpObs = null; }
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
