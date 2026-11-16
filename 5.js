(function () {  
    'use strict';  
  
    var manifest = {  
        type: 'video',  
        version: '1.0.0',  
        name: 'Трейлеры RU',  
        description: 'Поиск русских трейлеров на YouTube'  
    };  
  
    // Публичные Invidious-инстансы; если один не отвечает — берём следующий  
    var INVIDIOUS = [  
        'https://inv.nadeko.net',  
        'https://invidious.nerdvpn.de',  
        'https://iv.melmac.space',  
        'https://invidious.f5.si'  
    ];  
  
    function searchYouTube(query, oncomplite, onerror, index) {  
        index = index || 0;  
  
        if (index >= INVIDIOUS.length) return onerror();  
  
        var url = INVIDIOUS[index] + '/api/v1/search?q=' +  
            encodeURIComponent(query) + '&type=video&region=RU';  
  
        Lampa.Network.silent(url, function (json) {  
            var items = (json || []).filter(function (v) {  
                return v.type === 'video' && v.videoId;  
            }).slice(0, 5);  
  
            if (items.length) oncomplite(items);  
            else searchYouTube(query, oncomplite, onerror, index + 1);  
        }, function () {  
            searchYouTube(query, oncomplite, onerror, index + 1);  
        }, null, { timeout: 10000 });  
    }  
  
    function showTrailers(movie) {  
        var title = movie.title || movie.name || movie.original_title || movie.original_name || '';  
        var date  = movie.release_date || movie.first_air_date || '';  
        var year  = date ? date.split('-')[0] : '';  
        var query = (title + ' ' + year + ' трейлер на русском').trim();  
  
        Lampa.Noty.show('Поиск: ' + query);  
  
        searchYouTube(query, function (videos) {  
            var items = videos.map(function (v) {  
                return {  
                    title: Lampa.Utils.shortText(v.title || '', 60),  
                    subtitle: (v.author || '') + (v.publishedText ? ' — ' + v.publishedText : ''),  
                    id: v.videoId,  
                    url: 'https://www.youtube.com/watch?v=' + v.videoId,  
                    youtube: true,  
                    icon: '<img class="size-youtube" src="https://img.youtube.com/vi/' + v.videoId + '/default.jpg" />',  
                    template: 'selectbox_icon',  
                    thumbnail: 'https://img.youtube.com/vi/' + v.videoId + '/default.jpg'  
                };  
            });  
  
            Lampa.Select.show({  
                title: 'YouTube — ' + query,  
                items: items,  
                onSelect: function (a) {  
                    Lampa.Controller.toggle('content');  
  
                    if (Lampa.Platform.is('android') &&  
                        Lampa.Storage.field('player_launch_trailers') == 'youtube') {  
                        Lampa.Android.openYoutube(a.id);  
                    } else {  
                        Lampa.Player.play(a);  
                        Lampa.Player.playlist(items);  
                    }  
                },  
                onBack: function () {  
                    Lampa.Controller.toggle('content');  
                }  
            });  
        }, function () {  
            Lampa.Noty.show('Трейлеры не найдены');  
        });  
    }  
  
    function startPlugin() {  
        Lampa.Manifest.plugins = manifest;  
  
        Lampa.Listener.follow('full', function (e) {  
            if (e.type !== 'complite') return;  
  
            var movie = e.data.movie;  
            if (!movie || movie.adult) return;  
  
            var btn = $(  
                '<div class="full-start__button selector view--trailers_ru" data-subtitle="YouTube">' +  
                    '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">' +  
                        '<path d="M23 7.2s-.2-1.6-.9-2.3c-.9-.9-1.9-.9-2.4-1C16.6 3.5 12 3.5 12 3.5s-4.6 0-7.7.4c-.5.1-1.5.1-2.4 1-.7.7-.9 2.3-.9 2.3S.8 9.1.8 11v1.8c0 1.9.2 3.8.2 3.8s.2 1.6.9 2.3c.9.9 2 .9 2.5 1 1.8.2 7.6.4 7.6.4s4.6 0 7.7-.4c.5-.1 1.5-.1 2.4-1 .7-.7.9-2.3.9-2.3s.2-1.9.2-3.8V11c0-1.9-.2-3.8-.2-3.8zM9.8 15.1V8.4l6.2 3.4-6.2 3.3z" fill="currentColor"/>' +  
                    '</svg>' +  
                    '<span>Трейлеры RU</span>' +  
                '</div>'  
            );  
  
            btn.on('hover:enter', function () {  
                showTrailers(movie);  
            });  
  
            var render = e.object.activity.render();  
            var after  = render.find('.view--trailer');  
  
            if (after.length) after.after(btn);  
            else render.find('.full-start-new__buttons, .full-start__buttons').first().append(btn);  
        });  
    }  
  
    if (window.appready) startPlugin();  
    else {  
        Lampa.Listener.follow('app', function (e) {  
            if (e.type === 'ready') startPlugin();  
        });  
    }  
})();
