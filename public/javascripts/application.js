$(document).ready(function(){
	console.log("Document is ready to go!");

	//behaviors interactions
	$('#button3').on('click',putting);
	$('#b2').on('click',getting);
	$('#b3').on('click',posting);
	$('#b4').on('click',deleting);

	$('#center').on('click',deleteRow);
	//$('#getAll').on('click',getAll);


	function putting(){
		var user_name = $("#f input")[0].value;
		console.log("putting");
		$.ajax({
			url: './contact',
			type: 'PUT',
			data: {name: user_name},
			success:function(result){
				console.log(user_name+"has been added to DB");
			}
		});
	}

	function getting(){
		var user_name = $("#f input")[0].value;
		console.log("getting");
		var obj = {name:user_name};
		var url = "/contact?" + $.param(obj);
		window.location.href = url;
		}

	function posting(){
		var user_name = $("#f input")[0].value;
		var user_email = $("#f input")[1].value;
		var user_password = $("#f input")[2].value;
		console.log("posting");
		$.ajax({
			url: './contact',
			type: 'POST',
			data: {filter: user_name, update: user_email, user_password},
			success:function(result){
				console.log("Updated user information successfully")
				alert(result);
				// alert("Updating User: " + user_name + " Email: " + user_email + " Password: " + user_password);
				console.log(update);
			}
		});
	}

	function deleting(){
		var user_name = $("#f input")[0].value;
		console.log("delete");
		$.ajax({
			url: './contact',
			type: 'DELETE',
			data: {name: user_name},
			success:function(result){
				// alert("Deleting user: " + user_name);
				alert(result);
				console.log("Successfully deleted user");
			}
		});
	}

	function deleteRow(){
		if ($('.resultTable tr').length > 1){
			$('.resultTable tr').last().remove();
		}
	}

	$("#wordmaster-guess-div").hide();
	$("#player-guess-div").hide();



	//client sending information to the server below based on button clicks etc...

	var socket = io.connect("http://nodejs328final-kunalsin.rhcloud.com:8000");

	$('#button3').on('click', function() {
		var user_name = $("#f input")[0].value;
		if (user_name == "") {
	        swal("Oops...","Enter Your Name To Begin The Game!","error");
	        return false;
	    };
	    localStorage.setItem("username", user_name);
	    socket.emit('clicked', {success: true, user_name: user_name});
		$('#f input[type=text]').attr("disabled",true);
		swal("Awesome!","You're Ready To Go","success");
	    var message = $('<span><h3>...Waiting On Other Players...</h3></span>');
	    $(this).after(message);
	    $(this).remove();
  	});

  	$('#sendword').on('click',function() {
  		var master_word = $("#form-wordmaster input")[0].value;
  		if (master_word == "") {
	        swal("Oops...","You Need To Enter In A Word","error");
	        return false;
	    }
	    else if(master_word.match(/^\S[A-Za-z]*$/gm)) {
	    	socket.emit('masterwordset',{master_word: master_word});
  			$('#form-wordmaster input[type=text]').attr("disabled",true);
  			swal("Sent!","Your Word Is Now In Play","success");
  			$("#waitingforplayerword").text("Waiting For Player's Hint...");
  			$("#body").show();

	    }
	    else {
	    	swal("Oops...","The Word Entered Is Not An English Word!","error");
	    	return false;
	    }
  	});

  	$('#sendplayerwordhint').on('click',function() {
  		var player_word = $("#form-player input")[0].value;
  		var player_hint = $("#form-player input")[1].value;
  		if (player_word == "" || player_hint == "") {
  			swal("Oops...","Enter A Word And A Hint","error");
	        return false;
	    };
  		socket.emit('playerwordset',{player_word: player_word, player_hint: player_hint});
  		swal("Sent!","Your Hint Has Been Sent To Other Players","success");
  		$('#player-word').attr("disabled",true);
  		$("span",this).text("Update Hint");
  	});

  	$('#guessplayerword').on('click',function() {
  		var player_guess = $("#player-guess input")[0].value;
  		socket.emit('playerwordguess',{player_guess: player_guess});
  		$('#form-player input[type=text]').attr("disabled",true);
  	});

  	$('#guesswordmasterword').on('click',function() {
  		var word_master_guess = $("#wordmaster-guess input")[0].value;
  		socket.emit('wordmasterwordguess',{wordmaster_guess: word_master_guess});
  	});

  	$('#restart').on('click', function() {
	    socket.emit('restart', {success: true});
	    var message = $('<span><h3>...Waiting On Other Players...</h3></span>');
	    $(this).after(message);
	    $(this).remove();
  	});

  	//client retrieving information from the server below

	socket.on('players', function (data) {
	  $("#numPlayers").text(data.number);
		});

	socket.on('message', function (data) {
	  $("#welcome").text(data.player_id);
		});

	socket.on('ready', function (data) {
	  $("#ready").text(data);
		});

	socket.on('redirect', function (data) {
		if(data.type == "master") {
			console.log(data.user_name);
			var url = "/wordmaster";
			window.location.href = url;
			$("#playerName").text(data.user_name);
		}
		else if(data.type == "player") {
			var url = "/game";
			window.location.href = url;
			$("#playerName").text(data.user_name);
			console.log("body has been hid");
			$("#bodytext").hide();
		}
		else if(data.type == "gameOver") {
			var url = "/gameOver";
			console.log(data.word);
			$("#gameOvertext").text(data.word);
			window.location.href = url;

		}
	});

	socket.on('lettersend', function (data) {
		$("#ls").text('The Letter(s) are: ' + data.letter); 
	});

	socket.on('playerinfosend', function (data) {
		$("#playerhint").text('Player has a word and gave the hint: ' + data.playerhint);
		$("#player-guess-div").show();
		$("#wordmaster-guess-div").show();

	});

	socket.on('contact', function (data) {
		$("#contact").text(data.message); 
		if(data.success){
  			$('#form-player input[type=text]').attr("disabled",false);
  			$('#form-player input[type=text]').attr("disabled",false);
  			$("#player-guess-div").hide();
			$("#wordmaster-guess-div").hide();
			$("#sendplayerwordhint span").text("Click To Send");

		}
		$("#form-player").trigger("reset");
		$("#player-guess").trigger("reset");
		$("#wordmaster-guess").trigger("reset");
	});
});