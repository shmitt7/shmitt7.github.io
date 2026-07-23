(function () {  
    'use strict';  
  
    var css = `  
        /* 1. Иконки — правый верхний угол */  
        .card:not(.card--wide) .card__icons {  
            left: auto;  
            right: 0.5em;  
            justify-content: flex-end;  
        }  
  
        /* 5. Убираем тип контента (TV/MOV) */  
        .card:not(.card--wide) .card__type {  
            display: none !important;  
        }  
  
        /* 8. Скрываем название и год под постером */  
        .card:not(.card--wide) .card__title,  
        .card:not(.card--wide) .card__age {  
            display: none;  
        }  
  
        /* 7. Затемнение снизу ~2.5 строки */  
        .card:not(.card--wide) .card__view::before {  
            content: '';  
            position: absolute;  
            left: 0;  
            right: 0;  
            bottom: 0;  
            height: 4.5em;  
            background: linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.88) 100%);  
            border-bottom-left-radius: 1em;  
            border-bottom-right-radius: 1em;  
            pointer-events: none;  
            z-index: 1;  
        }  
  
        /* Скрываем оригинальные vote и quality — они переедут в наш контейнер */  
        .card:not(.card--wide) .card__vote,  
        .card:not(.card--wide) .card__quality {  
            display: none !important;  
        }  
  
        /* 2. Маркер статуса — нижняя строка слева, без фона */  
        .card:not(.card--wide) .card__marker {  
            left: 0.5em;  
            bottom: 0.5em;  
            background: none;  
            padding: 0;  
            padding-right: 0;  
            border-radius: 0;  
            z-index: 3;  
        }  
        .card:not(.card--wide) .card__marker::before {  
            width: 0.55em;  
            height: 0.55em;  
            margin-right: 0.3em;  
        }  
        .card:not(.card--wide) .card__marker > span {  
            font-size: 0.85em;  
            font-weight: 600;  
            color: rgba(255,255,255,0.95);  
            max-width: 7em;  
            white-space: nowrap;  
            overflow: hidden;  
            text-overflow: ellipsis;  
        }  
  
        /* Наш контейнер с инфо поверх постера */  
        .crl-info {  
            position: absolute;  
            left: 0;  
            right: 0;  
            bottom: 0;  
            z-index: 2;  
            pointer-events: none;  
        }  
        .crl-row {  
            display: flex;  
            align-items: center;  
            padding: 0 0.5em;  
            line-height: 1;  
        }  
        /* 3+4. Строка: качество · рейтинг — справа */  
        .crl-row--top {  
            justify-content: flex-end;  
            padding-bottom: 0.3em;  
        }  
        /* 2. Строка: статус (через .card__marker CSS) | год — справа */  
        .crl-row--bottom {  
            justify-content: flex-end;  
            padding-bottom: 0.5em;  
        }  
        /* 6. Единый стиль текста */  
        .crl-text {  
            font-size: 0.85em;  
            font-weight: 600;  
            color: rgba(255,255,255,0.95);  
            line-height: 1;  
        }  
        .crl-sep {  
            font-size: 0.85em;  
            color: rgba(255,255,255,0.45);  
            margin: 0 0.25em;  
            line-height: 1;  
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
  
        // Год — берём из .card__age (он скрыт CSS, но textContent доступен)  
        var ageEl = card.querySelector('.card__age');  
        var releaseYear = ageEl ? ageEl.textContent.trim() : '';  
        if (releaseYear === '0000') releaseYear = '';  
  
        // Рейтинг  
        var voteEl = view.querySelector('.card__vote');  
        var voteText = voteEl ? voteEl.textContent.trim() : '';  
  
        // Качество  
        var qualityEl = view.querySelector('.card__quality');  
        var qualityText = '';  
        if (qualityEl) {  
            var qInner = qualityEl.querySelector('div');  
            qualityText = qInner ? qInner.textContent.trim() : qualityEl.textContent.trim();  
        }  
  
        var info = document.createElement('div');  
        info.className = 'crl-info';  
  
        // Строка верхняя: качество · рейтинг (справа)  
        if (qualityText || voteText) {  
            var rowTop = document.createElement('div');  
            rowTop.className = 'crl-row crl-row--top';  
  
            if (qualityText) {  
                var qSpan = document.createElement('span');  
                qSpan.className = 'crl-text';  
                qSpan.textContent = qualityText;  
                rowTop.appendChild(qSpan);  
            }  
  
            if (qualityText && voteText) {  
                var sep = document.createElement('span');  
                sep.className = 'crl-sep';  
                sep.textContent = '·';  
                rowTop.appendChild(sep);  
            }  
  
            if (voteText) {  
                var vSpan = document.createElement('span');  
                vSpan.className = 'crl-text';  
                vSpan.textContent = voteText;  
                rowTop.appendChild(vSpan);  
            }  
  
            info.appendChild(rowTop);  
        }  
  
        // Строка нижняя: год справа (статус слева — .card__marker через CSS)  
        if (releaseYear) {  
            var rowBottom = document.createElement('div');  
            rowBottom.className = 'crl-row crl-row--bottom';  
  
            var yearSpan = document.createElement('span');  
            yearSpan.className = 'crl-text';  
            yearSpan.textContent = releaseYear;  
            rowBottom.appendChild(yearSpan);  
  
            info.appendChild(rowBottom);  
        }  
  
        view.appendChild(info);  
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
