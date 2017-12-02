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
			initialize();
		}
	}
	header.click(function() {init();});
	if (collapse.hasClass("show")) {init(true);}

	var selected_material;
	var selected_fuel;
	var selected_size = "large";

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

		var tbl = $( "<table class='table table-bordered table-hover'>" );
		$("<tr>").append([
			"<th></th>",
			"<th>Durability</th>",
			"<th>Efficiency</th>",
			"<th>Flow</th>"
		]).appendTo(tbl);

		function displayStats(what,obj) {
			$("<tr>").append([
				"<th>"+what+"</th>",
				"<td>"+obj.durability+"</td>",
				"<td>"+obj.efficiency+"%</td>",
				"<td>"+obj.flow+"</td>"
			]).appendTo(tbl);
		}

		displayStats("Huge",selected_material.huge);
		displayStats("Large",selected_material.large);
		displayStats("Medium",selected_material.medium);
		displayStats("Small",selected_material.small);

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
		return "<td>"+(stats.optimal_flow <= 1000 ? "Is compatible." : "Not compatible.")+"</td><td></td>";
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
			return "<td>Not compatible.</td><td></td>";
		}

		var amount_with = Math.floor(stats.optimal_flow / transfer_with);
		var amount_without = Math.floor((stats.optimal_flow % transfer_with) / transfer_without);
		return "<td>" + amount_with + " with glowstone + " + amount_without + " without.</td><td>"+(stats.optimal_flow % transfer_without) + " mb/t remaining.</td>";
	}
	function checkGregtechPipes(stats) {
		var names = ["Tiny","Small","","Large","Huge"]
		var multipliers = [1,2,6,12,24];

		for(var i=0;i<gregtech_pipes.length;i++) {
			var pipe = gregtech_pipes[i];
			for(var j=0;j<5;j++) {
				var capacity = pipe.capacity * multipliers[j];
				if (capacity >= stats.optimal_flow) {
					return "<td>Needs minimum '" + names[j] + " " + escapehtml(pipe.material) + " Fluid Pipe' (" + capacity + " mb/t capacity)</td><td></td>";
				}
			}
		}

		return "<td>Not compatible.</td><td></td>";
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
			//console.log(stats);

			stats_container.empty();
			stats_container.append([
				"<h5>Stats</h5>",
				"<p>Optimal flow: " + stats.optimal_flow + " mb/t<br>Power output: " + stats.energy_output + " eu/t</p>",
			]);

			transfer_table.empty();

			// Check if IC2 regulator works
			transfer_table.append( "<tr><td>IC2 Fluid Regulator</td>" + checkIC2Regulator(stats));
			// Check Ender IO pipes
			transfer_table.append( "<tr><td>Ender IO conduits</td>" + checkEnderIOPipes(stats) );
			// Check transfer nodes
			transfer_table.append( "<tr><td>Translocators</td>" + checkTranslocators(stats) );
			// Check gregtech pumps
			transfer_table.append( "<tr><td>Gregtech Pumps</td>" + checkGregtechPumps(stats) );
			// Check gregtech pipes
			transfer_table.append( "<tr><td>Gregtech Pipes</td>" + checkGregtechPipes(stats) );

			// Bedrockium drum stats
			var stored = 65536000;
			var time = Math.floor(stored / stats.optimal_flow / 20);

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
			timestr = timestr.join(", ");

			var total_eu = Math.floor(stored / stats.optimal_flow * stats.energy_output).toLocaleString();

			bedrockium_drum_container.empty();
			bedrockium_drum_container.append([
				"<h5>Bedrockium drum stats</h5>",
				"<p>Time to empty bedrockium drum: " + timestr + "<br>"+
				"Total EU stored in bedrockium drum: " + total_eu + " EU</p>"
			]);
		}

		var size_selector = $( "<select class='form-control'></select>" );
		var sizes = ["small","medium","large","huge"];
		for(i=0;i<sizes.length;i++) {
			var selected = "";
			if (selected_size == sizes[i]) {selected = "selected";}
			var name = sizes[i];
			name = name.substr(0,1).toUpperCase() + name.substr(1);
			size_selector.append("<option value='"+sizes[i]+"' "+selected+">"+name+"</option>");
		}
		size_selector.on("changed.bs.select",function() {
			selected_size = size_selector.val();
			update();
		});

		var transfer_container = $( "<div class='card-body'>" );
		var transfer_table = $( "<table class='table table-bordered transfer-table'>" );
		transfer_container.append([
			"<h5>Optimal transfer methods</h5>",
			transfer_table,
		]);

		var bedrockium_drum_container = $( "<div class='card-body'>" );

		fuel_stats.append([
			size_selector,
			stats_container,
			"<hr>",
			transfer_container,
			"<hr>",
			bedrockium_drum_container,
			//"<hr>",
			//other
		]);
		
		size_selector.selectpicker({maxOptions:1});

		update();
	}

	function initialize() {
		var material_search = $( ".material-search", card );

		var opts = [];
		opts.push("<option value='-' disabled selected>Select material...</option>");
		for(var i=0;i<turbine_blades.length;i++) {
			var name = escapehtml(turbine_blades[i].material);
			opts.push("<option value='"+name+"'>"+name+"</option>" );
		}
		material_search.append(opts);
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

				$("<option value='"+name+"'>"+name+"</option>").appendTo(cat);
			}
			opts.push(cat);
		}
		fuel_search.append(opts);
		fuel_search.selectpicker({liveSearch:true,maxOptions:1});

		material_search.on( "changed.bs.select", function() {
			selected_material = getMaterialByName(material_search.val());

			displayMaterialStats();
			displayFuelStats();
		});

		fuel_search.on( "changed.bs.select", function() {
			selected_fuel = getFuelByName(fuel_search.val());

			displayFuelStats();
		});
	}
})();
