(function () {  
    'use strict';  
  
    var style = document.createElement('style');  
    style.textContent = `  
        .card__icons {  
            justify-content: flex-end !important;  
            padding-right: 0.5em;  
        }  
        .card__marker {  
            top: 0.4em !important;  
            bottom: auto !important;  
        }  
        .card__bottom-bar {  
            position: absolute;  
            bottom: 0;  
            left: 0;  
            right: 0;  
            display: flex;  
            align-items: center;  
            justify-content: space-between;  
            padding: 0.4em 0.5em;  
            z-index: 2;  
            pointer-events: none;  
            min-height: 2.2em;  
            box-sizing: border-box;  
        }  
        .card__bottom-bar > * { pointer-events: auto; }  
        .card__bottom-bar-left,  
        .card__bottom-bar-right {  
            display: flex;  
            align-items: center;  
            gap: 0.3em;  
        }  
        .card__badge {  
            background: rgba(0, 0, 0, 0.6);  
            color: #fff;  
            font-size: 0.75em;  
            font-weight: 400;  
            font-family: inherit;  
            padding: 0.2em 0.55em;  
            border-radius: 0.35em;  
            white-space: nowrap;  
            line-height: 1.4;  
        }  
        .card__type,  
        .card__vote,  
        .card__quality {  
            display: none !important;  
        }  
        .card > .card__age {  
            display: none !important;  
        }  
        .card__view {  
            margin-bottom: 0.3em !important;  
        }  
        .card__title {  
            text-align: center !important;  
            -webkit-line-clamp: 4 !important;  
            line-clamp: 4 !important;  
            max-height: 4.8em !important;  
        }  
    `;  
    document.head.appendChild(style);  
  
    function getTextOutsideBar(view, bar, selector) {  
        var all = view.querySelectorAll(selector);  
        var result = '';  
        all.forEach(function (el) {  
            if (!bar.contains(el)) result = el.textContent.trim();  
        });  
        return result;  
    }  
  
    function getOrCreateBar(card) {  
        var view = card.querySelector('.card__view');  
        if (!view) return null;  
  
        var existing = view.querySelector('.card__bottom-bar');  
        if (existing) return existing;  
  
        var bar   = document.createElement('div');  
        var left  = document.createElement('div');  
        var right = document.createElement('div');  
  
        bar.className   = 'card__bottom-bar';  
        left.className  = 'card__bottom-bar-left';  
        right.className = 'card__bottom-bar-right';  
  
        bar.appendChild(left);  
        bar.appendChild(right);  
        view.appendChild(bar);  
  
        return bar;  
    }  
  
    // Устанавливаем textContent только если текст изменился —  
    // это предотвращает бесконечный цикл MutationObserver  
    function setText(el, text) {  
        if (el.textContent !== text) el.textContent = text;  
    }  
  
    function fillBar(card) {  
        var view = card.querySelector('.card__view');  
        if (!view) return;  
  
        var bar = getOrCreateBar(card);  
        if (!bar) return;  
  
        var left  = bar.querySelector('.card__bottom-bar-left');  
        var right = bar.querySelector('.card__bottom-bar-right');  
  
        var typeText    = getTextOutsideBar(view, bar, '.card__type');  
        var qualityText = getTextOutsideBar(view, bar, '.card__quality').toUpperCase();  
        var voteText    = getTextOutsideBar(view, bar, '.card__vote');  
        var ageEl       = card.querySelector('.card__age');  
        var ageText     = ageEl ? ageEl.textContent.trim() : '';  
  
        // Левый бейдж: TV / MOV  
        var typeBadge = bar.querySelector('.card__badge--type');  
        if (typeText) {  
            if (!typeBadge) {  
                typeBadge = document.createElement('span');  
                typeBadge.className = 'card__badge card__badge--type';  
                left.appendChild(typeBadge);  
            }  
            setText(typeBadge, typeText);  
        } else if (typeBadge) {  
            typeBadge.remove();  
        }  
  
        // Правый бейдж: качество · рейтинг · год  
        var parts = [qualityText, voteText, ageText].filter(Boolean);  
        var infoBadge = bar.querySelector('.card__badge--info');  
        if (parts.length) {  
            if (!infoBadge) {  
                infoBadge = document.createElement('span');  
                infoBadge.className = 'card__badge card__badge--info';  
                right.appendChild(infoBadge);  
            }  
            setText(infoBadge, parts.join(' · '));  
        } else if (infoBadge) {  
            infoBadge.remove();  
        }  
    }  
  
    function processCard(card) {  
        if (!card || card._crd_redesign) return;  
        card._crd_redesign = true;  
  
        getOrCreateBar(card);  
        fillBar(card);  
  
        var view = card.querySelector('.card__view');  
        if (view) {  
            new MutationObserver(function () {  
                fillBar(card);  
            }).observe(view, { childList: true, subtree: true });  
        }  
  
        var age = card.querySelector('.card__age');  
        if (age) {  
            new MutationObserver(function () {  
                fillBar(card);  
            }).observe(age, { childList: true, characterData: true, subtree: true });  
        }  
    }  
  
    new MutationObserver(function (mutations) {  
        mutations.forEach(function (m) {  
            m.addedNodes.forEach(function (node) {  
                if (node.nodeType !== 1) return;  
                if (node.classList && node.classList.contains('card')) processCard(node);  
                if (node.querySelectorAll) node.querySelectorAll('.card').forEach(processCard);  
            });  
        });  
    }).observe(document.body, { childList: true, subtree: true });  
  
    document.querySelectorAll('.card').forEach(processCard);  
  
})();
