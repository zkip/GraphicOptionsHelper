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
		const logical_count_map = {};
		const logical_position_map = {};

		const { modifiers, children: mutation_map } = tail;

		function getLogicalPosition(solid_path) {
			return logical_position_map[solid_path];
		}

		function getLogicalCount(parent_solid_path) {
			return logical_count_map[parent_solid_path];
		}

		function applyToDOM(mutated_solids = Object.keys(mutation_map)) {
			for (const solid_path of mutated_solids) {
				const [mutation_action] = mutation_map[solid_path];

				const nps = solid_path.split("/");
				const isTopNode = nps.length === 1;
				const [self_solid_literal] = nps.splice(-1);
				const self_solid = getSolidType(self_solid_literal);

				const parent_solid = isTopNode ? null : getSolidType(last(nps));
				const parent_solid_path = isTopNode ? "" : nps.join("/");
				let parent_node = isTopNode
					? root
					: node_map[parent_solid_path];

				const count = logical_count_map[parent_solid_path];
				logical_count_map[parent_solid_path] = lc = isEmpty(count)
					? 0
					: count + 1;

				logical_position_map[solid_path] = lc;

				// node_mutation_snapshot[solid_path] = mutation_action(
				// 	contextor.withBy(solid_path)
				// );

				if (isLogicalSolid(self_solid)) {
					const {
						$context,
						$iteration,
						$condition,
						...option
					} = mutation_action(contextor.withBy(solid_path));

					setContext($context, solid_path);

					if (self_solid === "@for") {
						iteration_map[solid_path] = $iteration;
						node_map[solid_path] = parent_node;
					} else if (self_solid === "@if") {
						condition_map[solid_path] = $condition;
					}
				} else {
					if (isLogicalSolid(parent_solid, "@for")) {
						const iterator = getIteration(parent_solid_path);
						const options = iterator(mutation_action);
						const lp = getLogicalPosition(solid_path);
						const lc = getLogicalCount(parent_solid_path);
						// console.log(
						// 	iterator,
						// 	mutation_action,
						// 	options,
						// 	"*************"
						// );

						options.map((option, idx) => {
							const node = genNode(self_solid, option);
							// node_map[solid_path] = genNode(self_solid).root;
							mount(parent_node, node.root, idx * lc + lp);
						});
					} else {
						const node = genNode(self_solid, { props });
						node_map[solid_path] = node.root;
						mount(parent_node, node.root);
					}
				}
			}
		}

		function getIteration(solid_path) {
			return iteration_map[solid_path];
		}

		applyToDOM();
		// listen("updated", ({ variables }) => {
		// 	const mutated_nodes = [];
		// 	variables.map((variable) => {
		// 		const ens = modifiers[variable];
		// 		if (isNotEmpty(ens)) {
		// 			mutated_nodes.push(...ens);
		// 		}
		// 	});

		// 	applyToDOM(mutated_nodes);
		// });

		console.log(root, node_map, "------");

		return {
			root,
		};
	}
}

function mount(parent, child) {
	parent.appendChild(child);
}

function genNode(solid_name, option = {}) {
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

function mapToNode(node, { tx }) {
	if (isNotEmpty(tx)) {
		node.textContent = tx;
	}
}

function genContextor() {
	const store = {};
	console.log(store);

	const result = assign([get, set], { set, get, withBy });

	const access = (scope, key) => {
		const m = fallback({})(store[scope]);
		store[scope] = m;

		const value = m[key];

		if (isEmpty(value)) {
			if (isEmptyString(scope)) {
				console.error(scope, "-----------");
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

	function set(scope, context) {
		const m = fallback({})(store[scope]);
		store[scope] = m;

		assign(m, context);
		return result;
	}

	function get(...args) {
		return access(...args);
	}

	function withBy(scope) {
		const rst = {
			set: (context) => (set(scope, context), rst),
			get: (key) => get(scope, key),
		};
		return rst;
	}

	return result;
}

function getSolidType(literal) {
	return first(literal.split("$"));
}

const INTERNALSOLIDM = {
	ul: true,
	li: true,
	div: true,
	span: true,
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
