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

		if (sort == "durability") { // Sort by durability first, speed second
			return function(a,b) {
				if (a.durability == b.durability) {
					if (a.speed == b.speed) {return 0;}
					return (a.speed < b.speed) ? 1 : -1;
				}
				return (a.durability < b.durability) ? 1 : -1;
			}
		} else if (sort == "speed") { // Sort by speed first, durability second
			return function(a,b) {
				if (a.speed == b.speed) {
					if (a.durability == b.durability) {return 0;}
					return (a.durability < b.durability) ? 1 : -1;
				}
				return (a.speed < b.speed) ? 1 : -1;
			}
		} else if (sort == "damage") { // Sort by damage first, durability second
			return function(a,b) {
				if (a.tier == b.tier) {
					if (a.durability == b.durability) {return 0;}
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

	function update() {
		var sort = getSelectedSort();
		var age = getSelectedAge();
		var fortune = getFortune();
		var silktouch = getSilkTouch();
		var miningtier = getMiningTier();

		var tools = data.getCopy("tools");

		for(var i=tools.length-1;i>=0;i--) { // iterate backwards to allow deleting
			let tool = tools[i];
			if (!age(tool) || !fortune(tool) || !silktouch(tool) || !miningtier(tool)) {
				tools.splice(i,1);
			}
		}

		tools.sort(sort);

		var html = [];
		for(var i=0;i<tools.length;i++) {
			let tool = tools[i];

			html.push("<tr>");
			html.push("<td>"+escapehtml(tool.material)+"</td>");
			html.push("<td>"+escapehtml(tool.durability)+"</td>");
			html.push("<td>"+escapehtml(tool.speed)+"</td>");
			html.push("<td>"+escapehtml(tool.tier)+"</td>");
			html.push("<td class='d-none d-md-table-cell'>"+escapehtml(tool.enchant)+"</td>");
			html.push("<td class='d-none d-lg-table-cell'>"+escapehtml(tool.comment || "")+"</td>");
			html.push("</tr>");
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
		silktouch
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
