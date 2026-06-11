(function() {  
    'use strict';  
    if (window.qualityPlugin) return;  
    window.qualityPlugin = true;  
  
    document.head.insertAdjacentHTML('beforeend', '<style>.card__quality:not(.card__quality-custom),.tag--quality:not(.quality-badge-custom){display:none!important}</style>');  
  
    const SERVERS = ['https://jac.red', 'https://jr.maxvol.pro'];  
    const QUALITY_SCORE = { '4K': 3, 'HD': 2, 'TS': 1 };  
    const net = new Lampa.Reguest();  
  
    function getQuality(title) {  
        if (!title) return null;  
        if (/\b(ts|telesync|telecine|cam|camrip|workprint|wp|scr|screener|dvdscr)\b/i.test(title) || /звук\s*с\s*ts|sound\s*ts|audio\s*ts|dub\s*ts/i.test(title)) return 'TS';  
        if (/\b(2160p|2160р|4k|uhd|4к)\b/i.test(title)) return '4K';  
        if (/\b(1080p|1080р|720p|720р|blu\-ray|bdrip|bdremux|web\-dl|webdl|web\-dlrip|webrip|hdtv|hdtvrip|hddvd|hddvdrip|fullhd|fhd|hd|hdrip)\b/i.test(title)) return 'HD';  
        return null;  
    }  
  
    function fetchQuality(data, callback) {  
        const title = data.title || data.name;  
        const yearStr = (data.release_date || data.first_air_date || '').substring(0, 4);  
        const targetYear = parseInt(yearStr) || null;  
        let serverIndex = 0;  
        let titles = [];  
  
        const analyzeResults = () => {  
            if (!titles.length) {  
                console.log('[quality] Нет результатов для:', title);  
                return callback(null);  
            }  
            let tsCount = 0;  
            let best = { q: null, s: -1 };  
            console.log('[quality] Всего заголовков:', titles.length, 'для:', title);  
            for (const t of titles) {  
                const q = getQuality(t);  
                console.log('[quality]', JSON.stringify(t), '->', q);  
                if (q === 'TS') tsCount++;  
                const s = q ? QUALITY_SCORE[q] : -1;  
                if (s > best.s) best = { q, s };  
            }  
            console.log('[quality] tsCount:', tsCount, '/', titles.length, '| best:', best.q);  
            callback((tsCount / titles.length >= 0.5) ? 'TS' : best.q);  
        };  
  
        const tryRequest = () => {  
            if (serverIndex >= SERVERS.length) return analyzeResults();  
            const url = SERVERS[serverIndex] + '/api/v2.0/indexers/all/results?apikey=&Query=' + encodeURIComponent(title) + (targetYear ? '&year=' + targetYear : '');  
            console.log('[quality] Запрос к серверу', serverIndex, ':', url);  
            net.silent(url, (res) => {  
                const results = res?.Results || [];  
                console.log('[quality] Сервер', serverIndex, 'вернул', results.length, 'результатов');  
                for (const r of results) {  
                    const relYear = parseInt(r.info?.released || r.year);  
                    if (!targetYear || !relYear || Math.abs(relYear - targetYear) <= 1) titles.push(r.Title);  
                }  
                serverIndex++;  
                tryRequest();  
            }, () => {  
                console.log('[quality] Сервер', serverIndex, 'недоступен');  
                serverIndex++;  
                tryRequest();  
            });  
        };  
  
        tryRequest();  
    }  
  
    function addBadge(card, q) {  
        card.querySelectorAll('.card__quality-custom').forEach(el => el.remove());  
        const badge = document.createElement('div');  
        badge.className = 'card__quality card__quality-custom';  
        badge.textContent = q;  
        const view = card.querySelector('.card__view');  
        if (view) view.appendChild(badge);  
    }  
  
    const intersectionObserver = new IntersectionObserver((entries) => {  
        for (const entry of entries) {  
            if (!entry.isIntersecting) continue;  
            intersectionObserver.unobserve(entry.target);  
            const cardData = entry.target.card_data;  
            if (cardData?.id) fetchQuality(cardData, (q) => { if (q) addBadge(entry.target, q); });  
        }  
    }, { rootMargin: '100px' });  
  
    function observeCard(card) {  
        if (!card.card_data?.id || card.dataset.qlty) return;  
        card.dataset.qlty = 'true';  
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
        fetchQuality(e.data.movie, (q) => {  
            if (!q) return;  
            const cont = e.object.activity.render().find('.full-start-new__rate-line, .full-start__rate-line, .full-start__tags');  
            if (!cont.length) return;  
            cont.find('.quality-badge-custom').remove();  
            const badge = document.createElement('div');  
            badge.className = 'full-start__tag tag--quality quality-badge-custom';  
            badge.style.cssText = 'background:#ffe216;color:#000;margin-left:10px;padding:0 5px;border-radius:3px;display:inline-block';  
            badge.textContent = q;  
            cont[0].appendChild(badge);  
        });  
    });  
  
    if (window.appready) document.querySelectorAll('.card').forEach(observeCard);  
    else Lampa.Listener.follow('app', (e) => { if (e.type === 'ready') document.querySelectorAll('.card').forEach(observeCard); });  
})();
