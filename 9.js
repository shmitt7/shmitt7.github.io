(function(){  
    'use strict'  
  
    var PLUGIN_ID = 'clean-poster-plugin'  
    var cleanPosterCache = {}  
  
    function addStyles(){  
        if(document.getElementById(PLUGIN_ID)) return  
        var style = document.createElement('style')  
        style.id = PLUGIN_ID  
        style.textContent = [  
            /* Убираем отступ снизу карточки */  
            '.card__view { margin-bottom: 0 !important; }',  
  
            /* Иконки — верхний правый угол */  
            '.card__view .card__icons {',  
            '    position: absolute !important;',  
            '    top: 0.5em !important;',  
            '    right: 0.5em !important;',  
            '    left: auto !important;',  
            '    width: auto !important;',  
            '    z-index: 3;',  
            '}',  
  
            /* Градиентный оверлей снизу */  
            '.cp-overlay {',  
            '    position: absolute; left: 0; bottom: 0; right: 0;',  
            '    padding: 2em 0.7em 0.6em;',  
            '    background: linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.9) 100%);',  
            '    border-bottom-left-radius: 1em;',  
            '    border-bottom-right-radius: 1em;',  
            '    z-index: 2;',  
            '}',  
  
            /* Строка 1: качество */  
            '.cp-row1 {',  
            '    margin-bottom: 0.25em;',  
            '    min-height: 1em;',  
            '}',  
  
            /* Сброс позиционирования quality в строке 1 */  
            '.cp-row1 .card__quality {',  
            '    position: static !important;',  
            '    left: auto !important; right: auto !important;',  
            '    top: auto !important; bottom: auto !important;',  
            '    background: none !important;',  
            '    padding: 0 !important;',  
            '    border-radius: 0 !important;',  
            '    color: rgba(255,255,255,0.75) !important;',  
            '    font-size: 0.8em !important;',  
            '    font-weight: 600 !important;',  
            '    text-transform: uppercase !important;',  
            '}',  
            '.cp-row1 .card__quality > div { display: inline !important; }',  
  
            /* Строка 2: название */  
            '.cp-overlay .card__title {',  
            '    color: #fff;',
            '    font-weight: 700 !important;',
            '    font-size: 1.2em;',  
            '    line-height: 1.2;',  
            '    max-height: 3.6em;',  
            '    overflow: hidden;',  
            '    display: -webkit-box;',  
            '    -webkit-line-clamp: 3;',  
            '    -webkit-box-orient: vertical;',  
            '    margin-bottom: 0.3em;',  
            '    word-break: break-word;',  
            '}',  
  
            /* Строка 3: год + TV слева, рейтинг справа */  
            '.cp-bottom {',  
            '    display: flex;',  
            '    align-items: center;',  
            '    line-height: 1;',  
            '    gap: 0.4em;',  
            '}',  
  
            /* Сброс стилей для всех элементов в нижней строке */  
            '.cp-bottom .card__age,',  
            '.cp-bottom .card__type,',  
            '.card--tv .cp-bottom .card__type,',  
            '.card--movie .cp-bottom .card__type,',  
            '.cp-bottom .card__vote {',  
            '    position: static !important;',  
            '    background: none !important;',  
            '    padding: 0 !important;',  
            '    border-radius: 0 !important;',  
            '    color: rgba(255,255,255,0.85) !important;',  
            '    font-size: 0.85em !important;',  
            '    font-weight: 600 !important;',  
            '    line-height: 1 !important;',  
            '    vertical-align: middle !important;',  
            '    left: auto !important; right: auto !important;',  
            '    top: auto !important; bottom: auto !important;',  
            '}',  
  
            /* Рейтинг — прижат вправо */  
            '.cp-bottom .card__vote {',  
            '    margin-left: auto !important;',  
            '}',  
            '.cp-bottom .card__age { margin-top: 0 !important; }',
            /* Маркер (просмотрено/запланировано) — поверх всего */  
            '.card__marker { z-index: 3 !important; }', 
            '.cp-overlay .card__title { text-shadow: 0 1px 4px rgba(0,0,0,1), 0 0 8px rgba(0,0,0,1) !important; }',  
            '.cp-bottom { text-shadow: 0 1px 3px rgba(0,0,0,1) !important; }',  
            '.cp-row1 { text-shadow: 0 1px 3px rgba(0,0,0,1) !important; }'
        ].join('\n')  
        document.head.appendChild(style)  
    }  
  
    function patchTemplate(){  
        Lampa.Template.add('card', [  
            '<div class="card selector layer--visible layer--render">',  
            '    <div class="card__view">',  
            '        <img src="./img/img_load.svg" class="card__img" />',  
            '        <div class="card__icons">',  
            '            <div class="card__icons-inner"></div>',  
            '        </div>',  
            '        <div class="cp-overlay">',  
            '            <div class="cp-row1"></div>',  
            '            <div class="card__title"></div>',  
            '            <div class="cp-bottom">',  
            '                <div class="card__age"></div>',  
            '            </div>',  
            '        </div>',  
            '    </div>',  
            '</div>'  
        ].join(''))  
    }  
  
    function patchModules(){  
        var map = Lampa.Maker.map('Card')  
  
        if(!map || !map.Card){  
            console.warn('[CleanPoster] Lampa.Maker.map("Card") недоступен')  
            return  
        }  
  
        // Icons.onCreate: quality → cp-row1, type → cp-bottom после года  
        var orig_icons_onCreate = map.Icons.onCreate  
        map.Icons.onCreate = function(){  
            orig_icons_onCreate.call(this)  
            try {  
                var bottom = this.html.querySelector('.cp-bottom')  
                var row1   = this.html.querySelector('.cp-row1')  
                var age    = bottom ? bottom.querySelector('.card__age') : null  
  
                // Качество — в первую строку  
                var quality = this.html.querySelector('.card__quality')  
                if(quality && row1) row1.appendChild(quality)  
  
                // Тип (TV) — в нижнюю строку после года  
                var type = this.html.querySelector('.card__type')  
                if(type && bottom && age) bottom.insertBefore(type, age.nextSibling)  
            }  
            catch(e){ console.warn('[CleanPoster] Icons.onCreate:', e) }  
        }  
  
        // Ratting.onCreate: vote → cp-bottom последним (прижат вправо)  
        var orig_ratting_onCreate = map.Ratting.onCreate  
        map.Ratting.onCreate = function(){  
            orig_ratting_onCreate.call(this)  
            try {  
                var bottom = this.html.querySelector('.cp-bottom')  
                var vote   = this.html.querySelector('.card__vote')  
                if(vote && bottom) bottom.appendChild(vote)  
            }  
            catch(e){ console.warn('[CleanPoster] Ratting.onCreate:', e) }  
        }  
  
        // Card.onVisible: загружаем чистый постер с TMDB  
        var orig_card_onVisible = map.Card.onVisible  
        map.Card.onVisible = function(){  
            orig_card_onVisible.call(this)  
  
            var self = this  
            var data = this.data  
            var id   = data.id  
            var type = data.original_name ? 'tv' : 'movie'  
  
            if(!id) return  
  
            if(cleanPosterCache[id] !== undefined){  
                if(cleanPosterCache[id]) self.img.src = cleanPosterCache[id]  
                return  
            }  
  
            cleanPosterCache[id] = null  
  
            var posterSize = Lampa.Storage.field('poster_size') || 'w300'  
            var url = Lampa.TMDB.api(  
                type + '/' + id +  
                '/images?include_image_language=null&api_key=' + Lampa.TMDB.key()  
            )  
  
            new Lampa.Reguest().silent(url, function(images){  
                var posters = (images && Array.isArray(images.posters)) ? images.posters : []  
                var clean = null  
                for(var i = 0; i < posters.length; i++){  
                    if(posters[i].iso_639_1 === null){ clean = posters[i]; break }  
                }  
                if(clean){  
                    var src = Lampa.TMDB.image('t/p/' + posterSize + clean.file_path)  
                    cleanPosterCache[id] = src  
                    if(self.img) self.img.src = src  
                } else {  
                    cleanPosterCache[id] = ''  
                }  
            }, function(){  
                cleanPosterCache[id] = ''  
            })  
        }  
    }  
  
    // MutationObserver — для внешних плагинов (content labels и др.)  
    function startObserver(){  
        var SKIP = ['cp-overlay', 'card__img', 'card__marker', 'card__img-broken', 'card__icons']  
  
        var observer = new MutationObserver(function(mutations){  
            mutations.forEach(function(mutation){  
                if(mutation.type !== 'childList') return  
  
                mutation.addedNodes.forEach(function(node){  
                    if(node.nodeType !== 1) return  
  
                    var parent = node.parentNode  
                    if(!parent || !parent.classList) return  
                    if(!parent.classList.contains('card__view')) return  
  
                    var cls = node.classList  
                    for(var i = 0; i < SKIP.length; i++){  
                        if(cls.contains(SKIP[i])) return  
                    }  
  
                    var row1   = parent.querySelector('.cp-row1')  
                    var bottom = parent.querySelector('.cp-bottom')  
                    var age    = bottom ? bottom.querySelector('.card__age') : null  
  
                    if(cls.contains('card__quality') && row1){  
                        row1.appendChild(node)  
                    }  
                    else if(cls.contains('card__type') && bottom && age){  
                        bottom.insertBefore(node, age.nextSibling)  
                    }  
                    else if(cls.contains('card__vote') && bottom){  
                        bottom.appendChild(node)  
                    }  
                })  
            })  
        })  
  
        observer.observe(document.body, { childList: true, subtree: true })  
  
        Lampa.Listener.follow('app', function(e){  
            if(e.type === 'destroy') observer.disconnect()  
        })  
    }  
  
    function init(){  
        addStyles()  
        patchTemplate()  
        patchModules()  
        startObserver()  
    }  
  
    if(window.appready) init()  
    else Lampa.Listener.follow('app', function(e){  
        if(e.type == 'ready') init()  
    })  
  
})()
