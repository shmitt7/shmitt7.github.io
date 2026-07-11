(function(){  
    var PLUGIN_ID = 'clean-poster-plugin';  
    var cardObserver = null;  
  
    // Порядок: тип → качество → рейтинг → год  
    var INFO_ORDER = ['card__type', 'card__quality', 'card__vote', 'card__age'];  
  
    function insertInOrder(cpInfo, node){  
        var nodeOrder = -1;  
        for(var oi = 0; oi < INFO_ORDER.length; oi++){  
            if(node.classList.contains(INFO_ORDER[oi])){ nodeOrder = oi; break; }  
        }  
        if(nodeOrder === -1){ cpInfo.appendChild(node); return; }  
        var children = cpInfo.children;  
        var insertBefore = null;  
        for(var ci = 0; ci < children.length; ci++){  
            var childOrder = -1;  
            for(var oi2 = 0; oi2 < INFO_ORDER.length; oi2++){  
                if(children[ci].classList.contains(INFO_ORDER[oi2])){ childOrder = oi2; break; }  
            }  
            if(childOrder !== -1 && childOrder > nodeOrder){ insertBefore = children[ci]; break; }  
        }  
        if(insertBefore) cpInfo.insertBefore(node, insertBefore);  
        else cpInfo.appendChild(node);  
    }  
  
    function addStyles(){  
        if(document.getElementById(PLUGIN_ID)) return;  
        var style = document.createElement('style');  
        style.id = PLUGIN_ID;  
        style.textContent = [  
            // Иконки — правый верхний угол  
            '.card__view .card__icons{position:absolute!important;top:0.5em!important;right:0.5em!important;left:auto!important;width:auto!important;justify-content:flex-end!important;z-index:3}',  
  
            // Оверлей внизу постера  
            '.cp-overlay{position:absolute;left:0;bottom:0;right:0;padding:2.5em 0.5em 0.5em 0.5em;background:linear-gradient(to bottom,transparent 0%,rgba(0,0,0,0.6) 35%,rgba(0,0,0,0.92) 70%,rgba(0,0,0,0.97) 100%);border-bottom-left-radius:1em;border-bottom-right-radius:1em;z-index:2}',  
  
            // Строка инфо — по левому краю  
            '.cp-info{display:flex;align-items:center;justify-content:flex-start;gap:0.4em;flex-wrap:wrap;min-height:1em}',  
  
            // Тип — красный бейдж  
            '.cp-info .card__type{position:static!important;background:rgba(210,30,30,0.9)!important;color:#fff!important;font-size:0.75em!important;font-weight:700!important;padding:0.15em 0.45em!important;border-radius:0.3em!important;text-transform:uppercase!important;left:auto!important;right:auto!important;top:auto!important;bottom:auto!important;line-height:1.4!important;text-shadow:none!important}',  
  
            // Качество  
            '.cp-info .card__quality{position:static!important;left:auto!important;right:auto!important;top:auto!important;bottom:auto!important;background:none!important;padding:0!important;border-radius:0!important;color:rgba(255,255,255,0.8)!important;font-size:0.85em!important;font-weight:600!important;text-transform:uppercase!important;margin:0!important;text-shadow:0 1px 3px rgba(0,0,0,0.9)!important}',  
            '.cp-info .card__quality>div{display:inline!important}',  
  
            // Рейтинг (иконка KP скрыта)  
            '.cp-info .card__vote{position:static!important;background:none!important;padding:0!important;border-radius:0!important;color:rgba(255,255,255,0.8)!important;font-size:0.85em!important;font-weight:600!important;left:auto!important;right:auto!important;top:auto!important;bottom:auto!important;text-shadow:0 1px 3px rgba(0,0,0,0.9)!important}',  
            '.cp-info .card__vote .source--name{display:none!important}',  
  
            // Год — менее выразительный  
            '.cp-info .card__age{position:static!important;color:rgba(255,255,255,0.55)!important;font-size:0.85em!important;font-weight:400!important;line-height:1!important;margin:0!important;text-shadow:0 1px 3px rgba(0,0,0,0.9)!important;background:none!important;padding:0!important;border-radius:0!important}',  
        ].join('\n');  
        document.head.appendChild(style);  
    }  
  
    function patchTemplate(){  
        // Стандартная структура: title и age — под постером, оверлей — внутри card__view  
        Lampa.Template.add('card',  
            '<div class="card selector layer--visible layer--render">' +  
            '<div class="card__view">' +  
            '<img src="./img/img_load.svg" class="card__img" />' +  
            '<div class="card__icons"><div class="card__icons-inner"></div></div>' +  
            '<div class="cp-overlay"><div class="cp-info"></div></div>' +  
            '</div>' +  
            '<div class="card__title"></div>' +  
            '<div class="card__age"></div>' +  
            '</div>'  
        );  
    }  
  
    function patchModules(){  
        var map = Lampa.Maker.map('Card');  
        if(!map || !map.Card) return;  
  
        // После создания карточки — перемещаем card__age из-под постера в оверлей  
        if(map.Card.onCreate){  
            var origCardOnCreate = map.Card.onCreate;  
            map.Card.onCreate = function(){  
                origCardOnCreate.call(this);  
                var cpInfo = this.html.querySelector('.cp-info');  
                var age = this.html.querySelector('.card__age');  
                // Если год не заполнен шаблонизатором — ставим сами  
                if(age && !age.textContent && this.data && this.data.release_year && this.data.release_year !== '0000'){  
                    age.textContent = this.data.release_year;  
                }  
                if(cpInfo && age && age.textContent) insertInOrder(cpInfo, age);  
            };  
        }  
  
        // Тип и качество — перемещаем в оверлей  
        if(map.Icons && map.Icons.onCreate){  
            var origIconsOnCreate = map.Icons.onCreate;  
            map.Icons.onCreate = function(){  
                origIconsOnCreate.call(this);  
                var cpInfo = this.html.querySelector('.cp-info');  
                var type    = this.html.querySelector('.card__type');  
                var quality = this.html.querySelector('.card__quality');  
                if(type    && cpInfo) insertInOrder(cpInfo, type);  
                if(quality && cpInfo) insertInOrder(cpInfo, quality);  
            };  
        }  
  
        // Рейтинг — перемещаем в оверлей  
        if(map.Ratting && map.Ratting.onCreate){  
            var origRattingOnCreate = map.Ratting.onCreate;  
            map.Ratting.onCreate = function(){  
                origRattingOnCreate.call(this);  
                var cpInfo = this.html.querySelector('.cp-info');  
                var vote   = this.html.querySelector('.card__vote');  
                if(vote && cpInfo) insertInOrder(cpInfo, vote);  
            };  
        }  
    }  
  
    function startObserver(){  
        // Пропускаем элементы, которые не нужно трогать  
        var SKIP = ['card__img','card__marker','card__img-broken','card__icons','cp-overlay','cp-info','card__title'];  
  
        cardObserver = new MutationObserver(function(mutations){  
            var mi, ni, mutation, addedNodes, node, parent, cls, i, found, cpInfo;  
            for(mi = 0; mi < mutations.length; mi++){  
                mutation = mutations[mi];  
                if(mutation.type !== 'childList') continue;  
                addedNodes = mutation.addedNodes;  
                for(ni = 0; ni < addedNodes.length; ni++){  
                    node = addedNodes[ni];  
                    if(node.nodeType !== 1) continue;  
                    parent = node.parentNode;  
                    if(!parent || !parent.classList) continue;  
                    if(!parent.classList.contains('card__view')) continue;  
                    cls = node.classList;  
                    found = false;  
                    for(i = 0; i < SKIP.length; i++){  
                        if(cls.contains(SKIP[i])){ found = true; break; }  
                    }  
                    if(found) continue;  
                    cpInfo = parent.querySelector('.cp-info');  
                    if(!cpInfo) continue;  
                    if(  
                        cls.contains('card__type')    ||  
                        cls.contains('card__quality') ||  
                        cls.contains('card__vote')    ||  
                        cls.contains('card__age')  
                    ){  
                        insertInOrder(cpInfo, node);  
                    }  
                }  
            }  
        });  
  
        cardObserver.observe(document.body, { childList: true, subtree: true });  
  
        Lampa.Listener.follow('app', function(e){  
            if(e.type === 'destroy' && cardObserver){  
                cardObserver.disconnect();  
                cardObserver = null;  
            }  
        });  
    }  
  
    function init(){  
        addStyles();  
        patchTemplate();  
        patchModules();  
        startObserver();  
    }  
  
    if(window.appready) init();  
    else Lampa.Listener.follow('app', function(e){  
        if(e.type == 'ready') init();  
    });  
})();
