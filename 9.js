(function () {  
    if (window.listCard) return;  
    window.listCard = true;  
  
    document.head.insertAdjacentHTML('beforeend', '<style>' +  
        '.card__title{display:none!important}' +  
        '.card__age{display:none!important}' +  
        '.card.focus .card-watched{display:none!important}' +  
  
        '.card__icons{top:.5em!important;left:auto!important;right:.5em!important;justify-content:flex-end!important}' +  
        '.card__icons-inner{background:none!important;border-radius:0!important;flex-direction:column!important}' +  
        '.card__icons-inner>.card__icon{margin-bottom:.2em}' +  
        '.card__icon{filter:drop-shadow(0 1px 4px rgba(0,0,0,1)) drop-shadow(0 0 8px rgba(0,0,0,.9))!important}' +  
  
        /* название только по фокусу */  
        '.card__title-wrap{display:none;position:absolute;left:0;right:0;bottom:2.6em;padding:0 .6em;z-index:1;pointer-events:none}' +  
        '.card.focus .card__title-wrap{display:block!important}' +  
        '.card__overlay-title{text-align:center;color:#fff;font-size:1.3em;font-weight:400;line-height:1.15;background:rgba(0,0,0,.78);border-radius:.35em;padding:.35em .55em;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;line-clamp:2;-webkit-box-orient:vertical}' +  
  
        /* единая нижняя подложка */  
        '.card__overlay{position:absolute;left:0;right:0;bottom:0;display:flex;justify-content:center;align-items:center;gap:.6em;padding:1.6em .5em .4em;background:linear-gradient(to bottom,rgba(0,0,0,0),rgba(8,8,8,.35) 35%,rgba(8,8,8,.78) 100%);z-index:1;pointer-events:none}' +  
  
        /* единый стиль для всех бейджей: год / статус / качество / рейтинг */  
        '.card__badge{font-size:1em;font-weight:600;color:#fff;text-shadow:0 1px 4px #000;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%;display:flex;align-items:baseline;min-width:0}' +  
        '.card__badge:empty{display:none}' +  
  
        '.card__age,.card__quality,.card__vote,.card__status{' +  
            'position:static!important;left:auto!important;right:auto!important;top:auto!important;bottom:auto!important;' +  
            'background:none!important;border:0!important;padding:0!important;border-radius:0!important;' +  
            'font-size:1em!important;font-weight:600!important;color:#fff!important;text-shadow:0 1px 4px #000!important;' +  
            'visibility:visible!important' +  
        '}' +  
        '.card__quality>div{display:inline}' +  
        '.card__status .tvs-icon{font-size:1.1em;margin-right:.2em;flex-shrink:0}' +  
        '.card__status .tvs-text{font-size:1em;font-weight:600;color:inherit;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex-shrink:1;min-width:0}' +  
    '</style>');  
  
    var WATCH_TIMEOUT = 8000;  
    var activeChildObservers = [];  
  
    // порядок в ряду: год -> качество -> статус -> рейтинг  
    function relocateExisting(view, overlay) {  
        var age = view.querySelector('.card__age');  
        var quality = view.querySelector('.card__quality');  
        var status = view.querySelector('.card__status');  
        var vote = view.querySelector('.card__vote');  
  
        [age, quality, status, vote].forEach(function (el) {  
            if (el && el.parentNode !== overlay) overlay.appendChild(el);  
        });  
  
        if (age) age.style.display = '';  
    }  
  
    function watchOverlayInjects(view, overlay) {  
        relocateExisting(view, overlay);  
  
        var childObserver = new MutationObserver(function () {  
            relocateExisting(view, overlay);  
        });  
  
        function stopWatching() {  
            childObserver.disconnect();  
            var idx = activeChildObservers.indexOf(childObserver);  
            if (idx !== -1) activeChildObservers.splice(idx, 1);  
        }  
  
        setTimeout(stopWatching, WATCH_TIMEOUT);  
        childObserver.observe(view, { childList: true });  
        activeChildObservers.push(childObserver);  
    }  
  
    function processCard(card) {  
        var data = card.card_data;  
        if (!data) return;  
  
        var view = card.querySelector('.card__view');  
        if (!view) return;  
  
        card.dataset.listCard = '1';  
  
        var icons = card.querySelector('.card__icons');  
        if (icons) {  
            icons.style.cssText = 'top:.5em;left:auto;right:.5em;justify-content:flex-end;';  
            var iconsInner = icons.querySelector('.card__icons-inner');  
            if (iconsInner) iconsInner.style.cssText = 'background:none;border-radius:0;flex-direction:column;';  
        }  
  
        var titleWrap = document.createElement('div');  
        titleWrap.className = 'card__title-wrap';  
  
        var overlayTitle = document.createElement('div');  
        overlayTitle.className = 'card__overlay-title';  
        overlayTitle.textContent = data.title || data.name || '';  
  
        titleWrap.appendChild(overlayTitle);  
        view.appendChild(titleWrap);  
  
        var overlay = document.createElement('div');  
        overlay.className = 'card__overlay';  
        view.appendChild(overlay);  
  
        watchOverlayInjects(view, overlay);  
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
        if (e.type === 'ready') {  
            [].forEach.call(document.querySelectorAll('.card'), observe);  
        }  
  
        if (e.type === 'destroy') {  
            if (intersectionObserver) intersectionObserver.disconnect();  
            mutationObserver.disconnect();  
  
            for (var i = 0; i < activeChildObservers.length; i++) {  
                activeChildObservers[i].disconnect();  
            }  
  
            activeChildObservers = [];  
        }  
    });  
})();
