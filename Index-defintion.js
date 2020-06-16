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
	return {
		onDesdroyed: () => {},
		children: [
			["ul"],
			["ul/@if", "items.length > 3"],
			["ul/@else"],
			["ul/@if/@for", "items", "item, idx"],
			["ul/@else/span", "..."],
			["ul/@if/@for/li", "tag = idx == current ? 'current' : ''"],
			["ul/@if/@for/li/span", ".label", "item"],
		],
		modifiers: {
			"ul/@if": ["condition", "items.length"],
			"ul/@if/@for": ["iteration", "items"],
			"ul/@if/@for/li": ["access", "item"],
		},
	};
});
