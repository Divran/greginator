onVersionChanged(function(version) {
	var card = $( "#gt-tutorials" );

	if (version != "gtnh") {
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

	var tutorialSelectorBody = $($(".collapse > .card-body", card)[0]);
	var tutorialBody = $($(".collapse > .card-body", card)[1]);
	var tutorialButtons = $(".tutorial-btn", tutorialSelectorBody);
	var tutorialMenuBtn = $("#gt-tutorials-menu-btn", card);
	tutorialMenuBtn.click(function(e) {
		e.stopPropagation();
		selectedTutorial = "";
		tutorialSelectorBody.show();
		tutorialBody.empty().hide();
	});


	tutorialButtons.click(function() {
		selectedTutorial = $(this).data("tutorialname");
		tutorialSelectorBody.hide();

		$.get("tutorials/" + selectedTutorial + "/tutorial.html",function(content) {
			tutorialBody.html(content).show();
		});
	});


	var selectedTutorial = "";
	/*
	PAGINATED TUTORIALS (disabled for now, scrolling is nicer anyway)

	var activeTab = 0;
	var activePages;

	function goToPage(n) {
		activeTab = n;
		activePages.hide();
		$(activePages[n]).show();

		var prev = $(".page-item-prev",tutorialBody);
		var next = $(".page-item-next",tutorialBody);
		var tabs = $(".page-item-numbered",tutorialBody);

		tabs.removeClass("disabled").removeClass("active");
		$(".page-item-" + n, tutorialBody).addClass("disabled").addClass("active");

		prev.removeClass("disabled");
		next.removeClass("disabled");
		if (n == 0) {
			prev.addClass("disabled");
		}
		else if (n == (activePages.length-1)) {
			next.addClass("disabled");
		}
	}

	function makePrevNextButtons() {
		function makeGoToPage(n) {
			return function() {
				goToPage(n);
			}
		}

		var p = $("<ul class='pagination'></ul>");
		var prev = $("<li class='page-item page-item-prev'><a class='page-link'>&laquo;</a></li>").click(function() {
			if (activeTab > 0) {
				goToPage(activeTab - 1);
			}
		});
		var next = $("<li class='page-item page-item-next'><a class='page-link'>&raquo;</a></li>").click(function() {
			if (activeTab < (activePages.length-1)) {
				goToPage(activeTab + 1);
			}
		});
		var pgs = [];

		for(let i = 0; i<activePages.length;i++) {
			let pg = $("<li class='page-item page-item-numbered page-item-" + (i) + "'><a class='page-link'>" + (i+1) + "</a></li>").click(makeGoToPage(i));
			pgs.push(pg);
		}

		p.append(prev);
		p.append(pgs);
		p.append(next);

		return $("<div class='d-flex w-100'>").append(p).css("justify-content","center");
	}

	tutorialButtons.click(function() {
		selectedTutorial = $(this).data("tutorialname");
		activeTab = 0;
		tutorialSelectorBody.hide();

		$.get("tutorials/" + selectedTutorial + "/tutorial.html",function(content) {
			tutorialBody.append(content);

			activePages = $(".tutorial-page",tutorialBody);
			activePages.hide();
			$(activePages[0]).show();

			tutorialBody.prepend(makePrevNextButtons());
			tutorialBody.append(makePrevNextButtons());

			goToPage(0);
		});
	});
	*/
});