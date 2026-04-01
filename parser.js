(function() {  
    'use strict';  
  
    // Защита от повторной загрузки плагина  
    if (window.torrentSearch) return;  
    window.torrentSearch = true;  
  
    // Список доступных Jackett серверов  
    // Формат: 'адрес:порт=ключ' или просто 'адрес'  
    const JACKETT_SERVERS = [  
        'jac.red',  
        '87.120.84.218:8443=777',  
        'jacred.stream=pp',  
        'ru.jacred.stream=pp',  
        'jr.maxvol.pro',  
        'jacred.pro',  
        'jac-red.ru',  
        'jacblack.ru:9117',  
        'ru.jacred.pro',  
        'jacred.freebie.tom.ru=1',  
        'nmjc.duckdns.org',  
    ];  
  
    let switchTimer = null;  // Таймер для автоматического восстановления сервера  
  
    // Парсинг строки сервера: разделение URL и API ключа  
    const parseServer = (serverString) => {  
        const parts = serverString.split('=');  
        return { url: parts[0], key: parts[1] || '' };  
    };  
  
    // Временное переключение на выбранный сервер (на 1 секунду)  
    const switchServer = (serverString) => {  
        const activity = Lampa.Activity.active();  // Получаем текущую активность  
        if (!activity) return;  // Если нет активности - выходим  
  
        const server = parseServer(serverString);  
          
        // Сохраняем оригинальные настройки для восстановления  
        const originalUrl = Lampa.Storage.get('jackett_url', '');  
        const originalKey = Lampa.Storage.get('jackett_key', '');  
          
        // Устанавливаем временный сервер  
        Lampa.Storage.set('jackett_url', server.url);  
        Lampa.Storage.set('jackett_key', server.key);  
        Lampa.Storage.set('jackett_interview', 'healthy');  
          
        // Перезагружаем страницу торрентов с новым сервером  
        Lampa.Activity.replace({  
            url: '',  
            title: `Торренты - ${server.url}`,  
            component: 'torrents',  
            search: activity.search,  
            movie: activity.movie,  
            page: 1  
        });  
  
        // Сбрасываем предыдущий таймер, если он был  
        if (switchTimer) clearTimeout(switchTimer);  
          
        // Устанавливаем таймер на восстановление оригинального сервера  
        switchTimer = setTimeout(() => {  
            Lampa.Storage.set('jackett_url', originalUrl);  
            Lampa.Storage.set('jackett_key', originalKey);  
            switchTimer = null;  
        }, 1000);  
    };  
  
    // Отображение диалога выбора сервера  
    const showServerSelector = () => {  
        const mainServer = Lampa.Storage.get('jackett_main_server', '');  
          
        // Формируем список пунктов меню  
        const items = [];  
  
        // Добавляем каждый сервер в список  
        JACKETT_SERVERS.forEach((serverString, index) => {  
            const server = parseServer(serverString);  
            const displayTitle = `${index + 1}. ${server.url}` +   
                                (server.key ? ` (${server.key})` : '') +   
                                (mainServer === serverString ? ' ★' : '');  
              
            items.push({   
                title: displayTitle,   
                subtitle: 'Короткий тап - поиск | Долгий тап - сделать основным',  
                serverString   
            });  
        });  
  
        // Показываем окно выбора с коротким заголовком  
        Lampa.Select.show({  
            title: 'Серверы',  
            items,  
            onSelect: (selected) => {  
                // Короткий тап - временное переключение для поиска  
                if (selected?.serverString) switchServer(selected.serverString);  
            },  
            onLong: (selected) => {  
                // Долгий тап - установка основного сервера  
                if (selected?.serverString) {  
                    const server = parseServer(selected.serverString);  
                    Lampa.Storage.set('jackett_url', server.url);  
                    Lampa.Storage.set('jackett_key', server.key);  
                    Lampa.Storage.set('jackett_main_server', selected.serverString);  
                    showServerSelector();  // Обновляем список  
                }  
            },  
            onBack: () => Lampa.Controller.toggle('head')  // Возврат к шапке  
        });  
    };  
  
    // Добавление кнопки переключения серверов в верхнюю панель шапку  
    const addHeaderButton = () => {  
        const icon = Lampa.Head.addIcon(  
            '<svg><use xlink:href="#sprite-torrent"></use></svg>',  
            showServerSelector  
        );  
          
        icon.addClass('jackett-servers-selector');  
        icon.hide();  // Изначально скрыта  
  
        // Отслеживаем смену активности: показываем кнопку только в разделе торрентов  
        Lampa.Listener.follow('activity', (e) => {  
            if (e.type === 'start') {  
                icon[e.component === 'torrents' ? 'show' : 'hide']();  
            }  
        });  
    };  
  
    // Регистрация плагина в контекстном меню (появляется при долгом тапе на карточку)  
    Lampa.Manifest.plugins.unshift({  
        type: 'video',  
        name: 'Парсер',  
        subtitle: 'Смотреть торрент',  
        onContextMenu: () => {},  
        onContextLauch: (object) => {  
            // При выборе открываем раздел торрентов с поиском по названию фильма  
            Lampa.Activity.push({  
                component: 'torrents',  
                search: object.title,  
                movie: object,  
                clarification: true  
            });  
        }  
    });  
  
    // Инициализация плагина после готовности приложения  
    if (window.appready) {  
        addHeaderButton();  // Приложение уже готово  
    } else {  
        Lampa.Listener.follow('app', (e) => {  
            if (e.type === 'ready') addHeaderButton();  // Ждём готовности  
        });  
    }  
})();        const server = parseServer(serverString);  
          
        // Сохраняем оригинальные настройки для восстановления  
        const originalUrl = Lampa.Storage.get('jackett_url', '');  
        const originalKey = Lampa.Storage.get('jackett_key', '');  
          
        // Устанавливаем временный сервер  
        Lampa.Storage.set('jackett_url', server.url);  
        Lampa.Storage.set('jackett_key', server.key);  
        Lampa.Storage.set('jackett_interview', 'healthy');  
          
        // Перезагружаем страницу торрентов с новым сервером  
        Lampa.Activity.replace({  
            url: '',  
            title: `Торренты - ${server.url}`,  
            component: 'torrents',  
            search: activity.search,  
            movie: activity.movie,  
            page: 1  
        });  
  
        // Сбрасываем предыдущий таймер, если он был  
        if (switchTimer) clearTimeout(switchTimer);  
          
        // Устанавливаем таймер на восстановление оригинального сервера  
        switchTimer = setTimeout(() => {  
            Lampa.Storage.set('jackett_url', originalUrl);  
            Lampa.Storage.set('jackett_key', originalKey);  
            switchTimer = null;  
        }, 1000);  
    };  
  
    // Отображение диалога выбора сервера  
    const showServerSelector = () => {  
        const mainServer = Lampa.Storage.get('jackett_main_server', '');  
          
        // Формируем список пунктов меню (без первого элемента-заголовка)  
        const items = [];  
  
        // Добавляем каждый сервер в список  
        JACKETT_SERVERS.forEach((serverString, index) => {  
            const server = parseServer(serverString);  
            // Отображаем номер, URL, ключ (если есть) и звездочку для основного сервера  
            const displayTitle = `${index + 1}. ${server.url}` +   
                                (server.key ? ` (${server.key})` : '') +   
                                (mainServer === serverString ? ' ★' : '');  
              
            items.push({ title: displayTitle, serverString });  
        });  
  
        // Показываем окно выбора с правильным заголовком  
        Lampa.Select.show({  
            title: 'Короткий тап - поиск | Долгий тап - сделать основным', // Заголовок диалога  
            items,  
            onSelect: (selected) => {  
                // Короткий тап - временное переключение для поиска  
                if (selected?.serverString) switchServer(selected.serverString);  
            },  
            onLong: (selected) => {  
                // Долгий тап - установка основного сервера  
                if (selected?.serverString) {  
                    const server = parseServer(selected.serverString);  
                    Lampa.Storage.set('jackett_url', server.url);  
                    Lampa.Storage.set('jackett_key', server.key);  
                    Lampa.Storage.set('jackett_main_server', selected.serverString);  
                    showServerSelector();  // Обновляем список  
                }  
            },  
            onBack: () => Lampa.Controller.toggle('head')  // Возврат к шапке  
        });  
    };  
  
    // Добавление кнопки переключения серверов в верхнюю панель шапку  
    const addHeaderButton = () => {  
        const icon = Lampa.Head.addIcon(  
            '<svg><use xlink:href="#sprite-torrent"></use></svg>',  
            showServerSelector  
        );  
          
        icon.addClass('jackett-servers-selector');  
        icon.hide();  // Изначально скрыта  
  
        // Отслеживаем смену активности: показываем кнопку только в разделе торрентов  
        Lampa.Listener.follow('activity', (e) => {  
            if (e.type === 'start') {  
                icon[e.component === 'torrents' ? 'show' : 'hide']();  
            }  
        });  
    };  
  
    // Регистрация плагина в контекстном меню (появляется при долгом тапе на карточку)  
    Lampa.Manifest.plugins.unshift({  
        type: 'video',  
        name: 'Парсер',  
        subtitle: 'Смотреть торрент',  
        onContextMenu: () => {},  
        onContextLauch: (object) => {  
            // При выборе открываем раздел торрентов с поиском по названию фильма  
            Lampa.Activity.push({  
                component: 'torrents',  
                search: object.title,  
                movie: object,  
                clarification: true  
            });  
        }  
    });  
  
    // Инициализация плагина после готовности приложения  
    if (window.appready) {  
        addHeaderButton();  // Приложение уже готово  
    } else {  
        Lampa.Listener.follow('app', (e) => {  
            if (e.type === 'ready') addHeaderButton();  // Ждём готовности  
        });  
    }  
})();
