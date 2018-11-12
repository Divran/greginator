(function() {
	var card = $( "#gt-tool-browser" );

	var header = $( ".card-header", card );
	header.addClass( "link-pointer" );
	var collapse = $( ".collapse", card );

	header.click(function() {
		collapse.collapse( "toggle" );
	});

	function getSelectedSort() {
		var sort = $("input[name='gt-tool-browser-sort']:checked",card).val()

		if (sort == "durability") { // Sort by durability first, speed second, tier third
			return function(a,b) {
				if (a.durability == b.durability) {
					if (a.speed == b.speed) {
						if (a.tier == b.tier) {return 0;}
						return (a.tier < b.tier) ? 1 : -1;
					}
					return (a.speed < b.speed) ? 1 : -1;
				}
				return (a.durability < b.durability) ? 1 : -1;
			}
		} else if (sort == "speed") { // Sort by speed first, durability second, tier third
			return function(a,b) {
				if (a.speed == b.speed) {
					if (a.durability == b.durability) {
						if (a.tier == b.tier) {return 0;}
						return (a.tier < b.tier) ? 1 : -1;
					}
					return (a.durability < b.durability) ? 1 : -1;
				}
				return (a.speed < b.speed) ? 1 : -1;
			}
		} else if (sort == "damage") { // Sort by damage first, durability second, age third
			return function(a,b) {
				if (a.tier == b.tier) {
					if (a.durability == b.durability) {
						if (a.age == b.age) {return 0;}
						return (a.age < b.age) ? 1 : -1;
					}
					return (a.durability < b.durability) ? 1 : -1;
				}
				return (a.tier < b.tier) ? 1 : -1;
			}
		}
	}

	function getSelectedAge() {
		var val = parseInt($("input[name='gt-tool-browser-filter-age']:checked",card).val());

		return function(tool) {
			return tool.age <= val;
		}
	}

	var fortune = $( "#gt-tool-browser-filter-fortune", card );
	function getFortune() {
		var val = fortune.is(":checked");

		return function(tool) {
			if (val) {
				return (tool.enchant.toLowerCase().indexOf("fortune") != -1);
			} else {
				return true;
			}
		}
	}
	var silktouch = $( "#gt-tool-browser-filter-silk-touch", card );
	function getSilkTouch() {
		var val = silktouch.is(":checked");

		return function(tool) {
			if (val) {
				return (tool.enchant.toLowerCase().indexOf("silk touch") != -1);
			} else {
				return true;
			}
		}
	}

	function getMiningTier() {
		var tier = parseInt($("input[name='gt-tool-browser-filter-tier']:checked",card).val());

		return function(tool) {
			return (tool.tier >= tier);
		}
	}

	var garbage = $( "#gt-tool-browser-filter-garbage", card );
	function getHideGarbage() {
		var val = garbage.is(":checked");

		return function(tool) {
			if (val) {
				return (tool.speed >= 4 && tool.tier >= 2 && tool.durability >= 25600);
			} else {
				return true;
			}
		}
	}

	var recommended = $( "#gt-tool-browser-filter-recommended", card );
	function getShowRecommended() {
		var val = recommended.is(":checked");

		return function(tool) {
			if (val) {
				return (typeof tool.recommended != "undefined");
			} else {
				return true;
			}
		}
	}

	function update() {
		var tools = data.getCopy("tools");
		var filters = [
			getShowRecommended(),
			getSelectedAge(),
			getFortune(),
			getSilkTouch(),
			getMiningTier(),
			getHideGarbage()
		];

		// Check if recommendation is enabled
		var show_recommended = recommended.is(":checked");

		for(var i=tools.length-1;i>=0;i--) { // iterate backwards to allow deleting
			let tool = tools[i];

			let filtered = false;
			for(let j=0;j<filters.length;j++) {
				if (j==filters.length-1 && show_recommended) {
					break; // if show recommended is on, ignore hide garbage filter
				}

				if (!filters[j]( tool )) {
					filtered = true;
					break;
				}
			}

			if (filtered) {
				tools.splice(i,1);
			}
		}

		tools.sort(getSelectedSort());

		var age_names = ["Stm","LV","MV","HV","EV","IV+"];


		var html = [];
		for(var i=0;i<tools.length;i++) {
			let tool = tools[i];

			html.push("<tr>");
			html.push("<td>"+escapehtml(tool.material)+"</td>");
			html.push("<td>"+escapehtml(tool.durability)+"</td>");
			html.push("<td>"+escapehtml(tool.speed)+"</td>");
			html.push("<td>"+escapehtml(tool.tier)+"</td>");
			html.push("<td>"+age_names[tool.age]+"</td>");
			html.push("<td class='d-none d-md-table-cell'>"+escapehtml(tool.enchant)+"</td>");
			if (show_recommended) {
				html.push("<td>"+escapehtml(tool.recommended)+"</td>");
			}
			html.push("<td class='d-none d-lg-table-cell'>"+escapehtml(tool.comment || "")+"</td>");
			html.push("</tr>");
		}

		// Check if recommendation is enabled
		if (show_recommended) {
			$(".gt-tool-browser-thead-recommended",card).show();
		} else {
			$(".gt-tool-browser-thead-recommended",card).hide();
		}

		var tbl = $("tbody",card);
		tbl.empty();
		tbl.append(html.join(""));
	}

	var elems = [
		$("input[name='gt-tool-browser-sort']",card),
		$("input[name='gt-tool-browser-filter-tier']",card),
		$("input[name='gt-tool-browser-filter-age']",card),
		fortune,
		silktouch,
		garbage,
		recommended
	];

	var tid;
	$.each(elems,function(key,val) {
		val.change(function() {
			if (tid) {clearTimeout(tid);}
			tid = setTimeout(update,50);
		});
	});
	update();
})();