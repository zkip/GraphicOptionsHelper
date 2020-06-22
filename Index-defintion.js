// define(function Index() {
// 	return {
// 		children: [["Header"], ["Body"]],
// 	};
// });

// define(function Header({ name }) {
// 	const children = [
// 		{ path: "./wrapper", type: "HTMLElement.Div" },
// 		{ path: "./wrapper/logo", type: "Logo" },
// 		{ path: "./wrapper/menu", type: "Menu" },
// 	];
// 	const modifiers = {
// 		"./wrapper/menu": "",
// 	};
// 	return {
// 		textContext: "",
// 		children,
// 		modifiers,
// 	};
// });

define(function Index() {
	const modifiers = {
		"items.length": ["ul/@if$1"],
		"items.&": ["ul/@if/@for/li/span"],
		items: ["ul/@if/@for"],
		current: ["ul/div$0", "ul/div$1", "ul/@if$0", "ul/@if/@for/li"],
	};

	const commit = genCommitter(modifiers);

	let items = []; // []string
	let current = 0; // uint

	const handle_click = async ({ target }) => {
		const root_node = $pick("#root")[0];
		current = commit("current", root_node.getOrder(target));
	};

	const [_fz0g, _fz0g_cached] = cache(() => items.length > 3);
	const _zf44 = (ctx, fn) =>
		items.map((item, idx) => fn({ item, idx, ...ctx }));
	const _fkl0 = (ctx) => ({ tags: { current: current === ctx.idx } });
	const _xx89 = (ctx) => ({ tx: ctx.item });
	const _fk91 = (ctx) => ({ tx: toString(current), tags: { title: true } });
	const _z11i = (ctx) => ({
		tx: toString(current),
		tags: { subTitle: true },
	});
	const _7r49 = (ctx) => ({ tx: tips, tags: { tip: true } });
	const _fjp4 = (ctx) => ({ tx: "..." });

	const children = {
		ul: [noop, { name: "root" }],
		"ul/div$0": [_fk91],
		"ul/div$1": [_z11i],
		"ul/div$1/ul$0": [noop],
		"ul/div$1/ul$0/li$0": [_z11i],
		"ul/div$1/ul$0/li$1": [_z11i],
		"ul/div$1/ul$1": [_z11i],
		"ul/div$1/ul$1/li": [_z11i],

		"ul/@if$0": [_7r49],
		"ul/@if$1": [_fz0g],
		"ul/@else": [_fz0g_cached],
		"ul/@if/@for": [_zf44],
		"ul/@else/span": [_fjp4],
		"ul/@if/@for/li": [_fkl0],
		"ul/@if/@for/li/span": [_xx89],
	};

	const childrenWeights = {};

	return {
		async onCreated() {
			// items = commit("items", await fetchSomething("..."));
			commit({
				items: async () => (items = await fetchSomething("...")),
			});
		},
		onMounted() {
			$pick("#root").every((node) => {
				node.addEventListener("click", handle_click);
			});
		},
		onDesdroyed() {
			$pick("#root").every((node) => {
				node.removeEventListener("click", handle_click);
			});
		},
		children,
		modifiers,
	};
});
