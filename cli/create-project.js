import chalk from 'chalk';
import { spawn } from 'child_process';
import fs from 'fs-extra';
import inquirer from 'inquirer';
import Mustache from 'mustache';
import path from 'path';
// Template system - currently only basic template is available
// To add new templates:
// 1. Add template definition to TEMPLATES object
// 2. Create template-specific files in templates/ directory
// 3. Add template-specific logic in generateTemplatedFiles()
const TEMPLATES = {
    basic: {
        name: 'Basic zkWasm Hello World',
        description: 'A simple zkWasm application with basic state management and settlement logic',
        features: ['Rust zkWasm module', 'TypeScript service', 'Basic state management', 'Settlement logic']
    }
    // Future templates can be added here:
    // advanced: { ... },
    // defi: { ... }
};
export async function createProject(projectName, options) {
    const targetDir = path.resolve(options.directory, projectName);
    // Check if directory already exists
    if (await fs.pathExists(targetDir)) {
        throw new Error(`Directory ${projectName} already exists`);
    }
    // Currently only basic template is supported
    const template = 'basic';
    console.log(chalk.blue(`🚀 Creating zkWasm project: ${projectName}`));
    console.log(chalk.gray(`Template: ${TEMPLATES[template].name}`));
    console.log(chalk.gray(`Description: ${TEMPLATES[template].description}`));
    console.log(chalk.yellow('\n💡 This is a Hello World template with basic zkWasm functionality'));
    // Collect project configuration
    const config = await collectProjectConfig(projectName, template);
    // Create project directory
    await fs.ensureDir(targetDir);
    // Copy template files
    await copyTemplateFiles(template, targetDir, config);
    // Generate configuration files
    await generateConfigFiles(targetDir, config);
    // Install dependencies if not skipped
    if (!options.skipInstall) {
        await installDependencies(targetDir);
    }
    // Initialize git repository
    await initializeGit(targetDir);
    console.log(chalk.green(`\n✅ Project ${projectName} created successfully!`));
    console.log(chalk.blue('\n📖 Next steps:'));
    console.log(`   cd ${projectName}`);
    console.log('   zkwasm init     # Initialize development environment');
    console.log('   zkwasm build    # Build the project');
    console.log('   zkwasm check    # Check deployment readiness');
    console.log(chalk.yellow('\n🔧 Template System:'));
    console.log('   • Currently using: Basic Hello World template');
    console.log('   • To add more templates: See cli/create-project.ts');
    console.log('   • Template files: Use current src/ as reference');
}
async function collectProjectConfig(projectName, template) {
    const questions = [
        {
            type: 'input',
            name: 'author',
            message: 'Author name:',
            default: 'zkWasm Developer'
        },
        {
            type: 'input',
            name: 'description',
            message: 'Project description:',
            default: `A zkWasm Hello World application`
        },
        {
            type: 'input',
            name: 'version',
            message: 'Initial version:',
            default: '0.1.0'
        },
        {
            type: 'confirm',
            name: 'useGithubActions',
            message: 'Setup GitHub Actions CI/CD?',
            default: true
        }
    ];
    const answers = await inquirer.prompt(questions);
    return {
        projectName,
        template,
        ...answers,
        rustCrateName: projectName.toLowerCase().replace(/[^a-z0-9]/g, '_'),
        wasmModuleName: `${projectName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_bg`
    };
}
async function copyTemplateFiles(template, targetDir, config) {
    const templateDir = path.resolve('./templates', template);
    console.log(chalk.blue('📁 Copying template files...'));
    // Check if template directory exists
    if (!await fs.pathExists(templateDir)) {
        throw new Error(`Template directory not found: ${templateDir}`);
    }
    // Copy template-specific files from template directory
    const templateFiles = [
        'src/',
        'ts/'
    ];
    for (const file of templateFiles) {
        const sourcePath = path.join(templateDir, file);
        const targetPath = path.join(targetDir, file);
        if (await fs.pathExists(sourcePath)) {
            await fs.copy(sourcePath, targetPath);
            console.log(chalk.gray(`  ✓ Copied ${file} from template`));
        }
    }
    // Copy common files from main directory
    const commonFiles = [
        '.gitignore',
        'rust-toolchain',
        'Makefile'
    ];
    for (const file of commonFiles) {
        const sourcePath = path.join('.', file);
        const targetPath = path.join(targetDir, file);
        if (await fs.pathExists(sourcePath)) {
            await fs.copy(sourcePath, targetPath);
            console.log(chalk.gray(`  ✓ Copied ${file} from main directory`));
        }
    }
    // Generate templated files
    await generateTemplatedFiles(targetDir, config, template, templateDir);
}
async function generateTemplatedFiles(targetDir, config, template, templateDir) {
    console.log(chalk.blue('🔧 Generating configuration files...'));
    // Generate Cargo.toml from template
    const cargoTemplatePath = path.join(templateDir, 'Cargo.toml.template');
    if (await fs.pathExists(cargoTemplatePath)) {
        const cargoTemplate = await fs.readFile(cargoTemplatePath, 'utf8');
        const cargoContent = Mustache.render(cargoTemplate, config);
        await fs.writeFile(path.join(targetDir, 'Cargo.toml'), cargoContent);
        console.log(chalk.gray('  ✓ Generated Cargo.toml'));
    }
    // Generate README from template
    const readmeTemplatePath = path.join(templateDir, 'README.md.template');
    if (await fs.pathExists(readmeTemplatePath)) {
        const readmeTemplate = await fs.readFile(readmeTemplatePath, 'utf8');
        const templateFeatures = TEMPLATES[template].features || [];
        const readmeContent = Mustache.render(readmeTemplate, {
            ...config,
            templateFeatures
        });
        await fs.writeFile(path.join(targetDir, 'README.md'), readmeContent);
        console.log(chalk.gray('  ✓ Generated README.md'));
    }
}
async function generateConfigFiles(targetDir, config) {
    // Generate deployment history tracking file
    const deploymentHistory = {
        project: config.projectName,
        created: new Date().toISOString(),
        deployments: []
    };
    await fs.writeJson(path.join(targetDir, 'deployment-history.json'), deploymentHistory, { spaces: 2 });
    // Generate zkwasm config file
    const zkwasmConfig = {
        project: {
            name: config.projectName,
            version: config.version,
            author: config.author,
            description: config.description
        },
        build: {
            target: "wasm32-unknown-unknown",
            optimize: true
        },
        deployment: {
            environment: "development",
            auto_check: true
        }
    };
    await fs.writeJson(path.join(targetDir, 'zkwasm.config.json'), zkwasmConfig, { spaces: 2 });
    // Generate GitHub Actions workflow if requested
    if (config.useGithubActions) {
        await generateGitHubActions(targetDir, config);
    }
}
async function generateGitHubActions(targetDir, config) {
    const workflowDir = path.join(targetDir, '.github', 'workflows');
    await fs.ensureDir(workflowDir);
    const workflow = `name: Build and Test

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Install Rust
      uses: dtolnay/rust-toolchain@stable
      with:
        targets: wasm32-unknown-unknown
    
    - name: Install wasm-pack
      run: curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh
      
    - name: Install wasm-opt
      run: |
        wget https://github.com/WebAssembly/binaryen/releases/latest/download/binaryen-version_108-x86_64-linux.tar.gz
        tar -xzf binaryen-version_108-x86_64-linux.tar.gz
        sudo cp binaryen-version_108/bin/wasm-opt /usr/local/bin/
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        
    - name: Install TypeScript dependencies
      run: cd ts && npm install
      
    - name: Build project
      run: make build
      
    - name: Run tests
      run: make test
      
    - name: Check deployment readiness
      run: npx zkwasm-cli check --verbose
`;
    await fs.writeFile(path.join(workflowDir, 'build.yml'), workflow);
}
async function installDependencies(targetDir) {
    console.log(chalk.blue('📦 Installing dependencies...'));
    return new Promise((resolve, reject) => {
        const tsDir = path.join(targetDir, 'ts');
        const npmInstall = spawn('npm', ['install'], {
            cwd: tsDir,
            stdio: 'pipe'
        });
        npmInstall.on('close', (code) => {
            if (code === 0) {
                console.log(chalk.green('✅ Dependencies installed successfully'));
                resolve();
            }
            else {
                reject(new Error(`npm install failed with code ${code}`));
            }
        });
        npmInstall.on('error', (error) => {
            reject(new Error(`Failed to run npm install: ${error.message}`));
        });
    });
}
async function initializeGit(targetDir) {
    console.log(chalk.blue('🔧 Initializing Git repository...'));
    return new Promise((resolve) => {
        const gitInit = spawn('git', ['init'], {
            cwd: targetDir,
            stdio: 'pipe'
        });
        gitInit.on('close', () => {
            console.log(chalk.green('✅ Git repository initialized'));
            resolve();
        });
        gitInit.on('error', () => {
            console.log(chalk.yellow('⚠️  Git not available, skipping repository initialization'));
            resolve();
        });
    });
}
//# sourceMappingURL=create-project.js.map