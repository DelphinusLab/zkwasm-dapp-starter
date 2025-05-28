import chalk from 'chalk';
import fs from 'fs-extra';
import inquirer from 'inquirer';
export async function generatePublishScript() {
    console.log(chalk.blue('📄 Generating publish script for zkWasm hub...\n'));
    // Collect configuration
    const config = await collectPublishConfig();
    // Generate script
    const script = generateScript(config);
    // Write script to file
    const scriptPath = './ts/publish.sh';
    await fs.writeFile(scriptPath, script);
    await fs.chmod(scriptPath, '755');
    console.log(chalk.green('\n✅ Publish script generated successfully!'));
    console.log(chalk.blue('\n📖 Usage:'));
    console.log('   ./ts/publish.sh     # Run the script directly');
    console.log('   zkwasm-dapp publish');
    // Ask if user wants to run the script now
    const { runNow } = await inquirer.prompt([
        {
            type: 'confirm',
            name: 'runNow',
            message: 'Would you like to run the publish script now?',
            default: false
        }
    ]);
    if (runNow) {
        console.log(chalk.blue('\n🚀 Running publish script...'));
        const { spawn } = await import('child_process');
        const publishProcess = spawn('bash', ['publish.sh'], {
            stdio: 'inherit',
            cwd: './ts'
        });
        publishProcess.on('close', (code) => {
            if (code === 0) {
                console.log(chalk.green('\n✅ Publish completed successfully!'));
            }
            else {
                console.error(chalk.red(`\n❌ Publish failed with code ${code}`));
            }
        });
        publishProcess.on('error', (error) => {
            console.error(chalk.red(`\n❌ Failed to run publish script: ${error.message}`));
        });
    }
}
async function collectPublishConfig() {
    console.log(chalk.blue('⚙️  Configure publish parameters:\n'));
    // First ask if user wants to use their own credentials
    const { useOwnCredentials } = await inquirer.prompt([
        {
            type: 'confirm',
            name: 'useOwnCredentials',
            message: 'Use your own wallet credentials? (No = use shared public credentials)',
            default: true
        }
    ]);
    // Set default credentials based on user choice
    const defaultAddress = useOwnCredentials
        ? (process.env.ZKWASM_ADDRESS || '')
        : '0xd8f157Cc95Bc40B4F0B58eb48046FebedbF26Bde';
    const defaultPrivateKey = useOwnCredentials
        ? (process.env.ZKWASM_PRIVATE_KEY || '')
        : '2763537251e2f27dc6a30179e7bf1747239180f45b92db059456b7da8194995a';
    // Base questions that are always asked
    const baseQuestions = [
        {
            type: 'input',
            name: 'resturl',
            message: 'zkWasm hub API endpoint:',
            default: 'https://rpc.zkwasmhub.com:8090'
        },
        {
            type: 'input',
            name: 'path',
            message: 'WASM file path:',
            default: 'node_modules/zkwasm-ts-server/src/application/application_bg.wasm'
        },
        {
            type: 'input',
            name: 'circuit_size',
            message: 'Circuit size:',
            default: '22'
        }
    ];
    // Credential questions (only ask if using own credentials)
    const credentialQuestions = useOwnCredentials ? [
        {
            type: 'input',
            name: 'address',
            message: 'Wallet address (or set ZKWASM_ADDRESS env var):',
            default: defaultAddress
        },
        {
            type: 'password',
            name: 'priv',
            message: 'Private key (or set ZKWASM_PRIVATE_KEY env var):',
            default: defaultPrivateKey,
            mask: '*'
        }
    ] : [];
    // Configuration questions
    const configQuestions = [
        {
            type: 'input',
            name: 'name',
            message: 'Application name:',
            default: 'zkwasm-app'
        },
        {
            type: 'input',
            name: 'description',
            message: 'Image description:',
            default: 'zkWasm application'
        },
        {
            type: 'confirm',
            name: 'creator_paid_proof',
            message: 'Creator pays for proofs?',
            default: false
        },
        {
            type: 'confirm',
            name: 'creator_only_add_prove_task',
            message: 'Only creator can add prove tasks?',
            default: false
        },
        {
            type: 'input',
            name: 'auto_submit_network_ids',
            message: 'Auto-submit network IDs (comma-separated, optional):',
            default: ''
        },
        {
            type: 'input',
            name: 'import_data_image',
            message: 'Import data from existing image (optional):',
            default: ''
        }
    ];
    // Combine all questions
    const allQuestions = [...baseQuestions, ...credentialQuestions, ...configQuestions];
    const answers = await inquirer.prompt(allQuestions);
    // If using shared credentials, add them to the answers
    if (!useOwnCredentials) {
        answers.address = defaultAddress;
        answers.priv = defaultPrivateKey;
        console.log(chalk.gray(`\n📝 Using shared public credentials:`));
        console.log(chalk.gray(`   Address: ${defaultAddress}`));
        console.log(chalk.gray(`   Private key: ${defaultPrivateKey.substring(0, 10)}...`));
    }
    return {
        ...answers,
        auto_submit_network_ids: answers.auto_submit_network_ids || undefined,
        import_data_image: answers.import_data_image || undefined
    };
}
function generateScript(config) {
    const script = `#!/bin/bash
# zkWasm Publish Script
# Generated by zkwasm-dapp-cli

set -e

echo "🚀 Publishing to zkWasm hub..."

# Configuration
NAME="${config.name}"
RESTURL="${config.resturl}"
WASM_PATH="${config.path}"
CIRCUIT_SIZE="${config.circuit_size}"
DESCRIPTION="${config.description}"
CREATOR_PAID_PROOF="${config.creator_paid_proof}"
CREATOR_ONLY_ADD_PROVE_TASK="${config.creator_only_add_prove_task}"

# Environment variables (can be overridden)
ADDRESS=\${ZKWASM_ADDRESS:-"${config.address}"}
PRIV=\${ZKWASM_PRIVATE_KEY:-"${config.priv}"}

# Validate required parameters
if [ -z "$ADDRESS" ]; then
    echo "❌ Error: Wallet address not provided"
    echo "   Set ZKWASM_ADDRESS environment variable or edit this script"
    exit 1
fi

if [ -z "$PRIV" ]; then
    echo "❌ Error: Private key not provided"
    echo "   Set ZKWASM_PRIVATE_KEY environment variable or edit this script"
    exit 1
fi

if [ ! -f "$WASM_PATH" ]; then
    echo "❌ Error: WASM file not found: $WASM_PATH"
    echo "   Please build the project first: make build"
    exit 1
fi

echo "📦 Publishing WASM file: $WASM_PATH"
echo "🌐 Target endpoint: $RESTURL"
echo "👤 Address: $ADDRESS"

# Build command
CMD="node node_modules/zkwasm-service-cli/dist/index.js addimage \\
    -r \\"$RESTURL\\" \\
    -p \\"$WASM_PATH\\" \\
    -c \\"$CIRCUIT_SIZE\\" \\
    -u \\"$ADDRESS\\" \\
    -x \\"$PRIV\\" \\
    -d \\"$DESCRIPTION\\" \\
    -n \\"$NAME\\" \\
    --creator_paid_proof \\"$CREATOR_PAID_PROOF\\" \\
    --creator_only_add_prove_task \\"$CREATOR_ONLY_ADD_PROVE_TASK\\""

# Add optional parameters
${config.auto_submit_network_ids ? `CMD="$CMD --auto_submit_network_ids \\"${config.auto_submit_network_ids}\\""` : ''}
${config.import_data_image ? `CMD="$CMD --import_data_image \\"${config.import_data_image}\\""` : ''}

echo "🔧 Running command:"
echo "$CMD"
echo ""

# Execute command and capture output
OUTPUT=$(eval $CMD 2>&1)
EXIT_CODE=$?

echo "$OUTPUT"

# Check for specific error patterns first (more reliable than exit code)
if echo "$OUTPUT" | grep -q "already exists"; then
    echo ""
    echo "ℹ️  Image already exists on zkWasm hub"
    echo "✅ No action needed - image is ready for deployment"
    exit 0
elif [ $EXIT_CODE -ne 0 ]; then
    echo ""
    echo "❌ Publish failed with exit code $EXIT_CODE"
    echo "Please check the error message above"
    exit $EXIT_CODE
else
    echo ""
    echo "✅ Image published successfully!"
    echo "🔍 You can now run 'zkwasm-dapp check' to verify deployment readiness"
fi
`;
    return script;
}
//# sourceMappingURL=generate-publish.js.map