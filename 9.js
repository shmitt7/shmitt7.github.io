(function () {  
    'use strict';  
  
    if (window.plugin_overlay_menu_ready) return;  
    window.plugin_overlay_menu_ready = true;  
  
    var style = document.createElement('style');  
    style.textContent = [  
        /* Меню фиксируется на весь экран слева, скрыто за краем */  
        '.wrap__left {',  
        '    position: fixed !important;',  
        '    left: -15em !important;',  
        '    top: 0 !important;',  
        '    height: 100% !important;',  
        '    margin-left: 0 !important;',  
        '    z-index: 200 !important;',  
        '}',  
  
        /* При открытии — меню выезжает поверх контента */  
        'body.menu--open:not(.light--version) .wrap__left {',  
        '    transform: translate3d(15em, 0, 0) !important;',  
        '}',  
  
        /* Контент НЕ двигается */  
        'body.menu--open:not(.light--version) .wrap__content {',  
        '    transform: none !important;',  
        '}',  
  
        /* Режим menu--always: иконки всегда видны слева */  
        'body.menu--always:not(.light--version) .wrap__left {',  
        '    left: 0 !important;',  
        '    width: 5em !important;',  
        '}',  
  
        /* menu--always + открытие: меню расширяется, контент не двигается */  
        'body.menu--always.menu--open:not(.light--version) .wrap__left {',  
        '    transform: translate3d(0, 0, 0) !important;',  
        '}',  
        'body.menu--always.menu--open:not(.light--version) .wrap__content {',  
        '    transform: none !important;',  
        '}'  
    ].join('\n');  
  
    document.head.appendChild(style);  
})();
