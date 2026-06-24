(function(){  
    function startPlugin(){  
        window.plugin_floating_menus_ready = true;  
        var SL = 0.5;    // отступы левого меню (слева, снизу)  
        var SR = 0.5;  // отступы правых меню (сверху, снизу, справа)  
  
        // ======= ЧАСТЬ 1: ЛЕВОЕ МЕНЮ =======  
        var cssLeft = [  
            '.wrap__left{position:fixed!important;left:'+SL+'em!important;margin-left:0!important;padding-top:0!important;height:auto!important;border-radius:1em!important;background:#262829!important;border:2px solid rgba(255,255,255,.25)!important;transform:translate3d(-17em,0,0)!important;overflow:hidden!important}',  
            'body.black--style .wrap__left{background:#000!important}',  
            'body.glass--style .wrap__left{background:rgba(0,0,0,.3)!important;backdrop-filter:blur(1.6em)!important}',  
            'body.glass--style-opacity--medium .wrap__left{background:rgba(20,20,20,.6)!important;backdrop-filter:blur(1.1em)!important}',  
            'body.glass--style-opacity--blacked .wrap__left{background:rgba(20,20,20,.9)!important;backdrop-filter:blur(.5em)!important}',  
            '.wrap__left>.scroll{height:auto!important;overflow:hidden!important}',  
            '.wrap__left .scroll--mask{mask-image:none!important}',  
            '.wrap__left .scroll--mask .scroll__content{padding:0!important}',  
            '.wrap__left .menu__list{padding-left:0!important;padding-right:0!important}',  
            'body.menu--open:not(.light--version) .wrap__left{transform:translate3d(0,0,0)!important}',  
            'body.menu--open:not(.light--version) .wrap__content{transform:translate3d(0,0,0)!important}',  
            'body.menu--always:not(.light--version) .wrap__left{width:5em!important;transform:translate3d(0,0,0)!important}',  
            'body.menu--always.menu--open:not(.light--version) .wrap__left{width:15em!important}',  
            'body.menu--always.menu--open:not(.light--version) .wrap__left>.scroll{width:15em!important}',  
            '@media screen and (max-width:767px){body.menu--open .wrap__left{transform:translate3d(0,0,0)!important}}'  
        ].join('');  
  
        // ======= ЧАСТЬ 2: ПРАВОЕ МЕНЮ =======  
        var cssRight = [  
            '@media screen and (min-width:481px){',  
            '.settings__content,.selectbox__content{top:'+SR+'em!important;bottom:'+SR+'em!important;height:auto!important;max-height:calc(100vh - '+(SR*2)+'em)!important;border-radius:1em!important;border:2px solid rgba(255,255,255,.25)!important;overflow:hidden!important}',  
            'body.settings--open .settings__content,body.selectbox--open .selectbox__content{transform:translate3d(calc(-100% - '+SR+'em),0,0)!important}',  
            '.settings__content .scroll--mask .scroll__content,.selectbox__content .scroll--mask .scroll__content{padding-bottom:.5em!important}',  
            '}'  
        ].join('');  
  
        // ======= ЧАСТЬ 3: ЦЕНТРАЛЬНЫЕ МЕНЮ =======  
        var cssCenter = '@media screen and (min-width:481px){.modal__content{border:2px solid rgba(255,255,255,.25)!important}}';  
  
        function fix(){  
            var fs = parseFloat(getComputedStyle(document.documentElement).fontSize);  
            var head = document.querySelector('.head');  
            var headH = head ? head.getBoundingClientRect().height : 0;  
            var leftEl = document.querySelector('.wrap__left');  
            if(leftEl){  
                var maxH = window.innerHeight - headH - SL * fs;  
                leftEl.style.setProperty('top', headH + 'px', 'important');  
                leftEl.style.setProperty('max-height', maxH + 'px', 'important');  
                var ls = leftEl.querySelector('.scroll');  
                if(ls) ls.style.setProperty('max-height', maxH + 'px', 'important');  
            }  
            if(window.innerWidth <= 480) return;  
            var maxHR = window.innerHeight - SR * 2 * fs;  
            [{cls:'settings--open',sel:'.settings__content'},{cls:'selectbox--open',sel:'.selectbox__content'}].forEach(function(p){  
                if(!document.body.classList.contains(p.cls)) return;  
                var c = document.querySelector(p.sel);  
                if(!c) return;  
                var s = c.querySelector('.scroll');  
                if(!s) return;  
                var h = Math.round(maxHR - (s.getBoundingClientRect().top - c.getBoundingClientRect().top));  
                if(h > 0 && Math.round(parseFloat(s.style.height)) !== h)  
                    s.style.setProperty('height', h + 'px', 'important');  
            });  
        }  
  
        function add(){  
            $('body').append('<style id="floating-menus-plugin">'+cssLeft+cssRight+cssCenter+'</style>');  
            var styleObs = new MutationObserver(function(){ setTimeout(fix, 10); });  
            new MutationObserver(function(mutations){  
                mutations.forEach(function(m){  
                    if(m.attributeName === 'class') setTimeout(fix, 50);  
                });  
                ['.settings__content .scroll','.selectbox__content .scroll'].forEach(function(sel){  
                    var el = document.querySelector(sel);  
                    if(el && !el._fmObs){ el._fmObs = true; styleObs.observe(el,{attributes:true,attributeFilter:['style']}); }  
                });  
            }).observe(document.body,{attributes:true,attributeFilter:['class'],childList:true,subtree:true});  
            window.addEventListener('resize', function(){ setTimeout(fix, 150); });  
            fix();  
        }  
  
        if(window.appready) add();  
        else Lampa.Listener.follow('app', function(e){ if(e.type == 'ready') add(); });  
    }  
    if(!window.plugin_floating_menus_ready) startPlugin();  
})();
