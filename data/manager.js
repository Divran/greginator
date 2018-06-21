(function() {
	var registered_data = {};

	function add(name,data) {
		registered_data[name] = data;
	}

	function get(name) {
		return registered_data[name];
	}

	function getCopy(name) {
		return JSON.parse(JSON.stringify(get(name)));
	}

	window.data = {
		add:add,
		get:get,
		getCopy:getCopy
	}
})();
