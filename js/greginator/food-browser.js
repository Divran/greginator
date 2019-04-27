onVersionChanged(function(version) {
	var card = $( "#gt-food-browser" );

	if (version == "it2") {
		card.hide();
		return;
	} else {
		card.show();
	}

	var header = $( ".card-header", card );
	header.addClass( "link-pointer" );
	var collapse = $( ".collapse", card );

	header.off("click");
	header.on("click",function() {
		collapse.collapse( "toggle" );
	});

	function getSelectedSort() {
		var sort = $("input[name='gt-food-browser-sort']:checked",card).val()

		if (sort == "food-value") { // Sort by food value first, saturation second, compost third
			return function(a,b) {
				if (a.heal == b.heal) {
					if (a.saturation == b.saturation) {
						if (a.compost_amount == b.compost_amount) {return 0;}
						return (a.compost_amount < b.compost_amount) ? 1 : -1;
					}
					return (a.saturation < b.saturation) ? 1 : -1;
				}
				return (a.heal < b.heal) ? 1 : -1;
			}
		} else if (sort == "saturation") { // Sort by saturation first, food value second, tier third
			return function(a,b) {
				if (a.saturation == b.saturation) {
					if (a.heal == b.heal) {
						if (a.compost_amount == b.compost_amount) {return 0;}
						return (a.compost_amount < b.compost_amount) ? 1 : -1;
					}
					return (a.heal < b.heal) ? 1 : -1;
				}
				return (a.saturation < b.saturation) ? 1 : -1;
			}
		} else if (sort == "compost") { // Sort by compost first, food value second, saturation third
			return function(a,b) {
				if (a.compost_amount == b.compost_amount) {
					if (a.heal == b.heal) {
						if (a.saturation == b.saturation) {return 0;}
						return (a.saturation < b.saturation) ? 1 : -1;
					}
					return (a.heal < b.heal) ? 1 : -1;
				}
				return (a.compost_amount < b.compost_amount) ? 1 : -1;
			}
		}
	}

	function update() {
		var food = data.getCopy("food",version);
		food.sort(getSelectedSort());

		var html = [];
		for(var i=0;i<food.length;i++) {
			let f = food[i];

			html.push("<tr>");
			html.push("<td>"+escapehtml(f.name)+"</td>");
			html.push("<td>"+escapehtml(f.mod)+"</td>");
			html.push("<td>"+escapehtml(f.heal)+"</td>");
			html.push("<td>"+escapehtml(f.saturation)+"</td>");
			html.push("<td>"+escapehtml(f.compost_amount)+"</td>");
			html.push("</tr>");
		}

		var tbl = $("tbody",card);
		tbl.empty();
		tbl.append(html.join(""));
	}

	var elems = [
		$("input[name='gt-food-browser-sort']",card)
	];

	var tid;
	$.each(elems,function(key,val) {
		val.change(function() {
			if (tid) {clearTimeout(tid);}
			tid = setTimeout(update,50);
		});
	});
	update();

});