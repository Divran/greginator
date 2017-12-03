(function() {
	var registered_data = {};

	function add(name,data) {
		registered_data[name] = data;
	}

	function get(name) {
		return JSON.parse(JSON.stringify(registered_data[name]));
	}

	window.data = {
		add:add,
		get:get
	}
})();
