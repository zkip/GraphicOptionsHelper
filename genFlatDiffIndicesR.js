function genFlatDiffIndicesR(fn) {
	const each = (
		from,
		base_volume,
		sides,
		indices = new Array(from.length),
		deep = 0
	) => {
		const { length } = from;
		if (length > 0) {
			const count = from.shift();
			for (let i = 0; i < count + 1; i++) {
				indices[deep] = i;
				if (length > 0) {
					each(from.slice(), base_volume, sides, indices, deep + 1);
				}
				if (deep === indices.length - 1) {
					const index_volume = indices.reduce(
						(sum, n, idx, { length }) =>
							n * sides[length - idx - 1] + sum,
						0
					);
					if (index_volume > base_volume) {
						fn(indices);
					}
				}
			}
		}
	};
	return (from, to) => {
		const { length } = from;
		const base = from.map((n, idx) => Math.min(n, to[idx]));
		const sides = new Array(length + 1);

		let score = 1;
		for (let i = 0; i < length + 1; i++) {
			sides[i] = score;
			score *= from[i] + 1;
		}

		const base_volume = base.reduce(
			(sum, n, idx) => n * sides[length - idx - 1] + sum,
			0
		);
		each(from.slice(), base_volume, sides);
	};
}
