(function() {
    'use strict';

    if (!window.liteTweaks) {
        window.liteTweaks = {};
    }

    Object.assign(window.lampa_settings, {
        disable_features: {
            dmca:                 true,
            lgbt:                 true,
            ai:                   true,
            subscribe:            true,
            blacklist:            true,
            persons:              true,
            ads:                  true,
            remote_configuration: true,
        },
        torrents_use: true,
        feed:         false,
        services:     false,
        lang_use:     false,
        white_use:    false,
        read_only:    false,
    });

    window.lampa_settings.demo = false;
    window.plugin_shots_ready  = true;

    function run() {
        // ── Реклама ──────────────────────────────────────────────────────────
        Lampa.AdManager?.destroy();
        $('.ad-video-block, [class*="ad-"], .ad_plugin').remove();

        if (Lampa.Player?.play) {
            const originalPlay = Lampa.Player.play;
            Lampa.Player.play = function(data) {
                data.iptv = true;
                delete data.vast_url;
                delete data.vast_msg;
                return originalPlay.call(this, data);
            };
        }

        // ── Шапка ────────────────────────────────────────────────────────────
        $('.head .open--broadcast').remove();   // трансляция на другое устройство
        $('.head .notice--icon').remove();      // колокольчик уведомлений
        $('.head .open--profile').remove();     // профиль / аккаунт
        
        if (Lampa.Notice?.drawCount) Lampa.Notice.drawCount = () => {};

        // ── Левое меню ───────────────────────────────────────────────────────
        $('.menu [data-action="catalog"]').remove();    // каталог
        $('.menu [data-action="relise"]').remove();     // релизы
        $('.menu [data-action="timetable"]').remove();  // расписание
        $('.menu [data-action="mytorrents"]').remove(); // торренты
        $('.menu [data-action="about"]').remove();      // информация
        // $('.menu [data-action="filter"]').remove();  // фильтр — опционально
        // $('.menu [data-action="anime"]').remove();   // аниме — опционально
        // $('.menu [data-action="history"]').remove(); // история — опционально

        // Перемещаем "Редактировать" под консоль, удаляем пустой блок
        const editItem = $('.menu [data-action="edit"]').detach();
        $('.menu .nosort:first .menu__list').append(editItem);
        const lastNosort = $('.menu .nosort:last');
        lastNosort.prev('.menu__split').remove();
        lastNosort.remove();

        // ── Меню настроек ────────────────────────────────────────────────────
        Lampa.Settings.listener.follow('open', function(e) {
            if (e.name === 'main') {
                // e.body.find('[data-component="account"]').remove();          // аккаунт / CUB
                e.body.find('[data-component="parental_control"]').remove(); // родительский контроль
                // e.body.find('[data-component="plugins"]').remove();       // расширения — опционально
                // e.body.find('[data-component="tmdb"]').remove();          // TMDB — опционально
            }
        });

        // ── Карточка фильма ───────────────────────────────────────────────────
        // .button--reaction и .full-start-new__reactions убраны через reactions: true
        // .button--subscribe скрыта через subscribe: true
        Lampa.Listener.follow('full', (e) => {
            if (e.type === 'complite') {
                e.object.activity.render().find('.button--options').remove(); // кнопка "Ещё"
                // e.object.activity.render().find('.button--book').remove(); // закладки — опционально
            }
        });

        // ── Торрент-лист ──────────────────────────────────────────────────────
        const removeHistory = () => $('.watched-history').remove();
        removeHistory();
        new MutationObserver(removeHistory).observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    if (window.appready) {
        run();
    } else {
        Lampa.Listener.follow('app', (e) => {
            if (e.type === 'ready') run();
        });
    }

})();
