(function() {  
    if (window.contentLabels) return;  
    window.contentLabels = true;  
    document.head.insertAdjacentHTML('beforeend', '<style>.card__type--movie{background:#1565C0!important;color:#fff!important}</style>');  
    var allGenres = {  
        28:'Боевик',12:'Приключения',35:'Комедия',80:'Криминал',  
        18:'Драма',10751:'Семейный',14:'Фэнтези',36:'История',  
        27:'Ужасы',10402:'Музыка',9648:'Детектив',10749:'Мелодрама',  
        878:'Фантастика',10770:'Телефильм',53:'Триллер',10752:'Военный',  
        37:'Вестерн',10759:'Экшен',10762:'Детский',
        10765:'НФ и Фэнтези',10768:'Война и Политика'  
    };  
    function getLabel(d) {  
        if (!d || d.profile_path !== undefined || d.known_for_department) return '';  
        var isTv = !!d.name;  
        var ids = Array.isArray(d.genres) ? d.genres.map(function(g) { return (g && typeof g === 'object') ? g.id : g; }) : (d.genre_ids || []);  
        var isAnimation = ids.indexOf(16) !== -1;  
        if (isAnimation && d.original_language === 'ja') return 'Аниме';  
        if (ids.indexOf(10763) !== -1) return 'Новости';  
        if (ids.indexOf(10767) !== -1) return 'Ток-шоу';  
        if (ids.indexOf(10764) !== -1) return 'Реалити-шоу';  
        if (ids.indexOf(99) !== -1) return 'Документальный';  
        if (ids.indexOf(10766) !== -1) return 'Мыльная опера';  
        if (isAnimation) return isTv ? 'Мультсериал' : 'Мультфильм';  
        return allGenres[ids[0]] || (isTv ? 'Сериал' : 'Фильм');  
    }  
    function createLabel(label, isTv) {  
        var el = document.createElement('div');  
        el.className = 'card__type ' + (isTv ? 'card__type--tv' : 'card__type--movie');  
        el.textContent = label;  
        return el;  
    }  
    function processCard(card) {  
        if (!card.card_data) return;  
        [].forEach.call(card.querySelectorAll('.card__type'), function(el) { if (el.textContent === 'TV') el.remove(); });  
        if (card.querySelector('.card__type')) return;  
        var view = card.querySelector('.card__view');  
        if (!view) return;  
        var label = getLabel(card.card_data);  
        if (label) view.appendChild(createLabel(label, !!card.card_data.name));  
    }  
    var cardObserver = new MutationObserver(function(mutations) {  
        for (var mi = 0; mi < mutations.length; mi++) {  
            var addedNodes = mutations[mi].addedNodes;  
            for (var ni = 0; ni < addedNodes.length; ni++) {  
                var node = addedNodes[ni];  
                if (node.nodeType !== 1) continue;  
                if (node.classList && node.classList.contains('card')) processCard(node);  
                if (node.querySelectorAll) [].forEach.call(node.querySelectorAll('.card'), processCard);  
            }  
        }  
    });  
    cardObserver.observe(document.body, { childList: true, subtree: true });  
    [].forEach.call(document.querySelectorAll('.card'), processCard);  
    Lampa.Listener.follow('full', function(e) {  
        if (e.type !== 'complite' || !e.data || !e.data.movie) return;  
        var poster = e.body.find('.full-start-new__poster, .full-start__poster')[0];  
        if (!poster) return;  
        var existing = poster.querySelector('.card__type');  
        if (existing) existing.remove();  
        var label = getLabel(e.data.movie);  
        if (label) poster.appendChild(createLabel(label, !!e.data.movie.name));  
    });  
    Lampa.Listener.follow('app', function(e) { if (e.type === 'destroy') cardObserver.disconnect(); });  
})();
