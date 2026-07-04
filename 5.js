(function() {  
    if (window.plugin_tv_status_ready) return;  
    window.plugin_tv_status_ready = true;  
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
    function formatDateLabel(dateStr, maxDays) {  
        if (!dateStr) return null;  
        var days = daysUntil(dateStr);  
        if (days <= 0) return null;  
        if (days <= 30) return days + 'дн.';  
        if (days <= maxDays) return formatDate(dateStr);  
        return null;  
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
    function getTVLabelInfo(info) {  
        var last = info.last_episode_to_air;  
        var next = info.next_episode_to_air;  
        var status = info.status;  
        if (!last) {  
            if (status === 'In Production') {  
                var dateLabel = formatDateLabel(info.first_air_date, Infinity);  
                return {  
                    text: dateLabel ? 'Премьера · ' + dateLabel : 'В производстве',  
                    icon: '⚙',  
                    color: '#FF9800'  
                };  
            }  
            if (status === 'Planned') {  
                var dateLabel = formatDateLabel(info.first_air_date, Infinity);  
                return {  
                    text: dateLabel ? 'Премьера · ' + dateLabel : 'Запланировано',  
                    icon: '◷',  
                    color: '#9C27B0'  
                };  
            }  
            if (status === 'Pilot') {  
                return { text: 'Пилот', icon: '★', color: '#00BCD4' };  
            }  
            var dateLabel = formatDateLabel(info.first_air_date, 90);  
            if (dateLabel) return { text: 'Премьера · ' + dateLabel, icon: '◷', color: '#9C27B0' };  
            return null;  
        }  
        var text = buildText(info);  
        if (!text) return null;  
        if (status === 'Canceled') {  
            return { text: text, icon: '✘', color: '#f44336' };  
        }  
        if (status === 'Ended') {  
            return { text: text, icon: '✔', color: '#9E9E9E' };  
        }  
        if (status === 'Pilot') {  
            return { text: text, icon: '★', color: '#00BCD4' };  
        }  
        if (next && next.air_date) {  
            var days = daysUntil(next.air_date);  
            if (days >= 0 && days <= 14) {  
                return { text: text, icon: '▶', color: '#4CAF50' };  
            }  
        }  
        return { text: text, icon: '‖', color: '#2196F3' };  
    }  
    function getMovieLabelInfo(info) {  
        var status = info.status;  
        var releaseDate = info.release_date;  
        if (status === 'Released') return null;  
        if (status === 'Canceled') {  
            return { text: 'Отменён', icon: '✘', color: '#f44336' };  
        }  
        if (status === 'Rumored') {  
            return { text: 'По слухам', icon: '◷', color: '#9C27B0' };  
        }  
        if (status === 'In Production') {  
            return { text: 'В производстве', icon: '⚙', color: '#FF9800' };  
        }  
        if (status === 'Post Production') {  
            var dateLabel = formatDateLabel(releaseDate, 90);  
            return {  
                text: dateLabel ? 'Скоро · ' + dateLabel : 'Скоро',  
                icon: '⏳',  
                color: '#FFC107'  
            };  
        }  
        if (status === 'Planned') {  
            var dateLabel = formatDateLabel(releaseDate, 90);  
            return {  
                text: dateLabel ? 'Премьера · ' + dateLabel : 'Запланировано',  
                icon: '◷',  
                color: '#9C27B0'  
            };  
        }  
        var dateLabel = formatDateLabel(releaseDate, 90);  
        if (dateLabel) return { text: 'Премьера · ' + dateLabel, icon: '◆', color: '#FF9800' };  
        return null;  
    }  
    function applyLabel(cardElem, info) {  
        if (cardElem._tvsDone) return;  
        cardElem._tvsDone = true;  
        var labelInfo;  
        var isTV = cardElem.classList.contains('card--tv');  
        if (isTV) {  
            labelInfo = getTVLabelInfo(info);  
        } else {  
            labelInfo = getMovieLabelInfo(info);  
        }  
        if (!labelInfo || !labelInfo.text) return;  
        var viewElem = cardElem.querySelector('.card__view');  
        if (!viewElem) return;  
        var label = document.createElement('div');  
        label.className = 'tvs-label';  
        label.style.borderLeftColor = labelInfo.color;  
        label.innerHTML = '<span class="tvs-icon" style="color:' + labelInfo.color + '">' + labelInfo.icon + '</span><span class="tvs-text">' + labelInfo.text + '</span>';  
        var typeElem = cardElem.querySelector('.card__type');  
        if (typeElem) {  
            typeElem.parentNode.insertBefore(label, typeElem.nextSibling);  
        } else {  
            viewElem.appendChild(label);  
        }  
    }  
    function fetchAndApply(cardElem, data) {  
        if (!data || !data.id) return;  
        var network = new Lampa.Reguest();  
        if (data.original_name) {  
            var url = Lampa.TMDB.api('tv/' + data.id + '?api_key=' + Lampa.TMDB.key());  
            network.silent(url, function(resp) {  
                if (resp && resp.id) applyLabel(cardElem, resp);  
            }, function() {}, false, { cache: { life: 30 } });  
        } else if (data.original_title || data.title) {  
            if (data.release_date && daysUntil(data.release_date) < -30) return;  
            var url = Lampa.TMDB.api('movie/' + data.id + '?api_key=' + Lampa.TMDB.key());  
            network.silent(url, function(resp) {  
                if (resp && resp.id) applyLabel(cardElem, resp);  
            }, function() {}, false, { cache: { life: 30 } });  
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
        document.head.insertAdjacentHTML('beforeend', '<style>.tvs-label{position:absolute;left:-0.8em;top:3.4em;padding:0.3em 0.5em;background:rgba(0,0,0,0.80);color:#fff;font-size:0.75em;border-radius:0.3em;border-left:2px solid #fff;z-index:2;display:flex;align-items:center;white-space:nowrap;line-height:1;pointer-events:none;}.tvs-icon{font-size:0.9em;line-height:1;margin-right:0.3em;}.tvs-text{font-size:0.85em;font-weight:700;letter-spacing:0.03em;}</style>');  
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
