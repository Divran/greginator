onVersionChanged(function(version) {
	var card = $( "#gt-overclock" );

	if (version == "it3") {
		card.hide();
		return;
	} else {
		card.show();
	}

	var header = $( "> .card-header", card );
	header.addClass( "link-pointer" );
	var collapse = $( ".collapse", card );

	header.off("click");
	header.on("click",function() {collapse.collapse("toggle");});

	var energy_elem = $("#gt-overclock-energy",card);
	var amps_elem = $("#gt-overclock-amps",card);
	var target_buttons = $("[name='gt-overclock-target']",card);
	var poc_buttons = $("[name='gt-overclock-perfectoc']",card);
	var output_elem = $("#gt-overclock-output",card);
	var input_elem = $("#gt-overclock-input",card);
	var amps_buttons = $("[name='gt-overclock-amps']",card);
	var results_elem = $("#gt-overclock-results",card);
	var time_elem = $("#gt-overclock-time",card);
	var time_check = $("#gt-overclock-time-flip",card);
	var results = $("#gt-overclock-results",card);
	var wanted_elem = $("#gt-overclock-wanted",card);
	var wanted_check = $("#gt-overclock-wanted-flip",card);

	// gt++
	var time_bonus = $("#gt-overclock-faster",card);
	var energy_bonus = $("#gt-overclock-eureduction",card);
	var parallels = $("#gt-overclock-parallels",card);

	function getTier(voltage) {
		if (voltage <= 8) {return 1;}
		var logn = Math.log(voltage)/Math.log(4)-1.5;
		return Math.ceil(logn);
	}

	function getVoltageOfTier(tier) {
		return 32 * Math.pow(4,tier - 1);
	}


	var PA_amount = (version == "gtnh" ? 64 : 16);

	function doCalc() {
		results.empty();

		var energy = parseInt(energy_elem.val());
		var amps = parseInt(amps_elem.val());
		var target_elem = $("[name='gt-overclock-target']:checked",card);
		var poc = $("[name='gt-overclock-perfectoc']:checked",card).val();
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

		if (!time_check.is(":checked")) {
			time = time * 20;
		}

		// perfect oc
		var ENERGY_PER_TIER = 4;
		var SPEED_PER_TIER = 2;
		if (poc == "semi") {
			ENERGY_PER_TIER = 2;
			SPEED_PER_TIER = 2;
		} else if (poc == "perfect") {
			ENERGY_PER_TIER = 4;
			SPEED_PER_TIER = 4;
		}

		var overclocks = target_tier - tier;
		energy = energy * Math.pow(ENERGY_PER_TIER,overclocks);
		var speed = Math.pow(SPEED_PER_TIER,overclocks);
		time = Math.max(1,Math.floor((time/speed) + 0.5));

		var output_per_sec = output/(time/20);
		var input_per_sec = input/(time/20);

		function round3(n) {return Math.round(n*1000)/1000;}
		function round6(n) {return Math.round(n*1000000)/1000000;}

		var amps_txt = "";
		if (amps > 1) {
			amps_txt = " at " + amps + " amps for a total of <strong>" + (energy * amps) + "</strong> eu/t";
		}

		var txt = [];
		txt.push("Overclocked: <strong>" + overclocks + "</strong> times.");
		txt.push("Energy consumption: <strong>" + energy + "</strong> eu/t" + amps_txt+".");
		txt.push("Production: <strong>" + output + "</strong> every <strong>" + (time >= 20 ? round3(time/20) + " sec" : time + " ticks") + "</strong> " + 
			"for a total of <strong>" + round3(output_per_sec) + "</strong> per second." );
		txt.push("Consumption: <strong>" + round3(input_per_sec) + "</strong> per second.");

		var processing_array = "<p>In a processing array, uses <strong>" + round3(energy*amps*PA_amount) + "</strong> eu/t, produces <strong>" + round3(output_per_sec*PA_amount) + "</strong> items/s, "+
				" and consumes <strong>" + round3(input_per_sec*PA_amount) + "</strong> items/s.</p>";

		var wanted_str = "";
		if (!isNaN(wanted)) {
			if (wanted_check.is(":checked")) {
				wanted = 1/wanted;
			}

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

				var wanted_arrays = wanted_machines < PA_amount ? 0 : Math.ceil(wanted_machines/PA_amount);
				if (wanted_arrays > 0) {
					wanted_str += ", or <strong>" + Math.ceil(wanted_machines/PA_amount) + "</strong>";
					if (round3(wanted_machines/PA_amount) != Math.ceil(wanted_machines/PA_amount)) {
						wanted_str += " <small>("+round3(wanted_machines/PA_amount)+")</small>";
					}
					wanted_str += " processing arrays."
				} else {
					wanted_str += ".";
				}

				wanted_str += "<br>These will consume <strong>" + round3(energy*amps*wanted_machines) + "</strong> eu/t and <strong>"+
							 round3(input_per_sec*wanted_machines)+"</strong> items/s.";

				if (wanted_arrays > 0) {
					var wanted_arrays = 
					wanted_str += " In processing arrays, consumes <strong>"+round3(energy*amps*wanted_arrays*PA_amount)+"</strong> eu/t"+
									" and <strong>"+round3(input_per_sec*wanted_arrays*PA_amount)+"</strong> items/s.";
				}
			}

			wanted_str = "<hr /><p>"+wanted_str+"</p>";
		}

		// GT++
		var gtplusplus = "";
		var time_bonus_int = parseInt(time_bonus.val());
		var energy_bonus_int = parseInt(energy_bonus.val());
		var parallels_int = parseInt(parallels.val());
		if (!isNaN(time_bonus_int) && !isNaN(energy_bonus_int) && energy_bonus_int != 0 && !isNaN(parallels_int)) {
			// Source:
			// https://github.com/GTNewHorizons/GTplusplus/blob/b5c2946f55ee5e44a341f545ce7565203803d74a/src/main/java/gtPlusPlus/xmod/gregtech/api/metatileentity/implementations/base/GregtechMeta_MultiBlockBase.java#L1023

			parallels_int = Math.max(1,parallels_int * target_tier);

			time = parseFloat(time_elem.val());
			if (!time_check.is(":checked")) {
				time = time * 20;
			}
			energy = parseInt(energy_elem.val()) * energy_bonus_int / 100;
			var totalEnergy = energy*amps;
			var parallelRecipes = 0;
			while(parallelRecipes < parallels_int && totalEnergy < (target - energy)) {
				parallelRecipes++;
				totalEnergy += energy;
			}

			var time_bonus_int = parseInt(time_bonus);
			if (!isNaN(time_bonus_int) && time_bonus_int != 0) {
				time_bonus_int = Math.max(-99,time_bonus_int);
				var timeFactor = 100 / (100 + time_bonus_int);
				time = time * timeFactor;
			}

			totalEnergy = Math.ceil(totalEnergy);
			var overclocks = 0;
			var speed = 0;
            while (totalEnergy <= getVoltageOfTier(target_tier - 1)) {
            	totalEnergy *= ENERGY_PER_TIER;
            	speed += SPEED_PER_TIER;
            	overclocks++;
            }

            if (speed != 0) {
				time = Math.max(1,Math.floor((time/speed) + 0.5));
			}

			var output_per_sec = (output*parallelRecipes)/(time/20);
			var input_per_sec = (input*parallelRecipes)/(time/20);

			var gtpp_wanted_str = "";
			if (!isNaN(wanted)) {
				if (wanted < output_per_sec) {
					gtpp_wanted_str += "A single machine is enough to keep up with " + wanted + "/s.";
				} else {
					var wanted_machines = wanted/output_per_sec;
					gtpp_wanted_str += "To produce <strong>" + round6(wanted) + "</strong> items/s, ";
					gtpp_wanted_str += "you need <strong>" + Math.ceil(wanted_machines) + "</strong>";

					if (round3(wanted_machines) != Math.ceil(wanted_machines)) {
						gtpp_wanted_str += " <small>(" + round3(wanted_machines) + ")</small>";
					}

					gtpp_wanted_str += " <strong>" + target_elem.attr("data-voltage") + "</strong> machines to keep up";

					gtpp_wanted_str += "<br>These will consume <strong>" + round3(totalEnergy*wanted_machines) + "</strong> eu/t and <strong>"+
								 round3(input_per_sec*wanted_machines)+"</strong> items/s.";
				}
				gtpp_wanted_str = "<hr /><p>" + gtpp_wanted_str + "</p>";
			}

			gtplusplus = "<p>"+([
				"Overclocked: <strong>" + overclocks + "</strong> times.",
				"Energy consumption: <strong>" + totalEnergy + "</strong> eu/t",
				"Parallels: <strong>" + parallelRecipes + "</strong>",
				"Production: <strong>" + (output*parallelRecipes) + "</strong> every <strong>" + (time >= 20 ? round3(time/20) + " sec" : time + " ticks") + "</strong> " + 
					"for a total of <strong>" + round3(output_per_sec) + "</strong> per second.",
				"Consumption: <strong>" + round3(input_per_sec) + "</strong> per second."
			]).join("<br>")+"</p>";

			gtplusplus += gtpp_wanted_str;

		} else if (time_bonus.val() != "" || energy_bonus.val() != "" || parallels.val() != "") {
			gtplusplus = "Please fill in all GT++ related fields."
		}

		function buildResults(r) {
			var list = [];

			for(let idx in r) {
				list.push("<div class='col-lg-4 col-md-6'><div class='card card-body'>" + r[idx] + "</div></div>");
			}

			return $("<div class='row'>").append(list);
		}

		results.empty();
		results.append(buildResults([
			"<strong>Generic Results</strong><br>" + "<p>" + txt.join("<br>") + "</p>",
			"<strong>Processing Array Stats</strong><br>" + processing_array + wanted_str,
			"<strong>GT++ Stats</strong><br>" + gtplusplus
		]));
	}

	$([
		energy_elem[0],amps_elem[0],output_elem[0],input_elem[0],
		time_elem[0],time_check[0],wanted_elem[0],wanted_check[0],
		time_bonus[0],energy_bonus[0],parallels[0]
	]).off("click.oc_calculator").on("click.oc_calculator",function() {
		$(this).select();
	}).on("input",doCalc);
	amps_buttons.off("click.oc_calculator").on("click.oc_calculator",function() {
		amps_elem.val($(this).val());
		doCalc();
	});

	$(".fix-rounded-corners",card).removeClass("fix-rounded-corners");

	var last
	target_buttons.each(function() {
		var that = $(this);
		if (that.attr("checked")) {
			that.click();
		}

		if (that.parent().hasClass("oc-gtnh") && version != "gtnh") {
			if (last) {
				last.parent().addClass("fix-rounded-corners");
			}
			that.parent().hide();
		} else {
			that.parent().show();
		}

		that.parent().tooltip();
		last = that;
	}).change(doCalc);

	poc_buttons.each(function() {
		var that = $(this);
		if (that.attr("checked")) {
			that.click();
		}

		that.parent().tooltip();
	}).change(doCalc);

	if (version != "gtnh") {
		$(".oc-gtnh",card).hide();
	} else {
		$(".oc-gtnh",card).show();
	}

	doCalc();
});