(function () {  
    'use strict';  
  
    var NEW_CARD_TPL = '<div class="card selector layer--visible layer--render"><div class="card__view"><img src="./img/img_load.svg" class="card__img" /><div class="card__icons"><div class="card__icons-inner"></div></div><div class="ccs__bar"><div class="card__title">{title}</div></div><div class="card__age" style="display:none"></div><div class="ccs__badge"></div></div></div>';  
  
    var css = [  
        /* ── иконки: правый верх, без фона ── */  
        '.card__icons {',  
            'left: auto !important;',  
            'right: 0.5em !important;',  
            'top: 0.5em !important;',  
            'justify-content: flex-end !important;',  
        '}',  
        '.card__icons-inner {',  
            'background: none !important;',  
            'border-radius: 0 !important;',  
            'gap: 0.25em;',  
        '}',  
        '.card__icon {',  
            'width: 1.8em !important;',  
            'height: 1.8em !important;',  
            'background-size: 72% !important;',  
            'filter: drop-shadow(0 1px 4px rgba(0,0,0,0.9)) drop-shadow(0 0px 1px rgba(0,0,0,0.6)) !important;',  
        '}',  
  
        /* ── скрыть оригинальные quality/vote/type/watched/episode ── */  
        '.card__view > .card__quality,',  
        '.card__view > .card__vote,',  
        '.card:not(.card--wide) .card__type,',  
        '.card:not(.card--wide) .card-watched,',  
        '.card:not(.card--wide) .card__new-episode {',  
            'display: none !important;',  
        '}',  
  
        /* ── нижняя панель: без фона, название с объёмной тенью ── */  
        '.ccs__bar {',  
            'position: absolute;',  
            'bottom: 2em; left: 0; right: 0;',  
            'padding: 0.4em 0.6em 0.3em 0.6em;',  
            'background: none !important;',  
            'z-index: 2;',  
            'pointer-events: none;',  
            'box-sizing: border-box;',  
        '}',  
        '.ccs__bar .card__title {',  
            'font-size: 1.4em !important;',  
            'font-weight: 700 !important;',  
            'line-height: 1.1 !important;',  
            '-webkit-line-clamp: 2 !important;',  
            'line-clamp: 2 !important;',  
            'max-height: 2.2em !important;',  
            'overflow: hidden !important;',  
            'display: -webkit-box !important;',  
            '-webkit-box-orient: vertical !important;',  
            'color: #fff !important;',  
            'margin-bottom: 0 !important;',  
            'transform: none !important;',  
            'text-shadow: 0 1px 1px rgba(0,0,0,0.8), 0 2px 4px rgba(0,0,0,0.6), 0 0 8px rgba(0,0,0,0.5) !important;',  
        '}',  
        '.card--wide .ccs__bar,',  
        '.card--small .ccs__bar {',  
            'display: none;',  
        '}',  
  
        /* ── единый бейдж ── */  
        '.ccs__badge {',  
            'position: absolute;',  
            'bottom: 0.4em;',  
            'left: 0.4em;',  
            'right: 0.4em;',  
            'display: flex;',  
            'align-items: center;',  
            'flex-wrap: nowrap;',  
            'overflow: hidden;',  
            'background: rgba(0,0,0,0.58);',  
            '-webkit-backdrop-filter: blur(4px);',  
            'backdrop-filter: blur(4px);',  
            'border-radius: 0.45em;',  
            'padding: 0.28em 0.6em;',  
            'font-size: 0.78em;',  
            'color: rgba(255,255,255,0.88);',  
            'line-height: 1.4;',  
            'z-index: 3;',  
            'pointer-events: none;',  
            'gap: 0.35em;',  
            'white-space: nowrap;',  
        '}',  
        '.ccs__badge-sep {',  
            'color: rgba(255,255,255,0.3);',  
            'flex-shrink: 0;',  
        '}',  
        '.ccs__badge-genre {',  
            'overflow: hidden;',  
            'text-overflow: ellipsis;',  
            'flex-shrink: 1;',  
            'min-width: 0;',  
        '}',  
        '.ccs__badge-vote {',  
            'font-weight: 700;',  
            'color: #fff;',  
            'flex-shrink: 0;',  
        '}',  
        '.ccs__badge-quality {',  
            'text-transform: uppercase;',  
            'flex-shrink: 0;',  
        '}',  
        '.card--wide .ccs__badge,',  
        '.card--small .ccs__badge {',  
            'display: none;',  
        '}'  
    ].join(' ');  
  
    function addStyle(text) {  
        var el = document.createElement('style');  
        el.id = 'custom-card-style';  
        el.textContent = text;  
        document.head.appendChild(el);  
    }  
  
    function patchTemplate() {  
        var _orig = Lampa.Template.js.bind(Lampa.Template);  
        Lampa.Template.js = function (name, data) {  
            var result = _orig(name, data);  
            if (name === 'card') {  
                // Перехватываем присвоение card_data и дублируем на DOM-элемент  
                Object.defineProperty(result, 'card_data', {  
                    set: function (val) { this[0]._ccs_data = val; },  
                    get: function ()    { return this[0]._ccs_data; },  
                    configurable: true  
                });  
            }  
            return result;  
        };  
    }  
  
    function buildBadge(cardEl) {  
        var badge = cardEl.querySelector('.ccs__badge');  
        if (!badge) return;  
  
        badge.innerHTML = '';  
  
        var parts = [];  
  
        // Год  
        var ageEl = cardEl.querySelector('.card__age');  
        var year = ageEl && ageEl.textContent.trim();  
        if (year) parts.push({ text: year, cls: '' });  
  
        // Жанр (первый) из _ccs_data, сохранённого через patchTemplate  
        var data = cardEl._ccs_data;  
        if (data && data.genres && data.genres.length) {  
            var genreName = data.genres[0].name || '';  
            if (genreName) parts.push({ text: genreName, cls: 'ccs__badge-genre' });  
        }  
  
        // Качество  
        var qualEl = cardEl.querySelector('.card__quality');  
        if (qualEl) {  
            var qualText = (qualEl.querySelector('div') || qualEl).textContent.trim();  
            if (qualText) parts.push({ text: qualText, cls: 'ccs__badge-quality' });  
        }  
  
        // Рейтинг  
        var voteEl = cardEl.querySelector('.card__vote');  
        if (voteEl) {  
            var voteText = voteEl.textContent.trim();  
            if (voteText) parts.push({ text: voteText, cls: 'ccs__badge-vote' });  
        }  
  
        parts.forEach(function (part, i) {  
            if (i > 0) {  
                var sep = document.createElement('span');  
                sep.className = 'ccs__badge-sep';  
                sep.textContent = '·';  
                badge.appendChild(sep);  
            }  
            var span = document.createElement('span');  
            if (part.cls) span.className = part.cls;  
            span.textContent = part.text;  
            badge.appendChild(span);  
        });  
    }  
  
    function processCard(cardEl) {  
        if (!cardEl || cardEl.dataset.ccsProcessed) return;  
        cardEl.dataset.ccsProcessed = '1';  
        buildBadge(cardEl);  
    }  
  
    function relocateLate(node) {  
        var card = node.closest ? node.closest('.card') : null;  
        if (!card || !card.dataset.ccsProcessed) return;  
        buildBadge(card);  
    }  
  
    function scheduleProcess(cardEl) {  
        if (!cardEl || cardEl.dataset.ccsQueued || cardEl.dataset.ccsProcessed) return;  
        cardEl.dataset.ccsQueued = '1';  
        setTimeout(function () { processCard(cardEl); }, 0);  
    }  
  
    function init() {  
        patchTemplate();  
        Lampa.Template.add('card', NEW_CARD_TPL);  
        addStyle(css);  
        var observer = new MutationObserver(function (mutations) {  
            for (var i = 0; i < mutations.length; i++) {  
                var added = mutations[i].addedNodes;  
                for (var j = 0; j < added.length; j++) {  
                    var node = added[j];  
                    if (node.nodeType !== 1) continue;  
                    if (node.classList.contains('card')) {  
                        scheduleProcess(node);  
                    } else if (node.classList.contains('card__quality') || node.classList.contains('card__vote')) {  
                        relocateLate(node);  
                    } else if (node.querySelectorAll) {  
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
