function makeInstance(name, { ...props } = {}) {
	if (CstorM.has(name)) {
		const cstor = CstorM.get(name);

		const contextor = genContextor();
		const [getContext, setContext, defContext] = contextor;

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
		const refs = {};

		const iteration_map = {};
		const iteration_map_stacked = {};
		const condition_map = {};
		const logical_count_map = {};
		const logical_position_map = {};

		const effects_map = {};

		const options_map = {};

		// console.log(node_map_dynamic, node_map);
		// console.log(effects_map);

		const {
			modifiers = {},
			mutations_effects = {},
			mutations_deps = {},
			deps = {},
			children: mutation_map,
			variables = {},
			onCreated = noop,
			onMounted = noop,
			onDestroyed = noop,
			committer,
		} = tail;

		defContext("/", variables);
		defContext("/", deps);

		function getLogicalPosition(solid_path) {
			return logical_position_map[solid_path];
		}

		function getLogicalCount(parent_solid_path) {
			return logical_count_map[parent_solid_path];
		}

		function resolveToPure(solid_path, { props }, cached_values) {
			const {
				self_solid,
				parent_solid,
				parent_solid_path,
				contextor_mutable,
				mutation_action,
				parent_node,
			} = cached_values;
			const {
				context_type,
				iteration,
				condition,
			} = resolveDynamicContext(solid_path);

			if (context_type === "condition") {
				const result = condition();
				const { $name, ...option } =
					mutation_action(contextor_mutable) || {};
				const node = genNode(result ? self_solid : "&Comment", {
					props,
					...option,
				});
				node_map[solid_path] = node.root;
				options_map[solid_path] = { props, ...option };
				if (isNotEmpty($name)) {
					refs[$name] = node.root;
				}
				mount(parent_node, node.root);
			} else if (context_type === "iteration") {
				const mutation_action = mutation_map[solid_path];
				const {
					solid_path: iteration_solid_path,
				} = resolveDynamicContext(solid_path);

				// resolve the effect actions
				const effects = effects_map[iteration_solid_path];
				if (isNotEmpty(effects)) {
					contextor.setTransformers(iteration_solid_path, effects());
				}

				iteration((indices, ...args) => {
					const { $name, ...option } = fallback({})(
						mutation_action(contextor_mutable, indices, ...args)
					);
					const node = genNode(self_solid, {
						props,
						...option,
					});

					if (isLogicalSolid(parent_solid)) {
						const id = genNodePureID(solid_path, indices);
						node_map_dynamic[id] = node.root;
					}

					const parent_solid_id = trimToPureEndNode(
						parent_solid_path,
						indices
					);
					const parent_node =
						node_map[parent_solid_id] ||
						node_map_dynamic[parent_solid_id];

					mount(parent_node, node.root);
				});
			} else {
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

					return {
						context_type,
						condition,
						solid_path: nps.join("/"),
					};
				} else if (isLogicalSolid(self_solid, "@for")) {
					const context_type = "iteration";
					const iteration = iteration_map_stacked[path];

					nps.push("@for");

					return {
						context_type,
						iteration,
						solid_path: nps.join("/"),
					};
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
						$effects,
						$types,
						...option
					} = mutation_action(contextor.withBy(solid_path));

					node_map[solid_path] = parent_node;

					if (self_solid === "@for") {
						const reltive_iterations = resolveRelIterations(
							solid_path
						);

						iteration_map[solid_path] = $iteration;
						iteration_map_stacked[solid_path] = genIterations(
							...reltive_iterations,
							$iteration
						);

						if (isNotEmpty($effects)) {
							effects_map[solid_path] = $effects;
						}
					} else if (self_solid === "@if") {
						condition_map[solid_path] = $condition;
					}
				} else {
					const contextor_mutable = makeMutable(
						contextor.withBy(solid_path)
					);
					if (isInDynamicContext(solid_path)) {
						resolveToPure(
							solid_path,
							{ props },
							{
								self_solid,
								parent_solid,
								parent_solid_path,
								contextor_mutable,
								mutation_action,
								parent_node,
							}
						);
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
				}
			}
		}

		applyToDOM();

		onCreated();

		return (node_parent_pure) => {
			const clean_committer = committer.listen(({ variables: vars }) => {
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
					const nps = solid_path.split("/");
					const isTopNode = nps.length === 1;
					const [self_solid_literal] = nps.splice(-1);
					const self_solid = getSolidType(self_solid_literal);

					if (isLogicalSolid(self_solid)) {
						if (self_solid === "@for") {
							const iteration_map_collected = collectIterationsByDownstream(
								solid_path,
								iteration_map
							);

							iteration_map_collected.map(
								([solid_path_iteration, origin_iteration]) => {
									const mutation_action =
										mutation_map[solid_path_iteration];
									const { $iteration } = mutation_action(
										contextor.withBy(solid_path_iteration)
									);
									const reltive_iterations = resolveRelIterations(
										solid_path_iteration
									);
									iteration_map[
										solid_path_iteration
									] = $iteration;
									iteration_map_stacked[
										solid_path_iteration
									] = genIterations(
										...reltive_iterations,
										$iteration
									);
								}
							);
						} else if (self_solid === "@if") {
							// console.log(node_map);
							// console.log("---------", options_map[solid_path]);
						}
					} else {
						if()
						const node = node_map[solid_path];
						const mutation_action = mutation_map[solid_path];
						const option = mutation_action(
							contextor.withBy(solid_path)
						);
						mapToNode(node, option);
					}
				});
			});

			committer.commits(variables);

			function evaluate(...dep_names) {
				return dep_names.map((dep_name) => getContext("/", dep_name));
			}

			mount(node_parent_pure, root);
			onMounted(refs);

			// clean up
			return () => {
				onDestroyed();
				clean_committer();
			};
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
	// console.log(solid_name, isInternalSolid(solid_name));
	if (isSpecialSolid(solid_name)) {
		return { root: resolveSpecialSolid(solid_name) };
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
