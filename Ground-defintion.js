define(function Demo1({ get, set }, refs) {
	const modifiers = {
		name: ["div/ul/li/label", "div/ul/li/input", "div/ul/li/input$1"],
		age: ["div/ul/li$1/input", "div/ul/li$1/span"],
		weight: ["div/ul/li$2/input"],
		var3: ["div/ul/li$3/input"],
	};

	const mutations_effects = {
		age: ["weight", "var3"],
		weight: ["var3"],
	};

	const mutations_deps = {
		weight: ["age"],
		var3: ["age", "weight"],
	};

	const deps = {
		weight: (v) => v * 8.7,
		var3: (v1, v2) => (v1 > 2 ? v1 : v1 + v2),
	};

	const variables = {
		items: [],
		name: "Jassecia",
		age: 19,

		// cached
		weight: 0,
		var3: 0,
	};

	const children = {
		div: noop,
		"div/ul": () => ({ $name: "container", tags: { container: true } }),
		"div/ul/li": () => ({ tags: { name: true } }),
		"div/ul/li/label": () => ({ tx: "name" }),
		"div/ul/li/input": ({ get, set }) => ({
			value: get("name"),
			"@input": (e) => set("name", e.target.value),
		}),
		"div/ul/li/input$1": ({ get }) => ({ value: get("name") }),
		"div/ul/li$1": () => ({ tags: { age: true } }),
		"div/ul/li$1/label": () => ({ tx: "age" }),
		"div/ul/li$1/input": ({ get }) => ({
			$name: "input",
			value: get("age"),
		}),
		"div/ul/li$1/span": ({ get }) => ({ tx: get("age") }),
		"div/ul/li$2": () => ({ tags: { weight: true } }),
		"div/ul/li$2/label": ({ get }) => ({ tx: "weight" }),
		"div/ul/li$2/input": ({ get }) => ({ value: get("weight") }),
		"div/ul/li$3": () => ({ tags: { var3: true } }),
		"div/ul/li$3/label": ({ get }) => ({ tx: "var3" }),
		"div/ul/li$3/input": ({ get }) => ({ value: get("var3") }),
	};

	const [commit] = (committer = genCommitter(modifiers));

	return {
		onCreate() {
			console.log("has created.");
		},
		onMounted() {
			const { input } = refs;
			// setInterval(() => {
			// 	commit("age", get("age") + 1);
			// }, 1000);
			input.addEventListener("input", () => {
				commit("age", input.value * 1);
			});
		},
		variables,
		children,
		modifiers,
		mutations_effects,
		mutations_deps,
		deps,
		committer,
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
