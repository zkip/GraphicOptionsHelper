function render(name, ...props) {
	if (CstorM.has(name)) {
		const cstor = CstorM.get(name);
		// Lifecycle::init
		const tail = cstor(...props);

		const { modifiers } = tail;

		listen("updated", ({ variables }) => {
			const effected_nodes = [];
			variables.map((variable) => {
				const ens = modifiers[variable];
				if (isNotEmpty(ens)) {
					effected_nodes.push(...ens);
				}
			});

			// effected_nodes
		});
	}
}

function genCommitter(modifiers) {
	return (variable_name, value) => {
		const solid_name = parseSolidName(variable_name);
		if (solid_name in modifiers) {
			fire(solid_name);
		}
		return value;
	};
}

function parseSolidName(raw_name) {
	let solid_name = "";

	const rs = raw_name.split(".");
	if (rs.length > 0) {
		solid_name = rs[0];
	}
	return solid_name;
}
