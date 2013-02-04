"use strict";

var fs    = require("fs"),
    http  = require("http"),
    path  = require("path"),
    url   = require("url"),
    qs    = require("querystring"),
    
    /// Third party dependancy
    mime = require("mime");

process.on("uncaughtException", function(e)
{
    
    ///NOTE: This does not work right in at least Node.js 0.6.15. The e.errno and e.code are the same for some reason. Do more research and maybe send a bug report.
    if (e.errno === 98) {
        console.log("Error: Unable to create server because port " + port + " is already is use.");
    } else if (e.errno === 13) {
        console.log("Error: You do not have permission to open port " + port + ".\nTry a port above 1023 or running \"sudo !!\"");
    } else {
        console.log(e.stack);
    }
    
    process.exit(e.errno);
});

exports.htmlentities = (function ()
{
    var entities = {
        /// Double Quote
        "\u0022": "&quot;",
        "\u0026": "&amp;",
        /// Single Quote
        "\u0027": "&#39;",
        "\u003c": "&lt;",
        "\u003e": "&gt;",
        "\u00a0": "&nbsp;",
        "\u00a1": "&iexcl;",
        "\u00a2": "&cent;",
        "\u00a3": "&pound;",
        "\u00a4": "&curren;",
        "\u00a5": "&yen;",
        "\u00a6": "&brvbar;",
        "\u00a7": "&sect;",
        "\u00a8": "&uml;",
        "\u00a9": "&copy;",
        "\u00aa": "&ordf;",
        "\u00ab": "&laquo;",
        "\u00ac": "&not;",
        "\u00ad": "&shy;",
        "\u00ae": "&reg;",
        "\u00af": "&macr;",
        "\u00b0": "&deg;",
        "\u00b1": "&plusmn;",
        "\u00b2": "&sup2;",
        "\u00b3": "&sup3;",
        "\u00b4": "&acute;",
        "\u00b5": "&micro;",
        "\u00b6": "&para;",
        "\u00b7": "&middot;",
        "\u00b8": "&cedil;",
        "\u00b9": "&sup1;",
        "\u00ba": "&ordm;",
        "\u00bb": "&raquo;",
        "\u00bc": "&frac14;",
        "\u00bd": "&frac12;",
        "\u00be": "&frac34;",
        "\u00bf": "&iquest;",
        "\u00c0": "&Agrave;",
        "\u00c1": "&Aacute;",
        "\u00c2": "&Acirc;",
        "\u00c3": "&Atilde;",
        "\u00c4": "&Auml;",
        "\u00c5": "&Aring;",
        "\u00c6": "&AElig;",
        "\u00c7": "&Ccedil;",
        "\u00c8": "&Egrave;",
        "\u00c9": "&Eacute;",
        "\u00ca": "&Ecirc;",
        "\u00cb": "&Euml;",
        "\u00cc": "&Igrave;",
        "\u00cd": "&Iacute;",
        "\u00ce": "&Icirc;",
        "\u00cf": "&Iuml;",
        "\u00d0": "&ETH;",
        "\u00d1": "&Ntilde;",
        "\u00d2": "&Ograve;",
        "\u00d3": "&Oacute;",
        "\u00d4": "&Ocirc;",
        "\u00d5": "&Otilde;",
        "\u00d6": "&Ouml;",
        "\u00d7": "&times;",
        "\u00d8": "&Oslash;",
        "\u00d9": "&Ugrave;",
        "\u00da": "&Uacute;",
        "\u00db": "&Ucirc;",
        "\u00dc": "&Uuml;",
        "\u00dd": "&Yacute;",
        "\u00de": "&THORN;",
        "\u00df": "&szlig;",
        "\u00e0": "&agrave;",
        "\u00e1": "&aacute;",
        "\u00e2": "&acirc;",
        "\u00e3": "&atilde;",
        "\u00e4": "&auml;",
        "\u00e5": "&aring;",
        "\u00e6": "&aelig;",
        "\u00e7": "&ccedil;",
        "\u00e8": "&egrave;",
        "\u00e9": "&eacute;",
        "\u00ea": "&ecirc;",
        "\u00eb": "&euml;",
        "\u00ec": "&igrave;",
        "\u00ed": "&iacute;",
        "\u00ee": "&icirc;",
        "\u00ef": "&iuml;",
        "\u00f0": "&eth;",
        "\u00f1": "&ntilde;",
        "\u00f2": "&ograve;",
        "\u00f3": "&oacute;",
        "\u00f4": "&ocirc;",
        "\u00f5": "&otilde;",
        "\u00f6": "&ouml;",
        "\u00f7": "&divide;",
        "\u00f8": "&oslash;",
        "\u00f9": "&ugrave;",
        "\u00fa": "&uacute;",
        "\u00fb": "&ucirc;",
        "\u00fc": "&uuml;",
        "\u00fd": "&yacute;",
        "\u00fe": "&thorn;",
        "\u00ff": "&yuml;"
    };
    
    return function (str)
    {
        return String(str).replace(/[\u0022\u0026\u0027\u003c\u003e\u00a0-\u00ff]/g, function enc(symbol)
        {
            return entities[symbol];
        });
    };
}());


/**
 * @param config   (object) An object describing the configuration options (everything is optional)
 *                          {
 *                              password:           (string)  The password used to authenticate the user
 *                              port:               (number)  The port number to listen to                                          (default: 8888)
 *                              post_limit          (number)  How many bytes to receive of POST data before dropping the connection (default: 2097152 (2mb))
 *                              protect:            (boolean) Whether or not to require basic access authentication                 (default: FALSE)
 *                              redirect:           (array)   An array of URLs to be intercepted and sent to the callback           (default: ["/"])
 *                              redirect_on_errors: (boolean) Whether or not to send 404 errors to the callback                     (default: TRUE)
 *                              root_path:          (string)  The www root directory                                                (default: current working directory)
 *                              timeout:            (number)  How long to wait before dropping the connection if it hasn't finished (default: 60000 (1 min))
 *                              username:           (string)  The authenticated user
 *                          }
 * @param callback (function) The function to send requests too.
 */
exports.start_server = function (config, callback)
{
    if (!callback && typeof config === "function") {
        callback = config;
        config = null;
    }
    
    if (!config) {
        config = {};
    }
    
    if (!config.root_path) {
        config.root_path = process.cwd();
    }
    
    if (!config.port) {
        config.port = 8888;
    }
    
    if (!config.timeout) {
        config.timeout = 60000;
    }
    
    if (!config.post_limit) {
        config.post_limit = 2097152; /// 2mb
    }
    
    /// Convert it to an absolute path.
    config.root_path = path.resolve(config.root_path);
    config.port = Number(config.port);
    
    
    if (config.redirect) {
        /// Make sure that config.redirect is an array.
        if (!(config.redirect instanceof Array)) {
            delete config.redirect;
        }
    }
    if (!config.redirect) {
        config.redirect = ["/"];
    }
    
    if (typeof config.redirect_on_errors === "undefined") {
        config.redirect_on_errors = true;
    }
    
    /// Start the server.
    http.createServer(function (request, response)
    {
        var cookies,
            filename,
            get_data,
            post_data,
            uri,
            url_parsed = url.parse(request.url);
        
        /// If the gallery is password protected, check for credentials.
        ///NOTE: This method is not secure and should not be used over a public connection.
        ///NOTE: .substr(6) is to remove the text "Basic " preceding the username and password.
        if (config.protect && (!request.headers.authorization || new Buffer(request.headers.authorization.substr(6), "base64").toString("utf8") !== config.username + ":" + config.password)) {
            response.writeHead(401, {"Content-Type": "text/html", "WWW-Authenticate": "Basic realm=\"Secure Area\""});
            response.write("Unauthorized");
            response.end();
            return;
        }
        
        uri = qs.unescape(url_parsed.pathname);
        
        /// Make sure the URI is valid.
        if (uri.substr(0, 4) === "/../" || uri[0] !== "/") {
            response.writeHead(404, {"Content-Type": "text/plain"});
            response.write("404 Not Found\n");
            response.end();
            return;
        }
        
        filename = path.join(config.root_path, uri);
        
        function request_page()
        {
            var basedir,
                dirs,
                files,
                i,
                stat,
                timeout;
            
            function send_to_callback()
            {
                var header_written;
                
                /// Create a timeout to prevent a connection from hanging too long.
                timeout = setTimeout(function ()
                {
                    response.end();
                }, config.timeout);
                
                callback({uri: uri, filename: filename, headers: request.headers, get: get_data, post: post_data, cookies: cookies}, {
                    end: function (data, encoding)
                    {
                        if (data) {
                            this.write(data, encoding)
                        }
                        response.end();
                        
                        /// Since it is ending now, clear the timeout.
                        clearTimeout(timeout);
                    },
                    send_404: function ()
                    {
                        this.write_head(404);
                        this.end("File not found.");
                    },
                    write: function (data, encoding)
                    {
                        /// If no header has been sent yet, send as standard HTML.
                        if (!header_written) {
                            this.write_head(200, {"Content-Type": "text/html"});
                        }
                        if (typeof data !== "string" && !Buffer.isBuffer(data)) {
                            data = JSON.stringify(data);
                        }
                        response.write(data, encoding);
                    },
                    write_head: function (code, headers)
                    {
                        response.writeHead(code, headers);
                        header_written = true;
                    }
                });
            }
            
            /// Check to see if this URI should be intercepted and sent to the callback.
            if (config.redirect) {
                for (i = config.redirect.length - 1; i >= 0; i -= 1) {
                    if (config.redirect[i] === uri) {
                        send_to_callback();
                        return;
                    }
                }
            }
            
            if (path.existsSync(filename)) {
                stat = fs.statSync(filename);
                if (stat.isDirectory()) {
                    if (config.redirect_on_errors) {
                        send_to_callback();
                    } else {
                        response.writeHead(404, {"Content-Type": "text/html"});
                        response.write("File not found");
                        response.end();
                    }
                } else {
                    /// Write out files.
                    /// First, check the headers for a cached version.
                    ///NOTE: When the user clicks the refresh button, the cache-control header is appended with a value of "max-age=0".
                    ///      It really should use the max-age value to determine if the cache is really invalidated.
                    if (request.headers["if-modified-since"] && request.headers["cache-control"] !== "max-age=0" && Date.parse(request.headers["if-modified-since"]) >= Date.parse(stat.mtime)) {
                        response.writeHead(304, {});
                    } else {
                        ///TODO: Make reading the files async.
                        response.writeHead(200, {"Content-Type": mime.lookup(filename), "Last-Modified": stat.mtime});
                        response.write(fs.readFileSync(filename));
                    }
                    response.end();
                }
            } else {
                if (config.redirect_on_errors) {
                    send_to_callback();
                } else {
                    response.writeHead(404, {"Content-Type": "text/html"});
                    response.write("File not found");
                    response.end();
                }
            }
        }
        
        /// Are there cookies?
        if (request.headers.cookie) {
            cookies = {};
            request.headers.cookie.split(";").forEach(function (cookie)
            {
                var parts = cookie.split("=");
                cookies[parts[0]] = parts[1];
            });
        }
        
        /// Is there GET data?
        if (url_parsed.query !== "") {
            get_data = qs.parse(url_parsed.query);
        }
        
        /// Is there POST data?
        if (request.method === "POST") {
        
            post_data = "";
            
            request.on("data", function(chunk)
            {
                /// Get the POST data.
                post_data += chunk.toString();
                if (post_data.length > config.post_limit) {
                    response.writeHead(413, {});
                    response.write("Request Entity Too Large");
                    request.connection.destroy(); /// The end.
                }
            });
            
            request.on("end", function(chunk)
            {
                post_data = qs.parse(post_data);
                request_page();
            });
        } else {
            request_page();
        }
        
    }).listen(config.port);
};
