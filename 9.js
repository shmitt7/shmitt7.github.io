(function () {  
    'use strict';  
  
    // ── 1. CSS-переопределения ────────────────────────────────────────────────  
    var css = `  
        /* 1. Иконки закладок/просмотра → правый верхний угол постера */  
        .card:not(.card--wide) .card__icons {  
            left: auto;  
            right: 0.5em;  
        }  
  
        /* 2. Бейдж TV/MOV → левый нижний угол постера */  
        .card:not(.card--wide) .card__type {  
            left: 0.5em;  
            top: auto;  
            bottom: 0.5em;  
        }  
  
        /* 3. Контейнер строки: качество + рейтинг + год → правый нижний угол */  
        .card__bottom-info {  
            position: absolute;  
            right: 0.5em;  
            bottom: 0.5em;  
            display: flex;  
            align-items: center;  
            gap: 0.3em;  
            z-index: 1;  
        }  
  
        /* Сбрасываем абсолютное позиционирование у перемещённых элементов */  
        .card__bottom-info .card__quality {  
            position: static;  
        }  
        .card__bottom-info .card__vote {  
            position: static;  
        }  
  
        /* Год внутри постера */  
        .card__bottom-info .card__age {  
            font-size: 0.75em;  
            color: rgba(255, 255, 255, 0.9);  
            margin-top: 0;  
        }  
  
        /* 4. Название → по центру (год убран из потока, поэтому само поднимается) */  
        .card:not(.card--wide) .card__title {  
            text-align: center;  
        }  
    `;  
  
    var style = document.createElement('style');  
    style.textContent = css;  
    document.head.appendChild(style);  
  
    // ── 2. JS: перемещение .card__age внутрь постера ─────────────────────────  
    function processCard(card) {  
        // Пропускаем уже обработанные и широкие карточки  
        if (card.dataset.crlDone) return;  
        if (card.classList.contains('card--wide')) return;  
        card.dataset.crlDone = '1';  
  
        var view = card.querySelector('.card__view');  
        if (!view) return;  
  
        var infoRow = document.createElement('div');  
        infoRow.className = 'card__bottom-info';  
  
        // Перемещаем элементы в строку (порядок: качество → рейтинг → год)  
        var quality = view.querySelector('.card__quality');  
        var vote    = view.querySelector('.card__vote');  
        var age     = card.querySelector('.card__age'); // вне view — ищем в card  
  
        if (quality) infoRow.appendChild(quality);  
        if (vote)    infoRow.appendChild(vote);  
        if (age)     infoRow.appendChild(age);  
  
        if (infoRow.children.length) view.appendChild(infoRow);  
    }  
  
    // ── 3. MutationObserver: следим за появлением карточек ───────────────────  
    var observer = new MutationObserver(function (mutations) {  
        mutations.forEach(function (mutation) {  
            mutation.addedNodes.forEach(function (node) {  
                if (node.nodeType !== 1) return;  
  
                // Сама карточка  
                if (node.classList && node.classList.contains('card')) {  
                    // setTimeout(0): ждём, пока модули карточки добавят vote/quality  
                    setTimeout(function () { processCard(node); }, 0);  
                }  
  
                // Карточки внутри добавленного блока (например, целая лента)  
                if (node.querySelectorAll) {  
                    node.querySelectorAll('.card').forEach(function (c) {  
                        setTimeout(function () { processCard(c); }, 0);  
                    });  
                }  
            });  
        });  
    });  
  
    function start() {  
        observer.observe(document.body, { childList: true, subtree: true });  
    }  
  
    if (document.body) start();  
    else document.addEventListener('DOMContentLoaded', start);  
  
})();
