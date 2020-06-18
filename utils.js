function chache(fn) {
	let value;
	return [(...args) => (value = fn(...args)), () => value];
}
