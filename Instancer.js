function makeInstance(name, { ...props } = {}) {
	if (CstorM.has(name)) {
		const cstor = CstorM.get(name);
		// Lifecycle:init
		const tail = cstor({ ...props });

		const [getContext, setContext] = (contextor = genContextor());

		const root = document.createDocumentFragment();
		const node_mutation_snapshot = {};
		const node_map = {
			// node_name SolidLiteral: DOM
		};
		const iteration_map = {};
		const condition_map = {};

		const { modifiers, children: mutation_map } = tail;

		function applyToDOM(mutated_solids = Object.keys(mutation_map)) {
			for (const solid_path of mutated_solids) {
				const [mutation_action] = mutation_map[solid_path];

				const nps = solid_path.split("/");
				const [self_solid_literal] = nps.splice(-1);
				const self_solid = getSolidType(self_solid_literal);

				if (isLogicalSolid(self_solid)) {
					const {
						$context,
						$iteration,
						$condition,
					} = mutation_action(contextor.withBy(solid_path));

					setContext($context, solid_path);

					node_mutation_snapshot[solid_path] = mutation_action(
						contextor.withBy(solid_path)
					);

					if (self_solid === "@for") {
						iteration_map[solid_path] = $iteration;
					} else if (self_solid === "@if") {
						condition_map[solid_path] = $condition;
					}
				} else {
					let parent_node;
					const node = genNode(self_solid, { props });
					node_map[solid_path] = node;

					const parent_solid = getSolidType(last(nps));
					const parent_solid_literal = nps.join("/");

					if (pure_solids.length > 1) {
						parent_node = node_map[parent_solid_literal];
					} else if (nps.length > 0) {
						// top node
						parent_node = root;
					}

					if (isLogicalSolid(parent_solid, "@for")) {
						const iterator = getIteration(parent_solid_literal);
						const options = iterator(mutation_action);
						const lp = getLogicalPosition(solid_path);
						const lc = getLogicalCount(solid_path);

						options.map((option, idx) => {
							const node = genNode(self_solid, option);
							mount(parent_node, node, idx * lc + lp);
						});
					} else {
						mount(parent_node, node);
					}
				}
			}
		}

		function getIteration(solid_path) {
			return iteration_map[solid_path];
		}

		applyToDOM();
		listen("updated", ({ variables }) => {
			const mutated_nodes = [];
			variables.map((variable) => {
				const ens = modifiers[variable];
				if (isNotEmpty(ens)) {
					mutated_nodes.push(...ens);
				}
			});

			applyToDOM(mutated_nodes);
		});

		console.log(root, "------");

		return {
			root,
		};
	}
}

function mount(parent, child) {
	parent.appendChild(child);
}

function genNode(solid_name, option) {
	if (isLogicalSolid(solid_name)) {
		const root = document.createDocumentFragment();
		mapToNode(root, option);
		return { root };
	} else if (isInternalSolid(solid_name)) {
		const root = document.createElement(solid_name);
		mapToNode(root, option);
		return { root };
	} else {
		//
		return makeInstance(solid_name, option.props);
	}
}

function genCommitter(modifiers) {
	return (variable_name, value) => {
		const solid_name = getSolidType(variable_name);
		if (solid_name in modifiers) {
			fire(solid_name);
		}
		return value;
	};
}

function genContextor() {
	const store = {};

	const access = (scope, key) => {
		const m = fallback({})(store[scope]);
		store[scope] = m;

		const value = m[key];

		if (isEmpty(value)) {
			if (isEmptyString(scope)) {
				return undefined;
			} else {
				const scp = scope.split("/");
				scp.splice(-1);

				return access(scp.join("/"), key);
			}
		} else {
			return value;
		}
	};

	const set = (scope, context) => {
		const m = fallback({})(store[scope]);
		store[scope] = m;

		assign(m, context);
	};
	const get = access;

	const withBy = (scope) => ({
		set: (context) => set(scope, context),
		get: (key) => get(scope, key),
	});

	return assign([get, set], { set, get, withBy });
}

function getSolidType(literal) {
	return first(literal.split("$"));
}

const INTERNALSOLIDM = {
	ul: true,
	li: true,
	div: true,
};

const LOGICALSOLID = {
	"@": true,
	"@if": true,
	"@else": true,
	"@for": true,
};

function isInternalSolid(solid_name) {
	return solid_name in INTERNALSOLIDM;
}

// which: anyone / if / else / for
function isLogicalSolid(solid_name, which = solid_name) {
	return solid_name in LOGICALSOLID && which === solid_name;
}
