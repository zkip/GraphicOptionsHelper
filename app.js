addEventListener("load", start);

const M = new Map();

const CstorM = new Map();

function define(cstor) {
	const { name } = cstor;
	if (!CstorM.has(name)) {
		CstorM.set(name, cstor);
	}
}

function instancing(name, ...props) {
	const cstor = CstorM.get(name) || (() => {});
	return cstor(...props);
}

function loadDefintion(name) {
	return new Promise((rv) => {
		const head_dom = document.querySelector("head");
		const script_dom = document.createElement("script");
		script_dom.src = `${name}-defintion.js`;
		const errorHandle = () => {
			head_dom.removeChild(script_dom);
			removeEventListener("error", errorHandle, true);
		};
		addEventListener("error", errorHandle, true);
		if (!M.has(name)) {
			script_dom.onload = () => {
				M.set(name, script_dom);
				console.log(name, " has loaded.");
			};
			head_dom.appendChild(script_dom);
		} else {
			rv();
		}
	});
}

function removeDefintion(name) {
	M.delete(name);
	CstorM.delete(name);
}

async function start() {
	const buttom_dom = document.querySelector(".loadDefintionBtn");
	const nameInput_dom = document.querySelector(".name");
	const executeBtn_dom = document.querySelector(".executeBtn");
	const removeInput_dom = document.querySelector(".remove");
	const removeDefintionBtn_dom = document.querySelector(
		".removeDefintionBtn"
	);

	buttom_dom.addEventListener("click", async () => {
		await loadDefintion(nameInput_dom.value);
	});

	removeDefintionBtn_dom.addEventListener("click", () => {
		removeDefintion(removeInput_dom.value);
	});

	executeBtn_dom.addEventListener("click", () => {
		app();
	});
}

function app() {
	const people = instancing("People");
	console.log(people);
}