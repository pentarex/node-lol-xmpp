var lolChat = require('node-lol-xmpp');

function example(){
	//Connect to the chat
	lolChat.connect('username', 'password', lolChat.LoLXMPP.SERVERS.eune);

	//Get Friends that are online
    lolChat.events.on('onlineFriendsUpdate', function(friends){
      for(var friend in friends){
        console.log(friends[friend]); //The object of the friend
        friends[friend].jid; //JID of the friend
        friends[friend].level //The level of the friend
        friends[friend].status //The status of the friend
        friends[friend].profileIcon //The icon of the summoner
        //... and the rest of the information the server sends
      }
    });

    //Receive Incoming Message
    lolChat.events.on('incomingMessage', function(name, message){
      console.log(name + ': ' + message);
    });

    //Send Message
    lolChat.sendMessage('Pentarex', 'Hi!');

    //Get All Friends - online and offline
    lolChat.getAllFriends();
}

            