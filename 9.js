(function () {  
    'use strict';  
    var NEW_CARD_TPL = '<div class="card selector layer--visible layer--render"><div class="card__view"><img src="./img/img_load.svg" class="card__img" /><div class="card__icons"><div class="card__icons-inner"></div></div></div></div>';  
    var css = [  
        '.card__vote, .card__type, .card__quality { display: none !important; }',  
        '.ccs__bar { position: absolute; bottom: 0; left: 0; right: 0; padding: 1.8em 0.6em 0.3em 0.6em; background: linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.88) 100%); border-bottom-left-radius: 1em; border-bottom-right-radius: 1em; z-index: 2; pointer-events: none; box-sizing: border-box; }',  
        '.ccs__title { font-size: 1.4em; font-weight: 700; line-height: 1.1; -webkit-line-clamp: 2; line-clamp: 2; max-height: 2.2em; overflow: hidden; display: -webkit-box; -webkit-box-orient: vertical; color: #fff; margin-bottom: 0.2em; text-shadow: 0 1px 4px rgba(0,0,0,0.9), 0 2px 8px rgba(0,0,0,0.6); }',  
        '.ccs__row { display: flex; justify-content: space-between; align-items: center; line-height: 1; }',  
        '.ccs__left { display: flex; align-items: center; gap: 0.3em; font-size: 0.82em; color: rgba(255,255,255,0.75); line-height: 1; }',  
        '.ccs__right { display: flex; align-items: center; gap: 0.3em; font-size: 1em; color: rgba(255,255,255,0.75); line-height: 1; }',  
        '.card--wide .ccs__bar, .card--small .ccs__bar { display: none; }'  
    ].join(' ');  
    function addStyle(text) {  
        var el = document.createElement('style');  
        el.id = 'custom-card-style';  
        el.textContent = text;  
        document.head.appendChild(el);  
    }  
    function getGenre(data) {  
        if (data.genres && data.genres.length) return data.genres[0].name || '';  
        if (data.genre_ids && data.genre_ids.length) {  
            try {  
                var t = (data.original_name || data.first_air_date) ? 'tv' : 'movie';  
                var names = Lampa.Api.sources.tmdb.getGenresNameFromIds(t, data.genre_ids);  
                return names[0] || '';  
            } catch (e) {}  
        }  
        return '';  
    }  
    function processCard(cardEl) {  
        if (!cardEl || cardEl.dataset.ccsProcessed) return;  
        cardEl.dataset.ccsProcessed = '1';  
        var view = cardEl.querySelector('.card__view');  
        if (!view) return;  
        var data = cardEl.card_data || {};  
        var title = data.title || data.name || '';  
        var year = ((data.release_date || data.first_air_date || data.birthday || '0000') + '').slice(0, 4);  
        if (year === '0000') year = '';  
        var isTV = !!(data.original_name || data.first_air_date || data.number_of_seasons);  
        var genre = getGenre(data);  
        var quality = (data.quality || data.release_quality || '').toUpperCase();  
        var voteRaw = parseFloat((data.cub_hundred_rating || data.vote_average || 0) + '');  
        var vote = voteRaw > 0 ? (data.cub_hundred_fire ? String(data.cub_hundred_fire) : (voteRaw >= 10 ? '10' : voteRaw.toFixed(1))) : '';  
        var bar = document.createElement('div');  
        bar.className = 'ccs__bar';  
        if (title) {  
            var titleEl = document.createElement('div');  
            titleEl.className = 'ccs__title';  
            titleEl.textContent = title;  
            bar.appendChild(titleEl);  
        }  
        var row = document.createElement('div');  
        row.className = 'ccs__row';  
        var left = document.createElement('div');  
        left.className = 'ccs__left';  
        var right = document.createElement('div');  
        right.className = 'ccs__right';  
        if (year) { var el = document.createElement('span'); el.textContent = year; left.appendChild(el); }  
        if (isTV) { var el = document.createElement('span'); el.textContent = 'TV'; left.appendChild(el); }  
        if (genre) { var el = document.createElement('span'); el.textContent = genre; left.appendChild(el); }  
        if (quality) { var el = document.createElement('span'); el.textContent = quality; right.appendChild(el); }  
        if (vote) { var el = document.createElement('span'); el.textContent = vote; right.appendChild(el); }  
        row.appendChild(left);  
        row.appendChild(right);  
        bar.appendChild(row);  
        view.appendChild(bar);  
    }  
    function init() {  
        Lampa.Template.add('card', NEW_CARD_TPL);  
        addStyle(css);  
        var observer = new MutationObserver(function (mutations) {  
            for (var i = 0; i < mutations.length; i++) {  
                var added = mutations[i].addedNodes;  
                for (var j = 0; j < added.length; j++) {  
                    var node = added[j];  
                    if (node.nodeType !== 1) continue;  
                    if (node.classList.contains('card')) {  
                        processCard(node);  
                    } else if (node.querySelectorAll) {  
                        var cards = node.querySelectorAll('.card');  
                        for (var k = 0; k < cards.length; k++) { processCard(cards[k]); }  
                    }  
                }  
            }  
        });  
        observer.observe(document.body, { childList: true, subtree: true });  
    }  
    if (window.appready) {  
        init();  
    } else {  
        Lampa.Listener.follow('app', function (e) {  
            if (e.type === 'ready') init();  
        });  
    }  
})();
