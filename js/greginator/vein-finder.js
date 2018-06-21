(function() {
	var card = $( "#gt-vein-finder" );

	var header = $( ".card-header", card );
	header.addClass( "link-pointer" );
	var collapse = $( ".collapse", card );

	header.click(function() {
		collapse.collapse( "toggle" );
	});

	var input_x = $( "#gt-vein-finder-x", card );
	var input_z = $( "#gt-vein-finder-z", card );
	var result = $( "#gt-vein-finder-result", card );
	result.hide();
	var playercoords = $( "#gt-vein-finder-coord-type-player" );

	function update() {
		var x = input_x.val();
		var z = input_z.val();

		if (x == "" || z == "") {
			result.hide();
			return;
		}

		if (isNaN(parseInt(x)) || isNaN(parseInt(z))) {
			result.removeClass( "alert-success" ).addClass( "alert-danger" ).text( "Please enter valid coordinates." );
			result.show();
			return;
		}

		var playerx = parseInt(x);
		var playerz = parseInt(z);
		var chunkx = playerx;
		var chunkz = playerz;

		// Calculate chunk or player position
		if (playercoords.is( ":checked" )) {
			chunkx = playerx >= 0 ? Math.floor(playerx / 16) : (Math.ceil((playerx-1) / 16)-1);
			chunkz = playerz >= 0 ? Math.floor(playerz / 16) : (Math.ceil((playerz-1) / 16)-1);
		} else {
			playerx = playerx * 16 + 8;
			playerz = playerz * 16 + 8;
		}

		// Check if on top of possible vein
		function checkChunk(x,z) {
			var modx = x % 3 - (x < 0 ? -1 : 1);
			var modz = z % 3 - (z < 0 ? -1 : 1);

			return (modx == 0 && modz == 0);
		}

		if (checkChunk(chunkx,chunkz)) {
			result.removeClass( "alert-danger" ).addClass( "alert-success" ).text( "You are on top of a possible vein spawn!" );
			result.show();
			return;
		}

		// Find closest possible vein spawn
		var closest_x = 0;
		var closest_z = 0;
		for(var x=-1;x<=1;x++) {
			for(var z=-1;z<=1;z++) {
				var checkx = chunkx + x
				var checkz = chunkz + z

				if (checkChunk(checkx,checkz)) {
					closest_x = checkx;
					closest_z = checkz;
					break;
				}
			}
		}

		var diffx = chunkx - closest_x;
		var diffz = chunkz - closest_z;

		var diffs = [];

		function compare(playercoord,diff,dirnames) {
			if (diff == 0) {return;}

			var dir = 1;
			if (diff < 0) {dir = -1;}
			diff = Math.abs(diff);

			var dirname = (
				dir == (playercoord <= 0 ? 1 : -1)
				? dirnames[0]
				: dirnames[1]
			);

			var chunkname = "chunk";
			if (diff > 1) {chunkname = "chunks";}

			diffs.push(diff + " " + chunkname + " " + dirname);
		}

		compare(playerx,diffx,["west","east"]);
		compare(playerz,diffz,["north","south"]);

		result.removeClass( "alert-success" ).addClass( "alert-danger" ).html( 
			"You are not on top of a possible vein spawn.<br>The closest vein spawn is " + diffs.join(", ") + "."
		);
		result.show();

	}

	input_x.on( "input", update );
	input_z.on( "input", update );

})();