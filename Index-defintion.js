// define(function Index() {
// 	return {
// 		children: [["Header"], ["Body"]],
// 	};
// });

define(function Iteration({ name }) {
	const items = [1, 2, 3];
	const _sdff = ({ set, get }) => ({
		$iteration: ["items", () => {}],
	});
	const children = {
		div: [() => ({ name: "root" })],
		"div/@for": [_sdff],
		"div/@for/span": [
			({ get }) => {
				return { tx: "xxx" + get("item") };
			},
		],
	};
	const modifiers = {};
	return {
		children,
		modifiers,
	};
});

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
	const _fsdi = () => ({ $condition: _fz0g });
	const _uur3 = () => ({ $condition: not(_fz0g_cached) });
	const _zf44 = ({ set }) => ({
		$iteration: { items: (item, idx) => fn(set({ item, idx })) },
	});
	const _fkl0 = ({ get }) => ({ tags: { current: current === get("idx") } });
	const _xx89 = ({ get }) => ({ tx: get("item") });
	const _fk91 = (ctx) => ({ tx: toString(current), tags: { title: true } });
	const _z11i = (ctx) => ({
		tx: toString(current),
		tags: { subTitle: true },
	});
	const _7r49 = (ctx) => ({ tx: tips, tags: { tip: true } });
	const _fjp4 = (ctx) => ({ tx: "..." });
	const _yyeo = ({ set }) => ({ $context: { i: Math.random() } });
	const _fkdk = ({ get }) => ({ $condition: () => get("i") > 0.2 });
	const _ffxd = (ctx) => ({ tx: "---" });

	const children = {
		ul: [() => ({ name: "root" })],
		"ul/div$0": [_fk91],
		"ul/div$1": [_z11i],
		"ul/div$1/ul$0": [noop],
		"ul/div$1/ul$0/li$0": [_z11i],
		"ul/div$1/ul$0/li$1": [_z11i],
		"ul/div$1/ul$1": [_z11i],
		"ul/div$1/ul$1/li": [_z11i],

		"ul/@if$0": [_7r49],
		"ul/@if$1": [_fsdi],
		"ul/@else": [_uur3],
		"ul/@if$1/@for": [_zf44],
		"ul/@else/span": [_fjp4],
		"ul/@if$1/@for/div": [_ffxd],
		"ul/@if$1/@for/li": [_fkl0],
		"ul/@if$1/@for/li/span": [_xx89],

		"ul/@": [_yyeo],
		"ul/@if": [_fkdk],
	};

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
