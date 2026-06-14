(function() {
    'use strict';
    if (window.fscPlugin) return;
    window.fscPlugin = true;
    let logoCache = {};
    let logoCacheSize = 0;

    function escapeHtml(s) {
        return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    function formatTitle(text) {
        if (!text || text.length <= 30) return null;
        const patterns = [
            { sep: ': ', keep: 1 },
            { sep: ' - ', keep: 2 },
            { sep: ' \u2013 ', keep: 2 },
            { sep: ' \u2014 ', keep: 2 },
        ];
        for (let pi = 0; pi < patterns.length; pi++) {
            const sep = patterns[pi].sep;
            const keep = patterns[pi].keep;
            const idx = text.indexOf(sep);
            if (idx > 2 && idx + sep.length < text.length - 2) {
                const part1 = text.slice(0, idx + keep);
                const part2 = text.slice(idx + keep).replace(/^\s+/, '');
                if (part2.length >= 3) {
                    return escapeHtml(part1) + '<br>' + escapeHtml(part2);
                }
            }
        }
        return null;
    }

    function getGenreLabels(movie, max) {
        const isTv = !!movie.name;
        const genres = movie.genres || [];
        const ids = genres.map(g => typeof g === 'object' ? g.id : g);
        let priority = null;
        if (ids.indexOf(16) !== -1 && movie.original_language === 'ja') priority = 'Аниме';
        else if (ids.indexOf(10763) !== -1) priority = 'Новости';
        else if (ids.indexOf(10767) !== -1) priority = 'Ток-шоу';
        else if (ids.indexOf(10764) !== -1) priority = 'Реалити-шоу';
        else if (ids.indexOf(99) !== -1) priority = 'Документальный';
        else if (ids.indexOf(10766) !== -1) priority = 'Мыльная опера';
        else if (ids.indexOf(16) !== -1) priority = isTv ? 'Мультсериал' : 'Мультфильм';
        const result = [];
        if (priority) result.push(priority);
        for (let i = 0; i < genres.length && result.length < (max || 2); i++) {
            const g = genres[i];
            if (!g) continue;
            const gId = typeof g === 'object' ? g.id : g;
            if ((priority === 'Аниме' || priority === 'Мультсериал' || priority === 'Мультфильм') && gId === 16) continue;
            const name = Lampa.Utils.capitalizeFirstLetter(g.name);
            if (name && result.indexOf(name) === -1) result.push(name);
        }
        return result;
    }

    function init() {
        const style = document.createElement('style');
        style.textContent = [
            // фоновое изображение
            'body.fsc--open .full-start__background{position:fixed!important;inset:0!important;width:100vw!important;height:100vh!important;z-index:0!important;object-fit:cover!important;mask-image:none!important;-webkit-mask-image:none!important;pointer-events:none!important;filter:none!important;opacity:0;transition:opacity 0.5s ease-in-out;}',
            'body.fsc--open .full-start__background.loaded{opacity:0.8!important;}',
            'body.fsc--open .full-start__background.dim{opacity:0!important;transition:opacity 0s!important;}',
            // фон страницы и шапка
            'body.fsc--open:not(.fsc--scrolled) .background{opacity:0!important;transition:none!important;}',
            'body.fsc--open.fsc--scrolled .background{opacity:1!important;transition:opacity 0.4s!important;}',
            'body.fsc--open:not(.fsc--scrolled) .head{background:transparent!important;}',
            // контейнер
            'body.fsc--open .full-start-new{position:relative!important;overflow:visible!important;}',
            'body.fsc--open .full-start-new__body{min-height:calc(100vh - 6em)!important;align-items:stretch!important;justify-content:center!important;overflow:visible!important;}',
            'body.fsc--open .full-start-new__right{display:flex!important;flex-direction:column!important;min-height:calc(100vh - 6em)!important;justify-content:flex-end!important;align-items:center!important;text-align:center!important;padding-bottom:0.8em!important;overflow:visible!important;}',
            'body.fsc--open .full-start-new__left{display:none!important;}',
            // скрыть всё кроме fsc-main, постера и реакций
            'body.fsc--open .full-start-new__right>*:not(.fsc-main):not(.fsc-poster-fallback):not(.full-start-new__reactions){display:none!important;}',
            // fsc-main
            '.fsc-main{display:flex!important;flex-direction:column!important;align-items:center!important;text-align:center!important;margin-bottom:0.2em!important;width:100%!important;}',
            // заголовок
            'body.fsc--open .full-start-new__title{text-align:center!important;max-width:100%!important;text-shadow:0 2px 12px rgba(0,0,0,0.95)!important;margin-bottom:0.15em!important;display:block!important;overflow:hidden!important;white-space:nowrap!important;text-overflow:ellipsis!important;-webkit-line-clamp:unset!important;line-clamp:unset!important;}',
            'body.fsc--open .full-start-new__title.fsc-title-split{white-space:normal!important;text-overflow:clip!important;display:-webkit-box!important;-webkit-box-orient:vertical!important;-webkit-line-clamp:2!important;line-clamp:2!important;}',
            // логотип
            '.fsc-logo{max-width:18em!important;max-height:5em!important;object-fit:contain!important;}',
            // строки с бейджами
            '.fsc-center-row{display:flex!important;flex-wrap:wrap!important;align-items:center!important;justify-content:center!important;gap:0.35em!important;margin-bottom:0.2em!important;}',
            '.fsc-serial-badge{display:inline-flex!important;align-items:center!important;height:1.5em!important;padding:0 0.5em!important;background:rgba(0,0,0,0.65)!important;color:#fff!important;font-size:1.25em!important;font-weight:550!important;border-radius:0.35em!important;white-space:nowrap!important;box-sizing:border-box!important;border:1px solid rgba(255,255,255,0.2)!important;margin:0!important;text-shadow:none!important;}',
            // постер-заглушка
            '.fsc-poster-fallback{flex:1 1 0!important;min-height:0!important;max-width:60%!important;object-fit:cover!important;object-position:center top!important;margin-bottom:0.5em!important;border-radius:1em!important;}',
            // реакции — правый нижний угол, fixed, компактно
            'body.fsc--open .full-start-new__reactions{position:fixed!important;bottom:2em!important;right:2em!important;margin:0!important;min-height:0!important;flex-wrap:wrap!important;justify-content:flex-end!important;align-items:center!important;z-index:2!important;max-width:20em!important;transition:opacity 0.3s ease-in-out!important;}',
            // скрыть если нет ни одной реакции (только placeholder)
            // скрыть при скролле вниз
            
            // чуть компактнее иконки
            'body.fsc--open .full-start-new__reactions .reaction{font-size:0.85em!important;}',
        ].join('');
        document.head.appendChild(style);

        let currentToken = null;
        let currentFullComp = null;

        Lampa.Listener.follow('full', (e) => {
            if (e.type !== 'complite') return;
            const fullComp = e.link;
            const token = {};
            currentToken = token;
            currentFullComp = fullComp;
            $('body').addClass('fsc--open').removeClass('fsc--scrolled');
            if (!Lampa.Storage.field('card_interfice_cover')) $('body').removeClass('card--no-cover');
            setTimeout(() => {
                if (currentToken !== token) return;
                const render = fullComp.render();
                const movie = e.data && e.data.movie;
                if (!movie) return;
                const right = render.find('.full-start-new__right');
                const title = render.find('.full-start-new__title');
                const buttons = render.find('.full-start-new__buttons');
                const relDate = movie.release_date || movie.first_air_date || '';
                const year = relDate ? relDate.slice(0, 4) : '';
                const runtimeMin = movie.first_air_date ? (movie.episode_run_time || [])[0] : movie.runtime;
                const runtime = runtimeMin > 0 ? Lampa.Utils.secondsToTimeHuman(runtimeMin * 60) : '';
                const countries = (movie.production_countries || []).slice(0, 2).map(c => {
                    const k = 'country_' + (c.iso_3166_1 || '').toLowerCase();
                    const t = Lampa.Lang.translate(k);
                    return (t && t !== k) ? t : (c.iso_3166_1 || '');
                }).filter(Boolean);
                const genreLabels = getGenreLabels(movie, 2);
                const tmdbRating = movie.vote_average ? parseFloat(movie.vote_average) : 0;
                const pg = render.find('.full-start__pg').not('.hide').text().trim();
                const infoParts = [];
                if (year) infoParts.push(year);
                if (runtime) infoParts.push(runtime);
                if (countries.length) infoParts.push(countries.join(', '));
                if (genreLabels.length) infoParts.push(genreLabels.join(', '));
                if (pg) infoParts.push(pg);
                let currentKP = 0;
                let currentQuality = '';
                const infoEl = $('<span class="fsc-serial-badge"></span>');
                function rebuildInfo() {
                    const parts = infoParts.slice();
                    if (currentKP > 0) parts.push(currentKP.toFixed(1) + ' KP');
                    else if (tmdbRating > 0) parts.push(tmdbRating.toFixed(1) + ' TMDB');
                    if (currentQuality) parts.push(currentQuality);
                    infoEl.text(parts.join(' \u2022 '));
                }
                rebuildInfo();
                const kpEl = render.find('.rate--kp')[0];
                function checkKP(attempt) {
                    if (currentToken !== token || attempt > 12) return;
                    if (kpEl && !$(kpEl).hasClass('hide')) {
                        const kpValue = parseFloat($(kpEl).find('> div').eq(0).text());
                        if (kpValue > 0) { currentKP = kpValue; rebuildInfo(); }
                    } else {
                        setTimeout(() => checkKP(attempt + 1), 500);
                    }
                }
                checkKP(0);
                function checkQual(attempt) {
                    if (currentToken !== token || attempt > 30) return;
                    const qualBadge = render.find('.tag--quality').first();
                    if (qualBadge.length) { currentQuality = qualBadge.text().trim(); rebuildInfo(); }
                    else setTimeout(() => checkQual(attempt + 1), 500);
                }
                setTimeout(() => checkQual(0), 300);
                let serialEl = null;
                if (movie.first_air_date) {
                    const lastEpisode = movie.last_episode_to_air;
                    const currentSeason = lastEpisode ? lastEpisode.season_number : 0;
                    const totalSeasons = movie.number_of_seasons || 0;
                    const totalEpisodes = movie.number_of_episodes || 0;
                    const currentEpisode = lastEpisode ? lastEpisode.episode_number : 0;
                    let airedTotal = 0;
                    if (movie.seasons && lastEpisode) {
                        for (let si = 0; si < movie.seasons.length; si++) {
                            const season = movie.seasons[si];
                            if (season.season_number > 0 && season.season_number < currentSeason)
                                airedTotal += season.episode_count || 0;
                        }
                        airedTotal += currentEpisode;
                    }
                    const tvStatus = movie.status || '';
                    let hasNextEpisode = false;
                    let nextEpisodeText = '';
                    const nextEpisode = movie.next_episode_to_air;
                    if (nextEpisode && nextEpisode.air_date) {
                        const daysLeft = Math.ceil((Lampa.Utils.parseToDate(nextEpisode.air_date).getTime() - Date.now()) / 86400000);
                        if (daysLeft > 0) {
                            hasNextEpisode = true;
                            nextEpisodeText = Lampa.Lang.translate('full_next_episode') + ': '
                                + Lampa.Utils.parseTime(nextEpisode.air_date).short + ' / '
                                + Lampa.Lang.translate('full_episode_days_left') + ': ' + daysLeft;
                        }
                    }
                    const serialParts = [];
                    if (tvStatus && !(tvStatus === 'Returning Series' && hasNextEpisode))
                        serialParts.push(Lampa.Lang.translate('tv_status_' + tvStatus.toLowerCase().replace(/ /g, '_')));
                    if (totalSeasons > 0)
                        serialParts.push(Lampa.Lang.translate('title_seasons') + ': '
                            + (currentSeason < totalSeasons ? currentSeason + '/' + totalSeasons : totalSeasons));
                    if (totalEpisodes > 0)
                        serialParts.push(Lampa.Lang.translate('title_episodes') + ': '
                            + (airedTotal > 0 && airedTotal < totalEpisodes ? airedTotal + '/' + totalEpisodes : totalEpisodes));
                    if (hasNextEpisode) serialParts.push(nextEpisodeText);
                    if (serialParts.length) serialEl = $('<span class="fsc-serial-badge"></span>').text(serialParts.join(' \u2022 '));
                }
                let movieStatusEl = null;
                if (!movie.first_air_date) {
                    const movieStatus = movie.status || '';
                    if (movieStatus && movieStatus.toLowerCase() !== 'released') {
                        const movieParts = [Lampa.Lang.translate('tv_status_' + movieStatus.toLowerCase().replace(/ /g, '_'))];
                        if (movie.release_date) movieParts.push(Lampa.Utils.parseTime(movie.release_date).short);
                        movieStatusEl = $('<span class="fsc-serial-badge"></span>').text(movieParts.join(' \u2022 '));
                    }
                }
                const main = $('<div class="fsc-main"></div>');
                main.append(title);
                if (movie.first_air_date && serialEl)
                    main.append($('<div class="fsc-center-row"></div>').append(serialEl));
                else if (!movie.first_air_date && movieStatusEl)
                    main.append($('<div class="fsc-center-row"></div>').append(movieStatusEl));
                main.append($('<div class="fsc-center-row"></div>').append(infoEl));
                main.append(buttons);
                right.find('.fsc-main').remove();
                right.append(main);
                right.find('.fsc-poster-fallback').remove();
                if (!movie.backdrop_path && movie.poster_path) {
                    const posterSrc = Lampa.TMDB.image('t/p/original' + movie.poster_path);
                    const posterImg = $('<img class="fsc-poster-fallback">').attr('src', posterSrc);
                    right.prepend(posterImg);
                }
                if (movie.id) {
                    const rawHtml = title.html();
                    const titleText = title.text().trim();
                    const formatted = formatTitle(titleText);
                    const origHtml = formatted !== null ? formatted : rawHtml;
                    if (formatted !== null) {
                        title.html(origHtml);
                        title.addClass('fsc-title-split');
                    } else {
                        title.removeClass('fsc-title-split');
                    }
                    const mediaType = movie.name ? 'tv' : 'movie';
                    const cacheKey = mediaType + '_' + movie.id;
                    const applyLogo = (src) => {
                        const img = document.createElement('img');
                        img.className = 'fsc-logo';
                        img.onerror = () => {
                            title.html(origHtml);
                            if (formatted !== null) title.addClass('fsc-title-split');
                            else title.removeClass('fsc-title-split');
                        };
                        img.src = src;
                        title.empty().append(img);
                        title.removeClass('fsc-title-split');
                    };
                    if (cacheKey in logoCache) {
                        if (logoCache[cacheKey]) applyLogo(logoCache[cacheKey]);
                    } else {
                        $.get(
                            Lampa.TMDB.api(mediaType + '/' + movie.id + '/images?api_key=' + Lampa.TMDB.key() + '&language=ru&include_image_language=ru'),
                            (data) => {
                                if (currentToken !== token) return;
                                const logos = (data.logos || [])
                                    .filter(l => l.file_path && !l.file_path.endsWith('.svg') && l.iso_639_1 === 'ru');
                                logos.sort((a, b) => b.vote_average - a.vote_average);
                                if (logoCacheSize > 200) { logoCache = {}; logoCacheSize = 0; }
                                logoCache[cacheKey] = logos.length ? Lampa.TMDB.image('t/p/original' + logos[0].file_path) : null;
                                logoCacheSize++;
                                if (logoCache[cacheKey]) applyLogo(logoCache[cacheKey]);
                            }
                        );
                    }
                }
                if (fullComp.scroll && !fullComp.scroll._fscWrapped) {
                    fullComp.scroll._fscWrapped = true;
                    const origOnScroll = fullComp.scroll.onScroll;
                    fullComp.scroll.onScroll = (pos) => {
                        if (origOnScroll) origOnScroll(pos);
                        $('body').toggleClass('fsc--scrolled', pos > 30);
                    };
                }
            }, 0);
        });

        Lampa.Listener.follow('activity', (e) => {
            if (e.type === 'archive' && e.component === 'full') {
                $('body').addClass('fsc--open').removeClass('fsc--scrolled');
                if (!Lampa.Storage.field('card_interfice_cover')) $('body').removeClass('card--no-cover');
                currentFullComp = e.object.activity.component;
            }
            if (e.type === 'destroy' && e.component === 'full') {
                const destroyedComp = e.object && e.object.activity && e.object.activity.component;
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
    else Lampa.Listener.follow('app', (e) => { if (e.type === 'ready') init(); });
})();
