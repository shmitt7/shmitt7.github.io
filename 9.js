(function(){  
    'use strict'  
  
    var PLUGIN_ID = 'clean-poster-plugin'  
    var cleanPosterCache = {}  
  
    // ---- Стили ----  
    function addStyles(){  
        if(document.getElementById(PLUGIN_ID)) return  
  
        var style = document.createElement('style')  
        style.id = PLUGIN_ID  
        style.textContent = [  
            /* Убираем отступ снизу — текст теперь на постере */  
            '.card__view { margin-bottom: 0 !important; }',  
  
            /* Градиентный оверлей снизу постера */  
            '.cp-overlay {',  
            '    position: absolute; left: 0; bottom: 0; right: 0;',  
            '    padding: 3.5em 0.7em 0.6em;',  
            '    background: linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.88) 100%);',  
            '    border-bottom-left-radius: 1em; border-bottom-right-radius: 1em;',  
            '    z-index: 2; pointer-events: none;',  
            '}',  
  
            /* Строка 1: качество и рейтинг — прижаты к правому краю */  
            '.cp-row1 {',  
            '    display: flex; justify-content: flex-end; align-items: center;',  
            '    gap: 0.3em; margin-bottom: 0.3em;',  
            '}',  
            '.cp-row1 .card__quality {',  
            '    position: static !important; left: auto !important; bottom: auto !important;',  
            '}',  
            '.cp-row1 .card__vote {',  
            '    position: static !important; right: auto !important; bottom: auto !important;',  
            '    background: transparent !important; font-size: 1em !important;',  
            '    padding: 0.1em 0.3em !important;',  
            '}',  
  
            /* Строка 2: название — оригинальная логика 3 строки */  
            '.cp-overlay .card__title {',  
            '    font-size: 1.1em; color: #fff; font-weight: 600;',  
            '    line-height: 1.2; max-height: 3.6em; overflow: hidden;',  
            '    display: -webkit-box !important;',  
            '    -webkit-line-clamp: 3; line-clamp: 3;',  
            '    -webkit-box-orient: vertical;',  
            '    margin-bottom: 0.3em; word-break: break-word;',  
            '}',  
  
            /* Строка 3: бейдж слева, год справа */  
            '.cp-bottom {',  
            '    display: flex; align-items: center; font-size: 0.8em;',  
            '}',  
            /* Бейдж типа — сбрасываем абсолютное позиционирование,  
               оригинальные цвета (.card--tv .card__type и т.д.) сохраняются */  
            '.cp-bottom .card__type {',  
            '    position: static !important; left: auto !important; top: auto !important;',  
            '}',  
            /* Год — оригинальный .card__age, прижат к правому краю */  
            '.cp-bottom .card__age {',  
            '    position: static !important; right: auto !important; bottom: auto !important;',  
            '    margin-left: auto; color: rgba(255,255,255,0.75); font-size: 1em;',  
            '}',  
  
            /* Маркер просмотра — поверх оверлея */  
            '.card__marker { z-index: 3 !important; }'  
        ].join('\n')  
  
        document.head.appendChild(style)  
    }  
  
    // ---- Шаблон ----  
    // .card__title и .card__age перемещены внутрь .cp-overlay.  
    // Оригинальные модули card.js и release.js найдут их через find() и сами установят текст.  
    // .card__icons остаётся на оригинальной позиции (вверху постера).  
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
  
    // ---- MutationObserver ----  
    // Перехватывает ВСЕ элементы, добавленные в .card__view любым плагином,  
    // и маршрутизирует их в нужное место.  
    function startObserver(){  
        // Элементы, которые уже в шаблоне — не трогаем  
        var SKIP = ['cp-overlay', 'card__img', 'card__icons', 'card__marker', 'card__img-broken']  
  
        var observer = new MutationObserver(function(mutations){  
            mutations.forEach(function(mutation){  
                if(mutation.type !== 'childList') return  
  
                mutation.addedNodes.forEach(function(node){  
                    if(node.nodeType !== 1) return  
  
                    var parent = node.parentNode  
                    if(!parent || !parent.classList) return  
  
                    // Реагируем только на прямые дочерние .card__view  
                    if(!parent.classList.contains('card__view')) return  
  
                    var cls = node.classList  
                    for(var i = 0; i < SKIP.length; i++){  
                        if(cls.contains(SKIP[i])) return  
                    }  
  
                    var row1   = parent.querySelector('.cp-row1')  
                    var bottom = parent.querySelector('.cp-bottom')  
  
                    // Нет нашего шаблона — не трогаем  
                    if(!row1 || !bottom) return  
  
                    if(cls.contains('card__type')){  
                        // Бейдж типа → cp-bottom перед годом (.card__age)  
                        var age = bottom.querySelector('.card__age')  
                        bottom.insertBefore(node, age)  
                    }  
                    else if(cls.contains('card__quality')){  
                        // Качество → в начало row1 (левее рейтинга)  
                        row1.insertBefore(node, row1.firstChild)  
                    }  
                    else if(cls.contains('card__vote')){  
                        // Рейтинг → в конец row1 (правее качества)  
                        row1.appendChild(node)  
                    }  
                })  
            })  
        })  
  
        observer.observe(document.body, { childList: true, subtree: true })  
  
        Lampa.Listener.follow('app', function(e){  
            if(e.type === 'destroy') observer.disconnect()  
        })  
    }  
  
    // ---- Чистый постер ----  
    // Единственный патч модуля — только для загрузки чистого постера с TMDB.  
    function patchModules(){  
        var map = Lampa.Maker.map('Card')  
  
        if(!map || !map.Card){  
            console.warn('[CleanPoster] Lampa.Maker.map("Card") недоступен')  
            return  
        }  
  
        var orig_onVisible = map.Card.onVisible  
        map.Card.onVisible = function(){  
            orig_onVisible.call(this)  
  
            var self = this  
            var data = this.data  
            var id   = data.id  
            var type = data.original_name ? 'tv' : 'movie'  
  
            if(!id) return  
  
            // Уже в кэше  
            if(cleanPosterCache[id] !== undefined){  
                if(cleanPosterCache[id]) self.img.src = cleanPosterCache[id]  
                return  
            }  
  
            // Помечаем как "запрос в процессе"  
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
                    // Чистого постера нет — оставляем обычный (уже загружен)  
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
