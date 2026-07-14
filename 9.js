(function () {  
    'use strict';  
  
    if (window.plugin_quality_all_ready) return;  
    window.plugin_quality_all_ready = true;  
  
    var network = new Lampa.Reguest();  
  
    function fetchQuality(id, method, cb) {  
        var url = Lampa.Utils.protocol()  
            + Lampa.Manifest.cub_domain  
            + '/api/ai/metadata/' + id + '/' + method;  
  
        network.silent(  
            url,  
            function (json) {   
                console.log('[Quality Plugin] CUB response:', json);  
                cb((json && json.release_quality) || null);   
            },  
            function ()     {   
                console.log('[Quality Plugin] CUB error');  
                cb(null);   
            },  
            false,  
            { timeout: 5000 }  
        );  
    }  
  
    function applyToFullPage(body, quality) {  
        if (!quality) return;  
        var tag = body.find('.tag--quality');  
        if (tag.length) {  
            tag.removeClass('hide').find('> div').text(quality);  
            console.log('[Quality Plugin] Applied to full page:', quality);  
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
        console.log('[Quality Plugin] Applied to card:', quality);  
    }  
  
    function initPlugin() {  
        console.log('[Quality Plugin] Initializing...');  
  
        // Проверяем настройку  
        var cardQualityEnabled = Lampa.Storage.field('card_quality');  
        console.log('[Quality Plugin] card_quality setting:', cardQualityEnabled);  
  
        // Хук на страницу фильма/сериала  
        Lampa.Listener.follow('full', function (e) {  
            if (e.type !== 'start') return;  
  
            var movie   = e.data.movie;  
            var body    = e.body;  
            var isTv    = !!movie.first_air_date;  
            var method  = isTv ? 'tv' : 'movie';  
            var quality = movie.release_quality || movie.quality;  
  
            console.log('[Quality Plugin] Full page:', movie.title, 'isTv:', isTv, 'quality:', quality);  
  
            if (quality) {  
                applyToFullPage(body, quality);  
                return;  
            }  
  
            fetchQuality(movie.id, method, function (quality) {  
                if (!quality) return;  
                movie.release_quality = quality;  
                applyToFullPage(body, quality);  
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
                        var cardEl = cards[m];  
                        var data   = cardEl.card_data;  
  
                        if (!data) {  
                            console.log('[Quality Plugin] No card_data on element');  
                            continue;  
                        }  
  
                        var quality = data.release_quality || data.quality;  
                        if (!quality) continue;  
  
                        var view = cardEl.querySelector('.card__view');  
                        if (!view) continue;  
  
                        applyToCardView(view, quality);  
                    }  
                }  
            }  
        });  
  
        observer.observe(document.body, { childList: true, subtree: true });  
        console.log('[Quality Plugin] Observer started');  
    }  
  
    // Правильная инициализация через событие app  
    if (window.appready) {  
        initPlugin();  
    } else {  
        Lampa.Listener.follow('app', function (e) {  
            if (e.type == 'ready') initPlugin();  
        });  
    }  
  
})();
