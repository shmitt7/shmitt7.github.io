(function() {  
    'use strict';  
  
    // Азиатские языки (без японского — он отдельно как аниме)  
    const ASIAN_LANGS = ['ko', 'zh', 'th', 'vi', 'id', 'ms', 'tl'];  
    const ANIME_LANG  = 'ja';  
    const ANIM_GENRE  = 16; // ID жанра "Анимация" в TMDB  
  
    function isAnime(card) {  
        return card.original_language === ANIME_LANG  
            && card.genre_ids && card.genre_ids.indexOf(ANIM_GENRE) >= 0;  
    }  
  
    function isAsian(card) {  
        return ASIAN_LANGS.indexOf(card.original_language) >= 0;  
    }  
  
    function init() {  
        // --- Регистрируем раздел настроек ---  
        Lampa.SettingsApi.addComponent({  
            component: 'content_filter_plugin',  
            icon: '<svg>...</svg>',  
            name: 'Фильтр контента'  
        });  
  
        // Заголовок: Главная страница  
        Lampa.SettingsApi.addParam({  
            component: 'content_filter_plugin',  
            param: { type: 'title' },  
            field: { name: 'Главная страница' }  
        });  
  
        Lampa.SettingsApi.addParam({  
            component: 'content_filter_plugin',  
            param: { name: 'cf_main_hide_asian', type: 'trigger', default: false },  
            field: { name: 'Скрыть азиатский контент' }  
        });  
  
        Lampa.SettingsApi.addParam({  
            component: 'content_filter_plugin',  
            param: { name: 'cf_main_hide_anime', type: 'trigger', default: false },  
            field: { name: 'Скрыть аниме' }  
        });  
  
        // Заголовок: Вся Лампа  
        Lampa.SettingsApi.addParam({  
            component: 'content_filter_plugin',  
            param: { type: 'title' },  
            field: { name: 'Вся Лампа' }  
        });  
  
        Lampa.SettingsApi.addParam({  
            component: 'content_filter_plugin',  
            param: { name: 'cf_global_hide_asian', type: 'trigger', default: false },  
            field: { name: 'Скрыть азиатский контент' }  
        });  
  
        Lampa.SettingsApi.addParam({  
            component: 'content_filter_plugin',  
            param: { name: 'cf_global_hide_anime', type: 'trigger', default: false },  
            field: { name: 'Скрыть аниме' }  
        });  
  
        // --- Фильтр на главной: убираем жанровые ряды ---  
        // Для аниме — удаляем жанр 16 из movie-списка (уберёт ряд "Мультфильмы")  
        // Для азиатского — сложнее, т.к. нет отдельного ряда по языку  
  
        // --- Глобальный фильтр: блокируем открытие карточек ---  
        Lampa.Listener.follow('full', function(e) {  
            if (e.type !== 'start') return;  
  
            let card = e.object && e.object.card;  
            if (!card) return;  
  
            if (Lampa.Storage.field('cf_global_hide_anime') && isAnime(card)) {  
                e.object.activity.back();  
                return;  
            }  
            if (Lampa.Storage.field('cf_global_hide_asian') && isAsian(card)) {  
                e.object.activity.back();  
                return;  
            }  
        });  
    }  
  
    if (window.appready) init();  
    else Lampa.Listener.follow('app', e => { if (e.type === 'ready') init(); });  
})();
