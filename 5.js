(function () {  
  
    function startPlugin() {  
        window.plugin_floating_menus_ready = true;  
  
        var TOP_EM    = 4.3;  
        var BOTTOM_EM = 1;  
        var TOTAL_EM  = TOP_EM + BOTTOM_EM; // 5.3  
  
        var css = [  
            /* ======= Плавающее левое меню ======= */  
            '.wrap__left {',  
            '    position: fixed !important;',  
            '    top: ' + TOP_EM + 'em !important;',  
            '    bottom: ' + BOTTOM_EM + 'em !important;',  
            '    left: 1em !important;',  
            '    margin-left: 0 !important;',  
            '    padding-top: 0 !important;',  
            '    height: auto !important;',  
            '    border-radius: 1em !important;',  
            '    background: #262829 !important;',  
            '    border: 2px solid rgba(255,255,255,0.25) !important;',  
            '    transform: translate3d(-17em, 0, 0) !important;',  
            '    overflow: hidden !important;',  
            '}',  
            '.wrap__left .scroll--mask { mask-image: none !important; }',  
            '.wrap__left .scroll--mask .scroll__content { padding: 0 !important; }',  
            '.wrap__left .menu__list { padding-left: 0 !important; padding-right: 0 !important; }',  
  
            'body.menu--open:not(.light--version) .wrap__left { transform: translate3d(0,0,0) !important; }',  
            'body.menu--open:not(.light--version) .wrap__content { transform: translate3d(0,0,0) !important; }',  
            'body.menu--always:not(.light--version) .wrap__left { width: 5em !important; transform: translate3d(0,0,0) !important; }',  
            'body.menu--always.menu--open:not(.light--version) .wrap__left { width: 15em !important; transform: translate3d(0,0,0) !important; }',  
            'body.menu--always.menu--open:not(.light--version) .wrap__left > .scroll { width: 15em !important; }',  
            'body.menu--always.menu--open:not(.light--version) .wrap__content { transform: translate3d(0,0,0) !important; }',  
            '@media screen and (max-width: 767px) {',  
            '    body.menu--open .wrap__left { transform: translate3d(0,0,0) !important; }',  
            '}',  
  
            /* ======= Плавающие правые меню ======= */  
            '@media screen and (min-width: 481px) {',  
            '    .settings__content, .selectbox__content {',  
            '        top: ' + TOP_EM + 'em !important;',  
            '        bottom: ' + BOTTOM_EM + 'em !important;',  
            '        border-radius: 1em !important;',  
            '        border: 2px solid rgba(255,255,255,0.25) !important;',  
            '        overflow: hidden !important;',  
            '    }',  
            '    .settings__content .scroll,',  
            '    .selectbox__content .scroll {',  
            '        height: calc(100vh - ' + TOTAL_EM + 'em) !important;',  
            '    }',  
            '    body.settings--open .settings__content,',  
            '    body.selectbox--open .selectbox__content {',  
            '        transform: translate3d(calc(-100% - 1em), 0, 0) !important;',  
            '    }',  
            '}',  
  
            /* ======= Окантовка центральных меню ======= */  
            '@media screen and (min-width: 481px) {',  
            '    .modal__content { border: 2px solid rgba(255,255,255,0.25) !important; }',  
            '}'  
        ].join('\n');  
  
        function add() {  
            $('body').append('<style id="floating-menus-plugin">' + css + '</style>');  
        }  
  
        if (window.appready) add();  
        else {  
            Lampa.Listener.follow('app', function (e) {  
                if (e.type == 'ready') add();  
            });  
        }  
    }  
  
    if (!window.plugin_floating_menus_ready) startPlugin();  
  
})();
