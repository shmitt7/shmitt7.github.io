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
        '.card__quality-corner{position:absolute;top:0.5em;left:0.5em;z-index:2;pointer-events:none;background:rgba(20,20,20,.85);border:1px solid rgba(255,82,82,.35);border-radius:0.35em;padding:0.2em 0.5em;backdrop-filter:blur(4px)}' +
        '.card__quality-corner .card__quality{position:static!important;left:auto!important;bottom:auto!important;top:auto!important;padding:0!important;background:none!important;color:#ff5252!important;font-size:0.85em!important;font-weight:700!important;border-radius:0!important;text-shadow:none!important}' +
        '.card__quality-corner .card__quality>div{display:inline}' +
        '.card__title-wrap{display:none;position:absolute;left:0;right:0;bottom:2em;padding:0 0.6em;background:none;z-index:1;pointer-events:none}' +
        '.card.focus .card__title-wrap{display:block!important}' +
        '.card__overlay-title{text-align:center;color:#fff;font-size:1.3em;font-weight:400;line-height:1.15;background:rgba(0,0,0,0.8);border-radius:0.35em;padding:0.35em 0.55em;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;line-clamp:2;-webkit-box-orient:vertical}' +
        '.card__overlay{position:absolute;left:0;right:0;bottom:0;display:flex;justify-content:space-between;align-items:center;padding:0.2em 0.35em 0.3em 0.35em;background:rgba(10,10,10,.62);border-top:1px solid rgba(255,255,255,.12);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);z-index:1;pointer-events:none}' +
        '.card__badge-left{display:flex;align-items:center;flex-shrink:0}' +
        '.card__badge-left:empty{display:none}' +
        '.card__badge-year{font-size:0.85em;font-weight:600;color:#fff;background:rgba(0,0,0,0.4);border:1px solid rgba(255,255,255,0.12);border-radius:0.35em;padding:0.2em 0.5em;flex-shrink:0}' +
        '.card__badge-mid{flex:1 1 auto;display:flex;justify-content:center;align-items:center;min-width:0;overflow:hidden;margin:0 0.4em}' +
        '.card__badge-mid:empty{display:none}' +
        '.card__badge-mid .card__status{position:static!important;left:auto!important;top:auto!important;bottom:auto!important;background:rgba(0,0,0,.4)!important;border:1px solid rgba(255,255,255,.12)!important;padding:0.2em 0.5em!important;border-radius:0.35em!important;font-size:0.85em!important;font-weight:600!important;display:flex!important;align-items:baseline!important;pointer-events:none;white-space:nowrap;max-width:100%;overflow:hidden;color:#fff!important}' +
        '.card__badge-mid .card__status .tvs-icon{font-size:1.1em;margin-right:0.2em;flex-shrink:0}' +
        '.card__badge-mid .card__status .tvs-text{font-size:1em;font-weight:600;color:inherit;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex-shrink:1;min-width:0}' +
        '.card__badge-right{display:flex;align-items:center;flex-shrink:0}' +
        '.card__badge-right:empty{display:none}' +
        '.card__badge-right .card__vote{position:static!important;right:auto!important;bottom:auto!important;background:rgba(0,0,0,.4)!important;border:1px solid rgba(255,255,255,.12)!important;border-radius:0.35em!important;padding:0.2em 0.5em!important;color:#fff!important;font-size:0.85em!important;font-weight:600!important}' +
        '.card__status,.card__type,.card__quality,.card__vote{visibility:hidden!important}' +
        '.card__badge-mid .card__status,.card__badge-right .card__vote,.card__quality-corner .card__quality{visibility:visible!important}' +
    '</style>');
    var WATCH_TIMEOUT = 8000;
    var activeChildObservers = [];
    function relocateExisting(view, badgeLeft, badgeMid, badgeRight, qualityCorner) {
        var status = view.querySelector('.card__status');
        var quality = view.querySelector('.card__quality');
        var vote = view.querySelector('.card__vote');
        if (status && status.parentNode !== badgeMid) badgeMid.appendChild(status);
        if (vote && vote.parentNode !== badgeRight) badgeRight.appendChild(vote);
        if (quality) {
            var qtext = (quality.innerText || quality.textContent || '').trim().toUpperCase();
            if (qtext === 'TS') {
                if (quality.parentNode !== qualityCorner) qualityCorner.appendChild(quality);
                qualityCorner.style.display = '';
            } else {
                quality.remove();
                qualityCorner.style.display = 'none';
            }
        } else {
            qualityCorner.style.display = 'none';
        }
    }
    function watchOverlayInjects(view, badgeLeft, badgeMid, badgeRight, qualityCorner) {
        relocateExisting(view, badgeLeft, badgeMid, badgeRight, qualityCorner);
        var watchTimer = null;
        var childObserver = new MutationObserver(function () {
            relocateExisting(view, badgeLeft, badgeMid, badgeRight, qualityCorner);
        });
        function stopWatching() {
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
        var qualityCorner = document.createElement('div');
        qualityCorner.className = 'card__quality-corner';
        qualityCorner.style.display = 'none';
        view.appendChild(qualityCorner);
        var titleWrap = document.createElement('div');
        titleWrap.className = 'card__title-wrap';
        var overlayTitle = document.createElement('div');
        overlayTitle.className = 'card__overlay-title';
        overlayTitle.textContent = data.title || data.name || '';
        titleWrap.appendChild(overlayTitle);
        view.appendChild(titleWrap);
        var overlay = document.createElement('div');
        overlay.className = 'card__overlay';
        var badgeLeft = document.createElement('div');
        badgeLeft.className = 'card__badge-left';
        var year = ((data.release_date || data.first_air_date || '') + '').slice(0, 4);
        if (year) {
            var yearEl = document.createElement('span');
            yearEl.className = 'card__badge-year';
            yearEl.textContent = year;
            badgeLeft.appendChild(yearEl);
        }
        overlay.appendChild(badgeLeft);
        var badgeMid = document.createElement('div');
        badgeMid.className = 'card__badge-mid';
        overlay.appendChild(badgeMid);
        var badgeRight = document.createElement('div');
        badgeRight.className = 'card__badge-right';
        overlay.appendChild(badgeRight);
        view.appendChild(overlay);
        watchOverlayInjects(view, badgeLeft, badgeMid, badgeRight, qualityCorner);
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
