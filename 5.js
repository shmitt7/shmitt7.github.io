(function () {
    'use strict';

    var _logoCache = {};
    var CACHE_MAX = 200;

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
        '.fsc-badge,',
        '.fsc-serial-badge,',
        '.fsc-meta-box .full-start__rate,',
        '.fsc-meta-box .full-start__pg,',
        '.fsc-meta-box .full-start__status,',
        '.fsc-main .full-start__status,',
        '.fsc-meta-box .quality-badge-custom {',
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
        '}',
        '.fsc-serial-badge { margin-bottom: 0.3em !important; text-shadow: none !important; }',
        '.fsc-meta-box .quality-badge-custom { align-self: center !important; }',
        '.fsc-meta-box .full-start__rate.hide { display: none !important; }',
        '.fsc-meta-box .full-start__rate { gap: 0.3em !important; }',
        '.fsc-meta-box .full-start__rate > div:first-child {',
        '  display: inline-flex !important; align-items: center !important;',
        '  height: auto !important; width: auto !important;',
        '  background: none !important; border-radius: 0 !important;',
        '  font-size: 1em !important; font-weight: 600 !important;',
        '  color: #fff !important; padding: 0 !important;',
        '}',
        '.fsc-meta-box .full-start__rate > div:last-child {',
        '  display: inline-flex !important; align-items: center !important;',
        '  height: auto !important; width: auto !important;',
        '  background: none !important; border-radius: 0 !important;',
        '  font-size: 1em !important; font-weight: 600 !important;',
        '  color: #fff !important; padding: 0 !important;',
        '}',
        '.fsc-meta-box {',
        '  position: absolute !important;',
        '  bottom: 5em !important; left: 1.5em !important;',
        '  z-index: 10 !important;',
        '  display: flex !important; flex-direction: column !important;',
        '  align-items: flex-start !important;',
        '  gap: 0.35em !important;',
        '}',
        '.fsc-meta-row {',
        '  display: flex !important; flex-wrap: wrap !important;',
        '  align-items: center !important;',
        '  gap: 0.35em !important;',
        '}',
        'body.fsc--open .full-start-new__buttons .full-start__button { height: 2.2em !important; }',
        '.fsc-reactions-row { flex-wrap: wrap !important; }',
        '.fsc-reactions-row .reaction {',
        '  display: inline-flex !important; flex-direction: row !important;',
        '  align-items: center !important;',
        '  height: 1.5em !important;',
        '  padding: 0 0.5em !important;',
        '  gap: 0 !important;',
        '  background: rgba(0,0,0,0.6) !important;',
        '  border: 1px solid rgba(255,255,255,0.25) !important;',
        '  backdrop-filter: blur(20px) saturate(180%) !important;',
        '  -webkit-backdrop-filter: blur(20px) saturate(180%) !important;',
        '  border-radius: 0.35em !important;',
        '  font-size: 1.25em !important; font-weight: 600 !important; color: #fff !important;',
        '}',
        '.fsc-reactions-row .reaction__icon { width: 1.2em !important; height: 1.2em !important; }',
        '.fsc-reactions-row .reaction__count { padding: 0 0 0 0.3em !important; font-size: 1em !important; font-weight: 600 !important; color: #fff !important; }',
        '.fsc-reactions-row .reaction__name { display: none !important; }',
        '.fsc-reactions-row .reaction:focus { background: rgba(255,255,255,0.15) !important; }',
    ].join('\n');
    document.head.appendChild(style);

    var GENRE_BY_ID = {
        28: 'Боевик', 12: 'Приключения', 35: 'Комедия', 80: 'Криминал',
        18: 'Драма', 10751: 'Семейный', 14: 'Фэнтези', 36: 'История',
        27: 'Ужасы', 10402: 'Музыка', 9648: 'Детектив', 10749: 'Мелодрама',
        878: 'Фантастика', 10770: 'Телефильм', 53: 'Триллер', 10752: 'Военный',
        37: 'Вестерн', 10759: 'Экшен', 10762: 'Детский', 10765: 'НФ и Фэнтези',
        10768: 'Война и Политика'
    };

    function getGenreLabel(movie) {
        var genres = movie.genres || [];
        var genreIds = genres.map(function (g) { return typeof g === 'object' ? g.id : g; });
        var isTv = !!movie.name;
        if (genreIds.indexOf(16) !== -1 && movie.original_language === 'ja') return 'Аниме';
        if (genreIds.indexOf(10763) !== -1) return 'Новости';
        if (genreIds.indexOf(10767) !== -1) return 'Ток-шоу';
        if (genreIds.indexOf(10764) !== -1) return 'Реалити-шоу';
        if (genreIds.indexOf(99)    !== -1) return 'Документальный';
        if (genreIds.indexOf(10766) !== -1) return 'Мыльная опера';
        if (genreIds[0] === 16) return isTv ? 'Мультсериал' : 'Мультфильм';
        if (GENRE_BY_ID[genreIds[0]]) return GENRE_BY_ID[genreIds[0]];
        var n = genres[0] && (genres[0].name || '');
        return n ? (n.charAt(0).toUpperCase() + n.slice(1)) : '';
    }

    function fmtTime(mins) {
        if (!mins) return '';
        var h = Math.floor(mins / 60), m = mins % 60;
        return h ? h + 'ч' + (m ? ' ' + m + 'м' : '') : m + 'м';
    }

    function badge(text) {
        return $('<span class="fsc-badge"></span>').text(text);
    }

    function parseCountry(iso) {
        if (!iso) return iso;
        var key = 'country_' + iso.toLowerCase();
        var t = Lampa.Lang.translate(key);
        return (t && t !== key) ? t : iso;
    }

    function parseCount(str) {
        str = (str || '').trim().toLowerCase();
        var n = parseFloat(str);
        if (isNaN(n)) return 0;
        if (str.indexOf('k') !== -1) return n * 1000;
        if (str.indexOf('m') !== -1) return n * 1000000;
        return n;
    }

    function init() {
        var currentToken = null;
        var qualityObserver = null;
        var kpObserver = null;
        var currentFullComp = null;
        var _compData = new Map();

        Lampa.Listener.follow('full', function (e) {
            if (e.type !== 'complite') return;

            var token = {};
            currentToken = token;

            var movie = e.data.movie;
            var fullComp = e.link;
            currentFullComp = fullComp;

            // Сохраняем эпизоды из e.data — они доступны только здесь, до setTimeout
            var episodesList = e.data.episodes && e.data.episodes.episodes;

            $('body').addClass('fsc--open').removeClass('fsc--scrolled');
            if (!Lampa.Storage.field('card_interfice_cover')) $('body').removeClass('card--no-cover');

            setTimeout(function () {
                if (currentToken !== token) return;

                var render = fullComp.render();
                var right = render.find('.full-start-new__right');
                if (!right.length) return;

                render.find('.fsc-rate-anchor').remove();

                var title    = render.find('.full-start-new__title').detach();
                var buttons  = render.find('.full-start-new__buttons').detach();
                var rateEls  = render.find('.full-start-new__rate-line .full-start__rate').detach();
                var pgEl     = render.find('.full-start__pg').detach();
                var statusEl = render.find('.full-start__status').detach();

                var reactionItems = render.find('.full-start-new__reactions .reaction').toArray();
                reactionItems.sort(function (a, b) {
                    return parseCount($(b).find('.reaction__count').text()) -
                           parseCount($(a).find('.reaction__count').text());
                });
                var reactions = reactionItems.slice(0, 3).map(function (el) {
                    el.style.cssText = '';
                    return el;
                });

                var genresStr     = getGenreLabel(movie);
                var countriesText = (movie.production_countries || []).slice(0, 1).map(function (c) {
                    return parseCountry(c.iso_3166_1 || c.name || '');
                }).filter(Boolean).join('');

                var showStatus = statusEl.length && movie.status && movie.status !== 'Released';

                var hasKP = !!(movie.kp_rating && parseFloat(movie.kp_rating) > 0);
                if (hasKP) rateEls.filter('.rate--tmdb').addClass('hide');

                // ── Строка сериала ──
                var serialEl  = null;
                var hasNextEp = false;

                if (movie.first_air_date) {
                    var sp      = [];
                    var last    = movie.last_episode_to_air;
                    var totSeas = movie.number_of_seasons || 0;
                    var totEps  = movie.number_of_episodes || 0;

                    if (last) {
                        var curSeas    = last.season_number || 0;
                        var airedEp    = last.episode_number || 0;
                        var seasons    = (movie.seasons || []).filter(function (s) { return s.season_number > 0; });
                        var totalAired = 0;
                        for (var j = 0; j < seasons.length; j++) {
                            if (seasons[j].season_number < curSeas) totalAired += seasons[j].episode_count || 0;
                        }
                        totalAired += airedEp;

                        var seasStr = Lampa.Lang.translate('title_seasons') + ': ';
                        seasStr += (curSeas < totSeas) ? curSeas + '/' + totSeas : totSeas;
                        sp.push(seasStr);

                        if (totalAired > 0 && totEps > 0) sp.push(Lampa.Lang.translate('title_episodes') + ': ' + totalAired + '/' + totEps);
                        else if (totEps > 0)              sp.push(Lampa.Lang.translate('title_episodes') + ': ' + totEps);
                    } else {
                        if (totSeas) sp.push(Lampa.Lang.translate('title_seasons') + ': ' + totSeas);
                        if (totEps)  sp.push(Lampa.Lang.translate('title_episodes') + ': ' + totEps);
                    }

                    // ── Следующий эпизод: сначала next_episode_to_air, потом из списка эпизодов ──
                    var now = Date.now();

                    if (movie.next_episode_to_air && movie.next_episode_to_air.air_date) {
                        var airStr   = movie.next_episode_to_air.air_date;
                        var daysLeft = Math.ceil((Lampa.Utils.parseToDate(airStr).getTime() - now) / 86400000);
                        if (daysLeft > 0) {
                            hasNextEp = true;
                            sp.push(
                                Lampa.Lang.translate('full_next_episode') + ': ' + Lampa.Utils.parseTime(airStr).short +
                                ' / ' + Lampa.Lang.translate('full_episode_days_left') + ': ' + daysLeft
                            );
                        }
                    }

                    // Запасной источник: эпизоды из e.data.episodes.episodes
                    // (те же данные, что Lampa показывает в секции эпизодов ниже)
                    if (!hasNextEp && episodesList && episodesList.length) {
                        var nextEpFromList = null;
                        for (var i = 0; i < episodesList.length; i++) {
                            if (episodesList[i].air_date && Lampa.Utils.parseToDate(episodesList[i].air_date).getTime() > now) {
                                nextEpFromList = episodesList[i];
                                break;
                            }
                        }
                        if (nextEpFromList) {
                            var airStr2   = nextEpFromList.air_date;
                            var daysLeft2 = Math.ceil((Lampa.Utils.parseToDate(airStr2).getTime() - now) / 86400000);
                            hasNextEp = true;
                            sp.push(
                                Lampa.Lang.translate('full_next_episode') + ': ' + Lampa.Utils.parseTime(airStr2).short +
                                ' / ' + Lampa.Lang.translate('full_episode_days_left') + ': ' + daysLeft2
                            );
                        }
                    }

                    if (!hasNextEp && showStatus) sp.unshift(statusEl.text());

                    if (sp.length) serialEl = $('<span class="fsc-serial-badge"></span>').text(sp.join(' · '));
                }

                // ── Мета-бокс ──
                var existingData = _compData.get(fullComp);
                if (existingData) { existingData.metaBox.remove(); existingData.rateAnchor.remove(); }

                var metaBox = $('<div class="fsc-meta-box"></div>');

                if (!movie.first_air_date && showStatus) {
                    metaBox.append($('<div class="fsc-meta-row"></div>').append(statusEl));
                }

                var relDate = movie.release_date || movie.first_air_date || '';
                var year = relDate ? relDate.slice(0, 4) : '';
                var row1 = $('<div class="fsc-meta-row"></div>');
                if (year) row1.append(badge(year));
                if (countriesText) row1.append(badge(countriesText));
                if (row1.children().length) metaBox.append(row1);

                var runtime = fmtTime(movie.runtime);
                var row2 = $('<div class="fsc-meta-row"></div>');
                if (runtime) row2.append(badge(runtime));
                if (genresStr) row2.append(badge(genresStr));
                if (row2.children().length) metaBox.append(row2);

                var row3 = $('<div class="fsc-meta-row fsc-rate-row"></div>');
                rateEls.each(function () { row3.append(this); });
                if (pgEl.length && pgEl.text().trim()) row3.append(pgEl);
                if (row3.children().length) metaBox.append(row3);

                if (reactions.length) {
                    metaBox.append($('<div class="fsc-meta-row fsc-reactions-row"></div>').append(reactions));
                }

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
                                row3.find('.quality-badge-custom').remove();
                                row3.append(node);
                                if (!$.contains(metaBox[0], row3[0])) metaBox.append(row3);
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
                            row3.find('.quality-badge-custom').remove();
                            row3.append(this);
                            if (!$.contains(metaBox[0], row3[0])) metaBox.append(row3);
                        }
                    });
                }, 100);

                if (kpObserver) { kpObserver.disconnect(); kpObserver = null; }
                if (!hasKP) {
                    var kpEl = row3.find('.rate--kp')[0];
                    if (kpEl) {
                        kpObserver = new MutationObserver(function () {
                            if (!$(kpEl).hasClass('hide')) {
                                row3.find('.rate--tmdb').addClass('hide');
                                kpObserver.disconnect();
                                kpObserver = null;
                            }
                        });
                        kpObserver.observe(kpEl, { attributes: true, attributeFilter: ['class'] });
                    }
                }

                // ── Центральный блок ──
                var main = $('<div class="fsc-main"></div>');
                main.append(title);

                if (movie.first_air_date && serialEl) {
                    main.append($('<div class="fsc-center-row"></div>').append(serialEl));
                }

                main.append(buttons);
                right.empty();
                right.append(main);

                // ── Логотип ──
                if (movie.id) {
                    var origHtml  = title.html();
                    var mediaType = movie.name ? 'tv' : 'movie';
                    var cacheKey  = mediaType + '_' + movie.id;
                    var lang      = Lampa.Storage.field('tmdb_lang') || 'ru';

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
                        // api_key добавляется вручную — TMDB.api() его НЕ добавляет автоматически
                        $.get(
                            Lampa.TMDB.api(
                                mediaType + '/' + movie.id +
                                '/images?api_key=' + Lampa.TMDB.key() +
                                '&language=' + lang +
                                '&include_image_language=' + lang + ',en'
                            ),
                            function (data) {
                                if (currentToken !== token) return;
                                var logos = (data.logos || []).filter(function (l) {
                                    return l.file_path && !l.file_path.endsWith('.svg');
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
    else Lampa.Listener.follow('app', function (e) {
        if (e.type === 'ready') init();
    });
})();
