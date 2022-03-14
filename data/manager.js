(function() {
	var registered_data = {it2:{},it3:{},gtnh:{}};

	function add(name,version,data) {
		registered_data[version][name] = data;
	}

	function get(name,version) {
		return registered_data[version][name];
	}

	function getCopy(name,version) {
		return JSON.parse(JSON.stringify(get(name,version)));
	}

	window.data = {
		add:add,
		get:get,
		getCopy:getCopy
	}
})();
