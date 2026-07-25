(function () {  
    'use strict';  
  
    // ─── CSS ────────────────────────────────────────────────────────────────────  
    var css = `  
        /* Скрываем стандартный год под карточкой */  
        .card__age {  
            display: none !important;  
        }  
  
        /* Ограничиваем название до 2 строк */  
        .card__title {  
            -webkit-line-clamp: 2 !important;  
            line-clamp: 2 !important;  
            max-height: 2.4em !important;  
        }  
  
        /* Скрываем стандартные плашки рейтинга и качества на постере */  
        .card__vote,  
        .card__quality {  
            display: none !important;  
        }  
  
        /* Нижняя панель поверх постера */  
        .ccs__bar {  
            position: absolute;  
            bottom: 0;  
            left: 0;  
            right: 0;  
            padding: 2.5em 0.6em 0.55em 0.6em;  
            background: linear-gradient(  
                to bottom,  
                rgba(0,0,0,0) 0%,  
                rgba(0,0,0,0.82) 100%  
            );  
            border-bottom-left-radius: 1em;  
            border-bottom-right-radius: 1em;  
            display: flex;  
            justify-content: space-between;  
            align-items: flex-end;  
            z-index: 2;  
            pointer-events: none;  
            box-sizing: border-box;  
        }  
  
        .ccs__left,  
        .ccs__right {  
            display: flex;  
            align-items: center;  
            gap: 0.35em;  
            font-size: 0.78em;  
            line-height: 1;  
            color: rgba(255,255,255,0.92);  
        }  
  
        .ccs__type {  
            background: rgba(255,255,255,0.22);  
            border-radius: 0.3em;  
            padding: 0.18em 0.45em;  
            text-transform: uppercase;  
            font-weight: 600;  
            font-size: 0.9em;  
        }  
  
        .ccs__quality {  
            background: #ffe216;  
            color: #000;  
            border-radius: 0.3em;  
            padding: 0.18em 0.45em;  
            text-transform: uppercase;  
            font-weight: 700;  
            font-size: 0.9em;  
        }  
  
        .ccs__vote {  
            font-weight: 700;  
            color: #fff;  
        }  
    `;  
  
    // ─── Добавить стили ──────────────────────────────────────────────────────────  
    function addStyle(text) {  
        var el = document.createElement('style');  
        el.id  = 'custom-card-style';  
        el.textContent = text;  
        document.head.appendChild(el);  
    }  
  
    // ─── Обработать одну карточку ────────────────────────────────────────────────  
    function processCard(cardEl, data) {  
        if (!cardEl || !data) return;  
        if (cardEl.querySelector('.ccs__bar')) return; // уже обработана  
  
        var view = cardEl.querySelector('.card__view');  
        if (!view) return;  
  
        // Год  
        var relDate = data.release_date || data.first_air_date || data.birthday || '';  
        var year    = relDate ? String(relDate).slice(0, 4) : '';  
        if (year === '0000') year = '';  
  
        // Тип: TV или Movie  
        var isTV = !!(data.name || data.original_name ||  
                      data.first_air_date || data.number_of_seasons);  
        var type = isTV ? 'TV' : 'Movie';  
  
        // Качество (только для фильмов, как в оригинале)  
        var quality = (!isTV && (data.quality || data.release_quality)) || '';  
  
        // Рейтинг  
        var voteRaw = parseFloat(  
            (data.cub_hundred_rating || data.vote_average || 0) + ''  
        );  
        var vote = voteRaw > 0  
            ? (data.cub_hundred_fire  
                ? String(data.cub_hundred_fire)  
                : (voteRaw >= 10 ? '10' : voteRaw.toFixed(1)))  
            : '';  
  
        // ── Строим панель ──────────────────────────────────────────────────────  
        var bar   = document.createElement('div');  
        bar.className = 'ccs__bar';  
  
        // Левая часть: год + тип  
        var left  = document.createElement('div');  
        left.className = 'ccs__left';  
  
        if (year) {  
            var yearEl = document.createElement('span');  
            yearEl.textContent = year;  
            left.appendChild(yearEl);  
        }  
  
        var typeEl = document.createElement('span');  
        typeEl.className = 'ccs__type';  
        typeEl.textContent = type;  
        left.appendChild(typeEl);  
  
        // Правая часть: качество + рейтинг  
        var right = document.createElement('div');  
        right.className = 'ccs__right';  
  
        if (quality) {  
            var qualEl = document.createElement('span');  
            qualEl.className = 'ccs__quality';  
            qualEl.textContent = quality;  
            right.appendChild(qualEl);  
        }  
  
        if (vote) {  
            var voteEl = document.createElement('span');  
            voteEl.className = 'ccs__vote';  
            voteEl.textContent = vote;  
            right.appendChild(voteEl);  
        }  
  
        bar.appendChild(left);  
        bar.appendChild(right);  
        view.appendChild(bar);  
    }  
  
    // ─── Инициализация ───────────────────────────────────────────────────────────  
    function init() {  
        addStyle(css);  
  
        // Перехватываем момент, когда карточка становится видимой  
        Lampa.Listener.follow('card', function (e) {  
            if (e.type === 'visible') {  
                processCard(e.card, e.data);  
            }  
        });  
    }  
  
    if (window.appready) {  
        init();  
    } else {  
        Lampa.Listener.follow('app', function (e) {  
            if (e.type === 'ready') init();  
        });  
    }  
  
})();
