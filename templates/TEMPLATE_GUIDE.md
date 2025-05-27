# zkWasm CLI Template System Guide

## Overview

The zkWasm CLI uses a modular template system that allows developers to create different types of zkWasm applications. Currently, only the **Basic Hello World** template is available, but the system is designed for easy extension.

## Current Template

### Basic Hello World Template
- **Location**: Uses current `src/` directory as template source
- **Features**: 
  - Basic state management (`src/state.rs`)
  - Settlement logic (`src/settlement.rs`)
  - Configuration management (`src/config.rs`)
  - Main library entry (`src/lib.rs`)
  - Admin public key (`src/admin.pubkey`)

## Adding New Templates

### Step 1: Define Template Configuration

Edit `cli/create-project.js` and add your template to the `TEMPLATES` object:

```javascript
const TEMPLATES = {
  basic: {
    name: 'Basic zkWasm Hello World',
    description: 'Simple zkWasm application with basic functionality',
    features: ['State management', 'Settlement logic']
  },
  // Add your new template here
  advanced: {
    name: 'Advanced zkWasm App',
    description: 'Production-ready zkWasm application with advanced features',
    features: ['Advanced state management', 'Custom settlement', 'Optimizations']
  },
  defi: {
    name: 'DeFi zkWasm App',
    description: 'DeFi-focused zkWasm application',
    features: ['Token operations', 'Liquidity pools', 'Price oracles']
  }
};
```

### Step 2: Create Template Files

Create a directory structure for your template:

```
templates/
├── advanced/
│   ├── src/
│   │   ├── lib.rs
│   │   ├── state.rs
│   │   ├── settlement.rs
│   │   ├── advanced_features.rs
│   │   └── config.rs
│   ├── ts/
│   │   ├── src/
│   │   └── package.json.template
│   └── Cargo.toml.template
└── defi/
    ├── src/
    │   ├── lib.rs
    │   ├── token.rs
    │   ├── pool.rs
    │   └── oracle.rs
    └── contracts/
        └── defi_logic.rs
```

### Step 3: Update Template Generation Logic

Modify the `generateTemplatedFiles()` function in `cli/create-project.js`:

```javascript
async function generateTemplatedFiles(targetDir, config, template) {
  console.log(chalk.blue('🔧 Generating configuration files...'));
  
  // Template-specific Cargo.toml generation
  let cargoTemplate;
  
  switch (template) {
    case 'basic':
      cargoTemplate = `[package]
name = "{{rustCrateName}}"
version = "{{version}}"
# ... basic dependencies
`;
      break;
      
    case 'advanced':
      cargoTemplate = `[package]
name = "{{rustCrateName}}"
version = "{{version}}"
# ... advanced dependencies
[dependencies]
# ... additional advanced dependencies
`;
      break;
      
    case 'defi':
      cargoTemplate = `[package]
name = "{{rustCrateName}}"
version = "{{version}}"
# ... DeFi-specific dependencies
[dependencies]
num-bigint = "0.4"
# ... other DeFi dependencies
`;
      break;
  }
  
  const cargoContent = Mustache.render(cargoTemplate, config);
  await fs.writeFile(path.join(targetDir, 'Cargo.toml'), cargoContent);
}
```

### Step 4: Update CLI Command

Restore the template option in `cli/index.js`:

```javascript
program
  .command('create <project-name>')
  .description('Create a new zkWasm project')
  .option('-t, --template <template>', 'Project template (basic, advanced, defi)', 'basic')
  .option('-d, --directory <dir>', 'Target directory', '.')
  .option('--skip-install', 'Skip npm install')
  .action(async (projectName, options) => {
    // ... existing logic
  });
```

### Step 5: Update Template Selection Logic

Modify the `createProject()` function to handle multiple templates:

```javascript
export async function createProject(projectName, options) {
  // ... existing code ...
  
  // Restore template selection
  const template = options.template || 'basic';
  if (!TEMPLATES[template]) {
    throw new Error(`Unknown template: ${template}. Available: ${Object.keys(TEMPLATES).join(', ')}`);
  }
  
  console.log(chalk.blue(`Using template: ${TEMPLATES[template].name}`));
  
  // ... rest of the function
}
```

## Template File Structure

### Required Files for Each Template

| File | Purpose | Required |
|------|---------|----------|
| `src/lib.rs` | Main Rust entry point | ✅ |
| `src/state.rs` | State management | ✅ |
| `src/config.rs` | Configuration | ✅ |
| `Cargo.toml.template` | Rust dependencies | ✅ |
| `ts/package.json.template` | TypeScript dependencies | ✅ |
| `README.md.template` | Project documentation | ⚠️ Recommended |

### Template Variables

Available variables for Mustache templating:

| Variable | Description | Example |
|----------|-------------|---------|
| `{{projectName}}` | Original project name | `my-zkwasm-app` |
| `{{rustCrateName}}` | Rust-compatible name | `my_zkwasm_app` |
| `{{author}}` | Author name | `zkWasm Developer` |
| `{{description}}` | Project description | `A zkWasm application` |
| `{{version}}` | Initial version | `0.1.0` |

## Testing New Templates

1. **Create test project**: `zkwasm create test-app --template your-template`
2. **Verify structure**: Check all files are generated correctly
3. **Test build**: `cd test-app && zkwasm build`
4. **Test validation**: `zkwasm validate`
5. **Test deployment check**: `zkwasm check`

## Best Practices

### Template Design

| Practice | Description |
|----------|-------------|
| **Consistent Structure** | Follow the same directory layout |
| **Clear Documentation** | Include template-specific README |
| **Working Examples** | Ensure template builds successfully |
| **Minimal Dependencies** | Only include necessary dependencies |

### File Naming

| Pattern | Usage |
|---------|-------|
| `*.template` | Files that need variable substitution |
| `*.rs` | Direct copy Rust files |
| `*.md` | Documentation files |

## Removing Templates

To remove a template:

1. Remove from `TEMPLATES` object in `cli/create-project.js`
2. Delete template directory from `templates/`
3. Remove template-specific logic from `generateTemplatedFiles()`
4. Update documentation

## Current Status

- ✅ **Basic Template**: Available (uses current `src/`)
- ⏳ **Advanced Template**: Planned
- ⏳ **DeFi Template**: Planned
- ⏳ **Custom Templates**: Community contributions welcome

## Contributing Templates

To contribute a new template:

1. Fork the repository
2. Create your template following this guide
3. Test thoroughly
4. Submit a pull request with:
   - Template files
   - Documentation
   - Test results
   - Example usage 