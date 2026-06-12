(function() {  
    if (window.qualityPlugin) return;  
    window.qualityPlugin = true;  
    const SERVERS = ['https://jac.red', 'https://jr.maxvol.pro'];  
    const RE_TS = /\b(ts|telesync|telecine|cam|camrip|workprint|wp|scr|screener|dvdscr)\b/i;  
    const RE_TS2 = /звук\s*с\s*ts|sound\s*ts|audio\s*ts|dub\s*ts/i;  
    const RE_4K = /\b(2160p|2160р|4k|uhd|4к)\b/i;  
    const RE_HD = /\b(1080p|1080р|720p|720р|blu\-ray|bdrip|bdremux|web\-dl|webdl|web\-dlrip|webrip|hdtv|hdtvrip|hddvd|hddvdrip|fullhd|fhd|hd|hdrip)\b/i;  
    const net = new Lampa.Reguest();  
    const cache = {};  
    function getQuality(t) {  
        if (!t) return null;  
        if (RE_TS.test(t) || RE_TS2.test(t)) return 'TS';  
        if (RE_4K.test(t)) return '4K';  
        if (RE_HD.test(t)) return 'HD';  
        return null;  
    }  
    function fetchQuality(data, callback) {  
        const key = data.id;  
        if (key && cache[key] !== undefined) return callback(cache[key]);  
        const title = data.title || data.name;  
        const targetYear = parseInt((data.release_date || data.first_air_date || '').substring(0, 4)) || null;  
        let i = 0, titles = [];  
        const done = () => {  
            if (!titles.length) { if (key) cache[key] = null; return callback(null); }  
            let ts = 0, has4K = false, hasHD = false;  
            for (const t of titles) {  
                const q = getQuality(t);  
                if (q === 'TS') ts++;  
                else if (q === '4K') has4K = true;  
                else if (q === 'HD') hasHD = true;  
            }  
            const r = ts / titles.length >= 0.5 ? 'TS' : has4K ? '4K' : hasHD ? 'HD' : null;  
            if (key) cache[key] = r;  
            callback(r);  
        };  
        const next = () => {  
            if (i >= SERVERS.length) return done();  
            const url = SERVERS[i] + '/api/v2.0/indexers/all/results?apikey=&Query=' + encodeURIComponent(title) + (targetYear ? '&year=' + targetYear : '');  
            net.silent(url, (res) => {  
                for (const r of (res?.Results || [])) {  
                    const y = parseInt(r.info?.released || r.year);  
                    const inTitle = !targetYear || (r.Title && (r.Title.includes(String(targetYear)) || r.Title.includes(String(targetYear - 1)) || r.Title.includes(String(targetYear + 1))));  
                    if ((y && Math.abs(y - targetYear) <= 1) || (!y && inTitle)) titles.push(r.Title);  
                }  
                i++; next();  
            }, () => { i++; next(); });  
        };  
        next();  
    }  
    function makeBadge(q, cls) {  
        const b = document.createElement('div');  
        b.className = cls;  
        const inner = document.createElement('div');  
        inner.textContent = q;  
        b.appendChild(inner);  
        return b;  
    }  
    const io = new IntersectionObserver((entries) => {  
        for (const e of entries) {  
            if (!e.isIntersecting) continue;  
            io.unobserve(e.target);  
            const d = e.target.card_data;  
            if (d?.id) fetchQuality(d, (q) => {  
                if (!q) return;  
                const view = e.target.querySelector('.card__view');  
                if (!view) return;  
                view.querySelectorAll('.card__quality').forEach(el => el.remove());  
                view.appendChild(makeBadge(q, 'card__quality'));  
            });  
        }  
    }, { rootMargin: '100px' });  
    function observeCard(card) {  
        if (!card.card_data?.id || card.dataset.qlty) return;  
        card.dataset.qlty = '1';  
        io.observe(card);  
    }  
    new MutationObserver((mutations) => {  
        for (const m of mutations)  
            for (const node of m.addedNodes) {  
                if (node.nodeType !== 1) continue;  
                if (node.classList.contains('card')) observeCard(node);  
                node.querySelectorAll('.card').forEach(observeCard);  
            }  
    }).observe(document.body, { childList: true, subtree: true });  
    Lampa.Listener.follow('full', (e) => {  
        if (e.type !== 'complite' || !e.data?.movie) return;  
        fetchQuality(e.data.movie, (q) => {  
            if (!q) return;  
            const cont = e.object.activity.render().find('.full-start-new__rate-line, .full-start__rate-line, .full-start__tags');  
            if (!cont.length) return;  
            cont.find('.tag--quality').remove();  
            cont[0].appendChild(makeBadge(q, 'full-start__tag tag--quality'));  
        });  
    });  
    if (window.appready) document.querySelectorAll('.card').forEach(observeCard);  
    else Lampa.Listener.follow('app', (e) => { if (e.type === 'ready') document.querySelectorAll('.card').forEach(observeCard); });  
})();
