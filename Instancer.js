function makeInstance(name, { ...props } = {}) {
	if (CstorM.has(name)) {
		const cstor = CstorM.get(name);

		const contextor = genContextor();
		const [getContext, setContext, defContext] = contextor;

		// lifecycle: init
		const tail = cstor(contextor.withBy("/"));
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
			committer = genCommitter(modifiers),
		} = tail;

		contextor.setMutationsDeps(mutations_deps);

		const makeMutable = (contextor) => {
			const set = (...args) => {
				const result = contextor.set(...args);
				committer.commit(...args);
				return result;
			};

			return { ...contextor, set };
		};

		const root = document.createDocumentFragment();
		const node_map = {
			// node_name SolidLiteral: DOM
			"/": root,
		};
		const node_map_cache_condition = {};
		const node_map_dynamic = {
			// node_name SolidLiteral: DOM
		};

		const refs = {};

		const tags_memo_map = {};

		const iteration_map = {};
		const iteration_map_stacked = {};
		const condition_map = {};
		const condition_map_stacked = {};

		const instance_map = {};
		const instance_map_dynamic = {};

		const logical_count_map = {};
		const logical_position_map = {};

		const iteration_count_map = {};

		let iteration_counts = [];

		const effects_map = {};

		defContext("/", variables);
		defContext("/", deps);

		function memorizeTags(node_ID, { tags }) {
			tags_memo_map[node_ID] = tags;
		}

		function releaseMemoriedTags(node_ID) {
			delete tags_memo_map[node_ID];
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

		function resolveRelConditions(solid_path) {
			const conditions = [];
			const collect = (path) => {
				const condition = condition_map[path];
				if (isNotEmpty(condition)) {
					conditions.push(condition);
				}

				const nps = path.split("/");
				nps.splice(-1);
				if (nps.length > 0) {
					collect(nps.join("/"));
				}
			};
			collect(solid_path);
			return conditions;
		}

		function resolveDynamicContext(solid_path) {
			const collect = (
				path,
				{
					condition,
					iteration,
					solid_path_condition,
					solid_path_iteration,
				} = {}
			) => {
				const nps = path.split("/");
				const [self_solid_literal] = nps.splice(-1);
				const self_solid = getSolidType(self_solid_literal);
				if (
					isLogicalSolid(self_solid, "@if", "@else", "@case") &&
					isEmpty(condition)
				) {
					condition = condition_map_stacked[path];
					solid_path_condition = [...nps, self_solid_literal].join(
						"/"
					);
				}

				if (isLogicalSolid(self_solid, "@for") && isEmpty(iteration)) {
					iteration = iteration_map_stacked[path];
					solid_path_iteration = [...nps, self_solid_literal].join(
						"/"
					);
				}

				if (
					nps.length > 0 &&
					(isEmpty(condition) || isEmpty(iteration))
				) {
					return collect(nps.join("/"), {
						condition,
						iteration,
						solid_path_condition,
						solid_path_iteration,
					});
				} else {
					return {
						condition,
						iteration,
						solid_path_condition,
						solid_path_iteration,
					};
				}
			};

			return collect(solid_path);
		}

		function extractLogical(solid_path) {
			const {
				condition = noop,
				iteration,
				solid_path_condition,
				solid_path_iteration,
			} = resolveDynamicContext(solid_path);

			const wrapCondition = (indices) => ({
				paths: {
					condition: solid_path_condition,
					iteration: solid_path_iteration,
				},
				condition: condition === noop ? noop : () => condition(indices),
			});

			return (fn) => {
				if (isNotEmpty(iteration)) {
					iteration((indices, ...args) =>
						fn(indices, wrapCondition(indices), ...args)
					);
				} else {
					fn([], wrapCondition([]));
				}
			};
		}

		function update(
			mutated_solids = Object.keys(mutation_map),
			is_init = false
		) {
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

					// node_map[solid_path] = parent_node;

					if (self_solid === "@for") {
						const relative_iterations = resolveRelIterations(
							solid_path
						);

						iteration_map[solid_path] = $iteration;
						iteration_map_stacked[solid_path] = genIterations(
							...relative_iterations,
							$iteration
						);

						// resolve the effect actions
						if (isNotEmpty($effects)) {
							effects_map[solid_path] = $effects;
							contextor.setTransformers(solid_path, $effects());
						}
					} else if (self_solid === "@if") {
						const relative_conditions = resolveRelConditions(
							solid_path
						);
						condition_map[solid_path] = $condition;
						condition_map_stacked[solid_path] = genConditions(
							...relative_conditions,
							$condition
						);
					}
				} else {
					// mutation in dynamic context
					const contextor_mutable = makeMutable(
						contextor.withBy(solid_path)
					);
					if (isInDynamicContext(solid_path)) {
						const logical = extractLogical(solid_path);
						const indices_prev =
							iteration_count_map[solid_path] || [];
						let indices_last = [];
						logical((indices, { condition }, ...args) => {
							const { $name, ...option } =
								mutation_action(contextor_mutable, indices) ||
								{};

							const parent_solid_id = trimToPureEndNode(
								parent_solid_path,
								indices
							);
							const parent_node =
								node_map[parent_solid_id] ||
								node_map_dynamic[parent_solid_id];

							const node_ID = genNodePureID(solid_path, indices);

							const node_exsited_internal =
								node_ID in node_map_dynamic;
							const node_exsited_custom =
								node_ID in instance_map_dynamic;
							const node_is_exsited =
								node_exsited_internal || node_exsited_custom;
							const comment_is_exsited =
								node_ID in node_map_cache_condition;

							const is_internal = isInternalSolid(self_solid);

							if (condition !== noop) {
								const ok = condition();
								let comment = node_map_cache_condition[node_ID];

								if (ok) {
									let mount_justify = noop;
									let node_justify = null;

									if (node_is_exsited) {
										// rebind data
										const node = node_exsited_internal
											? node_map_dynamic[node_ID]
											: instance_map_dynamic[node_ID];

										node_justify = node;

										if (is_internal) {
											applyToDOM(node, option);
										} else {
											node.committer.commits(option);
										}
									} else {
										const { node, mount } = genNode(
											self_solid,
											{
												props,
												...option,
											}
										);

										mount_justify = mount;
										node_justify = node;

										if (is_internal) {
											node_map_dynamic[node_ID] = node;
										} else {
											instance_map_dynamic[
												node_ID
											] = node;
										}
									}

									if (comment_is_exsited) {
										// replace to comment
										let comment =
											node_map_cache_condition[node_ID];
										let raw = is_internal
											? node_map_dynamic[node_ID]
											: node_justify.root;

										if (!is_internal) {
											node_justify.beReplaced();
										}

										comment.replaceWith(raw);

										delete node_map_cache_condition[
											node_ID
										];
									} else {
										mount_justify(parent_node);
									}
								} else {
									if (comment_is_exsited) {
										// nothing
									} else {
										if (isNotEmpty(parent_node)) {
											const { node } = genNode(
												"&Comment"
											);
											comment = node;
											node_map_cache_condition[
												node_ID
											] = comment;
											if (node_is_exsited) {
												const exsited_one = node_exsited_internal
													? node_map_dynamic[node_ID]
													: instance_map_dynamic[
															node_ID
													  ];

												exsited_one.replaceWith(
													comment
												);
											} else {
												// init false of condition
												mount(parent_node, comment);
											}
										}
									}
								}
							} else {
								if (node_is_exsited) {
									applyToDOM(
										node_map_dynamic[node_ID],
										{ ...option },
										{
											except_event: true,
											tags_memo: tags_memo_map[node_ID],
										}
									);
								} else {
									let { node, mount } = genNode(self_solid, {
										props,
										...option,
									});

									if (is_internal) {
										node_map_dynamic[node_ID] = node;
									} else {
										instance_map_dynamic[node_ID] = node;
									}

									mount(parent_node);
								}
							}

							indices_last = indices;

							iteration_counts = indices;

							memorizeTags(node_ID, option);
						});

						// remove the overflowed nodes
						if (indices_last.length === 0) {
							indices_last = indices_prev.map(() => -1);
						}
						iteration_count_map[solid_path] = indices_last;

						let not_changed =
							indices_prev.toString() === indices_last.toString();

						if (!not_changed) {
							genFlatDiffIndices((indices) => {
								let nodeID = genNodePureID(solid_path, indices);
								const node = node_map_dynamic[nodeID];
								if (node) {
									unmount(node);
									delete node_map_dynamic[nodeID];
								}
							})(
								indices_prev.map(addOne),
								indices_last.map(addOne)
							);
						}
					} else {
						const { $name, ...option } =
							mutation_action(contextor_mutable) || {};

						const is_internal = isInternalSolid(self_solid);
						if (is_init) {
							const { node, mount } = genNode(self_solid, {
								props,
								...option,
							});
							if (is_internal) {
								node_map[solid_path] = node;
								if (isNotEmpty($name)) {
									refs[$name] = node;
								}
							} else {
								instance_map[solid_path] = node;
							}
							mount(parent_node);
						} else {
							const is_internal = solid_path in node_map;

							if (is_internal) {
								const node = node_map[solid_path];
								applyToDOM(node, option, {
									except_event: true,
									tags_memo: tags_memo_map[solid_path],
								});
							} else {
								const node = instance_map[solid_path];
								node.committer.commits(option);
							}
						}

						memorizeTags(solid_path, option);
					}
				}
			}
		}

		update(undefined, true);

		onCreated();

		const top_DOM_backup = [];

		let be_used = false;

		let relase = noop;

		// prepare
		const setup = () => {
			if (be_used) return { clean: noop };

			const clean = committer.listen(({ variables: vars }) => {
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

				update(mutated_nodes);
			});

			committer.commits(variables);
			committer.commits(props);

			function evaluate(...dep_names) {
				return dep_names.map((dep_name) => getContext("/", dep_name));
			}

			for (let i = 0; i < root.children.length; i++) {
				const el = root.children[i];
				top_DOM_backup.push(el);
			}

			be_used = true;

			return () => {
				clean();
				be_used = false;
			};
		};

		return {
			committer,
			root,
			replaceWith(DOM) {
				if (!be_used) return;

				if (top_DOM_backup.length > 0) {
					const first_child = top_DOM_backup[0];

					first_child.replaceWith(DOM);

					top_DOM_backup.map((el) => {
						root.appendChild(el);
					});
				}

				relase();
			},
			unmount() {
				if (!be_used) return;

				top_DOM_backup.map((el) => {
					root.appendChild(el);
				});

				relase();
			},
			beReplaced() {
				const clean = setup();

				onMounted(refs);

				// clean up
				return (relase = () => {
					onDestroyed();
					clean();

					// release all memorized tags
					// releaseMemoriedTags();
				});
			},
			mount(DOM) {
				const clean = setup();

				mount(DOM, root);

				onMounted(refs);

				// clean up
				return (relase = () => {
					onDestroyed();
					clean();

					// release all memorized tags
					// releaseMemoriedTags();
				});
			},
		};
	} else {
		throw Error(`No Solid named "${name}"`);
	}
}

function mount(parent, child) {
	parent.appendChild(child);
}

function unmount(child) {
	child.remove();
}

function resolveSpecialSolid(solid_name) {
	if (isSpecialSolid(solid_name, "&Comment")) {
		return document.createComment("");
	} else if (isSpecialSolid(solid_name, "&Text")) {
		return document.createTextNode("");
	}
}

function genNode(solid_name, { props, ...option } = {}) {
	let node,
		raw,
		is_internal = true,
		mount_justify = (parent_node) => mount(parent_node, node);
	if (isSpecialSolid(solid_name)) {
		raw = node = resolveSpecialSolid(solid_name);
	} else if (isLogicalSolid(solid_name)) {
		raw = node = document.createDocumentFragment();
	} else if (isInternalSolid(solid_name)) {
		raw = node = document.createElement(solid_name);
	} else {
		node = makeInstance(solid_name, option);
		raw = node.root;
		mount_justify = node.mount;

		is_internal = false;
	}

	if (is_internal) {
		applyToDOM(node, option);
	} else {
		node.committer.commits(props);
	}

	return {
		mount: mount_justify,
		node,
		raw,
	};
}

function applyProperty() {}

function applyToDOM(
	node,
	{ tx, tags = {}, ...others } = {},
	{ except_event = false, tags_memo = {} } = {}
) {
	if (isNotEmpty(tx)) {
		const first_child = node.firstChild;
		let text_node;

		if (first_child && first_child.nodeType === 3) {
			text_node = first_child;
		} else {
			text_node = document.createTextNode(tx);
			node.insertBefore(text_node, node.firstChild || null);
			node.appendChild(text_node);
		}

		text_node.replaceData(0, text_node.data.length, tx);
	}

	Object.entries(tags).map(([key, has]) => {
		if (has) {
			node.classList.add(key);
		} else {
			node.classList.remove(key);
		}
	});

	Object.entries(tags_memo).map(([key, has]) => {
		if (key in tags) {
			return;
		} else {
			node.classList.remove(key);
		}
	});

	Object.entries(others).map(([key, value]) => {
		if (key.startsWith("$")) return;
		if (key.startsWith("@")) {
			if (except_event) return;
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
