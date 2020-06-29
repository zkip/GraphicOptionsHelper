define(function Demo1() {
	const variables = {
		items: [],
		name: "Jassecia",
		age: 19,
	};

	const children = {
		div: noop,
		"div/ul": () => ({ name: "container", tags: { container: true } }),
		"div/ul/li": () => ({ tags: { name: true } }),
		"div/ul/li/label": () => ({ tx: "name" }),
		"div/ul/li/input": ({ get }) => ({ tx: get("name") }),
		"div/ul/li$1": () => ({ tags: { age: true } }),
		"div/ul/li$1/label": () => ({ tx: "age" }),
		"div/ul/li$1/input": ({ get }) => ({ tx: get("age") }),
	};

	return {
		variables,
		children,
	};
});

define(function Ground01() {
	const variables = {
		items: [],
	};
	const children = {
		div: noop,
		"div/@for": ({ set, get, def }) => {
			def("i", 0);
			return {
				cond: () => get("i") < 10,
				defer: () => set("i", get("i") + 1),
			};
		},
		"div/@for/@for": ({ set, get, def }) => {
			def({ j: 0, item: get["items"][0] });
			return {
				cond() {
					const [items, j] = get("items", "j");
					return j < items.length;
				},
				defer() {
					const [j] = get("j");
					set({ j: j + 1, item: items[j] });
				},
			};
		},
		"div/@for/@for/@for": ({ set, get, def }) => {
			def({ x: get("i") * get("j") });
		},
		"div/@for/@for/@for/@if": ({ set, get }) => get("x") > 2,
		"div/@for/@for/@for/@if/@": ({ set, get }) => {
			set("x", get("x") + 1);
		},
		"div/@for/@for/@for/@else": noop,
		"div/@for/@for/@for/@else/@": ({ set, get }) => {
			set("x", get("x") + 3);
		},
		"div/@for/@for/@for/@if$1": ({ set, get }) => get("x") > 30,
		"div/@for/@for/@for/@if$1/span": noop,
		"div/@for/@for/@for/@if$1/span/div": () => ({ tx: "JJJ" }),
		"div/@for/@for/@for/@if$1/span/label": ({ get }) => ({
			tx: get("item"),
		}),
		"div/@for/@for/@for/@if$1/@break": noop,
	};

	return {
		variables,
		children,
	};
});
