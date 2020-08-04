function cache(fn) {
	let value;
	return [(...args) => (value = fn(...args)), () => value];
}

function noop() {}
const multiply = (a, b) => a * b;
const addOne = (v) => v + 1;
const addN = (n) => (v) => v + n;

function isEmpty(v) {
	return typeof v === "undefined";
}

function listen(fn, target = window) {
	const { name } = fn;

	target.addEventListener(name, fn);

	return () => {
		target.removeEventListener(name, fn);
	};
}

function isNotEmpty(v) {
	return !isEmpty(v);
}

function isEmptyString(v) {
	return v === "";
}
function isString(v) {
	return typeof v === "string";
}
function isNotEmptyString(v) {
	return isString(v) && !isEmptyString(v);
}

function first(v) {
	return v[0];
}
function last(v) {
	return v[v.length - 1];
}

function not(f) {
	return (...args) => !f(...args);
}

function assign(...args) {
	return Object.assign(...args);
}

function sliceBy(str, search_str) {
	return str.slice(0, str.lastIndexOf(search_str));
}

function sliceByAfter(str, search_str) {
	return isEmptyString(search_str)
		? str
		: str.slice(str.lastIndexOf(search_str) + search_str.length);
}

function fallback(back_value) {
	return (v = back_value) => v;
}

// fallback to object
const fallbackToObject = fallback({});

function genFlatEachIndices(fn) {
	return (...args) => {
		const count = args.reduce((a, b) => a * b, 1);
		for (let i = 0; i < count; i++) {
			indices = args.map((_, idx) => {
				const all = args.slice(0, idx).reduce(multiply, 1);
				const part = args.slice(0, idx + 1).reduce(multiply, 1);
				return ((i % (count / all)) / (count / part)) >> 0;
			});
			fn(indices);
		}
	};
}

function genFlatDiffIndices(fn) {
	return genFlatDiffIndicesR(fn);
}

function genIterations(...iterations) {
	const _ = (fn, ...cs) => {
		const receipt = cs.pop();
		const next = ([...indices], ...args) => {
			const { condition, defer, locals = noop } = receipt(
				[...indices],
				...args
			);
			let index = 0;
			while (condition()) {
				fn([...indices, index], ...args, locals());
				defer();
				index++;
			}
		};
		return cs.length > 0 ? _(next, ...cs) : next([]);
	};
	return (fn) => _(fn, ...iterations);
}

function genConditions(...conditions) {
	const _ = (indices, ...cs) => {
		const fn = cs.shift();
		const result = !!fn(indices);
		if (result && cs.length > 0) {
			return result && _(indices, ...cs);
		} else {
			return result;
		}
	};

	return (indices) => _(indices, ...conditions);
}

function genNodePureID(solid_path, indices) {
	let nps = solid_path.split("/");
	let count = 0;
	for (let i = 0; i < nps.length; i++) {
		const seg = nps[i];
		if (seg.startsWith("@for")) {
			if (i + 1 < nps.length) {
				nps[i + 1] = nps[i + 1] + "#" + [indices[count]];
				count++;
			}
		}
	}
	return nps.join("/");
}

function getSolidType(literal) {
	return first(first(literal.split("$")).split("#"));
}

function trimToPureEndNode(parent_solid_path, indices) {
	const parent_solid_id = genNodePureID(parent_solid_path, indices);
	const trim = (path) => {
		const nps = path.split("/");
		const [self_solid_literal] = nps.splice(-1);
		const self_solid = getSolidType(self_solid_literal);
		if (isLogicalSolid(self_solid)) {
			if (nps.length === 0) {
				return "/";
			}
			return trim(nps.join("/"));
		} else {
			nps.push(self_solid_literal);
			return nps.join("/");
		}
	};
	return trim(parent_solid_id);
}

function collectIterationsByDownstream(solid_path, iteration_map) {
	return Object.entries(iteration_map).filter(([key, value]) =>
		key.startsWith(solid_path)
	);
}

function genContextor() {
	const store = {};
	const transformer_map = {};
	const need_update_map = {};
	const values_cached = {};
	const mutation_snapshot = {};

	let mutations_deps;

	const result = assign([get, set, def], {
		get,
		getL,
		gfs,
		set,
		def,
		withBy,
		setTransformers,
		setMutationsDeps,
	});

	// [ value any, isLocal bool ]
	const access = (scope, key, val, { is_local = true } = {}) => {
		if (!isEmptyString(scope)) {
			const m = fallback({})(store[scope]);
			const value = m[key];
			store[scope] = m;

			if (isEmpty(value) && scope !== "/") {
				const scp = scope.split("/");
				scp.splice(-1);

				const scope_next =
					scp.length === 1 && isEmptyString(first(scp))
						? "/"
						: scp.join("/");

				return access(scope_next, key, val, {
					is_local: false,
				});
			} else {
				if (isNotEmpty(val)) {
					return [(m[key] = val), is_local];
				}
				return [value, is_local];
			}
		} else {
			return [undefined, is_local];
		}
	};

	function set(scope, context) {
		scope = scope.startsWith("/") ? scope : "/" + scope;
		Object.entries(context).map(([key, value]) => {
			const [r] = access(scope, key, value);
			if (isEmpty(r)) {
				console.error(`Undefined variable "${key}"`);
			}
		});
		return result;
	}

	function def(scope, context) {
		scope = scope.startsWith("/") ? scope : "/" + scope;
		const m = fallback({})(store[scope]);
		store[scope] = m;

		assign(m, context);
		return result;
	}

	function get(scope, key, ...args) {
		return getL(scope, key, noop, ...args)[0];
	}

	function getL(scope, key, ...args) {
		scope = scope.startsWith("/") ? scope : "/" + scope;
		const result = access(scope, key, undefined);
		const [value] = result;

		if (isEmpty(value)) {
			console.error(`Undefined variable "${key}"`);
		}

		return result;
	}

	// get effects
	function gfs(scope, indices, name, ...args) {
		const tfms_scoped = transformer_map[scope];
		if (isNotEmpty(tfms_scoped)) {
			const transformer = tfms_scoped[name];
			if (isNotEmpty(transformer)) {
				const need_update_m = fallback({})(need_update_map[scope]);
				const vcm = fallback({})(values_cached[scope]);
				const local_index = last(indices);
				const flag = isEmpty(local_index) ? "/" : local_index;
				const snapshot = fallback({})(mutation_snapshot[scope]);
				const deps = mutations_deps[name];
				const values = deps.map((k) => get(scope, k));
				const snapshot_values = snapshot[name];

				const isMutated = isEmpty(snapshot_values)
					? true
					: values.reduce(
							(r, v, i) => r || v !== snapshot_values[i],
							false
					  );

				// init
				if (!(name in need_update_m)) {
					(need_update_map[scope] = need_update_m)[name] = true;
					(values_cached[scope] = vcm)[name] = [];
					(mutation_snapshot[scope] = snapshot)[name] = {};
				}

				// when the logical node appended
				if (!(flag in vcm[name])) {
					need_update_m[name] = true;
				}

				// when the solid mutated
				if (isMutated) {
					need_update_m[name] = true;
				}

				// update
				if (need_update_m[name]) {
					vcm[name][flag] = transformer(...args);
					need_update_m[name] = false;
					snapshot[name] = values;
				}

				return vcm[name][flag];
			}
		}
	}

	function setTransformers(scope, transformers) {
		const m = fallbackToObject(transformer_map[scope]);
		assign((transformer_map[scope] = m), transformers);
		return result;
	}

	function setMutationsDeps(deps) {
		mutations_deps = deps;
	}

	function withBy(scope) {
		const rst = {
			def: (context) => (def(scope, context), rst),
			set: (context) => (set(scope, context), rst),
			get: (key, ...args) => get(scope, key, ...args),
			getL: (key) => getL(scope, key),
			gfs: (indices, name, ...args) => gfs(scope, indices, name, ...args),
		};
		return rst;
	}

	return result;
}

const INTERNALSOLIDM = {
	ul: true,
	li: true,
	div: true,
	span: true,
	label: true,
	input: true,
};

const LOGICALSOLID = {
	"@": true,
	"@if": true,
	"@else": true,
	"@for": true,
};

const SPECIALSOLID = {
	"&Comment": true,
	"&Text": true,
};

function isInternalSolid(solid_name) {
	return solid_name in INTERNALSOLIDM;
}

// which: anyone / if / else / for
function isLogicalSolid(solid_name, which = solid_name) {
	return solid_name in LOGICALSOLID && which === solid_name;
}

function isSpecialSolid(solid_name, which = solid_name) {
	return solid_name in SPECIALSOLID && which === solid_name;
}

function isInDynamicContext(solid_path) {
	const nps = solid_path.split("/");
	const rs = nps
		.map((seg, idx) => (seg.startsWith("@") ? idx : -1))
		.filter((v) => v >= 0);
	return rs.length === 0 ? false : first(rs) + 1 < nps.length;
}

function genCommitter(modifiers) {
	const list = new Set();
	function fire({ variables }) {
		for (const fn of list) {
			fn({ variables });
		}
	}
	function commit(variable_name, value) {
		if (variable_name in modifiers) {
			fire({ variables: { [variable_name]: value } });
		}
		return value;
	}
	function commits(opts) {
		return Object.entries(opts).map(([key, value]) => commit(key, value));
	}
	function listen(fn) {
		list.add(fn);
		return () => list.delete(fn);
	}
	return assign([commit, listen], { commit, commits, listen });
}
