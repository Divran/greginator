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
})();