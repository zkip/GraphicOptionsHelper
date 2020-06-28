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

		let isInDynamicContext = false;

		function getLogicalPosition(solid_path) {
			return logical_position_map[solid_path];
		}

		function getLogicalCount(parent_solid_path) {
			return logical_count_map[parent_solid_path];
		}

		function resolveToPure(solid_name, option, exsitNode) {
			const isCondition =
				context_type === "@if" ||
				context_type === "@else" ||
				context_type === "@case";

			if (isCondition()) {
				const condition = getCondition();
				const node = condition()
					? genNode(solid_name, option)
					: genNode("&Comment");

				if (isNotEmpty(exsitNode)) {
					exsitNode.replaceWith(node);
				} else {
					return node;
				}
			} else if (context_type === "@") {
			} else if (context_type === "@for") {
			}
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

					setContext(solid_path, $context);

					if (self_solid === "@for") {
						node_map[solid_path] = parent_node;

						if (parent_solid === "@for") {
						} else {
							iteration_map[solid_path] = genIterations(
								$iteration
							);
						}
					} else if (self_solid === "@if") {
						condition_map[solid_path] = $condition;
					}

					isInDynamicContext = true;
				} else {
					if (isInDynamicContext) {
						resolveToPure();
					}

					if (isLogicalSolid(parent_solid, "@for")) {
						const iterator = getIteration(parent_solid_path);
						const options = iterator(mutation_action);
						const lp = getLogicalPosition(solid_path);
						const lc = getLogicalCount(parent_solid_path);

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

function resolveSpecialSolid(solid_name, { tx = "" } = {}) {
	if (isSpecialSolid(solid_name, "&Comment")) {
		return document.createComment(tx);
	}
}

function genNode(solid_name, option = {}) {
	if (isSpecialSolid(solid_name)) {
		return resolveSpecialSolid(solid_name);
	} else if (isLogicalSolid(solid_name)) {
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

function getSolidType(literal) {
	return first(literal.split("$"));
}
