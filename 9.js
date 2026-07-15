(function() {  
    var LOG = '[JacTest]';  
    var TEST_QUERY = 'Дюна'; // тестовый запрос  
  
    // Формат: 'host=apikey' или просто 'host'  
    var RAW_SERVERS = [  
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
        'nmjc.duckdns.org'  
    ];  
  
    var PROTOCOLS   = ['https', 'http'];  
    var API_VERSIONS = ['v2.0', 'v1.0'];  
  
    // Парсим серверы  
    var servers = RAW_SERVERS.map(function(s) {  
        var idx = s.indexOf('=');  
        return idx === -1  
            ? { host: s, apikey: '' }  
            : { host: s.substring(0, idx), apikey: s.substring(idx + 1) };  
    });  
  
    // Генерируем все комбинации  
    var tests = [];  
    servers.forEach(function(srv) {  
        PROTOCOLS.forEach(function(proto) {  
            API_VERSIONS.forEach(function(ver) {  
                tests.push({  
                    host:   srv.host,  
                    apikey: srv.apikey,  
                    proto:  proto,  
                    ver:    ver,  
                    url:    proto + '://' + srv.host  
                          + '/api/' + ver + '/indexers/all/results'  
                          + '?apikey=' + encodeURIComponent(srv.apikey)  
                          + '&Query=' + encodeURIComponent(TEST_QUERY)  
                });  
            });  
        });  
    });  
  
    var results = [];  
    var pending = tests.length;  
  
    console.log(LOG, '════ START: ' + tests.length + ' tests ('  
        + servers.length + ' servers × '  
        + PROTOCOLS.length + ' protocols × '  
        + API_VERSIONS.length + ' API versions) ════');  
    console.log(LOG, 'Test query: "' + TEST_QUERY + '"');  
  
    // Запускаем все тесты параллельно  
    tests.forEach(function(test) {  
        var network = new Lampa.Reguest();  
        var t0 = Date.now();  
        var label = test.proto + '://' + test.host + ' [' + test.ver + ']'  
                  + (test.apikey ? ' key="' + test.apikey + '"' : '');  
  
        network.silent(test.url, function(res) {  
            var ms    = Date.now() - t0;  
            var count = (res && res.Results && res.Results.length) || 0;  
            var hasData = count > 0;  
            results.push({ test: test, ok: true, hasData: hasData, count: count, ms: ms });  
            console.log(LOG,  
                (hasData ? '✓ OK    ' : '⚠ EMPTY ') + label  
                + ' → results=' + count + ' time=' + ms + 'ms');  
            checkDone();  
        }, function(err) {  
            var ms     = Date.now() - t0;  
            var errMsg = (err && err.decode_error)  
                      || (err && err.statusText)  
                      || (err && err.status ? 'HTTP ' + err.status : 'error');  
            results.push({ test: test, ok: false, hasData: false, count: 0, ms: ms, error: errMsg });  
            console.log(LOG, '✗ FAIL  ' + label + ' → ' + errMsg + ' time=' + ms + 'ms');  
            checkDone();  
        });  
    });  
  
    function checkDone() {  
        pending--;  
        if (pending > 0) return;  
  
        var working = results.filter(function(r) { return r.ok && r.hasData; });  
        var empty   = results.filter(function(r) { return r.ok && !r.hasData; });  
        var failed  = results.filter(function(r) { return !r.ok; });  
  
        console.log(LOG, '');  
        console.log(LOG, '════════════════════════════════════════════════');  
        console.log(LOG, '  ИТОГ: всего=' + results.length  
            + '  ✓работают=' + working.length  
            + '  ⚠пустые=' + empty.length  
            + '  ✗ошибки=' + failed.length);  
        console.log(LOG, '════════════════════════════════════════════════');  
  
        console.log(LOG, '');  
        console.log(LOG, '✓ РАБОТАЮТ (есть результаты), сортировка по скорости:');  
        working.sort(function(a, b) { return a.ms - b.ms; });  
        working.forEach(function(r, i) {  
            console.log(LOG, '  ' + (i + 1) + '. '  
                + r.test.proto + '://' + r.test.host  
                + '/api/' + r.test.ver + '/'  
                + (r.test.apikey ? '  apikey="' + r.test.apikey + '"' : '  (без ключа)')  
                + '  results=' + r.count  
                + '  time=' + r.ms + 'ms');  
        });  
  
        if (empty.length) {  
            console.log(LOG, '');  
            console.log(LOG, '⚠ ОТВЕЧАЮТ НО ПУСТЫЕ (сервер жив, но нет результатов по "' + TEST_QUERY + '"):');  
            empty.forEach(function(r) {  
                console.log(LOG, '  ' + r.test.proto + '://' + r.test.host  
                    + ' [' + r.test.ver + ']'  
                    + (r.test.apikey ? ' key="' + r.test.apikey + '"' : '')  
                    + '  time=' + r.ms + 'ms');  
            });  
        }  
  
        console.log(LOG, '');  
        console.log(LOG, '✗ НЕДОСТУПНЫ:');  
        // Группируем по хосту чтобы не дублировать  
        var failedHosts = {};  
        failed.forEach(function(r) {  
            var key = r.test.host;  
            if (!failedHosts[key]) failedHosts[key] = [];  
            failedHosts[key].push(r.test.proto + '+' + r.test.ver + ': ' + r.error);  
        });  
        Object.keys(failedHosts).forEach(function(host) {  
            console.log(LOG, '  ' + host + ':');  
            failedHosts[host].forEach(function(msg) {  
                console.log(LOG, '    ' + msg);  
            });  
        });  
  
        console.log(LOG, '');  
        console.log(LOG, '════ ГОТОВО К КОПИРОВАНИЮ В ПЛАГИН ════');  
        console.log(LOG, 'var SERVERS = [');  
        working.forEach(function(r) {  
            console.log(LOG, "    { url: '"  
                + r.test.proto + '://' + r.test.host + '/api/' + r.test.ver  
                + "', apikey: '" + r.test.apikey + "' },  // "  
                + r.ms + 'ms, ' + r.count + ' results');  
        });  
        console.log(LOG, '];');  
        console.log(LOG, '════════════════════════════════════════════════');  
    }  
})();
