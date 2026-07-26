(function () {  
    'use strict';  
  
    var NEW_CARD_TPL = `<div class="card selector layer--visible layer--render">  
        <div class="card__view">  
            <img src="./img/img_load.svg" class="card__img" />  
            <div class="card__icons"><div class="card__icons-inner"></div></div>  
            <div class="ccs__bar">  
                <div class="card__title">{title}</div>  
                <div class="ccs__row">  
                    <div class="ccs__left">  
                        <div class="card__age">{release_year}</div>  
                    </div>  
                    <div class="ccs__right"></div>  
                </div>  
            </div>  
        </div>  
    </div>`;  
  
    var css = `  
        .ccs__bar {  
            position: absolute;  
            bottom: 0; left: 0; right: 0;  
            padding: 0.5em;  
            background: linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.85) 100%);  
            border-bottom-left-radius: 1em;  
            border-bottom-right-radius: 1em;  
            z-index: 2;  
            pointer-events: none;  
            box-sizing: border-box;  
        }  
  
        .ccs__bar .card__title {  
            -webkit-line-clamp: 2 !important;  
            line-clamp: 2 !important;  
            max-height: 2.4em !important;  
            overflow: hidden !important;  
            display: -webkit-box !important;  
            -webkit-box-orient: vertical !important;  
            color: #fff;  
            margin-bottom: 0.4em;  
            line-height: 1.2;  
            font-size: 1em;  
        }  
  
        .ccs__row {  
            display: flex;  
            justify-content: space-between;  
            align-items: center;  
        }  
  
        .ccs__left, .ccs__right {  
            display: flex;  
            align-items: center;  
            gap: 0.3em;  
            font-size: 0.8em;  
            line-height: 1;  
            color: rgba(255,255,255,0.92);  
        }  
  
        /* Сбрасываем стили элементов которые перемещаются в панель */  
        .ccs__bar .card__age {  
            position: static !important;  
            font-size: 1em !important;  
            margin-top: 0 !important;  
            transform: none !important;  
        }  
  
        .ccs__bar .card__type {  
            position: static !important;  
            left: auto !important;  
            top: auto !important;  
            font-size: 1em !important;  
        }  
  
        .ccs__bar .card__quality {  
            position: static !important;  
            left: auto !important;  
            bottom: auto !important;  
            font-size: 1em !important;  
        }  
  
        .ccs__bar .card__vote {  
            position: static !important;  
            right: auto !important;  
            bottom: auto !important;  
            font-size: 1em !important;  
            background: none !important;  
            padding: 0 !important;  
            border-radius: 0 !important;  
        }  
    `;  
  
    function addStyle(text) {  
        var el = document.createElement('style');  
        el.id = 'custom-card-style';  
        el.textContent = text;  
        document.head.appendChild(el);  
    }  
  
    // Перемещаем элемент в нужный контейнер карточки  
    function relocate(node) {  
        var card = node.closest ? node.closest('.card') : null;  
        if (!card) return;  
  
        if (node.classList.contains('card__type')) {  
            var left = card.querySelector('.ccs__left');  
            if (left && !left.contains(node)) left.appendChild(node);  
  
        } else if (node.classList.contains('card__quality') || node.classList.contains('card__vote')) {  
            var right = card.querySelector('.ccs__right');  
            if (right && !right.contains(node)) {  
                // качество — перед рейтингом  
                var vote = right.querySelector('.card__vote');  
                right.insertBefore(node, vote || null);  
            }  
        }  
    }  
  
    function init() {  
        // Переопределяем шаблон — title и age теперь сразу внутри .card__view  
        Lampa.Template.add('card', NEW_CARD_TPL);  
  
        addStyle(css);  
  
        // MutationObserver только для динамически добавляемых элементов  
        var observer = new MutationObserver(function (mutations) {  
            for (var i = 0; i < mutations.length; i++) {  
                var added = mutations[i].addedNodes;  
                for (var j = 0; j < added.length; j++) {  
                    var node = added[j];  
                    if (node.nodeType !== 1) continue;  
  
                    if (  
                        node.classList.contains('card__type') ||  
                        node.classList.contains('card__quality') ||  
                        node.classList.contains('card__vote')  
                    ) {  
                        relocate(node);  
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
