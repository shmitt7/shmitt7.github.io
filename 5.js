(function () {  
  
    var styleEl = null;  
    var mutationObserver = null;  
    var reapplyTimer = null;  
  
    function getInterfaceColor() {  
        var computed = getComputedStyle(document.body).backgroundColor;  
  
        if (computed && computed.indexOf('rgb') === 0) {  
            return computed;  
        }  
  
        return Lampa.Storage.field('black_style') ? 'rgb(0,0,0)' : 'rgb(29,31,32)';  
    }  
  
    function parseRgb(rgbString) {  
        var match = rgbString.match(/(\d+),\s*(\d+),\s*(\d+)/);  
  
        if (!match) return '29,31,32';  
  
        return match[1] + ',' + match[2] + ',' + match[3];  
    }  
  
    function buildCss(baseRgb) {  
        return ''  
            + 'body.fcm--open .full-start-new__poster{position:relative!important;overflow:hidden!important;}'  
            + 'body.fcm--open .full-start-new__poster::after{'  
                + 'content:""!important;'  
                + 'position:absolute!important;'  
                + 'left:0!important;right:0!important;bottom:0!important;'  
                + 'height:32%!important;'  
                + 'background:linear-gradient(to bottom,'  
                    + 'rgba(' + baseRgb + ',0) 0%,'  
                    + 'rgba(' + baseRgb + ',1) 100%'  
                + ')!important;'  
                + 'pointer-events:none!important;'  
                + 'z-index:1!important;'  
            + '}'  
            + 'body.fcm--open .full-start-new__right{'  
                + 'position:relative!important;'  
                + 'z-index:2!important;'  
                + 'margin-top:-6em!important;'  
                + 'border-radius:0!important;'  
                + 'background:rgb(' + baseRgb + ')!important;'  
                + 'padding-top:0.6em!important;'  
            + '}';  
    }  
  
    function applyGradient() {  
        var baseRgb = parseRgb(getInterfaceColor());  
        var css = buildCss(baseRgb);  
  
        if (!styleEl) {  
            styleEl = document.createElement('style');  
            styleEl.id = 'fcm-gradient-style';  
            document.head.appendChild(styleEl);  
        }  
  
        styleEl.textContent = css;  
    }  
  
    function scheduleReapply() {  
        clearTimeout(reapplyTimer);  
  
        reapplyTimer = setTimeout(applyGradient, 50);  
    }  
  
    function initObserver() {  
        if (typeof MutationObserver === 'undefined') return;  
  
        mutationObserver = new MutationObserver(function (mutations) {  
            for (var i = 0; i < mutations.length; i++) {  
                var added = mutations[i].addedNodes;  
  
                for (var j = 0; j < added.length; j++) {  
                    var node = added[j];  
  
                    if (node.nodeType === 1 && node.classList && node.classList.contains('full-start-new__poster')) {  
                        scheduleReapply();  
                        return;  
                    }  
                }  
            }  
        });  
  
        mutationObserver.observe(document.body, { childList: true, subtree: true });  
    }  
  
    function destroy() {  
        if (mutationObserver) {  
            mutationObserver.disconnect();  
            mutationObserver = null;  
        }  
  
        clearTimeout(reapplyTimer);  
    }  
  
    Lampa.Listener.follow('app', function (e) {  
        if (e.type === 'ready') {  
            applyGradient();  
            initObserver();  
        }  
  
        if (e.type === 'destroy') {  
            destroy();  
        }  
    });  
  
    Lampa.Storage.listener.follow('change', function (event) {  
        if (event.name === 'black_style' || event.name === 'cub_theme') {  
            scheduleReapply();  
        }  
    });  
  
    Lampa.Listener.follow('full', function (e) {  
        if (e.type === 'complite' || e.type === 'build') {  
            scheduleReapply();  
        }  
    });  
  
})();
