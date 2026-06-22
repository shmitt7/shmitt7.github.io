(function () {  
    'use strict';  
    if (window.plugin_overlay_menu_ready) return;  
    window.plugin_overlay_menu_ready = true;  
  
    var style = document.createElement('style');  
    style.textContent = [  
        '.wrap__left { position:fixed!important; top:3.5em!important; left:-16.5em!important; display:flex!important; flex-direction:column!important; height:auto!important; max-height:calc(100vh - 4.5em)!important; overflow:hidden!important; padding-top:0!important; margin-left:0!important; z-index:200!important; border-radius:1em!important; border:1px solid rgba(255,255,255,0.6)!important; transition:left 0.25s ease!important; transform:none!important; background-color:#1d1f20!important; }',  
        '.wrap__left > .scroll { flex:1!important; min-height:0!important; }',  
        'body.menu--open:not(.light--version) .wrap__left { left:1em!important; }',  
        '.wrap__content { transform:none!important; }',  
        '.wrap__left .scroll--mask { mask-image:none!important; -webkit-mask-image:none!important; }',  
        '.wrap__left .menu__list { padding-left:0!important; padding-right:0!important; }',  
        '.wrap__left .scroll__content { padding-top:0!important; padding-bottom:0!important; }',  
        'body.menu--always:not(.light--version) .wrap__left { left:0!important; width:5em!important; border-radius:0 1em 1em 0!important; }',  
        'body.menu--always:not(.light--version) .wrap__content { margin-left:5em!important; }',  
        'body.menu--always.menu--open:not(.light--version) .wrap__left { left:0!important; width:15em!important; }',  
        'body.menu--always.menu--open:not(.light--version) .wrap__content { margin-left:15em!important; }',  
        'body.black--style .wrap__left { background-color:#000!important; }',  
        'body.glass--style .wrap__left { background-color:rgba(0,0,0,0.3)!important; backdrop-filter:blur(1.6em)!important; }',  
        'body.glass--style-opacity--medium .wrap__left { background-color:rgba(20,20,20,0.6)!important; backdrop-filter:blur(1.1em)!important; }',  
        'body.glass--style-opacity--blacked .wrap__left { background-color:rgba(20,20,20,0.9)!important; backdrop-filter:blur(0.5em)!important; }',  
        '.settings__content, .selectbox__content { top:3.5em!important; height:calc(100vh - 4.5em)!important; overflow:hidden!important; width:30%!important; border-radius:1em!important; border:1px solid rgba(255,255,255,0.6)!important; background-color:#1d1f20!important; }',  
        '.settings__content .scroll--mask, .selectbox__content .scroll--mask { mask-image:none!important; -webkit-mask-image:none!important; }',  
        '.settings__content .scroll__content, .selectbox__content .scroll__content { padding-bottom:5em!important; }',  
        'body.settings--open .settings__content { transform:translate3d(calc(-100% - 1em),0,0)!important; }',  
        'body.selectbox--open .selectbox__content { transform:translate3d(calc(-100% - 1em),0,0)!important; }',  
        'body.black--style .settings__content, body.black--style .selectbox__content { background-color:#000!important; }',  
        'body.glass--style .settings__content, body.glass--style .selectbox__content { background-color:rgba(0,0,0,0.3)!important; backdrop-filter:blur(1.6em)!important; }',  
        'body.glass--style-opacity--medium .settings__content, body.glass--style-opacity--medium .selectbox__content { background-color:rgba(20,20,20,0.6)!important; backdrop-filter:blur(1.1em)!important; }',  
        'body.glass--style-opacity--blacked .settings__content, body.glass--style-opacity--blacked .selectbox__content { background-color:rgba(20,20,20,0.9)!important; backdrop-filter:blur(0.5em)!important; }',  
        '.modal__content { border:1px solid rgba(255,255,255,0.6)!important; background-color:#1d1f20!important; }',  
        'body.black--style .modal__content { background-color:#000!important; }',  
        'body.glass--style .modal__content { background-color:rgba(0,0,0,0.3)!important; backdrop-filter:blur(1.6em)!important; }',  
        'body.glass--style-opacity--medium .modal__content { background-color:rgba(20,20,20,0.6)!important; backdrop-filter:blur(1.1em)!important; }',  
        'body.glass--style-opacity--blacked .modal__content { background-color:rgba(20,20,20,0.9)!important; backdrop-filter:blur(0.5em)!important; }',  
    ].join('\n');  
    document.head.appendChild(style);  
})();
