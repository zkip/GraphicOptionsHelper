function render(name, ...props) {
	if (CstorM.has(name)) {
		const cstor = CstorM.get(name);
		// Lifecycle::init
		const tail = cstor(...props);
	}
}
