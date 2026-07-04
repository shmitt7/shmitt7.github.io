(function() {  
    if (window.plugin_tv_status_ready) return;  
    window.plugin_tv_status_ready = true;  
    var ICONS = {  
        'Returning Series': '▶',  
        'Ended': '✔',  
        'Canceled': '✘',  
        'In Production': '⏳',  
        'Planned': '◷',  
        'Pilot': '★'  
    };  
    var COLORS = {  
        'Returning Series': '#4CAF50',  
        'Ended': '#2196F3',  
        'Canceled': '#f44336',  
        'In Production': '#FF9800',  
        'Planned': '#9C27B0',  
        'Pilot': '#00BCD4'  
    };  
    var intersectionObserver = null;  
    var mutationObserver = null;  
    var initialized = false;  
    function parseDate(dateStr) {  
        var parts = dateStr.split('-');  
        return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));  
    }  
    function daysUntil(dateStr) {  
        if (!dateStr) return -1;  
        var today = new Date();  
        today.setHours(0, 0, 0, 0);  
        var target = parseDate(dateStr);  
        return Math.round((target.getTime() - today.getTime()) / 86400000);  
    }  
    function formatDate(dateStr) {  
        var parts = dateStr.split('-');  
        if (parts.length < 3) return dateStr;  
        return parts[2] + '.' + parts[1] + '.' + parts[0].slice(2);  
    }  
    function buildPremiereText(dateStr) {  
        if (!dateStr) return null;  
        var days = daysUntil(dateStr);  
        if (days <= 0) return null;  
        if (days <= 60) return 'Премьера · ' + days + 'дн.';  
        return 'Премьера · ' + formatDate(dateStr);  
    }  
    function buildText(info) {  
        var last = info.last_episode_to_air;  
        var next = info.next_episode_to_air;  
        var seasons = info.seasons || [];  
        if (!last) return null;  
        var curS = last.season_number;  
        var curE = last.episode_number;  
        var airedTotal = 0;  
        for (var i = 0; i < seasons.length; i++) {  
            var season = seasons[i];  
            if (season.season_number > 0 && season.season_number < curS) {  
                airedTotal += season.episode_count;  
            }  
        }  
        airedTotal += curE;  
        var sPart = 'S' + curS;  
        var ePart = 'E' + airedTotal;  
        if (next) {  
            var totalAll = info.number_of_episodes;  
            if (next.season_number > curS) {  
                sPart += '/S' + next.season_number;  
                if (totalAll && totalAll > airedTotal) ePart += '/E' + totalAll;  
            } else if (next.season_number === curS && totalAll && totalAll > airedTotal) {  
                ePart += '/E' + totalAll;  
            }  
        }  
        return sPart + ':' + ePart;  
    }  
    function applyLabel(cardElem, info) {  
        if (cardElem._tvsDone) return;  
        cardElem._tvsDone = true;  
        var text, icon, color, topPosition;  
        var isTV = cardElem.classList.contains('card--tv');  
        if (isTV) {  
            if (!info.last_episode_to_air) {  
                text = buildPremiereText(info.first_air_date);  
                icon = '◷';  
                color = '#9C27B0';  
                topPosition = false;  
            } else {  
                text = buildText(info);  
                icon = ICONS[info.status] || '?';  
                color = COLORS[info.status] || '#888';  
                topPosition = false;  
            }  
        } else {  
            text = buildPremiereText(info.release_date);  
            icon = '◆';  
            color = '#FF9800';  
            topPosition = true;  
        }  
        if (!text) return;  
        var viewElem = cardElem.querySelector('.card__view');  
        if (!viewElem) return;  
        var label = document.createElement('div');  
        label.className = topPosition ? 'tvs-label tvs-top' : 'tvs-label';  
        label.style.borderLeftColor = color;  
        label.innerHTML = '<span class="tvs-icon" style="color:' + color + '">' + icon + '</span><span class="tvs-text">' + text + '</span>';  
        var typeElem = cardElem.querySelector('.card__type');  
        if (typeElem) {  
            typeElem.parentNode.insertBefore(label, typeElem.nextSibling);  
        } else {  
            viewElem.appendChild(label);  
        }  
    }  
    function fetchAndApply(cardElem, data) {  
        if (!data || !data.id) return;  
        if (data.original_name) {  
            var url = Lampa.TMDB.api('tv/' + data.id + '?api_key=' + Lampa.TMDB.key());  
            var network = new Lampa.Reguest();  
            network.silent(url, function(resp) {  
                if (resp && resp.id) applyLabel(cardElem, resp);  
            }, function() {}, false, { cache: { life: 30 } });  
        } else if (data.release_date) {  
            applyLabel(cardElem, data);  
        }  
    }  
    function attachToCard(cardElem) {  
        if (cardElem._tvsAttached) return;  
        cardElem._tvsAttached = true;  
        if (intersectionObserver) intersectionObserver.observe(cardElem);  
    }  
    function wrapOldCard() {  
        if (!Lampa.Card) return;  
        var Orig = Lampa.Card;  
        Lampa.Card = function(data, params) {  
            var inst = new Orig(data, params);  
            var origBuild = inst.build;  
            inst.build = function() {  
                origBuild.call(inst);  
                if (inst.card) inst.card.card_data = data;  
            };  
            return inst;  
        };  
        Lampa.Card.prototype = Orig.prototype;  
    }  
    function startMutationObserver() {  
        mutationObserver = new MutationObserver(function(mutations) {  
            for (var i = 0; i < mutations.length; i++) {  
                var nodes = mutations[i].addedNodes;  
                for (var j = 0; j < nodes.length; j++) {  
                    var node = nodes[j];  
                    if (node.nodeType !== 1) continue;  
                    if (node.classList && node.classList.contains('card')) {  
                        attachToCard(node);  
                    }  
                    if (node.querySelectorAll) {  
                        var cards = node.querySelectorAll('.card');  
                        for (var k = 0; k < cards.length; k++) {  
                            attachToCard(cards[k]);  
                        }  
                    }  
                }  
            }  
        });  
        mutationObserver.observe(document.body, { childList: true, subtree: true });  
    }  
    function addStyles() {  
        document.head.insertAdjacentHTML('beforeend', '<style>.tvs-label{position:absolute;left:-0.8em;top:3.4em;padding:0.3em 0.5em;background:rgba(0,0,0,0.80);color:#fff;font-size:0.75em;border-radius:0.3em;border-left:2px solid #fff;z-index:2;display:flex;align-items:center;white-space:nowrap;line-height:1;pointer-events:none;}.tvs-label.tvs-top{top:1.4em;}.tvs-icon{font-size:0.9em;line-height:1;margin-right:0.3em;}.tvs-text{font-size:0.85em;font-weight:700;letter-spacing:0.03em;}</style>');  
    }  
    function destroy() {  
        if (mutationObserver) {  
            mutationObserver.disconnect();  
            mutationObserver = null;  
        }  
        if (intersectionObserver) {  
            intersectionObserver.disconnect();  
            intersectionObserver = null;  
        }  
    }  
    function init() {  
        if (initialized) return;  
        initialized = true;  
        addStyles();  
        if (typeof IntersectionObserver !== 'undefined') {  
            intersectionObserver = new IntersectionObserver(function(entries) {  
                for (var i = 0; i < entries.length; i++) {  
                    var entry = entries[i];  
                    if (!entry.isIntersecting) continue;  
                    var cardElem = entry.target;  
                    intersectionObserver.unobserve(cardElem);  
                    var cardData = cardElem.card_data;  
                    if (cardData) fetchAndApply(cardElem, cardData);  
                }  
            }, { threshold: 0.1 });  
        }  
        wrapOldCard();  
        startMutationObserver();  
    }  
    Lampa.Listener.follow('app', function(e) {  
        if (e.type === 'ready') init();  
        if (e.type === 'destroy') destroy();  
    });  
    if (window.appready) init();  
})();
