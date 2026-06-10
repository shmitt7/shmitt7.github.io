(function() {  
    'use strict';  
    if (window.fscPlugin) return;  
    window.fscPlugin = true;  
    let logoCache = {};  
    let logoCacheSize = 0;  
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
            if (priority === 'Аниме' && gId === 16) continue;  
            const name = Lampa.Utils.capitalizeFirstLetter(g.name);  
            if (name && result.indexOf(name) === -1) result.push(name);  
        }  
        return result;  
    }  
    function parseCountry(iso) {  
        if (!iso) return '';  
        const key = 'country_' + iso.toLowerCase();  
        const translated = Lampa.Lang.translate(key);  
        return (translated && translated !== key) ? translated : iso;  
    }  
    function init() {  
        const style = document.createElement('style');  
        style.textContent = 'body.fsc--open .full-start__background{position:fixed!important;inset:0!important;width:100vw!important;height:100vh!important;z-index:0!important;object-fit:cover!important;mask-image:none!important;-webkit-mask-image:none!important;pointer-events:none!important;filter:none!important;opacity:0;transition:opacity 0.5s ease-in-out;}body.fsc--open .full-start__background.loaded{opacity:0.8!important;}body.fsc--open .full-start__background.dim{opacity:0!important;transition:opacity 0s!important;}body.fsc--open:not(.fsc--scrolled) .background{opacity:0!important;transition:none!important;}body.fsc--open.fsc--scrolled .background{opacity:1!important;transition:opacity 0.4s!important;}body.fsc--open:not(.fsc--scrolled) .head{background:transparent!important;}body.fsc--open .full-start-new{position:relative!important;}body.fsc--open .full-start-new__body{min-height:calc(100vh - 6em)!important;align-items:stretch!important;justify-content:center!important;}body.fsc--open .full-start-new__right{display:flex!important;flex-direction:column!important;min-height:calc(100vh - 6em)!important;justify-content:flex-end!important;align-items:center!important;text-align:center!important;padding-bottom:0.8em!important;}body.fsc--open .full-start-new__left{display:none!important;}body.fsc--open .full-start-new__right>*:not(.fsc-main){display:none!important;}.fsc-main{display:flex!important;flex-direction:column!important;align-items:center!important;text-align:center!important;margin-bottom:0.2em!important;}body.fsc--open .full-start-new__title{text-align:center!important;max-width:100%!important;text-shadow:0 2px 12px rgba(0,0,0,0.95)!important;margin-bottom:0.15em!important;display:block!important;overflow:visible!important;-webkit-line-clamp:unset!important;line-clamp:unset!important;}.fsc-logo{max-width:18em!important;max-height:5em!important;object-fit:contain!important;}.fsc-center-row{display:flex!important;flex-wrap:wrap!important;align-items:center!important;justify-content:center!important;gap:0.35em!important;margin-bottom:0.2em!important;}.fsc-serial-badge{display:inline-flex!important;align-items:center!important;height:1.5em!important;padding:0 0.5em!important;background:rgba(0,0,0,0.65)!important;color:#fff!important;font-size:1.25em!important;font-weight:550!important;border-radius:0.35em!important;white-space:nowrap!important;box-sizing:border-box!important;border:1px solid rgba(255,255,255,0.2)!important;margin:0!important;text-shadow:none!important;}';  
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
                const countries = (movie.production_countries || []).slice(0, 2).map(c => parseCountry(c.iso_3166_1)).filter(Boolean);  
                const genres = getGenreLabels(movie, 2);  
                const infoParts = [];  
                if (year) infoParts.push(year);  
                if (runtime) infoParts.push(runtime);  
                if (countries.length) infoParts.push(countries.join(', '));  
                if (genres.length) infoParts.push(genres.join(', '));  
                const infoEl = $('<span class="fsc-serial-badge"></span>');  
                let currentQuality = null;  
                function rebuildInfo() {  
                    const parts = infoParts.slice();  
                    const kpEl = render.find('.rate--kp');  
                    const tmdbEl = render.find('.rate--tmdb');  
                    const kpVal = !kpEl.hasClass('hide') ? parseFloat(kpEl.find('> div').eq(0).text()) || 0 : 0;  
                    const tmdbVal = !tmdbEl.hasClass('hide') ? parseFloat(tmdbEl.find('> div').eq(0).text()) || 0 : 0;  
                    if (kpVal > 0) parts.push(kpVal.toFixed(1) + ' KP');  
                    else if (tmdbVal > 0) parts.push(tmdbVal.toFixed(1) + ' TMDB');  
                    if (currentQuality) parts.push(currentQuality);  
                    infoEl.text(parts.join(' \u2022 '));  
                }  
                rebuildInfo();  
                function checkQual(attempt) {  
                    if (currentToken !== token || attempt > 10) return;  
                    const qual = render.find('.full-start__quality').text().trim();  
                    if (qual && qual !== currentQuality) {  
                        currentQuality = qual;  
                        rebuildInfo();  
                    } else {  
                        setTimeout(() => checkQual(attempt + 1), 300);  
                    }  
                }  
                setTimeout(() => checkQual(0), 300);  
                function checkKp(attempt) {  
                    if (currentToken !== token || attempt > 20) return;  
                    if (!render.find('.rate--kp').hasClass('hide')) {  
                        rebuildInfo();  
                    } else {  
                        setTimeout(() => checkKp(attempt + 1), 500);  
                    }  
                }  
                if (render.find('.rate--kp').hasClass('hide')) {  
                    setTimeout(() => checkKp(0), 500);  
                }  
                let serialEl = null;  
                if (movie.first_air_date) {  
                    const seasons = movie.seasons || [];  
                    const realSeasons = seasons.filter(s => s.season_number > 0);  
                    const totalSeasons = movie.number_of_seasons || realSeasons.length || 0;  
                    const totalEpisodes = movie.number_of_episodes || 0;  
                    const currentSeason = realSeasons.length || 0;  
                    const airedTotal = realSeasons.reduce((sum, s) => sum + (s.episode_count || 0), 0);  
                    const nextEp = movie.next_episode_to_air;  
                    const hasNextEpisode = !!(nextEp && nextEp.air_date);  
                    let nextEpisodeText = '';  
                    if (hasNextEpisode) {  
                        const parsed = Lampa.Utils.parseTime(nextEp.air_date);  
                        nextEpisodeText = Lampa.Lang.translate('title_episode') + ' ' + nextEp.episode_number  
                            + (nextEp.season_number ? ' (' + Lampa.Lang.translate('title_season') + ' ' + nextEp.season_number + ')' : '')  
                            + ': ' + (parsed && parsed.short ? parsed.short : nextEp.air_date);  
                    }  
                    const serialParts = [];  
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
                if (movie.id) {  
                    const origHtml = title.html();  
                    const mediaType = movie.name ? 'tv' : 'movie';  
                    const cacheKey = mediaType + '_' + movie.id;  
                    const applyLogo = (src) => {  
                        const img = document.createElement('img');  
                        img.className = 'fsc-logo';  
                        img.onerror = () => title.html(origHtml);  
                        img.src = src;  
                        title.empty().append(img);  
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
