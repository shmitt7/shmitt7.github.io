(function(){  
    'use strict'  
  
    // Кэш чистых постеров чтобы не делать повторные запросы  
    let cleanPosterCache = {}  
  
    function patchCard(){  
        let orig_onCreate = Lampa.Maker.map('Card').Card.onCreate  
  
        Lampa.Maker.map('Card').Card.onCreate = function(){  
            // Вызываем оригинальный onCreate  
            orig_onCreate.call(this)  
  
            let data = this.data  
            let view = this.html.find('.card__view')  
  
            // 1. Убираем title и age снизу  
            this.html.find('.card__title').remove()  
            this.html.find('.card__age').remove()  
  
            // 2. Добавляем градиент + блок с инфо внизу постера  
            let overlay = $('<div class="cp-overlay"></div>')  
            let title   = $('<div class="cp-title"></div>').text(data.title || data.name || '')  
            let bottom  = $('<div class="cp-bottom"></div>')  
            let type    = $('<div class="cp-type"></div>').text(data.original_name ? 'TV' : '')  
            let year    = $('<div class="cp-year"></div>').text(data.release_year || '')  
  
            bottom.append(type).append(year)  
            overlay.append(title).append(bottom)  
            view.append(overlay)  
  
            // 3. Переставляем иконки и рейтинг в верхний ряд (уже там, только CSS)  
        }  
  
        let orig_onVisible = Lampa.Maker.map('Card').Card.onVisible  
  
        Lampa.Maker.map('Card').Card.onVisible = function(){  
            orig_onVisible.call(this)  
  
            let id   = this.data.id  
            let type = this.data.original_name ? 'tv' : 'movie'  
            let img  = this.img  
  
            if(!id) return  
  
            // Если уже есть в кэше  
            if(cleanPosterCache[id]){  
                if(cleanPosterCache[id] !== 'none') img.src = cleanPosterCache[id]  
                return  
            }  
  
            let url = Lampa.TMDB.api(type + '/' + id + '/images?include_image_language=null&api_key=' + Lampa.TMDB.key())  
  
            new Lampa.Reguest().silent(url, (images)=>{  
                let clean = images && images.posters && images.posters.find(p => p.iso_639_1 === null)  
  
                if(clean){  
                    let src = Lampa.TMDB.image('t/p/w300' + clean.file_path)  
                    cleanPosterCache[id] = src  
                    img.src = src  
                }  
                else{  
                    cleanPosterCache[id] = 'none'  
                }  
            }, ()=>{  
                cleanPosterCache[id] = 'none'  
            })  
        }  
    }  
  
    function addStyles(){  
        $('body').append(`<style>  
            /* Убираем отступ снизу карточки (там больше нет текста) */  
            .card__view { margin-bottom: 0 !important; }  
  
            /* Градиент + инфо-блок */  
            .cp-overlay {  
                position: absolute; bottom: 0; left: 0; right: 0;  
                padding: 2em 0.7em 0.5em;  
                background: linear-gradient(transparent, rgba(0,0,0,0.85));  
                border-bottom-left-radius: 1em;  
                border-bottom-right-radius: 1em;  
                z-index: 2;  
            }  
            .cp-title {  
                font-size: 1em; color: #fff; font-weight: 600;  
                white-space: nowrap; overflow: hidden; text-overflow: ellipsis;  
                margin-bottom: 0.3em;  
            }  
            .cp-bottom {  
                display: flex; justify-content: space-between; align-items: center;  
                font-size: 0.8em; color: rgba(255,255,255,0.7);  
            }  
            .cp-type { font-weight: 700; color: #5DBFF5; }  
            .cp-year { }  
  
            /* Верхний ряд: иконки + рейтинг в одну строку */  
            .card__icons { top: 0.5em; }  
            .card__vote  { bottom: auto; top: 0.5em; right: 0.5em; font-size: 1em; }  
            .card__quality { bottom: auto; top: 2.5em; }  
        </style>`)  
    }  
  
    function init(){  
        addStyles()  
        patchCard()  
    }  
  
    if(window.appready) init()  
    else Lampa.Listener.follow('app', e => { if(e.type == 'ready') init() })  
})()
