(function () {  
    'use strict';  
  
    if (window.plugin_floating_menus_ready) return;  
    window.plugin_floating_menus_ready = true;  
  
    var TOP_EM    = 4.3;  // отступ сверху (вплотную к шапке)  
    var BOTTOM_EM = 1;    // отступ снизу  
  
    var css = [  
        /* ======= Плавающее левое меню ======= */  
        '.wrap__left {',  
        '    position: fixed !important;',  
        '    top: ' + TOP_EM + 'em !important;',  
        '    bottom: ' + BOTTOM_EM + 'em !important;',  
        '    left: 1em !important;',  
        '    margin-left: 0 !important;',  
        '    padding-top: 0 !important;',  
        '    border-radius: 1em !important;',  
        '    background: #262829 !important;',  
        '    border: 2px solid rgba(255,255,255,0.25) !important;',  
        '    transform: translate3d(-17em, 0, 0) !important;',  
        '    overflow: hidden !important;',  
        '}',  
  
        /* убираем маску — первый пункт вровень с верхним краем */  
        '.wrap__left .scroll--mask { mask-image: none !important; }',  
        '.wrap__left .scroll--mask .scroll__content { padding: 0 !important; }',  
  
        /* убираем отступ слева — выделение вровень с левым краем */  
        '.wrap__left .menu__list { padding-left: 0 !important; padding-right: 0 !important; }',  
  
        /* открытие / закрытие */  
        'body.menu--open:not(.light--version) .wrap__left { transform: translate3d(0,0,0) !important; }',  
        'body.menu--open:not(.light--version) .wrap__content { transform: translate3d(0,0,0) !important; }',  
  
        /* режим "всегда видно" */  
        'body.menu--always:not(.light--version) .wrap__left { width: 5em !important; transform: translate3d(0,0,0) !important; }',  
        'body.menu--always.menu--open:not(.light--version) .wrap__left { width: 15em !important; transform: translate3d(0,0,0) !important; }',  
        'body.menu--always.menu--open:not(.light--version) .wrap__left > .scroll { width: 15em !important; }',  
        'body.menu--always.menu--open:not(.light--version) .wrap__content { transform: translate3d(0,0,0) !important; }',  
  
        /* маленькие экраны */  
        '@media screen and (max-width: 767px) {',  
        '    body.menu--open .wrap__left { transform: translate3d(0,0,0) !important; }',  
        '}',  
  
        /* ======= Плавающие правые меню (настройки + selectbox) ======= */  
        '@media screen and (min-width: 481px) {',  
        '    .settings__content, .selectbox__content {',  
        '        top: ' + TOP_EM + 'em !important;',  
        '        height: calc(100vh - ' + (TOP_EM + BOTTOM_EM) + 'em) !important;',  
        '        border-radius: 1em !important;',  
        '        border: 2px solid rgba(255,255,255,0.25) !important;',  
        '        overflow: hidden !important;',  
        '    }',  
        '    body.settings--open .settings__content,',  
        '    body.selectbox--open .selectbox__content {',  
        '        transform: translate3d(calc(-100% - 1em), 0, 0) !important;',  
        '    }',  
        '}',  
  
        /* ======= Окантовка центральных меню (модальные окна) ======= */  
        '@media screen and (min-width: 481px) {',  
        '    .modal__content {',  
        '        border: 2px solid rgba(255,255,255,0.25) !important;',  
        '    }',  
        '}'  
    ].join('\n');  
  
    $('body').append('<style id="floating-menus-plugin">' + css + '</style>');  
  
    /* -------------------------------------------------------  
       JS: исправляем height правых меню.  
       Lampa устанавливает height через inline-style,  
       поэтому пересчитываем его сами при каждом изменении  
       класса body (settings--open / selectbox--open).  
    ------------------------------------------------------- */  
    function fixRightMenuHeight() {  
        var fs = parseFloat(getComputedStyle(document.documentElement).fontSize);  
        var h  = window.innerHeight - (TOP_EM + BOTTOM_EM) * fs;  
        ['.settings__content', '.selectbox__content'].forEach(function (sel) {  
            var el = document.querySelector(sel);  
            if (el) el.style.setProperty('height', h + 'px', 'important');  
        });  
    }  
  
    var observer = new MutationObserver(function (mutations) {  
        mutations.forEach(function (m) {  
            if (m.attributeName === 'class') setTimeout(fixRightMenuHeight, 50);  
        });  
    });  
  
    function init() {  
        observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });  
    }  
  
    if (document.body) init();  
    else document.addEventListener('DOMContentLoaded', init);  
  
})();
