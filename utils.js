function cache(fn) {
	let value;
	return [(...args) => (value = fn(...args)), () => value];
}

function noop() {}

function isNotEmpty(v) {
	return typeof v !== "undefined";
}

function first(v) {
	return v[0];
}
function last(v) {
	return v[v.length - 1];
}
