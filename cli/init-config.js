import chalk from 'chalk';
import { spawn } from 'child_process';
import fs from 'fs-extra';
import inquirer from 'inquirer';
import path from 'path';
export async function initConfig() {
    console.log(chalk.blue('🔧 Initializing zkWasm development environment...\n'));
    // Check current environment
    const envCheck = await checkEnvironment();
    if (!envCheck.isValid) {
        console.log(chalk.red('❌ Environment setup required\n'));
        await setupEnvironment(envCheck);
    }
    else {
        console.log(chalk.green('✅ Environment is already configured\n'));
    }
    // Configure project settings
    await configureProject();
    console.log(chalk.green('\n✅ Configuration completed successfully!'));
}
async function checkEnvironment() {
    const tools = [
        { name: 'rust', cmd: 'rustc', args: ['--version'] },
        { name: 'wasm-pack', cmd: 'wasm-pack', args: ['--version'] },
        { name: 'wasm-opt', cmd: 'wasm-opt', args: ['--version'] },
        { name: 'node', cmd: 'node', args: ['--version'] },
        { name: 'npm', cmd: 'npm', args: ['--version'] }
    ];
    const results = {
        isValid: true,
        missing: [],
        versions: {}
    };
    for (const tool of tools) {
        try {
            const version = await getToolVersion(tool.cmd, tool.args);
            results.versions[tool.name] = version;
            console.log(chalk.green(`✅ ${tool.name}: ${version}`));
        }
        catch (error) {
            results.missing.push(tool.name);
            results.isValid = false;
            console.log(chalk.red(`❌ ${tool.name}: not found`));
        }
    }
    return results;
}
async function getToolVersion(cmd, args) {
    return new Promise((resolve, reject) => {
        const process = spawn(cmd, args, { stdio: 'pipe' });
        let output = '';
        process.stdout.on('data', (data) => {
            output += data.toString();
        });
        process.stderr.on('data', (data) => {
            output += data.toString();
        });
        process.on('close', (code) => {
            if (code === 0) {
                resolve(output.trim().split('\n')[0]);
            }
            else {
                reject(new Error(`Tool not found: ${cmd}`));
            }
        });
        process.on('error', () => {
            reject(new Error(`Tool not found: ${cmd}`));
        });
    });
}
async function setupEnvironment(envCheck) {
    console.log(chalk.yellow('Missing tools detected. Let\'s set them up!\n'));
    const { shouldSetup } = await inquirer.prompt([
        {
            type: 'confirm',
            name: 'shouldSetup',
            message: 'Would you like to automatically install missing tools?',
            default: true
        }
    ]);
    if (!shouldSetup) {
        console.log(chalk.blue('\n📖 Manual installation guide:'));
        printInstallationInstructions(envCheck.missing);
        return;
    }
    // Auto-install missing tools
    for (const tool of envCheck.missing) {
        await installTool(tool);
    }
}
function printInstallationInstructions(missingTools) {
    missingTools.forEach(tool => {
        console.log(chalk.blue(`\n📦 Installing ${tool}:`));
        switch (tool) {
            case 'rust':
                console.log('  curl --proto \'=https\' --tlsv1.2 -sSf https://sh.rustup.rs | sh');
                console.log('  rustup target add wasm32-unknown-unknown');
                break;
            case 'wasm-pack':
                console.log('  curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh');
                break;
            case 'wasm-opt':
                console.log('  # Install binaryen toolkit');
                console.log('  # On macOS: brew install binaryen');
                console.log('  # On Ubuntu: sudo apt install binaryen');
                break;
            case 'node':
                console.log('  # Install Node.js from https://nodejs.org/');
                console.log('  # Or use a version manager like nvm');
                break;
            case 'npm':
                console.log('  # npm comes with Node.js installation');
                break;
        }
    });
}
async function installTool(tool) {
    console.log(chalk.blue(`📦 Installing ${tool}...`));
    try {
        switch (tool) {
            case 'rust':
                await runCommand('curl --proto \'=https\' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y');
                await runCommand('rustup target add wasm32-unknown-unknown');
                break;
            case 'wasm-pack':
                await runCommand('curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh');
                break;
            case 'wasm-opt':
                console.log(chalk.yellow(`⚠️  Please install binaryen manually for your platform`));
                break;
            default:
                console.log(chalk.yellow(`⚠️  Please install ${tool} manually`));
        }
        console.log(chalk.green(`✅ ${tool} installation completed`));
    }
    catch (error) {
        console.log(chalk.red(`❌ Failed to install ${tool}: ${error.message}`));
    }
}
async function runCommand(command) {
    return new Promise((resolve, reject) => {
        const process = spawn('sh', ['-c', command], { stdio: 'inherit' });
        process.on('close', (code) => {
            if (code === 0) {
                resolve();
            }
            else {
                reject(new Error(`Command failed with code ${code}`));
            }
        });
        process.on('error', (error) => {
            reject(error);
        });
    });
}
async function configureProject() {
    console.log(chalk.blue('\n🔧 Project Configuration'));
    const config = await inquirer.prompt([
        {
            type: 'list',
            name: 'environment',
            message: 'Select development environment:',
            choices: [
                { name: 'Development (fast builds, debug info)', value: 'development' },
                { name: 'Production (optimized builds)', value: 'production' },
                { name: 'Testing (with test features)', value: 'testing' }
            ],
            default: 'development'
        },
        {
            type: 'confirm',
            name: 'autoCheck',
            message: 'Enable automatic deployment checks before build?',
            default: true
        },
        {
            type: 'input',
            name: 'outputDir',
            message: 'Build output directory:',
            default: './build-artifacts'
        }
    ]);
    // Generate or update zkwasm.config.json
    const configFile = './zkwasm.config.json';
    let existingConfig = {};
    if (await fs.pathExists(configFile)) {
        existingConfig = await fs.readJson(configFile);
    }
    const newConfig = {
        ...existingConfig,
        environment: config.environment,
        build: {
            target: "wasm32-unknown-unknown",
            optimize: config.environment === 'production',
            outputDir: config.outputDir,
            ...existingConfig.build
        },
        deployment: {
            autoCheck: config.autoCheck,
            environment: config.environment,
            ...existingConfig.deployment
        },
        updatedAt: new Date().toISOString()
    };
    await fs.writeJson(configFile, newConfig, { spaces: 2 });
    console.log(chalk.green(`✅ Configuration saved to ${configFile}`));
    // Create development scripts
    await createDevelopmentScripts(config);
}
async function createDevelopmentScripts(config) {
    const scriptsDir = './scripts';
    await fs.ensureDir(scriptsDir);
    // Create development build script
    const devBuildScript = `#!/bin/bash
# Development build script
set -e

echo "🔨 Building zkWasm application in ${config.environment} mode..."

# Check environment
if ! command -v wasm-pack &> /dev/null; then
    echo "❌ wasm-pack not found. Please install it first."
    exit 1
fi

# Clean previous build
make clean

# Build with appropriate flags
if [ "${config.environment}" = "development" ]; then
    echo "📦 Building in development mode..."
    cargo build --target wasm32-unknown-unknown
    wasm-pack build --dev --out-name application --out-dir pkg
else
    echo "📦 Building in production mode..."
    make build
fi

# Run checks if enabled
${config.autoCheck ? 'echo "🔍 Running deployment checks..."\nnode cli/check-deployment.js' : ''}

echo "✅ Build completed successfully!"
`;
    await fs.writeFile(path.join(scriptsDir, 'dev-build.sh'), devBuildScript);
    await fs.chmod(path.join(scriptsDir, 'dev-build.sh'), '755');
    // Create watch script for development
    const watchScript = `#!/bin/bash
# Development watch script
echo "👀 Watching for changes..."

# Install watchexec if not available
if ! command -v watchexec &> /dev/null; then
    echo "📦 Installing watchexec..."
    cargo install watchexec-cli
fi

# Watch Rust files and rebuild
watchexec -w src -w Cargo.toml -e rs,toml ./scripts/dev-build.sh
`;
    await fs.writeFile(path.join(scriptsDir, 'watch.sh'), watchScript);
    await fs.chmod(path.join(scriptsDir, 'watch.sh'), '755');
    console.log(chalk.green('✅ Development scripts created in ./scripts/'));
}
//# sourceMappingURL=init-config.js.map