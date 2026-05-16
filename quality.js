(function() {
    'use strict';
    if (window.qualityPlugin) return;
    window.qualityPlugin = true;
    const CONFIG = {
        SERVERS: ['https://jac.red', 'https://jr.maxvol.pro', 'https://jacred.stream', 'https://jac-red.ru'],
        QUALITY_SCORE: { '4K': 3, 'HD': 2, 'TS': 1 },
        CACHE_LIFE: 1440,
        OBSERVER_MARGIN: 100
    };
    const style = document.createElement('style');
    style.textContent = '.card__quality:not(.card__quality-custom), .tag--quality:not(.quality-badge-custom) { display: none !important; }';
    document.head.appendChild(style);
    function getQuality(title) {
        if (!title) return null;
        const lower = title.toLowerCase();
        if (/\b(ts|telesync|telecine|cam|camrip|workprint|wp|scr|screener|dvdscr)\b/i.test(lower) || /звук\s*с\s*ts|sound\s*ts|audio\s*ts|dub\s*ts/i.test(lower)) return 'TS';
        if (/\b(2160p|2160р|4k|uhd|4к)\b/i.test(lower)) return '4K';
        if (/\b(1080p|1080р|720p|720р|blu\-ray|bdrip|bdremux|web\-dl|webdl|web\-dlrip|webrip|hdtv|hdtvrip|hddvd|hddvdrip|fullhd|fhd|hd|hdrip)\b/i.test(lower)) return 'HD';
        return null;
    }
    function fetchQuality(data, callback) {
        const title = data.title || data.name;
        const yearStr = (data.release_date || data.first_air_date || '').substring(0, 4);
        const targetYear = parseInt(yearStr) || null;
        let serverIndex = 0;
        let allReleases = [];
        const analyzeResults = () => {
            if (!allReleases.length) return callback(null);
            let tsCount = 0;
            let best = { q: null, s: -1 };
            for (let i = 0; i < allReleases.length; i++) {
                const q = getQuality(allReleases[i].title);
                if (q === 'TS') tsCount++;
                const s = q ? CONFIG.QUALITY_SCORE[q] : -1;
                if (s > best.s) best = { q, s };
            }
            callback((tsCount / allReleases.length >= 0.5) ? 'TS' : best.q);
        };
        const tryRequest = () => {
            if (serverIndex >= CONFIG.SERVERS.length) return analyzeResults();
            const url = CONFIG.SERVERS[serverIndex] + '/api/v2.0/indexers/all/results?apikey=&Query=' + encodeURIComponent(title) + (targetYear ? '&year=' + targetYear : '');
            Lampa.Network.silent(url, (res) => {
                try {
                    const results = (typeof res === 'string' ? JSON.parse(res) : res).Results || [];
                    for (let i = 0; i < results.length; i++) {
                        const r = results[i];
                        const relYear = parseInt(r.info?.relased || r.year);
                        if (!targetYear || !relYear || Math.abs(relYear - targetYear) <= 1) {
                            allReleases.push({ title: r.Title });
                        }
                    }
                } catch(e) {}
                serverIndex++;
                tryRequest();
            }, () => {
                serverIndex++;
                tryRequest();
            }, false, { timeout: 10000, cache: { life: CONFIG.CACHE_LIFE } });
        };
        tryRequest();
    }
    function addBadge(card, q) {
        const view = card.querySelector('.card__view');
        if (!view) return;
        let badge = card.querySelector('.card__quality-custom');
        if (!badge) {
            badge = document.createElement('div');
            badge.className = 'card__quality card__quality-custom';
            badge.style.cssText = 'position:absolute;left:-0.8em;bottom:3em;padding:0.4em;background:#ffe216;color:#000;font-size:0.8em;border-radius:0.3em;text-transform:uppercase;z-index:1';
            view.appendChild(badge);
        }
        badge.textContent = q;
    }
    const observer = new IntersectionObserver((entries) => {
        for (let i = 0; i < entries.length; i++) {
            if (entries[i].isIntersecting) {
                observer.unobserve(entries[i].target);
                const cardData = entries[i].target.card_data;
                if (cardData?.id) {
                    fetchQuality(cardData, (q) => { if (q) addBadge(entries[i].target, q); });
                }
            }
        }
    }, { rootMargin: CONFIG.OBSERVER_MARGIN + 'px' });
    function observe() {
        const sel = '.card:not([data-qlty]), .card--small:not([data-qlty]), .card--category:not([data-qlty]), .card--wide:not([data-qlty])';
        const cards = document.querySelectorAll(sel);
        for (let i = 0; i < cards.length; i++) {
            const card = cards[i];
            if (card.card_data?.id) {
                card.dataset.qlty = 'true';
                observer.observe(card);
            }
        }
    }
    function start() {
        const container = document.querySelector('.content--scroll') || document.body;
        let timer;
        new MutationObserver(() => {
            clearTimeout(timer);
            timer = setTimeout(() => requestAnimationFrame(observe), 100);
        }).observe(container, { childList: true, subtree: true });
        Lampa.Listener.follow('card', (e) => {
            if (e.type === 'build' && e.object.card) {
                setTimeout(() => {
                    if (e.object.card.card_data?.id) {
                        e.object.card.dataset.qlty = 'true';
                        observer.observe(e.object.card);
                    }
                }, 400);
            }
        });
        Lampa.Listener.follow('full', (e) => {
            if (e.type === 'complite') {
                setTimeout(() => {
                    fetchQuality(e.data.movie, (q) => {
                        if (!q) return;
                        const render = Lampa.Activity.active().activity.render();
                        const cont = render.find('.full-start-new__rate-line, .full-start__rate-line, .full-start__tags');
                        if (cont.length) {
                            cont.find('.quality-badge-custom').remove();
                            cont.append($(`<div class="full-start__tag tag--quality quality-badge-custom" style="background:#ffe216;color:#000;margin-left:10px;padding:0 5px;border-radius:3px;display:inline-block">${q}</div>`));
                        }
                    });
                }, 200);
            }
        });
        observe();
    }
    if (window.appready) start();
    else Lampa.Listener.follow('app', (e) => { if (e.type === 'ready') start(); });
})();
