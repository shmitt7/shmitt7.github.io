(function(){  
    function startPlugin(){  
        if(!Lampa.Platform.screen('tv')) return;  
        window.customMenu = true;  
        var css = [  
            '.wrap__left{position:fixed!important;margin-left:0!important;padding-top:0!important;height:auto!important;border-radius:1em!important;background:#262829!important;border:2px solid rgba(255,255,255,.25)!important;transform:translate3d(-17em,0,0)!important;overflow:hidden!important}',  
            'body.black--style .wrap__left{background:#000!important}',  
            'body.glass--style .wrap__left{background:rgba(0,0,0,.3)!important;backdrop-filter:blur(1.6em)!important}',  
            'body.glass--style-opacity--medium .wrap__left{background:rgba(20,20,20,.6)!important;backdrop-filter:blur(1.1em)!important}',  
            'body.glass--style-opacity--blacked .wrap__left{background:rgba(20,20,20,.9)!important;backdrop-filter:blur(.5em)!important}',  
            '.wrap__left>.scroll{height:auto!important;overflow:hidden!important}',  
            '.wrap__left .scroll--mask{mask-image:none!important}',  
            '.wrap__left .scroll--mask .scroll__content{padding:0!important}',  
            '.wrap__left .menu__list{padding-left:0!important}',  
            'body.menu--open:not(.light--version) .wrap__left{transform:translate3d(0,0,0)!important}',  
            'body.menu--open:not(.light--version) .wrap__content{transform:translate3d(0,0,0)!important}',  
            'body.menu--always:not(.light--version) .wrap__left{width:5em!important;transform:translate3d(0,0,0)!important}',  
            'body.menu--always.menu--open:not(.light--version) .wrap__left{width:15em!important}',  
            '.settings__content,.selectbox__content{top:.5em!important;bottom:.5em!important;height:auto!important;max-height:calc(100vh - 1em)!important;border-radius:1em!important;border:2px solid rgba(255,255,255,.25)!important;overflow:hidden!important}',  
            'body.black--style .settings__content,body.black--style .selectbox__content{background:#000!important}',  
            'body.settings--open .settings__content,body.selectbox--open .selectbox__content{transform:translate3d(calc(-100% - .5em),0,0)!important}',  
            '.settings__content .scroll--mask .scroll__content,.selectbox__content .scroll--mask .scroll__content{padding-bottom:.5em!important}',  
            '.modal__content{border:2px solid rgba(255,255,255,.25)!important}',  
            'body.black--style .modal__content{background:#000!important}'  
        ].join('');  
        function update(){  
            var fs = parseFloat(getComputedStyle(document.body).fontSize);  
            var head = document.querySelector('.head');  
            var headH = head ? head.getBoundingClientRect().height : 0;  
            var leftEl = document.querySelector('.wrap__left');  
            if(leftEl){  
                var maxH = window.innerHeight - headH - fs * 0.5;  
                leftEl.style.setProperty('top', headH + 'px', 'important');  
                leftEl.style.setProperty('left', fs + 'px', 'important');  
                leftEl.style.setProperty('max-height', maxH + 'px', 'important');  
                var ls = leftEl.querySelector('.scroll');  
                if(ls) ls.style.setProperty('max-height', maxH + 'px', 'important');  
            }  
            var maxHR = window.innerHeight - fs;  
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
            $('body').append('<style id="floating-menus-plugin">'+css+'</style>');  
            new MutationObserver(function(mutations){  
                mutations.forEach(function(m){  
                    if(m.attributeName === 'class') setTimeout(update, 100);  
                });  
            }).observe(document.body, {attributes:true, attributeFilter:['class']});  
            Lampa.Listener.follow('resize_end', function(){ setTimeout(update, 50); });  
            update();  
        }  
        if(window.appready) add();  
        else Lampa.Listener.follow('app', function(e){ if(e.type == 'ready') add(); });  
    }  
    if(!window.customMenu) startPlugin();  
})();
