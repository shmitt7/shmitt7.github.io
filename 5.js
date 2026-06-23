(function () {  
  
    function startPlugin() {  
        window.plugin_floating_menus_ready = true;  
  
        var TOP_EM    = 5.5;  // отступ сверху — меняйте по вкусу  
        var BOTTOM_EM = 1;  
        var TOTAL_EM  = TOP_EM + BOTTOM_EM;  
  
        var css = [  
            /* ======= Плавающее левое меню ======= */  
            '.wrap__left {',  
            '    position: fixed !important;',  
            '    top: ' + TOP_EM + 'em !important;',  
            '    left: 1em !important;',  
            '    margin-left: 0 !important;',  
            '    padding-top: 0 !important;',  
            '    height: auto !important;',  
            '    max-height: calc(100vh - ' + TOTAL_EM + 'em) !important;',  
            '    border-radius: 1em !important;',  
            '    background: #262829 !important;',  
            '    border: 2px solid rgba(255,255,255,0.25) !important;',  
            '    transform: translate3d(-17em, 0, 0) !important;',  
            '    overflow: hidden !important;',  
            '}',  
            '.wrap__left > .scroll {',  
            '    height: auto !important;',  
            '    max-height: calc(100vh - ' + TOTAL_EM + 'em) !important;',  
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
  
            /* ======= Плавающие правые меню (настройки + selectbox) ======= */  
            '@media screen and (min-width: 481px) {',  
            '    .settings__content, .selectbox__content {',  
            '        top: ' + TOP_EM + 'em !important;',  
            '        bottom: ' + BOTTOM_EM + 'em !important;',  
            '        height: auto !important;',  
            '        max-height: calc(100vh - ' + TOTAL_EM + 'em) !important;',  
            '        border-radius: 1em !important;',  
            '        border: 2px solid rgba(255,255,255,0.25) !important;',  
            '        overflow: hidden !important;',  
            '    }',  
            '    body.settings--open .settings__content,',  
            '    body.selectbox--open .selectbox__content {',  
            '        transform: translate3d(calc(-100% - 1em), 0, 0) !important;',  
            '    }',  
            /* Уменьшаем подложку (padding-bottom) снизу скролла в правых меню */  
            '    .settings__content .scroll--mask .scroll__content,',  
            '    .selectbox__content .scroll--mask .scroll__content {',  
            '        padding-bottom: 0.5em !important;',  
            '    }',  
            '}',  
  
            /* ======= Окантовка центральных меню ======= */  
            '@media screen and (min-width: 481px) {',  
            '    .modal__content { border: 2px solid rgba(255,255,255,0.25) !important; }',  
            '}'  
        ].join('\n');  
  
        // Исправляем height у .scroll внутри правых меню.  
        // layer.js ставит height = innerHeight - head.height,  
        // но реальная видимая область = max-height контейнера - высота шапки панели.  
        function fixScrollHeight() {  
            if (window.innerWidth <= 480) return;  
  
            var fs   = parseFloat(getComputedStyle(document.documentElement).fontSize);  
            var maxH = window.innerHeight - TOTAL_EM * fs;  
  
            var pairs = [  
                { cls: 'settings--open',  sel: '.settings__content'  },  
                { cls: 'selectbox--open', sel: '.selectbox__content' }  
            ];  
  
            pairs.forEach(function (pair) {  
                if (!document.body.classList.contains(pair.cls)) return;  
  
                var container = document.querySelector(pair.sel);  
                if (!container) return;  
  
                var scroll = container.querySelector('.scroll');  
                if (!scroll) return;  
  
                var topOffset = scroll.getBoundingClientRect().top - container.getBoundingClientRect().top;  
                var scrollH   = Math.round(maxH - topOffset);  
  
                if (scrollH > 0) {  
                    scroll.style.setProperty('height', scrollH + 'px', 'important');  
                }  
            });  
        }  
  
        function add() {  
            $('body').append('<style id="floating-menus-plugin">' + css + '</style>');  
  
            // Следим за изменением классов body (открытие/закрытие меню)  
            var classObserver = new MutationObserver(function (mutations) {  
                mutations.forEach(function (m) {  
                    if (m.attributeName === 'class') setTimeout(fixScrollHeight, 50);  
                });  
            });  
            classObserver.observe(document.body, { attributes: true, attributeFilter: ['class'] });  
  
            // Следим за изменением style на .scroll (layer.js меняет height)  
            var styleObserver = new MutationObserver(function (mutations) {  
                mutations.forEach(function (m) {  
                    if (m.attributeName === 'style') setTimeout(fixScrollHeight, 10);  
                });  
            });  
  
            // Подключаем styleObserver к .scroll внутри правых меню когда они появляются  
            var domObserver = new MutationObserver(function () {  
                ['.settings__content .scroll', '.selectbox__content .scroll'].forEach(function (sel) {  
                    var el = document.querySelector(sel);  
                    if (el && !el._fmObserved) {  
                        el._fmObserved = true;  
                        styleObserver.observe(el, { attributes: true, attributeFilter: ['style'] });  
                    }  
                });  
            });  
            domObserver.observe(document.body, { childList: true, subtree: true });  
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
