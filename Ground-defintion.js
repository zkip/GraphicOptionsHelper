define(function Demo0({ get, set }) {
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

// mutable iteration with effects
define(function Demo1({ get, set }) {
	const modifiers = {
		count: [
			"div/span",
			"div/ul",
			"div/ul/@for/li",
			"div/ul/@for/li/@for/span",
			"div/ul/@for/li/@for/span/span",
		],
	};
	const mutations_effects = {};
	const mutations_deps = {};
	const deps = {};
	const variables = {
		count: 21,
	};
	const children = {
		div: noop,
		"div/span": ({ get }) => ({ tx: get("count") }),
		"div/ul": () => ({ $name: "container", tags: { container: true } }),
		"div/ul/@for": ({ get, set, def }) => ({
			$iteration: (indices, ...args) => {
				let i = 0;
				return {
					condition: () => i < get("count"),
					defer: () => {
						i++;
					},
				};
			},
		}),
		"div/ul/@for/li": ({ get }, indices, ...args) => ({
			tx: indices,
		}),
		"div/ul/@for/li/@for": ({ get, def, gfs }) => ({
			$types: () => ({
				randCount: "Unit",
			}),
			$effects: () => ({
				randCount: (i) => {
					return ((Math.random() * (i - 1) + 1) >> 0) + 1;
				},
			}),
			// pure function
			$iteration: (indices, ...args) => {
				const [i] = indices;
				let j = 0;
				return {
					condition: () => j < gfs(indices, "randCount", i) * 2,
					defer: () => {
						j += 1;
					},
				};
			},
		}),
		"div/ul/@for/li/@for/span": ({ get }, indices, ...args) => ({
			tx: indices,
		}),
		"div/ul/@for/li/@for/span/span": ({ get }, indices, ...args) => ({
			tx: indices,
		}),
	};

	const committer = genCommitter(modifiers);
	const [commit] = committer;

	let clean;

	return {
		onCreated() {
			console.log("has created.");
		},
		onMounted({}) {
			console.log("has mounted.");
			clean = listen(function click() {
				console.log("--------");
				commit("count", (Math.random() * 22) >> 0);
			});
		},
		onDestroyed() {
			console.log("has destroyed.");
			if (clean) {
				clean();
			}
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

define(function Demo2({ get }) {
	const modifiers = {
		count: [
			"div/input",
			"div/span",
			"div/@for/@if/div",
			"div/@for/@if/div/span",
			"div/@for/@if/div/span/@if/@if/span",
			"div/@for/@if/div/span/@if/@if/span/@if/@for/div",
		],
	};
	const variables = {
		count: 22,
	};
	const children = {
		div: () => ({ $name: "Demo3" }),
		"div/input": ({ set }) => ({
			$name: "input",
			"@input": (e) => set("count", e.target.value),
			value: get("count"),
		}),
		"div/span": ({ get }) => ({ tx: get("count") }),
		"div/@for": () => ({
			$iteration: (indices, ...args) => {
				let i = 0;
				return {
					condition: () => i < get("count"),
					defer: () => i++,
				};
			},
		}),
		"div/@for/@if": ({ get }) => ({
			$condition: ([i], ...args) => i % 2 === 0,
		}),
		"div/@for/@if/div": () => ({ tags: { container: true } }),
		"div/@for/@if/div/span": ({}, [i]) => ({ tx: "Yes" + i }),
		"div/@for/@if/div/span/@if": ({ get }) => ({
			$condition: ([i], ...args) => i < 10,
		}),
		"div/@for/@if/div/span/@if/@if": ({ get }) => ({
			$condition: ([i], ...args) => i % 3 !== 1,
		}),
		"div/@for/@if/div/span/@if/@if/span": ({ get }, indices) => ({
			tx: "p" + indices,
		}),
		"div/@for/@if/div/span/@if/@if/span/@if": ({ get }) => ({
			$condition: ([i], ...args) => i % 4 !== 3,
		}),
		"div/@for/@if/div/span/@if/@if/span/@if/@for": ({ get }, indices) => ({
			$iteration: ([i], ...args) => {
				let j = 0;
				return {
					condition: () => j < i,
					defer: () => j++,
				};
			},
		}),
		"div/@for/@if/div/span/@if/@if/span/@if/@for/div": (
			{ get },
			indices
		) => ({
			tx: "X" + indices,
		}),
	};

	const committer = genCommitter(modifiers);
	const [commit] = committer;

	return {
		onMounted({ input }) {
			// input.addEventListener("inpute")
		},
		modifiers,
		variables,
		children,
		committer,
	};
});

// simple mutable condition
define(function Demo3({ get }) {
	const modifiers = {
		count: ["div/@if", "div/input", "div/@if/span"],
	};

	const variables = {
		count: 0,
	};

	const children = {
		div: noop,
		"div/input": ({ get, set }) => ({
			value: get("count"),
			"@input": (e) => set("count", e.target.value),
		}),
		"div/@if": ({ get }) => ({
			$condition: (indices, ...args) => get("count") > 2,
		}),
		"div/@if/span": () => ({ tx: "Hello" }),
	};

	const committer = genCommitter(modifiers);
	// const [commit] = committer;

	return {
		modifiers,
		variables,
		children,
		committer,
	};
});

// simple mutable iteration
define(function Demo4({ get }) {
	const modifiers = {
		count: [
			"div/input",
			"div/@for/div",
			"div/@for/div/@for/div",
			"div/@for/div/@for/div/span",
		],
		count_a: ["div/@for/div/@for/div", "div/@for/div/@for/div/span"],
	};

	const variables = {
		count: 5,
		count_a: 2,
	};

	const children = {
		div: noop,
		"div/input": ({ get, set }) => ({
			value: get("count"),
			"@input": (e) => set("count", e.target.value),
		}),
		"div/input$2": ({ get, set }) => ({
			value: get("count_a"),
			"@input": (e) => set("count_a", e.target.value),
		}),
		"div/@for": ({ get }) => ({
			$iteration: (indices, ...args) => {
				let i = 0;
				return {
					condition: () => i < get("count"),
					defer: () => i++,
				};
			},
		}),
		// "div/@for/div": () => ({ tx: "Hello" }),
		"div/@for/div": ({}, indices) => ({ tx: indices }),
		"div/@for/div/@for": ({ get }) => ({
			$iteration: ([j], ...args) => {
				let i = 0;
				return {
					condition: () => i < get("count_a"),
					defer: () => i++,
				};
			},
		}),
		"div/@for/div/@for/div": ({}, indices) => ({ tx: indices }),
		"div/@for/div/@for/div/span": ({}, indices) => ({ tx: indices }),
		// "div/@for/span/div": () => ({ tx: "Hello" }),
	};

	const committer = genCommitter(modifiers);
	// const [commit] = committer;

	return {
		modifiers,
		variables,
		children,
		committer,
	};
});

define(function List({ get }) {
	const variables = { name: "", count: 3 };
	const modifiers = {
		name: ["div", "div/div"],
		count: ["div/div", "div/div/@for/span"],
	};
	return {
		variables,
		modifiers,
		children: {
			div: ({ get }) => ({ tx: "Hello, " + get("name") }),
			"div/div": ({ get }) => ({
				tags: {
					container: true,
					[(get("name") || "oo") + get("count")]: true,
				},
			}),
			"div/div/@for": ({ get }) => ({
				$iteration: () => {
					let i = 0;
					return {
						condition: () => i < get("count"),
						defer: () => i++,
					};
				},
			}),
			"div/div/@for/span": ({}, [i]) => ({ tx: i }),
		},
	};
});

// embed components
define(function Demo5({ get }) {
	const modifiers = {
		name: [
			// "div/input",
			"div/span",
			"div/@if/List",
		],
		count: ["div/input", "div/span", "div/@if/div", "div/@if/List"],
	};

	const variables = {
		name: "Uoop",
		count: 2,
	};

	const children = {
		div: () => ({ tags: { Demo5: true } }),
		"div/input": ({ set, get }) => ({
			value: get("count"),
			"@input": (e) => set("count", e.target.value),
		}),
		"div/span": ({ get }) => ({ tx: get("count") }),
		"div/@if": ({ get }) => ({ $condition: () => get("count") < 7 }),
		"div/@if/div": ({ get }) => ({ tx: "SD" + get("count") }),
		"div/@if/List": ({ get }) => ({
			name: get("name"),
			count: get("count"),
		}),
	};

	return {
		variables,
		modifiers,
		children,
	};
});

define(function Demo6({ get }) {
	const modifiers = {
		count: ["input", "span", "@if/Demo1"],
	};

	const variables = {
		count: 7,
	};

	const children = {
		div: () => ({ tags: { Demo6: true } }),
		input: ({ set, get }) => ({
			"@input": (e) => set("count", e.target.value * 1),
			value: get("count"),
		}),
		span: ({ get }) => ({ tx: get("count") }),
		"@if": ({ get }) => ({
			$condition: () => get("count") < 50,
		}),
		"@if/Demo1": ({ get }) => ({ count: get("count") }),
	};

	return { modifiers, variables, children };
});

define(function Demo7({ get }) {
	const modifiers = {
		count: ["div/input", "div/span", "div/@for/div"],
	};
	const variables = {
		count: 10,
	};
	const mutations_deps = {
		randCount: ["count"],
	};
	const children = {
		div: noop,
		"div/input": ({ get, set }) => ({
			"@input": (e) => set("count", e.target.value * 1),
			value: get("count"),
		}),
		"div/span": ({ get, set }) => ({
			tx: get("count"),
		}),
		"div/@for": ({ get, set, gfs }) => ({
			$effects: () => ({
				randCount: () => (Math.random() * get("count")) >> 0,
			}),
			$iteration: (indices, ...args) => {
				let i = 0;
				return {
					condition: () => i < gfs(indices, "randCount"),
					// condition: () => i < get("count"),
					defer() {
						i++;
					},
				};
			},
		}),
		"div/@for/div": ({}, [i]) => ({
			tx: i,
		}),
	};

	// const committer = genCommitter(modifiers);
	// const [commit] = committer;

	let clean;

	return {
		onMounted() {
			// clean = listen(function click() {
			// 	commit("count", (Math.random() * 22) >> 0);
			// });
		},
		onDestroyed() {
			// clean();
		},
		mutations_deps,
		modifiers,
		variables,
		children,
		// committer,
	};
});

define(function Demo8({ get }) {
	const modifiers = {};
	// const variables =

	const children = {
		div: noop,
		"div/@for": ({ gfs }) => ({
			$effects: () => ({
				randCount: () => (Math.random() * 10) >> 0,
			}),
			$iteration: (indices, ...args) => {
				let i = 0;
				return {
					condition: () => i < gfs(indices, "randCount"),
					defer() {
						i++;
					},
				};
			},
		}),
		"div/@for/div$3": ({ get }, [i]) => ({ tx: i }),
		"div/@for/div$2": ({ get }, [i]) => ({ tx: i }),
	};

	return {
		modifiers,
		children,
	};
});
