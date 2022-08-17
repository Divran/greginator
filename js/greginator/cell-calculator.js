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

			if (!isNaN(amounts.recipe_amount) && !isNaN(amounts.cell_size)) {
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
		if (lcm_list.length > 0 && 
			values.inputs.filter(v=>v.is_item==false).length > 0 && 
			values.outputs.filter(v=>v.is_item==false).length > 0) {
			var lcm_value = lcm_list.reduce(lcm);

			values.outputs.sort((a,b) => a.recipe_amount-b.recipe_amount);
			var smallest_output = values.outputs.filter(v=>v.is_item==false)[0];
			var output_mult = lcm_value / smallest_output.recipe_amount;

			values.inputs.map((v) => {
				var total_fluid = v.recipe_amount * output_mult;
				$(".num-cells",v.elem).text("" + (total_fluid / v.cell_size));
				$(".num-fluid",v.elem).text(total_fluid + " mb");
				$(".num-cells-title",v.elem).text(v.is_item ? "Items" : "Cells");
			});
			values.outputs.map((v) => {
				var total_fluid = v.recipe_amount * output_mult;
				$(".num-cells",v.elem).text("" + (total_fluid / v.cell_size));
				$(".num-fluid",v.elem).text(total_fluid + " mb");
				$(".num-cells-title",v.elem).text(v.is_item ? "Items" : "Cells");
			});
			
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


		$(".close",clone).click(()=>clone.remove());
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
		}
	});

});