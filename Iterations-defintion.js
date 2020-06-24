define(function Iterations(...props) {
	const _sdfj = () => ({
		$iteration: ({ set }) => ({}),
	});

	const children = {
		div: [noop, { name: "container" }],
		"div/@for": [_sdfj],
		"div/@for/@for": [_sdfj],
		"div/@for/@for/@for": [_sdfj],
	};

	return {
		children,
	};
});
