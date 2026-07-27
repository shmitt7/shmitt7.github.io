(function () {  
    'use strict';  
  
    // card__age скрыт — нужен для release.js, но отображаем через бейдж  
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
  
        /* ── скрыть элементы просмотра/эпизодов ── */  
        '.card:not(.card--wide) .card-watched,',  
        '.card:not(.card--wide) .card__new-episode {',  
            'display: none !important;',  
        '}',  
  
        /* ── нижняя панель: без фона, название с объёмной тенью ── */  
        '.ccs__bar {',  
            'position: absolute;',  
            'bottom: 2.2em; left: 0; right: 0;',  
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
  
        /* ── бейдж внизу: год + качество + рейтинг ── */  
        '.ccs__badge {',  
            'position: absolute;',  
            'bottom: 0.4em;',  
            'left: 0.4em;',  
            'right: 0.4em;',  
            'display: flex;',  
            'align-items: center;',  
            'gap: 0.3em;',  
            'z-index: 3;',  
            'pointer-events: none;',  
        '}',  
        '.ccs__badge-year,',  
        '.ccs__badge .card__quality,',  
        '.ccs__badge .card__quality > div,',  
        '.ccs__badge .card__vote {',  
            'position: static !important;',  
            'background: rgba(0,0,0,0.6) !important;',  
            '-webkit-backdrop-filter: blur(4px);',  
            'backdrop-filter: blur(4px);',  
            'padding: 0.25em 0.55em !important;',  
            'border-radius: 0.5em !important;',  
            'font-size: 0.78em !important;',  
            'color: #fff !important;',  
            'font-weight: normal !important;',  
            'text-transform: uppercase;',  
            'left: auto !important;',  
            'right: auto !important;',  
            'bottom: auto !important;',  
            'line-height: 1.4 !important;',  
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
  
    function processCard(cardEl) {  
        if (!cardEl || cardEl.dataset.ccsProcessed) return;  
        cardEl.dataset.ccsProcessed = '1';  
  
        var view   = cardEl.querySelector('.card__view');  
        var badge  = cardEl.querySelector('.ccs__badge');  
        var ageEl  = cardEl.querySelector('.card__age');  
        var typeEl = view && view.querySelector(':scope > .card__type');  
        var qualEl = view && view.querySelector(':scope > .card__quality');  
        var voteEl = view && view.querySelector(':scope > .card__vote');  
  
        // тип (TV/ADULT) — в панель заголовка  
        var bar = cardEl.querySelector('.ccs__bar');  
        if (typeEl && bar) bar.appendChild(typeEl);  
  
        if (badge) {  
            // год  
            var year = ageEl && ageEl.textContent.trim();  
            if (year && year !== '{release_year}') {  
                var yearSpan = document.createElement('span');  
                yearSpan.className = 'ccs__badge-year';  
                yearSpan.textContent = year;  
                badge.appendChild(yearSpan);  
            }  
            // качество (HD/4K)  
            if (qualEl) badge.appendChild(qualEl);  
            // рейтинг  
            if (voteEl) badge.appendChild(voteEl);  
        }  
    }  
  
    function relocateLate(node) {  
        var card = node.closest ? node.closest('.card') : null;  
        if (!card || !card.dataset.ccsProcessed) return;  
        var badge = card.querySelector('.ccs__badge');  
        if (!badge) return;  
        if (node.classList.contains('card__quality') && !badge.contains(node)) {  
            // вставить перед vote если он уже есть  
            var existVote = badge.querySelector('.card__vote');  
            badge.insertBefore(node, existVote || null);  
        } else if (node.classList.contains('card__vote') && !badge.contains(node)) {  
            badge.appendChild(node);  
        }  
    }  
  
    function scheduleProcess(cardEl) {  
        if (!cardEl || cardEl.dataset.ccsQueued || cardEl.dataset.ccsProcessed) return;  
        cardEl.dataset.ccsQueued = '1';  
        setTimeout(function () { processCard(cardEl); }, 0);  
    }  
  
    function init() {  
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
