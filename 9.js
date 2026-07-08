(function(){  
    'use strict'  
  
    var PLUGIN_ID = 'clean-poster-plugin'  
    var cleanPosterCache = {}  
  
    function addStyles(){  
        if(document.getElementById(PLUGIN_ID)) return  
        var style = document.createElement('style')  
        style.id = PLUGIN_ID  
        style.textContent = [  
  
            /* Карточка — разрешаем выход за границы */  
            '.card { overflow: visible !important; }',  
            '.card__view { overflow: visible !important; margin-bottom: 0 !important; }',  
  
            /* Иконки — верхний правый угол */  
            '.card__view .card__icons {',  
            '    position: absolute !important;',  
            '    top: 0.5em !important;',  
            '    right: 0.5em !important;',  
            '    left: auto !important;',  
            '    width: auto !important;',  
            '    z-index: 3 !important;',  
            '}',  
  
            /* Оверлей — сплошной тёмный прямоугольник, выходит за постер */  
            '.cp-overlay {',  
            '    position: absolute;',  
            '    left: 0; right: 0;',  
            '    bottom: -3.5em;',  
            '    padding: 0.6em 0.7em 0.5em;',  
            '    background: rgba(18,18,18,0.96);',  
            '    border-radius: 0 0 0.5em 0.5em;',  
            '    z-index: 2;',  
            '}',  
  
            /* Строка 1: качество */  
            '.cp-row1 {',  
            '    display: flex;',  
            '    align-items: center;',  
            '    margin-bottom: 0.25em;',  
            '    min-height: 1em;',  
            '}',  
  
            /* Название — 3 строки с обрезкой */  
            '.cp-overlay .card__title {',  
            '    color: #fff !important;',  
            '    font-size: 1.2em !important;',  
            '    font-weight: 700 !important;',  
            '    line-height: 1.2 !important;',  
            '    max-height: 3.6em !important;',  
            '    overflow: hidden !important;',  
            '    display: -webkit-box !important;',  
            '    -webkit-line-clamp: 3 !important;',  
            '    -webkit-box-orient: vertical !important;',  
            '    word-break: break-word !important;',  
            '    margin-bottom: 0.3em !important;',  
            '    margin-top: 0 !important;',  
            '}',  
  
            /* Нижняя строка */  
            '.cp-bottom {',  
            '    display: flex;',  
            '    align-items: center;',  
            '    line-height: 1;',  
            '}',  
  
            /* Сброс бейджевого оформления — качество в row1 */  
            '.cp-row1 .card__quality,',  
            '.cp-row1 .card__quality > div {',  
            '    position: static !important;',  
            '    background: none !important;',  
            '    padding: 0 !important;',  
            '    border-radius: 0 !important;',  
            '    color: rgba(255,255,255,0.9) !important;',  
            '    font-size: 0.95em !important;',  
            '    font-weight: 700 !important;',  
            '    text-transform: uppercase !important;',  
            '    display: inline !important;',  
            '    left: auto !important; right: auto !important;',  
            '    top: auto !important; bottom: auto !important;',  
            '}',  
  
            /* Сброс бейджевого оформления — нижняя строка */  
            '.cp-bottom .card__type,',  
            '.card--tv .cp-bottom .card__type,',  
            '.card--movie .cp-bottom .card__type {',  
            '    position: static !important;',  
            '    background: none !important;',  
            '    padding: 0 !important;',  
            '    border-radius: 0 !important;',  
            '    color: rgba(255,255,255,0.9) !important;',  
            '    font-size: 0.95em !important;',  
            '    font-weight: 700 !important;',  
            '    text-transform: none !important;',  
            '    left: auto !important; top: auto !important;',  
            '    margin-right: 0.5em !important;',  
            '    line-height: 1 !important;',  
            '    vertical-align: middle !important;',  
            '}',  
  
            '.cp-bottom .card__vote {',  
            '    position: static !important;',  
            '    background: none !important;',  
            '    padding: 0 !important;',  
            '    border-radius: 0 !important;',  
            '    color: rgba(255,255,255,0.9) !important;',  
            '    font-size: 0.95em !important;',  
            '    font-weight: 700 !important;',  
            '    margin-left: auto !important;',  
            '    line-height: 1 !important;',  
            '    vertical-align: middle !important;',  
            '}',  
  
            '.cp-bottom .card__quality,',  
            '.cp-bottom .card__quality > div {',  
            '    position: static !important;',  
            '    background: none !important;',  
            '    padding: 0 !important;',  
            '    border-radius: 0 !important;',  
            '    color: rgba(255,255,255,0.9) !important;',  
            '    font-size: 0.95em !important;',  
            '    font-weight: 700 !important;',  
            '    text-transform: uppercase !important;',  
            '    display: inline !important;',  
            '    left: auto !important; right: auto !important;',  
            '    top: auto !important; bottom: auto !important;',  
            '    margin-right: 0.5em !important;',  
            '    line-height: 1 !important;',  
            '    vertical-align: middle !important;',  
            '}',  
  
            '.cp-bottom .card__age {',  
            '    color: rgba(255,255,255,0.9) !important;',  
            '    font-size: 0.95em !important;',  
            '    font-weight: 700 !important;',  
            '    margin-top: 0 !important;',  
            '    margin-right: 0.5em !important;',  
            '    line-height: 1 !important;',  
            '    vertical-align: middle !important;',  
            '}',  
  
            /* Маркер (просмотрено/запланировано) — поверх всего */  
            '.card__marker { z-index: 3 !important; }',  
  
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
        if(!map || !map.Card) return  
  
        // --- Card.onVisible: загружаем чистый постер ---  
        var orig_card_onVisible = map.Card.onVisible  
        map.Card.onVisible = function(){  
            try{ orig_card_onVisible.call(this) } catch(e){}  
  
            var self = this  
            var data = this.data  
            var id   = data && data.id  
            var type = (data && data.original_name) ? 'tv' : 'movie'  
  
            if(!id) return  
  
            if(cleanPosterCache[id] !== undefined){  
                if(cleanPosterCache[id] && self.img) self.img.src = cleanPosterCache[id]  
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
                }  
                else{  
                    cleanPosterCache[id] = ''  
                }  
            }, function(){  
                cleanPosterCache[id] = ''  
            })  
        }  
  
        // --- Icons.onCreate: перемещаем type и quality ---  
        if(map.Icons && map.Icons.onCreate){  
            var orig_icons_onCreate = map.Icons.onCreate  
            map.Icons.onCreate = function(){  
                try{ orig_icons_onCreate.call(this) } catch(e){}  
  
                try{  
                    var bottom = this.html.querySelector('.cp-bottom')  
                    var row1   = this.html.querySelector('.cp-row1')  
                    var age    = bottom ? bottom.querySelector('.card__age') : null  
  
                    var type    = this.html.querySelector('.card__view > .card__type')  
                    var quality = this.html.querySelector('.card__view > .card__quality')  
  
                    if(type && bottom && age){  
                        bottom.insertBefore(type, age.nextSibling)  
                    }  
                    if(quality && row1){  
                        row1.appendChild(quality)  
                    }  
                } catch(e){ console.log('[CleanPoster] Icons.onCreate error:', e) }  
            }  
        }  
  
        // --- Ratting.onCreate: перемещаем vote ---  
        if(map.Ratting && map.Ratting.onCreate){  
            var orig_ratting_onCreate = map.Ratting.onCreate  
            map.Ratting.onCreate = function(){  
                try{ orig_ratting_onCreate.call(this) } catch(e){}  
  
                try{  
                    var bottom  = this.html.querySelector('.cp-bottom')  
                    var vote    = this.html.querySelector('.card__view > .card__vote')  
  
                    if(vote && bottom){  
                        bottom.appendChild(vote)  
                    }  
                } catch(e){ console.log('[CleanPoster] Ratting.onCreate error:', e) }  
            }  
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
  
                    if(!bottom) return  
  
                    if(cls.contains('card__quality') && row1){  
                        row1.appendChild(node)  
                    }  
                    else if(cls.contains('card__type') && age){  
                        bottom.insertBefore(node, age.nextSibling)  
                    }  
                    else if(cls.contains('card__vote')){  
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
