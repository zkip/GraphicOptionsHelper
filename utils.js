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

function fallback(back_value) {
	return (v = back_value) => v;
}
