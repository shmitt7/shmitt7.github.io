(function () {  
    'use strict';  
  
    var css = `  
        /* Панель поверх постера */  
        .ccs__bar {  
            position: absolute;  
            bottom: 0; left: 0; right: 0;  
            padding: 0.5em;  
            background: linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.85) 100%);  
            border-bottom-left-radius: 1em;  
            border-bottom-right-radius: 1em;  
            z-index: 2;  
            pointer-events: none;  
            box-sizing: border-box;  
        }  
  
        /* Перемещённое название — 2 строки */  
        .ccs__bar .card__title {  
            position: static !important;  
            font-size: 1em !important;  
            max-height: 2.4em !important;  
            -webkit-line-clamp: 2 !important;  
            line-clamp: 2 !important;  
            overflow: hidden !important;  
            display: -webkit-box !important;  
            -webkit-box-orient: vertical !important;  
            transform: none !important;  
            color: #fff;  
            margin-bottom: 0.4em;  
            line-height: 1.2;  
        }  
  
        /* Строка метаданных */  
        .ccs__row {  
            display: flex;  
            justify-content: space-between;  
            align-items: center;  
        }  
  
        .ccs__left, .ccs__right {  
            display: flex;  
            align-items: center;  
            gap: 0.3em;  
            font-size: 0.8em;  
            line-height: 1;  
            color: rgba(255,255,255,0.92);  
        }  
  
        /* Сбрасываем стили перемещённых элементов */  
        .ccs__bar .card__age {  
            position: static !important;  
            font-size: 1em !important;  
            margin-top: 0 !important;  
            transform: none !important;  
        }  
  
        /* Стандартный .card__type — сбрасываем absolute */  
        .ccs__bar .card__type {  
            position: static !important;  
            left: auto !important;  
            top: auto !important;  
            font-size: 1em !important;  
        }  
  
        .ccs__bar .card__quality {  
            position: static !important;  
            left: auto !important;  
            bottom: auto !important;  
            font-size: 1em !important;  
        }  
  
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
  
        var view   = cardEl.querySelector('.card__view');  
        if (!view) return;  
  
        // Элементы снаружи .card__view  
        var titleEl = cardEl.querySelector('.card__title');  
        var ageEl   = cardEl.querySelector('.card__age');  
  
        // Элементы уже внутри .card__view  
        var typeEl  = view.querySelector('.card__type');  
        var voteEl  = view.querySelector('.card__vote');  
        var qualEl  = view.querySelector('.card__quality');  
  
        // Ждём пока хоть что-то появится  
        if (!titleEl && !ageEl && !voteEl && !qualEl && !typeEl) return;  
  
        cardEl.dataset.ccsProcessed = '1';  
  
        var bar = document.createElement('div');  
        bar.className = 'ccs__bar';  
  
        // Перемещаем название внутрь постера  
        if (titleEl) bar.appendChild(titleEl);  
  
        // Строка: [год + тип] | [качество + рейтинг]  
        var row   = document.createElement('div');  
        row.className = 'ccs__row';  
  
        var left  = document.createElement('div');  
        left.className = 'ccs__left';  
  
        var right = document.createElement('div');  
        right.className = 'ccs__right';  
  
        if (ageEl)  left.appendChild(ageEl);   // перемещаем год  
        if (typeEl) left.appendChild(typeEl);  // перемещаем стандартный .card__type  
  
        if (qualEl) right.appendChild(qualEl); // перемещаем качество  
        if (voteEl) right.appendChild(voteEl); // перемещаем рейтинг  
  
        row.appendChild(left);  
        row.appendChild(right);  
        bar.appendChild(row);  
        view.appendChild(bar);  
    }  
  
    function scheduleProcess(cardEl) {  
        if (!cardEl || cardEl.dataset.ccsQueued || cardEl.dataset.ccsProcessed) return;  
        cardEl.dataset.ccsQueued = '1';  
        setTimeout(function () { processCard(cardEl); }, 0);  
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
                        scheduleProcess(node);  
                    } else if (  
                        node.classList.contains('card__vote') ||  
                        node.classList.contains('card__quality') ||  
                        node.classList.contains('card__type')  
                    ) {  
                        var card = node.closest ? node.closest('.card') : null;  
                        if (card) scheduleProcess(card);  
                    } else {  
                        var cards = node.querySelectorAll ? node.querySelectorAll('.card') : [];  
                        for (var k = 0; k < cards.length; k++) {  
                            scheduleProcess(cards[k]);  
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
