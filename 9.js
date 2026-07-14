(function () {  
    'use strict';  
  
    // Защита от двойной инициализации  
    if (window.plugin_quality_all_ready) return;  
    window.plugin_quality_all_ready = true;  
  
    // Lampa.Reguest — именно так, с опечаткой, как в исходниках  
    var network = new Lampa.Reguest();  
  
    /**  
     * Запрашивает release_quality с CUB API.  
     * @param {number} id     - TMDB ID фильма/сериала  
     * @param {string} method - 'movie' или 'tv'  
     * @param {function} cb   - cb(quality: string|null)  
     */  
    function fetchQuality(id, method, cb) {  
        var url = Lampa.Utils.protocol()  
            + Lampa.Manifest.cub_domain  
            + '/api/ai/metadata/' + id + '/' + method;  
  
        network.silent(  
            url,  
            function (json) { cb((json && json.release_quality) || null); },  
            function ()     { cb(null); },  
            false,  
            { timeout: 5000 }  
        );  
    }  
  
    /**  
     * Показывает метку качества на странице фильма/сериала.  
     * Оригинальный start.js скрывает её для сериалов (проверка !first_air_date),  
     * поэтому вставляем напрямую в DOM, минуя эту проверку.  
     */  
    function applyToFullPage(body, quality) {  
        if (!quality) return;  
  
        var tag = body.find('.tag--quality');  
        if (tag.length) {  
            tag.removeClass('hide').find('> div').text(quality);  
        }  
    }  
  
    /**  
     * Добавляет жёлтую метку качества на постер карточки.  
     * Работает для фильмов и сериалов (оригинальный icons.js блокирует сериалы).  
     */  
    function applyToCardView(view, quality) {  
        if (!quality) return;  
        if (view.querySelector('.card__quality')) return; // уже есть  
  
        var wrap  = document.createElement('div');  
        var inner = document.createElement('div');  
  
        wrap.className  = 'card__quality';  
        inner.innerText = quality.toUpperCase();  
  
        wrap.appendChild(inner);  
        view.appendChild(wrap);  
    }  
  
    // ─── Хук на страницу фильма / сериала ────────────────────────────────────  
    // Событие 'full' с type='start' отправляется в src/components/full.js  
    // при успешной загрузке полной карточки.  
    // e.data.movie  — объект карточки  
    // e.body        — jQuery-обёртка над HTML страницы  
    // e.props       — пропсы компонента (содержит method: 'movie'|'tv')  
    Lampa.Listener.follow('full', function (e) {  
        if (e.type !== 'start') return;  
  
        var movie   = e.data.movie;  
        var body    = e.body;  
        var isTv    = !!movie.first_air_date;  
        var method  = isTv ? 'tv' : 'movie';  
        var quality = movie.release_quality || movie.quality;  
  
        if (quality) {  
            // Качество уже есть в данных карточки — просто показываем  
            applyToFullPage(body, quality);  
            return;  
        }  
  
        // Качества нет — запрашиваем с CUB  
        fetchQuality(movie.id, method, function (quality) {  
            if (!quality) return;  
  
            // Кэшируем в объекте, чтобы не запрашивать повторно  
            movie.release_quality = quality;  
            applyToFullPage(body, quality);  
        });  
    });  
  
    // ─── Хук на карточки в каталоге (MutationObserver) ───────────────────────  
    // Публичного события рендера карточки нет.  
    // Данные карточки хранятся как прямое свойство DOM-элемента: cardEl.card_data  
    // (см. src/interaction/card/module/card.js, строка 64)  
    var observer = new MutationObserver(function (mutations) {  
        for (var i = 0; i < mutations.length; i++) {  
            var added = mutations[i].addedNodes;  
  
            for (var j = 0; j < added.length; j++) {  
                var node = added[j];  
                if (!node.querySelectorAll) continue;  
  
                // Собираем карточки: сам узел или вложенные  
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
                    var data    = cardEl.card_data; // прямое свойство DOM-элемента  
  
                    if (!data) continue;  
  
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
  
})();
