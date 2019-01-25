/* See license.txt for terms of usage */

var _ = require('underscore');

exports.get = function(url, params, cb) {
    exports.send(url, 'GET', params, cb);
}

exports.post = function(url, params, cb) {
    exports.send(url, 'POST', params, cb);
}

exports.send = function(url, method, params, cb) {
    var xhr = new XMLHttpRequest();
    xhr.open(method, url, true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4) {
            var data = xhr.responseText;
            try {
                data = JSON.parse(data);
            } catch (exc) {
            }
            if (cb) {
                cb(data);
            }
        }
    }

    var body;
    if (params) {
        var bodies = [];
        for (var name in params) {
            bodies.push(name + '=' + encodeURIComponent(params[name]));
        }

        body = bodies.join('&');
        if (body.length) {
            xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded"); 
        }        
    }

    xhr.send(body);
}

exports.getJSON = function(url, params, cb) {
   var pairs = ['callback=jsonp'];
    _.each(params, function(value, key) {
        pairs[pairs.length] = key+'='+value;
    });
    if (pairs.length) {
        url = url + (url.indexOf('?') == -1 ? '?' : '&') + pairs.join('&');
    }

    function jsonpReturn(o) {
        self.jsonp = undefined;
        if (!o || o.error) {
            if (cb) cb(o);        
        } else {
            if (cb) cb(0, o);
        }        
    }

    if (has('appjs')) {
        self.jsonp = jsonpReturn;

        appjs.load(url, 'GET', {}, params, function(err, data) {
            if (err) {
                cb(err);            
            } else {
                sandboxEval(data);
            }
        });
    } else if (self.document) {
        self.jsonp = function(o) {
            // Return on a timeout to ensure that getJSON calls return asynchronously. There
            // is a case in IE where, after hitting the back button, this will return
            // synchronously and potentially confuse some clients.
            setTimeout(function() { jsonpReturn(o) }, 0);
        }

        function cleanup() {
            if (script.parentNode) {
                script.parentNode.removeChild(script);
            }            
        }

        var script = document.createElement('script');
        script.type = 'text/javascript';
        // script.async = true;
        script.src = url;
        script.onload = cleanup;
        script.onerror = function(event) {
            cleanup();
            cb("Error");
        };
        var head = document.getElementsByTagName("head")[0];
        head.appendChild(script);
    } else {
        self.jsonp = jsonpReturn;

        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.onreadystatechange = function() {
            if (xhr.readyState == 4) {
                eval(xhr.responseText);
                self.jsonp = null;
            }
        }
        xhr.send("");
    }
}

exports.postJSON = function(url, params, cb) {
    exports.post(url, params, function(data) {
        var result = eval(data);
        cb(0, result);
    }); 
};
