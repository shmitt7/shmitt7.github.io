(function () {  
    'use strict';  
    var css = `  
        .card:not(.card--wide) .card__icons {  
            left: auto;  
            right: 0.5em;  
        }  
        .card:not(.card--wide) .card__view::before {  
            content: '';  
            position: absolute;  
            left: 0;  
            right: 0;  
            bottom: 0;  
            height: 2.5em;  
            background: linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.88) 100%);  
            border-bottom-left-radius: 1em;  
            border-bottom-right-radius: 1em;  
            pointer-events: none;  
            z-index: 1;  
        }  
        .card:not(.card--wide) .card__type {  
            display: none !important;  
        }  
        .card:not(.card--wide) .card__status {  
            position: absolute;  
            top: auto;  
            left: 0.5em;  
            bottom: 0.5em;  
            background: none;  
            padding: 0;  
            border-radius: 0;  
            z-index: 2;  
        }  
        .card:not(.card--wide) .card__status .tvs-icon {  
            font-size: 0.95em;  
            line-height: 1;  
            margin-right: 0.15em;  
        }  
        .card:not(.card--wide) .card__status .tvs-text {  
            font-size: 0.95em;  
            font-weight: 600;  
            color: rgba(255,255,255,0.95);  
            letter-spacing: 0.03em;  
        }  
        .card__bottom-info {  
            position: absolute;  
            right: 0.3em;  
            bottom: 0.5em;  
            display: flex;  
            align-items: baseline;  
            gap: 0.35em;  
            z-index: 2;  
            line-height: 1;  
        }  
        .card__bottom-info .card__quality {  
            position: static;  
            background: none;  
            color: rgba(255,255,255,0.95);  
            font-size: 0.95em;  
            font-weight: 600;  
            padding: 0;  
            border-radius: 0;  
            text-transform: none;  
            line-height: 1;  
        }  
        .card__bottom-info .card__quality > div {  
            display: inline;  
        }  
        .card--tv.card:not(.card--wide) .card__bottom-info .card__quality {  
            display: none !important;  
        }  
        .card__bottom-info .card__vote {  
            position: static;  
            background: none;  
            color: rgba(255,255,255,0.95);  
            font-size: 0.95em;  
            font-weight: 600;  
            padding: 0;  
            border-radius: 0;  
            line-height: 1;  
        }  
        .card__bottom-info .card__age {  
            font-size: 0.95em;  
            font-weight: 600;  
            color: rgba(255,255,255,0.95);  
            margin-top: 0;  
            line-height: 1;  
        }  
        .card:not(.card--wide) .card__title {  
            text-align: center;  
            margin-top: 0.1em;  
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
        var quality = view.querySelector('.card__quality');  
        var vote    = view.querySelector('.card__vote');  
        var age     = card.querySelector('.card__age');  
        if (quality) infoRow.appendChild(quality);  
        if (vote)    infoRow.appendChild(vote);  
        if (age)     infoRow.appendChild(age);  
        if (infoRow.children.length) view.appendChild(infoRow);  
    }  
  
    // Переместить элемент в уже существующий infoRow обработанной карточки  
    function relocateLateElement(node) {  
        var card = node.closest && node.closest('.card');  
        if (!card) return;  
        if (!card.dataset.crlDone) return;  
        if (card.classList.contains('card--wide')) return;  
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
  
                // Новая карточка добавлена в DOM  
                if (node.classList && node.classList.contains('card')) {  
                    setTimeout(function () { processCard(node); }, 0);  
                } else if (node.querySelectorAll) {  
                    node.querySelectorAll('.card').forEach(function (c) {  
                        setTimeout(function () { processCard(c); }, 0);  
                    });  
                }  
  
                // Элемент качества/рейтинга/года добавлен в уже обработанную карточку  
                // (например, другим плагином после того, как processCard уже отработал)  
                if (node.classList) {  
                    if (  
                        node.classList.contains('card__quality') ||  
                        node.classList.contains('card__vote') ||  
                        node.classList.contains('card__age')  
                    ) {  
                        relocateLateElement(node);  
                    }  
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
