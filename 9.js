(function(){  
    'use strict'  
  
    var PLUGIN_ID = 'clean-poster-plugin'  
    var cleanPosterCache = {}  
  
    function getYear(data){  
        var date = data.release_date || data.first_air_date || data.birthday || ''  
        var year = (date + '').slice(0, 4)  
        return (year.length === 4 && year !== '0000') ? year : ''  
    }  
  
    function addStyles(){  
        if(document.getElementById(PLUGIN_ID)) return  
        var style = document.createElement('style')  
        style.id = PLUGIN_ID  
        style.textContent = [  
            '.card__view { margin-bottom: 0 !important; }',  
  
            /* Верхняя строка */  
            '.cp-top-bar {',  
            '    position: absolute; top: 0.5em; left: 0; right: 0;',  
            '    display: flex; align-items: center;',  
            '    padding: 0 0.5em; gap: 0.3em;',  
            '    z-index: 3; pointer-events: none;',  
            '}',  
            '.cp-top-bar .card__quality {',  
            '    position: static !important; left: auto !important; bottom: auto !important;',  
            '}',  
            '.cp-top-bar .card__vote {',  
            '    position: static !important; right: auto !important; bottom: auto !important;',  
            '    background: transparent !important; font-size: 1em !important; padding: 0.1em 0.3em !important;',  
            '}',  
            '.cp-top-bar .card__icons {',  
            '    position: static !important; margin-left: auto; width: auto !important;',  
            '}',  
  
            /* Градиентный оверлей */  
            '.cp-overlay {',  
            '    position: absolute; left: 0; bottom: 0; right: 0;',  
            '    padding: 3em 0.7em 0.6em;',  
            '    background: linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.9) 100%);',  
            '    border-bottom-left-radius: 1em; border-bottom-right-radius: 1em;',  
            '    z-index: 2; pointer-events: none;',  
            '}',  
            '.cp-overlay .card__title {',  
            '    display: -webkit-box !important;',  
            '    font-size: 1.1em; color: #fff; font-weight: 600;',  
            '    line-height: 1.2; max-height: 3.6em; overflow: hidden;',  
            '    -webkit-line-clamp: 3; line-clamp: 3;',  
            '    -webkit-box-orient: vertical;',  
            '    margin-bottom: 0.3em; word-break: break-word;',  
            '}',  
            '.cp-bottom { display: flex; align-items: center; font-size: 0.8em; }',  
  
            /* Бейдж типа — сбрасываем абсолютное позиционирование,  
               цвет/фон сохраняется из .card--tv .card__type и других плагинов */  
            '.cp-bottom .card__type {',  
            '    position: static !important; left: auto !important; top: auto !important;',  
            '}',  
            '.cp-year { margin-left: auto; color: rgba(255,255,255,0.75); }',  
            '.card__marker { z-index: 3 !important; }'  
        ].join('\n')  
        document.head.appendChild(style)  
    }  
  
    function patchTemplate(){  
        Lampa.Template.add('card', [  
            '<div class="card selector layer--visible layer--render">',  
            '    <div class="card__view">',  
            '        <img src="./img/img_load.svg" class="card__img" />',  
            '        <div class="cp-top-bar">',  
            '            <div class="card__icons">',  
            '                <div class="card__icons-inner"></div>',  
            '            </div>',  
            '        </div>',  
            '        <div class="cp-overlay">',  
            '            <div class="card__title"></div>',  
            '            <div class="cp-bottom">',  
            '                <div class="cp-year"></div>',  
            '            </div>',  
            '        </div>',  
            '    </div>',  
            '</div>'  
        ].join(''))  
    }  
  
    // -------------------------------------------------------  
    // MutationObserver: перехватываем ВСЕ элементы добавленные  
    // в .card__view — от любого плагина — и маршрутизируем их.  
    // -------------------------------------------------------  
    function startObserver(){  
        var SKIP = ['cp-top-bar','cp-overlay','card__img','card__marker','card__img-broken']  
  
        var observer = new MutationObserver(function(mutations){  
            mutations.forEach(function(mutation){  
                if(mutation.type !== 'childList') return  
  
                mutation.addedNodes.forEach(function(node){  
                    if(node.nodeType !== 1) return  
  
                    var parent = node.parentNode  
                    if(!parent || !parent.classList) return  
  
                    // Реагируем только на прямые дочерние .card__view  
                    if(!parent.classList.contains('card__view')) return  
  
                    // Пропускаем наши служебные элементы  
                    var cls = node.classList  
                    for(var i = 0; i < SKIP.length; i++){  
                        if(cls.contains(SKIP[i])) return  
                    }  
  
                    var topBar = parent.querySelector('.cp-top-bar')  
                    var bottom = parent.querySelector('.cp-bottom')  
                    var icons  = parent.querySelector('.card__icons')  
  
                    // Нет нашего шаблона — не трогаем  
                    if(!topBar || !bottom) return  
  
                    if(cls.contains('card__type')){  
                        // Любой бейдж типа (TV, Аниме, Боевик...) → cp-bottom перед годом  
                        var year = bottom.querySelector('.cp-year')  
                        bottom.insertBefore(node, year)  
                    }  
                    else if(cls.contains('card__quality')){  
                        // Качество → в начало top-bar (самый левый)  
                        topBar.insertBefore(node, topBar.firstChild)  
                    }  
                    else if(cls.contains('card__vote')){  
                        // Рейтинг → перед иконками  
                        if(icons) topBar.insertBefore(node, icons)  
                        else topBar.appendChild(node)  
                    }  
                })  
            })  
        })  
  
        observer.observe(document.body, { childList: true, subtree: true })  
  
        Lampa.Listener.follow('app', function(e){  
            if(e.type === 'destroy') observer.disconnect()  
        })  
    }  
  
    function patchModules(){  
        var map = Lampa.Maker.map('Card')  
  
        if(!map || !map.Card){  
            console.warn('[CleanPoster] Lampa.Maker.map("Card") недоступен')  
            return  
        }  
  
        // Только год — first_air_date для сериалов не обрабатывается в release.js  
        var orig_card_onCreate = map.Card.onCreate  
        map.Card.onCreate = function(){  
            orig_card_onCreate.call(this)  
            try {  
                var yearEl = this.html.find('.cp-year')  
                if(yearEl) yearEl.textContent = getYear(this.data)  
            } catch(e) {  
                console.warn('[CleanPoster] Card.onCreate:', e)  
            }  
        }  
  
        // Чистый постер с TMDB  
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
  
    function init(){  
        addStyles()  
        patchTemplate()  
        startObserver()  
        patchModules()  
    }  
  
    if(window.appready) init()  
    else Lampa.Listener.follow('app', function(e){  
        if(e.type == 'ready') init()  
    })  
  
})()
