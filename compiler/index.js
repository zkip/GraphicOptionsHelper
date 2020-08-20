const compiler = require("vue-template-compiler");

const template = `
<div>
	<span>{{name}}</span>
</div>
`;

const result = compiler.compile(template);
console.log(result);

while (true);
