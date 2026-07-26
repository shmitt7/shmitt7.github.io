(function () {  
    'use strict';  
  
    var NEW_CARD_TPL = `<div class="card selector layer--visible layer--render">  
        <div class="card__view">  
            <img src="./img/img_load.svg" class="card__img" />  
            <div class="card__icons"><div class="card__icons-inner"></div></div>  
            <div class="ccs__bar">  
                <div class="card__title">{title}</div>  
                <div class="ccs__row">  
                    <div class="ccs__left">  
                        <div class="card__age">{release_year}</div>  
                    </div>  
                    <div class="ccs__right"></div>  
                </div>  
            </div>  
        </div>  
    </div>`;  
  
    var css = `  
    /* ── Панель поверх постера ─────────────────────────────────────── */  
    .ccs__bar {  
        position: absolute;  
        bottom: 0; left: 0; right: 0;  
        /* padding-top = хвост градиента */  
        padding: 1.8em 0.6em 0.55em 0.6em;  
        background: linear-gradient(  
            to bottom,  
            rgba(0,0,0,0)    0%,  
            rgba(0,0,0,0.88) 100%  
        );  
        border-bottom-left-radius: 1em;  
        border-bottom-right-radius: 1em;  
        z-index: 2;  
        pointer-events: none;  
        box-sizing: border-box;  
    }  
  
    /* ── Название: побольше, 2 строки, плотный межстрочник ─────────── */  
    .ccs__bar .card__title {  
        font-size: 1.4em !important;  
        line-height: 1.1 !important;  
        -webkit-line-clamp: 2 !important;  
                line-clamp: 2 !important;  
        max-height: 2.2em !important;   /* 2 × 1.1 */  
        overflow: hidden !important;  
        display: -webkit-box !important;  
        -webkit-box-orient: vertical !important;  
        color: #fff !important;  
        margin-bottom: 0.2em !important;  
        transform: none !important;  
    }  
  
    /* ── Строка метаданных ──────────────────────────────────────────── */  
    .ccs__row {  
        display: flex;  
        justify-content: space-between;  
        align-items: center;  
        line-height: 1;  
    }  
  
    /* Год и тип — маленькие, серые */  
    .ccs__left {  
        display: flex;  
        align-items: center;  
        gap: 0.3em;  
        font-size: 0.82em;  
        color: rgba(255,255,255,0.5);  
        line-height: 1;  
    }  
  
    /* Качество и рейтинг — крупнее, серые */  
    .ccs__right {  
        display: flex;  
        align-items: center;  
        gap: 0.3em;  
        font-size: 1em;  
        color: rgba(255,255,255,0.5);  
        line-height: 1;  
    }  
  
    /* ── Сброс стилей перемещённых элементов ───────────────────────── */  
    .ccs__bar .card__age {  
        position: static !important;  
        font-size: 1em !important;  
        margin-top: 0 !important;  
        transform: none !important;  
        color: inherit !important;  
    }  
  
    /* .card__type (TV бейдж) — убираем фон, рамку, позицию */  
    .ccs__bar .card__type,  
    .card--tv .ccs__bar .card__type {  
        position: static !important;  
        left: auto !important; top: auto !important;  
        font-size: 1em !important;  
        background: none !important;  
        color: inherit !important;  
        padding: 0 !important;  
        border-radius: 0 !important;  
    }  
  
    /* .card__quality — убираем жёлтый фон */  
    .ccs__bar .card__quality,  
    .ccs__bar .card__quality > div {  
        position: static !important;  
        left: auto !important; bottom: auto !important;  
        font-size: 1em !important;  
        background: none !important;  
        color: inherit !important;  
        padding: 0 !important;  
        border-radius: 0 !important;  
        text-transform: uppercase;  
    }  
  
    /* .card__vote — убираем тёмный фон, жирность */  
    .ccs__bar .card__vote {  
        position: static !important;  
        right: auto !important; bottom: auto !important;  
        font-size: 1em !important;  
        background: none !important;  
        color: inherit !important;  
        padding: 0 !important;  
        border-radius: 0 !important;  
        font-weight: normal !important;  
    }  
  
    /* ── Скрываем панель там где название удаляется ─────────────────── */  
    .card--wide .ccs__bar,  
    .card--small .ccs__bar {  
        display: none;  
    }  
`;  
    
    function addStyle(text) {  
        var el = document.createElement('style');  
        el.id = 'custom-card-style';  
        el.textContent = text;  
        document.head.appendChild(el);  
    }  
  
    // Перемещаем динамические элементы карточки в нужные контейнеры  
    function processCard(cardEl) {  
        if (!cardEl || cardEl.dataset.ccsProcessed) return;  
        cardEl.dataset.ccsProcessed = '1';  
  
        var left  = cardEl.querySelector('.ccs__left');  
        var right = cardEl.querySelector('.ccs__right');  
        if (!left || !right) return;  
  
        var view   = cardEl.querySelector('.card__view');  
        var typeEl = view && view.querySelector(':scope > .card__type');  
        var qualEl = view && view.querySelector(':scope > .card__quality');  
        var voteEl = view && view.querySelector(':scope > .card__vote');  
  
        if (typeEl) left.appendChild(typeEl);  
        if (qualEl) right.insertBefore(qualEl, right.querySelector('.card__vote') || null);  
        if (voteEl) right.appendChild(voteEl);  
    }  
  
    // Для элементов добавленных сторонними плагинами ПОСЛЕ нашей обработки  
    function relocateLate(node) {  
        var card = node.closest ? node.closest('.card') : null;  
        if (!card || !card.dataset.ccsProcessed) return;  
  
        var left  = card.querySelector('.ccs__left');  
        var right = card.querySelector('.ccs__right');  
  
        if (node.classList.contains('card__type') && left && !left.contains(node)) {  
            left.appendChild(node);  
        } else if ((node.classList.contains('card__quality') || node.classList.contains('card__vote')) && right && !right.contains(node)) {  
            right.insertBefore(node, right.querySelector('.card__vote') || null);  
        }  
    }  
  
    function scheduleProcess(cardEl) {  
        if (!cardEl || cardEl.dataset.ccsQueued || cardEl.dataset.ccsProcessed) return;  
        cardEl.dataset.ccsQueued = '1';  
        setTimeout(function () { processCard(cardEl); }, 0);  
    }  
  
    function init() {  
        Lampa.Template.add('card', NEW_CARD_TPL);  
        addStyle(css);  
  
        var observer = new MutationObserver(function (mutations) {  
            for (var i = 0; i < mutations.length; i++) {  
                var added = mutations[i].addedNodes;  
                for (var j = 0; j < added.length; j++) {  
                    var node = added[j];  
                    if (node.nodeType !== 1) continue;  
  
                    if (node.classList.contains('card')) {  
                        // Карточка добавлена в DOM — все onCreate уже отработали  
                        scheduleProcess(node);  
                    } else if (  
                        node.classList.contains('card__type') ||  
                        node.classList.contains('card__quality') ||  
                        node.classList.contains('card__vote')  
                    ) {  
                        // Элемент добавлен сторонним плагином после нашей обработки  
                        relocateLate(node);  
                    } else if (node.querySelectorAll) {  
                        // Контейнер с карточками (список)  
                        var cards = node.querySelectorAll('.card');  
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
