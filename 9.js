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
            '.cp-bottom .card__type { position: static !important; left: auto !important; top: auto !important; }',  
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
  
    function patchModules(){  
        var map = Lampa.Maker.map('Card')  
  
        if(!map || !map.Card || !map.Icons || !map.Ratting){  
            console.warn('[CleanPoster] Lampa.Maker.map("Card") недоступен')  
            return  
        }  
  
        // --- Card.onCreate: устанавливаем год ---  
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
  
        // --- Icons.onCreate: перемещаем card__quality в top-bar, card__type в cp-bottom ---  
        var orig_icons_onCreate = map.Icons.onCreate  
        map.Icons.onCreate = function(){  
            orig_icons_onCreate.call(this)  
            try {  
                var icons   = this.html.find('.card__icons')  
                var quality = this.html.find('.card__quality')  
                var type    = this.html.find('.card__type')  
                var year    = this.html.find('.cp-year')  
  
                // [quality] → перед [icons] в top-bar  
                if(quality) $(quality).insertBefore($(icons))  
  
                // [type] → перед [year] в cp-bottom  
                if(type) $(type).insertBefore($(year))  
            }  
            catch(e){ console.warn('[CleanPoster] Icons.onCreate:', e) }  
        }  
  
        // --- Ratting.onCreate: перемещаем card__vote в top-bar между quality и icons ---  
        var orig_ratting_onCreate = map.Ratting.onCreate  
        map.Ratting.onCreate = function(){  
            orig_ratting_onCreate.call(this)  
            try {  
                var icons = this.html.find('.card__icons')  
                var vote  = this.html.find('.card__vote')  
  
                // [quality][vote] → перед [icons]  
                if(vote) $(vote).insertBefore($(icons))  
            }  
            catch(e){ console.warn('[CleanPoster] Ratting.onCreate:', e) }  
        }  
  
        // --- Card.onVisible: загружаем чистый постер ---  
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
                var clean   = null  
                for(var i = 0; i < posters.length; i++){  
                    if(posters[i].iso_639_1 === null){ clean = posters[i]; break }  
                }  
                if(clean){  
                    var src = Lampa.TMDB.image('t/p/' + posterSize + clean.file_path)  
                    cleanPosterCache[id] = src  
                    if(self.img) self.img.src = src  
                }  
                else{ cleanPosterCache[id] = '' }  
            }, function(){ cleanPosterCache[id] = '' })  
        }  
    }  
  
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
