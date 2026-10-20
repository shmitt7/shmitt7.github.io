(function () {  
    if (window.listCard) return;  
    window.listCard = true;  
    document.head.insertAdjacentHTML('beforeend', '<style>' +  
        '.card[data-list-card]{height:auto!important}' +  
        '.card[data-list-card] .card__view{margin-bottom:0!important}' +  
        '.card[data-list-card] .card__title{display:none!important}' +  
        '.card[data-list-card] .card__age{display:none!important}' +  
        '.card[data-list-card] .card__promo{display:none!important}' +  
        '.card[data-list-card] .card-watched{display:none!important}' +  
        '.card[data-list-card] .card__marker{display:none!important}' +  
        '.card__view{background:#1a1a1a}' +  
        '.card__icons{top:0.5em!important;left:auto!important;right:0.5em!important;justify-content:flex-end!important}' +  
        '.card__icons-inner{background:none!important;border-radius:0!important;flex-direction:column!important}' +  
        '.card__icons-inner>.card__icon{margin-bottom:0.2em}' +  
        '.card__icon{filter:drop-shadow(0 1px 4px rgba(0,0,0,1)) drop-shadow(0 0 8px rgba(0,0,0,0.9))!important}' +  
        '.card__overlay{position:absolute;left:0.2em;right:0.2em;bottom:0.2em;padding:0.35em 0.35em 0.2em 0.35em;background:#3c3c3c;border-radius:0.8em;box-shadow:0 0.3em 0.6em rgba(0,0,0,0.55), 0 0.05em 0.15em rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08);z-index:1;pointer-events:none;display:flex;flex-direction:column}' +  
        '.card__overlay-title{font-size:1.45em;font-weight:600;line-height:1.15;color:#fff;overflow:hidden;margin-bottom:0.1em;white-space:normal;word-break:normal;max-height:2.5em;padding-bottom:0.08em}' +  
        '.card--wide .card__overlay-title{font-size:1.2em;max-height:1.4em}' +  
        '.card__status-row{display:flex;align-items:baseline;margin-bottom:0.1em;line-height:1;overflow:hidden;white-space:nowrap;min-width:0}' +  
        '.card__status-row:empty{display:none}' +  
        '.card__status-row .card__status{position:static!important;left:auto!important;top:auto!important;bottom:auto!important;background:none!important;padding:0!important;border-radius:0!important;font-size:0.95em!important;display:flex!important;align-items:baseline!important;pointer-events:none;white-space:nowrap}' +  
        '.card__status-row .card__status .tvs-icon{font-size:1.1em;margin-right:0.2em;flex-shrink:0}' +  
        '.card__status-row .card__status .tvs-text{font-size:0.95em;font-weight:500;color:#fff;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex-shrink:1;min-width:0}' +  
        '.card__badge{display:flex;flex-wrap:nowrap;align-items:center;line-height:1;width:100%;overflow:hidden;margin-top:auto}' +  
        '.card__badge-year{font-size:0.95em;line-height:1;color:#fff;flex-shrink:0}' +  
        '.card__badge-genre,.card__badge .card__type{flex:1 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-left:0.4em;color:#fff;line-height:1}' +  
        '.card__badge-year+.card__badge-genre::before,.card__badge-year+.card__type::before{content:none}' +  
        '.card__badge .card__type{position:static!important;top:auto!important;left:auto!important;background:none!important;padding:0!important;border-radius:0!important;font-size:0.95em!important;line-height:1!important;color:#fff!important}' +  
        '.card__badge-right{display:flex;align-items:center;flex-shrink:0;margin-left:auto}' +  
        '.card__badge-right>*+*{margin-left:0.4em}' +  
        '.card__badge-right .card__quality{position:static!important;left:auto!important;bottom:auto!important;padding:0!important;background:none!important;color:#fff!important;font-size:1.1em!important;line-height:1!important;font-weight:500;border-radius:0!important}' +  
        '.card__badge-right .card__quality>div{display:inline}' +  
        '.card__badge-right .card__vote{position:static!important;right:auto!important;bottom:auto!important;background:none!important;color:#fff!important;font-size:1.1em!important;line-height:1!important;font-weight:500;padding:0!important;border-radius:0!important}' +  
        '.card__status,.card__type,.card__quality,.card__vote{visibility:hidden!important}' +  
        '.card__status-row .card__status,.card__badge .card__type,.card__badge-right .card__quality,.card__badge-right .card__vote{visibility:visible!important}' +  
    '</style>');  
    var WATCH_TIMEOUT = 8000;  
    var activeChildObservers = [];  
    var pendingCards = [];  
    var pendingTimer = null;  
    function clampTitleByChars(el, text) {  
        text = text || '';  
        el.textContent = text;  
        if (!text) return;  
        el.textContent = 'A';  
        var oneLineHeight = el.scrollHeight;  
        el.textContent = text;  
        var maxHeight = oneLineHeight * 2 + Math.max(4, oneLineHeight * 0.12);  
        if (el.scrollHeight <= maxHeight) return;  
        var lo = 1, hi = text.length, best = 1;  
        while (lo <= hi) {  
            var mid = (lo + hi) >> 1;  
            var candidate = text.slice(0, mid).replace(/\s+$/, '');  
            el.textContent = candidate + '...';  
            if (el.scrollHeight <= maxHeight) { best = mid; lo = mid + 1; }  
            else hi = mid - 1;  
        }  
        el.textContent = text.slice(0, best).replace(/\s+$/, '') + '...';  
    }  
    function relocateExisting(view, statusRow, badge, badgeRight) {  
        var status = view.querySelector('.card__status');  
        var type = view.querySelector('.card__type');  
        var quality = view.querySelector('.card__quality');  
        var vote = view.querySelector('.card__vote');  
        if (status && status.parentNode !== statusRow) statusRow.appendChild(status);  
        if (type && type.parentNode !== badge) badge.insertBefore(type, badgeRight);  
        if (quality && (quality.parentNode !== badgeRight || quality.nextSibling !== vote)) {  
            badgeRight.insertBefore(quality, vote && vote.parentNode === badgeRight ? vote : null);  
        }  
        if (vote && vote.parentNode !== badgeRight) badgeRight.appendChild(vote);  
    }  
    function watchOverlayInjects(view, statusRow, badge, badgeRight) {  
        relocateExisting(view, statusRow, badge, badgeRight);  
        var watchTimer;  
        var childObserver = new MutationObserver(function () {  
            relocateExisting(view, statusRow, badge, badgeRight);  
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
    function getTitle(card) {  
        var data = card.card_data || {};  
        var titleEl = card.querySelector('.card__title');  
        return data.title || data.name || (titleEl ? titleEl.textContent : '') || '';  
    }  
    function getYear(card) {  
        var data = card.card_data || {};  
        var year = ((data.release_date || data.first_air_date || data.release_year || '') + '').slice(0, 4);  
        if (!year) {  
            var ageEl = card.querySelector('.card__age');  
            if (ageEl) year = (ageEl.textContent.match(/\d{4}/) || [''])[0];  
        }  
        return year;  
    }  
    function processCard(card) {  
        var view = card.querySelector('.card__view');  
        if (!view || view.querySelector('.card__overlay')) return;  
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
        overlay.appendChild(overlayTitle);  
        var statusRow = document.createElement('div');  
        statusRow.className = 'card__status-row';  
        overlay.appendChild(statusRow);  
        var badge = document.createElement('div');  
        badge.className = 'card__badge';  
        var year = getYear(card);  
        if (year) {  
            var yearEl = document.createElement('span');  
            yearEl.className = 'card__badge-year';  
            yearEl.textContent = year;  
            badge.appendChild(yearEl);  
        }  
        var badgeRight = document.createElement('div');  
        badgeRight.className = 'card__badge-right';  
        badge.appendChild(badgeRight);  
        overlay.appendChild(badge);  
        view.appendChild(overlay);  
        var title = getTitle(card);  
        if (title) clampTitleByChars(overlayTitle, title);  
        else overlayTitle.style.display = 'none';  
        watchOverlayInjects(view, statusRow, badge, badgeRight);  
    }  
    function observe(card) {  
        if (card.dataset.listCard) return;  
        card.dataset.listCard = '1';  
        pendingCards.push(card);  
        if (!pendingTimer) {  
            pendingTimer = setTimeout(function () {  
                pendingTimer = null;  
                var batch = pendingCards;  
                pendingCards = [];  
                for (var i = 0; i < batch.length; i++) processCard(batch[i]);  
            }, 30);  
        }  
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
            clearTimeout(pendingTimer);  
            mutationObserver.disconnect();  
            for (var i = 0; i < activeChildObservers.length; i++) activeChildObservers[i].disconnect();  
            activeChildObservers = [];  
        }  
    });  
})();
