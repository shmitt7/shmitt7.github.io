(function () {  
    var css =  
        '.card:not(.card--wide) .card__icons{left:auto;right:0.5em;top:0.5em}' +  
        '.card:not(.card--wide) .card__icons-inner{background:none}' +  
        '.card:not(.card--wide) .card__icon{filter:drop-shadow(0 1px 4px rgba(0,0,0,1)) drop-shadow(0 0 8px rgba(0,0,0,0.9))}' +  
        '.card:not(.card--wide) .card__view::before{display:none!important}' +  
        '.card:not(.card--wide) .card__type,' +  
        '.card:not(.card--wide) .card__quality,' +  
        '.card:not(.card--wide) .card__age,' +  
        '.card:not(.card--wide) .card__title{display:none!important}' +  
        '.card:not(.card--wide) .card__status{position:absolute;top:0.5em;left:0.5em;bottom:auto;background:none;padding:0;border-radius:0;z-index:2}' +  
        '.card:not(.card--wide) .card__status .tvs-icon{font-size:0.9em;line-height:1;margin-right:0.1em}' +  
        '.card:not(.card--wide) .card__status .tvs-text{font-size:0.9em;font-weight:700;color:#fff;letter-spacing:0.03em;text-shadow:0 1px 4px rgba(0,0,0,1),0 0 8px rgba(0,0,0,0.9)}' +  
        '.card__bottom-info{position:absolute;right:0.4em;bottom:0.4em;display:flex;align-items:baseline;z-index:2;line-height:1}' +  
        '.card__bottom-info .card__vote{position:static;background:none;color:#fff;font-size:1.15em;font-weight:700;padding:0;border-radius:0;line-height:1;text-shadow:0 1px 4px rgba(0,0,0,1),0 0 8px rgba(0,0,0,0.9)}';  
    document.head.insertAdjacentHTML('beforeend', '<style>' + css + '</style>');  
    function processCard(card) {  
        if (card.dataset.crlDone) return;  
        if (card.classList.contains('card--wide')) return;  
        card.dataset.crlDone = '1';  
        var view = card.querySelector('.card__view');  
        if (!view) return;  
        var vote = view.querySelector('.card__vote');  
        if (!vote) return;  
        var infoRow = document.createElement('div');  
        infoRow.className = 'card__bottom-info';  
        infoRow.appendChild(vote);  
        view.appendChild(infoRow);  
    }  
    function relocateLateVote(node) {  
        if (node.closest('.card__bottom-info')) return;  
        var card = node.closest('.card');  
        if (!card || !card.dataset.crlDone || card.classList.contains('card--wide')) return;  
        var view = card.querySelector('.card__view');  
        if (!view) return;  
        var infoRow = view.querySelector('.card__bottom-info');  
        if (!infoRow) {  
            infoRow = document.createElement('div');  
            infoRow.className = 'card__bottom-info';  
            view.appendChild(infoRow);  
        }  
        infoRow.appendChild(node);  
    }  
    function scanExisting() {  
        [].forEach.call(document.querySelectorAll('.card'), processCard);  
    }  
    var observer = new MutationObserver(function (mutations) {  
        [].forEach.call(mutations, function (mutation) {  
            [].forEach.call(mutation.addedNodes, function (node) {  
                if (node.nodeType !== 1) return;  
                if (node.classList.contains('card')) {  
                    setTimeout(function () { processCard(node); }, 0);  
                } else if (node.querySelectorAll) {  
                    [].forEach.call(node.querySelectorAll('.card'), function (card) {  
                        setTimeout(function () { processCard(card); }, 0);  
                    });  
                }  
                if (node.classList.contains('card__vote')) {  
                    relocateLateVote(node);  
                }  
            });  
        });  
    });  
    function start() {  
        observer.observe(document.body, { childList: true, subtree: true });  
        scanExisting();  
    }  
    Lampa.Listener.follow('app', function (event) {  
        if (event.type === 'ready') scanExisting();  
        if (event.type === 'destroy') observer.disconnect();  
    });  
    if (document.body) start();  
    else document.addEventListener('DOMContentLoaded', start);  
})();
