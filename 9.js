(function () {  
    'use strict';  
  
    // ─── CSS ──────────────────────────────────────────────────────────────────  
    var style = document.createElement('style');  
    style.textContent = `  
        /* 1. Иконки закладок/просмотра → правый верхний угол */  
        .card__icons {  
            justify-content: flex-end !important;  
            padding-right: 0.5em;  
        }  
  
        /* Маркер статуса (Смотрю/Просмотрено) → левый верхний угол */  
        .card__marker {  
            top: 0.4em !important;  
            bottom: auto !important;  
        }  
  
        /* 2. Нижняя панель постера */  
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
        .card__bottom-bar-left {  
            display: flex;  
            align-items: center;  
        }  
        .card__bottom-bar-right {  
            display: flex;  
            align-items: center;  
            gap: 0.3em;  
        }  
  
        /* Сбрасываем абсолютное позиционирование перемещённых элементов */  
        .card__bottom-bar .card__type {  
            position: static !important;  
            font-size: 0.75em;  
        }  
        .card__bottom-bar .card__vote {  
            position: static !important;  
            font-size: 0.9em !important;  
            padding: 0.15em 0.4em !important;  
        }  
        .card__bottom-bar .card__quality {  
            position: static !important;  
            font-size: 0.75em;  
            bottom: auto !important;  
            left: auto !important;  
        }  
  
        /* Год внутри постера */  
        .card__age-in-poster {  
            background: rgba(0, 0, 0, 0.5);  
            color: #fff;  
            font-size: 0.75em;  
            padding: 0.2em 0.5em;  
            border-radius: 1em;  
            white-space: nowrap;  
        }  
  
        /* Скрываем оригинальный год под постером */  
        .card > .card__age {  
            display: none !important;  
        }  
  
        /* 3. Название → ближе к постеру, по центру */  
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
  
    function fillBar(card) {  
        var view = card.querySelector('.card__view');  
        if (!view) return;  
  
        var bar   = getOrCreateBar(card);  
        if (!bar) return;  
  
        var left  = bar.querySelector('.card__bottom-bar-left');  
        var right = bar.querySelector('.card__bottom-bar-right');  
  
        // TV badge → левая часть  
        var type = view.querySelector('.card__type');  
        if (type && !bar.contains(type)) {  
            left.appendChild(type);  
        }  
  
        // Качество → правая часть (первым)  
        var quality = view.querySelector('.card__quality');  
        if (quality && !bar.contains(quality)) {  
            right.appendChild(quality);  
        }  
  
        // Рейтинг → правая часть  
        var vote = view.querySelector('.card__vote');  
        if (vote && !bar.contains(vote)) {  
            right.appendChild(vote);  
        }  
  
        // Год → правая часть (копируем из .card__age под постером)  
        var age = card.querySelector('.card__age');  
        if (age && age.textContent.trim() && !bar.querySelector('.card__age-in-poster')) {  
            var agePoster = document.createElement('span');  
            agePoster.className = 'card__age-in-poster';  
            agePoster.textContent = age.textContent.trim();  
            right.appendChild(agePoster);  
        }  
    }  
  
    function processCard(card) {  
        if (!card || card._crd_redesign) return;  
        card._crd_redesign = true;  
  
        // Создаём панель сразу  
        getOrCreateBar(card);  
        fillBar(card);  
  
        // Наблюдаем за добавлением элементов в .card__view  
        // (card__type, card__vote, card__quality добавляются позже через модули)  
        var view = card.querySelector('.card__view');  
        if (view) {  
            var viewObs = new MutationObserver(function () {  
                fillBar(card);  
            });  
            viewObs.observe(view, { childList: true });  
        }  
  
        // Наблюдаем за изменением текста года  
        var age = card.querySelector('.card__age');  
        if (age) {  
            var ageObs = new MutationObserver(function () {  
                var agePoster = card.querySelector('.card__age-in-poster');  
                if (agePoster) agePoster.textContent = age.textContent.trim();  
            });  
            ageObs.observe(age, { childList: true, characterData: true, subtree: true });  
        }  
    }  
  
    // Наблюдаем за появлением новых карточек в DOM  
    var bodyObs = new MutationObserver(function (mutations) {  
        mutations.forEach(function (m) {  
            m.addedNodes.forEach(function (node) {  
                if (node.nodeType !== 1) return;  
                if (node.classList && node.classList.contains('card')) {  
                    processCard(node);  
                }  
                if (node.querySelectorAll) {  
                    node.querySelectorAll('.card').forEach(processCard);  
                }  
            });  
        });  
    });  
  
    bodyObs.observe(document.body, { childList: true, subtree: true });  
  
    // Обрабатываем карточки, которые уже есть в DOM  
    document.querySelectorAll('.card').forEach(processCard);  
  
})();
