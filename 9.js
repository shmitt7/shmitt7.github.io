(function(){  
    'use strict'  
  
    // =============================================  
    // Плагин: Чистые постеры с информацией  
    // Требует Lampa >= 3.0.0 (Manifest.app_digital >= 300)  
    // =============================================  
  
    var PLUGIN_ID = 'clean-poster-plugin'  
    var cleanPosterCache = {}  
  
    // Вычисляем год — учитываем и фильмы (release_date) и сериалы (first_air_date)  
    function getYear(data){  
        var date = data.release_date || data.first_air_date || data.birthday || ''  
        var year = (date + '').slice(0, 4)  
        return (year.length === 4 && year !== '0000') ? year : ''  
    }  
  
    // ---- CSS ----  
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
            '    padding: 3em 0.7em 0.6em;',  
            '    background: linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.9) 100%);',  
            '    border-bottom-left-radius: 1em; border-bottom-right-radius: 1em;',  
            '    z-index: 2; pointer-events: none;',  
            '}',  
  
            /* Название — максимум 3 строки, третья обрезается */  
            '.cp-overlay .card__title {',  
            '    display: -webkit-box !important;',  
            '    font-size: 1.1em; color: #fff; font-weight: 600;',  
            '    line-height: 1.2; max-height: 3.6em; overflow: hidden;',  
            '    -webkit-line-clamp: 3; line-clamp: 3;',  
            '    -webkit-box-orient: vertical;',  
            '    margin-bottom: 0.3em; word-break: break-word;',  
            '}',  
  
            /* Нижняя строка: тип слева, год справа */  
            '.cp-bottom { display: flex; justify-content: space-between; align-items: center; font-size: 0.8em; }',  
            '.cp-type   { font-weight: 700; color: #fff; }',  
            '.cp-year   { color: rgba(255,255,255,0.75); }',  
  
            /* ---- Верхняя строка: 4K | рейтинг | иконки ---- */  
  
            /* Качество — верхний левый угол */  
            '.card__quality { left: 0.5em !important; top: 0.5em !important; bottom: auto !important; z-index: 3 !important; }',  
  
            /* Рейтинг — верхний центр, прозрачный фон */  
            '.card__vote {',  
            '    left: 0 !important; right: 0 !important;',  
            '    top: 0.5em !important; bottom: auto !important;',  
            '    text-align: center !important; background: transparent !important;',  
            '    font-size: 1em !important; z-index: 3 !important;',  
            '}',  
  
            /* Иконки — верхний правый угол */  
            '.card__icons { top: 0.3em !important; left: auto !important; right: 0.3em !important; width: auto !important; z-index: 3 !important; }',  
  
            /* Маркер просмотра — поверх оверлея */  
            '.card__marker { z-index: 3 !important; }'  
        ].join('\n')  
  
        document.head.appendChild(style)  
    }  
  
    // ---- Шаблон карточки ----  
    // .card__title внутри .cp-overlay — card.js сам установит текст через find('.card__title')  
    // .cp-year вместо .card__age — release.js не найдёт .card__age и ничего не сделает,  
    //   год устанавливаем сами в Card.onCreate  
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
            '                <div class="cp-type"></div>',  
            '                <div class="cp-year"></div>',  
            '            </div>',  
            '        </div>',  
            '    </div>',  
            '</div>'  
        ].join(''))  
    }  
  
    // ---- Патч модулей ----  
    function patchModules(){  
        var map = Lampa.Maker.map('Card')  
  
        if(!map || !map.Card){  
            console.warn('[CleanPoster] Lampa.Maker.map("Card") недоступен — нужна Lampa >= 3.0.0')  
            return  
        }  
  
        // --- Card.onCreate: добавляем тип (TV) и год ---  
        var orig_onCreate = map.Card.onCreate  
        map.Card.onCreate = function(){  
            orig_onCreate.call(this)  
  
            var data = this.data  
            var view = this.html.find('.card__view')  
  
            // TV — только если есть original_name (признак сериала)  
            view.find('.cp-type').text(data.original_name ? 'TV' : '')  
  
            // Год с учётом first_air_date для сериалов  
            view.find('.cp-year').text(getYear(data))  
        }  
  
        // --- Card.onVisible: загружаем чистый постер с TMDB ---  
        var orig_onVisible = map.Card.onVisible  
        map.Card.onVisible = function(){  
            orig_onVisible.call(this)  
  
            var self = this  
            var data = this.data  
            var id   = data.id  
            var type = data.original_name ? 'tv' : 'movie'  
  
            if(!id) return  
  
            // Уже в кэше — применяем сразу  
            if(cleanPosterCache[id] !== undefined){  
                if(cleanPosterCache[id]) self.img.src = cleanPosterCache[id]  
                return  
            }  
  
            // Помечаем как "запрос в процессе" чтобы не дублировать  
            cleanPosterCache[id] = null  
  
            var posterSize = Lampa.Storage.field('poster_size') || 'w300'  
            var url = Lampa.TMDB.api(  
                type + '/' + id +  
                '/images?include_image_language=null&api_key=' + Lampa.TMDB.key()  
            )  
  
            new Lampa.Reguest().silent(url, function(images){  
                var posters = (images && Array.isArray(images.posters)) ? images.posters : []  
                var clean   = null  
  
                // Ищем постер без текста (iso_639_1 === null)  
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
                // Ошибка сети — оставляем обычный постер  
                cleanPosterCache[id] = ''  
            })  
        }  
    }  
  
    // ---- Инициализация ----  
    function init(){  
        addStyles()  
        patchTemplate()  
        patchModules()  
    }  
  
    if(window.appready) init()  
    else Lampa.Listener.follow('app', function(e){  
        if(e.type == 'ready') init()  
    })  
  
})()
