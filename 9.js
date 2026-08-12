(function () {  
    if (window.listCard) return;  
    window.listCard = true;  
    document.head.insertAdjacentHTML('beforeend', '<style>' +  
        '.card__title{display:block!important;font-size:1.3em!important;font-weight:600!important;max-height:none!important;line-height:1.2!important;margin-top:0.05em!important;overflow:hidden!important;text-overflow:ellipsis!important;display:-webkit-box!important;-webkit-line-clamp:2!important;line-clamp:2!important;-webkit-box-orient:vertical!important}' +  
        '.card__age{display:none!important}' +  
        '.card.focus .card-watched{display:none!important}' +  
        '.card__icons{top:0.5em!important;left:auto!important;right:0.5em!important;justify-content:flex-end!important}' +  
        '.card__icons-inner{background:none!important;border-radius:0!important;flex-direction:column!important}' +  
        '.card__icons-inner>.card__icon{margin-bottom:0.2em}' +  
        '.card__icon{filter:drop-shadow(0 1px 4px rgba(0,0,0,1)) drop-shadow(0 0 8px rgba(0,0,0,0.9))!important}' +  
        '.card__overlay{position:absolute;left:0;right:0;bottom:0;padding:0;display:flex;justify-content:space-between;align-items:flex-end;background:none;z-index:1;pointer-events:none}' +  
        '.card__badge{display:flex;flex-wrap:nowrap;overflow:hidden}' +  
        '.card__badge:empty{display:none}' +  
        '.card__badge-left{align-items:baseline;flex-shrink:1;min-width:0;overflow:hidden;background:rgba(0,0,0,0.65);border:1px solid rgba(255,255,255,0.2);border-radius:0.35em;padding:0.25em 0.55em}' +  
        '.card__badge-left:empty{display:none}' +  
        '.card__badge-left>*+*{margin-left:0.4em}' +  
        '.card__badge-year{font-size:1em;font-weight:700;color:#fff;flex-shrink:0}' +  
        '.card__badge-left .card__status{position:static!important;left:auto!important;top:auto!important;bottom:auto!important;background:none!important;padding:0!important;border-radius:0!important;font-size:1em!important;display:flex!important;align-items:baseline!important;pointer-events:none;white-space:nowrap;flex-shrink:1;min-width:0;overflow:hidden}' +  
        '.card__badge-left .card__status .tvs-icon{font-size:1.1em;margin-right:0.2em;flex-shrink:0}' +  
        '.card__badge-left .card__status .tvs-text{font-size:1em;font-weight:700;color:#fff;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex-shrink:1;min-width:0}' +  
        '.card__badge-right{align-items:baseline;flex-shrink:0;margin-left:0.4em;background:rgba(0,0,0,0.65);border:1px solid rgba(255,255,255,0.2);border-radius:0.35em;padding:0.25em 0.55em}' +  
        '.card__badge-right:empty{display:none}' +  
        '.card__badge-right>*+*{margin-left:0.4em}' +  
        '.card__badge-right .card__quality{position:static!important;left:auto!important;bottom:auto!important;padding:0!important;background:none!important;color:#fff!important;font-size:1em!important;font-weight:700!important;border-radius:0!important}' +  
        '.card__badge-right .card__quality>div{display:inline}' +  
        '.card__badge-right .card__vote{position:static!important;right:auto!important;bottom:auto!important;background:none!important;color:#fff!important;font-size:1em!important;font-weight:700!important;padding:0!important;border-radius:0!important}' +  
        '.card__status,.card__type,.card__quality,.card__vote{visibility:hidden!important}' +  
        '.card__badge-left .card__status,.card__badge-right .card__quality,.card__badge-right .card__vote{visibility:visible!important}' +  
    '</style>');  
    var WATCH_TIMEOUT = 8000;  
    var activeChildObservers = [];  
    function relocateExisting(view, badgeLeft, badgeRight) {  
        var status = view.querySelector('.card__status');  
        var quality = view.querySelector('.card__quality');  
        var vote = view.querySelector('.card__vote');  
        if (status && status.parentNode !== badgeLeft) badgeLeft.appendChild(status);  
        if (quality && (quality.parentNode !== badgeRight || quality.nextSibling !== vote)) {  
            badgeRight.insertBefore(quality, vote && vote.parentNode === badgeRight ? vote : null);  
        }  
        if (vote && vote.parentNode !== badgeRight) badgeRight.appendChild(vote);  
        return !!(status && vote);  
    }  
    function watchOverlayInjects(view, badgeLeft, badgeRight) {  
        if (relocateExisting(view, badgeLeft, badgeRight)) return;  
        var watchTimer;  
        var childObserver = new MutationObserver(function () {  
            if (relocateExisting(view, badgeLeft, badgeRight)) stopWatching();  
        });  
        function stopWatching() {  
            clearTimeout(watchTimer);  
            childObserver.disconnect();  
            var idx = activeChildObservers.indexOf(childObserver);  
            if (idx !== -1) activeChildObservers.splice(idx, 1);  
        }  
        watchTimer = setTimeout(stopWatching, WATCH_TIMEOUT);  
        childObserver.observe(view, { childList: true });  
        activeChildObservers.push(childObserver);  
    }  
    function processCard(card) {  
        var data = card.card_data;  
        if (!data) return;  
        card.dataset.listCard = '1';  
        var view = card.querySelector('.card__view');  
        if (!view) return;  
        var ageEl = card.querySelector('.card__age');  
        if (ageEl) ageEl.style.display = 'none';  
        var icons = card.querySelector('.card__icons');  
        if (icons) {  
            icons.style.cssText = 'top:0.5em;left:auto;right:0.5em;justify-content:flex-end;';  
            var iconsInner = icons.querySelector('.card__icons-inner');  
            if (iconsInner) iconsInner.style.cssText = 'background:none;border-radius:0;flex-direction:column;';  
        }  
        var overlay = document.createElement('div');  
        overlay.className = 'card__overlay';  
        var badgeLeft = document.createElement('div');  
        badgeLeft.className = 'card__badge card__badge-left';  
        var year = ((data.release_date || data.first_air_date || '') + '').slice(0, 4);  
        if (year) {  
            var yearEl = document.createElement('span');  
            yearEl.className = 'card__badge-year';  
            yearEl.textContent = year;  
            badgeLeft.appendChild(yearEl);  
        }  
        overlay.appendChild(badgeLeft);  
        var badgeRight = document.createElement('div');  
        badgeRight.className = 'card__badge card__badge-right';  
        overlay.appendChild(badgeRight);  
        view.appendChild(overlay);  
        watchOverlayInjects(view, badgeLeft, badgeRight);  
    }  
    var intersectionObserver = null;  
    if (typeof IntersectionObserver !== 'undefined') {  
        intersectionObserver = new IntersectionObserver(function (entries) {  
            for (var i = 0; i < entries.length; i++) {  
                var entry = entries[i];  
                if (!entry.isIntersecting) continue;  
                intersectionObserver.unobserve(entry.target);  
                processCard(entry.target);  
            }  
        }, { rootMargin: '200px' });  
    }  
    function observe(card) {  
        if (!card.card_data || card.dataset.listCard) return;  
        if (intersectionObserver) intersectionObserver.observe(card);  
        else processCard(card);  
    }  
    var mutationObserver = new MutationObserver(function (mutations) {  
        for (var i = 0; i < mutations.length; i++) {  
            var addedNodes = mutations[i].addedNodes;  
            for (var j = 0; j < addedNodes.length; j++) {  
                var node = addedNodes[j];  
                if (node.nodeType !== 1) continue;  
                if (node.classList && node.classList.contains('card')) observe(node);  
                if (node.querySelectorAll) [].forEach.call(node.querySelectorAll('.card'), observe);  
            }  
        }  
    });  
    mutationObserver.observe(document.body, { childList: true, subtree: true });  
    [].forEach.call(document.querySelectorAll('.card'), observe);  
    Lampa.Listener.follow('app', function (e) {  
        if (e.type === 'ready') [].forEach.call(document.querySelectorAll('.card'), observe);  
        if (e.type === 'destroy') {  
            if (intersectionObserver) intersectionObserver.disconnect();  
            mutationObserver.disconnect();  
            for (var i = 0; i < activeChildObservers.length; i++) activeChildObservers[i].disconnect();  
            activeChildObservers = [];  
        }  
    });  
})();
