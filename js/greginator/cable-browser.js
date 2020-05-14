onVersionChanged(function(version) {
	var card = $( "#gt-cable-browser" );

	if (version == "it3") {
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

	var cables = data.getCopy("gt_cables",version);

	cables.sort(function(a,b) {
		// sort by lowest voltage first
		// then lowest loss
		// then highest amps
		// then alphabetically

		if (a.voltage == b.voltage) {
			if (a.loss == b.loss) {
				if (a.amperage_mult == b.amperage_mult) {
					if (a.name == b.name) {return 0;}
					return a.name > b.name ? 1 : -1;
				}
				return a.amperage_mult > b.amperage_mult ? 1 : -1;
			}
			return a.loss > b.loss ? 1 : -1;
		}
		return a.voltage > b.voltage ? 1 : -1;
	});

	function update(recommended) {
		var html = [];
		for(var i=0;i<cables.length;i++) {
			let c = cables[i];

			if (recommended && (!c.recommended || c.recommended == "")) {
				continue;
			}

			html.push("<tr>");
			html.push("<td>"+escapehtml(c.name)+"</td>");
			html.push("<td>"+escapehtml(c.voltage)+"</td>");
			html.push("<td>"+escapehtml(c.amperage_mult+"x ("+(c.amperage_mult*12))+"x)</td>");
			html.push("<td>"+escapehtml(c.loss)+"</td>");
			if (recommended) {
				html.push("<td>"+(c.recommended||"")+"</td>");
			}
			html.push("</tr>");
		}

		var tbl = $("tbody",card);
		tbl.empty();
		tbl.append(html.join(""));
		if (recommended) {
			$(".gt-cables-recommended",card).show();
		} else {
			$(".gt-cables-recommended",card).hide();
		}
	}

	var recommended = $("#gt-cable-browser-recommended",card);
	function recommendedChanged() {
		update(recommended.is(":checked"));

	}
	recommended.change(recommendedChanged);
	recommendedChanged();
});