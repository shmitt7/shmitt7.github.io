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
            height: 4.2em;  
            background: linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.88) 100%);  
            border-bottom-left-radius: 1em;  
            border-bottom-right-radius: 1em;  
            pointer-events: none;  
            z-index: 1;  
        }  
        .card:not(.card--wide) .card__type {  
            position: absolute;  
            left: 0.5em;  
            top: auto;  
            bottom: 0.5em;  
            background: none;  
            color: rgba(255,255,255,0.95);  
            font-size: 0.95em;  
            font-weight: 600;  
            padding: 0;  
            border-radius: 0;  
            line-height: 1;  
            z-index: 2;  
        }  
        .card--tv.card:not(.card--wide) .card__type {  
            background: none;  
            color: rgba(255,255,255,0.95);  
        }  
        .card:not(.card--wide) .card__type--movie {  
            background: none !important;  
            color: rgba(255,255,255,0.95) !important;  
        }  
        .card:not(.card--wide) .card__status {  
            top: auto;  
            left: 0.5em;  
            bottom: 1.5em;  
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
        .card__top-info {  
            position: absolute;  
            right: 0.3em;  
            bottom: 1.5em;  
            display: flex;  
            align-items: baseline;  
            gap: 0.35em;  
            z-index: 2;  
            line-height: 1;  
        }  
        .card__top-info .card__quality {  
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
        .card__top-info .card__quality > div {  
            display: inline;  
        }  
        .card__top-info .card__vote {  
            position: static;  
            background: none;  
            color: rgba(255,255,255,0.95);  
            font-size: 0.95em;  
            font-weight: 600;  
            padding: 0;  
            border-radius: 0;  
            line-height: 1;  
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
        var topRow = document.createElement('div');  
        topRow.className = 'card__top-info';  
        var bottomRow = document.createElement('div');  
        bottomRow.className = 'card__bottom-info';  
        var quality = view.querySelector('.card__quality');  
        var vote    = view.querySelector('.card__vote');  
        var age     = card.querySelector('.card__age');  
        if (quality) topRow.appendChild(quality);  
        if (vote)    topRow.appendChild(vote);  
        if (age)     bottomRow.appendChild(age);  
        if (topRow.children.length) view.appendChild(topRow);  
        if (bottomRow.children.length) view.appendChild(bottomRow);  
    }  
    var observer = new MutationObserver(function (mutations) {  
        mutations.forEach(function (mutation) {  
            mutation.addedNodes.forEach(function (node) {  
                if (node.nodeType !== 1) return;  
                if (node.classList && node.classList.contains('card')) {  
                    setTimeout(function () { processCard(node); }, 0);  
                }  
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
