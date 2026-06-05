(function() {  
    'use strict';  
    if (window.contentLabels) return;  
    window.contentLabels = true;  
    document.head.insertAdjacentHTML('beforeend', '<style>.card__type--movie{background:#1565C0!important;color:#fff!important}</style>');  
    const allGenres = {  
        28:'Боевик',12:'Приключения',35:'Комедия',80:'Криминал',  
        18:'Драма',10751:'Семейный',14:'Фэнтези',36:'История',  
        27:'Ужасы',10402:'Музыка',9648:'Детектив',10749:'Мелодрама',  
        878:'Фантастика',10770:'Телефильм',53:'Триллер',10752:'Военный',  
        37:'Вестерн',10759:'Экшен',10762:'Детский',10765:'НФ и Фэнтези',  
        10768:'Война и Политика'  
    };  
    function getLabel(d) {  
        if (!d || d.profile_path !== undefined || d.known_for_department) return '';  
        const isTv = !!d.name;  
        const ids = Array.isArray(d.genres) ? d.genres.map(g => g?.id ?? g) : (d.genre_ids || []);  
        if (ids.includes(16) && d.original_language === 'ja') return 'Аниме';  
        if (ids.includes(10763)) return 'Новости';  
        if (ids.includes(10767)) return 'Ток-шоу';  
        if (ids.includes(10764)) return 'Реалити-шоу';  
        if (ids.includes(99)) return 'Документальный';  
        if (ids.includes(10766)) return 'Мыльная опера';  
        if (ids.includes(16)) return isTv ? 'Мультсериал' : 'Мультфильм';  
        return allGenres[ids[0]] || (isTv ? 'Сериал' : 'Фильм');  
    }  
    function createLabel(label, isTv) {  
        const el = document.createElement('div');  
        el.className = 'card__type ' + (isTv ? 'card__type--tv' : 'card__type--movie');  
        el.textContent = label;  
        return el;  
    }  
    function processCard(card) {  
        if (!card.card_data) return;  
        card.querySelectorAll('.card__type').forEach(el => { if (el.textContent === 'TV') el.remove(); });  
        if (card.querySelector('.card__type')) return;  
        const view = card.querySelector('.card__view');  
        if (!view) return;  
        const label = getLabel(card.card_data);  
        if (label) view.appendChild(createLabel(label, !!card.card_data.name));  
    }  
    new MutationObserver((mutations) => {  
        for (const m of mutations) {  
            for (const node of m.addedNodes) {  
                if (node.nodeType !== 1) continue;  
                if (node.classList?.contains('card')) processCard(node);  
                node.querySelectorAll?.('.card').forEach(processCard);  
            }  
        }  
    }).observe(document.body, { childList: true, subtree: true });  
    document.querySelectorAll('.card').forEach(processCard);  
    Lampa.Listener.follow('full', e => {  
    if (e.type !== 'complite' || !e.data?.movie) return;  
    const poster = e.body.find('.full-start-new__poster, .full-start__poster')[0];  
    if (!poster) return;  
    poster.querySelector('.card__type')?.remove();  
    const label = getLabel(e.data.movie);  
    if (label) poster.appendChild(createLabel(label, !!e.data.movie.name));  
});  
})();
