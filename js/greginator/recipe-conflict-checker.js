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

	collapse.on("show.bs.collapse",function(e) {
		if (e.target == $("> .collapse",card)[0]) {
			card.parent().addClass("container-fluid").removeClass("container");
		}
	}).on("hide.bs.collapse",function(e) {
		if (e.target == $("> .collapse",card)[0]) {
			card.parent().removeClass("container-fluid").addClass("container");
		}
	});

	function tabChanged(str) {
		$(".tab-pane",card).hide();
		$("#recipe-conflict-tabs-" + str, card).show();
	}
	$("input[name='recipe-conflict-tabs']",card).change(function() {
		if ($(this).is(":checked")) {
			tabChanged($(this).val());
		}
	});

	var displayMode = "compact";
	function displayModeChanged(str, parent) {
		if (displayMode == "full") {
			$(".recipe-item-compact",parent).hide();
			$(".recipe-item-full",parent).show();
		} else {
			$(".recipe-item-compact",parent).show();
			$(".recipe-item-full",parent).hide();
		}
	}
	$("input[name='recipe-conflict-displaymode']",card).change(function() {
		if ($(this).is(":checked")) {
			displayMode = $(this).val();
			displayModeChanged(displayMode, card);
		}
	});

	var logicMode = "split";
	function logicModeChanged(str) {
		var oldLogicMode = logicMode;
		logicMode = str;
		if (logicMode == "bus-isolation") {
			$(".detected-conflicts-header", card).html("List of required machines separated by input bus and circuit<br>"+
				"<strong>NOTE: CURRENTLY SEEMS TO HAVE ISSUES. If you notice an excessive number of different machines in this mode, switch to split mode instead, which is much more stable.</strong>");
		} else if (logicMode == "split") {
			$(".detected-conflicts-header",card).text("List of required machines separated by circuit");
		} else if (logicMode == "browse") {
			$(".detected-conflicts-header",card).text("Table of other recipes that will cause the selected recipe to be crafted");
		} else {
			$(".detected-conflicts-header",card).text("Detected conflicts");
		}
		calculateConflicts();

		if (oldLogicMode == "browse" || logicMode == "browse") {
			search();
		}
	}
	$("input[name='recipe-conflict-logic']",card).change(function() {
		if ($(this).is(":checked")) {
			logicModeChanged($(this).val());
		}
	});

	$(".btn-group-toggle label",card).tooltip({trigger:"hover"});
	$(".card-title .text-muted",card).tooltip({trigger:"hover"});


	var selected_machine = "";
	var downloaded_machines = {};
	var downloaded_grouped = {};
	var current_recipes_list = {};

	tabChanged("search");
	displayModeChanged("compact");
	logicModeChanged("split");

	var machine_search = $(".machine-search", card);
	var recipe_search_input = $(".recipe-search-input", card);
	var recipe_search_output = $(".recipe-search-output", card);
	var recipe_search_result = $(".recipe-search-result", card);
	var added_recipes = $(".added-recipes", card);
	var conflict_results = $(".conflict-results", card);
	var settings_input = $(".settings-input", card);
	var version_input = $(".version-select",card);
	var settings_input_written = false;
	var loading_settings = false;
	var loading_add = false;

	var recipes_conflict_lookup = {};
	var recipes_conflict_amount = 0;
	var selected_recipe_browse = null;
	var selected_recipe_browse_number = -1;
	var selected_recipe_browse_conflict = null;
	var added_recipes_list = [];
	var autosave_name = "";

	var folderName = "2022-12-24_18-24-13";
	var filesList = null;
	function resetMachineList() {
		machine_search.empty();
		machine_search.append("<option value='-' disabled selected>Select Machine</option>");

		$.get("data/exported_recipes/" + folderName + "/list of files.json", function(data) {
			filesList = data;
			filesList.sort();
			machine_search.append(filesList.map(i => `<option value='${i}'>${i.replace(/\.json$/,"")}</option>`));
			machine_search.selectpicker("refresh");
			setTimeout(() => {
				machine_search.selectpicker("refresh");
			},10);
			recipe_search_result.empty();
			downloaded_machines = {};
		});
	}
	resetMachineList();
	
	machine_search.selectpicker({liveSearch:true,maxOptions:1});
	var selectpicker_created = false;

	machine_search.off( "changed.bs.select" );
	machine_search.on( "changed.bs.select", function() {
		selected_machine = machine_search.val();
		//console.log("SELECTED",selected_machine);
		added_recipes_list = [];
		added_recipes.empty();
		downloadMachine(selected_machine);
		saveSettings();
	});


	function getUID(thing) {
		if ((thing.uN == "gt.integrated_circuit" || i.uN == "item.BioRecipeSelector" || i.uN == "item.T3RecipeSelector")
			&& thing.a == 0 && typeof thing.cfg != "undefined") {
			return thing.uN + "[" + thing.cfg + "]";
		}

		return thing.uN;
	}


	function doSearch() {
		var inp = recipe_search_input.val().toLowerCase();
		var out = recipe_search_output.val().toLowerCase();
		var searched_recipes_list = [];
		$(".tooltip").remove();

		if (inp != "" || out != "") {
			searched_recipes_list = current_recipes_list.filter(r => {
				if (logicMode == "browse" && typeof recipes_conflict_lookup[r.recipe.idx] == "undefined") {
					return false;
				}

				var inp_b = inp == "";
				var out_b = out == "";
				r.lev = 999999;

				if (inp != "" && r.iNames.indexOf(inp) > -1) {
					r.lev = Math.min(r.lev, ...r.recipe.iI.concat(r.recipe.fI).map(i => levenshtein(i.lN.toLowerCase(),inp)));
					inp_b = true;
				}

				if (out != "" && r.oNames.indexOf(out) > -1) {
					r.lev = Math.min(r.lev, ...r.recipe.iO.concat(r.recipe.fO).map(i => levenshtein(i.lN.toLowerCase(),inp)));
					out_b = true;
				}

				return inp_b && out_b;
			});
			searched_recipes_list.sort((a,b) => Math.sign(a.lev - b.lev));
		} else {
			searched_recipes_list = ([...current_recipes_list]);
			if (logicMode == "browse") {
				searched_recipes_list = searched_recipes_list.filter(r => {
					return typeof recipes_conflict_lookup[r.recipe.idx] != "undefined";
				});
			}
			searched_recipes_list.sort((a,b) => Math.sign(a.recipe.idx - b.recipe.idx));
		}

		recipe_search_result.empty().append(searched_recipes_list.slice(0,200).map(v => {
			let pnl = buildRecipePanel(v.recipe);
			pnl.addClass("link-pointer");
			pnl.click(() => {
				addRecipe(v.recipe.idx);
			});
			$(".cell-calculator-btn",pnl).click((e) => {window.fromConflictCheckerToCellCalculator(v.recipe); e.preventDefault(); e.stopPropagation();});
			$("[data-original-title]",pnl).each(()=>{
				$(this).attr("title",$(this).attr("data-original-title"));
			}).tooltip({html:true, trigger:"hover"});
			return pnl
		}));
	}

	var search_tid;
	function search() {
		if (search_tid) {clearTimeout(search_tid);}
		search_tid = setTimeout(doSearch,150);
	}
	recipe_search_input.on("input",function() {
		if (!selected_machine) return;
		if (!downloaded_machines[selected_machine]) return;
		search();
	});
	recipe_search_output.on("input",function() {
		if (!selected_machine) return;
		if (!downloaded_machines[selected_machine]) return;
		search();
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
				ret.push("<tr style='background-color:rgba(0,0,0,0.2); white-space:nowrap'><td>");
			} else {
				ret.push("<tr><td style='white-space:nowrap;'>");
			}
			ret.push(name);
			ret.push("</td></tr>")
		}

		return ret.join("");
	}

	function buildRecipePanel(recipe, removebtn, conflictsWith) {
		let eut = recipe.eut;
		let dur = recipe.dur;
		let stats = eut + " EU/t, " + (dur>20 ? Math.floor(dur/20*1000+0.5)/1000 + "s" : dur + "t");
		let pnl = $("<div class='p-1 m-0 recipe-item'>");

		if (recipe.idx < 0) {
			pnl.addClass("bg-danger");
		}

		//////////////////////////////////
		// compact display
		let compact = $("<div class='m-0 recipe-item-compact'>").css({
			display:"flex",
			gap:"4px"
		});

		let compact_list = [];
		let circuit = recipe.iI.find(i => i.a == 0 && typeof i.cfg != "undefined");
		if (circuit) {
			compact_list.push($("<div>").text("C" + circuit.cfg).css({
				width:"40px",
				backgroundColor:"rgba(0,0,0,0.2)",
				textAlign:"center"
			}));
		} else {
			compact_list.push($("<div>").css("width","40px"));
		}

		let tdCSS = {width: "50%",overflowX: "auto", whiteSpace: "nowrap", wordBreak: "break-all"};
		let iNames = getItemNames(recipe.iI.filter(i => i.a>0||typeof i.cfg == "undefined"),recipe.fI, "; ");
		let oNames = getItemNames(recipe.iO,recipe.fO, "; ");
		compact_list.push($("<div>").text(iNames).css(tdCSS));
		compact_list.push($("<div>").text(oNames).css(tdCSS).css("width","100%"));

		compact.append(
			compact_list
		);

		//////////////////////////////////
		// full display
		let full = $("<div class='row recipe-item-full'>");

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
		colOut.append($("<div class='p-1 my-1 bg-secondary'>").append(stats));

		//let names = recipe.iI.concat(recipe.fI).concat(recipe.iO).concat(recipe.fO).map(r => r.lN).join(" ");

		full.append([colIn,colOut]);
		full.attr("data-recipe-idx",recipe.idx);
		if (recipe.idx < 0) {
			full.append("<div class='alert alert-danger mx-2 mb-0'>Recipe not found, but added anyway. This is likely due to GTNH changing this recipe after you created this recipe list. To fix, either re-add the newer verison of this recipe, or switch to an older version using the GTNH Version dropdown above.</div>");
		}


		var compactTitle = $("<div class='d-flex' style='flex-direction:column'>");
		compactTitle.append($("<div class='w-100'>").append(full));
		if (conflictsWith) {
			compactTitle.append($("<div class='w-100'>").append("<p>Conflicts with:</p>"));
			var recipes = downloaded_machines[selected_machine].recs;
			for(let idx in conflictsWith) {
				let otherRecipe = recipes[idx];
				if (otherRecipe) {
					let otherPnl = buildRecipePanel(otherRecipe, false);
					$(".recipe-item-compact", otherPnl).remove();
					$(".recipe-item-full", otherPnl).removeClass(".recipe-item-full").show();
					compactTitle.append($("<div class='w-100'>").append(otherPnl));
				}
			}
		}

		compact.attr("title",$("<div class='row p-2 align-left' style='min-width:500px;'>").html(compactTitle.html()).prop("outerHTML")).tooltip({
			html: true
		});
		pnl.append([compact,full]);


		pnl.addClass("position-relative");

		if (removebtn) {
			pnl.prepend($('<button type="button" class="close link-pointer" title="Remove" style="z-index:10; top:0; right:0;" aria-label="Close">'+
							'<span aria-hidden="true">&times;</span>'+
						'</button>').click(()=>removeRecipe(recipe.idx, pnl)));
		}

		pnl.prepend(
			$('<button title="Send to Cell Calculator" type="button" class="btn btn-sm btn-secondary cell-calculator-btn link-pointer position-absolute" '+
				'style="z-index:10; font-size:12px; padding:0.1rem 0.25rem 0.1rem 0.25rem; top:2px; right: ' + (removebtn ? '20px' : '2px') + ';">C</button>')
			.click((e) => {window.fromConflictCheckerToCellCalculator(recipe); e.preventDefault(); e.stopPropagation();}).tooltip()
		);

		displayModeChanged(displayMode,pnl);

		return pnl; // {pnl:pnl,names:names};
	}

	function getSettingsToSave() {
		return {
			machine: selected_machine,
			recipes: added_recipes_list
		}
	}

	function saveSettings() {
		var settings = getSettingsToSave();
		settings_input_written = true;
		var settings_str = JSON.stringify(settings);
		settings_input.val(settings_str);
		settings_input_written = false;
		if (autosave_name != "" && settings_str.length > 0) {
			for(let i in saved) {
				if (saved[i].name == autosave_name) {
					saved[i].settings = settings;
					save();
					break;
				}
			}
		}
	}

	function getRecipeFromIdx(recipeIdx) {
		if (recipeIdx < 0) {
			return added_recipes_list.find(i => i.idx == recipeIdx);
		}
		return downloaded_machines[selected_machine].recs[recipeIdx];
	}

	function addRecipe(recipeIdx) {
		if (recipeIdx == null) return;
		//console.log("addRecipe",recipeIdx);
		if (!downloaded_machines[selected_machine]) return;
		var recipe;
		if (typeof recipeIdx != "number") {
			// its an object
			recipe = recipeIdx;
		} else {
			recipe = getRecipeFromIdx(recipeIdx);
		}

		if (logicMode == "browse") {
			var keys = Object.keys(recipes_conflict_lookup);
			selected_recipe_browse_number = -1;
			selected_recipe_browse_conflict = null;
			for(var i=0;i<keys.length;i++) {
				if (parseInt(keys[i]) == recipe.idx) {
					selected_recipe_browse_number = i;
					selected_recipe_browse_conflict = recipes_conflict_lookup[keys[i]];
					browse_firstTime = false;
					break;
				}
			}
			selected_recipe_browse = recipe;
			calculateConflicts();
		} else {
			if (added_recipes_list.some(i => i.idx == recipe.idx)) {return;}

			var pnl = buildRecipePanel(recipe, true);
			added_recipes.append(pnl);
			added_recipes_list.push(recipe);

			if (loading_settings == false) {
				calculateConflicts();
				saveSettings();
			}
		}
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

		saveSettings();
	}

	var browse_firstTime = true;
	var browse_hideIdenticalOutputs = true;
	var browse_hideDifferentCircuits = true;
	function calculateBrowse() {
		added_recipes.hide();
		conflict_results.empty();

		// options
		var hideIdenticalOutputs = $(`<label>
											<input type="checkbox"> Hide recipes with identical outputs
										</label>`);
		var hideIdenticalOutputs_Checkbox = $("input",hideIdenticalOutputs);
		hideIdenticalOutputs_Checkbox.prop("checked",browse_hideIdenticalOutputs);
		hideIdenticalOutputs_Checkbox.change(function() {
			browse_hideIdenticalOutputs = hideIdenticalOutputs_Checkbox.is(":checked");
			buildConflictLookup(downloaded_machines[selected_machine].recs);
			if (selected_recipe_browse) {
				addRecipe(selected_recipe_browse.idx);
			} else {
				calculateBrowse();
			}
			search();
		});
		var hideDifferentCircuits = $(`<label>
											<input type="checkbox"> Hide recipes with different circuit config
										</label>`);
		var hideDifferentCircuits_Checkbox = $("input",hideDifferentCircuits);
		hideDifferentCircuits_Checkbox.prop("checked",browse_hideDifferentCircuits);
		hideDifferentCircuits_Checkbox.change(function() {
			browse_hideDifferentCircuits = hideDifferentCircuits_Checkbox.is(":checked");
			buildConflictLookup(downloaded_machines[selected_machine].recs);
			if (selected_recipe_browse) {
				addRecipe(selected_recipe_browse.idx);
			} else {
				calculateBrowse();
			}
			search();
		});

		var optPnl = $("<div class='d-flex flex-row'>").css("gap","16px").append(["Filters:",hideIdenticalOutputs,hideDifferentCircuits]);
		conflict_results.append(optPnl);

		// next/prev buttons
		function getAdjacent(num) {
			var keys = Object.keys(recipes_conflict_lookup);

			var prev = keys[num-1];
			var next = keys[num+1];

			if (prev == null) {
				prev = keys[keys.length-1];
			}
			if (next == null) {
				next = keys[0];
			}

			return {prev:parseInt(prev),next:parseInt(next)};
		}

		function prev() {
			addRecipe(getAdjacent(selected_recipe_browse_number).prev);
		}
		function next() {
			addRecipe(getAdjacent(selected_recipe_browse_number).next);
		}
		var prevBtn = $("<div class='btn btn-light'>&lt; Prev</div>").click(prev);
		var nextBtn = $("<div class='btn btn-light'>Next &gt;</div>").click(next);
		var currentViewing = $("<span>").text("Viewing conflict: " + (selected_recipe_browse_number != -1 ? (selected_recipe_browse_number+1) : "-") + "/" + recipes_conflict_amount);
		var prevNextContainer = $("<div class='d-flex flex-row' style='justify-content:space-between; align-items:center;'>").append([prevBtn,currentViewing,nextBtn]);
		conflict_results.append(prevNextContainer);

		if (browse_firstTime && selected_recipe_browse_number == -1) {
			conflict_results.append("<div class='text-muted mb-2'>Search for a recipe to the left, or use the next/prev buttons below.</div>");
		} else if (selected_recipe_browse_number == -1) {
			conflict_results.append("<div class='mb-2'><strong>The recipe you selected doesn't have any conflicts.</strong> "+
				"<span class='text-muted'>Search for and select a recipe to the left, or use the next/prev buttons below.</span></div>");
		}

		var recipe = selected_recipe_browse;
		if (recipe) {
			var pnl = buildRecipePanel(recipe,false);
			conflict_results.append(["Selected recipe:",pnl,"<br />"]);	
		}

		var VIEW_DIRECTION = "VERTICAL";

		// display results
		if (selected_recipe_browse_conflict != null) {
			var conflict = selected_recipe_browse_conflict;

			var trInputs = [];
			var flexConflicts = [];

			function getInputLabel(uid, what) {
				for(let item of recipe[what]) {
					if (getUID(item) == uid) {
						if (item.cfg) {
							return "[" + item.cfg + "] " + item.lN;
						}
						return item.lN;
					}
				}
				return "ERROR: " + uid;
			}

			var amountInputs = 0;
			var maxAmountConflicts = 0;
			var myCircuit = getCircuitForRecipe(recipe);

			function appendRecipeConflict(uid, list, what) {
				if (myCircuit && getUID(myCircuit) == uid) {return;}

				amountInputs++;
				let flex = $("<div class='d-flex flex-row'>");
				let amount = list.length
				maxAmountConflicts = Math.max(maxAmountConflicts,Math.min(amount,41));

				if (VIEW_DIRECTION == "VERTICAL") {
					flex = $("<div class='d-flex flex-row flex-wrap'>");
				}

				for(let idx=0;idx<Math.min(amount,40);idx++) {
					let otherRecipe = getRecipeFromIdx(list[idx]);
					let pnl = buildRecipePanel(otherRecipe,false).css({
						"min-width":"400px",
						"max-width":"400px"
					});
					flex.append(pnl);
				}
				if (amount > 40) {
					flex.append("<div class='text-nowrap'>+" + (amount-40) + " other recipes</div>");
				}

				let lbl = $("<td class='text-nowrap'>").text(getInputLabel(uid,what));
				lbl.css({
					"max-width":"150px",
					"overflow-x":"hidden",
					"text-overflow":"ellipsis",
					"min-width":"50px"
				})
				trInputs.push($("<tr>").append(lbl));
				flexConflicts.push(flex);
			}

			for(let uid in conflict.itemConflicts) {
				appendRecipeConflict(uid, conflict.itemConflicts[uid], "iI");
			}
			for(let uid in conflict.fluidConflicts) {
				appendRecipeConflict(uid, conflict.fluidConflicts[uid], "fI");
			}

			var tbl = $("<table class='table table-striped table-xs'>").css({
				"overflow-x": "auto"
			});

			var trHead = $("<tr>").append([
				$("<td>").text("Inputs"),
				$("<td>").text("Conflicting recipes")
			]);

			var tdRight = $("<td rowspan='" + (amountInputs+1) + "'>").append($("<div class='adjustWidth'>").css({
				"width":"100%",
				"overflow-x":"auto",
			}).append(flexConflicts));

			$(window).off("resize");
			if (VIEW_DIRECTION == "HORIZONTAL") {
				function doAdjustWidth() {
					var width = conflict_results.width() - 150;
					$(".adjustWidth",tdRight).css("width",width+"px");
				}
				$(window).off("resize").on("resize",doAdjustWidth);
				doAdjustWidth();
			}

			tbl.append(trHead);

			if (VIEW_DIRECTION == "HORIZONTAL") {
				$(trInputs[0]).append(tdRight);
			} else {
				for(var i=0;i<flexConflicts.length;i++) {
					$(trInputs[i]).append($("<td>").append(flexConflicts[i]));
				}
			}

			tbl.append(trInputs);
			conflict_results.append(tbl);
		}
	}

	function calculateConflicts() {
		if (!downloaded_machines[selected_machine]) return;
		if (!downloaded_machines[selected_machine].recs) return;
		var recipes = downloaded_machines[selected_machine].recs;

		added_recipes.show();
		added_recipes_list.sort((a,b) => a.idx - b.idx);

		function calculateConflictsBusIsolation() {
			// add each selected recipe to the list one by one and if adding that causes a recipe conflict, create a new group for that recipe
			conflict_results.empty();
			conflict_results.text("Calculating...");
			var conflictsWith = {};

			function checkTotalConflicts(allInputs, mRecipe) {
				//var found = false;
				//console.log("checkTotalConflicts",allInputs, mRecipe);
				for(let i in recipes) {
					let otherRecipe = recipes[i];

					if (allInputsConflict(allInputs, otherRecipe)) {
						//conflictsWith[mRecipe.idx][otherRecipe.idx] = true;
						//found = true;
						return true;
					}
				}

				//return found;
				return false;
			}


			function getAllInputsForBus(fluids, bus, circuitUID) {
				return {
					items: bus.allItems,
					fluids: fluids,
					circuits: {[circuitUID]: true},
					recipeIdx: bus.allRecipeIdx
				}
			}

			/* 
				allInputsGrouped
				structure [
					{
						allFluids: {} // all fluids in this machine
						circuits: {
							[circuitUID]: {
								circuitName: "",
								buses: [
									{
										allItems: {},
										allRecipeIdx: {}
										recipes: []
									}
								]
							}
						}
					}
				]

			*/

			var allInputsGrouped = [{allFluids:{},circuits:{}}]
			for(let i in added_recipes_list) {
				let recipe = added_recipes_list[i];
				conflictsWith[recipe.idx] = {};
				//console.log("------- CHECKING RECIPE",recipe);

				let circuit = recipe.iI.find(i => i.a == 0 && typeof i.cfg != "undefined");
				let circuitUID = getCircuitUID(circuit);
				let allInputsOne = getAllInputs([recipe]);

				let foundMachine = false;
				for(let machineIdx in allInputsGrouped) {
					let machine = allInputsGrouped[machineIdx];
					let allInputsFluids = machine.allFluids;

					if (!machine.circuits[circuitUID]) {
						machine.circuits[circuitUID] = {
							circuitName: circuit ? circuit.cfg : "none",
							buses: []
						};
					}

					let mCircuits = machine.circuits[circuitUID];

					if (mCircuits.buses.length > 0) {
						for(let iB in mCircuits.buses) {
							let allInputsBus = getAllInputsPlusOne(getAllInputsForBus(allInputsFluids, mCircuits.buses[iB], circuitUID), allInputsOne);

							//console.log("checking machine",machineIdx,"bus",iB,"allInputsBus:", allInputsBus);
							//if (!allInputsConflict(allInputsBus, recipe)) {
							if (!checkTotalConflicts(allInputsBus, recipe)) {
								//console.log("recipe",recipe,`added to allInputsGrouped[${machineIdx}].circuits[${circuitUID}].buses[${iB}]`);
								// adding this recipe will not cause a conflict, add it to this machine
								machine.allFluids = allInputsBus.fluids;
								mCircuits.buses[iB].allItems = {...allInputsBus.items};
								mCircuits.buses[iB].allRecipeIdx = {...allInputsBus.recipeIdx};
								mCircuits.buses[iB].recipes.push(recipe);
								foundMachine = true;
								break;
							}
						}
					}

					if (mCircuits.buses.length == 0 || !foundMachine) {
						if (!foundMachine) {
							// this recipe couldn't be added to any existing input bus, check if there is a conflict with just fluids
							let allInputsBus = getAllInputsPlusOne(getAllInputsForBus(allInputsFluids, {allItems: {}, allRecipeIdx: {}}, circuitUID), allInputsOne);

							//if (checkTotalConflicts(allInputsBus)) {
							if (checkTotalConflicts(allInputsBus, recipe)) {
								// if there was a conflict, exit loop now so the recipe gets added to a new machine below
								break;
							}
						}

						//console.log("recipe",recipe,`added to allInputsGrouped[${machineIdx}].circuits[${circuitUID}].buses[<new>]`);
						// adding this recipe to any existing item bus will cause a conflict, 
						// but using a new item bus will fix it, add it to a new item bus
						mCircuits.buses.push({
							allItems: {...allInputsOne.items},
							allRecipeIdx: {...allInputsOne.recipeIdx},
							recipes: [recipe]
						});
						foundMachine = true;
						break;
					}
				}
				if (!foundMachine) {
					// this recipe couldn't be added to any existing machine, there's probably a fluid conflict. add it to a new machine
					//console.log("recipe",recipe,`added to allInputsGrouped[<new>]`);
					allInputsGrouped.push({
						allFluids: {...allInputsOne.fluids},
						circuits: {
							[circuitUID]: {
								circuitName: circuit ? circuit.cfg : "none",
								buses: [{
									allItems: {...allInputsOne.items},
									allRecipeIdx: {...allInputsOne.recipeIdx},
									recipes: [recipe]
								}]
							}
						}
					});
				}
			}

			//console.log("allInputsGrouped",allInputsGrouped);
			//console.log("allConflicts",conflictsWith);
			//console.log("recipes",recipes);

			// draw each group on screen
			conflict_results.empty();
			let machinesList = $("<div>").css({
				display:"flex",
				flexDirection: "column",
				width:"100%",
				overflowX: "auto",
				gap: "4px",
			});
			conflict_results.append(machinesList);


			for(let i in allInputsGrouped) {
				let machine = allInputsGrouped[i];

				let machineTitle = $("<div class='p-2'>").text("Machine " + (1+parseInt(i)));
				let machineCard = $("<div class='machine-card card card-body d-inline-block p-1'>").css({
					//height: "600px",
					flexShrink: 0
				});
				let machineCont = $("<div class='machine-container'>").css({
					display: "flex",
					flexDirection: "row",
					height: "100%", //"calc(100% - 20px)",
					flexShrink: 0,
					gap: "4px"
				})
				machineCard.append(machineTitle);
				machineCard.append(machineCont);
				machinesList.append(machineCard);

				let machineRecipeCount = 0;
				for(let circuitUID in machine.circuits) {
					let mCircuits = machine.circuits[circuitUID];

					let busesCont = $("<div class='buses-container'>").css({
						display: "flex",
						flexDirection: "row",
						//height: "600px",
						flexShrink: 0,
					});
					machineCont.append(busesCont);

					for (let iB in mCircuits.buses) {
						let bus = mCircuits.buses[iB];

						let busTitle = $("<center>").text("Item Input Bus " + (1+parseInt(iB)) + ", Circuit: " + mCircuits.circuitName);
						let busCont = $("<div class='bus-container card card-body d-inline-block p-1'>").css({
							width: "450px",
							//display:"flex",
							//flexDirection: "column",
							height: "100%", //"calc(100% - 32px)",
							overflowY: "auto",
							flexShrink: 0,
							flexGrow: 0
						});
						busCont.append(busTitle);
						busesCont.append(busCont);

						for(let rIdx in bus.recipes) {
							let recipe = bus.recipes[rIdx];
							if (recipe) {
								machineRecipeCount++;
								busCont.append(buildRecipePanel(recipe, false /*, conflictsWith[recipe.idx]*/));
							}
						}
					}
				}
				machineTitle.html(machineTitle.text() + "<span class='text-muted'>, " + machineRecipeCount + " recipes</span>");
			}
		}

		function calculateConflictsSplit() {
			// add each selected recipe to the list one by one and if adding that causes a recipe conflict, create a new group for that recipe
			conflict_results.empty();
			conflict_results.text("Calculating...");

			function checkTotalConflicts(allInputs) {
				for(let i in recipes) {
					let otherRecipe = recipes[i];

					if (allInputsConflict(allInputs, otherRecipe)) {
						return true;
					}
				}

				return false;
			}

			// allInputsGrouped - structure {[circuitNum] = [array of machines]}
			var allInputsGrouped = {none:[]}
			for(let i in added_recipes_list) {
				let recipe = added_recipes_list[i];

				let circuit = recipe.iI.find(i => i.a == 0 && typeof i.cfg != "undefined");
				if (circuit) {
					if (!allInputsGrouped[circuit.cfg]) {
						allInputsGrouped[circuit.cfg] = [];
					}
				}

				let group = allInputsGrouped[circuit ? circuit.cfg : "none"];

				if (group.length == 0) {
					// no machines added yet, add current recipe to new machine
					group.push(getAllInputs([recipe]));
				} else {
					let foundMachine = false;
					let allInputsOne = getAllInputs([recipe]);
					for(let iG = 0; iG < group.length; iG++) {
						let allInputs = getAllInputsPlusOne(group[iG], allInputsOne);

						if (!checkTotalConflicts(allInputs)) {
							// adding this recipe will not cause a conflict, add it to this machine
							group[iG] = allInputs;
							foundMachine = true;
							break;
						}
					}
					if (!foundMachine) {
						// this recipe couldn't be added to any existing machine, add it to a new machine
						group.push(allInputsOne);
					}
				}
			}

			// draw each group on screen
			conflict_results.empty();
			let machinesList = $("<div>").css({
				display:"flex",
				width:"100%",
				overflowX: "auto",
				gap: "4px",
			});
			conflict_results.append(machinesList);

			let idx = 0;
			for(let i in allInputsGrouped) {
				let group = allInputsGrouped[i];
				for(let iG in group) {
					idx++;
					let machine = group[iG];

					let machineCont = $("<div class='card card-body d-inline-block p-1'>").css({
						width: "450px",
						height: "600px",
						flexShrink: 0
					});
					let machineTitle = $("<center>").text("Machine " + idx + ", Circuit: " + i);
					let listCont = $("<div class='p-1'>").css({
						display:"flex",
						flexDirection: "column",
						height: "calc(100% - 24px)",
						overflowY: "auto"
					});
					machineCont.append([machineTitle,listCont]);
					machinesList.append(machineCont);

					let recipeCount = 0;
					for(let rIdx in machine.recipeIdx) {
						let recipe = getRecipeFromIdx(rIdx);
						if (recipe) {
							recipeCount++;
							listCont.append(buildRecipePanel(recipe));
						}
					}
					machineTitle.html(machineTitle.text() + "<span class='text-muted'>, " + recipeCount + " recipes</span>");
				}
			}
		}

		function calculateConflictsList() {
			// simply dump all inputs in one list and list the conflicts
			var allInputs = getAllInputs(added_recipes_list);
			conflict_results.empty();

			var total_conflicts = [];
			var partial_conflicts = [];

			for(let i in recipes) {
				let otherRecipe = recipes[i];

				if (allInputsConflict(allInputs,otherRecipe)) {
					var pnl = buildRecipePanel(otherRecipe);
					total_conflicts.push(pnl);
				}
			}

			if (total_conflicts.length > 0) {
				conflict_results.append("<div class='p-2 mb-2 bg-danger text-center'>Total conflicts <small class='text-muted'>(All inputs conflict)</small><br><small></div>").append(total_conflicts);
			}

			for(let i in added_recipes_list) {
				let otherRecipe = added_recipes_list[i];
				if (partialInputsConflict(allInputs, otherRecipe)) {
					var pnl = buildRecipePanel(otherRecipe);
					partial_conflicts.push(pnl);
				}
			}

			if (partial_conflicts.length > 0) {
				var partial_header = $("<div class='p-2 mb-2 bg-warning text-center link-pointer'>Partial conflicts (" + partial_conflicts.length + "x) <small>"+
					"(Parts of inputs conflict)</small><br><small>These conflicts usually don't cause any issues</small></div>");
				var partial_content = $("<div class='collapse'>");
				partial_header.click(function() {
					partial_content.collapse("toggle");
				});
				conflict_results.append().append([partial_header,partial_content.append(partial_conflicts)]);
			}
		}

		if (logicMode == "bus-isolation") {
			calculateConflictsBusIsolation();
		} else if (logicMode == "list") {
			calculateConflictsList();
		} else if (logicMode == "browse") {
			calculateBrowse();
		} else {
			calculateConflictsSplit();
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

	function getAllInputsPlusOne(allInputs, plusOne) {
		return {
			items: {...allInputs.items, ...plusOne.items},
			fluids: {...allInputs.fluids, ...plusOne.fluids},
			circuits: {...allInputs.circuits, ...plusOne.circuits},
			recipeIdx: {...allInputs.recipeIdx, ...plusOne.recipeIdx}
		};
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
				if (item.a == 0 && typeof item.cfg != "undefined") {
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

	function allInputsConflict(allInputs, otherRecipe, debug) {
		if (otherRecipe.iO.length == 0 && otherRecipe.fO.length == 0) {
			return false;
		}

		if (typeof allInputs.recipeIdx[otherRecipe.idx] != "undefined") {
			if (debug) console.log("it's already added");
			return false;
		}

		var circuit = getCircuitForRecipe(otherRecipe);
		if (circuit) {
			if (typeof allInputs.circuits[getCircuitUID(circuit)] == "undefined") {
			if (debug) console.log("needed circuit doesnt exist");
				return false;
			}
		}

		for(let i in otherRecipe.iI) {
			let item = otherRecipe.iI[i];
			if (item.a == 0) continue;

			if (typeof allInputs.items[item.uN] == "undefined") {
				if (debug) console.log("needed item ",item.lN," doesnt exist");
				// missing item = no conflict
				return false;
			}
		}

		for(let i in otherRecipe.fI) {
			let fluid = otherRecipe.fI[i];
			if (fluid.a == 0) continue;

			if (typeof allInputs.fluids[fluid.uN] == "undefined") {
				if (debug) console.log("needed fluid ",fuid.lN," doesnt exist");
				// missing fluid = no conflict
				return false;
			}
		}

		// if it got this far it means all items exist, now check if all amounts match
		// EDIT: amounts do not matter
		/*
		for(let i in otherRecipe.iI) {
			let item = otherRecipe.iI[i];
			if (item.a == 0) continue;
			if (!allInputs.items[item.uN].every(i => i == item.a)) {
				if (debug) console.log("needed item ",item.lN," doesn't have the same amount");
				// same amounts = no conflict
				return true;
			}
		}

		for(let i in otherRecipe.fI) {
			let fluid = otherRecipe.fI[i];
			if (fluid.a == 0) continue;
			if (!allInputs.fluids[fluid.uN].every(f => f == fluid.a)) {
				if (debug) console.log("needed fluid ",fluid.lN," doesn't have the same amount");
				// same amounts = no conflict
				return true;
			}
		}
		*/
		
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

	function getItemNames(i,f,sep) {
		return (i.concat(f).map(r => r.lN + (r.cfg ? " " + r.cfg : "")).join(sep || " "));
	}

	function addLoadingSettings(recipes) {
		if (loading_settings !== false) {
			for(let i=loading_settings.recipes.length-1;i>=0;i--) {
				let recipe = loading_settings.recipes[i];
				if (typeof recipe.idx != "undefined") {
					let otherRecipe = recipes[recipe.idx];

					if (JSON.stringify(recipe) == JSON.stringify(otherRecipe)) {
						// match found
						loading_settings.recipes.splice(i,1);
						addRecipe(recipe.idx);
						//console.log("found recipe the normal way");
					} else {
						//console.log("match not found, deleting idx to prepare for more comparisons");
						// match not found
						delete recipe.idx;
					}
				}
			}

			if (loading_settings.recipes.length > 0) {
				let negative_indexes = 0;
				//console.log("recipes not found:",loading_settings.recipes);
				// some recipes weren't found by idx, try to find them through iteration and comparison instead

				for(let ii = loading_settings.recipes.length-1; ii >= 0; ii--) {
					let recipe = loading_settings.recipes[ii];
					let found = false;
					for(let i in recipes) {
						let cpy = {...recipes[i]};
						delete cpy.idx;
						let cpyStr = JSON.stringify(cpy);

						if (JSON.stringify(recipe) == cpyStr) {
							addRecipe(recipes[i].idx);
							found = true;
							break;
						}
					}

					if (!found) {
						//console.log("Loaded recipe " + JSON.stringify(recipe) + " not found. Adding it anyway, but note that it may be from a different version.");
						negative_indexes--;
						recipe.idx = negative_indexes;
						addRecipe(recipe);
						loading_settings.recipes.splice(ii,1);
					}
				}
			}
			loading_settings = false;
			loading_add = false;

			calculateConflicts();
			saveSettings();
		} else {
			if (logicMode == "browse") {calculateConflicts();}
		}
	}

	function buildConflictLookup(recipes) {
		var item_recipe_lookup = {};
		var fluid_recipe_lookup = {};
		recipes_conflict_lookup = {};
		var conflictless = {};

		for(let idx in recipes) {
			let recipe = recipes[idx];

			// build lookups
			let itemConflicts = {};
			let fluidConflicts = {};
			for(let i in recipe.iI) {
				let item = recipe.iI[i];
				let uid = getUID(item);

				if (item_recipe_lookup[uid]) {
					item_recipe_lookup[uid].push(recipe.idx);
				} else {
					item_recipe_lookup[uid] = [recipe.idx];
				}

				itemConflicts[uid] = item_recipe_lookup[uid];
			}
			for(let i in recipe.fI) {
				let fluid = recipe.fI[i];
				let uid = getUID(fluid);

				if (fluid_recipe_lookup[uid]) {
					fluid_recipe_lookup[uid].push(recipe.idx);
				} else {
					fluid_recipe_lookup[uid] = [recipe.idx];
				}
				
				fluidConflicts[uid] = fluid_recipe_lookup[uid];
			}
			recipes_conflict_lookup[recipe.idx] = {
				recipe: recipe,
				itemConflicts: itemConflicts,
				fluidConflicts: fluidConflicts,
			}
		}

		/*
		OTHER METHOD
		function findRecipesWithInput(self, conflictsKey, tblOuterKey, tblInnerKey) {
			let anyFound = false;
			for(let idx in recipes_conflict_lookup) {
				if (idx == self.idx) {continue;}
				let lookups = recipes_conflict_lookup[idx];
				if (typeof lookups[tblOuterKey] != "undefined") {
					if (typeof lookups[tblOuterKey][tblInnerKey] != "undefined") {
						if (typeof self[conflictsKey][tblInnerKey] == "undefined") {
							self[conflictsKey][tblInnerKey] = {};
						}
						self[conflictsKey][tblInnerKey][idx] = true;
						anyFound = true;
					}
				}
			}
			return anyFound;
		}

		// create conflict lookups
		for(let idx in recipes_conflict_lookup) {
			let lookups = recipes_conflict_lookup[idx];
			let amountFound = 0;
			let amountInputs = 0;
			for(let tblInnerKey in lookups.iILookup) {
				amountInputs++;
				if (findRecipesWithInput(lookups, "itemConflicts", "iILookup", tblInnerKey)) {
					amountFound++;
				}
			}
			for(let tblInnerKey in lookups.fILookup) {
				amountInputs++;
				if (findRecipesWithInput(lookups, "fluidConflicts", "fILookup", tblInnerKey)) {
					amountFound++;
				}
			}

			if (amountFound < amountInputs) {
				delete recipes_conflict_lookup[idx];
				conflictless[idx] = {recipe:recipes[idx], lookups:lookups};
			}
		}
		*/

		function recipeFilter(recipe, otherRecipeIdx) {
			if (otherRecipeIdx == recipe.idx) {
				return false;
			}

			var otherRecipe = null;

			if (browse_hideIdenticalOutputs) {
				otherRecipe = getRecipeFromIdx(otherRecipeIdx);
				var outputsIdentical = true;
				for(let item of otherRecipe.iO) {
					if (!recipe.iO.some(itm => itm.uN == item.uN && itm.cfg == item.cfg)) {
						outputsIdentical = false;
						break;
					}
				}
				for(let fluid of otherRecipe.fO) {
					if (!recipe.fO.some(fl => fl.uN == fluid.uN && fl.cfg == fluid.cfg)) {
						outputsIdentical = false;
						break;
					}
				}
				if (outputsIdentical) {
					return false;
				}
			}

			if (browse_hideDifferentCircuits) {
				if (otherRecipe == null) {otherRecipe = getRecipeFromIdx(otherRecipeIdx);}

				var circuit = getCircuitForRecipe(otherRecipe);
				if (circuit) {
					var myCircuit = getCircuitForRecipe(recipe);
					if (myCircuit && circuit.cfg != myCircuit.cfg) {
						return false;
					}
				}
			}
			
			return true;
		}

		for(let idx in recipes_conflict_lookup) {
			let conflict = recipes_conflict_lookup[idx];
			let amountFound = 0;
			let amountInputs = 0;

			for(let uid in conflict.itemConflicts) {
				amountInputs++;
				conflict.itemConflicts[uid] = ([...conflict.itemConflicts[uid]]).filter(i => recipeFilter(conflict.recipe,i));
				if (conflict.itemConflicts[uid].length > 0) {
					amountFound++;
				}
			}

			for(let uid in conflict.fluidConflicts) {
				amountInputs++;
				conflict.fluidConflicts[uid] = ([...conflict.fluidConflicts[uid]]).filter(i => recipeFilter(conflict.recipe,i));
				if (conflict.fluidConflicts[uid].length > 0) {
					amountFound++;
				}
			}

			if (amountFound < amountInputs) {
				conflictless[idx] = conflict;
				delete recipes_conflict_lookup[idx];
			}
		}

		recipes_conflict_amount = Object.keys(recipes_conflict_lookup).length;
		/*
		console.log("RECIPES_CONFLICT_LOOKUP",recipes_conflict_lookup);
		console.log("CONFLICTLESS",conflictless);
		console.log("CONFLICT AMOUNT",Object.keys(recipes_conflict_lookup).length);
		console.log("CONFLICTLESS AMOUNT",Object.keys(conflictless).length);
		//*/
	}

	function listRecipes(machine) {
		if (!downloaded_machines[machine]) return;

		recipe_search_result.empty();
		current_recipes_list = [];

		var recipes = downloaded_machines[machine].recs;
		for(let idx in recipes) {
			let recipe = recipes[idx];
			recipe.idx = parseInt(idx);

			current_recipes_list.push({
				recipe: recipe,
				iNames: getItemNames(recipe.iI,recipe.fI).toLowerCase(),
				oNames: getItemNames(recipe.iO,recipe.fO).toLowerCase(),
			});
		}

		buildConflictLookup(recipes);
		doSearch();

		addLoadingSettings(recipes);

		// TESTING
		/*
		recipe_search.selectpicker('val','442');
		recipe_search.selectpicker('val','542');
		recipe_search.selectpicker('val','672');
		recipe_search.selectpicker('val','513');
		recipe_search.selectpicker('val','199');
		*/
	}



	// TESTING
	/*
	selected_machine = "Large Chemical Reactor.json";
	downloadMachine(selected_machine);
	*/

	settings_input.on("input",() => {
		if (settings_input_written == false && settings_input.val() != "") {
			var jsonObj = null;

			try {
				jsonObj = JSON.parse(settings_input.val());
			} catch (e) {
				alert("Invalid json object. Error: " + e);
				return;
			}

			loading_settings = jsonObj;
			machine_search.selectpicker("val", jsonObj.machine);
			collapse.collapse("show");
		}
	}).click((e) => {
		settings_input.select();
		e.preventDefault();
		e.stopPropagation();
	});

	version_input.change(() => {
		if (folderName != version_input.val()) {
			folderName = version_input.val();
			resetMachineList();
		}
	}).click((e) => {
		e.stopPropagation();
	});

	function setAutosave(n) {
		autosave_name = n;
		if (autosave_name != "") {
			var pnl = $(".autosave-name",card);
			pnl.show().text("Autosaving: " + autosave_name);
			if ($("button",pnl).length == 0) {
				pnl.addClass("position-relative");
				pnl.prepend(
					$('<button type="button" class="close link-pointer" style="z-index:10; top:-6px; right:-20px;" aria-label="Close">'+
						'<span aria-hidden="true">&times;</span>'+
					'</button>')
					.click((e)=>{setAutosave(""); e.preventDefault(); e.stopPropagation(); return true;})
					.attr("title","Stop autosaving").tooltip()
				);
			}
		} else {
			$(".autosave-name",card).hide();
		}
	}

	try {
		var saved = JSON.parse(localStorage["recipe_conflict_saved"] || "[]");
		var saveload_list = $(".recipe-conflict-saveload-list",card);
		var saveload_new = $(".recipe-conflict-save-new",card);

		function save() {
			localStorage["recipe_conflict_saved"] = JSON.stringify(saved);
			listSaved();
		}

		function listSaved() {
			saveload_list.empty();

			for(let i in saved) {
				let row = saved[i];
				
				var cpy = saveload_new.clone();
				$(".btn-danger",cpy).click(() => {
					if (confirm("Are you sure you want to delete this?")) {
						if (row.name == autosave_name) {
							setAutosave("");
						}
						saved.splice(i,1);
						save();
					}
				}).show();

				$(".btn-primary",cpy).click(() => {
					setAutosave(row.name);
					loading_settings = JSON.parse(JSON.stringify(row.settings)); // clone object
					machine_search.selectpicker("val", row.settings.machine);
				}).show();

				$(".btn-secondary",cpy).click(() => {
					if (row.settings.machine != machine_search.val()) {
						alert("Different machine, can't add.");
						return;
					} else {
						setAutosave("");
						loading_add = true;
						loading_settings = JSON.parse(JSON.stringify(row.settings));
						addLoadingSettings(downloaded_machines[machine_search.val()].recs);
					}
				}).show().tooltip();

				$(".btn-success",cpy).click(() => {
					if (confirm("Are you sure you want to overwrite that save?")) {
						saved[i] = {
							name: row.name,
							settings: getSettingsToSave()
						};
						save();
					}
				}).show();

				$(".form-control",cpy).hide();
				$(".newlabel",cpy).hide();
				$(".namelabel",cpy).show().text(row.name + " (" + (row.settings.recipes ? row.settings.recipes.length : 0) + " recipes)");
				saveload_list.append(cpy);
			}
		}
		listSaved();

		$(".btn-primary",saveload_new).hide();
		$(".btn-secondary",saveload_new).hide();
		$(".btn-danger",saveload_new).hide();
		$(".namelabel",saveload_new).hide()
		$(".btn-success",saveload_new).click(() => {
			var name = $(".form-control",saveload_new).val();
			if (name == "") return;

			$(".form-control",saveload_new).val("");

			for(let i in saved) {
				let row = saved[i];
				if (row.name == name) {
					if (confirm("Saved settings with that name already exists. Overwrite?")) {
						saved[i] = {
							name: name,
							settings: getSettingsToSave()
						};
						setAutosave(name);
						save();
					}
					return;
				}
			}

			saved.push({
				name: name,
				settings: getSettingsToSave()
			});

			setAutosave(name);
			save();
		});
	} catch (e) {
		alert("Unable to parse saved settings. Error: " + e + ". The json has been dumped to console.");
		console.log("--- Saved recipes:");
		console.log(localStorage["recipe_conflict_saved"]);
		console.log("--- Run the following command in console to delete saved recipes:");
		console.log("delete localStorage['recipe_conflict_saved'];");
	}
});