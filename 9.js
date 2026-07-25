(function () {  
    var css =  
        /* скрываем оригинальные элементы, которые переносим в оверлей */  
        '.card:not(.card--wide) .card__title,' +  
        '.card:not(.card--wide) .card__age,' +  
        '.card:not(.card--wide) .card__type,' +  
        '.card:not(.card--wide) .card__quality,' +  
        '.card:not(.card--wide) .card__vote,' +  
        '.card:not(.card--wide) .card__new-episode,' +  
        '.card:not(.card--wide) .card__marker{display:none!important}' +  
        '.card:not(.card--wide) .card__view::before{display:none!important}' +  
  
        /* иконки закладок — правый верхний угол, без фона */  
        '.card:not(.card--wide) .card__icons{left:auto;right:0.5em;top:0.5em}' +  
        '.card:not(.card--wide) .card__icons-inner{background:none}' +  
        '.card:not(.card--wide) .card__icon{filter:drop-shadow(0 1px 4px rgba(0,0,0,1)) drop-shadow(0 0 8px rgba(0,0,0,0.9))}' +  
  
        /* статус (от другого плагина) — левый верхний угол */  
        '.card:not(.card--wide) .card__status{position:absolute;top:0.5em;left:0.5em;bottom:auto;background:none;padding:0;border-radius:0;z-index:2}' +  
        '.card:not(.card--wide) .card__status .tvs-icon{font-size:0.9em;line-height:1;margin-right:0.1em}' +  
        '.card:not(.card--wide) .card__status .tvs-text{font-size:0.9em;font-weight:700;color:#fff;letter-spacing:0.03em;text-shadow:0 1px 4px rgba(0,0,0,1),0 0 8px rgba(0,0,0,0.9)}' +  
  
        /* тёмное зеркало — нижние 26% постера */  
        '.crl-overlay{' +  
            'position:absolute;bottom:0;left:0;right:0;height:26%;' +  
            'border-radius:0 0 1em 1em;overflow:hidden;' +  
            'background:linear-gradient(to bottom,rgba(0,0,0,0) 0%,rgba(0,0,0,0.78) 35%,rgba(0,0,0,0.88) 100%);' +  
            'padding:0.3em 0.45em 0.38em;' +  
            'display:flex;flex-direction:column;justify-content:flex-end;' +  
            'z-index:2;box-sizing:border-box}' +  
  
        /* название — макс. 2 строки, обрезка с ... */  
        '.crl-title{' +  
            'font-size:0.72em;line-height:1.2;font-weight:700;color:#fff;' +  
            'overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;line-clamp:2;' +  
            '-webkit-box-orient:vertical;text-overflow:ellipsis;' +  
            'margin-bottom:0.22em;' +  
            'text-shadow:0 1px 3px rgba(0,0,0,0.9)}' +  
  
        /* строки с метаданными */  
        '.crl-row{display:flex;justify-content:space-between;align-items:baseline;line-height:1.2;margin-top:0.15em}' +  
        '.crl-left{font-size:0.6em;color:rgba(255,255,255,0.82);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1;min-width:0}' +  
        '.crl-right{font-size:0.6em;color:rgba(255,255,255,0.92);white-space:nowrap;margin-left:0.5em;flex-shrink:0;display:flex;align-items:baseline;gap:0.3em}' +  
  
        /* бейдж качества */  
        '.crl-quality{background:#ffe216;color:#000;border-radius:0.25em;padding:0.05em 0.3em;font-weight:700;text-transform:uppercase}' +  
  
        /* рейтинг */  
        '.crl-vote{font-weight:700;color:#fff}';  
  
    document.head.insertAdjacentHTML('beforeend', '<style>' + css + '</style>');  
  
    /* ── вспомогательные функции ── */  
  
    function getGenre(data) {  
        if (data.genres && data.genres.length) {  
            return data.genres.slice(0, 2).map(function (g) { return g.name; }).join(', ');  
        }  
        if (data.genre_ids && data.genre_ids.length) {  
            try {  
                var type = data.original_name ? 'tv' : 'movie';  
                var names = Lampa.Api.sources.tmdb.getGenresNameFromIds(type, data.genre_ids);  
                return names.slice(0, 2).join(', ');  
            } catch (e) {}  
        }  
        return '';  
    }  
  
    function getStatus(data) {  
        if (!data.status) return '';  
        try {  
            var key = 'tv_status_' + data.status.toLowerCase().replace(/ /g, '_');  
            var t = Lampa.Lang.translate(key);  
            return (t && t !== key) ? t : data.status;  
        } catch (e) { return data.status; }  
    }  
  
    /* ── построение оверлея ── */  
  
    function buildOverlay(data) {  
        var isTV    = !!data.original_name;  
        var genre   = getGenre(data);  
        var type    = isTV ? 'TV' : 'MOV';  
        var quality = data.quality || data.release_quality || '';  
        var vote    = parseFloat((data.cub_hundred_rating || data.vote_average || 0) + '').toFixed(1);  
        var voteNum = parseFloat(vote);  
        var status  = getStatus(data);  
        var year    = ((data.release_date || data.first_air_date || '') + '').slice(0, 4);  
        if (year === '0000') year = '';  
  
        var overlay = document.createElement('div');  
        overlay.className = 'crl-overlay';  
  
        /* строка 1-2: название */  
        var titleEl = document.createElement('div');  
        titleEl.className = 'crl-title';  
        titleEl.textContent = data.title || data.name || '';  
        overlay.appendChild(titleEl);  
  
        /* строка 3: жанр+тип | качество+рейтинг */  
        var row2   = document.createElement('div');  
        row2.className = 'crl-row';  
  
        var left2  = document.createElement('div');  
        left2.className = 'crl-left';  
        left2.textContent = genre ? (type + ' · ' + genre) : type;  
  
        var right2 = document.createElement('div');  
        right2.className = 'crl-right';  
  
        if (quality) {  
            var qEl = document.createElement('span');  
            qEl.className = 'crl-quality';  
            qEl.textContent = quality;  
            right2.appendChild(qEl);  
        }  
        if (voteNum > 0) {  
            var vEl = document.createElement('span');  
            vEl.className = 'crl-vote';  
            vEl.textContent = voteNum >= 10 ? '10' : vote;  
            right2.appendChild(vEl);  
        }  
  
        row2.appendChild(left2);  
        row2.appendChild(right2);  
        overlay.appendChild(row2);  
  
        /* строка 4: статус | год */  
        if (status || year) {  
            var row3   = document.createElement('div');  
            row3.className = 'crl-row';  
  
            var left3  = document.createElement('div');  
            left3.className = 'crl-left';  
            left3.textContent = status;  
  
            var right3 = document.createElement('div');  
            right3.className = 'crl-right';  
            right3.textContent = year;  
  
            row3.appendChild(left3);  
            row3.appendChild(right3);  
            overlay.appendChild(row3);  
        }  
  
        return overlay;  
    }  
  
    /* ── обработка карточки ── */  
  
    function processCard(card) {  
        if (card.dataset.crlDone) return;  
        if (card.classList.contains('card--wide')) return;  
        card.dataset.crlDone = '1';  
  
        var view = card.querySelector('.card__view');  
        if (!view) return;  
  
        var data = card.card_data || {};  
        view.appendChild(buildOverlay(data));  
    }  
  
    function scanExisting() {  
        [].forEach.call(document.querySelectorAll('.card'), processCard);  
    }  
  
    var observer = new MutationObserver(function (mutations) {  
        [].forEach.call(mutations, function (mutation) {  
            [].forEach.call(mutation.addedNodes, function (node) {  
                if (node.nodeType !== 1) return;  
                if (node.classList.contains('card')) {  
                    setTimeout(function () { processCard(node); }, 0);  
                } else if (node.querySelectorAll) {  
                    [].forEach.call(node.querySelectorAll('.card'), function (card) {  
                        setTimeout(function () { processCard(card); }, 0);  
                    });  
                }  
            });  
        });  
    });  
  
    function start() {  
        observer.observe(document.body, { childList: true, subtree: true });  
        scanExisting();  
    }  
  
    Lampa.Listener.follow('app', function (event) {  
        if (event.type === 'ready') scanExisting();  
        if (event.type === 'destroy') observer.disconnect();  
    });  
  
    if (document.body) start();  
    else document.addEventListener('DOMContentLoaded', start);  
})();
