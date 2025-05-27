# zkWasm DApp CLI 🚀

A powerful scaffolding tool for zkWasm applications, similar to `vue-cli` and `create-react-app`, helping developers quickly create, manage, and deploy zkWasm applications.

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🎯 **Quick Project Generation** | Create new zkWasm projects from templates |
| 🔍 **Smart Deployment Checks** | Automatic deployment readiness validation with MD5 verification |
| ⚙️ **Environment Setup** | Automatic development environment configuration |
| 📦 **Multiple Templates** | Support for Multiple project templates |
| 🛠️ **Development Tools** | Built-in build, test, and validation tools |
| 🚀 **CI/CD Ready** | Auto-generated GitHub Actions workflows |
| 📋 **Publish Management** | Interactive publish script generation with error handling |

## 🚀 Quick Start

### Installation

| Method | Command | Notes |
|--------|---------|-------|
| **Global Install** | `npm install -g zkwasm-cli` | Recommended |
| **Local Install** | `npm install zkwasm-cli` | Use with `npx zkwasm` |
| **From Source** | `git clone && npm install && npm link` | Development |

### Create Your First Project

```bash
# Create a basic Hello World project
zkwasm create my-zkwasm-app

# Create in specific directory
zkwasm create my-app --directory ./projects
```

### Development Workflow

```bash
cd my-zkwasm-app

# 1. Initialize development environment
zkwasm init

# 2. Install TypeScript dependencies and compile
cd ts
npm install
npx tsc
cd ..

# 3. Validate project structure
zkwasm validate

# 4. Build the application
zkwasm build

# 5. Run locally (optional)
make run

# 6. Generate and run publish script
zkwasm publish

# 7. Check deployment readiness
zkwasm check --verbose
```

### Complete Development Process

| Step | Command | Description |
|------|---------|-------------|
| **1. Setup** | `zkwasm init` | Initialize development environment |
| **2. Dependencies** | `cd ts && npm install && npx tsc && cd ..` | Install and compile TypeScript |
| **3. Validate** | `zkwasm validate` | Validate project structure |
| **4. Build** | `zkwasm build` | Build zkWasm application |
| **5. Test** | `make run` | Run local service for testing |
| **6. Publish** | `zkwasm publish` | Generate/run publish script |
| **7. Deploy Check** | `zkwasm check` | Verify deployment readiness |

### GitHub CI/CD Deployment

For automated deployment to production platforms:

1. **Switch to deployment branch:**
   ```bash
   git checkout -b zkwasm-deploy
   ```

2. **Enable GitHub Actions:**
   - Navigate to repository Settings → Actions
   - Enable GitHub Actions workflows

3. **Configure Container Registry:**
   - Set up GitHub Container Registry (GCR) access
   - Configure package settings for container images
   - Ensure proper permissions for automated builds

4. **Deploy:**
   ```bash
   git push origin zkwasm-deploy
   ```

The CI/CD pipeline will automatically build, containerize, and deploy your zkWasm application.

## 📋 CLI Commands

| Command | Description | Usage Order |
|---------|-------------|-------------|
| `create <name>` | Create new zkWasm project (Hello World template) | 1st |
| `init` | Initialize development environment and tools | 2nd |
| `validate` | Validate project structure and configuration | 3rd (after TS setup) |
| `build` | Build zkWasm application | 4th |
| `publish` | Generate/run publish script for zkWasm hub | 5th |
| `check` | Check deployment readiness | 6th (after publish) |

### Command Details

#### `zkwasm create <project-name>`

Creates a new zkWasm project with automatic setup:

| Option | Description | Default |
|--------|-------------|---------|
| `-d, --directory <dir>` | Target directory | `.` |
| `--skip-install` | Skip automatic npm install and TypeScript compilation | `false` |

**Automatic Setup Process:**

When you run `zkwasm create`, the CLI automatically:
1. ✅ **Copies template files** (Rust source, TypeScript service, configuration)
2. ✅ **Installs TypeScript dependencies** (`npm install` in ts/ directory)
3. ✅ **Compiles TypeScript** (`npx tsc` in ts/ directory)
4. ✅ **Initializes Git repository**
5. ✅ **Sets up GitHub Actions** (if selected)

**After project creation, you can immediately:**
```bash
cd <project-name>
zkwasm build        # Build the zkWasm application
zkwasm check        # Check deployment readiness
```

**⚠️ Important for Development:**

The CLI automatically handles initial setup, but during development you'll need to manually reinstall/recompile when:
- Adding new npm packages to `ts/package.json`
- Modifying any `.ts` files in `ts/src/`
- Updating TypeScript configuration

```bash
# After adding dependencies or modifying TypeScript:
cd ts
npm install         # Only needed when adding new dependencies
npx tsc            # Needed after any TypeScript changes
cd ..
```

**When to use `--skip-install`:**
- When you want to review package.json before installing dependencies
- In CI/CD environments where you control dependency installation
- When you prefer to install dependencies manually
- If you're experiencing network issues during project creation

**With `--skip-install`, you must manually run:**
```bash
cd <project-name>/ts && npm install && npx tsc && cd ..
```

#### `zkwasm init`

Initializes the development environment by:
- Checking for required tools (Rust, wasm-pack, wasm-opt, Node.js)
- Installing missing tools automatically
- Configuring project settings
- Creating development scripts

#### `zkwasm validate`

Validates project readiness by checking:
- Directory structure completeness
- Configuration file validity
- Dependency resolution
- TypeScript compilation status

#### `zkwasm build`

Builds the complete application:
- Compiles Rust to WebAssembly
- Optimizes WASM with wasm-opt
- Generates TypeScript definitions
- Calculates MD5 hash for deployment tracking
- Copies artifacts to build directory

#### `zkwasm check`

| Check Category | Items Verified |
|----------------|----------------|
| **Build Artifacts** | WASM file, TypeScript definitions |
| **File Integrity** | MD5 hash calculation and verification |
| **zkWasm Hub** | Image existence check via API |
| **Configuration** | Cargo.toml, package.json, tsconfig.json |
| **Dependencies** | Rust and Node.js dependency resolution |
| **Environment** | Required tools availability |

#### `zkwasm publish`

| Feature | Description |
|---------|-------------|
| **Script Generation** | Creates customizable publish.sh scripts |
| **Environment Variables** | Supports ZKWASM_ADDRESS and ZKWASM_PRIVATE_KEY |
| **Error Handling** | Detects "already exists" errors gracefully |
| **Migration Support** | Optional data import from existing images |
| **Network Configuration** | Auto-submit to specified network IDs |

## 📁 Project Templates

### Current Template

| Template | Use Case | Features |
|----------|----------|----------|
| **Basic Hello World** | Learning, getting started | • Basic Rust zkWasm module<br>• Simple TypeScript service<br>• State management example<br>• Settlement logic<br>• Standard build configuration |

### 🔧 Template System

The CLI supports a modular template system. Currently, only the Basic Hello World template is available, but you can easily add more templates:

#### Adding New Templates

| Step | Action | Location |
|------|--------|----------|
| **1. Define Template** | Add template config to `TEMPLATES` object | `cli/create-project.js` |
| **2. Create Template Files** | Add template-specific source files | `templates/<template-name>/` |
| **3. Add Template Logic** | Implement template-specific generation | `generateTemplatedFiles()` function |
| **4. Update CLI** | Add template option back to CLI | `cli/index.js` |

#### Template Structure Example

```
templates/
├── basic/           # Current Hello World template (uses src/)
├── advanced/        # Future: Advanced features
│   ├── src/
│   ├── ts/
│   └── config/
└── defi/           # Future: DeFi-specific features
    ├── src/
    ├── ts/
    └── contracts/
```

#### Template Configuration

```javascript
// In cli/create-project.js
const TEMPLATES = {
  basic: {
    name: 'Basic zkWasm Hello World',
    description: 'Simple zkWasm application with basic functionality',
    features: ['State management', 'Settlement logic']
  },
  // Add new templates here:
  // advanced: { ... },
  // defi: { ... }
};
```

## 🏗️ Project Structure

```
my-zkwasm-app/
├── src/                    # Rust source code
│   ├── lib.rs             # Main entry point
│   ├── state.rs           # State management
│   └── config.rs          # Configuration
├── ts/                     # TypeScript code
│   ├── src/               # TS source files
│   ├── package.json       # TS dependencies
│   └── tsconfig.json      # TS configuration
├── cli/                    # CLI tool scripts
├── scripts/               # Development scripts
├── build-artifacts/       # Build outputs
├── Cargo.toml             # Rust configuration
├── Makefile               # Build configuration
├── zkwasm.config.json     # zkWasm configuration
├── deployment-history.json # Deployment tracking
└── README.md              # Project documentation
```

## ⚙️ Configuration

### Environment Configuration

| Environment | Optimize | Use Case | Build Command |
|-------------|----------|----------|---------------|
| **Development** | `false` | Fast builds, debugging | `cargo build --target wasm32-unknown-unknown` |
| **Production** | `true` | Optimized builds | `make build` (includes wasm-opt) |
| **Testing** | `false` | Test features enabled | `cargo build --features test` |

### zkwasm.config.json

```json
{
  "environment": "development",
  "build": {
    "target": "wasm32-unknown-unknown",
    "optimize": false,
    "outputDir": "./build-artifacts"
  },
  "deployment": {
    "autoCheck": true,
    "environment": "development"
  }
}
```

## 🔍 Deployment Checks

### Check Categories

| Category | Items | Status Indicators |
|----------|-------|-------------------|
| **Build Artifacts** | • `application_bg.wasm`<br>• `application_bg.wasm.d.ts` | ✅ Found / ❌ Missing |
| **WASM Integrity** | • MD5 hash calculation<br>• File size validation<br>• Deployment history | ✅ Valid / ⚠️ Duplicate / ❌ Invalid |
| **zkWasm Hub** | • Image existence check<br>• API connectivity | ✅ Available / ❌ Not found |
| **Environment** | • wasm-pack<br>• wasm-opt<br>• Node.js & npm | ✅ Available / ❌ Missing |
| **Configuration** | • Cargo.toml<br>• package.json<br>• tsconfig.json | ✅ Valid / ❌ Invalid |

### Sample Check Output

```
🔍 Starting deployment readiness check...

Checking build artifacts...
  ✅ application_bg.wasm (45.2 KB)
  ✅ application_bg.wasm.d.ts (2.1 KB)

Checking WASM file integrity...
  ✅ WASM MD5: EA668FE59ADD59722F3B6FCCE828FD06
  ✅ WASM Size: 46.3 KB

Checking zkWasm hub...
  ✅ Image found on zkWasm hub

📋 Summary: ✅ 8 passed, ⚠️ 0 warnings, ❌ 0 errors
```

## 🚀 Publishing

### Publish Script Configuration

| Parameter | Description | Default |
|-----------|-------------|---------|
| `resturl` | zkWasm hub API endpoint | `https://rpc.zkwasmhub.com:8090` |
| `path` | WASM file path | `node_modules/zkwasm-ts-server/src/application/application_bg.wasm` |
| `circuit_size` | Circuit size parameter | `22` |
| `address` | User wallet address | From environment or prompt |
| `priv` | Private key | From environment or prompt |
| `description` | Image description | User input |
| `creator_paid_proof` | Creator pays for proofs | `false` |
| `creator_only_add_prove_task` | Restrict proof creation | `false` |
| `auto_submit_network_ids` | Auto-submit networks | Optional |
| `import_data_image` | Migration data source | Optional |

### Environment Variables

| Variable | Purpose |
|----------|---------|
| `ZKWASM_ADDRESS` | Wallet address for publishing |
| `ZKWASM_PRIVATE_KEY` | Private key for signing |

### Error Handling

| Error Type | Detection | Response |
|------------|-----------|---------|
| **Already Exists** | Output contains "already exists" | ℹ️ Friendly message, exit 0 |
| **Network Error** | Non-zero exit code | ❌ Error message, exit with code |
| **Invalid Config** | Missing parameters | ⚠️ Validation error |

## 🛠️ Development Tools

### Built-in Scripts

| Script | Purpose | Location |
|--------|---------|----------|
| `dev-build.sh` | Development builds | `./scripts/` |
| `watch.sh` | File watching | `./scripts/` |
| `publish.sh` | Publishing | `./ts/` (generated) |

### Required Tools

| Tool | Purpose | Installation |
|------|---------|--------------|
| **Rust** | Core compilation | `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs \| sh` |
| **wasm-pack** | WASM packaging | `curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf \| sh` |
| **wasm-opt** | WASM optimization | `brew install binaryen` (macOS)<br>`sudo apt install binaryen` (Ubuntu) |
| **Node.js** | TypeScript compilation | https://nodejs.org/ |

## 🔧 Troubleshooting

### Common Issues

| Issue | Symptoms | Solution |
|-------|----------|----------|
| **Build Failure** | `wasm-pack build` fails | • Update Rust: `rustup update`<br>• Add target: `rustup target add wasm32-unknown-unknown` |
| **Dependency Error** | npm install fails | • Clear cache: `npm cache clean --force`<br>• Remove node_modules and reinstall |
| **Environment Issues** | Tools not found | • Run `zkwasm init`<br>• Check PATH configuration |
| **Check Failures** | Deployment check errors | • Run `zkwasm check --verbose`<br>• Validate with `zkwasm validate` |

### Platform-Specific Notes

| Platform | Notes |
|----------|-------|
| **WSL** | • Use Linux versions of tools<br>• Restart terminal after Rust installation |
| **Windows** | • Use WSL2 or Git Bash<br>• May require administrator privileges |
| **macOS** | • Use Homebrew for binaryen<br>• Ensure Xcode command line tools installed |

## 🤝 Contributing

| Type | Description |
|------|-------------|
| **Bug Reports** | Use GitHub Issues with bug template |
| **Feature Requests** | Use GitHub Issues with feature template |
| **Pull Requests** | Fork → Feature branch → PR |
| **Documentation** | Improve README, add examples |

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 📚 Documentation

| Document | Description |
|----------|-------------|
| **[Template System](templates/)** | Template structure and customization |
| **[CLI Reference](README.md#-cli-commands)** | Detailed command documentation |
| **[zkWasm Development Recipe](https://development-recipe.zkwasm.ai/)** | Official comprehensive guide |

---

**Powered by Delphinus Lab** 🚀
