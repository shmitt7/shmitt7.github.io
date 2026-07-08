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
            '.card__icons {',  
            '    position: absolute !important;',  
            '    top: 0.5em !important;',  
            '    right: 0.5em !important;',  
            '    left: auto !important;',  
            '    width: auto !important;',  
            '}',  
            '.card__icons-inner { justify-content: flex-end !important; }',  
  
            /* Градиентный оверлей снизу */  
            '.cp-overlay {',  
            '    position: absolute; left: 0; bottom: 0; right: 0;',  
            '    padding: 0.5em 0.7em 0.6em;',  
            '    background: linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.9) 100%);',  
            '    border-bottom-left-radius: 1em;',  
            '    border-bottom-right-radius: 1em;',  
            '    z-index: 2;',  
            '}',  
  
            /* Название — 3 строки с обрезкой */  
            '.card__title {',  
            '    color: #fff; font-size: 1.1em; line-height: 1.2;',  
            '    max-height: 3.6em; overflow: hidden;',  
            '    display: -webkit-box; -webkit-line-clamp: 3;',  
            '    -webkit-box-orient: vertical;',  
            '    margin-bottom: 0.3em; word-break: break-word;',  
            '}',  
  
            /* Нижняя строка */  
            '.cp-bottom {',  
            '    display: flex;',  
            '    align-items: center;',  
            '    gap: 0.3em;',  
            '    font-size: 0.85em;',  
            '}',  
  
            /* Сброс абсолютного позиционирования для элементов в cp-bottom */  
            '.cp-bottom .card__type, .cp-bottom .card__vote, .cp-bottom .card__quality {',  
            '    position: static !important;',  
            '    left: auto !important; right: auto !important;',  
            '    top: auto !important; bottom: auto !important;',  
            '}',  
  
            /* Год — прижат вправо */  
            '.cp-bottom .card__age {',  
            '    margin-left: auto;',  
            '    color: rgba(255,255,255,0.75);',  
            '}',  
  
            '.card__marker { z-index: 3 !important; }'  
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
  
        if(!map || !map.Card || !map.Icons || !map.Ratting){  
            console.warn('[CleanPoster] Lampa.Maker.map("Card") недоступен')  
            return  
        }  
  
        // Icons.onCreate: type и quality → cp-bottom перед годом  
        var orig_icons_onCreate = map.Icons.onCreate  
        map.Icons.onCreate = function(){  
            orig_icons_onCreate.call(this)  
            try {  
                var bottom  = this.html.find('.cp-bottom')  
                var age     = bottom ? bottom.querySelector('.card__age') : null  
                var quality = this.html.find('.card__quality')  
                var type    = this.html.find('.card__type')  
  
                // Порядок: type первый, quality после него, оба перед годом  
                if(type    && bottom) bottom.insertBefore(type,    age)  
                if(quality && bottom) bottom.insertBefore(quality, age)  
            }  
            catch(e){ console.warn('[CleanPoster] Icons.onCreate:', e) }  
        }  
  
        // Ratting.onCreate: vote → cp-bottom между type и quality  
        var orig_ratting_onCreate = map.Ratting.onCreate  
        map.Ratting.onCreate = function(){  
            orig_ratting_onCreate.call(this)  
            try {  
                var bottom  = this.html.find('.cp-bottom')  
                var quality = bottom ? bottom.querySelector('.card__quality') : null  
                var age     = bottom ? bottom.querySelector('.card__age')     : null  
                var vote    = this.html.find('.card__vote')  
  
                // Вставляем перед quality если есть, иначе перед годом  
                var ref = quality || age  
                if(vote && bottom) bottom.insertBefore(vote, ref)  
            }  
            catch(e){ console.warn('[CleanPoster] Ratting.onCreate:', e) }  
        }  
  
        // Card.onVisible: загружаем чистый постер с TMDB  
        var orig_onVisible = map.Card.onVisible  
        map.Card.onVisible = function(){  
            orig_onVisible.call(this)  
  
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
        var SKIP = ['cp-overlay', 'card__img', 'card__marker', 'card__img-broken']  
  
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
  
                    var bottom  = parent.querySelector('.cp-bottom')  
                    if(!bottom) return  
  
                    var quality = bottom.querySelector('.card__quality')  
                    var age     = bottom.querySelector('.card__age')  
  
                    if(cls.contains('card__type')){  
                        // type — самый первый  
                        bottom.insertBefore(node, bottom.firstChild)  
                    }  
                    else if(cls.contains('card__quality')){  
                        // quality — перед годом  
                        bottom.insertBefore(node, age)  
                    }  
                    else if(cls.contains('card__vote')){  
                        // vote — перед quality (или перед годом если quality нет)  
                        bottom.insertBefore(node, quality || age)  
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
