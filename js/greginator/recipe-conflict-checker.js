onVersionChanged(function(version) {
	var card = $( "#gt-recipe-conflict-checker" );
	if (version != "gtnh") {
		card.hide();
		return;
	} else {
		card.show();
	}

	if (window.recipeConflictCheckerInitialized) return;
	window.recipeConflictCheckerInitialized = true;

	var header = $( ".card-header", card );
	header.addClass( "link-pointer" );
	var collapse = $( ".collapse", card );
	header.off("click");
	header.on("click",function() {
		collapse.collapse( "toggle" );
	});

	var selected_machine = "";
	var downloaded_machines = {};
	var downloaded_grouped = {};

	var machine_search = $(".machine-search", card);
	var recipe_search = $(".recipe-search", card);
	var added_recipes = $(".added-recipes", card);
	var conflict_results = $(".conflict-results", card);

	var added_recipes_list = [];

	var folderName = "2022-10-07_15-16-48";
	var filesList = [
	    "Ore Washing Plant.json","Thermal Centrifuge.json","Compressor.json","Extractor.json","Disassembler.json","Scanner.json","Rock Breaker.json","Ore Byproduct List.json","Replicator.json","Assemblyline Process.json",
	    "Plasma Arc Furnace.json","Arc Furnace.json","Printer.json","Sifter.json","Forming Press.json","Precision Laser Engraver.json","Mixer.json","Autoclave.json","Electromagnetic Separator.json","Electromagnetic Polarizer.json",
	    "Pulverization.json","Chemical Bath.json","Fluid Canning Machine.json","Brewing Machine.json","Fluid Heater.json","Distillery.json","Fermenter.json","Fluid Solidifier.json","Fluid Extractor.json","Packager.json",
	    "Unpackager.json","Fusion Reactor.json","Centrifuge.json","Electrolyzer.json","Blast Furnace.json","DTPF.json","Primitive Blast Furnace.json","Implosion Compressor.json","Vacuum Freezer.json","Chemical Reactor.json",
	    "Large Chemical Reactor.json","Distillation Tower.json","Oil Cracker.json","Pyrolyse Oven.json","Wiremill.json","Bending Machine.json","Alloy Smelter.json","Assembler.json","Circuit Assembler.json","Canning Machine.json",
	    "Lathe.json","Cutting Machine.json","Slicing Machine.json","Extruder.json","Forge Hammer.json","Amplifabricator.json","Mass Fabrication.json","Combustion Generator Fuels.json","Extreme Diesel Engine Fuel.json",
	    "Gas Turbine Fuel.json","Thermal Generator Fuels.json","Semifluid Boiler Fuels.json","Plasma Generator Fuels.json","Magic Energy Absorber Fuels.json","Naquadah Reactor MkI.json","Naquadah Reactor MkII.json",
	    "Naquadah Reactor MkIII.json","Naquadah Reactor MkIV.json","Naquadah Reactor MkV.json","Fluid Naquadah Reactor.json","Large Boiler.json","Rocket Engine Fuel.json","RTG.json","Semifluid Generator Fuels.json",
	    "Bio Lab.json","Bacterial Vat.json","Acid Generator.json","Circuit Assembly Line.json","Radio Hatch Material List.json","High Temperature Gas-cooled Reactor.json","Draconic Evolution Fusion Crafter.json",
	    "Large Naquadah Reactor.json","Naquadah Fuel Refine Factory.json","Neutron Activator.json","Extreme Heat Exchanger.json","Precise Assembler.json","Research station.json","Digester.json","Dissolution Tank.json",
	    "Electric Implosion Compressor.json"
	];
	filesList.sort();
	machine_search.append("<option value='-' disabled selected>Select Machine</option>");
	machine_search.append(filesList.map(i => `<option value='${i}'>${i.replace(/\.json$/,"")}</option>`));
	machine_search.selectpicker({liveSearch:true,maxOptions:1});
	var selectpicker_created = false;

	machine_search.off( "changed.bs.select" );
	machine_search.on( "changed.bs.select", function() {
		selected_machine = machine_search.val();
		//console.log("SELECTED",selected_machine);
		added_recipes_list = [];
		added_recipes.empty();
		downloadMachine(selected_machine);
	});


	recipe_search.off( "changed.bs.select" );
	var deselecting = false;
	recipe_search.on( "changed.bs.select", function() {
		if (deselecting) return;
		deselecting = true;
		addRecipe(recipe_search.val());
		recipe_search.selectpicker('deselectAll');
		recipe_search.selectpicker('val','-');
		deselecting = false;
	});

	function buildTbl(list) {
		var ret = ["<table class='table table-borderless table-xs mb-0'>"];

		list.sort((i1,i2) => {
			if (i1.cfg && !i2.cfg) {
				return -1;
			} else if (!i1.cfg && i2.cfg) {
				return 1;
			}
			return 0;
		})

		for(let i of list) {
			let name = "<span class='align-baseline d-inline-block'>" + i.lN + "</span>";
			if (i.cfg) {name = "<span class='text-muted align-baseline d-inline-block'>["+i.cfg+"]</span> " + name;}
			if (i.a > 0) {name += "<span class='text-muted ml-1 align-baseline d-inline-block'>x" + i.a + "</span>";}
			if (i.a == 0) {
				ret.push("<tr style='background-color:rgba(0,0,0,0.2);'><td>");
			} else {
				ret.push("<tr><td>");
			}
			ret.push(name);
			ret.push("</td></tr>")
		}

		return ret.join("");
	}

	function buildRecipePanel(recipe, removebtn) {
		let eut = recipe.eut;
		let dur = recipe.dur;
		let pnl = $("<div>");
		let colIn = $("<div class='col px-1'>").css({
			maxHeight: "200px",
			overflowY: "auto"
		});
		let colOut = $("<div class='col px-2'>").css({
			maxHeight: "200px",
			overflowY: "auto"
		});

		colIn.append(buildTbl(recipe.iI.concat(recipe.fI)));
		colOut.append(buildTbl(recipe.iO.concat(recipe.fO)));
		colOut.append($("<div class='p-2 my-1 bg-secondary'>").append(eut + " EU/T, " + (dur>20 ? Math.floor(dur/20*1000+0.5)/1000 + "s" : dur + "t")));

		let names = recipe.iI.concat(recipe.fI).concat(recipe.iO).concat(recipe.fO).map(r => r.lN).join(" ");

		pnl.append($("<div class='row p-1 m-0'>").css("border-bottom","1px solid #00000050").append([colIn,colOut]));

		if (removebtn) {
			pnl.addClass("position-relative");
			pnl.prepend($('<button type="button" class="close link-pointer" style="z-index:10; top:0;" aria-label="Close">'+
							'<span aria-hidden="true">&times;</span>'+
						'</button>').click(()=>removeRecipe(recipe.idx, pnl)));
		}

		return {pnl:pnl,names:names};
	}

	function addRecipe(recipeIdx) {
		if (recipeIdx == null) return;
		//console.log("addRecipe",recipeIdx);
		if (!downloaded_machines[selected_machine]) return;
		var recipe = downloaded_machines[selected_machine].recs[recipeIdx];

		if (added_recipes_list.some(i => i.idx == recipe.idx)) {return;}
		
		var obj = buildRecipePanel(recipe, true);
		obj.pnl.attr("data-recipe-idx",recipe.idx);
		added_recipes.append(obj.pnl);
		added_recipes_list.push(recipe);
		calculateConflicts();
	}

	function removeRecipe(recipeIdx, pnl) {
		for(let i in added_recipes_list) {
			if (added_recipes_list[i].idx == recipeIdx) {
				added_recipes_list.splice(i,1);
				if (pnl) {
					pnl.remove();
				} else {
					$("[data-recipe-idx='"+recipeIdx+"']",added_recipes).remove();
				}
				calculateConflicts();
				break;
			}
		}
	}


	function calculateConflicts() {
		var recipes = downloaded_machines[selected_machine].recs;

		var allInputs = getAllInputs(added_recipes_list);
		conflict_results.empty();

		var total_conflicts = [];
		var partial_conflicts = [];

		for(let i in recipes) {
			let otherRecipe = recipes[i];

			if (allInputsConflict(allInputs,otherRecipe)) {
				var pnl = buildRecipePanel(otherRecipe).pnl;
				total_conflicts.push(pnl);
			}
		}

		if (total_conflicts.length > 0) {
			conflict_results.append("<div class='p-2 mb-2 bg-danger text-center'>Total conflicts <small class='text-muted'>(All inputs conflict)</small></div>").append(total_conflicts);
		}

		for(let i in added_recipes_list) {
			let otherRecipe = added_recipes_list[i];
			if (partialInputsConflict(allInputs, otherRecipe)) {
				var pnl = buildRecipePanel(otherRecipe).pnl;
				partial_conflicts.push(pnl);
			}
		}

		if (partial_conflicts.length > 0) {
			conflict_results.append("<div class='p-2 mb-2 bg-warning text-center'>Partial conflicts <small>(Parts of inputs conflict)</small></div>").append(partial_conflicts);
		}
	}

	function downloadMachine(machine) {
		if (downloaded_machines[machine]) {
			listRecipes(machine);
		} else {
			$.get("data/exported_recipes/" + folderName + "/" + machine, function(data) {
				downloaded_machines[machine] = data;
				//groupRecipes(machine);
				listRecipes(machine);
			});
		}
	}

	function getAllInputs(recipes) {
		var items = {};
		var fluids = {};
		var circuits = {};
		var recipeIdx = {};

		for(let i in recipes) {
			let recipe = recipes[i];
			recipeIdx[recipe.idx] = true;

			for(let item of recipe.iI) {
				if (item.a == 0) {
					circuits[getCircuitUID(item)] = true;
				} else {
					if (items[item.uN]) {
						if (!items[item.uN].some(a => a == item.a)) {
							items[item.uN].push(item.a);
						}
					} else {
						items[item.uN] = [item.a];
					}
				}
			}
			for(let fluid of recipe.fI) {
				if (fluid.a == 0) continue;

				if (fluids[fluid.uN]) {
					if (!fluids[fluid.uN].some(a => a == fluid.a)) {
						fluids[fluid.uN].push(fluid.a);
					}
				} else {
					fluids[fluid.uN] = [fluid.a];
				}
			}
		}

		//console.log("all inputs for up to 2 recipes", items, fluids, circuits);

		return {items:items,fluids:fluids,circuits:circuits, recipeIdx: recipeIdx};
	}

	function getAllInputsForTwo(recipe1, recipe2) {
		var recipes = [recipe1];
		if (recipe2) recipes.push(recipe2);
		return getAllInputs(recipes);
	}

	function getCircuitUID(circuit) {
		if (typeof circuit != "undefined" && circuit != null) {
			return circuit.uN + "[" + circuit.cfg + "]";
		}

		return "-";
	}

	function getCircuitForRecipe(recipe) {
		return recipe.iI.find(i => i.uN == "gt.integrated_circuit" || i.uN == "item.BioRecipeSelector" || i.uN == "item.T3RecipeSelector");
	}

	function allInputsConflict(allInputs, otherRecipe) {
		if (typeof allInputs.recipeIdx[otherRecipe.idx] != "undefined") {
			return false;
		}

		var circuit = getCircuitForRecipe(otherRecipe);
		if (circuit) {
			if (typeof allInputs.circuits[getCircuitUID(circuit)] == "undefined") {
				return false;
			}
		}

		for(let i in otherRecipe.iI) {
			let item = otherRecipe.iI[i];
			if (item.a == 0) continue;

			if (typeof allInputs.items[item.uN] == "undefined") {
				// missing item
				return false;
			}

			if (allInputs.items[item.uN].every(i => i == item.a)) {
				// same amounts = no conflict
				return false;
			}
		}

		for(let i in otherRecipe.fI) {
			let fluid = otherRecipe.fI[i];
			if (fluid.a == 0) continue;

			if (typeof allInputs.fluids[fluid.uN] == "undefined") {
				// missing fluid
				return false;
			}

			if (allInputs.fluids[fluid.uN].every(f => f == fluid.a)) {
				// same amounts = no conflict
				return false;
			}
		}
		
		return true;
	}

	function partialInputsConflict(allInputs, otherRecipe) {
		var circuit = getCircuitForRecipe(otherRecipe);
		if (circuit) {
			if (typeof allInputs.circuits[getCircuitUID(circuit)] == "undefined") {
				return false;
			}
		}

		for(let i in otherRecipe.iI) {
			let item = otherRecipe.iI[i];
			if (item.a == 0) continue;

			if (typeof allInputs.items[item.uN] != "undefined" && 
				allInputs.items[item.uN].some(i => i != item.a)) {
				// item found and they have different amounts
				return true;
			}
		}

		for(let i in otherRecipe.fI) {
			let fluid = otherRecipe.fI[i];
			if (fluid.a == 0) continue;
			if (typeof allInputs.fluids[fluid.uN] != "undefined" &&
				allInputs.fluids[fluid.uN].some(f => f != fluid.a)) {
				// fluid found and they have different amounts
				return true;
			}
		}
		
		return false;
	}

	/*
	function checkConflictsInGroup(machine, circuitUID, recipe) {
		var group = downloaded_grouped[machine][circuitUID];
		if (!group) {
			downloaded_grouped[machine][circuitUID] = [[recipe]];
		} else {
			let outerConflictDetected = true;
			for(let gi in group) {
				let conflictDetected = false;
				for(let i in group[gi]) {
					let otherRecipe = group[gi][i];

					if (allInputsConflict(getAllInputsForTwo(recipe), otherRecipe)) {
						// conflict detected between 2 recipes
						console.log("conflict detected between 2", recipe, otherRecipe);
						conflictDetected = true;
						break;
					}

					let allInputs = getAllInputsForTwo(recipe, otherRecipe);

					if (group[gi].length > 1) {
						for(let ii in group[gi]) {
							let thirdRecipe = group[gi][ii];
							if (thirdRecipe.idx == otherRecipe.idx) continue;

							if (allInputsConflict(allInputs, thirdRecipe)) {
								// conflict detected between 3 recipes (2 => 1), add to new group
								console.log("conflict detected between 3", recipe, otherRecipe, thirdRecipe);
								conflictDetected = true;
								break;
							}
						}
					}
				}
				if (!conflictDetected) {
					//console.log("no conflict detected in",circuitUID,"group",gi,"for recipe",recipe);
					group[gi].push(recipe);
					outerConflictDetected = false;
					break;
				}
			}
			if (outerConflictDetected) {
				console.log("conflicts detected in ",circuitUID, "in all groups, making new group for recipe", recipe);
				group.push([recipe]);
			}
		}
	}

	function groupRecipes(machine) {
		if (!downloaded_machines[machine]) return;

		downloaded_grouped[machine] = {};
		var recipes = downloaded_machines[machine].recs;
		for(let idx in recipes) {
			let recipe = recipes[idx];

			let circuitUID = getCircuitUID(getCircuitForRecipe(recipe));
			checkConflictsInGroup(machine, circuitUID, recipe)
		}

		console.log("RECIPE GROUPS",downloaded_grouped[machine]);
	}
	//*/

	function listRecipes(machine) {
		if (!downloaded_machines[machine]) return;

		recipe_search.empty();

		recipe_search.append("<option value='-' disabled selected data-content='<div class=\"p-2\">Add Recipe</div>'>Add Recipe</option>");
		var recipes = downloaded_machines[machine].recs;
		for(let idx in recipes) {
			let recipe = recipes[idx];
			recipe.idx = idx;
			let obj = buildRecipePanel(recipe)

			recipe_search.append(
				$("<option>").attr("value",""+idx)
				.attr("data-content",obj.pnl.html())
				.text(obj.names)
			);
		}

		setTimeout(() => {
			if (selectpicker_created) {
				recipe_search.selectpicker("refresh");
			} else {
				recipe_search.selectpicker({liveSearch:true,maxOptions:1,virtualScroll:100, sanitizeFn:(i) => i});
				selectpicker_created = true;

				// TESTING
				/*
				recipe_search.selectpicker('val','442');
				recipe_search.selectpicker('val','542');
				recipe_search.selectpicker('val','672');
				recipe_search.selectpicker('val','513');
				recipe_search.selectpicker('val','199');
				*/
			}
		}, 10);
	}



	// TESTING
	/*
	selected_machine = "Large Chemical Reactor.json";
	downloadMachine(selected_machine);
	*/

});