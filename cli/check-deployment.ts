import chalk from 'chalk';
import crypto from 'crypto';
import fs from 'fs-extra';
import path from 'path';

const endpoint = "https://rpc.zkwasmhub.com:8090";

interface CheckOptions {
  verbose?: boolean;
}

interface CheckResults {
  success: boolean;
  warnings: string[];
  errors: string[];
  info: {
    md5Hash?: string;
    wasmSize?: number;
    imageHash?: string;
    imageChecksum?: string;
  };
}

interface ZkWasmImageInfo {
  checksum?: string;
  md5: string;
  name?: string;
  description?: string;
  circuit_size?: number;
}

export async function checkDeployment(options: CheckOptions = {}): Promise<CheckResults> {
  const verbose = options.verbose || false;
  const results: CheckResults = {
    success: true,
    warnings: [],
    errors: [],
    info: {}
  };

  console.log(chalk.blue('🔍 Starting deployment readiness check...\n'));

  // 1. Check if build artifacts exist
  await checkBuildArtifacts(results, verbose);
  
  // 2. Check WASM file integrity and MD5 tracking
  await checkWasmIntegrity(results, verbose);

  // 3. Check zkWasm hub image availability
  await checkZkWasmImage(results, verbose);

  // Summary
  console.log('\n' + chalk.blue('📋 Deployment Check Summary:'));
  const totalPassed = 3 - results.errors.length; // Now 3 main checks
  console.log(`${chalk.green('✅ Checks passed:')} ${totalPassed}`);
  
  if (results.warnings.length > 0) {
    console.log(`${chalk.yellow('⚠️  Warnings:')} ${results.warnings.length}`);
    if (verbose) {
      results.warnings.forEach(w => console.log(chalk.yellow(`   - ${w}`)));
    }
  }
  
  if (results.errors.length > 0) {
    console.log(`${chalk.red('❌ Errors:')} ${results.errors.length}`);
    results.errors.forEach(e => console.log(chalk.red(`   - ${e}`)));
    results.success = false;
  }

  if (results.success) {
    console.log(chalk.green('\n✅ All deployment checks passed!'));
    console.log(chalk.blue('\n🚀 Ready for deployment!'));
    console.log(chalk.cyan('\nFor automated deployment via GitHub CI/CD:'));
    console.log(chalk.cyan('1. Switch to deployment branch: git checkout -b zkwasm-deploy'));
    console.log(chalk.cyan('2. Enable GitHub Actions in repository settings'));
    console.log(chalk.cyan('3. Configure GitHub Container Registry (GCR) access'));
    console.log(chalk.cyan('4. Set up package settings for container images'));
    console.log(chalk.cyan('5. Push to deploy: git push origin zkwasm-deploy'));
    console.log(chalk.gray('\nFor more details, see: https://development-recipe.zkwasm.ai/'));
  } else {
    console.log(chalk.red('\n❌ Deployment readiness check failed!'));
    console.log(chalk.yellow('\nPlease fix the errors above before deploying.'));
  }

  return results;
}

async function checkBuildArtifacts(results: CheckResults, verbose: boolean): Promise<void> {
  const artifactsDir = './build-artifacts';
  const applicationDir = path.join(artifactsDir, 'application');
  
  if (verbose) console.log(chalk.blue('Checking build artifacts...'));
  
  if (!await fs.pathExists(artifactsDir)) {
    results.errors.push('build-artifacts directory not found');
    return;
  }
  
  if (!await fs.pathExists(applicationDir)) {
    results.errors.push('build-artifacts/application directory not found');
    return;
  }
  
  const requiredFiles = [
    'application_bg.wasm',
    'application_bg.wasm.d.ts'
  ];
  
  for (const file of requiredFiles) {
    const filePath = path.join(applicationDir, file);
    if (!await fs.pathExists(filePath)) {
      results.errors.push(`Required file missing: ${filePath}`);
    } else if (verbose) {
      const stats = await fs.stat(filePath);
      console.log(chalk.green(`  ✅ ${file} (${(stats.size / 1024).toFixed(2)} KB)`));
    }
  }
}

async function checkWasmIntegrity(results: CheckResults, verbose: boolean): Promise<void> {
  const wasmPath = './build-artifacts/application/application_bg.wasm';
  
  if (verbose) console.log(chalk.blue('Checking WASM file integrity...'));
  
  if (!await fs.pathExists(wasmPath)) {
    results.errors.push('WASM file not found for integrity check');
    return;
  }
  
  try {
    const wasmBuffer = await fs.readFile(wasmPath);
    const md5Hash = crypto.createHash('md5').update(wasmBuffer).digest('hex').toUpperCase();
    
    results.info.md5Hash = md5Hash;
    results.info.wasmSize = wasmBuffer.length;
    
    if (verbose) {
      console.log(chalk.green(`  ✅ WASM MD5: ${md5Hash}`));
      console.log(chalk.green(`  ✅ WASM Size: ${(wasmBuffer.length / 1024).toFixed(2)} KB`));
    }
    
  } catch (error) {
    results.errors.push(`Failed to calculate WASM hash: ${(error as Error).message}`);
  }
}

async function queryZkWasmImage(md5: string): Promise<ZkWasmImageInfo | null> {
  try {
    const url = `${endpoint}/image`;
    const params = new URLSearchParams({ md5 });
    
    const response = await fetch(`${url}?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const response_data = await response.json();
    const images = response_data.result;
    
    // Return the first image if found
    if (Array.isArray(images) && images.length > 0) {
      return images[0] as ZkWasmImageInfo;
    }
    
    return null;
  } catch (error) {
    throw new Error(`Failed to query zkWasm hub: ${(error as Error).message}`);
  }
}

async function checkZkWasmImage(results: CheckResults, verbose: boolean): Promise<void> {
  if (verbose) console.log(chalk.blue('Checking zkWasm hub image availability...'));
  
  // Use the MD5 from WASM integrity check as imageHash
  const imageHash = results.info.md5Hash;
  
  if (!imageHash) {
    results.errors.push('No WASM MD5 hash available for image check');
    return;
  }
  
  try {
    // Query zkWasm hub directly
    const imageInfo = await queryZkWasmImage(imageHash);
    
    if (!imageInfo || !imageInfo.checksum) {
      results.errors.push(`Image not found: ${imageHash}. Please publish the image first using the publish.sh script in your local environment or use zkwasm publish command.`);
      if (verbose) {
        console.log(chalk.red(`  ❌ Image ${imageHash} not found on zkWasm hub`));
      }
    } else {
      results.info.imageHash = imageHash;
      results.info.imageChecksum = String(imageInfo.checksum);
      if (verbose) {
        console.log(chalk.green(`  ✅ Image found on zkWasm hub: ${imageHash}`));
        if (imageInfo.checksum) {
          console.log(chalk.green(`  ✅ Image checksum: ${String(imageInfo.checksum)}`));
        }
        if (imageInfo.name) {
          console.log(chalk.green(`  ✅ Image name: ${imageInfo.name}`));
        }
        if (imageInfo.circuit_size) {
          console.log(chalk.green(`  ✅ Circuit size: ${imageInfo.circuit_size}`));
        }
      }
    }
    
  } catch (error) {
    results.errors.push(`Failed to check zkWasm hub: ${(error as Error).message}`);
    if (verbose) {
      console.log(chalk.red(`  ❌ Error querying zkWasm hub: ${(error as Error).message}`));
    }
  }
} 