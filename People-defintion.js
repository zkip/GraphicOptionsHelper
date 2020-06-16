define(function People() {
	let name = "";
	const setName = (v) => (name = v);
	const getName = () => name;
	return {
		setName,
		getName,
	};
});

// add page
defineView("plink/set", () => {});
