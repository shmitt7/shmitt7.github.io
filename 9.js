(function () {  
    if (window.listCard) return;  
    window.listCard = true;  
  
    var LANG = {  
        list_card_category: { ru: 'Карточки', en: 'Cards', uk: 'Картки' },  
        list_card_bg_color: { ru: 'Цвет фона плашки', en: 'Overlay background color', uk: 'Колір фону плашки' },  
        list_card_bg_opacity: { ru: 'Прозрачность плашки', en: 'Overlay opacity', uk: 'Прозорість плашки' },  
        list_card_title_color: { ru: 'Цвет заголовка', en: 'Title color', uk: 'Колір заголовку' },  
        list_card_status_color: { ru: 'Цвет статуса', en: 'Status text color', uk: 'Колір статусу' },  
        list_card_accent_color: { ru: 'Цвет доп. элементов (год, жанр, качество, рейтинг)', en: 'Accent color', uk: 'Колір додаткових елементів' },  
        list_card_border_radius: { ru: 'Скругление углов плашки', en: 'Overlay corner radius', uk: 'Заокруглення плашки' },  
        list_card_shadow_intensity: { ru: 'Тень плашки', en: 'Overlay shadow', uk: 'Тінь плашки' },  
        list_card_title_size: { ru: 'Размер заголовка', en: 'Title size', uk: 'Розмір заголовку' },  
        list_card_group_colors: { ru: 'Цвета', en: 'Colors', uk: 'Кольори' },  
        list_card_group_shape: { ru: 'Форма и размер', en: 'Shape and size', uk: 'Форма і розмір' }  
    };  
  
    if (window.Lampa && Lampa.Lang && Lampa.Lang.add) {  
        Lampa.Lang.add(LANG);  
    }  
  
    // ---------- Значения по умолчанию (совпадают с исходным видом плагина) ----------  
    var DEFAULTS = {  
        list_card_bg_color: 'gray',  
        list_card_bg_opacity: '100',  
        list_card_title_color: 'white',  
        list_card_status_color: 'white',  
        list_card_accent_color: 'white',  
        list_card_border_radius: '0.8',  
        list_card_shadow_intensity: 'medium',  
        list_card_title_size: '1.45'  
    };  
  
    // ---------- Пресеты (все значения зафиксированы, ничего не вводится руками) ----------  
    var BG_PRESETS = {  
        gray: '#3c3c3c',  
        black: '#000000',  
        navy: '#132743',  
        green: '#173d1f',  
        maroon: '#3d1717',  
        purple: '#2e1740',  
        brown: '#3a2a1a',  
        teal: '#123734',  
        transparent: 'transparent'  
    };  
  
    var TEXT_PRESETS = {  
        white: '#ffffff',  
        light_gray: '#d0d0d0',  
        yellow: '#ffd54f',  
        orange: '#ffab40',  
        red: '#ff5252',  
        green: '#69f0ae',  
        blue: '#40c4ff',  
        purple: '#b388ff',  
        pink: '#ff80ab',  
        black: '#000000'  
    };  
  
    var SHADOWS = {  
        none: 'none',  
        weak: '0 0.15em 0.3em rgba(0,0,0,0.35)',  
        medium: '0 0.3em 0.6em rgba(0,0,0,0.55), 0 0.05em 0.15em rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)',  
        strong: '0 0.5em 1em rgba(0,0,0,0.75), 0 0.1em 0.25em rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1)'  
    };  
  
    function hexToRgb(hex) {  
        hex = hex.replace('#', '');  
        if (hex.length === 3) hex = hex.split('').map(function (c) { return c + c; }).join('');  
        var num = parseInt(hex, 16);  
        return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };  
    }  
  
    function resolveBgColor() {  
        var key = Lampa.Storage.get('list_card_bg_color', DEFAULTS.list_card_bg_color);  
        var base = BG_PRESETS[key] || BG_PRESETS.gray;  
  
        if (base === 'transparent') return 'transparent';  
  
        var opacity = parseInt(Lampa.Storage.get('list_card_bg_opacity', DEFAULTS.list_card_bg_opacity), 10);  
        if (isNaN(opacity)) opacity = 100;  
        var alpha = Math.max(0, Math.min(100, opacity)) / 100;  
  
        var rgb = hexToRgb(base);  
        return 'rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ',' + alpha + ')';  
    }  
  
    function resolveTextColor(name, fallbackKey) {  
        var key = Lampa.Storage.get(name, fallbackKey);  
        return TEXT_PRESETS[key] || TEXT_PRESETS[fallbackKey];  
    }  
  
    // ---------- Применение стилей в реальном времени ----------  
    function applyCardStyles() {  
        var root = document.documentElement.style;  
  
        root.setProperty('--lc-bg-color', resolveBgColor());  
        root.setProperty('--lc-title-color', resolveTextColor('list_card_title_color', DEFAULTS.list_card_title_color));  
        root.setProperty('--lc-status-color', resolveTextColor('list_card_status_color', DEFAULTS.list_card_status_color));  
        root.setProperty('--lc-accent-color', resolveTextColor('list_card_accent_color', DEFAULTS.list_card_accent_color));  
  
        var radius = Lampa.Storage.get('list_card_border_radius', DEFAULTS.list_card_border_radius);  
        root.setProperty('--lc-radius', radius + 'em');  
  
        var shadowKey = Lampa.Storage.get('list_card_shadow_intensity', DEFAULTS.list_card_shadow_intensity);  
        root.setProperty('--lc-shadow', SHADOWS[shadowKey] || SHADOWS.medium);  
  
        var titleSize = Lampa.Storage.get('list_card_title_size', DEFAULTS.list_card_title_size);  
        root.setProperty('--lc-title-size', titleSize + 'em');  
    }  
  
    // ---------- Регистрация настроек (только select, никаких input) ----------  
    function initSettings() {  
        if (!window.Lampa || !Lampa.SettingsApi || window.listCardSettingsInited) return;  
        window.listCardSettingsInited = true;  
  
        Lampa.SettingsApi.addComponent({  
            component: 'list_card_settings',  
            name: Lampa.Lang.translate('list_card_category'),  
            icon: '<svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="6" y="6" width="32" height="32" rx="4" stroke="white" stroke-width="2"/><rect x="11" y="24" width="22" height="9" rx="2" fill="white" fill-opacity="0.6"/></svg>'  
        });  
  
        // --- Группа: цвета ---  
        Lampa.SettingsApi.addParam({  
            component: 'list_card_settings',  
            param: { type: 'title' },  
            field: { name: Lampa.Lang.translate('list_card_group_colors') }  
        });  
  
        Lampa.SettingsApi.addParam({  
            component: 'list_card_settings',  
            param: {  
                name: 'list_card_bg_color',  
                type: 'select',  
                values: {  
                    gray: 'Серый',  
                    black: 'Чёрный',  
                    navy: 'Тёмно-синий',  
                    green: 'Тёмно-зелёный',  
                    maroon: 'Бордовый',  
                    purple: 'Фиолетовый',  
                    brown: 'Коричневый',  
                    teal: 'Изумрудный',  
                    transparent: 'Прозрачный'  
                },  
                default: DEFAULTS.list_card_bg_color  
            },  
            field: { name: Lampa.Lang.translate('list_card_bg_color') },  
            onChange: applyCardStyles  
        });  
  
        Lampa.SettingsApi.addParam({  
            component: 'list_card_settings',  
            param: {  
                name: 'list_card_bg_opacity',  
                type: 'select',  
                values: { '100': '100%', '85': '85%', '70': '70%', '55': '55%', '40': '40%', '25': '25%' },  
                default: DEFAULTS.list_card_bg_opacity  
            },  
            field: { name: Lampa.Lang.translate('list_card_bg_opacity') },  
            onChange: applyCardStyles  
        });  
  
        Lampa.SettingsApi.addParam({  
            component: 'list_card_settings',  
            param: {  
                name: 'list_card_title_color',  
                type: 'select',  
                values: {  
                    white: 'Белый', light_gray: 'Светло-серый', yellow: 'Жёлтый', orange: 'Оранжевый',  
                    red: 'Красный', green: 'Зелёный', blue: 'Голубой', purple: 'Фиолетовый', pink: 'Розовый', black: 'Чёрный'  
                },  
                default: DEFAULTS.list_card_title_color  
            },  
            field: { name: Lampa.Lang.translate('list_card_title_color') },  
            onChange: applyCardStyles  
        });  
  
        Lampa.SettingsApi.addParam({  
            component: 'list_card_settings',  
            param: {  
                name: 'list_card_status_color',  
                type: 'select',  
                values: {  
                    white: 'Белый', light_gray: 'Светло-серый', yellow: 'Жёлтый', orange: 'Оранжевый',  
                    red: 'Красный', green: 'Зелёный', blue: 'Голубой', purple: 'Фиолетовый', pink: 'Розовый', black: 'Чёрный'  
                },  
                default: DEFAULTS.list_card_status_color  
            },  
            field: { name: Lampa.Lang.translate('list_card_status_color') },  
            onChange: applyCardStyles  
        });  
  
        Lampa.SettingsApi.addParam({  
            component: 'list_card_settings',  
            param: {  
                name: 'list_card_accent_color',  
                type: 'select',  
                values: {  
                    white: 'Белый', light_gray: 'Светло-серый', yellow: 'Жёлтый', orange: 'Оранжевый',  
                    red: 'Красный', green: 'Зелёный', blue: 'Голубой', purple: 'Фиолетовый', pink: 'Розовый', black: 'Чёрный'  
                },  
                default: DEFAULTS.list_card_accent_color  
            },  
            field: { name: Lampa.Lang.translate('list_card_accent_color') },  
            onChange: applyCardStyles  
        });  
  
        // --- Группа: форма и размер ---  
        Lampa.SettingsApi.addParam({  
            component: 'list_card_settings',  
            param: { type: 'title' },  
            field: { name: Lampa.Lang.translate('list_card_group_shape') }  
        });  
  
        Lampa.SettingsApi.addParam({  
            component: 'list_card_settings',  
            param: {  
                name: 'list_card_border_radius',  
                type: 'select',  
                values: { '0': '0', '0.4': '0.4em', '0.8': '0.8em', '1.2': '1.2em', '1.6': '1.6em' },  
                default: DEFAULTS.list_card_border_radius  
            },  
            field: { name: Lampa.Lang.translate('list_card_border_radius') },  
            onChange: applyCardStyles  
        });  
  
        Lampa.SettingsApi.addParam({  
            component: 'list_card_settings',  
            param: {  
                name: 'list_card_shadow_intensity',  
                type: 'select',  
                values: { none: 'Нет', weak: 'Слабая', medium: 'Средняя', strong: 'Сильная' },  
                default: DEFAULTS.list_card_shadow_intensity  
            },  
            field: { name: Lampa.Lang.translate('list_card_shadow_intensity') },  
            onChange: applyCardStyles  
        });  
  
        Lampa.SettingsApi.addParam({  
            component: 'list_card_settings',  
            param: {  
                name: 'list_card_title_size',  
                type: 'select',  
                values: { '1.15': 'Маленький', '1.3': 'Средний', '1.45': 'Крупный', '1.65': 'Очень крупный' },  
                default: DEFAULTS.list_card_title_size  
            },  
            field: { name: Lampa.Lang.translate('list_card_title_size') },  
            onChange: applyCardStyles  
        });  
    }  
  
    // ---------- CSS (значения через переменные с дефолтами, как в исходнике) ----------  
    document.head.insertAdjacentHTML('beforeend', '<style>' +  
        '.card__title{display:none!important}' +  
        '.card__age{display:none!important}' +  
        '.card.focus .card-watched{display:none!important}' +  
        '.card__icons{top:0.5em!important;left:auto!important;right:0.5em!important;justify-content:flex-end!important}' +  
        '.card__icons-inner{background:none!important;border-radius:0!important;flex-direction:column!important}' +  
        '.card__icons-inner>.card__icon{margin-bottom:0.2em}' +  
        '.card__icon{filter:drop-shadow(0 1px 4px rgba(0,0,0,1)) drop-shadow(0 0 8px rgba(0,0,0,0.9))!important}' +  
        '.card__overlay{position:absolute;left:0.2em;right:0.2em;bottom:0.2em;padding:0.35em 0.35em 0.2em 0.35em;' +  
            'background:var(--lc-bg-color,#3c3c3c);' +  
            'border-radius:var(--lc-radius,0.8em);' +  
            'box-shadow:var(--lc-shadow,0 0.3em 0.6em rgba(0,0,0,0.55), 0 0.05em 0.15em rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08));' +  
            'z-index:1;pointer-events:none;display:flex;flex-direction:column}' +  
        '.card__overlay-title{font-size:var(--lc-title-size,1.45em);font-weight:500;line-height:1.15;' +  
            'color:var(--lc-title-color,#fff);overflow:hidden;margin-bottom:0.1em;white-space:normal;word-break:normal;max-height:2.5em;padding-bottom:0.08em}' +  
        '.card__status-row{display:flex;align-items:baseline;margin-bottom:0.1em;line-height:1;overflow:hidden;white-space:nowrap;min-width:0}' +  
        '.card__status-row:empty{display:none}' +  
        '.card__status-row .card__status{position:static!important;left:auto!important;top:auto!important;bottom:auto!important;background:none!important;padding:0!important;border-radius:0!important;font-size:0.95em!important;display:flex!important;align-items:baseline!important;pointer-events:none;white-space:nowrap}' +  
        '.card__status-row .card__status .tvs-icon{font-size:1.1em;margin-right:0.2em;flex-shrink:0}' +  
        '.card__status-row .card__status .tvs-text{font-size:0.95em;font-weight:500;color:var(--lc-status-color,#fff);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex-shrink:1;min-width:0}' +  
        '.card__badge{display:flex;flex-wrap:nowrap;align-items:center;line-height:1;width:100%;overflow:hidden;margin-top:auto}' +  
        '.card__badge-year{font-size:0.95em;line-height:1;color:var(--lc-accent-color,#fff);flex-shrink:0}' +  
        '.card__badge-genre,.card__badge .card__type{flex:1 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-left:0.4em;color:var(--lc-accent-color,#fff);line-height:1}' +  
        '.card__badge-year+.card__badge-genre::before,.card__badge-year+.card__type::before{content:"\u2022";margin-right:0.4em;color:var(--lc-accent-color,#fff);font-size:0.95em}' +  
        '.card__badge .card__type{position:static!important;top:auto!important;left:auto!important;background:none!important;padding:0!important;border-radius:0!important;font-size:0.95em!important;line-height:1!important;color:var(--lc-accent-color,#fff)!important}' +  
        '.card__badge-right{display:flex;align-items:center;flex-shrink:0;margin-left:auto}' +  
        '.card__badge-right>*+*{margin-left:0.4em}' +  
        '.card__badge-right .card__quality{position:static!important;left:auto!important;bottom:auto!important;padding:0!important;background:none!important;color:var(--lc-accent-color,#fff)!important;font-size:1.1em!important;line-height:1!important;font-weight:500;border-radius:0!important}' +  
        '.card__badge-right .card__quality>div{display:inline}' +  
        '.card__badge-right .card__vote{position:static!important;right:auto!important;bottom:auto!important;background:none!important;color:var(--lc-accent-color,#fff)!important;font-size:1.1em!important;line-height:1!important;font-weight:500;padding:0!important;border-radius:0!important}' +  
        '.card__status,.card__type,.card__quality,.card__vote{visibility:hidden!important}' +  
        '.card__status-row .card__status,.card__badge .card__type,.card__badge-right .card__quality,.card__badge-right .card__vote{visibility:visible!important}' +  
    '</style>');  
  
    var WATCH_TIMEOUT = 8000;  
    var activeChildObservers = [];  
  
    function clampTitleByChars(el, text) {  
        text = text || '';  
        el.textContent = text;  
        if (!text) return;  
        el.textContent = 'A';  
        var oneLineHeight = el.scrollHeight;  
        el.textContent = text;  
        var maxHeight = oneLineHeight * 2 + Math.max(4, oneLineHeight * 0.12);  
        if (el.scrollHeight <= maxHeight) return;  
        var lo = 1, hi = text.length, best = 1;  
        while (lo <= hi) {  
            var mid = (lo + hi) >> 1;  
            var candidate = text.slice(0, mid).replace(/\s+$/, '');  
            el.textContent = candidate + '...';  
            if (el.scrollHeight <= maxHeight) {  
                best = mid;  
                lo = mid + 1;  
            } else {  
                hi = mid - 1;  
            }  
        }  
        el.textContent = text.slice(0, best).replace(/\s+$/, '') + '...';  
    }  
  
    function relocateExisting(view, statusRow, badge, badgeRight) {  
        var status = view.querySelector('.card__status');  
        var type = view.querySelector('.card__type');  
        var quality = view.querySelector('.card__quality');  
        var vote = view.querySelector('.card__vote');  
        if (status && status.parentNode !== statusRow) statusRow.appendChild(status);  
        if (type && type.parentNode !== badge) badge.insertBefore(type, badgeRight);  
        if (quality && (quality.parentNode !== badgeRight || quality.nextSibling !== vote)) {  
            badgeRight.insertBefore(quality, vote && vote.parentNode === badgeRight ? vote : null);  
        }  
        if (vote && vote.parentNode !== badgeRight) badgeRight.appendChild(vote);  
        return !!(status && type && quality && vote);  
    }  
  
    function watchOverlayInjects(view, statusRow, badge, badgeRight) {  
        if (relocateExisting(view, statusRow, badge, badgeRight)) return;  
        var watchTimer;  
        var childObserver = new MutationObserver(function () {  
            if (relocateExisting(view, statusRow, badge, badgeRight)) stopWatching();  
        });  
        function stopWatching() {  
            clearTimeout(watchTimer);  
            childObserver.disconnect();  
            var idx = activeChildObservers.indexOf(childObserver);  
            if (idx !== -1) activeChildObservers.splice(idx, 1);  
        }  
        watchTimer = setTimeout(stopWatching, WATCH_TIMEOUT);  
        childObserver.observe(view, { childList: true });  
        activeChildObservers.push(childObserver);  
    }  
  
    function processCard(card) {  
        var data = card.card_data;  
        if (!data) return;  
        card.dataset.listCard = '1';  
        var view = card.querySelector('.card__view');  
        if (!view) return;  
        var titleEl = card.querySelector('.card__title');  
        var ageEl = card.querySelector('.card__age');  
        if (titleEl) titleEl.style.display = 'none';  
        if (ageEl) ageEl.style.display = 'none';  
        var icons = card.querySelector('.card__icons');  
        if (icons) {  
            icons.style.cssText = 'top:0.5em;left:auto;right:0.5em;justify-content:flex-end;';  
            var iconsInner = icons.querySelector('.card__icons-inner');  
            if (iconsInner) iconsInner.style.cssText = 'background:none;border-radius:0;flex-direction:column;';  
        }  
        var overlay = document.createElement('div');  
        overlay.className = 'card__overlay';  
        var overlayTitle = document.createElement('div');  
        overlayTitle.className = 'card__overlay-title';  
        overlay.appendChild(overlayTitle);  
        var statusRow = document.createElement('div');  
        statusRow.className = 'card__status-row';  
        overlay.appendChild(statusRow);  
        var badge = document.createElement('div');  
        badge.className = 'card__badge';  
        var year = ((data.release_date || data.first_air_date || '') + '').slice(0, 4);  
        if (year) {  
            var yearEl = document.createElement('span');  
            yearEl.className = 'card__badge-year';  
            yearEl.textContent = year;  
            badge.appendChild(yearEl);  
        }  
        var badgeRight = document.createElement('div');  
        badgeRight.className = 'card__badge-right';  
        badge.appendChild(badgeRight);  
        overlay.appendChild(badge);  
        view.appendChild(overlay);  
        clampTitleByChars(overlayTitle, data.title || data.name || '');  
        watchOverlayInjects(view, statusRow, badge, badgeRight);  
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
  
    function boot() {  
        initSettings();  
        applyCardStyles();  
    }  
  
    if (window.Lampa && Lampa.SettingsApi) {  
        boot();  
    }  
  
    Lampa.Listener.follow('app', function (e) {  
        if (e.type === 'ready') {  
            boot();  
            [].forEach.call(document.querySelectorAll('.card'), observe);  
        }  
        if (e.type === 'destroy') {  
            if (intersectionObserver) intersectionObserver.disconnect();  
            mutationObserver.disconnect();  
            for (var i = 0; i < activeChildObservers.length; i++) activeChildObservers[i].disconnect();  
            activeChildObservers = [];  
        }  
    });  
})();
