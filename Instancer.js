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
