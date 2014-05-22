/**

The MIT License (MIT)

Copyright (c) 2014 Hristo Hristov

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

*/

var xmpp = require('node-xmpp');
var EventEmitter = require('events').EventEmitter;
var qbox = require('qbox');

var SERVERS = {
	na: 'chat.na1.lol.riotgames.com',
	euw: 'chat.eu.lol.riotgames.com',
	eune: 'chat.eun1.lol.riotgames.com'
};
var PRESENCE = {
	online: 'online',
	away: 'away',
	dnd: 'dnd'
};

//module.exports = new LoLXMPP();

function LoLXMPP(){
	//Settings
	var conn;
	var self = this;
	var $ = qbox.create();
	var events = new EventEmitter();

	//LoL XMPP Settings;
	var username;
	var password_prefix = 'AIR_';
	var resource = 'xiff';
	var domain = 'pvp.net';
	var port = 5223;
  	var legacySSL = true;
  	


  	//Sending presence
  	self.setPresence = function(show, status) {
        $.ready(function() {
            var stanza = new xmpp.Element('presence');
            if(show && show !== PRESENCE.online) {
                stanza.c('show').t(show);
            }
            if(typeof(status) !== 'undefined') {
                stanza.c('status').t(status);
            }
            conn.send(stanza);
        });
    };

  	self.connect = function (username, password, server) {
		conn = new xmpp.Client({
			jid: username + '@' + domain + '/' + resource,
			password: password_prefix + password,
			host: server,
			port: port,
			legacySSL: legacySSL
		});

	    self.conn = conn;
	    self.username = username;

        conn.on('close', function() {
            $.stop();
            events.emit('close');
        });

        conn.on('error', function(err) {
            events.emit('error', err);
        });

        conn.on('online', function(data){
        	console.log(xmpp.Element);
        	console.log(data);
        	conn.send(new xmpp.Element('presence'));
            events.emit('online', data);
            $.start();

            // keepalive
            if(self.conn.connection.socket) {
              self.conn.connection.socket.setTimeout(0);
              self.conn.connection.socket.setKeepAlive(true, 10000);
            }
        });
        conn.on('stanza', function(stanza) {
        	console.log(stanza);
        });
	};

	

	
}













