(function () {  
    'use strict';  
  
    // ─── CSS ──────────────────────────────────────────────────────────────────  
    var style = document.createElement('style');  
    style.textContent = `  
        /* Иконки → правый верхний угол */  
        .card__icons {  
            justify-content: flex-end !important;  
            padding-right: 0.5em;  
        }  
  
        /* Маркер статуса (Смотрю/Просмотрено) → левый верхний угол */  
        .card__marker {  
            top: 0.4em !important;  
            bottom: auto !important;  
        }  
  
        /* Нижняя панель постера */  
        .card__bottom-bar {  
            position: absolute;  
            bottom: 0;  
            left: 0;  
            right: 0;  
            display: flex;  
            align-items: center;  
            justify-content: space-between;  
            padding: 0.4em 0.5em;  
            background: linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 100%);  
            border-bottom-left-radius: 1em;  
            border-bottom-right-radius: 1em;  
            z-index: 2;  
            pointer-events: none;  
            min-height: 2.2em;  
            box-sizing: border-box;  
        }  
        .card__bottom-bar > * {  
            pointer-events: auto;  
        }  
  
        /* Единый стиль для обоих бейджей */  
        .card__badge {  
            background: rgba(0, 0, 0, 0.55);  
            color: #fff;  
            font-size: 0.75em;  
            font-weight: 400;  
            font-family: inherit;  
            padding: 0.2em 0.55em;  
            border-radius: 1em;  
            white-space: nowrap;  
            line-height: 1.4;  
        }  
  
        /* Скрываем оригинальные элементы — данные берём из них, но показываем свои бейджи */  
        .card__type,  
        .card__vote,  
        .card__quality {  
            display: none !important;  
        }  
        .card > .card__age {  
            display: none !important;  
        }  
  
        /* Название → ближе к постеру, по центру */  
        .card__view {  
            margin-bottom: 0.3em !important;  
        }  
        .card__title {  
            text-align: center !important;  
        }  
    `;  
    document.head.appendChild(style);  
  
    // ─── Логика ───────────────────────────────────────────────────────────────  
  
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
  
    function getText(el) {  
        return el ? el.textContent.trim() : '';  
    }  
  
    function fillBar(card) {  
        var view = card.querySelector('.card__view');  
        if (!view) return;  
  
        var bar = getOrCreateBar(card);  
        if (!bar) return;  
  
        var left  = bar.querySelector('.card__bottom-bar-left');  
        var right = bar.querySelector('.card__bottom-bar-right');  
  
        // Читаем данные из оригинальных (скрытых) элементов  
        var typeText    = getText(view.querySelector('.card__type'));  
        var qualityText = getText(view.querySelector('.card__quality'));  
        var voteText    = getText(view.querySelector('.card__vote'));  
        var ageText     = getText(card.querySelector('.card__age'));  
  
        // ── Левый бейдж: TV / MOV ──────────────────────────────────────────  
        var typeBadge = bar.querySelector('.card__badge--type');  
        if (typeText) {  
            if (!typeBadge) {  
                typeBadge = document.createElement('span');  
                typeBadge.className = 'card__badge card__badge--type';  
                left.appendChild(typeBadge);  
            }  
            typeBadge.textContent = typeText;  
        } else if (typeBadge) {  
            typeBadge.remove();  
        }  
  
        // ── Правый бейдж: качество · рейтинг · год ────────────────────────  
        var parts = [qualityText, voteText, ageText].filter(Boolean);  
        var infoBadge = bar.querySelector('.card__badge--info');  
        if (parts.length) {  
            if (!infoBadge) {  
                infoBadge = document.createElement('span');  
                infoBadge.className = 'card__badge card__badge--info';  
                right.appendChild(infoBadge);  
            }  
            infoBadge.textContent = parts.join(' · ');  
        } else if (infoBadge) {  
            infoBadge.remove();  
        }  
    }  
  
    function processCard(card) {  
        if (!card || card._crd_redesign) return;  
        card._crd_redesign = true;  
  
        getOrCreateBar(card);  
        fillBar(card);  
  
        // Следим за добавлением card__type / card__vote / card__quality в view  
        var view = card.querySelector('.card__view');  
        if (view) {  
            new MutationObserver(function () { fillBar(card); })  
                .observe(view, { childList: true });  
        }  
  
        // Следим за изменением текста года  
        var age = card.querySelector('.card__age');  
        if (age) {  
            new MutationObserver(function () { fillBar(card); })  
                .observe(age, { childList: true, characterData: true, subtree: true });  
        }  
    }  
  
    // Следим за появлением новых карточек  
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
