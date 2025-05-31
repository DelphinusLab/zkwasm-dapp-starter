# zkWasm CLI Template System Guide

## Overview

The zkWasm CLI uses a modular template system that allows developers to create different types of zkWasm applications. Currently, only the **Basic Hello World** template is available, but the system is designed for easy extension.

## Current Templates

### Basic Template
- **Location**: `templates/basic/`
- **Use Case**: Learning and getting started with zkWasm
- **Features**: Basic Rust zkWasm module, TypeScript service, state management, settlement logic

## Template Structure

Each template consists of:

### 1. Template Definition
```javascript
// In cli/create-project.ts
const TEMPLATES = {
  basic: {
    name: 'Basic zkWasm Hello World',
    description: 'Simple zkWasm application with basic functionality',
    features: ['Rust zkWasm module', 'TypeScript service', 'Basic state management', 'Settlement logic']
  },
  // Future templates:
  advanced: {
    name: 'Advanced zkWasm App',
    description: 'Production-ready zkWasm application with advanced features',
    features: ['Advanced state management', 'Multi-contract support', 'Optimized performance']
  },
  defi: {
    name: 'DeFi zkWasm App',
    description: 'DeFi-focused zkWasm application',
    features: ['Token management', 'Liquidity pools', 'Yield farming']
  }
};
```

### 2. File Organization

The template system uses two types of files:

#### Common Files (shared across all templates)
```
common/
├── Dockerfile.ci           # CI/CD Docker configuration
├── Makefile               # Build automation
├── .gitignore             # Git ignore rules
├── .env.example           # Environment variables template
├── rust-toolchain         # Rust toolchain specification
└── .github/               # GitHub Actions workflows
    └── workflows/
```

#### Template-Specific Files
```
templates/basic/
├── src/                    # Rust source code
│   ├── lib.rs
│   ├── state.rs
│   └── config.rs
├── ts/                     # TypeScript service
│   ├── src/
│   ├── package.json
│   └── tsconfig.json
├── Cargo.toml.template     # Templated Cargo configuration
└── README.md.template      # Templated documentation
```

### 3. File Copying Process

When creating a new project, the CLI:
1. Copies template-specific files from `templates/<template>/`
2. Copies common files from `common/`
3. Generates dynamic files using Mustache templates

### 4. Template Variables
Templates use Mustache templating for dynamic content:

```mustache
# {{projectName}}

{{description}}

## Features
{{#templateFeatures}}
- {{.}}
{{/templateFeatures}}
```

## Adding New Templates

### Step 1: Create Template Directory
```bash
mkdir templates/your-template-name
```

### Step 2: Add Template Files
Create the basic structure:
```
templates/your-template-name/
├── src/                    # Rust source code
├── ts/                     # TypeScript service  
├── Cargo.toml.template     # Templated Cargo.toml
└── README.md.template      # Templated README
```

**Note**: Common files (Makefile, Dockerfile.ci, .gitignore, etc.) are automatically included from the `common/` directory and don't need to be added to individual templates.

### Step 3: Update Template Registry
Add your template to the `TEMPLATES` object in `cli/create-project.ts`:

```javascript
const TEMPLATES = {
  // ... existing templates
  'your-template': {
    name: 'Your Template Name',
    description: 'Description of your template',
    features: ['Feature 1', 'Feature 2', 'Feature 3']
  }
};
```

### Step 4: Update CLI Command (Future)
When multiple templates are available, update the CLI to allow template selection:

```javascript
// In cli/index.ts
program
  .command('create <name>')
  .description('Create a new zkWasm project')
  .option('-t, --template <template>', 'Template to use', 'basic')
  .action((name, options) => {
    createProject(name, options);
  });
```

### Step 5: Test Your Template
1. **Create test project**: `zkwasm-dapp create test-app --template your-template`
2. **Validate structure**: `cd test-app && zkwasm-dapp validate`
3. **Test build**: `cd test-app && zkwasm-dapp build`
4. **Test validation**: `zkwasm-dapp validate`
5. **Test deployment check**: `zkwasm-dapp check`

## Template Variables

### Available Variables
| Variable | Description | Default |
|----------|-------------|---------|
| `{{projectName}}` | Project name | User input |
| `{{description}}` | Project description | User input |
| `{{author}}` | Author name | `zkWasm Developer` |
| `{{description}}` | Project description | `A zkWasm application` |
| `{{version}}` | Initial version | `0.1.0` |
| `{{rustCrateName}}` | Rust crate name | Sanitized project name |
| `{{wasmModuleName}}` | WASM module name | `{project}_bg` |

### Template Features Loop
```mustache
{{#templateFeatures}}
- {{.}}
{{/templateFeatures}}
```