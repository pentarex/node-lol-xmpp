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
var parser = require('xml2js').parseString;
var extend = require("xtend")

var allFriends = {}; // Maps JID -> SummonerName
var onlineFriends = {}; // Maps SummonerName -> {Body, JID, Status}

//TODO add more servers
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

module.exports = new LoLXMPP();
module.exports.LoLXMPP = LoLXMPP;
module.exports.LoLXMPP.SERVERS = SERVERS;
module.exports.LoLXMPP.PRESENCE = PRESENCE;

//TODO document the code
function LoLXMPP() {
    //Settings
    var conn;
    var events;
    var self = this;
    var $ = qbox.create();
    var internalEvents = new EventEmitter();
    self.events = new EventEmitter();
    
    //LoL XMPP Settings;
    var username;
    var password_prefix = 'AIR_';
    var resource = 'xiff';
    var domain = 'pvp.net';
    var port = 5223;
    var legacySSL = true;
    
    //Sending presence
    self.setPresence = function (show, status) {
        //TODO Add set Presence
    };
    
    self.getRoster = function () {
        $.ready(function () {
            var roster = new xmpp.Element('iq', { id: 'roster_0', type: 'get' });
            roster.c('query', { xmlns: 'jabber:iq:roster' });
            conn.send(roster);
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
        
        conn.on('close', function () {
            $.stop();
            internalEvents.emit('close');
        });
        
        conn.on('error', function (err) {
            internalEvents.emit('error', err);
        });
        
        conn.on('online', function (data) {
            console.log(xmpp.Element);
            console.log(data);
            conn.send(new xmpp.Element('presence'));
            internalEvents.emit('online', data);
            $.start();
            
            // keepalive
            if (self.conn.connection.socket) {
                self.conn.connection.socket.setTimeout(0);
                self.conn.connection.socket.setKeepAlive(true, 10000);
            }
            
            self.getRoster();
        });
        
        conn.on('stanza', function (stanza) {
            if (stanza.is('presence')) {
                internalEvents.emit('onlineFriendsInternal', stanza);
                var friendname = allFriends[stanza.attrs.from.split('/')[0]];
                var toSplit = stanza.attrs.from.split('/');
                var friend = toSplit[0];
                if (stanza.attrs.type && stanza.attrs.type === 'unavailable') {
                    //If we get a logoff message, remove them from online list
                    delete onlineFriends[friendname];
                }
                else if (stanza.children.length > 0) {
                    //otherwise add them to online friends
                    var friendstuff = {
                        status: stanza.children[0].children[0],
                        body: stanza.children[1].children[0]
                    };
                    var name = allFriends[friend];
                    var body = friendstuff.body;
                    var info;
                    parser(body, function (err, result) {
                        info = (result && result.body) ? result.body : body; //TODO
                    });
                    addInfo = {
                        status: friendstuff.status,
                        body: friendstuff.body,
                        jid: friend
                    }
                    var extended = extend(info);
                    onlineFriends[name] = extend(info, addInfo);
                    if (name) {
                        self.events.emit('onlineFriendsUpdate', name);
                    }
                }
            } 
            else if (stanza.is('iq')) {
                internalEvents.emit('allFriends', stanza);
                for (var f in stanza.children[0].children) {
                    allFriends[stanza.children[0].children[f].attrs.jid] = stanza.children[0].children[f].attrs.name;
                }
            } 
            else if (stanza.is('message')) {
                if (stanza.attrs.type == 'chat') {
                    var body = stanza.getChild('body');
                    if (body) {
                        var message = body.getText();
                        var from = stanza.attrs.from;
                        var id = from.split('/')[0];
                        internalEvents.emit('receiveMessage', id, message);
                    }
                }
            }
        });
    };
    
    self.getAllFriends = function () {
        return allFriends;
    }
    // to is the name we are sending to, message is the string to send.
    self.sendMessage = function (to, message) {
        // Use a regex so you can match mismatched cases.
        // in the client xxx == xXx === XXX
        var to_name = new RegExp(to, 'i');
        $.ready(function () {
            var jid = (function () {
                var key;
                for (key in onlineFriends) {
                    if (key.match(to_name)) {
                        return onlineFriends[key].jid;
                    }
                }
                return undefined;
            })();
            if (!jid) {
                return;
            }
            jid += '/xiff';
            var stanza = new xmpp.Element('message', { to: jid, type: 'chat' });
            stanza.c('body').t(message);
            self.conn.send(stanza);
        });
    };
    
    internalEvents.on('receiveMessage', function (from, message) {
        var friendName = allFriends[from];
        self.events.emit('incomingMessage', friendName, message);
    });
}
