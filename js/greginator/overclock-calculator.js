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
	var input_elem = $("#gt-overclock-input",card);
	var amps_buttons = $("[name='gt-overclock-amps']",card);
	var results_elem = $("#gt-overclock-results",card);
	var time_elem = $("#gt-overclock-time",card);
	var results = $("#gt-overclock-results",card);
	var wanted_elem = $("#gt-overclock-wanted",card);
	var wanted_check = $("#gt-overclock-wanted-flip",card);

	function getTier(voltage) {
		if (voltage <= 8) {return 1;}
		var logn = Math.log(voltage)/Math.log(4)-1.5;
		return Math.ceil(logn);
	}

	function doCalc() {
		results.empty();

		var energy = parseInt(energy_elem.val());
		var amps = parseInt(amps_elem.val());
		var target_elem = $("[name='gt-overclock-target']:checked",card);
		var target = parseInt(target_elem.val());
		var output = parseFloat(output_elem.val());
		var time = parseFloat(time_elem.val());
		var input = parseFloat(input_elem.val());
		var wanted = parseFloat(wanted_elem.val());

		if (isNaN(energy) || isNaN(amps) || isNaN(target) || isNaN(output) || isNaN(time) || isNaN(input)) {
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
		var input_per_sec = input/time;

		function round3(n) {return Math.round(n*1000)/1000;}
		function round6(n) {return Math.round(n*1000000)/1000000;}

		var amps_txt = "";
		if (amps > 1) {
			amps_txt = " at " + amps + " amps for a total of <strong>" + (energy * amps) + "</strong> eu/t";
		}

		var txt = [];
		txt.push("Overclocked: <strong>" + overclocks + "</strong> times.");
		txt.push("Energy consumption: <strong>" + energy + "</strong> eu/t" + amps_txt+".");
		txt.push("Production: <strong>" + output + "</strong> every <strong>" + time + "</strong> second(s) " + 
			"for a total of <strong>" + round3(output_per_sec) + "</strong> per second." );
		txt.push("Consumption: <strong>" + round3(input_per_sec) + "</strong> per second.");

		var processing_array = "<p>In a processing array, uses <strong>" + round3(energy*amps*16) + "</strong> eu/t, produces <strong>" + round3(output_per_sec*16) + "</strong> items/s, "+
				" and consumes <strong>" + round3(input_per_sec*16) + "</strong> items/s.</p>";

		var wanted_str = "";
		if (!isNaN(wanted)) {
			if (wanted_check.is(":checked")) {
				wanted = 1/wanted;
			}

			wanted_str += "<hr>";
			if (wanted < output_per_sec) {
				wanted_str += "A single machine is enough to keep up with " + wanted + "/s.";
			} else {
				var wanted_machines = wanted/output_per_sec;
				wanted_str += "To produce <strong>" + round6(wanted) + "</strong> items/s, ";
				wanted_str += "you need <strong>" + Math.ceil(wanted_machines) + "</strong>";

				if (round3(wanted_machines) != Math.ceil(wanted_machines)) {
					wanted_str += " <small>(" + round3(wanted_machines) + ")</small>";
				}

				wanted_str += " <strong>" + target_elem.attr("data-voltage") + "</strong> machines to keep up";

				var wanted_arrays = wanted_machines < 16 ? 0 : Math.ceil(wanted_machines/16);
				if (wanted_arrays > 0) {
					wanted_str += ", or <strong>" + Math.ceil(wanted_machines/16) + "</strong>";
					if (round3(wanted_machines/16) != Math.ceil(wanted_machines/16)) {
						wanted_str += " <small>("+round3(wanted_machines/16)+")</small> processing arrays.";
					}
				} else {
					wanted_str += ".";
				}

				wanted_str += "<br>These will consume <strong>" + round3(energy*amps*wanted_machines) + "</strong> eu/t and <strong>"+
							 round3(input_per_sec*wanted_machines)+"</strong> items/s.";

				if (wanted_arrays > 0) {
					var wanted_arrays = 
					wanted_str += " In processing arrays, consumes <strong>"+round3(energy*amps*wanted_arrays*16)+"</strong> eu/t"+
									" and <strong>"+round3(input_per_sec*wanted_arrays)+"</strong> items/s.";
				}
			}

			wanted_str = "<p>"+wanted_str+"</p>";
		}

		results.html("<h5>Results</h5><p>"+txt.join("<br>")+"</p>"+processing_array+wanted_str);
	}

	$([energy_elem[0],amps_elem[0],output_elem[0],time_elem[0],wanted_elem[0],wanted_check[0]]).click(function() {
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