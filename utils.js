function cache(fn) {
	let value;
	return [(...args) => (value = fn(...args)), () => value];
}

function noop() {}
