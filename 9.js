(function () {  
    'use strict'  
  
    function startPlugin() {  
        if (window.online_folder_plugin_started) return  
        window.online_folder_plugin_started = true  
  
        Lampa.Lang.add({  
            online_folder_title: {  
                ru: 'Онлайн',  
                uk: 'Онлайн',  
                en: 'Online'  
            }  
        })  
  
        var FOLDER_CLASS = 'view--online-folder'  
  
        // иконка-папка (та же svg, что у папок в online-плагине)  
        var folder_button = '<div class="full-start__button selector ' + FOLDER_CLASS + '">' +  
            '<svg viewBox="0 0 128 112" fill="none" xmlns="http://www.w3.org/2000/svg">' +  
                '<rect y="20" width="128" height="92" rx="13" fill="currentColor"/>' +  
                '<path d="M29.9963 8H98.0037C96.0446 3.3021 91.4079 0 86 0H42C36.5921 0 31.9555 3.3021 29.9963 8Z" fill="currentColor" fill-opacity="0.23"/>' +  
                '<rect x="11" y="8" width="106" height="76" rx="13" fill="currentColor" fill-opacity="0.51"/>' +  
            '</svg>' +  
            '<span>#{online_folder_title}</span>' +  
        '</div>'  
  
        function build(render) {  
            // убираем прошлую сборку (если перерисовка)  
            render.find('.' + FOLDER_CLASS).remove()  
            render.find('.full-start__button.view--online').removeClass('hide')  
  
            // все онлайн-кнопки чужих плагинов  
            var sources = render.find('.buttons--container > .full-start__button.view--online, ' +  
                                      '.full-start__button.view--online').not('.' + FOLDER_CLASS)  
  
            if (!sources.length) return  
  
            sources.addClass('hide')  
  
            var btn = $(Lampa.Lang.translate(folder_button))  
  
            btn.on('hover:enter', function () {  
                var items = []  
  
                sources.each(function () {  
                    var icon = $(this).find('svg').prop('outerHTML')  
  
                    items.push({  
                        title: $(this).text().trim(),  
                        subtitle: $(this).data('subtitle'),  
                        template: icon ? 'selectbox_icon' : 'selectbox_item',  
                        icon: icon,  
                        btn: $(this)  
                    })  
                })  
  
                Lampa.Select.show({  
                    title: Lampa.Lang.translate('online_folder_title'),  
                    items: items,  
                    onSelect: function (a) {  
                        a.btn.trigger('hover:enter')  
                    },  
                    onBack: function () {  
                        Lampa.Controller.toggle('content')  
                    }  
                })  
            })  
  
            var torrent = render.find('.view--torrent')  
            if (torrent.length) torrent.last().after(btn)  
            else render.find('.buttons--container').prepend(btn)  
        }  
  
        Lampa.Listener.follow('full', function (e) {  
            if (e.type !== 'complite') return  
  
            // ждём, пока остальные плагины вставят свои кнопки  
            setTimeout(function () {  
                var render = e.object.activity.render()  
                build(render)  
            }, 50)  
        })  
    }  
  
    if (window.appready) startPlugin()  
    else {  
        Lampa.Listener.follow('app', function (e) {  
            if (e.type === 'ready') startPlugin()  
        })  
    }  
})()
