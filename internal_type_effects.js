const ARRAY = {
	pop: ["length", "&"],
	splice: ["length", "&"],
	pop: ["length", "&"],
	push: ["length", "&"],
	shift: ["length", "&"],
	unshift: ["length", "&"],
	fill: ["&"],
	reverse: ["&"],
	sort: ["&"],

	// no self effects
	concat: [],
	copyWithin: [],
	entries: [],
	every: [""],
	some: [""],
	filter: [""],
	find: [""],
	findIndex: [""],
	forEach: [""],
	indexOf: [""],
	join: [""],
	keys: [""],
	map: [""],
	flat: [""],
	flatMap: [""],
	includes: [""],
	lastIndexOf: [""],
	values: [""],
	reduce: [""],
	reduceRight: [""],
	slice: [""],
};