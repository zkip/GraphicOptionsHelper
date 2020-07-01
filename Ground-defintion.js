define(function Demo1({ get, set }) {
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
		onCreated() {
			console.log("has created.");
		},
		onMounted({ input }) {
			console.log("has mounted.");
			setInterval(() => {
				commit("age", get("age") + 1);
			}, 1000);
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

define(function Demo2({ get, set }) {
	const modifiers = {
		count: ["div/ul/@for"],
	};

	const mutations_effects = {};

	const mutations_deps = {};

	const deps = {};

	const variables = {
		count: 10,
	};

	const children = {
		div: noop,
		"div/ul": () => ({ $name: "container", tags: { container: true } }),
		"div/ul/@for": ({ get, set, def }) => ({
			$iteration: () => {
				let i = 0;
				return {
					condition: () => i < get("count"),
					locals: () => [i],
					defer: () => {
						i++;
					},
				};
			},
		}),
		"div/ul/@for/li": ({ get }, ...args) => ({
			tx: args,
		}),
		"div/ul/@for/li/@for": ({ get }) => ({
			$iteration: ([i]) => {
				let j = 0;
				return {
					condition: () => j < i,
					locals: () => [j],
					defer: () => {
						j++;
					},
				};
			},
		}),
		"div/ul/@for/li/@for/span": ({ get }, ...args) => ({
			tx: args,
		}),
		"div/ul/@for/li/@for/span/span": ({ get }, ...args) => ({
			tx: args,
		}),
	};

	const [commit] = (committer = genCommitter(modifiers));

	return {
		onCreated() {
			console.log("has created.");
		},
		onMounted({}) {},
		variables,
		children,
		modifiers,
		mutations_effects,
		mutations_deps,
		deps,
		committer,
	};
});
