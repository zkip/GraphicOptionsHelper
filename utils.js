function cache(fn) {
	let value;
	return [(...args) => (value = fn(...args)), () => value];
}

function noop() {}

function isEmpty(v) {
	return typeof v === "undefined";
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

function genIterations(...collections) {
	const _ = (fn, ...cs) => {
		const receipt = cs.pop();
		const next = (...args) => {
			const { cond, defer, locals } = receipt();
			while (cond()) {
				fn(...args, locals());
				defer();
			}
		};
		return cs.length > 0 ? _(next, ...cs) : next();
	};
	return (fn) => _(fn, ...collections);
}

function genContextor() {
	const store = {};
	s = store;
	console.log(store);

	const result = assign([get, set, def], {
		get,
		getL,
		set,
		def,
		withBy,
	});

	const access = (scope, key, val, is_local = true) => {
		if (!isEmptyString(scope)) {
			const m = fallback({})(store[scope]);
			const value = m[key];
			store[scope] = m;

			if (isEmpty(value)) {
				const scp = scope.split("/");
				scp.splice(-1);

				return access(scp.join("/"), key, val, false);
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
		Object.entries(context).map(([key, value]) => {
			const [r] = !!access(scope, key, value);
			if (isEmpty(r)) {
				console.error(`Undefined variable "${key}"`);
			}
		});
		return result;
	}

	function def(scope, context) {
		const m = fallback({})(store[scope]);
		store[scope] = m;

		assign(m, context);
		return result;
	}

	function get(...args) {
		return getL(...args)[0];
	}

	function getL(scope, key) {
		const [r] = (rst = access(scope, key, undefined));
		if (isEmpty(r)) {
			console.error(`Undefined variable "${key}"`);
		}

		return rst;
	}

	function withBy(scope) {
		const rst = {
			def: (context) => (def(scope, context), rst),
			set: (context) => (set(scope, context), rst),
			get: (key) => get(scope, key),
			getL: (key) => getL(scope, key),
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
};

const LOGICALSOLID = {
	"@": true,
	"@if": true,
	"@else": true,
	"@for": true,
};

const SPECIALSOLID = {
	"&Comment": true,
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
