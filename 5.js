(function() {  
    if (window.cardStatus) return;  
    window.cardStatus = true;  
  
    var SVG_PLAY      = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path fill="currentColor" d="M3 3.732a1.5 1.5 0 0 1 2.305-1.265l6.706 4.267a1.5 1.5 0 0 1 0 2.531l-6.706 4.268A1.5 1.5 0 0 1 3 12.267z"/></svg>';  
    var SVG_PLAYPAUSE = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path fill="currentColor" d="M1 4.804a1 1 0 0 1 1.53-.848l5.113 3.196a1 1 0 0 1 0 1.696L2.53 12.044A1 1 0 0 1 1 11.196zM13.5 4.5A.5.5 0 0 1 14 4h.5a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-.5.5H14a.5.5 0 0 1-.5-.5zm-3-.5a.5.5 0 0 0-.5.5v7a.5.5 0 0 0 .5.5h.5a.5.5 0 0 0 .5-.5v-7A.5.5 0 0 0 11 4z"/></svg>';  
    var SVG_BOLT      = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path fill="currentColor" fill-rule="evenodd" d="M9.58 1.077a.75.75 0 0 1 .405.82L9.165 6h4.085a.75.75 0 0 1 .567 1.241l-6.5 7.5a.75.75 0 0 1-1.302-.638L6.835 10H2.75a.75.75 0 0 1-.567-1.241l6.5-7.5a.75.75 0 0 1 .897-.182" clip-rule="evenodd"/></svg>';  
    var SVG_TICKET    = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path fill="currentColor" fill-rule="evenodd" d="M1 4.5A1.5 1.5 0 0 1 2.5 3h11A1.5 1.5 0 0 1 15 4.5v1c0 .276-.227.494-.495.562a2 2 0 0 0 0 3.876c.268.068.495.286.495.562v1a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 1 11.5v-1c0-.276.227-.494.495-.562a2 2 0 0 0 0-3.876C1.227 5.994 1 5.776 1 5.5zm9 1.25a.75.75 0 0 1 1.5 0v1a.75.75 0 0 1-1.5 0zm.75 2.75a.75.75 0 0 0-.75.75v1a.75.75 0 0 0 1.5 0v-1a.75.75 0 0 0-.75-.75" clip-rule="evenodd"/></svg>';  
    var SVG_CHECK     = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path fill="currentColor" fill-rule="evenodd" d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353l4.493-6.74a.75.75 0 0 1 1.04-.207" clip-rule="evenodd"/></svg>';  
    var SVG_XMARK     = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path fill="currentColor" d="M5.28 4.22a.75.75 0 0 0-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 1 0 1.06 1.06L8 9.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L9.06 8l2.72-2.72a.75.75 0 0 0-1.06-1.06L8 6.94z"/></svg>';  
  
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
        var currentSeason = last.season_number;  
        var airedTotal = 0;  
        for (var i = 0; i < seasons.length; i++) {  
            var season = seasons[i];  
            if (season.season_number > 0 && season.season_number < currentSeason) {  
                airedTotal += season.episode_count;  
            }  
        }  
        airedTotal += last.episode_number;  
        var seasonPart = 'S' + currentSeason;  
        var episodePart = 'E' + airedTotal;  
        if (next) {  
            var totalEpisodes = info.number_of_episodes;  
            if (next.season_number > currentSeason) {  
                seasonPart += '/S' + next.season_number;  
                if (totalEpisodes && totalEpisodes > airedTotal) episodePart += '/E' + totalEpisodes;  
            } else if (next.season_number === currentSeason && totalEpisodes && totalEpisodes > airedTotal) {  
                episodePart += '/E' + totalEpisodes;  
            }  
        }  
        return seasonPart + ':' + episodePart;  
    }  
  
    function getTVLabelInfo(info) {  
        var last = info.last_episode_to_air;  
        var next = info.next_episode_to_air;  
        var status = info.status;  
        var episodeText = buildEpisodeText(info);  
        if (!last) {  
            if (status === 'Returning Series') {  
                var dateLabel = formatDateLabel(info.first_air_date);  
                return { text: dateLabel || 'Онгоинг', icon: SVG_PLAY, color: '#00E676' };  
            }  
            if (status === 'In Production') {  
                return { text: formatPremiereLabel(info.first_air_date), icon: SVG_TICKET, color: '#E040FB' };  
            }  
            if (status === 'Planned') {  
                var year = formatYearLabel(info.first_air_date);  
                return { text: 'Запланировано' + (year ? ' ' + year : ''), icon: SVG_BOLT, color: '#E040FB' };  
            }  
            return null;  
        }  
        if (status === 'Returning Series') {  
            var nextDays = (next && next.air_date) ? daysUntil(next.air_date) : 999;  
            if (nextDays >= 0 && nextDays <= 8) {  
                return { text: episodeText, icon: SVG_PLAY, color: '#00E676' };  
            }  
            return { text: episodeText, icon: SVG_PLAYPAUSE, color: '#40C4FF' };  
        }  
        if (status === 'Ended')    return { text: episodeText, icon: SVG_CHECK,  color: '#FFD740' };  
        if (status === 'Canceled') return { text: episodeText, icon: SVG_XMARK,  color: '#FF5252' };  
        if (status === 'Pilot')    return { text: 'Пилот',     icon: SVG_CHECK,  color: '#FFD740' };  
        if (status === 'In Production') {  
            return { text: formatPremiereLabel(info.first_air_date), icon: SVG_TICKET, color: '#E040FB' };  
        }  
        if (status === 'Planned') {  
            var year = formatYearLabel(info.first_air_date);  
            return { text: 'Запланировано' + (year ? ' ' + year : ''), icon: SVG_BOLT, color: '#E040FB' };  
        }  
        return { text: episodeText, icon: SVG_PLAYPAUSE, color: '#40C4FF' };  
    }  
  
    function getMovieLabelInfo(info) {  
        var status = info.status;  
        var releaseDate = info.release_date;  
        if (status === 'Rumored') {  
            var year = formatYearLabel(releaseDate);  
            return { text: 'По слухам' + (year ? ' ' + year : ''), icon: SVG_BOLT, color: '#E040FB' };  
        }  
        if (status === 'Planned') {  
            var year = formatYearLabel(releaseDate);  
            return { text: 'Запланировано' + (year ? ' ' + year : ''), icon: SVG_BOLT, color: '#E040FB' };  
        }  
        if (status === 'In Production') {  
            return { text: formatPremiereLabel(releaseDate), icon: SVG_TICKET, color: '#E040FB' };  
        }  
        if (status === 'Post Production') {  
            return { text: formatPremiereLabel(releaseDate), icon: SVG_TICKET, color: '#E040FB' };  
        }  
        if (status === 'Released') return null;  
        if (status === 'Canceled') return { text: 'Отменён', icon: SVG_XMARK, color: '#FF5252' };  
        return null;  
    }  
  
    function applyLabel(cardElem, info, isTV) {  
        if (cardElem._tvsDone) return;  
        cardElem._tvsDone = true;  
        var labelInfo = isTV ? getTVLabelInfo(info) : getMovieLabelInfo(info);  
        if (!labelInfo || !labelInfo.text) return;  
        var viewElem = cardElem.querySelector('.card__view');  
        if (!viewElem) return;  
        var existing = cardElem.querySelector('.card__status');  
        var label = existing || document.createElement('div');  
        if (!existing) label.className = 'card__status';  
        label.innerHTML = '';  
        var iconSpan = document.createElement('span');  
        iconSpan.className = 'tvs-icon';  
        iconSpan.style.color = labelInfo.color;  
        iconSpan.innerHTML = labelInfo.icon;   // <-- innerHTML вместо textContent  
        var textSpan = document.createElement('span');  
        textSpan.className = 'tvs-text';  
        textSpan.textContent = labelInfo.text;  
        label.appendChild(iconSpan);  
        label.appendChild(textSpan);  
        if (!existing) viewElem.appendChild(label);  
    }  
  
    function isPersonCard(data) {  
        return !!(  
            data.known_for_department !== undefined ||  
            (data.profile_path && !data.poster_path && !data.backdrop_path)  
        );  
    }  
    function loadCardStatus(cardElem, data) {  
        if (cardElem._tvsDone) return;  
        if (isPersonCard(data)) return;  
        var isTV = !!(data.original_name || data.first_air_date);  
        if (isTV) {  
            var tvNetwork = new Lampa.Reguest();  
            tvNetwork.silent(  
                Lampa.TMDB.api('tv/' + data.id + '?api_key=' + Lampa.TMDB.key()),  
                function(resp) { if (resp && resp.id) applyLabel(cardElem, resp, true); },  
                function() {}, false, { cache: { life: 1440 } }  
            );  
        } else if (data.release_date || data.original_title) {  
            var movieNetwork = new Lampa.Reguest();  
            movieNetwork.silent(  
                Lampa.TMDB.api('movie/' + data.id + '?api_key=' + Lampa.TMDB.key()),  
                function(resp) { if (resp && resp.id) applyLabel(cardElem, resp, false); },  
                function() {}, false, { cache: { life: 1440 } }  
            );  
        }  
    }  
    function observeCard(cardElem) {  
        if (cardElem._tvsAttached) return;  
        cardElem._tvsAttached = true;  
        if (intersectionObserver) {  
            intersectionObserver.observe(cardElem);  
        } else {  
            var cardData = cardElem.card_data;  
            if (cardData) loadCardStatus(cardElem, cardData);  
        }  
    }  
    function initMutationObserver() {  
        mutationObserver = new MutationObserver(function(mutations) {  
            for (var i = 0; i < mutations.length; i++) {  
                var nodes = mutations[i].addedNodes;  
                for (var j = 0; j < nodes.length; j++) {  
                    var node = nodes[j];  
                    if (node.nodeType !== 1) continue;  
                    if (node.classList && node.classList.contains('card')) observeCard(node);  
                    if (node.querySelectorAll) {  
                        var cards = node.querySelectorAll('.card');  
                        for (var k = 0; k < cards.length; k++) observeCard(cards[k]);  
                    }  
                }  
            }  
        });  
        mutationObserver.observe(document.body, { childList: true, subtree: true });  
    }  
    function injectStyles() {  
        document.head.insertAdjacentHTML('beforeend', '<style>' +  
            '.card__status{position:absolute;left:-0.8em;top:3.15em;display:flex;align-items:center;background:rgba(0,0,0,0.65);padding:0.25em 0.4em;border-radius:0.3em;z-index:2;pointer-events:none;white-space:nowrap;line-height:1;}' +  
            '.card__status .tvs-icon{display:inline-flex;align-items:center;margin-right:0.3em;}' +  
            '.card__status .tvs-icon svg{width:1.15em;height:1.15em;display:block;}' +  
            '.card__status .tvs-text{font-size:0.85em;font-weight:600;color:#ffffff;letter-spacing:0.03em;}' +  
        '</style>');  
    }  
    function destroy() {  
        if (mutationObserver) { mutationObserver.disconnect(); mutationObserver = null; }  
        if (intersectionObserver) { intersectionObserver.disconnect(); intersectionObserver = null; }  
    }  
    function init() {  
        if (initialized) return;  
        initialized = true;  
        injectStyles();  
        if (typeof IntersectionObserver !== 'undefined') {  
            intersectionObserver = new IntersectionObserver(function(entries) {  
                for (var i = 0; i < entries.length; i++) {  
                    var entry = entries[i];  
                    if (!entry.isIntersecting) continue;  
                    var cardElem = entry.target;  
                    intersectionObserver.unobserve(cardElem);  
                    var cardData = cardElem.card_data;  
                    if (cardData) loadCardStatus(cardElem, cardData);  
                }  
            }, { threshold: 0.1 });  
        }  
        initMutationObserver();  
    }  
    Lampa.Listener.follow('app', function(e) {  
        if (e.type === 'ready') init();  
        if (e.type === 'destroy') destroy();  
    });  
    if (window.appready) init();  
})();
