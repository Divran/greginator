onVersionChanged(function(version) {
	var card = $( "#gt-overclock" );

	if (version == "it3") {
		card.hide();
		return;
	} else {
		card.show();
	}

	var header = $( ".card-header", card );
	header.addClass( "link-pointer" );
	var collapse = $( ".collapse", card );

	header.off("click");
	header.on("click",function() {collapse.collapse("toggle");});

	var energy_elem = $("#gt-overclock-energy",card);
	var amps_elem = $("#gt-overclock-amps",card);
	var target_buttons = $("[name='gt-overclock-target']",card);
	var output_elem = $("#gt-overclock-output",card);
	var amps_buttons = $("[name='gt-overclock-amps']",card);
	var results_elem = $("#gt-overclock-results");
	var time_elem = $("#gt-overclock-time");
	var results = $("#gt-overclock-results");

	function getTier(voltage) {
		if (voltage <= 8) {return 1;}
		var logn = Math.log(voltage)/Math.log(4);
		return Math.floor(logn)-1;
	}

	function doCalc() {
		results.empty();

		var energy = parseInt(energy_elem.val());
		var amps = parseInt(amps_elem.val());
		var target = parseInt($("[name='gt-overclock-target']:checked").val());
		var output = parseInt(output_elem.val());
		var time = parseInt(time_elem.val());

		if (isNaN(energy) || isNaN(amps) || isNaN(target) || isNaN(output) || isNaN(time)) {
			results.text("One or more of your inputs is an invalid number.");
			return;
		}

		var tier = getTier(energy);
		var target_tier = getTier(target);

		if (target_tier < tier) {
			results.text("Your target tier is too low.");
			return;
		}

		var overclocks = target_tier - tier;
		energy = energy * Math.pow(4,overclocks);
		var speed = Math.pow(2,overclocks);
		time = time / speed;
		var output_per_sec = output/time;

		function round3(n) {
			return Math.round(n*1000)/1000;
		}

		var amps_txt = "";
		if (amps > 1) {
			amps_txt = " at " + amps + " amps for a total of <strong>" + (energy * amps) + "</strong> eu/t";
		}

		var txt = [];
		txt.push("Overclocked: <strong>" + overclocks + "</strong> times.");
		txt.push("Energy usage: <strong>" + energy + "</strong> eu/t" + amps_txt+"");
		txt.push("Output: <strong>" + output + "</strong> every <strong>" + time + "</strong> second(s) " + 
			"for a total of <strong>" + round3(output_per_sec) + "</strong> per second" );
		txt.push("In a processing array, uses <strong>" + (energy*amps*16) + "</strong> eu/t, and produces <strong>" + round3(output_per_sec*16) + "</strong> per second" );

		results.html("<h5>Results</h5><p>"+txt.join("<br>")+"</p>");
	}

	$([energy_elem[0],amps_elem[0],output_elem[0],time_elem[0]]).click(function() {
		$(this).select();
	}).on("input",doCalc);
	amps_buttons.click(function() {
		amps_elem.val($(this).val());
		doCalc();
	});

	target_buttons.each(function() {
		var that = $(this);
		if (that.attr("checked")) {
			that.click();
		}
	}).change(doCalc);

	doCalc();
});