#!/usr/bin/env node
import chalk from 'chalk';
import * as p from '@clack/prompts';
import * as fs from 'fs';
import commandExists from 'command-exists';
import shelljs from 'shelljs';

const version = "1.0.0";
let cwd = process.argv[2] || '.';

console.log();
console.log(chalk.gray('create-kitforstartups version ' + version));
console.log();

p.intro('Welcome to KitForStartups!');

async function check_command(command: string) {
    return await commandExists(command).then(() => true).catch(() => false);
}

if (cwd === '.') {
    const dir = await p.text({
        message: 'Where should your project be created?',
        placeholder: '  (hit Enter to use current directory)'
    });

    cwd = dir as string || '.';
}

if (fs.existsSync(cwd) && fs.readdirSync(cwd).length > 0) {
    p.log.error("Directory " + cwd + " is not empty. Can't continue");
    process.exit(1);
}

let create_git_repo = await p.confirm({
    message: 'Do you want to create a Git repository?',
    initialValue: true
});

p.log.step("Checking dependencies");

let had_error = false;

if (await check_command('git')) {
    p.log.info("Git is installed");
} else {
    p.log.error("Git is not installed");
    had_error = true;
}

if (await check_command('pnpm')) {
    p.log.info("PNPM is installed");
} else {
    p.log.error("PNPM is not installed");
    had_error = true;
}

let node_version = process.version.split('.')[0].replace('v', '');
if (parseInt(node_version) >= 18) {
    p.log.info("Node.js version v18 or later is installed");
} else {
    p.log.error("Node.js version v18 or later is not installed");
    had_error = true;
}

if (await check_command('docker')) {
    p.log.info("Docker is installed");
} else {
    p.log.error("Docker is not installed " + chalk.gray("(optional)"));
}

// docker compose
if (await check_command('docker-compose')) {
    p.log.info("Docker Compose is installed");
} else {
    p.log.error("Docker Compose is not installed " + chalk.gray("(optional)"));
}

if (had_error) {
    p.log.error("Please install the missing dependencies and try again");
    process.exit(1);
}


p.log.step("Creating project in " + cwd);

// make sure the directory exists
if (!fs.existsSync(cwd)) {
    fs.mkdirSync(cwd);
}

// create the project directory
fs.mkdirSync(cwd, { recursive: true });
let original_cwd = process.cwd();

shelljs.cd(cwd);
shelljs.exec('git clone https://github.com/okupter/kitforstartups.git .', {silent:true});

// Delete .git directory
shelljs.rm('-rf', '.git');

if (create_git_repo) {
    shelljs.exec('git init', {silent:true});
    shelljs.exec('git add .', {silent:true});
}

// ask if we should initialize a dev environment for them
let init_dev_env = await p.confirm({
    message: 'Do you want to initialize a development environment?',
    initialValue: true
});

function clenaup() {
    shelljs.cd(original_cwd);

    p.outro(`Your project is ready! To get started:
    - cd ${cwd}
    - pnpm install
    
Happy coding!`);
}

if (!init_dev_env) {
    clenaup();
    process.exit(0);
} 

p.log.step("Initializing development environment currently not supported.");