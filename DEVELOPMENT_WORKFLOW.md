# zkWasm Development Workflow

This guide provides a comprehensive workflow for developing zkWasm applications using the zkWasm CLI.

## Prerequisites

- [zkWasm CLI](https://github.com/DelphinusLab/zkwasm-starter) installed globally
- Node.js (>=16.0.0)
- Rust toolchain with wasm32-unknown-unknown target
- wasm-pack and wasm-opt

## Complete Development Process

### Step 1: Create Project

```bash
# Install zkWasm CLI globally
npm install -g zkwasm-cli

# Create new project
zkwasm create my-zkwasm-app
cd my-zkwasm-app
```

### Step 2: Initialize Environment

```bash
# Initialize development environment
zkwasm init
```

This will:
- Check for required development tools
- Install missing tools automatically
- Configure project settings
- Create development scripts

### Step 3: Setup TypeScript Dependencies

**Important:** This step must be done manually after project creation.

```bash
# Navigate to TypeScript directory
cd ts

# Install Node.js dependencies
npm install

# Compile TypeScript files
npx tsc

# Return to project root
cd ..
```

### Step 4: Validate Project

```bash
# Validate project structure and configuration
zkwasm validate
```

This checks:
- Directory structure completeness
- Configuration file validity
- Dependency resolution
- TypeScript compilation status

### Step 5: Build Application

```bash
# Build the zkWasm application
zkwasm build
```

Alternative build command:
```bash
make build
```

The build process:
1. Generates admin public key
2. Compiles TypeScript service
3. Builds Rust to WASM with wasm-pack
4. Optimizes WASM with wasm-opt
5. Copies artifacts to build directory
6. Calculates and displays MD5 hash

### Step 6: Local Testing (Optional)

```bash
# Run the zkWasm service locally
make run

# Run Rust tests
make test

# Clean build artifacts
make clean
```

### Step 7: Publish to zkWasm Hub

```bash
# Generate and run publish script
zkwasm publish
```

This will:
- Create a customizable publish.sh script
- Configure deployment parameters
- Handle environment variables
- Manage error cases (e.g., "already exists")

### Step 8: Deployment Readiness Check

```bash
# Check deployment readiness
zkwasm check --verbose
```

This verifies:
- Build artifacts exist and are valid
- WASM file integrity (MD5 hash)
- zkWasm hub image availability
- Configuration files are correct
- Dependencies are resolved

## Production Deployment

### GitHub CI/CD Setup

For automated deployment to production platforms:

#### 1. Create Deployment Branch

```bash
git checkout -b zkwasm-deploy
```

#### 2. Enable GitHub Actions

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Actions**
3. Enable GitHub Actions workflows
4. Ensure workflows have necessary permissions

#### 3. Configure Container Registry

1. **Set up GitHub Container Registry (GCR):**
   - Go to **Settings** → **Packages**
   - Configure package visibility and permissions
   - Set up container registry access tokens

2. **Configure repository secrets:**
   - `ZKWASM_ADDRESS`: Your wallet address
   - `ZKWASM_PRIVATE_KEY`: Your private key
   - Other deployment-specific secrets

#### 4. Deploy

```bash
# Commit your changes
git add .
git commit -m "Setup deployment configuration"

# Push to deployment branch
git push origin zkwasm-deploy
```

The CI/CD pipeline will automatically:
- Install dependencies and build the application
- Run validation and tests
- Create container images
- Push to GitHub Container Registry
- Deploy to the target platform

## Development Commands Reference

| Command | Purpose | When to Use |
|---------|---------|-------------|
| `zkwasm create <name>` | Create new project | Start of development |
| `zkwasm init` | Setup environment | After project creation |
| `cd ts && npm install && npx tsc && cd ..` | Setup TypeScript | After init, before validate |
| `zkwasm validate` | Check project structure | Before building |
| `zkwasm build` | Build application | Development and deployment |
| `make run` | Test locally | During development |
| `zkwasm publish` | Publish to hub | Before deployment |
| `zkwasm check` | Verify deployment readiness | Before production deploy |

## Troubleshooting

### Common Issues

1. **TypeScript compilation errors:**
   ```bash
   cd ts
   rm -rf node_modules package-lock.json
   npm install
   npx tsc
   cd ..
   ```

2. **WASM build failures:**
   ```bash
   rustup update
   rustup target add wasm32-unknown-unknown
   cargo clean
   zkwasm build
   ```

3. **Missing development tools:**
   ```bash
   zkwasm init  # Reinstall all tools
   ```

4. **Deployment check failures:**
   ```bash
   zkwasm validate  # Check project structure first
   zkwasm build     # Ensure clean build
   zkwasm check --verbose  # Get detailed error info
   ```
