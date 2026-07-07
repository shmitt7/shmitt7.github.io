(function() {  
    if (window.plugin_tv_status_ready) return;  
    window.plugin_tv_status_ready = true;  
  
    var intersectionObserver = null;  
    var mutationObserver = null;  
    var initialized = false;  
  
    function daysUntil(dateStr) {  
        if (!dateStr) return -1;  
        var today = new Date();  
        today.setHours(0, 0, 0, 0);  
        var target = Lampa.Utils.parseToDate(dateStr);  
        return Math.round((target.getTime() - today.getTime()) / 86400000);  
    }  
  
    function formatDateLabel(dateStr) {  
        if (!dateStr) return null;  
        var parts = dateStr.split('-');  
        if (parts.length === 1 && parts[0].length === 4) return parts[0];  
        if (parts.length === 2) return parts[1] + '.' + parts[0].slice(2);  
        var days = daysUntil(dateStr);  
        if (days <= 0) return null;  
        if (days <= 30) return 'Премьера ' + days + 'дн.';  
        return parts[2] + '.' + parts[1] + '.' + parts[0].slice(2);  
    }  
  
    function formatPremiereLabel(dateStr) {  
        if (!dateStr) return 'Премьера';  
        var parts = dateStr.split('-');  
        if (parts.length === 1 && parts[0].length === 4) return 'Премьера ' + parts[0];  
        if (parts.length === 2) return 'Премьера ' + parts[1] + '.' + parts[0].slice(2);  
        var days = daysUntil(dateStr);  
        if (days > 0 && days <= 30) return 'Премьера ' + days + 'дн.';  
        return 'Премьера ' + parts[2] + '.' + parts[1] + '.' + parts[0].slice(2);  
    }  
  
    function formatYearLabel(dateStr) {  
        if (!dateStr) return null;  
        return dateStr.split('-')[0];  
    }  
  
    function buildEpisodeText(info) {  
        var last = info.last_episode_to_air;  
        var next = info.next_episode_to_air;  
        var seasons = info.seasons || [];  
        if (!last) return null;  
        var curS = last.season_number;  
        var airedTotal = 0;  
        for (var i = 0; i < seasons.length; i++) {  
            var season = seasons[i];  
            if (season.season_number > 0 && season.season_number < curS) {  
                airedTotal += season.episode_count;  
            }  
        }  
        airedTotal += last.episode_number;  
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
        var episodeText = buildEpisodeText(info);  
  
        if (!last) {  
            if (status === 'Returning Series') {  
                var dateLabel = formatDateLabel(info.first_air_date);  
                return { text: dateLabel || 'Онгоинг', icon: '▶', color: '#4CAF50' };  
            }  
            if (status === 'In Production') {  
                return { text: formatPremiereLabel(info.first_air_date), icon: '✦', color: '#9C27B0' };  
            }  
            if (status === 'Planned') {  
                var year = formatYearLabel(info.first_air_date);  
                return { text: 'Запланировано' + (year ? ' ' + year : ''), icon: '❱', color: '#9C27B0' };  
            }  
            return null;  
        }  
  
        if (status === 'Returning Series') {  
            var nextDays = (next && next.air_date) ? daysUntil(next.air_date) : 999;  
            if (nextDays >= 0 && nextDays <= 8) {  
                return { text: episodeText, icon: '▶', color: '#4CAF50' };  
            }  
            return { text: episodeText, icon: '⏯︎', color: '#2196F3' };  
        }  
        if (status === 'Ended')    return { text: episodeText, icon: '✔', color: '#FFC107' };  
        if (status === 'Canceled') return { text: episodeText, icon: '✘', color: '#f44336' };  
        if (status === 'Pilot')    return { text: 'Пилот',     icon: '✔', color: '#FFC107' };  
        if (status === 'In Production') {  
            return { text: formatPremiereLabel(info.first_air_date), icon: '✦', color: '#9C27B0' };  
        }  
        if (status === 'Planned') {  
            var year = formatYearLabel(info.first_air_date);  
            return { text: 'Запланировано' + (year ? ' ' + year : ''), icon: '❱', color: '#9C27B0' };  
        }  
        return { text: episodeText, icon: '⏯︎', color: '#2196F3' };  
    }  
  
    function getMovieLabelInfo(info) {  
        var status = info.status;  
        var releaseDate = info.release_date;  
  
        if (status === 'Rumored') {  
            var year = formatYearLabel(releaseDate);  
            return { text: 'По слухам' + (year ? ' ' + year : ''), icon: '❱', color: '#9C27B0' };  
        }  
        if (status === 'Planned') {  
            var year = formatYearLabel(releaseDate);  
            return { text: 'Запланировано' + (year ? ' ' + year : ''), icon: '❱', color: '#9C27B0' };  
        }  
        if (status === 'In Production') {  
            return { text: formatPremiereLabel(releaseDate), icon: '✦', color: '#9C27B0' };  
        }  
        if (status === 'Post Production') {  
            return { text: formatPremiereLabel(releaseDate), icon: '✦', color: '#9C27B0' };  
        }  
        if (status === 'Released') return null;  
        if (status === 'Canceled') return { text: 'Отменён', icon: '✘', color: '#f44336' };  
        return null;  
    }  
  
    function applyLabel(cardElem, info, isTV) {  
        if (cardElem._tvsDone) return;  
        cardElem._tvsDone = true;  
        var labelInfo = isTV ? getTVLabelInfo(info) : getMovieLabelInfo(info);  
        if (!labelInfo || !labelInfo.text) return;  
        var viewElem = cardElem.querySelector('.card__view');  
        if (!viewElem) return;  
        var label = document.createElement('div');  
        label.className = 'tvs-label';  
        label.style.borderLeftColor = labelInfo.color;  
        var iconSpan = document.createElement('span');  
        iconSpan.className = 'tvs-icon';  
        iconSpan.style.color = labelInfo.color;  
        iconSpan.textContent = labelInfo.icon;  
        var textSpan = document.createElement('span');  
        textSpan.className = 'tvs-text';  
        textSpan.textContent = labelInfo.text;  
        label.appendChild(iconSpan);  
        label.appendChild(textSpan);  
        var typeElem = cardElem.querySelector('.card__type');  
        if (typeElem) {  
            typeElem.parentNode.insertBefore(label, typeElem.nextSibling);  
        } else {  
            viewElem.appendChild(label);  
        }  
    }  
  
    // Проверка: это карточка актёра/персоны, а не фильма/сериала  
    function isPersonData(data) {  
        return !!(  
            data.known_for_department !== undefined ||  
            (data.profile_path && !data.poster_path && !data.backdrop_path)  
        );  
    }  
  
    function fetchAndApply(cardElem, data) {  
        if (cardElem._tvsDone) return;  
        // Пропускаем карточки актёров — у них есть original_name (имя),  
        // что иначе ошибочно определялось бы как сериал  
        if (isPersonData(data)) return;  
        var isTV = !!(data.original_name || data.first_air_date);  
        if (isTV) {  
            var tvNetwork = new Lampa.Reguest();  
            tvNetwork.silent(  
                Lampa.TMDB.api('tv/' + data.id + '?api_key=' + Lampa.TMDB.key()),  
                function(resp) {  
                    if (resp && resp.id) applyLabel(cardElem, resp, true);  
                },  
                function() {},  
                false,  
                { cache: { life: 30 } }  
            );  
        } else if (data.release_date || data.original_title) {  
            var movieNetwork = new Lampa.Reguest();  
            movieNetwork.silent(  
                Lampa.TMDB.api('movie/' + data.id + '?api_key=' + Lampa.TMDB.key()),  
                function(resp) {  
                    if (resp && resp.id) applyLabel(cardElem, resp, false);  
                },  
                function() {},  
                false,  
                { cache: { life: 30 } }  
            );  
        }  
    }  
  
    function attachToCard(cardElem) {  
        if (cardElem._tvsAttached) return;  
        cardElem._tvsAttached = true;  
        if (intersectionObserver) {  
            intersectionObserver.observe(cardElem);  
        } else {  
            var cardData = cardElem.card_data;  
            if (cardData) fetchAndApply(cardElem, cardData);  
        }  
    }  
  
    function wrapOldCard() {  
        var Orig = Lampa.Card;  
        Lampa.Card = function(data, params) {  
            var inst = new Orig(data, params);  
            if (data && (data.original_name || data.first_air_date || data.release_date || data.original_title)) {  
                var origBuild = inst.build;  
                inst.build = function() {  
                    origBuild.call(inst);  
                    if (inst.card) inst.card.card_data = data;  
                };  
            }  
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
