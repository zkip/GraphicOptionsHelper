define(function Index() {
	return {
		children: [["Header"], ["Body"]],
	};
});

define(function Header({ name }) {
	const children = [
		{ path: "./wrapper", type: "HTMLElement.Div" },
		{ path: "./wrapper/logo", type: "Logo" },
		{ path: "./wrapper/menu", type: "Menu" },
	];
	const modifiers = {
		"./wrapper/menu": "",
	};
	return {
		textContext: "",
		children,
		modifiers,
	};
});

define(function Menu() {
	let items = []; // []string
	let current = 0; // uint
	const handle_mousedown = async () => {
		if (items.length > 0) {
			// ...
		}
	};

	const [_fz0g, _fz0g_chached] = chache(() => items.length > 3);
	const _zf44 = (ctx, fn) =>
		items.map((item, idx) => fn({ item, idx, ...ctx }));
	const _fkl0 = (ctx) => {
		return { tags: { current: current === ctx.idx } };
	};
	const _xx89 = (ctx) => {
		return { tx: ctx.item };
	};

	const _fjp4 = (ctx) => ({ tx: "..." });

	return {
		async onCreate() {
			items = await fetchSomething("...");
			addEventListener("mousedown", handle_mousedown);
		},
		onDesdroyed() {
			removeEventListener("mousedown", handle_mousedown);
		},
		children: [
			["ul"],
			["ul/@if", _fz0g],
			["ul/@else", _fz0g_chached],
			["ul/@if/@for", _zf44],
			["ul/@else/span", _fjp4],
			["ul/@if/@for/li", _fkl0],
			["ul/@if/@for/li/span", _xx89],
		],
		modifiers: {
			"ul/@if": { "items.length": true },
			"ul/@if/@for": { items: true },
			"ul/@if/@for/li": { current: true },
			"ul/@if/@for/li/span": { item: true },
		},
	};
});
