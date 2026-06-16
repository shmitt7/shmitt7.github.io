(function () {  
    'use strict';  
  
    if (window.plugin_overlay_menu_ready) return;  
    window.plugin_overlay_menu_ready = true;  
  
    function applyMenuStyles() {  
        var left = document.querySelector('.wrap__left');  
        if (!left) return;  
  
        // Inline style с !important — абсолютный приоритет, никакой CSS не перебьёт  
        left.style.setProperty('position',         'fixed',                      'important');  
        left.style.setProperty('left',             '-15em',                      'important');  
        left.style.setProperty('top',              '0',                          'important');  
        left.style.setProperty('margin-left',      '0',                          'important');  
        left.style.setProperty('z-index',          '200',                        'important');  
        left.style.setProperty('border-radius',    '0 1.5em 1.5em 0',           'important');  
        left.style.setProperty('box-shadow',       '0.3em 0 2em rgba(0,0,0,0.6)', 'important');  
  
        // Фон: glass-режим или обычный тёмный  
        if (document.body.classList.contains('glass--style')) {  
            left.style.setProperty('background-color',       'rgba(0,0,0,0.5)',  'important');  
            left.style.setProperty('-webkit-backdrop-filter','blur(1.6em)',       'important');  
            left.style.setProperty('backdrop-filter',        'blur(1.6em)',       'important');  
        } else {  
            left.style.setProperty('background-color', 'rgba(20,20,20,0.97)',    'important');  
        }  
    }  
  
    // MutationObserver: контент не двигается при открытии меню  
    var observer = new MutationObserver(function (mutations) {  
        for (var i = 0; i < mutations.length; i++) {  
            if (mutations[i].attributeName !== 'class') continue;  
  
            var content = document.querySelector('.wrap__content');  
            if (!content) break;  
  
            if (document.body.classList.contains('menu--open')) {  
                content.style.setProperty('-webkit-transform', 'none', 'important');  
                content.style.setProperty('-moz-transform',    'none', 'important');  
                content.style.setProperty('transform',         'none', 'important');  
            } else {  
                content.style.removeProperty('-webkit-transform');  
                content.style.removeProperty('-moz-transform');  
                content.style.removeProperty('transform');  
            }  
            break;  
        }  
    });  
  
    observer.observe(document.body, { attributes: true });  
  
    // Применяем стили после того, как DOM полностью построен  
    if (window.appready) {  
        applyMenuStyles();  
    } else {  
        Lampa.Listener.follow('app', function (e) {  
            if (e.type === 'ready') applyMenuStyles();  
        });  
    }  
  
})();
