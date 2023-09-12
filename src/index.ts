#!/usr/bin/env node
import chalk from 'chalk';
import * as p from '@clack/prompts';

const version = "1.0.0";
let cwd = process.argv[2] || '.';

console.log();
console.log(chalk.gray('create-kitforstartups version ' + version));
console.log();

p.intro('Welcome to KitForStartups!');

if (cwd === '.') {
	const dir = await p.text({
		message: 'Where should we create your project?',
		placeholder: '  (hit Enter to use current directory)'
	});

	if (p.isCancel(dir)) process.exit(1);

	if (dir) {
		cwd = /** @type {string} */ (dir);
	}
}