(function() {  
    if (window.card_mirror_plugin_ready) return;  
    window.card_mirror_plugin_ready = true;  
  
    var mutationObserver = null;  
    var intervalId = null;  
  
    function injectMirror(view) {  
        if (view.getAttribute('data-mirror-done')) return;  
        view.setAttribute('data-mirror-done', '1');  
        var mirror = document.createElement('div');  
        mirror.className = 'card__mirror';  
        view.appendChild(mirror);  
    }  
  
    function processAll() {  
        var views = document.querySelectorAll('.card:not(.card--wide) .card__view:not([data-mirror-done])');  
        [].forEach.call(views, function(view) {  
            injectMirror(view);  
        });  
    }  
  
    function init() {  
        document.head.insertAdjacentHTML('beforeend',  
            '<style id="card-mirror-style">' +  
            '.card__mirror {' +  
                'position: absolute;' +  
                'left: 0;' +  
                'right: 0;' +  
                'bottom: 0;' +  
                'height: 25%;' +  
                'background: -webkit-linear-gradient(top, rgba(0,0,0,0) 0%, rgba(0,0,0,0.75) 100%);' +  
                'background: linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.75) 100%);' +  
                'border-bottom-left-radius: 1em;' +  
                'border-bottom-right-radius: 1em;' +  
                'pointer-events: none;' +  
                'z-index: 2;' +  
            '}' +  
            '</style>'  
        );  
  
        if (typeof MutationObserver !== 'undefined') {  
            mutationObserver = new MutationObserver(processAll);  
            mutationObserver.observe(document.documentElement, { childList: true, subtree: true });  
        }  
  
        intervalId = setInterval(processAll, 2000);  
  
        processAll();  
  
        Lampa.Listener.follow('app', function(e) {  
            if (e.type === 'destroy') {  
                if (mutationObserver) {  
                    mutationObserver.disconnect();  
                    mutationObserver = null;  
                }  
                clearInterval(intervalId);  
                intervalId = null;  
            }  
        });  
    }  
  
    init();  
})();
