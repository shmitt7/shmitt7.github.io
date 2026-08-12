(function () {  
    if (window.listCard) return;  
    window.listCard = true;  
    document.head.insertAdjacentHTML('beforeend', '<style>' +  
        '.card__title{display:none!important}' +  
        '.card__age{display:none!important}' +  
        '.card.focus .card-watched{display:none!important}' +  
        '.card__icons{top:0.5em!important;left:auto!important;right:0.5em!important;justify-content:flex-end!important}' +  
        '.card__icons-inner{background:none!important;border-radius:0!important;flex-direction:column!important}' +  
        '.card__icons-inner>.card__icon{margin-bottom:0.2em}' +  
        '.card__icon{filter:drop-shadow(0 1px 4px rgba(0,0,0,1)) drop-shadow(0 0 8px rgba(0,0,0,0.9))!important}' +  
        '.card__overlay{position:absolute;left:0;right:0;bottom:0;height:45%;display:flex;flex-direction:column;justify-content:flex-end;padding:0 0.6em 0.5em 0.6em;background:linear-gradient(to bottom,rgba(0,0,0,0) 0%,rgba(0,0,0,0.03) 20%,rgba(0,0,0,0.18) 42%,rgba(0,0,0,0.55) 70%,rgba(0,0,0,0.88) 100%);border-bottom-left-radius:1em;border-bottom-right-radius:1em;z-index:1;pointer-events:none}' +  
        '.card__overlay-title{color:#fff;font-size:1.25em;font-weight:700;line-height:1.12;text-align:left;display:-webkit-box;-webkit-line-clamp:2;line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;text-shadow:0 2px 8px rgba(0,0,0,0.9);margin-bottom:0.3em}' +  
        '.card__badge{display:flex;align-items:baseline;justify-content:space-between;width:100%;overflow:hidden}' +  
        '.card__badge:empty{display:none}' +  
        '.card__badge-left{display:flex;align-items:baseline;flex-shrink:1;min-width:0;overflow:hidden}' +  
        '.card__badge-left:empty{display:none}' +  
        '.card__badge-left>*+*{margin-left:0.4em}' +  
        '.card__badge-year{font-size:0.82em;font-weight:500;line-height:1.2;color:rgba(255,255,255,0.78);text-shadow:0 1px 5px rgba(0,0,0,0.9);flex-shrink:0}' +  
        '.card__badge-left .card__status{position:static!important;left:auto!important;top:auto!important;bottom:auto!important;background:none!important;padding:0!important;border-radius:0!important;font-size:0.82em!important;font-weight:500!important;display:flex!important;align-items:baseline!important;pointer-events:none;white-space:nowrap;flex-shrink:1;min-width:0;overflow:hidden;color:rgba(255,255,255,0.78)!important;text-shadow:0 1px 5px rgba(0,0,0,0.9)!important}' +  
        '.card__badge-left .card__status .tvs-icon{font-size:1.1em;margin-right:0.2em;flex-shrink:0}' +  
        '.card__badge-left .card__status .tvs-text{font-size:1em;font-weight:500;color:inherit;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex-shrink:1;min-width:0}' +  
        '.card__badge-right{display:flex;align-items:baseline;flex-shrink:0;margin-left:0.4em}' +  
        '.card__badge-right:empty{display:none}' +  
        '.card__badge-right>*+*{margin-left:0.4em}' +  
        '.card__badge-right .card__quality{position:static!important;left:auto!important;bottom:auto!important;padding:0!important;background:none!important;color:#fff!important;font-size:0.9em!important;font-weight:700!important;border-radius:0!important;text-shadow:0 1px 5px rgba(0,0,0,0.9)!important}' +  
        '.card__badge-right .card__quality>div{display:inline}' +  
        '.card__badge-right .card__vote{position:static!important;right:auto!important;bottom:auto!important;background:none!important;color:#fff!important;font-size:0.9em!important;font-weight:700!important;padding:0!important;border-radius:0!important;text-shadow:0 1px 5px rgba(0,0,0,0.9)!important}' +  
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
        var overlayTitle = document.createElement('div');  
        overlayTitle.className = 'card__overlay-title';  
        overlayTitle.textContent = data.title || data.name || '';  
        overlay.appendChild(overlayTitle);  
        var badge = document.createElement('div');  
        badge.className = 'card__badge';  
        var badgeLeft = document.createElement('div');  
        badgeLeft.className = 'card__badge-left';  
        var year = ((data.release_date || data.first_air_date || '') + '').slice(0, 4);  
        if (year) {  
            var yearEl = document.createElement('span');  
            yearEl.className = 'card__badge-year';  
            yearEl.textContent = year;  
            badgeLeft.appendChild(yearEl);  
        }  
        badge.appendChild(badgeLeft);  
        var badgeRight = document.createElement('div');  
        badgeRight.className = 'card__badge-right';  
        badge.appendChild(badgeRight);  
        overlay.appendChild(badge);  
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
