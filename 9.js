(function () {  
    'use strict';  
    var css = `  
        /* Иконки — правый верхний угол */  
        .card:not(.card--wide) .card__icons {  
            left: auto;  
            right: 0.5em;  
            top: 0.5em;  
        }  
  
        /* Убираем нижнее затемнение */  
        .card:not(.card--wide) .card__view::before {  
            display: none !important;  
        }  
  
        /* Тип — скрыт */  
        .card:not(.card--wide) .card__type {  
            display: none !important;  
        }  
  
        /* Статус — левый верхний угол, на одном уровне с иконками */  
        .card:not(.card--wide) .card__status {  
            position: absolute;  
            top: 0.5em;  
            left: 0.5em;  
            bottom: auto;  
            background: none;  
            padding: 0;  
            border-radius: 0;  
            z-index: 2;  
        }  
        .card:not(.card--wide) .card__status .tvs-icon {  
            font-size: 0.9em;  
            line-height: 1;  
            margin-right: 0.1em;  
        }  
        .card:not(.card--wide) .card__status .tvs-text {  
            font-size: 0.9em;  
            font-weight: 700;  
            color: #fff;  
            letter-spacing: 0.03em;  
            text-shadow: 0 1px 4px rgba(0,0,0,1), 0 0 8px rgba(0,0,0,0.9);  
        }  
  
        /* Блок с рейтингом — правый нижний угол */  
        .card__bottom-info {  
            position: absolute;  
            right: 0.4em;  
            bottom: 0.4em;  
            display: flex;  
            align-items: baseline;  
            z-index: 2;  
            line-height: 1;  
        }  
  
        /* Рейтинг — крупнее, объёмный текст */  
        .card__bottom-info .card__vote {  
            position: static;  
            background: none;  
            color: #fff;  
            font-size: 1.15em;  
            font-weight: 700;  
            padding: 0;  
            border-radius: 0;  
            line-height: 1;  
            text-shadow:  
                0 1px 4px rgba(0,0,0,1),  
                0 0 10px rgba(0,0,0,0.9),  
                1px 1px 0 rgba(0,0,0,0.8);  
        }  
  
        /* Качество и год — скрыты */  
        .card__bottom-info .card__quality,  
        .card__bottom-info .card__age {  
            display: none !important;  
        }  
  
        /* Название под постером — скрыто */  
        .card:not(.card--wide) .card__title {  
            display: none !important;  
        }  
    `;  
    var style = document.createElement('style');  
    style.textContent = css;  
    document.head.appendChild(style);  
  
    function processCard(card) {  
        if (card.dataset.crlDone) return;  
        if (card.classList.contains('card--wide')) return;  
        card.dataset.crlDone = '1';  
        var view = card.querySelector('.card__view');  
        if (!view) return;  
        var infoRow = document.createElement('div');  
        infoRow.className = 'card__bottom-info';  
        var vote = view.querySelector('.card__vote');  
        if (vote) infoRow.appendChild(vote);  
        if (infoRow.children.length) view.appendChild(infoRow);  
    }  
  
    function relocateLateElement(node) {  
        if (node.closest && node.closest('.card__bottom-info')) return;  
        var card = node.closest && node.closest('.card');  
        if (!card) return;  
        if (!card.dataset.crlDone) return;  
        if (card.classList.contains('card--wide')) return;  
        if (!node.classList.contains('card__vote')) return;  
        var view = card.querySelector('.card__view');  
        if (!view) return;  
        var infoRow = view.querySelector('.card__bottom-info');  
        if (!infoRow) {  
            infoRow = document.createElement('div');  
            infoRow.className = 'card__bottom-info';  
            view.appendChild(infoRow);  
        }  
        infoRow.appendChild(node);  
    }  
  
    function scanExisting() {  
        document.querySelectorAll('.card').forEach(function (c) {  
            processCard(c);  
        });  
    }  
  
    var observer = new MutationObserver(function (mutations) {  
        mutations.forEach(function (mutation) {  
            mutation.addedNodes.forEach(function (node) {  
                if (node.nodeType !== 1) return;  
  
                if (node.classList && node.classList.contains('card')) {  
                    setTimeout(function () { processCard(node); }, 0);  
                } else if (node.querySelectorAll) {  
                    node.querySelectorAll('.card').forEach(function (c) {  
                        setTimeout(function () { processCard(c); }, 0);  
                    });  
                }  
  
                if (node.classList && node.classList.contains('card__vote')) {  
                    relocateLateElement(node);  
                }  
            });  
        });  
    });  
  
    function start() {  
        observer.observe(document.body, { childList: true, subtree: true });  
        scanExisting();  
    }  
  
    if (window.Lampa && Lampa.Listener) {  
        Lampa.Listener.follow('app', function (e) {  
            if (e.type === 'ready') scanExisting();  
        });  
    }  
  
    if (document.body) start();  
    else document.addEventListener('DOMContentLoaded', start);  
})();
