onVersionChanged(function(version) {
	var card = $( "#gt-cell-calculator" );

	var header = $( ".card-header", card );
	header.addClass( "link-pointer" );
	var collapse = $( ".collapse", card );

	header.off("click");
	header.on("click",function() {
		collapse.collapse( "toggle" );
	});

	var inputs = $(".inputs",card);
	var outputs = $(".outputs",card);

	var add_input = $(".add-input", card);
	var add_output = $(".add-output", card);
	var new_item = $(".new-item", card);
	var settings_input = $(".settings-input", card);

	// https://stackoverflow.com/a/49722579
	var gcd = (a, b) => {return a ? gcd(b % a, a) : b;}
	var lcm = (a, b) => {return a * b / gcd(a, b);}
	// to use: [N1, N2, N3, ...].reduce(lcm)


	function doMath() {
		var settings = {
			inputs:[],
			outputs:[]
		};

		function getAmounts(elem, values_tbl) {
			var recipe_amount = parseInt($(".recipe-amount",elem).val());
			var cell_size = NaN;
			var is_item = false;

			settings[values_tbl].push({
				amount: $(".recipe-amount",elem).val(),
				cell_size: $("select.cell-search", elem).val()
			});

			if ($("select.cell-search", elem).val() == "item") {
				cell_size = 1;
				is_item = true;
			} else {
				cell_size = parseInt($("select.cell-search", elem).val());
			}

			return {
				recipe_amount: recipe_amount,
				cell_size: cell_size,
				elem: elem,
				is_item: is_item
			};
		}

		var lcm_list = {};

		var values = {
			inputs:[],
			outputs:[],
		};

		function fEach(that, values_tbl) {
			var amounts = getAmounts($(that), values_tbl);

			if (!isNaN(amounts.recipe_amount) && !isNaN(amounts.cell_size) && 
				amounts.recipe_amount > 0 && amounts.cell_size > 0) {
				if (amounts.is_item == false) {
					lcm_list[amounts.recipe_amount] = true;
					lcm_list[amounts.cell_size] = true;	
				}

				values[values_tbl].push(amounts);
			}
		}

		inputs.children().each((k,v) => fEach(v,"inputs"));
		outputs.children().each((k,v) => fEach(v,"outputs"));

		settings_input.val(JSON.stringify(settings));

		lcm_list = Object.keys(lcm_list);
		if (lcm_list.length > 1 && 
			values.inputs.length > 0 && 
			values.outputs.length > 0) {
			var lcm_value = lcm_list.reduce(lcm);
			//console.log("lcm_list:",lcm_list);
			//console.log("lcm_value:",lcm_value);

			values.outputs.sort((a,b) => a.recipe_amount-b.recipe_amount);
			var smallest_output = values.outputs.filter(v=>v.is_item==false)[0];
			if (smallest_output == null) smallest_output = values.inputs.filter(v=>v.is_item==false)[0];
			var output_mult = lcm_value / smallest_output.recipe_amount;
			//console.log("output_mult:",output_mult);

			var biggest_cell = Math.max(
				values.inputs.reduce((a,b) => Math.max(a,b.cell_size), 0),
				values.outputs.reduce((a,b) => Math.max(a,b.cell_size), 0)
			)
			var smallest_cell = Math.min(
				values.inputs.reduce((a,b) => Math.min(a,b.cell_size), 512000),
				values.outputs.reduce((a,b) => Math.min(a,b.cell_size), 512000)
			)

			// reduce down to smallest multiplier
			while(
				(output_mult % 2) == 0 &&
				output_mult > (biggest_cell / smallest_cell) &&
				values.inputs.every(v => v.is_item || ((v.recipe_amount * (output_mult/2)) % v.cell_size) == 0) &&
				values.outputs.every(v => v.is_item || ((v.recipe_amount * (output_mult/2)) % v.cell_size) == 0)
			) {
				output_mult /= 2;
			}
			//console.log("output_mult after reduce:",output_mult);

			// increment up in case any are below 1
			var infloop = 10;
			var original = output_mult;
			var fractionConverter = [1,10,5,10,5,2,5,10,5,10];
			do {
				infloop--;
				if (infloop<0) {
					alert("Unable to resolve all issues");
					output_mult = original;
					break;
				}
				var inp = values.inputs.find(v => !v.is_item && ((v.recipe_amount * output_mult) % v.cell_size) != 0);
				if (inp) {
					var fraction = Math.floor((((inp.recipe_amount * output_mult) / inp.cell_size) % 1) * 10);
					output_mult *= fractionConverter[fraction] || 1;
					//console.log("change",fractionConverter[fraction] || 1);
					//console.log("mult",output_mult);
					//output_mult *= inp.cell_size / ((inp.recipe_amount * output_mult) % inp.cell_size);
					continue;
				}
				var out = values.outputs.find(v => !v.is_item && ((v.recipe_amount * output_mult) % v.cell_size) != 0);
				if (out) {
					var fraction = Math.floor((((out.recipe_amount * output_mult) / out.cell_size) % 1) * 10);
					output_mult *= fractionConverter[fraction] || 1;
					//console.log("change",out.cell_size / ((out.recipe_amount * output_mult) % out.cell_size));
					//console.log("mult",output_mult);
					//output_mult *= out.cell_size / ((out.recipe_amount * output_mult) % out.cell_size);
					continue;
				}
			} while (inp != null || out != null);
			//console.log("output_mult after inc:",output_mult);

			// display results
			function doMap(v) {
				var total_fluid = v.recipe_amount * output_mult;
				var total_amount = (total_fluid / v.cell_size);

				// nr of cells/items
				$(".num-cells",v.elem).text("" + total_amount);
				$(".num-cells-title",v.elem).text(v.is_item ? "Items" : "Cells");

				// generate stack size info
				var stack_text = [];
				var stack_title = [];
				if (total_amount > 64) {
					stack_text.push("" + Math.floor(total_amount/64));
					stack_text.push(" (" + (total_amount%64) + ")");
					stack_title.push("Nr of 64 (Remainder)");
				}
				if (total_amount > 127) {
					stack_text.push(" / " + Math.floor(total_amount/127));
					stack_text.push(" (" + (total_amount%127) + ")");
					stack_title.push(" / Nr of 127 (Remainder)");
				}
				if (stack_text.length > 0) {
					$(".num-stacks-row",v.elem).show().attr("title", stack_title.join(""));
					$(".num-stacks",v.elem).text(stack_text.join(""));
				} else {
					$(".num-stacks-row",v.elem).hide();
				}

				// total amount of fluid
				$(".num-fluid-row",v.elem)[v.is_item ? "hide" : "show"]();
				$(".num-fluid",v.elem).text(total_fluid + " mb");
			}

			values.inputs.map(doMap);
			values.outputs.map(doMap);
			
			$(".cell-info",card).hide();
		} else {
			$(".cell-info",card).show();
		}
	}

	function addCustomOption(parent, elem, val) {
		var opt = $("<option class='custom'>");
		opt.attr("value",val);
		opt.text("Custom");
		opt.attr("data-subtext",val + " mb");
		$("select.cell-search", parent).append(opt);
		elem.val(val);
		elem.selectpicker("refresh");
		elem.selectpicker("toggle");
	}

	function makeClone() {
		var clone = new_item.clone();
		clone.show();
		clone.removeClass("new-item");

		// Search
		var search = $(".cell-search",clone);
		search.selectpicker({liveSearch:true,maxOptions:1,showSubtext:true});
		var searchContainer = $("div.cell-search",clone);

		search.on("show.bs.select",() => {
			$(".custom",clone).remove();
			doMath();
		});
		search.on("changed.bs.select",() => {
			doMath();
		});
		$(".cell-search input",clone).keydown((e) => {
			setTimeout(()=> {
				if (e.which == 13 && $(".no-results",searchContainer).length>0) {
					var val = $("input",searchContainer).val();
					addCustomOption(clone, search, val);
				}
			},0);
		}).attr("placeholder","Press enter for custom");
		
		// Amount
		$(".recipe-amount", clone).on("input",() => {
			doMath();
		});


		$(".close",clone).click(()=>{
			clone.remove()
			doMath();
		});
		return clone;
	}

	add_input.click(() => {
		var clone = makeClone();
		inputs.append(clone);
		doMath()
	});
	add_output.click(() => {
		var clone = makeClone();
		outputs.append(clone);
		doMath();
	});

	settings_input.click((e) => {
		e.preventDefault();
		e.stopPropagation();
	});

	settings_input.on("input",() => {
		if (settings_input.val() != "") {
			var jsonObj = null;

			try {
				jsonObj = JSON.parse(settings_input.val());
			} catch (e) {
				alert("Invalid json object. Error: " + e);
				return;
			}

			function doAdd(parent, v) {
				var clone = makeClone();
				parent.append(clone);

				if ($("select.cell-search option[value=\"" + v.cell_size + "\"]",clone).length==0) {
					addCustomOption(clone, $("select.cell-search",clone), v.cell_size);
				} else {
					$("select.cell-search", clone).val(v.cell_size);
					setTimeout(() => {
						$("select.cell-search", clone).selectpicker("refresh");
					},0);
				}

				$(".recipe-amount", clone).val(v.amount);
			}

			inputs.empty();
			outputs.empty();

			jsonObj.inputs.map(v => {
				doAdd(inputs, v);
			});
			jsonObj.outputs.map(v => {
				doAdd(outputs, v);
			});

			doMath();
			collapse.collapse("show");
		}
	}).click(() => {
		settings_input.select();
	});

});