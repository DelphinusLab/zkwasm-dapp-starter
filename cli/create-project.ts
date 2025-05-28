import chalk from 'chalk';
import { spawn } from 'child_process';
import fs from 'fs-extra';
import inquirer from 'inquirer';
import Mustache from 'mustache';
import path from 'path';
import { fileURLToPath } from 'url';

interface Template {
  name: string;
  description: string;
  features: string[];
}

interface CreateOptions {
  directory: string;
  skipInstall: boolean;
}

interface ProjectConfig {
  projectName: string;
  template: string;
  author: string;
  description: string;
  version: string;
  useGithubActions: boolean;
  rustCrateName: string;
  wasmModuleName: string;
}

// Template system - currently only basic template is available
// To add new templates:
// 1. Add template definition to TEMPLATES object
// 2. Create template-specific files in templates/ directory
// 3. Add template-specific logic in generateTemplatedFiles()
const TEMPLATES: Record<string, Template> = {
  basic: {
    name: 'Basic zkWasm Hello World',
    description: 'A simple zkWasm application with basic state management and settlement logic',
    features: ['Rust zkWasm module', 'TypeScript service', 'Basic state management', 'Settlement logic']
  }
  // Future templates can be added here:
  // advanced: { ... },
  // defi: { ... }
};

export async function createProject(projectName: string, options: CreateOptions): Promise<void> {
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
  console.log('   zkwasm-dapp init     # Initialize development environment');
  console.log('   zkwasm-dapp build    # Build the project');
  console.log('   zkwasm-dapp check    # Check deployment readiness');
  
  console.log(chalk.yellow('\n🔧 Template System:'));
  console.log('   • Currently using: Basic Hello World template');
  console.log('   • To add more templates: See cli/create-project.ts');
  console.log('   • Template files: Use current src/ as reference');
}

async function collectProjectConfig(projectName: string, template: string): Promise<ProjectConfig> {
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
      message: 'Setup GitHub Actions CI/CD for deployment?',
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

async function copyTemplateFiles(template: string, targetDir: string, config: ProjectConfig): Promise<void> {
  // Get the directory where this script is located
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  
  // Template directory is relative to the CLI package installation
  const templateDir = path.resolve(__dirname, '..', 'templates', template);
  
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
  
  // Copy template-specific optional files
  const templateOptionalFiles = [
    'Cargo.lock'
  ];
  
  for (const file of templateOptionalFiles) {
    const sourcePath = path.join(templateDir, file);
    const targetPath = path.join(targetDir, file);
    
    if (await fs.pathExists(sourcePath)) {
      await fs.copy(sourcePath, targetPath);
      console.log(chalk.gray(`  ✓ Copied ${file} from template`));
    }
  }
  
  // Copy common files from package directory (one level up from cli/)
  const packageDir = path.resolve(__dirname, '..');
  const commonFiles = [
    '.gitignore',
    '.env.example',
    'rust-toolchain',
    'Makefile'
  ];
  
  for (const file of commonFiles) {
    const sourcePath = path.join(packageDir, file);
    const targetPath = path.join(targetDir, file);
    
    if (await fs.pathExists(sourcePath)) {
      await fs.copy(sourcePath, targetPath);
      console.log(chalk.gray(`  ✓ Copied ${file} from package directory`));
    }
  }
  
  // Copy .github directory if GitHub Actions is enabled
  if (config.useGithubActions) {
    const githubSourcePath = path.join(packageDir, '.github');
    const githubTargetPath = path.join(targetDir, '.github');
    
    if (await fs.pathExists(githubSourcePath)) {
      await fs.copy(githubSourcePath, githubTargetPath);
      console.log(chalk.gray(`  ✓ Copied .github/ from package directory`));
    }
  }
  
  // Generate templated files
  await generateTemplatedFiles(targetDir, config, template, templateDir);
}

async function generateTemplatedFiles(targetDir: string, config: ProjectConfig, template: string, templateDir: string): Promise<void> {
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

async function generateConfigFiles(targetDir: string, config: ProjectConfig): Promise<void> {
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
}

async function installDependencies(targetDir: string): Promise<void> {
  console.log(chalk.blue('📦 Installing dependencies...'));
  
  const tsDir = path.join(targetDir, 'ts');
  
  // Install npm dependencies
  await new Promise<void>((resolve, reject) => {
    const npmInstall = spawn('npm', ['install'], {
      cwd: tsDir,
      stdio: 'pipe'
    });
    
    npmInstall.on('close', (code: number | null) => {
      if (code === 0) {
        console.log(chalk.green('✅ Dependencies installed successfully'));
        resolve();
      } else {
        reject(new Error(`npm install failed with code ${code}`));
      }
    });
    
    npmInstall.on('error', (error: Error) => {
      reject(new Error(`Failed to run npm install: ${error.message}`));
    });
  });
  
  // Compile TypeScript
  console.log(chalk.blue('🔧 Compiling TypeScript...'));
  
  await new Promise<void>((resolve, reject) => {
    const tscCompile = spawn('npx', ['tsc'], {
      cwd: tsDir,
      stdio: 'pipe'
    });
    
    tscCompile.on('close', (code: number | null) => {
      if (code === 0) {
        console.log(chalk.green('✅ TypeScript compiled successfully'));
        resolve();
      } else {
        reject(new Error(`TypeScript compilation failed with code ${code}`));
      }
    });
    
    tscCompile.on('error', (error: Error) => {
      reject(new Error(`Failed to run TypeScript compilation: ${error.message}`));
    });
  });
}

async function initializeGit(targetDir: string): Promise<void> {
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