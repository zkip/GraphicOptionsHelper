function makeInstance(name, { ...props } = {}) {
	if (CstorM.has(name)) {
		const cstor = CstorM.get(name);
		// Lifecycle:init
		const tail = cstor({ ...props });

		const root = document.createDocumentFragment();
		const node_DOM_map = {
			// node_name SolidLiteral: DOM
		};

		const { modifiers, children: mutation_map } = tail;

		function solveModifiers(mutated_nodes = Object.keys(mutation_map)) {
			for (const node_name of mutated_nodes) {
				const [mutation_action] = mutation_map[node_name];
				const rs = node_name.split("/");

				const [self_solid_literal] = rs.splice(-1);
				const self_solid = parseSolid(self_solid_literal);

				if (isLogicalSolid(self_solid)) {
				}

				const node = genDOM(self_solid, { props });
				node_DOM_map[node_name] = node;

				console.log(node, self_solid, "@@@@@@");

				if (rs.length > 1) {
					const parent_solid_literal = rs.join("/");
					const parent_DOM = node_DOM_map[parent_solid_literal];
					parent_DOM.appendChild(node);
				} else if (rs.length > 0) {
					// top node
					root.appendChild(node);
				}

				mutation_action();
			}
		}

		solveModifiers();
		listen("updated", ({ variables }) => {
			const mutated_nodes = [];
			variables.map((variable) => {
				const ens = modifiers[variable];
				if (isNotEmpty(ens)) {
					mutated_nodes.push(...ens);
				}
			});

			solveModifiers(mutated_nodes);
		});

		console.log(root, "------");

		return {
			root,
		};
	}
}

function genDOM(solid_name, option) {
	const dom = isInternalSolid(solid_name)
		? document.createElement(solid_name)
		: makeInstance(solid_name, option.props);
	return dom;
}

function genCommitter(modifiers) {
	return (variable_name, value) => {
		const solid_name = parseSolid(variable_name);
		if (solid_name in modifiers) {
			fire(solid_name);
		}
		return value;
	};
}

function parseSolid(literal) {
	return first(literal.split("$"));
}

const INTERNALSOLIDM = {
	ul: true,
	li: true,
	div: true,
};

const LOGICALSOLID = {
	"@if": true,
	"@else": true,
	"@for": true,
};

function isInternalSolid(solid_name) {
	return solid_name in INTERNALSOLIDM;
}

function isLogicalSolid(solid_name) {
	return solid_name in LOGICALSOLID;
}
