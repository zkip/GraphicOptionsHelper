define(function Anima() {
	let weight = 0,
		name = "";
	return {
		setWeight(v) {
			weight = v;
		},
		getWeight() {
			return weight;
		},
		setName(v) {
			name = v;
		},
		getName() {
			return name;
		},
	};
});
