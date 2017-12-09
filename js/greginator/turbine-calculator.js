(function() {
	var card = $( "#turbine-calculator-card" );

	var header = $( ".card-header", card );
	header.addClass( "link-pointer" );
	var collapse = $( ".collapse", card );

	var initialized = false;
	var turbine_blades;
	var turbine_fuels;
	var enderio_conduits;
	var translocators;
	var gregtech_pipes;
	var gregtech_pumps;
	var boilers;
	var dynamos;

	function init(b) {
		if (!b) {collapse.collapse("toggle");}

		if (!initialized) {
			initialized = true;
			turbine_blades = data.get("turbine blades");
			turbine_fuels = data.get("turbine fuels");
			enderio_conduits = data.get("ender io conduits");
			translocators = data.get("fluid translocators");
			gregtech_pipes = data.get("gregtech pipes");
			gregtech_pumps = data.get("gregtech pumps");
			boilers = data.get("boilers");
			dynamos = data.get("dynamo hatches");
			initialize();
		}
	}
	header.click(function() {init();});
	if (collapse.hasClass("show")) {init(true);}

	var selected_material;
	var selected_fuel;
	var selected_size = "large";

	function formatTime(time) {
		var timestr = [];
		var time_years = Math.floor(time / 31556926);
		if (time_years > 0) {time = time % 31556926; timestr.push(time_years + " years");}
		var time_months = Math.floor(time / 2629744);
		if (time_months > 0) {time = time % 2629744; timestr.push(time_months + " months");}
		var time_days = Math.floor(time / 86400);
		if (time_days > 0) {time = time % 86400; timestr.push(time_days + " days");}
		var time_hours = Math.floor(time / 3600);
		if (time_hours > 0) {time = time % 3600; timestr.push(time_hours + " hours");}
		var time_minutes = Math.floor(time / 60);
		if (time_minutes > 0) {time = time % 60; timestr.push(time_minutes + " minutes");}
		if (time > 0) {timestr.push(Math.ceil(time) + " seconds");}
		return timestr.join(", ");
	}

	function getMaterialByName(name) {
		for(var i=0;i<turbine_blades.length;i++) {
			if (escapehtml(turbine_blades[i].material) == name) {
				return turbine_blades[i];
			}
		}
	}
	function getFuelByName(name) {
		for(var i=0;i<turbine_fuels.length;i++) {
			for(var j=0;j<turbine_fuels[i].fuels.length;j++) {
				if (escapehtml(turbine_fuels[i].fuels[j].name) == name) {
					var fuel = turbine_fuels[i].fuels[j];

					if (typeof fuel.multiplier == "undefined") {
						fuel.multiplier = turbine_fuels[i].multiplier;
					}

					if (typeof fuel.category == "undefined") {
						fuel.category = turbine_fuels[i].name;
					}

					return fuel;
				}
			}
		}
	}

	function displayMaterialStats() {
		var material_stats = $( ".material-stats", card );
		material_stats.empty();

		if (typeof selected_material == "undefined") {
			material_stats.hide();
			return;
		}
		material_stats.show();

		var tbl = $( "<table class='table table-bordered table-hover material-stats'>" );
		var thead = $( "<thead>" ).appendTo(tbl);
		var tbody = $( "<tbody>" ).appendTo(tbl);
		$("<tr>").append([
			"<th></th>",
			"<th>Durability</th>",
			"<th>Efficiency</th>",
			"<th>Flow</th>"
		]).appendTo(thead);

		function displayStats(size,obj) {
			var sizetext = size.substr(0,1).toUpperCase()+size.substr(1);
			var tr = $("<tr>").append([
				"<th>"+sizetext+"</th>",
				"<td>"+obj.durability.toLocaleString()+"</td>",
				"<td>"+obj.efficiency+"%</td>",
				"<td>"+obj.flow.toLocaleString()+"</td>"
			]).appendTo(tbody).addClass( "link-pointer" ).attr( "data-size", size );

			if (selected_size == size) {
				tr.addClass( "table-active" );
			}
		}

		displayStats("huge",selected_material.huge);
		displayStats("large",selected_material.large);
		displayStats("medium",selected_material.medium);
		displayStats("small",selected_material.small);

		material_stats.append(tbl);
	}

	function calculateStats(fuel,material) {
		var nominal_output = Math.floor(material.flow / 20 * fuel.multiplier);
		var optimal_flow = 0; 

		if (fuel.category == "Plasma") {
			optimal_flow = Math.ceil(nominal_output / fuel.fuel_value);
		} else {
			optimal_flow = Math.floor(nominal_output / fuel.fuel_value);
		}

		var energy_output = Math.floor(optimal_flow * fuel.fuel_value * (material.efficiency/100));

		return {
			nominal_output:nominal_output,
			optimal_flow:optimal_flow,
			energy_output:energy_output
		}
	}

	function checkIC2Regulator(stats) {
		var is = stats.optimal_flow <= 1000;

		var res_str = "Is compatible.";
		if (!is) {
			var amount_needed = Math.ceil(stats.optimal_flow/1000);
			res_str = "Not compatible (You'd need " + amount_needed + " of them).";
		}

		return "<td>"+res_str+"</td><td>"+(is ? 0 : (stats.optimal_flow-1000))+ " mb/t remaining</td>";
	}
	function checkEnderIOPipes(stats) {
		var remaining = stats.optimal_flow;
		var result = [];
		for(var i=enderio_conduits.length-1;i>=0;i--) {
			var conduit = enderio_conduits[i];
			var speed = conduit.max_input;
			if (speed <= remaining) {
				var amount = Math.floor(remaining / speed);
				remaining = remaining % speed;
				result.push(amount + " x " + escapehtml(conduit.name));
			}

			if (remaining == 0) {break;}
		}

		var result = result.join(", ");
		if (result == "") {result = "Not compatible.";}

		return "<td>"+result+"</td><td>"+remaining + " mb/t remaining</td>";
	}
	function checkTranslocators(stats) {
		var max_input = translocators[0].max_input;

		var transfer_with = translocators[1].max_extract;
		var transfer_without = translocators[0].max_extract;

		if (stats.optimal_flow < transfer_without) {
			return "<td>Not compatible.</td><td>"+stats.optimal_flow + " mb/t remaining</td>";
		}

		var amount_with = Math.floor(stats.optimal_flow / transfer_with);
		var amount_without = Math.floor((stats.optimal_flow % transfer_with) / transfer_without);
		return "<td>" + amount_with + " with glowstone + " + amount_without + " without.</td><td>"+(stats.optimal_flow % transfer_without) + " mb/t remaining.</td>";
	}
	function checkGregtechPipes(stats) {
		var names = ["Tiny ","Small ","","Large ","Huge "]
		var multipliers = [1,2,6,12,24];

		var closest_pipe_remainder = 999999;
		var closest_pipe;
		var closest_capacity;
		var cheapest_pipe;
		var cheapest_capacity;

		for(var i=0;i<gregtech_pipes.length;i++) {
			var pipe = gregtech_pipes[i];
			for(var j=0;j<5;j++) {
				var capacity = pipe.capacity * multipliers[j];
				if (typeof cheapest_pipe == "undefined" && capacity >= stats.optimal_flow) {
					cheapest_pipe = pipe;
					cheapest_capacity = j;
				}

				if (capacity >= stats.optimal_flow) {
					var amount = Math.floor(capacity / stats.optimal_flow);
					if (amount == 1) {
						var remainder = capacity % stats.optimal_flow;
						if (remainder < closest_pipe_remainder) {
							closest_pipe_remainder = remainder;
							closest_pipe = pipe;
							closest_capacity = j;
						}
					}
				}
			}
		}

		var ret1 = [];
		var ret2 = [];
		if (typeof cheapest_pipe != "undefined") {
			ret1.push("Cheapest: "+names[cheapest_capacity]+escapehtml(cheapest_pipe.material)+" ("+(cheapest_pipe.capacity * multipliers[cheapest_capacity])+" mb/t)");
			ret2.push(((cheapest_pipe.capacity * multipliers[cheapest_capacity]) % stats.optimal_flow) + " mb/t remaining");
		}

		if (typeof closest_pipe != "undefined") {
			ret1.push("Closest: " + names[closest_capacity] + escapehtml(closest_pipe.material)+" ("+(closest_pipe.capacity * multipliers[closest_capacity])+" mb/t)");
			ret2.push(((closest_pipe.capacity * multipliers[closest_capacity]) % stats.optimal_flow) + " mb/t remaining");
		}

		if (ret1.length == 0) {
			return "<td>Not compatible.</td><td></td>";
		} else {
			return "<td>"+ret1.join("<br>")+"</td><td>"+ret2.join("<br>")+"</td>";
		}

	}
	function checkGregtechPumps(stats) {
		var remaining = stats.optimal_flow;
		var result = [];
		for(var i=gregtech_pumps.length-1;i>=0;i--) {
			var pump = gregtech_pumps[i];
			var speed = pump.speed;
			if (speed <= remaining) {
				var amount = Math.floor(remaining / speed);
				remaining = remaining % speed;
				result.push(amount + " x " + escapehtml(pump.name));
			}

			if (remaining == 0) {break;}
		}

		var result = result.join(", ");
		if (result == "") {result = "Not compatible.";}

		return "<td>"+result+"</td><td>"+remaining + " mb/t remaining</td>";
	}
	function lowestCommonDenominator(larger,smaller) {
		if (larger < smaller) {
			let temp = larger;
			larger = smaller;
			smaller = temp;
		}
		larger = Math.floor(larger);
		smaller = Math.floor(smaller);

		var iters = 1000;
		while(iters>0) {
			if (larger == smaller) {return larger;}
			var remainder = larger % smaller;
			if (remainder == 0) {return smaller;}

			larger = smaller;
			smaller = remainder;

			iters--;
		}

		return -1;
	}
	function checkBoilers(stats) {
		var LCD = lowestCommonDenominator()

		var optimal_boiler;
		var optimal_LCD_boiler_count = 99999;
		var optimal_LCD_turbine_count = 99999;
		var optimal_LCD_boiler;
		for(var i=0;i<boilers.length;i++) {
			var boiler = boilers[i];
			if (typeof optimal_boiler == "undefined" && boiler.output >= stats.optimal_flow) {
				optimal_boiler = boiler;
			}

			var LCD = lowestCommonDenominator(boiler.output,stats.optimal_flow);
			var LCD_boiler_count = boiler.output / LCD;
			var LCD_turbine_count = stats.optimal_flow / LCD;
			if (LCD != -1 && (LCD_boiler_count+LCD_turbine_count < optimal_LCD_boiler_count+optimal_LCD_turbine_count)) {
				optimal_LCD_turbine_count = LCD_boiler_count;
				optimal_LCD_boiler_count = LCD_turbine_count;
				optimal_LCD_boiler = boiler;
			}
		}

		var ret = "";

		if (typeof optimal_boiler != "undefined") {
			ret = "You'll need at least one " + escapehtml(optimal_boiler.name) + " (" + optimal_boiler.output + " mb/t) to keep up with this turbine blade.";
		} else {
			var max_boiler = boilers[boilers.length-1];
			var amount = Math.ceil(stats.optimal_flow / max_boiler.output);
			ret = "You'd need <strong>" + amount + "</strong> " + escapehtml(max_boiler.name) + "s to keep up with this turbine blade.";
		}

		if (typeof optimal_LCD_boiler != "undefined") {
			ret += "<br>You'll need <strong>" + optimal_LCD_boiler_count + "</strong> " + optimal_LCD_boiler.name + "(s) and <strong>" + optimal_LCD_turbine_count + "</strong> turbine(s) to exactly match production with consumption.";
		}

		return ret;
	}
	function checkHeatExchanger(stats,fuel) {
		/*
			Large heat exchanger can produce:
			With lava:
			Max normal steam: ((999 * 4) * 2) = 7992 mb/t
			Max superheated: (((2000 * 4) * 2) / 2) = 8000 mb/t

			With IC2 coolant:
			Max normal steam: ((3999 * 2) * 2) = 15996 mb/t
			Max superheated: (((8000 * 2) * 2) / 2) = 16000 mb/t
		*/

		var max_produced_lava = 0;
		var max_produced_coolant = 0;

		var max_consumed_lava = 0;
		var max_consumed_coolant = 0;
		if (fuel.name == "Steam") {
			max_produced_lava = 7992;
			max_produced_coolant = 15996;

			max_consumed_lava = 999 / 20;
			max_consumed_coolant = 3999 / 20;
		} else { // superheated steam
			max_produced_lava = 8000;
			max_produced_coolant = 16000;

			max_consumed_lava = 2000 / 20;
			max_consumed_coolant = 8000 / 20;
		}

		var amount_lava = Math.ceil(max_produced_lava / stats.optimal_flow);
		var amount_coolant = Math.ceil(max_produced_coolant / stats.optimal_flow);

		return "<p>If you use lava, you'll need <strong>"+amount_lava+"</strong> turbines to keep up with a single heat exchanger running at max speed"+
						" (uses "+max_consumed_lava+" mb/t of lava to produce "+max_produced_lava+" mb/t of "+escapehtml(fuel.name)+").<br>"+
				"If you use IC2 coolant, you'll need <strong>"+amount_coolant+"</strong> turbines to keep up with a single heat exchanger running at max speed"+
						" (uses "+max_consumed_coolant+" mb/t of coolant to produce "+max_produced_coolant+" mb/t of "+escapehtml(fuel.name)+").</p>";
	}
	function checkDynamos(stats) {
		for(i=0;i<dynamos.length;i++) {
			if (dynamos[i].output >= stats.energy_output) {
				return "<strong>"+dynamos[i].name + "</strong> (" + dynamos[i].output + " eu/t)";
			}
		}

		return "wut? couldn't find a dynamo hatch???";
	}

	function displayFuelStats() {
		var fuel_stats = $( ".fuel-stats", card );
		fuel_stats.empty();

		if (typeof selected_material == "undefined" || typeof selected_fuel == "undefined") {
			fuel_stats.hide();
			return;
		}
		fuel_stats.show();

		// init subpanels
		var stats_container = $( "<div class='card-body'>" );

		function update() {
			var stats = calculateStats(selected_fuel,selected_material[selected_size]);

			var steam_stats = "";
			if (selected_fuel.name == "Steam") {
				steam_stats = 
					"<h5>Boiler stats</h5>"+
					"<p>"+checkBoilers(stats,selected_fuel)+"</p>";
			}

			if (selected_fuel.name == "Steam" || selected_fuel.name == "Superheated Steam") {
				steam_stats += 
					"<h5>Heat exchanger stats</h5>"+
					"<p>"+checkHeatExchanger(stats,selected_fuel)+"</p>";
			}

			var durability_time = 0;
			if (selected_fuel.name.indexOf("Plasma") != -1) {
				// durability for plasma is ((eu)^0.7)/t
				durability_time = selected_material[selected_size].durability / (((stats.energy_output ^ 0.7) / 3000)*20);
			} else {
				// durability for non-plasma is 20% of energy output every 3000 ticks
				durability_time = selected_material[selected_size].durability / ((stats.energy_output * 0.2 / 3000)*20);
			}
			durability_time = formatTime(durability_time);

			stats_container.empty();
			stats_container.append([
				"<h5>Stats</h5>",
				"<p>Optimal flow: <strong>" + stats.optimal_flow + "</strong> mb/t<br>"+
				"Power output: <strong>" + stats.energy_output + "</strong> eu/t<br>"+
				"Time until destroyed: Approximately <strong>" + durability_time + "</strong><br>"+
				"Required dynamo hatch: " + checkDynamos(stats) + "</p>",
				steam_stats
			]);

			transfer_table.empty();

			// Check if IC2 regulator works
			transfer_table.append( "<tr><th>IC2 Fluid Regulator</th>" + checkIC2Regulator(stats));
			// Check Ender IO pipes
			transfer_table.append( "<tr><th>Ender IO conduits</th>" + checkEnderIOPipes(stats) );
			// Check transfer nodes
			transfer_table.append( "<tr><th>Translocators</th>" + checkTranslocators(stats) );
			// Check gregtech pumps
			transfer_table.append( "<tr><th>Gregtech Pumps</th>" + checkGregtechPumps(stats) );
			// Check gregtech pipes
			transfer_table.append( "<tr><th>Gregtech Pipes</th>" + checkGregtechPipes(stats) );

			// Bedrockium drum stats
			var stored = 65536000;
			var time = Math.floor(stored / stats.optimal_flow / 20);
			var timestr = formatTime(time);

			var total_eu = Math.floor(stored / stats.optimal_flow * stats.energy_output).toLocaleString();

			bedrockium_drum_container.empty();
			bedrockium_drum_container.append([
				"<h5>Bedrockium drum stats</h5>",
				"<p>Time to empty bedrockium drum: " + timestr + "<br>"+
				"Total EU stored in bedrockium drum: " + total_eu + " EU</p>"
			]);
		}

		var transfer_container = $( "<div class='card-body'>" );
		var transfer_table = $( "<table class='table table-bordered transfer-table'>" );
		transfer_container.append([
			"<h5>Optimal transfer methods</h5>",
			transfer_table,
		]);

		var bedrockium_drum_container = $( "<div class='card-body'>" );

		fuel_stats.append([
			stats_container,
			"<hr>",
			transfer_container,
			"<hr>",
			bedrockium_drum_container,
			//"<hr>",
			//other
		]);

		// Select size
		$( ".material-stats tbody tr", card ).off( "click.fuelstats" ).on( "click.fuelstats",function() {
			selected_size = $(this).attr( "data-size" );
			$( "tr",$(this).parent() ).removeClass( "table-active" );
			$(this).addClass( "table-active" );
			update();
		});

		update();
	}

	function initialize() {
		var material_search = $( ".material-search", card );

		function buildTbl(name,v1,v2,v3) {
			var w1 = "200px";
			if (name == "Material") {w1 = "235px; padding-left:40px;";} // Special case

			return "<table><tr>"+
						"<td style=\"width:"+w1+"\">"+name+"</td>"+
						"<td style=\"width:80px\"><small class=\"text-muted\">"+v1+"</small></td>"+
						"<td style=\"width:70px\"><small class=\"text-muted\">"+v2+"</small></td>"+
						"<td style=\"width:50px\"><small class=\"text-muted\">"+v3+"</small></td>"+
					"</tr></table>";
		}

		var opt1 = "<option value='-' disabled selected>Select material...</option>";
		var opt2 = "<option value='-' disabled data-content='"+buildTbl("Material","Durability","Efficiency","Flow (of large blade)")+"'></option>";

		turbine_blades.sort(function(a,b) {
			if (a.large.durability == b.large.durability) {return 0;}
			return a.large.durability < b.large.durability ? 1 : -1;
		});

		var great = $( "<optgroup label='Great'>" );
		var acceptable = $( "<optgroup label='Acceptable'>" );
		var garbage = $( "<optgroup label='Garbage'>" );

		for(var i=0;i<turbine_blades.length;i++) {
			var blade = turbine_blades[i];
			var name = escapehtml(blade.material);
			var dur = blade.large.durability.toLocaleString();
			var eff = blade.large.efficiency + "%";
			var flow = blade.large.flow.toLocaleString();

			var fun_fact = "";
			if (typeof blade.fun_fact != "undefined") {
				fun_fact = " (" + blade.fun_fact + ")";
			}

			var prnt = garbage;
			if (typeof blade.category != "undefined") {
				if (blade.category == "great") {prnt = great;}
				else if (blade.category == "acceptable") {prnt = acceptable;}
			}

			prnt.append("<option value='"+name+"' data-content='"+buildTbl(name,dur,eff,flow + fun_fact)+"'>"+name+"</option>" );
		}
		material_search.append([opt1,opt2,great,acceptable,garbage]);
		material_search.selectpicker({liveSearch:true,maxOptions:1});

		var fuel_search = $( ".fuel-search", card );

		var opts = [];
		opts.push("<option value='-' disabled selected>Select fuel...</option>");
		for(var i=0;i<turbine_fuels.length;i++) {
			var category = turbine_fuels[i];

			var cat = $( "<optgroup label='" + escapehtml(category.name) + "'></optgroup>" );
			for(var j=0;j<category.fuels.length;j++) {
				var fuel = category.fuels[j];
				var name = escapehtml(fuel.name);
				var f = fuel.fuel_value

				$("<option value='"+name+"' data-subtext='"+f+"'>"+name+"</option>").appendTo(cat);
			}
			opts.push(cat);
		}
		fuel_search.append(opts);
		fuel_search.selectpicker({liveSearch:true,maxOptions:1,showSubtext:true});

		material_search.on( "changed.bs.select", function() {
			selected_material = getMaterialByName(material_search.val());

			displayMaterialStats();
			displayFuelStats();
			$(window).off('resize.getSize scroll.getSize');
		});

		fuel_search.on( "changed.bs.select", function() {
			selected_fuel = getFuelByName(fuel_search.val());

			displayFuelStats();
			$(window).off('resize.getSize scroll.getSize');
		});
	}
})();
