onVersionChanged(function(version) {
	var card = $( "#gt-overclock" );

	if (version == "it3") {
		card.hide();
		return;
	} else {
		card.show();
	}

	function addClickToHeader(crd) {
		var header = $( "> .card-header", crd );
		header.addClass( "link-pointer" );
		var collapse = $( "> .collapse", crd );

		header.off("click");
		header.on("click",function() {collapse.collapse("toggle");});
	}

	addClickToHeader(card);
	addClickToHeader($(".oc-gtnh", card));
	addClickToHeader($(".oc-io", card));
	addClickToHeader($(".oc-converter", card));

	var energy_elem = $("#gt-overclock-energy",card);
	var amps_elem = $("#gt-overclock-amps",card);
	var poc_buttons = $("[name='gt-overclock-perfectoc']",card);
	var output_elem = $("#gt-overclock-output",card);
	var input_elem = $("#gt-overclock-input",card);
	var amps_buttons = $("[name='gt-overclock-amps']",card);
	var time_elem = $("#gt-overclock-time",card);
	var time_check = $("#gt-overclock-time-flip",card);
	var results = $("#gt-overclock-results > tbody",card);
	var wanted_elem = $("#gt-overclock-wanted",card);
	var wanted_check = $("#gt-overclock-wanted-flip",card);
	var batch_mode = $("#gt-overclock-batch").is(":checked");
	var uev_simulate = $("#gt-overclock-uev-simulate").is(":checked");
	var settings_input = $(".settings-input", card);

	// fill in voltage buttons
	var tier_names_list = [null,"LV","MV","HV","EV","IV","LuV","ZPM","UV","UHV","UEV","UIV","UMV","UXV","MAX", "Custom..."];
	var tier_names = {};
	var voltage_tiers = {};
	var voltage_buttons = $(".voltage-buttons");
	for(let i=1;i<tier_names_list.length;i++) {
		let tier_name = tier_names_list[i];
		let voltage = (tier_name == "Custom...") ? "custom" : getVoltageOfTier(i);
		if (voltage != "custom") {
			tier_names[i] = tier_name;
			voltage_tiers[voltage] = i;
		}

		voltage_buttons.each(function() {
			let that = $(this);
			let id = that.attr("data-id");
			let btn = $("<label>").addClass("btn btn-light").attr("title",(voltage == "custom" ? "Custom" : voltage) + " EU/t");
			btn.text(tier_name);
			let inp = $("<input>").attr("type","radio").attr("name",id).attr("id",id+"-"+i).val(voltage).attr("data-voltage",tier_name);
			if (tier_name == "MV") {inp.attr("checked","true");}
			btn.prepend(inp);
			that.append(btn);
		});

	}

	// voltage/amp calc

	function doVoltAmpCalc() {
		function getValue(target_elem, custom_elem, label) {
			var target = 0;
			custom_elem.removeClass("border-danger");
			if (target_elem.val() == "custom") {
				custom_elem.addClass("d-inline-block");
				target = parseInt(custom_elem.val());
				if (isNaN(target)) {
					custom_elem.addClass("border-danger");
					return 1;
				}
			} else {
				custom_elem.removeClass("d-inline-block");
				target = parseInt(target_elem.val());
			}
			label.text(target);
			return target;
		}


		var upper = getValue($("[name='gt-overclock-target-calc-1']:checked",card), $("#gt-overclock-target-custom-1",card), $("#gt-overclock-target-calc-1-eut",card));
		var amps_upper_elem = $("#gt-overclock-target-amps-1",card);
		amps_upper_elem.removeClass("border-danger");
		var amps_upper = parseInt(amps_upper_elem.val());
		if (isNaN(amps_upper)) {
			amps_upper = 1;
			amps_upper_elem.addClass("border-danger");
		}

		var lower = getValue($("[name='gt-overclock-target-calc-2']:checked",card), $("#gt-overclock-target-custom-2",card), $("#gt-overclock-target-calc-2-eut",card));
		var amps_lower_elem = $("#gt-overclock-target-amps-2",card);
		amps_lower_elem.removeClass("border-danger");
		var amps_lower = parseInt(amps_lower_elem.val());
		if (isNaN(amps_lower)) {
			amps_lower = 1;
			amps_lower_elem.addClass("border-danger");
		}

		var n = (upper*amps_upper)/(lower*amps_lower);

		$("#gt-overclock-target-calc-result").html(`(${upper} * ${amps_upper}) / (${lower} * ${amps_lower}) = ${n}`);
	}

	$("#gt-overclock-target-custom-1").on("input", doVoltAmpCalc).click(function() {$(this).select();});
	$("#gt-overclock-target-custom-2").on("input", doVoltAmpCalc).click(function() {$(this).select();});
	$("#gt-overclock-target-amps-1",card).on("input",doVoltAmpCalc).click(function() {$(this).select();});
	$("#gt-overclock-target-amps-2",card).on("input",doVoltAmpCalc).click(function() {$(this).select();});

	// laser hatch sizes
	(function() {
		var lasers = [
			{label:"256", amps: 256},
			{label:"1024", amps: 1024},
			{label:"4096", amps: 4096},
			{label:"16384", amps: 16384},
			{label:"65k", amps: 65536},
			{label:"262k", amps: 262144},
			{label:"1M", amps: 1048576},
		];
		for(let i=0;i<lasers.length;i++) {
			let row = lasers[i];
			lasers[i] = $("<div class='btn btn-light btn-sm'>").text(row.label).click(function() {
				navigator.clipboard.writeText(row.amps);
				var that = $(this);
				that.removeClass("btn-light").addClass("btn-success");
				setTimeout(() => {
					that.addClass("btn-light").removeClass("btn-success");
				},1000);
			});
		}
		$("#laser-hatch-sizes").append(lasers);
	})();

	// end of voltage/amp calc

	function applyOCTargetButtons(btns, onChange) {
		var last
		btns.each(function() {
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
		}).change(onChange);
	}

	applyOCTargetButtons($("[name='gt-overclock-target']",card), doCalc);
	applyOCTargetButtons($("[name='gt-overclock-target-calc-1']",card), doVoltAmpCalc);
	applyOCTargetButtons($("[name='gt-overclock-target-calc-2']",card), doVoltAmpCalc);

	$("#gt-overclock-batch").change(() => {
		batch_mode = $("#gt-overclock-batch").is(":checked");
		doCalc();
	});
	$("#gt-overclock-uev-simulate").change(() => {
		uev_simulate = $("#gt-overclock-uev-simulate").is(":checked");
		doCalc();
	});

	function applyCopyBtn(that) {
		that.click(() => {
			navigator.clipboard.writeText(that.text());
			that.removeClass("badge-secondary").addClass("badge-success");
			setTimeout(() => {
				that.addClass("badge-secondary").removeClass("badge-success");
			},1000);
		}).tooltip();
	}
	applyCopyBtn($("#gt-overclock-target-eut",card));
	applyCopyBtn($("#gt-overclock-target-calc-1-eut",card));
	applyCopyBtn($("#gt-overclock-target-calc-2-eut",card));
	

	// gt++
	var time_bonus = $("#gt-overclock-faster",card);
	var energy_bonus = $("#gt-overclock-eureduction",card);
	var parallels = $("#gt-overclock-parallels",card);

	function getTier(voltage) {
		if (voltage <= 8) {return 1;}
		return Math.ceil((Math.log2(voltage)/2)-1.5);
	}

	function getVoltageOfTier(tier) {
		return 32 * Math.pow(4,tier - 1);
	}


	var PA_amount = (version == "gtnh" ? 64 : 16);

	function getNameFromTier(tier) {
		if (typeof tier_names[tier] == "undefined") {
			return "*custom*";
		}
		return tier_names[tier];
	}
	
	var custom_target_tid = null;
	$("#gt-overclock-target-custom").on("input", function() {
		if (custom_target_tid) {clearTimeout(custom_target_tid);}
		custom_target_tid = setTimeout(function() {
			doCalc();
		},500);
	});

	$("#gt-overclock-gtppmachine").change(function() {
		var values = $(this).val().split(",");
		$("#gt-overclock-faster").val(values[0]);
		$("#gt-overclock-eureduction").val(values[1]);
		$("#gt-overclock-parallels").val(values[2]);
		doCalc();
	});

	// double button
	$(".gt-overclock-double-eut").click(function() {
		var id = $(this).attr("data-id");
		var custid = $(this).attr("data-custid");
		var cust = $("#" + custid,card);

		var volt = 0;
		if (cust.is(":visible")) {
			volt = cust.val();
		} else {
			volt = $("[name='" + id + "']:checked",card).val();
		}

		var newVolt = volt * 4;

		if (newVolt > getVoltageOfTier(14)) {
			// open custom
			$(".voltage-buttons[data-id='" + id + "'] input[value='custom']",card).click();
			cust.val(newVolt);
		} else {
			var tier = getTier(newVolt);
			$("#" + id + "-" + tier,card).click();
		}
	});

	var docalc_timer;
	function doCalc() {
		if (docalc_timer) {
			clearTimeout(docalc_timer);
		}

		docalc_timer = setTimeout(doCalc_inner,1);
	}

	function doCalc_inner() {
		$("#gt-overclock-info").empty();

		var results_list = [];
		function drawResults() {
			var columns = $("#gt-overclock-results > thead > tr > th").filter((i,v) => $(v).css("display") != "none").length;
			var tr_list = [];

			for(let row=0;row<results_list.length;row++) {
				let cols = results_list[row];

				if (cols.length > 0) {
					let tr = $("<tr>");
					tr_list.push(tr);

					for(let col=0;col<Math.min(cols.length,columns);col++) {
						let text = cols[col];
						let td = $("<td>").append(text);
						if (col == cols.length && col.length < columns) {
							td.attr("colspan", columns - col);
						}
						tr.append(td);
					}
				}
			}

			results.empty();
			results.append(tr_list);
		}

		var original_energy = parseInt(energy_elem.val());
		var amps = parseInt(amps_elem.val());
		var target_elem = $("[name='gt-overclock-target']:checked",card);
		var poc = $("[name='gt-overclock-perfectoc']:checked",card).val();
		var output = parseFloat(output_elem.val());
		var original_time = parseFloat(time_elem.val());
		var input = parseFloat(input_elem.val());
		var wanted = parseFloat(wanted_elem.val());

		var target;
		var custom_elem = $("#gt-overclock-target-custom");
		custom_elem.removeClass("border-danger");
		if (target_elem.val() == "custom") {
			custom_elem.addClass("d-inline-block");
			target = parseInt(custom_elem.val());
			if (isNaN(target)) {
				custom_elem.addClass("border-danger");
				return false;
			}
		} else {
			custom_elem.removeClass("d-inline-block");
			target = parseInt(target_elem.val());
		}
		$("#gt-overclock-target-eut",card).text(target);

		if (isNaN(original_energy) || isNaN(amps) || isNaN(target) || isNaN(output) || isNaN(original_time) || isNaN(input)) {
			results_list.push(["One or more of your inputs is an invalid number."]);
			drawResults();
			return;
		}

		var tier = getTier(original_energy);
		var target_tier = getTier(target);

		if (target_tier < tier) {
			results_list.push(["Your target tier is too low."]);
			drawResults();
			return;
		}

		if (!time_check.is(":checked")) {
			original_time = original_time * 20;
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

		function calcOC(_target_tier, _tier, _energy, _time) {
			var overclocks = _target_tier - _tier;
			var speed = Math.pow(SPEED_PER_TIER,overclocks);
			var time = _time / speed;

			var paTime = time;
			var paAmount = PA_amount;
			var paOverclocks = overclocks;
			var paSpeed = speed;

			if (uev_simulate && _target_tier > 9) {
				paAmount *= 4;
				paOverclocks = (_target_tier-1) - _tier;
				paSpeed = Math.pow(SPEED_PER_TIER, paOverclocks);
				paTime = _time / paSpeed;
			}

			var paEnergy = _energy * Math.pow(ENERGY_PER_TIER, paOverclocks);

			if (batch_mode) {
				paTime *= 128;
				paAmount *= 128;
			}

			return {
				overclocks: overclocks,
				energy: _energy * Math.pow(ENERGY_PER_TIER,overclocks),
				time: Math.max(1,Math.floor(time)),

				paOverclocks: paOverclocks,
				paTime: Math.max(1,Math.floor(paTime)),
				paEnergy: paEnergy,
				paAmount: paAmount,
				oneticking: Math.floor(time) <= 1
			};
		}

		var tmp = calcOC(target_tier, tier, original_energy, original_time);
		var overclocks = tmp.overclocks; 
		var energy = tmp.energy; 
		var time = tmp.time;

		var output_per_sec = output/(time/20);
		var input_per_sec = input/(time/20);


		var wanted_singles = 1;
		var wanted_arrays = 1;
		if (!isNaN(wanted)) {
			$("#gt-overclock-wanted-th").show();
			if (wanted_check.is(":checked")) {
				wanted = 1/wanted;
			}

			wanted_singles = wanted/output_per_sec;
			wanted_arrays = wanted_singles < PA_amount ? 0 : Math.ceil(wanted_singles/PA_amount);
		} else {
			$("#gt-overclock-wanted-th").hide();
		}

		results_list.push([
			"Singleblock",
			overclocks,
			(energy * amps).toLocaleString() + " eu/t",
			1,
			`${output} per ${(time >= 20 ? round3(time/20) + " sec" : time + " ticks")}, ${round3(output_per_sec).toLocaleString()}/s`,
			`${round3(input_per_sec).toLocaleString()}/s`,
			Math.ceil(wanted_singles) + ((Math.ceil(wanted_singles) != wanted_singles) ? " <small class='text-muted d-inline-block'>(" + round3(wanted_singles) + ")</small>" : "")
		]);

		if (tmp.oneticking) {
			$("#gt-overclock-info").append("<span class='text-muted mb-2'>1-ticking detected! Enable batch mode!</span>");
		}

		results_list.push([
		 	`${PA_amount}x ${getNameFromTier(target_tier)} PA`,
			tmp.paOverclocks,
			round3(energy*amps*PA_amount).toLocaleString() + " eu/t",
			(tmp.paAmount).toLocaleString(),
			`${(output*tmp.paAmount).toLocaleString()} per ${(tmp.paTime >= 20 ? round3(tmp.paTime/20) + " sec" : tmp.paTime + " ticks")}, ${round3((output/(tmp.paTime/20))*tmp.paAmount).toLocaleString()}/s`,
			`${round3((input/(tmp.paTime/20))*tmp.paAmount).toLocaleString()}/s`,
			Math.ceil(wanted_arrays) + ((Math.ceil(wanted_arrays) != wanted_arrays) ? " <small class='text-muted d-inline-block'>(" + round3(wanted_arrays) + ")</small>" : "")
		]);

		// check how many can fit in PA
		if (target_tier > tier + 1) {
			var prev_tier_current = target_tier;
			var energy_prev_tier = energy;
			while((energy_prev_tier*amps*PA_amount) > getVoltageOfTier(target_tier) && prev_tier_current > tier) {
				prev_tier_current--;
				energy_prev_tier = energy_prev_tier/ENERGY_PER_TIER;
			}

			if ((energy_prev_tier*amps*PA_amount) <= getVoltageOfTier(target_tier)) {
				var tmp2 = calcOC(prev_tier_current, tier, original_energy, original_time);

				var wanted_arrays2 = wanted/(((input/(tmp2.paTime/20))*tmp2.paAmount));

				results_list.push([
					`${PA_amount}x ${getNameFromTier(prev_tier_current)} PA`,
					""+tmp2.paOverclocks.toLocaleString(),
					round3(energy_prev_tier*amps*PA_amount).toLocaleString() + " eu/t",
					(tmp2.paAmount).toLocaleString(),
					`${(output*tmp2.paAmount).toLocaleString()} per ${(tmp2.paTime >= 20 ? round3(tmp2.paTime/20) + " sec" : tmp2.paTime + " ticks")}, ${round3((output/(tmp2.paTime/20))*tmp2.paAmount).toLocaleString()}/s`,
					`${round3((input/(tmp2.paTime/20))*tmp2.paAmount).toLocaleString()}/s`,
					Math.ceil(wanted_arrays2) + ((Math.ceil(wanted_arrays2) != wanted_arrays2) ? " <small class='text-muted d-inline-block'>(" + round3(wanted_arrays2) + ")</small>": "")
				]);
			}
		}

		// GT++
		var gtplusplus = "";
		var time_bonus_int = parseInt(time_bonus.val());
		var energy_bonus_int = parseInt(energy_bonus.val());
		var parallels_int = parseInt(parallels.val());
		if (!isNaN(time_bonus_int) && !isNaN(energy_bonus_int) && !isNaN(parallels_int)) {
			// Source:
			// https://github.com/GTNewHorizons/GTplusplus/blob/b5c2946f55ee5e44a341f545ce7565203803d74a/src/main/java/gtPlusPlus/xmod/gregtech/api/metatileentity/implementations/base/GregtechMeta_MultiBlockBase.java#L1023

			var parallels_temp = Math.max(1,parallels_int * target_tier);

			time = original_time;
			energy = original_energy;

			if (energy_bonus_int != 0) {energy *= energy_bonus_int / 100;}

			var totalEnergy = energy*amps;
			var parallelRecipes = 1;
			while(parallelRecipes < parallels_temp && totalEnergy < (target - energy)) {
				parallelRecipes++;
				totalEnergy += energy;
			}

			var time_bonus_temp = time_bonus_int;
			if (!isNaN(time_bonus_temp) && time_bonus_temp != 0) {
				time_bonus_temp = Math.max(-99,time_bonus_temp);
				var timeFactor = 100 / (100 + time_bonus_temp);
				time = Math.floor(time * timeFactor);
			}


			totalEnergy = Math.ceil(totalEnergy);
			var overclocks = 0;
			var speed = 0;
            while (totalEnergy < getVoltageOfTier(target_tier - 1)) {
            	totalEnergy *= ENERGY_PER_TIER;
            	//speed += SPEED_PER_TIER;
            	time = Math.floor(time / SPEED_PER_TIER);
            	overclocks++;
            }

			time = Math.max(1,time);

			var output_per_sec = (output*parallelRecipes)/(time/20);
			var input_per_sec = (input*parallelRecipes)/(time/20);

			var wanted_gtpp = 1;
			if (!isNaN(wanted)) {
				wanted_gtpp = wanted/output_per_sec;
			}

			if (batch_mode) {
				parallelRecipes *= 128;
				time *= 128;
			}

			results_list.push([
				getNameFromTier(target_tier) + " GT++",
				""+overclocks,
				round3(totalEnergy).toLocaleString() + " eu/t",
				parallelRecipes.toLocaleString(),
				`${(output*parallelRecipes).toLocaleString()} per ${(time >= 20 ? round3(time/20) + " sec" : time + " ticks")}, ${round3(output_per_sec).toLocaleString()}/s`,
				`${round3(input_per_sec).toLocaleString()}/s`,
				Math.ceil(wanted_gtpp) + ((Math.ceil(wanted_gtpp) != wanted_gtpp) ? " <small class='text-muted d-inline-block'>(" + round3(wanted_gtpp) + ")</small>" : "")
			]);
		} else if (time_bonus.val() != "" || energy_bonus.val() != "" || parallels.val() != "") {
			results_list.push(["Unable to calculate GT++, please fill in all GT++ related fields"]);
		}

		var json = {
			energy: parseInt(energy_elem.val()),
			amps: parseInt(amps_elem.val()),
			target: target,
			poc: $("[name='gt-overclock-perfectoc']:checked",card).val(),
			output: parseFloat(output_elem.val()),
			time: parseFloat(time_elem.val()),
			in_ticks: time_check.is(":checked"),
			input: parseFloat(input_elem.val()),
			wanted: parseFloat(wanted_elem.val()),
			wanted_1OX: wanted_check.is(":checked"),
			gtpp_machine: $("#gt-overclock-gtppmachine").val(),
			time_bonus: time_bonus_int,
			energy_bonus: energy_bonus_int,
			parallels_per_tier: parallels_int,
			batch_mode: batch_mode,
			downtier_uev: uev_simulate
		};
		settings_input.val(JSON.stringify(json));
		drawResults();
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

	function round3(n) {return Math.round(n*1000)/1000;}
	function round6(n) {return Math.round(n*1000000)/1000000;}

	doCalc();
	doVoltAmpCalc();

	window.fromConflictCheckerToOverclockCalculator = function(recipe) {
		function noA0(i) {
			return i.a > 0;
		}

		energy_elem.val(recipe.eut);
		time_elem.val(recipe.dur);
		time_check.prop("checked",true);

		var inputs = [...recipe.fI.filter(noA0),...recipe.iI.filter(noA0)];
		var outputs = [...recipe.fO.filter(noA0),...recipe.iO.filter(noA0)];

		if (inputs.length >= 1) {
			input_elem.val(inputs[0].a);
		} else {
			input_elem.val("1");
		}
		if (outputs.length >= 1) {
			output_elem.val(outputs[0].a);
		} else {
			output_elem.val("1");
		}

		collapse.collapse("show");
		doCalc();
	}

	function onSettingsInput() {
		if (settings_input.val() != "") {
			var jsonObj = null;

			try {
				jsonObj = JSON.parse(settings_input.val());
			} catch (e) {
				alert("Invalid json object. Error: " + e);
				return;
			}

			energy_elem.val(jsonObj.energy);
			amps_elem.val(jsonObj.amps);

			var target = jsonObj.target;
			if (typeof voltage_tiers[target] != "undefined") {
				$(".voltage-buttons[data-id='gt-overclock-target'] input[value="+target+"]",card).click();
			} else {
				$(".voltage-buttons[data-id='gt-overclock-target'] input[value='custom']",card).click();
				$("#gt-overclock-target-custom",card).val(target);
			}

			var poc = jsonObj.poc;
			if (poc == "no") {$("#gt-overclock-perfectoc-0",card).click();}
			else if (poc == "semi") {$("#gt-overclock-perfectoc-1",card).click();}
			else if (poc == "perfect") {$("#gt-overclock-perfectoc-2",card).click();}

			output_elem.val(jsonObj.output);
			time_elem.val(jsonObj.time);
			time_check.attr("checked", jsonObj.in_ticks);
			input_elem.val(jsonObj.input);
			wanted_elem.val(jsonObj.wanted);
			wanted_check.attr("checked",jsonObj.wanted_1OX);

			$("#gt-overclock-gtppmachine",card).val(jsonObj.gtpp_machine);
			time_bonus.val(jsonObj.time_bonus);
			energy_bonus.val(jsonObj.energy_bonus);
			parallels.val(jsonObj.parallels_per_tier);

			batch_mode = jsonObj.batch_mode;
			$("#gt-overclock-batch",card).attr("checked",batch_mode);
			uev_simulate = jsonObj.downtier_uev;
			$("#gt-overclock-uev-simulate",card).attr("checked",uev_simulate);

			$("> .collapse", card).collapse("show");
		}
	}

	settings_input.on("input",onSettingsInput)
	.click((e) => {
		settings_input.select();
		e.stopPropagation();
	});
});