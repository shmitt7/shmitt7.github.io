(function() {  
    var PLUGIN_KEY = 'card_underlay_enabled';  
    var PLUGIN_READY_KEY = 'card_underlay_plugin_ready';  
  
    if (window[PLUGIN_READY_KEY]) return;  
    window[PLUGIN_READY_KEY] = true;  
  
    var mutationObserver = null;  
    var initialized = false;  
  
    function isEnabled() {  
        return Lampa.Storage.get(PLUGIN_KEY, false);  
    }  
  
    function injectUnderlay(cardElement) {  
        if (cardElement.getAttribute('data-underlay-done')) return;  
        cardElement.setAttribute('data-underlay-done', '1');  
  
        var view = cardElement.querySelector('.card__view');  
        if (!view) return;  
  
        var titleEl = cardElement.querySelector('.card__title');  
        var ageEl = cardElement.querySelector('.card__age');  
        var voteEl = cardElement.querySelector('.card__vote');  
  
        var titleText = titleEl ? (titleEl.innerText || titleEl.textContent || '') : '';  
        var ageText = ageEl ? (ageEl.innerText || ageEl.textContent || '') : '';  
        var voteText = voteEl ? (voteEl.innerText || voteEl.textContent || '') : '';  
  
        var metaText = '';  
        if (ageText) metaText = ageText;  
        if (voteText) metaText = metaText ? (metaText + ' · ' + voteText) : voteText;  
  
        var underlay = document.createElement('div');  
        underlay.className = 'card__underlay';  
  
        var titleDiv = document.createElement('div');  
        titleDiv.className = 'card__underlay-title';  
        titleDiv.innerText = titleText;  
        underlay.appendChild(titleDiv);  
  
        if (metaText) {  
            var metaDiv = document.createElement('div');  
            metaDiv.className = 'card__underlay-meta';  
            metaDiv.innerText = metaText;  
            underlay.appendChild(metaDiv);  
        }  
  
        view.appendChild(underlay);  
        cardElement.classList.add('card--underlay');  
    }  
  
    function processCard(cardElement) {  
        if (!cardElement.classList) return;  
        if (!cardElement.classList.contains('card')) return;  
        if (cardElement.classList.contains('card--wide')) return;  
        injectUnderlay(cardElement);  
    }  
  
    function processExistingCards() {  
        var cards = document.querySelectorAll('.card:not([data-underlay-done])');  
        [].forEach.call(cards, function(card) {  
            processCard(card);  
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
  
    function stopObserver() {  
        if (mutationObserver) {  
            mutationObserver.disconnect();  
            mutationObserver = null;  
        }  
    }  
  
    function removeAllUnderlays() {  
        var cards = document.querySelectorAll('.card--underlay');  
        [].forEach.call(cards, function(card) {  
            card.classList.remove('card--underlay');  
            card.removeAttribute('data-underlay-done');  
            var underlayEl = card.querySelector('.card__underlay');  
            if (underlayEl && underlayEl.parentNode) {  
                underlayEl.parentNode.removeChild(underlayEl);  
            }  
        });  
    }  
  
    function addStyles() {  
        document.head.insertAdjacentHTML('beforeend',  
            '<style id="card-underlay-plugin-style">' +  
            '.card--underlay .card__title,' +  
            '.card--underlay .card__age {' +  
                'display: none;' +  
            '}' +  
            '.card--underlay .card__vote {' +  
                'display: none;' +  
            '}' +  
            '.card__underlay {' +  
                'position: absolute;' +  
                'left: 0;' +  
                'right: 0;' +  
                'bottom: 0;' +  
                'height: 30%;' +  
                'padding: 0.5em 0.7em 0.6em;' +  
                'background: -webkit-linear-gradient(top, rgba(0,0,0,0) 0%, rgba(0,0,0,0.82) 100%);' +  
                'background: linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.82) 100%);' +  
                'border-bottom-left-radius: 1em;' +  
                'border-bottom-right-radius: 1em;' +  
                'display: -webkit-box;' +  
                'display: -webkit-flex;' +  
                'display: flex;' +  
                '-webkit-box-orient: vertical;' +  
                '-webkit-box-direction: normal;' +  
                '-webkit-flex-direction: column;' +  
                'flex-direction: column;' +  
                '-webkit-box-pack: end;' +  
                '-webkit-justify-content: flex-end;' +  
                'justify-content: flex-end;' +  
                'color: #fff;' +  
                'z-index: 1;' +  
                'pointer-events: none;' +  
                '-webkit-box-sizing: border-box;' +  
                'box-sizing: border-box;' +  
            '}' +  
            '.card__underlay-title {' +  
                'font-size: 1.1em;' +  
                'font-weight: 600;' +  
                'line-height: 1.2;' +  
                'overflow: hidden;' +  
                'white-space: nowrap;' +  
                'text-overflow: ellipsis;' +  
            '}' +  
            '.card__underlay-meta {' +  
                'font-size: 0.8em;' +  
                'opacity: 0.8;' +  
                'margin-top: 0.2em;' +  
                'white-space: nowrap;' +  
                'overflow: hidden;' +  
                'text-overflow: ellipsis;' +  
            '}' +  
            '</style>'  
        );  
    }  
  
    function addSettings() {  
        if (Lampa.SettingsApi && Lampa.SettingsApi.addParam) {  
            Lampa.SettingsApi.addParam({  
                component: 'interface',  
                param: {  
                    name: PLUGIN_KEY,  
                    type: 'trigger',  
                    default: false  
                },  
                field: {  
                    name: 'Подложка на карточках',  
                    description: 'Название и рейтинг внутри постера'  
                },  
                onChange: function(value) {  
                    var enabled = value === 'true' || value === true;  
                    if (enabled) {  
                        startObserver();  
                    } else {  
                        stopObserver();  
                        removeAllUnderlays();  
                    }  
                }  
            });  
        }  
    }  
  
    function init() {  
        if (initialized) return;  
        initialized = true;  
  
        addStyles();  
        addSettings();  
  
        if (isEnabled()) {  
            startObserver();  
        }  
    }  
  
    Lampa.Listener.follow('app', function(e) {  
        if (e.type === 'ready') init();  
        if (e.type === 'destroy') stopObserver();  
    });  
  
    if (window.appready) init();  
})();
