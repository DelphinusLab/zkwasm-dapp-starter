#!/usr/bin/env node
import chalk from 'chalk';
import { spawn } from 'child_process';
import { Command } from 'commander';
import fs from 'fs-extra';
import inquirer from 'inquirer';
import { checkDeployment } from './check-deployment.js';
import { createProject } from './create-project.js';
import { generatePublishScript } from './generate-publish.js';
import { initConfig } from './init-config.js';
import { validateProject } from './validate-project.js';
const program = new Command();
program
    .name('zkwasm')
    .description('CLI tool for creating and managing zkWasm applications')
    .version('1.0.0');
program
    .command('create <project-name>')
    .description('Create a new zkWasm project (Hello World template)')
    .option('-d, --directory <dir>', 'Target directory', '.')
    .option('--skip-install', 'Skip npm install')
    .action(async (projectName, options) => {
    console.log(chalk.blue(`🚀 Creating zkWasm project: ${projectName}`));
    try {
        await createProject(projectName, options);
        console.log(chalk.green(`✅ Project ${projectName} created successfully!`));
    }
    catch (error) {
        console.error(chalk.red(`❌ Error creating project: ${error.message}`));
        process.exit(1);
    }
});
program
    .command('check')
    .description('Check deployment readiness')
    .option('-v, --verbose', 'Verbose output')
    .action(async (options) => {
    console.log(chalk.blue('🔍 Checking deployment readiness...'));
    try {
        const result = await checkDeployment(options);
    }
    catch (error) {
        console.error(chalk.red(`❌ Error during check: ${error.message}`));
        process.exit(1);
    }
});
program
    .command('init')
    .description('Initialize zkWasm configuration')
    .action(async () => {
    console.log(chalk.blue('⚙️  Initializing zkWasm configuration...'));
    try {
        await initConfig();
        console.log(chalk.green('✅ Configuration initialized!'));
    }
    catch (error) {
        console.error(chalk.red(`❌ Error initializing config: ${error.message}`));
        process.exit(1);
    }
});
program
    .command('validate')
    .description('Validate current project structure')
    .action(async () => {
    console.log(chalk.blue('🔍 Validating project structure...'));
    try {
        await validateProject();
        console.log(chalk.green('✅ Project structure is valid!'));
    }
    catch (error) {
        console.error(chalk.red(`❌ Validation failed: ${error.message}`));
        process.exit(1);
    }
});
program
    .command('build')
    .description('Build the zkWasm application')
    .option('--release', 'Build in release mode')
    .action(async (options) => {
    console.log(chalk.blue('🔨 Building zkWasm application...'));
    const buildProcess = spawn('make', ['build'], { stdio: 'inherit' });
    buildProcess.on('close', (code) => {
        if (code === 0) {
            console.log(chalk.green('✅ Build completed successfully!'));
        }
        else {
            console.error(chalk.red(`❌ Build failed with code ${code}`));
            process.exit(code || 1);
        }
    });
});
program
    .command('publish')
    .description('Generate or run publish.sh script for zkWasm hub\n                     - If script exists: choose to run or regenerate\n                     - If script missing: generate new script')
    .action(async () => {
    try {
        const publishPath = './ts/publish.sh';
        if (await fs.pathExists(publishPath)) {
            console.log(chalk.blue('📄 Found existing publish.sh script'));
            const { action } = await inquirer.prompt([
                {
                    type: 'list',
                    name: 'action',
                    message: 'What would you like to do?',
                    choices: [
                        { name: '🚀 Run existing script', value: 'run' },
                        { name: '🔄 Regenerate script', value: 'regenerate' },
                        { name: '❌ Cancel', value: 'cancel' }
                    ]
                }
            ]);
            if (action === 'cancel') {
                console.log(chalk.yellow('Operation cancelled.'));
                return;
            }
            if (action === 'regenerate') {
                console.log(chalk.blue('🔄 Regenerating publish script...'));
                await generatePublishScript();
            }
            else if (action === 'run') {
                console.log(chalk.blue('🚀 Running existing publish script...'));
                // Run the publish script in ts directory
                const publishProcess = spawn('bash', ['publish.sh'], {
                    stdio: 'inherit',
                    cwd: './ts'
                });
                publishProcess.on('close', (code) => {
                    if (code !== 0) {
                        console.error(chalk.red(`❌ Publish failed with code ${code}`));
                        process.exit(code || 1);
                    }
                });
                publishProcess.on('error', (error) => {
                    console.error(chalk.red(`❌ Failed to run publish script: ${error.message}`));
                    process.exit(1);
                });
            }
        }
        else {
            console.log(chalk.blue('📄 No publish.sh script found, generating new one...'));
            await generatePublishScript();
        }
    }
    catch (error) {
        console.error(chalk.red(`❌ Failed to handle publish command: ${error.message}`));
        process.exit(1);
    }
});
program.parse(process.argv);
//# sourceMappingURL=index.js.map