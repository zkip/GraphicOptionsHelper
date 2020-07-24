// begin from 1, 0 presents the NOTCHANGE
function genFlatDiffIndicesR(fn) {
	const each = (
		from,
		base,
		is_all,
		indices = new Array(from.length),
		deep = 0
	) => {
		const { length } = from;
		if (length > 0) {
			const count = from.shift();
			const max = base[deep];
			for (let i = 0; i < count; i++) {
				indices[deep] = i;
				const is_all_next = is_all || i > max - 1;
				each(from.slice(), base, is_all_next, indices, deep + 1);
				if (is_all_next && deep === indices.length - 1) {
					fn(indices);
				}
			}
		}
	};
	return (from, to) => {
		const base = from.map((n, idx) => Math.min(n, to[idx]));

		each(from.slice(), base);
	};
}
