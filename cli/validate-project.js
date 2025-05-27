import chalk from 'chalk';
import fs from 'fs-extra';
export async function validateProject() {
    console.log(chalk.blue('🔍 Validating project structure...\n'));
    const results = {
        success: true,
        errors: [],
        warnings: []
    };
    // Check project structure
    await validateProjectStructure(results);
    // Check configuration files
    await validateConfigFiles(results);
    // Check dependencies
    await validateDependencies(results);
    // Display results
    displayResults(results);
    if (!results.success) {
        throw new Error('Project validation failed');
    }
}
async function validateProjectStructure(results) {
    console.log(chalk.blue('📁 Checking project structure...'));
    const requiredDirs = [
        'src',
        'ts',
        'ts/src'
    ];
    const requiredFiles = [
        'Cargo.toml',
        'Makefile',
        'ts/package.json',
        'ts/tsconfig.json'
    ];
    // Check directories
    for (const dir of requiredDirs) {
        if (!await fs.pathExists(dir)) {
            results.errors.push(`Missing directory: ${dir}`);
            results.success = false;
        }
        else {
            console.log(chalk.green(`  ✅ ${dir}/`));
        }
    }
    // Check files
    for (const file of requiredFiles) {
        if (!await fs.pathExists(file)) {
            results.errors.push(`Missing file: ${file}`);
            results.success = false;
        }
        else {
            console.log(chalk.green(`  ✅ ${file}`));
        }
    }
}
async function validateConfigFiles(results) {
    console.log(chalk.blue('\n⚙️  Validating configuration files...'));
    // Validate Cargo.toml
    await validateCargoToml(results);
    // Validate package.json
    await validatePackageJson(results);
    // Validate tsconfig.json
    await validateTsConfig(results);
    // Validate zkwasm.config.json (optional)
    await validateZkWasmConfig(results);
}
async function validateCargoToml(results) {
    try {
        const cargoContent = await fs.readFile('Cargo.toml', 'utf8');
        // Basic validation
        if (!cargoContent.includes('[package]')) {
            results.errors.push('Cargo.toml missing [package] section');
            results.success = false;
        }
        if (!cargoContent.includes('crate-type = ["cdylib"]')) {
            results.warnings.push('Cargo.toml should include crate-type = ["cdylib"] for WASM');
        }
        console.log(chalk.green('  ✅ Cargo.toml is valid'));
    }
    catch (error) {
        results.errors.push(`Failed to read Cargo.toml: ${error.message}`);
        results.success = false;
    }
}
async function validatePackageJson(results) {
    try {
        const packageJson = await fs.readJson('ts/package.json');
        if (!packageJson.name) {
            results.errors.push('package.json missing name field');
            results.success = false;
        }
        if (!packageJson.scripts) {
            results.warnings.push('package.json missing scripts section');
        }
        console.log(chalk.green('  ✅ package.json is valid'));
    }
    catch (error) {
        results.errors.push(`Failed to read package.json: ${error.message}`);
        results.success = false;
    }
}
async function validateTsConfig(results) {
    try {
        const tsConfig = await fs.readJson('ts/tsconfig.json');
        if (!tsConfig.compilerOptions) {
            results.errors.push('tsconfig.json missing compilerOptions');
            results.success = false;
        }
        const target = tsConfig.compilerOptions?.target;
        if (target && !['ES2020', 'ES2021', 'ES2022', 'ESNext', 'ESNEXT'].includes(target)) {
            results.warnings.push(`tsconfig.json target "${target}" may not be optimal for zkWasm`);
        }
        console.log(chalk.green('  ✅ tsconfig.json is valid'));
    }
    catch (error) {
        results.errors.push(`Failed to read tsconfig.json: ${error.message}`);
        results.success = false;
    }
}
async function validateZkWasmConfig(results) {
    if (await fs.pathExists('zkwasm.config.json')) {
        try {
            const zkwasmConfig = await fs.readJson('zkwasm.config.json');
            if (!zkwasmConfig.build) {
                results.warnings.push('zkwasm.config.json missing build section');
            }
            console.log(chalk.green('  ✅ zkwasm.config.json is valid'));
        }
        catch (error) {
            results.errors.push(`Failed to read zkwasm.config.json: ${error.message}`);
            results.success = false;
        }
    }
    else {
        results.warnings.push('zkwasm.config.json not found (optional)');
    }
}
async function validateDependencies(results) {
    console.log(chalk.blue('\n📦 Checking dependencies...'));
    // Check if node_modules exists in ts directory
    if (!await fs.pathExists('ts/node_modules')) {
        results.errors.push('TypeScript dependencies not installed. Run: cd ts && npm install');
        results.success = false;
    }
    else {
        console.log(chalk.green('  ✅ TypeScript dependencies installed'));
    }
    // Check if TypeScript compilation works
    try {
        const { spawn } = await import('child_process');
        const tscCheck = spawn('npx', ['tsc', '--noEmit'], {
            cwd: 'ts',
            stdio: 'pipe'
        });
        let hasErrors = false;
        tscCheck.stderr.on('data', (data) => {
            if (data.toString().includes('error')) {
                hasErrors = true;
            }
        });
        tscCheck.on('close', (code) => {
            if (code !== 0 || hasErrors) {
                results.errors.push('TypeScript compilation errors detected');
                results.success = false;
            }
            else {
                console.log(chalk.green('  ✅ TypeScript compilation check passed'));
            }
        });
        // Wait for the process to complete
        await new Promise((resolve) => {
            tscCheck.on('close', resolve);
        });
    }
    catch (error) {
        results.warnings.push('Could not check TypeScript compilation');
    }
}
function displayResults(results) {
    console.log('\n' + chalk.blue('📋 Validation Summary:'));
    if (results.success) {
        console.log(chalk.green('✅ All validation checks passed!'));
    }
    else {
        console.log(chalk.red('❌ Validation failed!'));
    }
    if (results.errors.length > 0) {
        console.log(chalk.red(`\n❌ Errors (${results.errors.length}):`));
        results.errors.forEach(error => {
            console.log(chalk.red(`  - ${error}`));
        });
    }
    if (results.warnings.length > 0) {
        console.log(chalk.yellow(`\n⚠️  Warnings (${results.warnings.length}):`));
        results.warnings.forEach(warning => {
            console.log(chalk.yellow(`  - ${warning}`));
        });
    }
}
//# sourceMappingURL=validate-project.js.map