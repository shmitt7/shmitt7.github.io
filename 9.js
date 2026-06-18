(function () {  
    'use strict';  
    if (window.plugin_overlay_menu_ready) return;  
    window.plugin_overlay_menu_ready = true;  
    var HIDDEN_POS = '-16.5em';  
    var VISIBLE_POS = '1em';  
    var style = document.createElement('style');  
    style.textContent = [  
        '.wrap__left{position:fixed!important;top:3.5em!important;height:auto!important;max-height:calc(100vh - 4.5em)!important;overflow:hidden!important;padding-top:0!important;}',  
        '.wrap__left > .scroll{height:auto!important;}',  
        '.wrap__left .scroll__content{padding-top:0!important;padding-bottom:0!important;}',  
        '.wrap__left .scroll--mask{mask-image:none!important;-webkit-mask-image:none!important;}',  
        '.wrap__left .menu__list{padding-left:0!important;padding-right:0!important;}',  
        '.wrap__left{background-color:#1d1f20!important;}',  
        'body.black--style .wrap__left{background-color:#000!important;}',  
        'body.glass--style .wrap__left{background-color:rgba(0,0,0,0.3)!important;backdrop-filter:blur(1.6em)!important;}',  
        'body.glass--style-opacity--medium .wrap__left{background-color:rgba(20,20,20,0.6)!important;backdrop-filter:blur(1.1em)!important;}',  
        'body.glass--style-opacity--blacked .wrap__left{background-color:rgba(0,0,0,0.85)!important;}'  
    ].join('\n');  
    document.head.appendChild(style);  
    function applyMenuStyles() {  
        var left = document.querySelector('.wrap__left');  
        if (!left) return;  
        left.style.setProperty('left', HIDDEN_POS, 'important');  
        left.style.setProperty('margin-left', '0', 'important');  
        left.style.setProperty('z-index', '200', 'important');  
        left.style.setProperty('border-radius', '1em', 'important');  
        left.style.setProperty('border', '1px solid rgba(255,255,255,0.6)', 'important');  
        left.style.setProperty('transition', 'left 0.25s ease', 'important');  
        left.style.setProperty('transform', 'none', 'important');  
    }  
    new MutationObserver(function () {  
        var leftEl = document.querySelector('.wrap__left');  
        var content = document.querySelector('.wrap__content');  
        var isOpen = document.body.classList.contains('menu--open');  
        if (leftEl) {  
            leftEl.style.setProperty('transform', 'none', 'important');  
            leftEl.style.setProperty('left', isOpen ? VISIBLE_POS : HIDDEN_POS, 'important');  
        }  
        if (content) content.style.setProperty('transform', 'none', 'important');  
    }).observe(document.body, {attributes: true, attributeFilter: ['class']});  
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
