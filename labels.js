(function() {
    'use strict';
    if (window.contentLabels) return;
    window.contentLabels = true;
    const style = document.createElement('style');
    style.textContent = `.card__type--movie { background: #1565C0 !important; color: #fff !important; }`;
    document.head.appendChild(style);
    const allGenres = {
        28: 'Боевик', 12: 'Приключения', 35: 'Комедия', 80: 'Криминал',
        18: 'Драма', 10751: 'Семейный', 14: 'Фэнтези', 36: 'История',
        27: 'Ужасы', 10402: 'Музыка', 9648: 'Детектив', 10749: 'Мелодрама',
        878: 'Фантастика', 10770: 'Телефильм', 53: 'Триллер', 10752: 'Военный',
        37: 'Вестерн', 10759: 'Экшен', 10762: 'Детский', 10765: 'НФ и Фэнтези',
        10768: 'Война и Политика'
    };
    function removeOriginalLabels() {
        document.querySelectorAll('.card__type').forEach(el => {
            if (el.textContent === 'TV') el.remove();
        });
    }
    function getLabel(cardData) {
        if (!cardData || cardData.profile_path !== undefined || cardData.known_for_department) return '';
        const isTv = !!cardData.name;
        const genreIds = Array.isArray(cardData.genres)
            ? cardData.genres.map(g => typeof g === 'object' ? g.id : g)
            : Array.isArray(cardData.genre_ids) ? cardData.genre_ids : [];
        if (genreIds.includes(16) && cardData.original_language === 'ja') return 'Аниме';
        if (genreIds.includes(10763)) return 'Новости';
        if (genreIds.includes(10767)) return 'Ток-шоу';
        if (genreIds.includes(10764)) return 'Реалити-шоу';
        if (genreIds.includes(99)) return 'Документальный';
        if (genreIds.includes(10766)) return 'Мыльная опера';
        if (genreIds.includes(16)) return isTv ? 'Мультсериал' : 'Мультфильм';
        return allGenres[genreIds[0]] || (isTv ? 'Сериал' : 'Фильм');
    }
    function createLabelElement(label, isTv) {
        const typeElem = document.createElement('div');
        typeElem.className = 'card__type';
        typeElem.textContent = label;
        typeElem.classList.add(isTv ? 'card__type--tv' : 'card__type--movie');
        return typeElem;
    }
    function processCard(card) {
        if (!card.card_data || card.querySelector('.card__type')) return;
        const view = card.querySelector('.card__view');
        if (!view) return;
        const label = getLabel(card.card_data);
        if (!label) return;
        view.appendChild(createLabelElement(label, !!card.card_data.name));
    }
    function processDetailPage(cardData) {
        if (!cardData) return;
        const poster = document.querySelector('.full-start-new__poster, .full-start__poster');
        if (!poster) return;
        const oldLabel = poster.querySelector('.card__type');
        if (oldLabel) oldLabel.remove();
        const label = getLabel(cardData);
        if (!label) return;
        poster.appendChild(createLabelElement(label, !!cardData.name));
    }
    const observer = new MutationObserver(() => {
        removeOriginalLabels();
        document.querySelectorAll('.card').forEach(processCard);
    });
    observer.observe(document.body, { childList: true, subtree: true });
    removeOriginalLabels();
    document.querySelectorAll('.card').forEach(processCard);
    if (window.Lampa && Lampa.Listener) {
        Lampa.Listener.follow('full', e => {
            if ((e.type === 'complite' || e.type === 'build') && e.data?.movie) {
                processDetailPage(e.data.movie);
            }
        });
    }
})();
