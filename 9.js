(function () {  
    'use strict';  
  
    // Защита от двойной инициализации  
    if (window.plugin_quality_ready) return;  
    window.plugin_quality_ready = true;  
  
    var network = new Lampa.Reguest();  
  
    // Запрос качества с CUB API  
    // method: 'movie' или 'tv'  
    function fetchQuality(id, method, callback) {  
        var url = Lampa.Utils.protocol()  
            + Lampa.Manifest.cub_domain  
            + '/api/ai/metadata/' + id + '/' + method;  
  
        network.silent(url, function (json) {  
            var quality = json.release_quality  
                || (json.metadata && json.metadata.release_quality)  
                || null;  
            callback(quality);  
        }, function () {  
            callback(null);  
        }, false, { timeout: 5000 });  
    }  
  
    // Вставить/обновить метку качества на странице фильма/сериала  
    function applyToFullPage(body, quality) {  
        if (!quality) return;  
        body.find('.tag--quality')  
            .removeClass('hide')  
            .find('> div')  
            .text(quality);  
    }  
  
    // Вставить метку качества на постер карточки  
    function applyToCard(cardView, quality) {  
        if (!quality) return;  
        if (cardView.find('.card__quality').length) return; // уже есть  
  
        cardView.append(  
            $('<div class="card__quality"><div>'  
                + quality.toUpperCase()  
                + '</div></div>')  
        );  
    }  
  
    // Хук на открытие полной карточки (фильм или сериал)  
    Lampa.Listener.follow('full', function (e) {  
        if (e.type !== 'start') return;  
  
        var movie   = e.data.movie;  
        var body    = e.body;  
        var isTv    = !!movie.first_air_date;  
        var method  = isTv ? 'tv' : 'movie';  
        var quality = movie.release_quality || movie.quality;  
  
        if (quality) {  
            // Качество уже есть — просто показываем (в т.ч. для сериалов,  
            // которые сейчас скрыты из-за !first_air_date в start.js)  
            applyToFullPage(body, quality);  
            return;  
        }  
  
        // Качества нет — запрашиваем с CUB  
        fetchQuality(movie.id, method, function (quality) {  
            if (!quality) return;  
  
            movie.release_quality = quality; // кэшируем в объекте  
            applyToFullPage(body, quality);  
        });  
    });  
  
    // Для постеров в каталоге — MutationObserver,  
    // т.к. публичного события рендера карточки нет  
    var observer = new MutationObserver(function (mutations) {  
        mutations.forEach(function (mutation) {  
            mutation.addedNodes.forEach(function (node) {  
                if (!node.querySelectorAll) return;  
  
                // Ищем только что добавленные карточки  
                node.querySelectorAll('.card').forEach(function (cardEl) {  
                    var card = $(cardEl);  
  
                    // Данные карточки Lampa хранит в .data('card') на элементе  
                    var data = card.data('card');  
                    if (!data) return;  
  
                    var quality = data.release_quality || data.quality;  
                    if (quality) {  
                        applyToCard(card.find('.card__view'), quality);  
                    }  
                    // Если нет — можно запросить с CUB, но это много запросов  
                    // Лучше ограничиться страницей фильма  
                });  
            });  
        });  
    });  
  
    observer.observe(document.body, { childList: true, subtree: true });  
  
})();
