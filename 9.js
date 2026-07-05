(function() {  
    if (window.card_mirror_plugin_ready) return;  
    window.card_mirror_plugin_ready = true;  
  
    var mutationObserver = null;  
  
    function injectMirror(cardView) {  
        if (cardView.getAttribute('data-mirror-done')) return;  
        cardView.setAttribute('data-mirror-done', '1');  
        var mirror = document.createElement('div');  
        mirror.className = 'card__mirror';  
        cardView.appendChild(mirror);  
    }  
  
    function processCard(cardElement) {  
        if (!cardElement.classList) return;  
        if (!cardElement.classList.contains('card')) return;  
        if (cardElement.classList.contains('card--wide')) return;  
        var view = cardElement.querySelector('.card__view');  
        if (view) injectMirror(view);  
    }  
  
    function processExistingCards() {  
        var cards = document.querySelectorAll('.card:not(.card--wide) .card__view:not([data-mirror-done])');  
        [].forEach.call(cards, function(view) {  
            injectMirror(view);  
        });  
    }  
  
    function startObserver() {  
        if (mutationObserver) return;  
        if (typeof MutationObserver === 'undefined') return;  
        mutationObserver = new MutationObserver(function(mutations) {  
            [].forEach.call(mutations, function(mutation) {  
                [].forEach.call(mutation.addedNodes, function(node) {  
                    if (node.nodeType !== 1) return;  
                    if (node.classList && node.classList.contains('card')) {  
                        processCard(node);  
                    }  
                    var nested = node.querySelectorAll ? node.querySelectorAll('.card') : [];  
                    [].forEach.call(nested, function(card) {  
                        processCard(card);  
                    });  
                });  
            });  
        });  
        mutationObserver.observe(document.body, { childList: true, subtree: true });  
        processExistingCards();  
    }  
  
    function addStyles() {  
        document.head.insertAdjacentHTML('beforeend',  
            '<style id="card-mirror-plugin-style">' +  
            '.card__mirror {' +  
                'position: absolute;' +  
                'left: 0;' +  
                'right: 0;' +  
                'bottom: 0;' +  
                'height: 25%;' +  
                'background: -webkit-linear-gradient(top, rgba(0,0,0,0) 0%, rgba(0,0,0,0.7) 100%);' +  
                'background: linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.7) 100%);' +  
                'border-bottom-left-radius: 1em;' +  
                'border-bottom-right-radius: 1em;' +  
                'pointer-events: none;' +  
                'z-index: 1;' +  
            '}' +  
            '</style>'  
        );  
    }  
  
    function init() {  
        addStyles();  
        startObserver();  
        Lampa.Listener.follow('app', function(e) {  
            if (e.type === 'destroy') {  
                if (mutationObserver) {  
                    mutationObserver.disconnect();  
                    mutationObserver = null;  
                }  
            }  
        });  
    }  
  
    init();  
})();
