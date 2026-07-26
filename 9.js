(function () {  
    'use strict';  
  
    var css = `  
        .card__title {  
            -webkit-line-clamp: 2 !important;  
            line-clamp: 2 !important;  
            max-height: 2.4em !important;  
        }  
  
        .ccs__bar {  
            position: absolute;  
            bottom: 0; left: 0; right: 0;  
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
  
        .ccs__type {  
            background: rgba(255,255,255,0.22);  
            border-radius: 0.3em;  
            padding: 0.15em 0.45em;  
            text-transform: uppercase;  
            font-weight: 600;  
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
  
        var view = cardEl.querySelector('.card__view');  
        if (!view) return;  
  
        var ageEl  = cardEl.querySelector('.card__age');  
        var voteEl = view.querySelector('.card__vote');  
        var qualEl = view.querySelector('.card__quality');  
  
        // Если ни одного элемента нет — модули ещё не отработали, выходим  
        // (scheduleProcess попробует снова через setTimeout)  
        if (!ageEl && !voteEl && !qualEl) return;  
  
        cardEl.dataset.ccsProcessed = '1';  
  
        var data = cardEl.card_data || {};  
        var isTV = !!(data.name || data.original_name || data.first_air_date || data.number_of_seasons);  
  
        var bar   = document.createElement('div');  
        bar.className = 'ccs__bar';  
  
        var left  = document.createElement('div');  
        left.className = 'ccs__left';  
  
        var right = document.createElement('div');  
        right.className = 'ccs__right';  
  
        // appendChild ПЕРЕМЕЩАЕТ существующий узел, не копирует  
        if (ageEl)  left.appendChild(ageEl);  
  
        var typeEl = document.createElement('span');  
        typeEl.className = 'ccs__type';  
        typeEl.textContent = isTV ? 'TV' : 'Movie';  
        left.appendChild(typeEl);  
  
        if (qualEl) right.appendChild(qualEl);  
        if (voteEl) right.appendChild(voteEl);  
  
        bar.appendChild(left);  
        bar.appendChild(right);  
        view.appendChild(bar);  
    }  
  
    // Планируем обработку через setTimeout(0) — ждём пока все модули добавят элементы  
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
                        // Карточка добавлена в DOM — планируем обработку  
                        scheduleProcess(node);  
                    } else if (  
                        node.classList.contains('card__vote') ||  
                        node.classList.contains('card__quality')  
                    ) {  
                        // Дополнительный триггер: элемент добавлен внутрь карточки  
                        var card = node.closest ? node.closest('.card') : null;  
                        if (card) scheduleProcess(card);  
                    } else {  
                        // Контейнер с карточками (например, список)  
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
