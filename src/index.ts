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

p.log.step("Initializing development environment");

/*
WE NEED TO GENERATE THIS ENV FILE: 

# DATABASE

ENABLE_DRIZZLE_LOGGER=true

## MySQL

MYSQL_DB_HOST=
MYSQL_DB_PORT=
MYSQL_DB_USER=
MYSQL_DB_PASSWORD=
MYSQL_DB_NAME=

## POSTGRES
POSTGRES_DB_HOST=
POSTGRES_DB_PORT=
POSTGRES_DB_USER=
POSTGRES_DB_PASSWORD=
POSTGRES_DB_NAME=
POSTGRES_MAX_CONNECTIONS=

## TURSO

TURSO_DB_URL=
TURSO_AUTH_TOKEN=

# OAUTH

GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

GOOGLE_OAUTH_CLIENT_ID=
GOOGLE_OAUTH_CLIENT_SECRET=
GOOGLE_OAUTH_REDIRECT_URI=

# EMAIL

RESEND_API_KEY=
*/

// We'll just use mysql for now - TODO add postgres support

// Ask if we should use mysql from docker
let use_mysql_with_docker = await p.confirm({
    message: 'Do you want to use MySQL from Docker?',
    initialValue: true
});

let mysql_db_host = 'localhost';
let mysql_db_port = '3306';
let mysql_db_user = 'root';
let mysql_db_password = 'password';
let mysql_db_name = 'kitforstartups-mysql';

if (use_mysql_with_docker) {
    p.log.info("Your MySQL database will be available at " + chalk.bold("mysql://" + mysql_db_host + ":" + mysql_db_port) + " with username " + chalk.bold(mysql_db_user) + " and password " + chalk.bold(mysql_db_password) + " and database name " + chalk.bold(mysql_db_name));

    // start the container in the background ("docker-compose -f docker/mysql.yml up -d")
    shelljs.exec('docker-compose -f docker/mysql.yml up -d');
} else {
    mysql_db_host = await p.text({
        message: 'MySQL host',
        placeholder: 'localhost'
    }) as string;

    mysql_db_port = await p.text({
        message: 'MySQL port',
        placeholder: '3306'
    }) as string;

    mysql_db_user = await p.text({
        message: 'MySQL user',
        placeholder: 'root'
    }) as string;

    mysql_db_password = await p.text({
        message: 'MySQL password',
        placeholder: 'password'
    }) as string;

    mysql_db_name = await p.text({
        message: 'MySQL database name',
        placeholder: 'kitforstartups-mysql'
    }) as string;
}

// no postgres support yet

// use turso?
let turso_db_url = "";
let turso_auth_token = "";

let use_turso = await p.confirm({
    message: 'Do you want to setup Turso now?',
    initialValue: true
});

if (use_turso) {
    // get the auth token
    turso_auth_token = await p.text({
        message: 'Turso auth token'
    }) as string;

    // get the database url
    turso_db_url = await p.text({
        message: 'Turso database URL'
    }) as string;
}

let use_github_oauth = await p.confirm({
    message: 'Do you want to setup GitHub OAuth now?',
    initialValue: true
});

let github_client_id = '';
let github_client_secret = '';

if (use_github_oauth) {
    github_client_id = await p.text({
        message: 'GitHub OAuth client ID'
    }) as string;

    github_client_secret = await p.text({
        message: 'GitHub OAuth client secret'
    }) as string;
}

let use_google_oauth = await p.confirm({
    message: 'Do you want to setup Google OAuth now?',
    initialValue: true
});

let google_oauth_client_id = '';
let google_oauth_client_secret = '';
let google_oauth_redirect_uri = '';

if (use_google_oauth) {
    google_oauth_client_id = await p.text({
        message: 'Google OAuth client ID'
    }) as string;

    google_oauth_client_secret = await p.text({
        message: 'Google OAuth client secret'
    }) as string;

    google_oauth_redirect_uri = await p.text({
        message: 'Google OAuth redirect URI'
    }) as string;
}

let use_email = await p.confirm({
    message: 'Do you want to setup email now?',
    initialValue: true
});

let email_resend_api_key = '';

if (use_email) {
    email_resend_api_key = await p.text({
        message: 'Email resend API key'
    }) as string;
}

let env_file = `# DATABASE
ENABLE_DRIZZLE_LOGGER=true

## MySQL
MYSQL_DB_HOST=${mysql_db_host}
MYSQL_DB_PORT=${mysql_db_port}
MYSQL_DB_USER=${mysql_db_user}
MYSQL_DB_PASSWORD=${mysql_db_password}
MYSQL_DB_NAME=${mysql_db_name}

## POSTGRES
POSTGRES_DB_HOST=
POSTGRES_DB_PORT=
POSTGRES_DB_USER=
POSTGRES_DB_PASSWORD=
POSTGRES_DB_NAME=
POSTGRES_MAX_CONNECTIONS=

## TURSO
TURSO_DB_URL=${turso_db_url}
TURSO_AUTH_TOKEN=${turso_auth_token}

# OAUTH
GITHUB_CLIENT_ID=${github_client_id}
GITHUB_CLIENT_SECRET=${github_client_secret}

GOOGLE_OAUTH_CLIENT_ID=${google_oauth_client_id}
GOOGLE_OAUTH_CLIENT_SECRET=${google_oauth_client_secret}
GOOGLE_OAUTH_REDIRECT_URI=${google_oauth_redirect_uri}

# EMAIL
RESEND_API_KEY=${email_resend_api_key}
`;

fs.writeFileSync('.env', env_file);

if (await p.confirm({
    message: 'Do you want to start mailhog?',
    initialValue: true
})) {
    shelljs.exec('docker-compose -f docker/mailhog.yml up -d');
}

clenaup();