(function () {  
    'use strict';  
  
    if (window.plugin_floating_menus_ready) return;  
    window.plugin_floating_menus_ready = true;  
  
    var css = `  
        /* ======= Плавающее левое меню ======= */  
  
        /* Переводим на position:fixed, убираем margin-left и padding-top */  
        .wrap__left {  
            position: fixed !important;  
            top: 5em !important;        /* 4em шапка + 1em отступ */  
            bottom: 1em !important;  
            left: 1em !important;  
            margin-left: 0 !important;  
            padding-top: 0 !important;  
            border-radius: 1em !important;  
            background: #262829 !important;  
            overflow: hidden !important;  
            /* скрыто за левым краем: 15em ширина + 1em left + запас */  
            transform: translate3d(-17em, 0, 0) !important;  
        }  
  
        /* При открытии — показываем на месте, контент не сдвигаем */  
        body.menu--open:not(.light--version) .wrap__left {  
            transform: translate3d(0, 0, 0) !important;  
        }  
        body.menu--open:not(.light--version) .wrap__content {  
            transform: translate3d(0, 0, 0) !important;  
        }  
  
        /* Режим "всегда видно" — иконки */  
        body.menu--always:not(.light--version) .wrap__left {  
            width: 5em !important;  
            transform: translate3d(0, 0, 0) !important;  
        }  
  
        /* Режим "всегда видно" + открыто — полное меню */  
        body.menu--always.menu--open:not(.light--version) .wrap__left {  
            width: 15em !important;  
            transform: translate3d(0, 0, 0) !important;  
        }  
        body.menu--always.menu--open:not(.light--version) .wrap__left > .scroll {  
            width: 15em !important;  
        }  
        body.menu--always.menu--open:not(.light--version) .wrap__content {  
            transform: translate3d(0, 0, 0) !important;  
        }  
  
        /* Медиа — маленькие экраны */  
        @media screen and (max-width: 767px) {  
            body.menu--open .wrap__left {  
                transform: translate3d(0, 0, 0) !important;  
            }  
        }  
  
        /* ======= Плавающее правое меню (настройки) ======= */  
        /* Только для экранов > 480px, мобильная версия (снизу) не трогается */  
        @media screen and (min-width: 481px) {  
            .settings__content {  
                top: 5em !important;  
                bottom: 1em !important;  
                border-radius: 1em !important;  
                overflow: hidden !important;  
            }  
  
            /* При открытии — отступ 1em от правого края */  
            body.settings--open .settings__content {  
                transform: translate3d(calc(-100% - 1em), 0, 0) !important;  
            }  
        }  
    `;  
  
    $('body').append('<style id="floating-menus-plugin">' + css + '</style>');  
  
})();
