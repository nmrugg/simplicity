Simplicity
===

A server that let you handle GET and POST HTTP requests with simplicity.

How to Install
---

    npm install simplicity

Example
---

    var server = require("simplicity.js");
    
    server.start_server(function (data, response)
    {
        response.end("You requested " + data.uri);
    });

Usage
---

    // First, load Simplicity.
    var server = require("simplicity.js");
    
This will create an object with two function: <code>start_server()</code> and <code>htmlentities()</code>.

start_server([config,] callback)
---

<code>config</code> is an optional object describing how Simplicity should work.

    {
        password:           (string)  The password used to authenticate the user
        port:               (number)  The port number to listen to                                          (default: 8888)
        post_limit          (number)  How many bytes to receive of POST data before dropping the connection (default: 2097152 (2mb))
        protect:            (boolean) Whether or not to require basic access authentication                 (default: FALSE)
        redirect:           (array)   An array of URLs to be intercepted and sent to the callback           (default: ["/"])
        redirect_on_errors: (boolean) Whether or not to send 404 errors to the callback                     (default: TRUE)
        root_path:          (string)  The www root directory                                                (default: current working directory)
        timeout:            (number)  How long to wait before dropping the connection if it hasn't finished (default: 60000 (1 min))
        username:           (string)  The authenticated user
    }

<code>callback(data, response)</code> will be called by Simplicity when a request comes in (that is not for a static resource) and has two parameters: <code>data</code> and <code>response</code>.

<code>data</code>

    {
        cookies:  Cookies sent in the request
        filename: The location on the server for the request
        get:      The GET data (as an object)
        headers:  The HTTP headers from the request
        post:     The POST data (as an object)
        uri:      The URI being requested
    }

<code>reponse</code>

    {
        end:        function ([data[, encoding]]) // Close the request (and optionally write a message)
        send_404:   function ()                   // Send a 404 error and close the request
        write:      function (data[, encoding])   // Write data back to the client
        write_head: function (code[, headers])    // Write HTTP headers back to the client
    }

<code>htmlentities(string)</code>
---

Encode a string so that it will display as text not HTML.

For example:
    
    server.htmlentities("<script>"); // Returns: "&lt;script&gt;

License
---
<a href="http://nate.mit-license.org/">MIT</a>
