(function() {  
    'use strict';  
    if (window.kpRating) return;  
    window.kpRating = true;  
    const CACHE_SUCCESS = 15 * 24 * 60 * 60 * 1000;  
    const CACHE_ERROR = 24 * 60 * 60 * 1000;  
    const CACHE_SEARCH = 3 * 60 * 60 * 1000;  
    const API_KEY = '14342b35-714b-449d-bf10-30d0d9ac22e6';  
    const net = new Lampa.Reguest();  
    const cache = Lampa.Storage.cache('kp_rating', 500, {});  
    document.head.insertAdjacentHTML('beforeend', '<style>.card__vote{display:flex!important;align-items:center!important}.card__vote .source--name{font-size:0;color:transparent;width:12px;height:12px;background-repeat:no-repeat;background-position:center;background-size:contain;margin-left:2px;flex-shrink:0;background-image:url("data:image/svg+xml,%3Csvg width=\'300\' height=\'300\' viewBox=\'0 0 300 300\' fill=\'none\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cmask id=\'mask0_1_69\' style=\'mask-type:alpha\' maskUnits=\'userSpaceOnUse\' x=\'0\' y=\'0\' width=\'300\' height=\'300\'%3E%3Ccircle cx=\'150\' cy=\'150\' r=\'150\' fill=\'white\'/%3E%3C/mask%3E%3Cg mask=\'url(%23mask0_1_69)\'%3E%3Ccircle cx=\'150\' cy=\'150\' r=\'150\' fill=\'black\'/%3E%3Cpath d=\'M300 45L145.26 127.827L225.9 45H181.2L126.3 121.203V45H89.9999V255H126.3V178.92L181.2 255H225.9L147.354 174.777L300 255V216L160.776 160.146L300 169.5V130.5L161.658 139.494L300 84V45Z\' fill=\'url(%23paint0_radial_1_69)\'/%3E%3C/g%3E%3Cdefs%3E%3CradialGradient id=\'paint0_radial_1_69\' cx=\'0\' cy=\'0\' r=\'1\' gradientUnits=\'userSpaceOnUse\' gradientTransform=\'translate(89.9999 45) rotate(45) scale(296.985)\'%3E%3Cstop offset=\'0.5\' stop-color=\'%23FF5500\'/%3E%3Cstop offset=\'1\' stop-color=\'%23BBFF00\'/%3E%3C/radialGradient%3E%3C/defs%3E%3C/svg%3E")}@media(min-width:481px){.card__vote .source--name{width:14px;height:14px;margin-left:3px}}</style>');  
    function getCache(id, type) {  
        const key = type === 'search' ? 'search_' + id : id;  
        const item = cache[key];  
        if (!item) return null;  
        const ttl = type === 'search' ? CACHE_SEARCH : item.kp === 0 ? CACHE_ERROR : CACHE_SUCCESS;  
        return (Date.now() - item.timestamp) < ttl ? item : null;  
    }  
    function setCache(id, data, type) {  
        const key = type === 'search' ? 'search_' + id : id;  
        cache[key] = { ...data, timestamp: Date.now() };  
        Lampa.Storage.set('kp_rating', cache);  
    }  
    function showFullRating(kp, tmdb, render) {  
        $('.wait_rating', render).remove();  
        if (kp > 0) $('.rate--kp', render).removeClass('hide').find('> div').eq(0).text(kp.toFixed(1));  
        if (tmdb > 0) $('.rate--tmdb', render).removeClass('hide').find('> div').eq(0).text(tmdb.toFixed(1));  
    }  
    function updateCardVote(card, kp, tmdb) {  
        let el = card.querySelector('.card__vote');  
        if (!el) {  
            el = document.createElement('div');  
            el.className = 'card__vote';  
            card.querySelector('.card__view')?.appendChild(el);  
        }  
        const rating = kp > 0 ? kp : tmdb;  
        if (rating > 0) {  
            el.innerHTML = '<span style="display:flex;align-items:center;gap:0.1em">' + rating.toFixed(1) + (kp > 0 ? '<span class="source--name"></span>' : '') + '</span>';  
            el.style.display = '';  
        } else {  
            el.style.display = 'none';  
        }  
    }  
    function fetchFromKpApi(id, card, callback) {  
        const tmdb = card.vote_average || 0;  
        net.timeout(3000);  
        net.silent('https://kinopoiskapiunofficial.tech/api/v2.2/films/' + id,  
            (data) => { const kp = data.ratingKinopoisk || 0; setCache(card.id, { kp, tmdb }); callback(kp, tmdb); },  
            () => { setCache(card.id, { kp: 0, tmdb }); callback(0, tmdb); },  
            false,  
            { headers: { 'X-API-KEY': API_KEY } }  
        );  
    }  
    function getRatingById(id, card, callback) {  
        const tmdb = card.vote_average || 0;  
        net.timeout(1000);  
        net.silent('https://rating.kinopoisk.ru/' + id + '.xml',  
            (str) => {  
                if (str?.includes('<rating>')) {  
                    try {  
                        const kp = parseFloat($($.parseXML(str)).find('kp_rating').text()) || 0;  
                        if (kp > 0) { setCache(card.id, { kp, tmdb }); callback(kp, tmdb); return; }  
                    } catch (e) {}  
                }  
                fetchFromKpApi(id, card, callback);  
            },  
            () => fetchFromKpApi(id, card, callback),  
            false,  
            { dataType: 'text' }  
        );  
    }  
    function fetchRating(card, callback) {  
        const cached = getCache(card.id);  
        if (cached) { callback(cached.kp, cached.tmdb); return; }  
        const searchCached = getCache(card.id, 'search');  
        if (searchCached) { getRatingById(searchCached.kp_id, card, callback); return; }  
        const year = parseInt((card.release_date || card.first_air_date || '').slice(0, 4)) || null;  
        const title = card.title || card.name;  
        const tmdb = card.vote_average || 0;  
        const processError = () => { setCache(card.id, { kp: 0, tmdb }); callback(0, tmdb); };  
        function searchByTitle() {  
            const query = (title || '').toLowerCase().replace(/[^\wа-яё\s]/gi, ' ').replace(/\s+/g, ' ').trim();  
            net.timeout(5000);  
            net.silent('https://kinopoiskapiunofficial.tech/api/v2.1/films/search-by-keyword?keyword=' + encodeURIComponent(query),  
                (json) => {  
                    if (!json.films?.length) { processError(); return; }  
                    const films = json.films;  
                    let best = null;  
                    if (year) {  
                        best = films.find(f => parseInt((f.year || '').slice(0, 4)) === year);  
                        if (!best) best = films.find(f => { const y = parseInt((f.year || '').slice(0, 4)); return y && y > year - 3 && y < year + 3; });  
                    }  
                    best = best || films[0];  
                    if (best) { setCache(card.id, { kp_id: best.filmId }, 'search'); getRatingById(best.filmId, card, callback); }  
                    else processError();  
                },  
                processError,  
                false,  
                { headers: { 'X-API-KEY': API_KEY } }  
            );  
        }  
        if (card.imdb_id) {  
            net.timeout(5000);  
            net.silent('https://kinopoiskapiunofficial.tech/api/v2.2/films?imdbId=' + encodeURIComponent(card.imdb_id),  
                (data) => {  
                    const id = data.items?.[0]?.kinopoiskId || data.items?.[0]?.filmId || data.kinopoiskId || data.filmId;  
                    if (id) { setCache(card.id, { kp_id: id }, 'search'); getRatingById(id, card, callback); }  
                    else searchByTitle();  
                },  
                searchByTitle,  
                false,  
                { headers: { 'X-API-KEY': API_KEY } }  
            );  
        } else {  
            searchByTitle();  
        }  
    }  
    const intersectionObserver = new IntersectionObserver((entries) => {  
        for (const entry of entries) {  
            if (!entry.isIntersecting) continue;  
            intersectionObserver.unobserve(entry.target);  
            fetchRating(entry.target.card_data, (kp, tmdb) => updateCardVote(entry.target, kp, tmdb));  
        }  
    }, { rootMargin: '100px' });  
    function observeCard(card) {  
        if (!card.card_data?.id || card.dataset.kp) return;  
        const data = card.card_data;  
        if (!data.release_date && !data.first_air_date) return;  
        card.dataset.kp = 'true';  
        intersectionObserver.observe(card);  
    }  
    new MutationObserver((mutations) => {  
        for (const m of mutations) {  
            for (const node of m.addedNodes) {  
                if (node.nodeType !== 1) continue;  
                if (node.classList?.contains('card')) observeCard(node);  
                node.querySelectorAll?.('.card').forEach(observeCard);  
            }  
        }  
    }).observe(document.body, { childList: true, subtree: true });  
    Lampa.Listener.follow('full', (e) => {  
        if (e.type !== 'complite' || !e.data?.movie) return;  
        const card = e.data.movie;  
        if (!card.release_date && !card.first_air_date) return;  
        const render = e.object.activity.render();  
        const cached = getCache(card.id);  
        if (cached) { showFullRating(cached.kp, cached.tmdb, render); return; }  
        if ($('.rate--kp', render).hasClass('hide') && !$('.wait_rating', render).length) {  
            $('.info__rate', render).after('<div style="width:2em;margin-top:1em;margin-right:1em" class="wait_rating"><div class="broadcast__scan"><div></div></div></div>');  
            fetchRating(card, (kp, tmdb) => showFullRating(kp, tmdb, render));  
        }  
    });  
    Lampa.Listener.follow('app', (e) => { if (e.type === 'destroy') intersectionObserver.disconnect(); });  
    document.querySelectorAll('.card').forEach(observeCard);  
})();
