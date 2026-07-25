(function () {  
    'use strict';  
  
    var css = `  
        /* Название — максимум 2 строки */  
        .card__title {  
            -webkit-line-clamp: 2 !important;  
            line-clamp: 2 !important;  
            max-height: 2.4em !important;  
        }  
  
        /* Панель поверх постера */  
        .ccs__bar {  
            position: absolute;  
            bottom: 0;  
            left: 0;  
            right: 0;  
            padding: 2em 0.5em 0.5em 0.5em;  
            background: linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.85) 100%);  
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
            gap: 0.3em;  
            font-size: 0.8em;  
            line-height: 1;  
            color: rgba(255,255,255,0.92);  
        }  
  
        /* Сбрасываем стили перемещённого .card__age */  
        .ccs__bar .card__age {  
            position: static !important;  
            font-size: 1em !important;  
            margin-top: 0 !important;  
            transform: none !important;  
        }  
  
        /* Бейдж типа (новый элемент) */  
        .ccs__type {  
            background: rgba(255,255,255,0.22);  
            border-radius: 0.3em;  
            padding: 0.15em 0.45em;  
            text-transform: uppercase;  
            font-weight: 600;  
        }  
  
        /* Сбрасываем стили перемещённого .card__quality */  
        .ccs__bar .card__quality {  
            position: static !important;  
            left: auto !important;  
            bottom: auto !important;  
            font-size: 1em !important;  
        }  
  
        /* Сбрасываем стили перемещённого .card__vote */  
        .ccs__bar .card__vote {  
            position: static !important;  
            right: auto !important;  
            bottom: auto !important;  
            font-size: 1em !important;  
            background: none !important;  
            padding: 0 !important;  
            border-radius: 0 !important;  
        }  
    `;  
  
    function addStyle(text) {  
        var el = document.createElement('style');  
        el.id = 'custom-card-style';  
        el.textContent = text;  
        document.head.appendChild(el);  
    }  
  
    function processCard(cardEl) {  
        if (!cardEl || cardEl.dataset.ccsProcessed) return;  
        cardEl.dataset.ccsProcessed = '1';  
  
        var view = cardEl.querySelector('.card__view');  
        if (!view) return;  
  
        // Стандартные элементы которые будем ПЕРЕМЕЩАТЬ  
        var ageEl  = cardEl.querySelector('.card__age');   // снаружи .card__view  
        var voteEl = view.querySelector('.card__vote');    // уже внутри .card__view  
        var qualEl = view.querySelector('.card__quality'); // уже внутри .card__view  
  
        // Тип определяем по данным карточки  
        var data = cardEl.card_data || {};  
        var isTV = !!(data.name || data.original_name || data.first_air_date || data.number_of_seasons);  
  
        // Строим панель  
        var bar   = document.createElement('div');  
        bar.className = 'ccs__bar';  
  
        var left  = document.createElement('div');  
        left.className = 'ccs__left';  
  
        var right = document.createElement('div');  
        right.className = 'ccs__right';  
  
        // Перемещаем год (appendChild перемещает, не копирует)  
        if (ageEl) left.appendChild(ageEl);  
  
        // Тип — единственный новый элемент  
        var typeEl = document.createElement('span');  
        typeEl.className = 'ccs__type';  
        typeEl.textContent = isTV ? 'TV' : 'Movie';  
        left.appendChild(typeEl);  
  
        // Перемещаем качество и рейтинг  
        if (qualEl) right.appendChild(qualEl);  
        if (voteEl) right.appendChild(voteEl);  
  
        bar.appendChild(left);  
        bar.appendChild(right);  
        view.appendChild(bar);  
    }  
  
    function init() {  
        addStyle(css);  
  
        var observer = new MutationObserver(function (mutations) {  
            for (var i = 0; i < mutations.length; i++) {  
                var added = mutations[i].addedNodes;  
                for (var j = 0; j < added.length; j++) {  
                    var node = added[j];  
                    if (node.nodeType !== 1) continue;  
  
                    if (node.classList.contains('card')) {  
                        processCard(node);  
                    } else {  
                        var cards = node.querySelectorAll('.card');  
                        for (var k = 0; k < cards.length; k++) {  
                            processCard(cards[k]);  
                        }  
                    }  
                }  
            }  
        });  
  
        observer.observe(document.body, { childList: true, subtree: true });  
    }  
  
    if (window.appready) {  
        init();  
    } else {  
        Lampa.Listener.follow('app', function (e) {  
            if (e.type === 'ready') init();  
        });  
    }  
})();
