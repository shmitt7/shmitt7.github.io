(function () {  
    if (window.crlOverlayPlugin) return;  
    window.crlOverlayPlugin = true;  
    document.head.insertAdjacentHTML('beforeend', '<style>' +  
        '.card:not(.card--wide) .card__title,' +  
        '.card:not(.card--wide) .card__age,' +  
        '.card:not(.card--wide) .card__type,' +  
        '.card:not(.card--wide) .card__quality,' +  
        '.card:not(.card--wide) .card__vote,' +  
        '.card:not(.card--wide) .card__new-episode,' +  
        '.card:not(.card--wide) .card__marker,' +  
        '.card:not(.card--wide) .card-watched{display:none!important}' +  
        '.card:not(.card--wide) .card__view::before{display:none!important}' +  
        '.card:not(.card--wide) .card__icons{left:auto;right:0.5em;top:0.5em}' +  
        '.card:not(.card--wide) .card__icons-inner{background:none}' +  
        '.card:not(.card--wide) .card__icon{filter:drop-shadow(0 1px 4px rgba(0,0,0,1)) drop-shadow(0 0 8px rgba(0,0,0,0.9))}' +  
        '.crl-overlay{position:absolute;bottom:0;left:0;right:0;height:27%;border-radius:0 0 1em 1em;overflow:hidden;background:linear-gradient(to bottom,rgba(0,0,0,0) 0%,rgba(0,0,0,0.78) 30%,rgba(0,0,0,0.88) 100%);padding:0.35em 0.45em 0.35em;display:flex;flex-direction:column;justify-content:flex-end;z-index:2;box-sizing:border-box}' +  
        '.crl-title{font-size:1.15em;line-height:1.1;font-weight:700;color:#fff;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;line-clamp:2;-webkit-box-orient:vertical;text-overflow:ellipsis;margin-bottom:0.1em;text-shadow:0 1px 3px rgba(0,0,0,0.9)}' +  
        '.crl-row{display:flex;justify-content:space-between;align-items:baseline;line-height:1.2;margin-top:0.08em}' +  
        '.crl-left{font-size:0.9em;color:rgba(255,255,255,0.75);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1;min-width:0}' +  
        '.crl-right{font-size:0.9em;color:rgba(255,255,255,0.75);white-space:nowrap;margin-left:0.5em;flex-shrink:0;display:flex;align-items:baseline}' +  
        '.crl-sep{margin-left:0.3em;opacity:0.5}' +  
        '.crl-vote{margin-left:0.3em}' +  
    '</style>');  
    function buildOverlay(card, data) {  
        var overlay = document.createElement('div');  
        overlay.className = 'crl-overlay';  
        var titleEl = document.createElement('div');  
        titleEl.className = 'crl-title';  
        titleEl.textContent = data.title || data.name || '';  
        overlay.appendChild(titleEl);  
        var metaRow = document.createElement('div');  
        metaRow.className = 'crl-row';  
        var metaLeft = document.createElement('div');  
        metaLeft.className = 'crl-left';  
        var year = ((data.release_date || data.first_air_date || '') + '').slice(0, 4);  
        if (year === '0000') year = '';  
        var typeEl = card.querySelector('.card__type');  
        var typeText = typeEl ? typeEl.textContent.trim() : '';  
        metaLeft.textContent = year + (year && typeText ? ' \u00b7 ' : '') + typeText;  
        var metaRight = document.createElement('div');  
        metaRight.className = 'crl-right';  
        var qualityEl = card.querySelector('.card__quality');  
        var qualityText = qualityEl ? qualityEl.textContent.trim() : '';  
        var voteEl = card.querySelector('.card__vote');  
        var voteText = voteEl ? voteEl.textContent.trim() : '';  
        if (qualityText) {  
            var qualitySpan = document.createElement('span');  
            qualitySpan.textContent = qualityText;  
            metaRight.appendChild(qualitySpan);  
        }  
        if (voteText) {  
            if (qualityText) {  
                var sepEl = document.createElement('span');  
                sepEl.className = 'crl-sep';  
                sepEl.textContent = '\u00b7';  
                metaRight.appendChild(sepEl);  
            }  
            var voteSpan = document.createElement('span');  
            voteSpan.className = 'crl-vote';  
            voteSpan.textContent = voteText;  
            metaRight.appendChild(voteSpan);  
        }  
        metaRow.appendChild(metaLeft);  
        metaRow.appendChild(metaRight);  
        overlay.appendChild(metaRow);  
        return overlay;  
    }  
    function processCard(card) {  
        if (card.dataset.crlDone) return;  
        if (card.classList.contains('card--wide')) return;  
        if (!card.card_data) return;  
        card.dataset.crlDone = '1';  
        var view = card.querySelector('.card__view');  
        if (!view) return;  
        view.appendChild(buildOverlay(card, card.card_data));  
    }  
    var intersectionObserver = null;  
    function observeCard(card) {  
        if (card.dataset.crlObserved) return;  
        card.dataset.crlObserved = '1';  
        if (intersectionObserver) {  
            intersectionObserver.observe(card);  
        } else {  
            processCard(card);  
        }  
    }  
    if (typeof IntersectionObserver !== 'undefined') {  
        intersectionObserver = new IntersectionObserver(function(entries) {  
            for (var i = 0; i < entries.length; i++) {  
                var entry = entries[i];  
                if (!entry.isIntersecting) continue;  
                intersectionObserver.unobserve(entry.target);  
                processCard(entry.target);  
            }  
        }, { rootMargin: '100px' });  
    }  
    var mutationObserver = new MutationObserver(function(mutations) {  
        for (var mi = 0; mi < mutations.length; mi++) {  
            var nodes = mutations[mi].addedNodes;  
            for (var ni = 0; ni < nodes.length; ni++) {  
                var node = nodes[ni];  
                if (node.nodeType !== 1) continue;  
                if (node.classList && node.classList.contains('card')) {  
                    (function(n) { setTimeout(function() { observeCard(n); }, 0); })(node);  
                } else if (node.querySelectorAll) {  
                    [].forEach.call(node.querySelectorAll('.card'), function(c) {  
                        (function(n) { setTimeout(function() { observeCard(n); }, 0); })(c);  
                    });  
                }  
            }  
        }  
    });  
    function scanExisting() {  
        [].forEach.call(document.querySelectorAll('.card'), observeCard);  
    }  
    function start() {  
        mutationObserver.observe(document.body, { childList: true, subtree: true });  
        scanExisting();  
    }  
    Lampa.Listener.follow('app', function(e) {  
        if (e.type === 'ready') scanExisting();  
        if (e.type === 'destroy') {  
            mutationObserver.disconnect();  
            if (intersectionObserver) intersectionObserver.disconnect();  
        }  
    });  
    if (document.body) start();  
    else document.addEventListener('DOMContentLoaded', start);  
})();
