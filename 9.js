(function () {  
    'use strict';  
  
    if (window.plugin_overlay_menu_ready) return;  
    window.plugin_overlay_menu_ready = true;  
  
    var HIDDEN_POS  = '-16.5em';  
    var VISIBLE_POS = '1em';  
  
    function applyMenuStyles() {  
        var left = document.querySelector('.wrap__left');  
        if (!left) return;  
  
        left.style.setProperty('position',      'fixed',                       'important');  
        left.style.setProperty('left',          HIDDEN_POS,                    'important');  
        left.style.setProperty('top',           '4.5em',                       'important'); // ниже шапки с логотипом  
        left.style.setProperty('bottom',        '1em',                         'important');  
        left.style.setProperty('height',        'auto',                        'important');  
        left.style.setProperty('margin-left',   '0',                           'important');  
        left.style.setProperty('z-index',       '200',                         'important');  
        left.style.setProperty('border-radius', '1.5em',                       'important');  
        left.style.setProperty('box-shadow',    '0 0.5em 3em rgba(0,0,0,0.7)', 'important');  
        left.style.setProperty('transition',    'left 0.25s ease',             'important');  
        left.style.setProperty('transform',     'none',                        'important');  
        left.style.setProperty('will-change',   'left',                        'important');  
        left.style.setProperty('padding-top',   '0',                           'important');  
  
        if (document.body.classList.contains('glass--style')) {  
            left.style.setProperty('background-color',        'rgba(0,0,0,0.5)', 'important');  
            left.style.setProperty('-webkit-backdrop-filter', 'blur(1.6em)',      'important');  
            left.style.setProperty('backdrop-filter',         'blur(1.6em)',      'important');  
        } else {  
            left.style.setProperty('background-color', 'rgba(20,20,20,0.97)',    'important');  
        }  
    }  
  
    function applyScrollStyles() {  
        // Убираем лишние отступы у скролл-контейнера  
        var scrollContent = document.querySelector('.wrap__left .scroll--mask .scroll__content');  
        if (scrollContent) {  
            scrollContent.style.setProperty('padding-top',    '1em', 'important');  
            scrollContent.style.setProperty('padding-bottom', '0',   'important'); // убираем пустое место снизу  
        }  
  
        // Выравниваем кнопки меню симметрично: добавляем padding-right как у padding-left  
        var menuList = document.querySelector('.wrap__left .menu__list');  
        if (menuList) {  
            menuList.style.setProperty('padding-right', '0.6em', 'important');  
        }  
    }  
  
    var observer = new MutationObserver(function (mutations) {  
        for (var i = 0; i < mutations.length; i++) {  
            if (mutations[i].attributeName !== 'class') continue;  
  
            var leftEl  = document.querySelector('.wrap__left');  
            var content = document.querySelector('.wrap__content');  
            var isOpen  = document.body.classList.contains('menu--open');  
  
            if (leftEl) {  
                leftEl.style.setProperty('transform', 'none', 'important');  
                leftEl.style.setProperty('left', isOpen ? VISIBLE_POS : HIDDEN_POS, 'important');  
            }  
  
            if (content) {  
                content.style.setProperty('transform', 'none', 'important');  
            }  
  
            break;  
        }  
    });  
  
    observer.observe(document.body, { attributes: true });  
  
    if (window.appready) {  
        applyMenuStyles();  
    } else {  
        Lampa.Listener.follow('app', function (e) {  
            if (e.type === 'ready') applyMenuStyles();  
        });  
    }  
  
    Lampa.Listener.follow('menu', function (e) {  
        if (e.type === 'end') {  
            applyMenuStyles();  
            applyScrollStyles();  
        }  
    });  
  
})();
