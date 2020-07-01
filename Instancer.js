function makeInstance(name, { ...props } = {}) {
	if (CstorM.has(name)) {
		const cstor = CstorM.get(name);

		const [
			getContext,
			setContext,
			defContext,
		] = (contextor = genContextor());

		const refs = {};

		const makeMutable = (contextor) => {
			const set = (...args) => {
				const result = contextor.set(...args);
				committer.commit(...args);
				// console.log("From Instancer", args);
				return result;
			};

			return { ...contextor, set };
		};

		// Lifecycle:init
		const tail = cstor(contextor.withBy("/"));

		const root = document.createDocumentFragment();
		const node_mutation_snapshot = {};
		const node_map = {
			// node_name SolidLiteral: DOM
		};
		const node_map_dynamic = {
			// node_name SolidLiteral: DOM
		};

		const iteration_map = {};
		const iteration_map_stacked = {};
		const condition_map = {};
		const logical_count_map = {};
		const logical_position_map = {};

		const {
			modifiers,
			mutations_effects,
			mutations_deps,
			deps,
			children: mutation_map,
			variables,
			onCreated,
			onMounted,
			committer,
		} = tail;
		console.log(modifiers);

		defContext("/", variables);
		defContext("/", deps);

		function getLogicalPosition(solid_path) {
			return logical_position_map[solid_path];
		}

		function getLogicalCount(parent_solid_path) {
			return logical_count_map[parent_solid_path];
		}

		function resolveToPure(solid_path, self_solid) {
			const {
				context_type,
				iteration,
				condition,
			} = resolveDynamicContext(solid_path);

			// console.log(context_type, iteration, condition, "@@@@@@@@@");

			if (context_type === "condition") {
				const node = $condition()
					? genNode(self_solid, node_option)
					: genNode("&Comment");

				if (isNotEmpty(self_node)) {
					self_node.replaceWith(node);
				} else {
					return node;
				}
			} else if (context_type === "iteration") {
				return iteration;
			} else if (context_type === "@for") {
			}
		}

		function resolveRelIterations(solid_path) {
			const iterations = [];
			const collect = (path) => {
				const iteration = iteration_map[path];
				if (isNotEmpty(iteration)) {
					iterations.push(iteration);
				}

				const nps = path.split("/");
				nps.splice(-1);
				if (nps.length > 0) {
					collect(nps.join("/"));
				}
			};

			collect(solid_path);

			return iterations;
		}

		function resolveDynamicContext(solid_path) {
			const collect = (path) => {
				const nps = path.split("/");
				const [self_solid_literal] = nps.splice(-1);
				const self_solid = getSolidType(self_solid_literal);
				if (isLogicalSolid(self_solid, "@if", "@else", "@case")) {
					const context_type = "condition";
					const condition = condition_map[path];

					return { context_type, condition };
				} else if (isLogicalSolid(self_solid, "@for")) {
					const context_type = "iteration";
					const iteration = iteration_map_stacked[path];

					return { context_type, iteration };
				} else {
					return collect(nps.join("/"));
				}
			};

			return collect(solid_path);
		}

		function applyToDOM(mutated_solids = Object.keys(mutation_map)) {
			for (const solid_path of mutated_solids) {
				const mutation_action = mutation_map[solid_path];

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

				if (isLogicalSolid(self_solid)) {
					const {
						$condition,
						$iteration,
						...option
					} = mutation_action(contextor.withBy(solid_path));

					node_map[solid_path] = parent_node;

					if (self_solid === "@for") {
						const reltive_iterations = resolveRelIterations(
							solid_path
						);

						console.log(reltive_iterations, "--------");

						iteration_map[solid_path] = $iteration;
						iteration_map_stacked[solid_path] = genIterations(
							...reltive_iterations,
							$iteration
						);
						console.log(iteration_map_stacked, "*****");
					} else if (self_solid === "@if") {
						condition_map[solid_path] = $condition;
					}
				} else {
					const contextor_mutable = makeMutable(
						contextor.withBy(solid_path)
					);

					if (isInDynamicContext(solid_path)) {
						const iteration = resolveToPure(solid_path, self_solid);
						iteration((...args) => {
							const { $name, ...option } =
								mutation_action(contextor_mutable, ...args) ||
								{};
							const node = genNode(self_solid, {
								props,
								...option,
							});

							if (isLogicalSolid(parent_solid)) {
								const id = genNodePureId(solid_path, args);
								node_map_dynamic[id] = node.root;
							}

							const parent_solid_id = trimToPureEndNode(
								parent_solid_path,
								args
							);
							const parent_node =
								node_map[parent_solid_id] ||
								node_map_dynamic[parent_solid_id];

							mount(parent_node, node.root);
						});
					} else {
						const { $name, ...option } =
							mutation_action(contextor_mutable) || {};
						const node = genNode(self_solid, { props, ...option });
						node_map[solid_path] = node.root;
						if (isNotEmpty($name)) {
							refs[$name] = node.root;
						}
						mount(parent_node, node.root);
					}

					// if (isLogicalSolid(parent_solid, "@for")) {
					// 	const iterator = getIteration(parent_solid_path);
					// 	const options = iterator(mutation_action);
					// 	const lp = getLogicalPosition(solid_path);
					// 	const lc = getLogicalCount(parent_solid_path);

					// 	options.map((option, idx) => {
					// 		const node = genNode(self_solid, option);
					// 		// node_map[solid_path] = genNode(self_solid).root;
					// 		mount(parent_node, node.root, idx * lc + lp);
					// 	});
					// } else {
					// 	const node = genNode(self_solid, { props });
					// 	node_map[solid_path] = node.root;
					// 	mount(parent_node, node.root);
					// }
				}
			}
		}

		applyToDOM();

		onCreated();

		return (node_parent_pure) => {
			committer.listen(({ variables: vars }) => {
				const mutated_nodes = [];
				const variables_effected = [];
				setContext("/", vars);
				Object.entries(vars).map(([variable_name]) => {
					const ens = modifiers[variable_name];
					if (isNotEmpty(ens)) {
						mutated_nodes.push(...ens);
					}

					if (variable_name in mutations_effects) {
						const effected = mutations_effects[variable_name];
						variables_effected.push(...effected);

						// resolve the effected nodes by the dependent variables
						effected.map((variable_name) => {
							const ens = modifiers[variable_name];
							if (isNotEmpty(ens)) {
								mutated_nodes.push(...ens);
							}
						});
					}
				});

				// update the dependent variables
				variables_effected.map((variable_name) => {
					const deps_names = mutations_deps[variable_name];
					const mutation_action = deps[variable_name];
					const dep_values = evaluate(...deps_names);
					const value = mutation_action(...dep_values);
					setContext("/", { [variable_name]: value });
				});

				mutated_nodes.map((solid_path) => {
					const node = node_map[solid_path];
					const mutation_action = mutation_map[solid_path];
					const option = mutation_action(
						contextor.withBy(solid_path)
					);
					mapToNode(node, option);
				});

				// applyToDOM(mutated_nodes);
			});

			committer.commits(variables);

			function evaluate(...dep_names) {
				return dep_names.map((dep_name) => getContext("/", dep_name));
			}

			mount(node_parent_pure, root);
			onMounted(refs);
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

function mapToNode(node, { tx, tags = {}, props, ...others }) {
	if (isNotEmpty(tx)) {
		node.textContent = tx;
	}

	Object.entries(tags).map(([key, has]) => {
		if (has) {
			node.classList.add(key);
		} else {
			node.classList.remove(key);
		}
	});

	Object.entries(others).map(([key, value]) => {
		if (key.startsWith("$")) return;
		if (key.startsWith("@")) {
			node.addEventListener(key.slice(1), value);
		} else {
			if (isJustDirectAssign(node.nodeName, key)) {
				node[key] = value;
			} else {
				node.setAttribute(key, value);
			}
		}
	});
}

const DIRECTASSIGN = {
	INPUT: { value: true },
};

function isJustDirectAssign(node_name, attribute) {
	if (node_name in DIRECTASSIGN) {
		return attribute in DIRECTASSIGN[node_name];
	}
	return false;
}
