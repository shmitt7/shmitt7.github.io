(function () {  
    if (window.customCardPlugin) return;  
    window.customCardPlugin = true;  
  
    document.head.insertAdjacentHTML('beforeend', '<style>' +  
        '.card__title{display:none!important}' +  
        '.card__age{display:none!important}' +  
        '.card.focus .card-watched{display:none!important}' +  
        '.card__icons{top:0.5em!important;left:auto!important;right:0.5em!important;justify-content:flex-end!important}' +  
        '.card__icons-inner{background:none!important;border-radius:0!important;flex-direction:column!important}' +  
        '.card__icons-inner>.card__icon{margin-bottom:0.2em}' +  
        '.card__icon{filter:drop-shadow(0 1px 4px rgba(0,0,0,1)) drop-shadow(0 0 8px rgba(0,0,0,0.9))!important}' +  
        '.card__overlay{position:absolute;left:0;right:0;bottom:0;padding:3em 0.4em 0.25em 0.4em;background:linear-gradient(to bottom,rgba(0,0,0,0) 0%,rgba(0,0,0,0.9) 100%);border-bottom-left-radius:1em;border-bottom-right-radius:1em;z-index:1;pointer-events:none}' +  
        '.card__overlay-title{font-size:1.35em;font-weight:600;line-height:1.1;color:#fff;overflow:hidden;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:2;line-clamp:2;-webkit-box-orient:vertical;margin-bottom:0.15em}' +  
        '.card__status-row{display:flex;align-items:baseline;margin-bottom:0.15em;line-height:1;overflow:hidden;white-space:nowrap;min-width:0}' +  
        '.card__status-row:empty{display:none}' +  
        '.card__badge{display:flex;align-items:center;width:100%;overflow:hidden}' +  
        '.card__badge>*+*{margin-left:0.3em}' +  
        '.card__badge-year,.card__badge-sep{font-size:0.85em;color:#ccc;flex-shrink:0;white-space:nowrap}' +  
  
        /* прячем нативные метки статуса/жанра/качества/рейтинга везде, кроме нашего overlay */  
        '.card__status,.card__type,.card__quality,.card__vote{visibility:hidden!important}' +  
  
        /* .card__status -> внутрь .card__status-row */  
        '.card__status-row .card__status{visibility:visible!important;position:static!important;left:auto!important;bottom:auto!important;display:flex!important;align-items:baseline!important;pointer-events:none;white-space:nowrap}' +  
        '.card__status-row .card__status .tvs-icon{font-size:1.1em;margin-right:0.2em;flex-shrink:0}' +  
        '.card__status-row .card__status .tvs-text{font-size:0.85em;font-weight:600;color:#ccc;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex-shrink:1;min-width:0}' +  
  
        /* .card__type -> внутрь .card__badge, на место жанра */  
        '.card__badge .card__type{visibility:visible!important;position:static!important;top:auto!important;left:auto!important;background:none!important;padding:0!important;border-radius:0!important;font-size:0.85em!important;color:#ccc!important;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1;min-width:0;order:1}' +  
  
        /* качество/рейтинг из предыдущего шага */  
        '.card__badge .card__quality{visibility:visible!important;position:static!important;left:auto!important;bottom:auto!important;padding:0!important;background:none!important;color:#ddd!important;font-size:1em!important;font-weight:700;border-radius:0!important;order:2}' +  
        '.card__badge .card__quality>div{display:inline}' +  
        '.card__badge .card__vote{visibility:visible!important;position:static!important;right:auto!important;bottom:auto!important;background:none!important;color:#ddd!important;font-size:1em!important;font-weight:700;padding:0!important;border-radius:0!important;order:3}' +  
    '</style>');  
  
    // Переносит .card__status/.card__type/.card__quality/.card__vote  
    // (создаются cardStatus.js / contentLabels.js / qualityPlugin.js / kpRating.js)  
    // из .card__view внутрь нужных контейнеров overlay, как только они появляются в DOM  
    function relocateExisting(view, statusRow, badge) {  
        var status = view.querySelector(':scope > .card__status');  
        var type = view.querySelector(':scope > .card__type');  
        var quality = view.querySelector(':scope > .card__quality');  
        var vote = view.querySelector(':scope > .card__vote');  
        if (status && status.parentNode !== statusRow) statusRow.appendChild(status);  
        if (type && type.parentNode !== badge) badge.insertBefore(type, badge.firstChild);  
        if (quality && quality.parentNode !== badge) badge.appendChild(quality);  
        if (vote && vote.parentNode !== badge) badge.appendChild(vote);  
        return !!(status && type && quality && vote);  
    }  
    function watchOverlayInjects(view, statusRow, badge) {  
        if (relocateExisting(view, statusRow, badge)) return;  
        var childObserver = new MutationObserver(function () {  
            if (relocateExisting(view, statusRow, badge)) childObserver.disconnect();  
        });  
        childObserver.observe(view, { childList: true });  
    }  
  
    function processCard(card) {  
        if (!card.card_data) return;  
        if (card.dataset.ccp) return;  
        card.dataset.ccp = '1';  
        var data = card.card_data;  
        var view = card.querySelector('.card__view');  
        if (!view) return;  
        var titleEl = card.querySelector('.card__title');  
        var ageEl = card.querySelector('.card__age');  
        if (titleEl) titleEl.style.display = 'none';  
        if (ageEl) ageEl.style.display = 'none';  
        var icons = card.querySelector('.card__icons');  
        if (icons) {  
            icons.style.cssText = 'top:0.5em;left:auto;right:0.5em;justify-content:flex-end;';  
            var inner = icons.querySelector('.card__icons-inner');  
            if (inner) inner.style.cssText = 'background:none;border-radius:0;flex-direction:column;';  
        }  
        var overlay = document.createElement('div');  
        overlay.className = 'card__overlay';  
        var overlayTitle = document.createElement('div');  
        overlayTitle.className = 'card__overlay-title';  
        overlayTitle.textContent = data.title || data.name || '';  
        overlay.appendChild(overlayTitle);  
        var statusRow = document.createElement('div');  
        statusRow.className = 'card__status-row';  
        overlay.appendChild(statusRow);  
        var badge = document.createElement('div');  
        badge.className = 'card__badge';  
        var year = ((data.release_date || data.first_air_date || '') + '').slice(0, 4);  
        if (year) {  
            var yearEl = document.createElement('span');  
            yearEl.className = 'card__badge-year';  
            yearEl.textContent = year;  
            badge.appendChild(yearEl);  
        }  
        overlay.appendChild(badge);  
        view.appendChild(overlay);  
        watchOverlayInjects(view, statusRow, badge);  
    }  
  
    var intersectionObserver = null;  
    if (typeof IntersectionObserver !== 'undefined') {  
        intersectionObserver = new IntersectionObserver(function (entries) {  
            entries.forEach(function (entry) {  
                if (!entry.isIntersecting) return;  
                intersectionObserver.unobserve(entry.target);  
                processCard(entry.target);  
            });  
        }, { rootMargin: '200px' });  
    }  
    function observe(card) {  
        if (!card.card_data || card.dataset.ccp) return;  
        if (intersectionObserver) intersectionObserver.observe(card);  
        else processCard(card);  
    }  
    var mutationObserver = new MutationObserver(function (mutations) {  
        mutations.forEach(function (mutation) {  
            mutation.addedNodes.forEach(function (node) {  
                if (node.nodeType !== 1) return;  
                if (node.classList && node.classList.contains('card')) observe(node);  
                if (node.querySelectorAll) [].forEach.call(node.querySelectorAll('.card'), observe);  
            });  
        });  
    });  
    mutationObserver.observe(document.body, { childList: true, subtree: true });  
    [].forEach.call(document.querySelectorAll('.card'), observe);  
    Lampa.Listener.follow('app', function (e) {  
        if (e.type === 'ready') [].forEach.call(document.querySelectorAll('.card'), observe);  
        if (e.type === 'destroy') {  
            if (intersectionObserver) intersectionObserver.disconnect();  
            mutationObserver.disconnect();  
        }  
    });  
})();
