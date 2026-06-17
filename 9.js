(function () {  
    'use strict';  
  
    if (window.plugin_overlay_menu_ready) return;  
    window.plugin_overlay_menu_ready = true;  
  
    var HIDDEN_POS  = '-16.5em';  
    var VISIBLE_POS = '1em';  
  
    // CSS injection — работает до построения DOM меню, надёжнее чем JS querySelector  
    var style = document.createElement('style');  
    style.textContent = [  
        // Скрываем разделители и пункты настроек/консоли/редактора  
        '.wrap__left .menu__case.nosort { display: none !important; }',  
        '.wrap__left .menu__split       { display: none !important; }',  
        // Убираем padding-left у списка (было 0.6em — пустое место слева)  
        '.wrap__left .menu__list { padding-left: 0 !important; padding-right: 0 !important; }',  
        // Убираем большие отступы у скролл-контейнера (было 2.5em)  
        '.wrap__left .scroll__content { padding-top: 0.5em !important; padding-bottom: 0.5em !important; }',  
        // Убираем маску-градиент (она создаёт визуальный эффект пустого места сверху/снизу)  
        '.wrap__left .scroll--mask { mask-image: none !important; -webkit-mask-image: none !important; }',  
    ].join('\n');  
    document.head.appendChild(style);  
  
    function applyMenuStyles() {  
        var left = document.querySelector('.wrap__left');  
        if (!left) return;  
  
        left.style.setProperty('position',       'fixed',                       'important');  
        left.style.setProperty('left',           HIDDEN_POS,                    'important');  
        left.style.setProperty('top',            '3.5em',                       'important');  
        left.style.setProperty('bottom',         '1em',                         'important');  
        left.style.setProperty('height',         'auto',                        'important');  
        left.style.setProperty('margin-left',    '0',                           'important');  
        left.style.setProperty('z-index',        '200',                         'important');  
        left.style.setProperty('border-radius',  '1.5em',                       'important');  
        left.style.setProperty('box-shadow',     '0 0.5em 3em rgba(0,0,0,0.7)', 'important');  
        left.style.setProperty('transition',     'left 0.25s ease',             'important');  
        left.style.setProperty('transform',      'none',                        'important');  
        left.style.setProperty('will-change',    'left',                        'important');  
        left.style.setProperty('padding-top',    '0',                           'important');  
        left.style.setProperty('padding-bottom', '0',                           'important');  
        left.style.setProperty('overflow',       'hidden',                      'important');  
  
        if (document.body.classList.contains('glass--style')) {  
            left.style.setProperty('background-color',        'rgba(0,0,0,0.5)', 'important');  
            left.style.setProperty('-webkit-backdrop-filter', 'blur(1.6em)',      'important');  
            left.style.setProperty('backdrop-filter',         'blur(1.6em)',      'important');  
        } else {  
            left.style.setProperty('background-color', 'rgba(20,20,20,0.97)',    'important');  
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
        if (e.type === 'end') applyMenuStyles();  
    });  
  
})();
