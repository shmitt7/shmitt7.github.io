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
            height: 3.5em;  
            background: linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.78) 100%);  
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
            font-size: 0.75em;  
            font-weight: 600;  
            padding: 0;  
            border-radius: 0;  
            z-index: 2;  
        }  
        .card--tv.card:not(.card--wide) .card__type {  
            background: none;  
            color: rgba(255,255,255,0.95);  
        }  
        .card__bottom-info {  
            position: absolute;  
            right: 0.5em;  
            bottom: 0.5em;  
            display: flex;  
            align-items: center;  
            gap: 0.35em;  
            z-index: 2;  
        }  
        .card__bottom-info .card__quality {  
            position: static;  
            background: none;  
            color: rgba(255,255,255,0.95);  
            font-size: 0.75em;  
            font-weight: 600;  
            padding: 0;  
            border-radius: 0;  
            text-transform: none;  
        }  
        .card__bottom-info .card__quality > div {  
            display: inline;  
        }  
        .card__bottom-info .card__vote {  
            position: static;  
            background: none;  
            color: rgba(255,255,255,0.95);  
            font-size: 0.75em;  
            font-weight: 600;  
            padding: 0;  
            border-radius: 0;  
        }  
        .card__bottom-info .card__age {  
            font-size: 0.75em;  
            font-weight: 600;  
            color: rgba(255,255,255,0.95);  
            margin-top: 0;  
        }  
        .card:not(.card--wide) .card__title {  
            text-align: center;  
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
