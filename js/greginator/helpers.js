(function() {
	var escape_element;

	window.escapehtml = function( text ) {
		if (!escape_element) {
			escape_element = $( "<div>" );
		}

		escape_element.text( text );
		var ret = escape_element.text();
		escape_element.text( "" );
		return ret;
	}

	window.escapehtmlWithLineBreaks = function( text ) {
		return escapehtml(text).replace( /\n/g, "<br>");
	}

	window.formatTime = function(time) {
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
		return timestr.join(", ");
	}
})();