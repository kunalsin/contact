exports.init = function(io) {
	var currentPlayers = 0; // keep track of the number of players
	var id = 0;
	var count = 0;
	var wordmaster;
	var counter = 1;
	var playerword;

  // When a new connection is initiated
  //server taking information from client side, doing something to data, and sending back to client(s)
  	var allClients = [];
	io.sockets.on('connection', function (socket) {
		++currentPlayers;
		++id;
		allClients.push(socket);
		// Send ("emit") a 'players' event back to the socket that just connected.
		socket.emit('players', { number: currentPlayers});
		socket.emit('message', { player_id: id});
		/*
		 * Emit players events also to all (i.e. broadcast) other connected sockets.
		 * Broadcast is not emitted back to the current (i.e. "this") connection
     */
		socket.broadcast.emit('players', { number: currentPlayers});

		socket.on('clicked', function (data) {
			count++;
			console.log("currentPlayers",currentPlayers);
			console.log("count",count);
	  		if ((currentPlayers == count) && (currentPlayers > 2)) { //if currPlayer == data.num then all players have clicked ready
	  			var rand = allClients[Math.floor(Math.random()*allClients.length)].id;	//randomly choose a client id to assign master
	  			io.sockets.emit('ready', "Player(s) are ready to go!") 	//emit event to EVERYONE saying players are ready to go
	  			for(var i=0;i<allClients.length;i++){
	  				socid = allClients[i].id;
	  				if(rand == allClients[i].id) {
	  					console.log("this client will get the master word page",data.user_name);
	  					io.to(socid).emit('redirect',{type: "master", user_name:data.user_name});
	  				}	//render the word master page
		  			else {
		  				console.log("this client will get normal page",data.user_name);
		  				io.to(socid).emit('redirect',{type: "player", user_name:data.user_name});
		  			}	//else render normal page
	  			}	
	  		}
	  		else if ((currentPlayers == count) && (currentPlayers <= 2)) {
	  			io.sockets.emit('ready', "At Least 3 Players Needed To Begin The Game!")
	  			console.log("FAIL");
	  		}
		});

		socket.on('masterwordset', function (data) {
			wordmaster = data.master_word;
			socket.broadcast.emit('lettersend', {letter:wordmaster.substring(0,counter)});
		});

		socket.on('playerwordset', function (data) {
			playerword = data.player_word;
			playerhint = data.player_hint;
			socket.broadcast.emit('playerinfosend', {playerword: playerword, playerhint: playerhint});
		});

		socket.on('playerwordguess', function (data) {
			playerguessword = data.player_guess;
			if ((playerguessword == playerword) && (playerword != wordmaster)) {
				io.emit('contact', {message:"WE HAVE CONTACT!", success:true});
				counter++;
				console.log(counter);
				io.emit('lettersend', {letter:wordmaster.substring(0,counter)});
				if (counter == wordmaster.length){
					io.emit('redirect', {type:"gameOver"});
				}

			}
			else if ((playerguessword == playerword) && (playerword == wordmaster)) {
				io.emit('contact', {message:"WE HAVE CONTACT!", success:true});
				io.emit('redirect', {word:wordmaster, type:"gameOver"});
			}
			else {
				socket.emit('contact', {message:"FAILED, TRY AGAIN", sucess:false});
			}
		});

		socket.on('wordmasterwordguess', function (data) {
			wordmasterguessword = data.wordmaster_guess;
			if (wordmasterguessword == playerword){
				io.emit('contact', {message:"Word Master Guessed the Word, Resetting..", success:true});
			}
			else {
				socket.emit('contact', {message:"FAILED, TRY AGAIN", sucess:false});
			}
		});

		count=0;
		counter=1;
		socket.on('restart', function (data) {
			count++;
			console.log("currentPlayers",currentPlayers);
			console.log("count",count);
	  		if (currentPlayers == count) { //if currPlayer == data.num then all players have clicked ready
	  			var rand = allClients[Math.floor(Math.random()*allClients.length)].id;	//randomly choose a client id to assign master
	  			io.sockets.emit('ready', "Player(s) are ready to go!") 	//emit event to EVERYONE saying players are ready to go
	  			
	  			for(var i=0;i<allClients.length;i++){
	  				socid = allClients[i].id;
	  				if(rand == allClients[i].id) {
	  					console.log("this client will get the master word page");
	  					io.to(socid).emit('redirect',{type: "master"});
	  				}	//render the word master page
		  			else {
		  				console.log("this client will get normal page");
		  				io.to(socid).emit('redirect',{type: "player"});
		  			}	//else render normal page
	  			}	
	  		}
		});


		/*
		 * Upon this connection disconnecting (sending a disconnect event)
		 * decrement the number of players and emit an event to all other
		 * sockets.  Notice it would be nonsensical to emit the event back to the
		 * disconnected socket.
		 */
		socket.on('disconnect', function () {
			--currentPlayers;
			socket.broadcast.emit('players', { number: currentPlayers});
			var i = allClients.indexOf(socket);
      		allClients.splice(i, 1);
      		console.log(allClients.length)
		});
	});
}
