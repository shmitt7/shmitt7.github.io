(function () {  
    'use strict';  
  
    if (window.plugin_quality_all_ready) return;  
    window.plugin_quality_all_ready = true;  
  
    var network = new Lampa.Reguest();  
  
    /**  
     * Нормализует значение quality/release_quality.  
     * CUB может вернуть: строку "WEB-DL", пустой массив [], null, undefined.  
     */  
    function normalizeQuality(val) {  
        if (!val) return null;  
        if (Array.isArray(val)) return val.length ? val[0] : null;  
        if (typeof val === 'string' && val.trim()) return val.trim();  
        return null;  
    }  
  
    function fetchQuality(id, method, cb) {  
        var url = Lampa.Utils.protocol()  
            + Lampa.Manifest.cub_domain  
            + '/api/ai/metadata/' + id + '/' + method;  
  
        network.silent(  
            url,  
            function (json) {  
                cb(normalizeQuality(json && json.release_quality));  
            },  
            function () { cb(null); },  
            false,  
            { timeout: 5000 }  
        );  
    }  
  
    function applyToFullPage(body, quality) {  
        if (!quality) return;  
        var tag = body.find('.tag--quality');  
        if (tag.length) {  
            tag.removeClass('hide').find('> div').text(quality);  
        }  
    }  
  
    function applyToCardView(view, quality) {  
        if (!quality) return;  
        if (view.querySelector('.card__quality')) return;  
  
        var wrap  = document.createElement('div');  
        var inner = document.createElement('div');  
        wrap.className  = 'card__quality';  
        inner.innerText = quality.toUpperCase();  
        wrap.appendChild(inner);  
        view.appendChild(wrap);  
    }  
  
    function initPlugin() {  
        // Хук на страницу фильма/сериала  
        Lampa.Listener.follow('full', function (e) {  
            if (e.type !== 'start') return;  
  
            var movie   = e.data.movie;  
            var body    = e.body;  
            var isTv    = !!movie.first_air_date;  
            var method  = isTv ? 'tv' : 'movie';  
  
            // Нормализуем — пустой массив [] превращается в null  
            var quality = normalizeQuality(movie.release_quality)  
                       || normalizeQuality(movie.quality);  
  
            console.log('[Quality Plugin]', movie.title || movie.name,  
                        'isTv:', isTv, 'quality:', quality);  
  
            if (quality) {  
                applyToFullPage(body, quality);  
                return;  
            }  
  
            // Качества нет — запрашиваем с CUB  
            fetchQuality(movie.id, method, function (q) {  
                if (!q) return;  
                movie.release_quality = q;  
                applyToFullPage(body, q);  
            });  
        });  
  
        // MutationObserver для карточек в каталоге  
        var observer = new MutationObserver(function (mutations) {  
            for (var i = 0; i < mutations.length; i++) {  
                var added = mutations[i].addedNodes;  
                for (var j = 0; j < added.length; j++) {  
                    var node = added[j];  
                    if (!node.querySelectorAll) continue;  
  
                    var cards = [];  
                    if (node.classList && node.classList.contains('card')) {  
                        cards.push(node);  
                    }  
                    var nested = node.querySelectorAll('.card');  
                    for (var k = 0; k < nested.length; k++) {  
                        cards.push(nested[k]);  
                    }  
  
                    for (var m = 0; m < cards.length; m++) {  
                        var cardEl  = cards[m];  
                        var data    = cardEl.card_data;  
                        if (!data) continue;  
  
                        // Нормализуем здесь тоже  
                        var quality = normalizeQuality(data.release_quality)  
                                   || normalizeQuality(data.quality);  
                        if (!quality) continue;  
  
                        var view = cardEl.querySelector('.card__view');  
                        if (!view) continue;  
  
                        applyToCardView(view, quality);  
                    }  
                }  
            }  
        });  
  
        observer.observe(document.body, { childList: true, subtree: true });  
    }  
  
    if (window.appready) {  
        initPlugin();  
    } else {  
        Lampa.Listener.follow('app', function (e) {  
            if (e.type == 'ready') initPlugin();  
        });  
    }  
  
})();
