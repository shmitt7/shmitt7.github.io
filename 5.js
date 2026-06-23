(function(){  
    function startPlugin(){  
        window.plugin_floating_menus_ready = true;  
        var TOP = 5.5, BOT = 1, TOT = TOP + BOT;  
        var css = [  
            '.wrap__left{position:fixed!important;top:'+TOP+'em!important;left:1em!important;margin-left:0!important;padding-top:0!important;height:auto!important;max-height:calc(100vh - '+TOT+'em)!important;border-radius:1em!important;background:#262829!important;border:2px solid rgba(255,255,255,.25)!important;transform:translate3d(-17em,0,0)!important;overflow:hidden!important}',  
            '.wrap__left>.scroll{height:auto!important;max-height:calc(100vh - '+TOT+'em)!important;overflow:hidden!important}',  
            '.wrap__left .scroll--mask{mask-image:none!important}',  
            '.wrap__left .scroll--mask .scroll__content{padding:0!important}',  
            '.wrap__left .menu__list{padding-left:0!important;padding-right:0!important}',  
            'body.menu--open:not(.light--version) .wrap__left{transform:translate3d(0,0,0)!important}',  
            'body.menu--open:not(.light--version) .wrap__content{transform:translate3d(0,0,0)!important}',  
            'body.menu--always:not(.light--version) .wrap__left{width:5em!important;transform:translate3d(0,0,0)!important}',  
            'body.menu--always.menu--open:not(.light--version) .wrap__left{width:15em!important}',  
            'body.menu--always.menu--open:not(.light--version) .wrap__left>.scroll{width:15em!important}',  
            '@media screen and (max-width:767px){body.menu--open .wrap__left{transform:translate3d(0,0,0)!important}}',  
            '@media screen and (min-width:481px){',  
            '.settings__content,.selectbox__content{top:'+TOP+'em!important;bottom:'+BOT+'em!important;height:auto!important;max-height:calc(100vh - '+TOT+'em)!important;border-radius:1em!important;border:2px solid rgba(255,255,255,.25)!important;overflow:hidden!important}',  
            'body.settings--open .settings__content,body.selectbox--open .selectbox__content{transform:translate3d(calc(-100% - 1em),0,0)!important}',  
            '.settings__content .scroll--mask .scroll__content,.selectbox__content .scroll--mask .scroll__content{padding-bottom:.5em!important}',  
            '}',  
            '@media screen and (min-width:481px){.modal__content{border:2px solid rgba(255,255,255,.25)!important}}'  
        ].join('');  
        function fixScrollHeight(){  
            if(window.innerWidth <= 480) return;  
            var fs = parseFloat(getComputedStyle(document.documentElement).fontSize);  
            var maxH = window.innerHeight - TOT * fs;  
            [{cls:'settings--open',sel:'.settings__content'},{cls:'selectbox--open',sel:'.selectbox__content'}].forEach(function(p){  
                if(!document.body.classList.contains(p.cls)) return;  
                var c = document.querySelector(p.sel);  
                if(!c) return;  
                var s = c.querySelector('.scroll');  
                if(!s) return;  
                var h = Math.round(maxH - (s.getBoundingClientRect().top - c.getBoundingClientRect().top));  
                if(h > 0 && Math.round(parseFloat(s.style.height)) !== h)  
                    s.style.setProperty('height', h + 'px', 'important');  
            });  
        }  
        function add(){  
            $('body').append('<style id="floating-menus-plugin">'+css+'</style>');  
            var styleObs = new MutationObserver(function(){ setTimeout(fixScrollHeight, 10); });  
            new MutationObserver(function(mutations){  
                mutations.forEach(function(m){  
                    if(m.attributeName === 'class') setTimeout(fixScrollHeight, 50);  
                });  
                ['.settings__content .scroll','.selectbox__content .scroll'].forEach(function(sel){  
                    var el = document.querySelector(sel);  
                    if(el && !el._fmObs){ el._fmObs = true; styleObs.observe(el,{attributes:true,attributeFilter:['style']}); }  
                });  
            }).observe(document.body,{attributes:true,attributeFilter:['class'],childList:true,subtree:true});  
            window.addEventListener('resize', function(){ setTimeout(fixScrollHeight, 150); });  
        }  
        if(window.appready) add();  
        else Lampa.Listener.follow('app', function(e){ if(e.type == 'ready') add(); });  
    }  
    if(!window.plugin_floating_menus_ready) startPlugin();  
})();
