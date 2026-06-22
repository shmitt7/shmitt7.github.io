(function () {  
    'use strict';  
  
    if (window.plugin_floating_menus_ready) return;  
    window.plugin_floating_menus_ready = true;  
  
    var css = `  
        /* ======= Плавающее левое меню ======= */  
        .wrap__left {  
            position: fixed !important;  
            top: 5em !important;  
            bottom: 1em !important;  
            left: 1em !important;  
            margin-left: 0 !important;  
            padding-top: 0 !important;  
            border-radius: 1em !important;  
            background: #262829 !important;  
            border: 2px solid rgba(255,255,255,0.25) !important;  
            transform: translate3d(-17em, 0, 0) !important;  
        }  
  
        /* Убираем лишние отступы — выделение вровень с краями */  
        .wrap__left .menu__list {  
            padding-left: 0 !important;  
            padding-right: 0 !important;  
        }  
        .wrap__left .scroll--mask .scroll__content {  
            padding: 0.4em 0 !important;  
        }  
  
        body.menu--open:not(.light--version) .wrap__left {  
            transform: translate3d(0, 0, 0) !important;  
        }  
        body.menu--open:not(.light--version) .wrap__content {  
            transform: translate3d(0, 0, 0) !important;  
        }  
  
        body.menu--always:not(.light--version) .wrap__left {  
            width: 5em !important;  
            transform: translate3d(0, 0, 0) !important;  
        }  
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
  
        @media screen and (max-width: 767px) {  
            body.menu--open .wrap__left {  
                transform: translate3d(0, 0, 0) !important;  
            }  
        }  
  
        /* ======= Плавающие правые меню (настройки + selectbox) ======= */  
        @media screen and (min-width: 481px) {  
            .settings__content,  
            .selectbox__content {  
                top: 5em !important;  
                /* height перебивает inline-style от JS, решает обрезание */  
                height: calc(100vh - 6em) !important;  
                border-radius: 1em !important;  
                border: 2px solid rgba(255,255,255,0.25) !important;  
            }  
  
            body.settings--open .settings__content,  
            body.selectbox--open .selectbox__content {  
                /* -100% = ширина панели, ещё -1em = отступ от правого края */  
                transform: translate3d(calc(-100% - 1em), 0, 0) !important;  
            }  
        }  
    `;  
  
    $('body').append('<style id="floating-menus-plugin">' + css + '</style>');  
  
})();
