#!/usr/bin/env node

import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runCommand(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    console.log(`Running: ${command} ${args.join(' ')}`);
    const process = spawn(command, args, { 
      stdio: 'pipe',
      shell: true,
      ...options 
    });
    
    let stdout = '';
    let stderr = '';
    
    process.stdout?.on('data', (data) => {
      stdout += data.toString();
      if (options.verbose) process.stdout.write(data);
    });
    
    process.stderr?.on('data', (data) => {
      stderr += data.toString();
      if (options.verbose) process.stderr.write(data);
    });
    
    process.on('close', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        reject(new Error(`Command failed with code ${code}: ${stderr}`));
      }
    });
  });
}

async function setupVirtualEnvironment() {
  const venvPath = path.join(__dirname, '.venv');
  
  console.log('Setting up Python virtual environment for editly...');
  
  try {
    // Create virtual environment
    console.log('Creating virtual environment...');
    await runCommand('python3', ['-m', 'venv', venvPath]);
    
    // Get venv paths
    const isWindows = process.platform === 'win32';
    const venvBin = path.join(venvPath, isWindows ? 'Scripts' : 'bin');
    const venvPython = path.join(venvBin, isWindows ? 'python.exe' : 'python');
    const venvPip = path.join(venvBin, isWindows ? 'pip.exe' : 'pip');
    
    // Install setuptools in venv
    console.log('Installing setuptools in virtual environment...');
    await runCommand(venvPython, ['-m', 'pip', 'install', '--upgrade', 'pip', 'setuptools']);
    
    // Create npm config pointing to venv python
    console.log('Configuring npm to use virtual environment Python...');
    const npmrcContent = `python=${venvPython}\n`;
    await fs.writeFile(path.join(__dirname, '.npmrc'), npmrcContent);
    
    // Set environment variables for current process
    process.env.npm_config_python = venvPython;
    process.env.PYTHON = venvPython;
    
    console.log('✅ Virtual environment set up successfully');
    console.log(`Python: ${venvPython}`);
    
    return { venvPath, venvPython, venvPip };
    
  } catch (error) {
    console.error('❌ Failed to set up virtual environment:', error.message);
    throw error;
  }
}

async function installEditlyWithVenv() {
  try {
    const { venvPython } = await setupVirtualEnvironment();
    
    console.log('Installing editly with virtual environment...');
    
    // Install editly using npm with the configured Python
    await runCommand('npm', ['install', 'editly', '--save'], {
      cwd: __dirname,
      env: {
        ...process.env,
        npm_config_python: venvPython,
        PYTHON: venvPython
      }
    });
    
    // Verify editly actually installed and works
    const editlyPath = path.join(__dirname, 'node_modules', '.bin', 'editly');
    try {
      await fs.access(editlyPath);
      console.log('✅ Editly binary found');
      
      // Test if editly can run
      await runCommand('node', [editlyPath, '--help'], { timeout: 10000 });
      console.log('✅ Editly is functional!');
      return true;
      
    } catch (testError) {
      console.error('❌ Editly installed but is not functional:', testError.message);
      throw new Error('Editly installation verification failed');
    }
    
  } catch (error) {
    console.error('❌ Failed to install editly:', error.message);
    console.error('\nThis MCP server requires editly to function properly.');
    console.error('Installation failed due to native dependency issues.');
    console.error('\nTroubleshooting steps:');
    console.error('1. Install Xcode Command Line Tools: xcode-select --install');
    console.error('2. Ensure Python 3 is available');
    console.error('3. Try running: npm run setup');
    
    // Exit with error code to fail the installation
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  installEditlyWithVenv()
    .then(success => {
      if (success) {
        console.log('\n🎉 Setup complete! Editly should now be available.');
      } else {
        console.log('\n⚠️  Setup had issues, but the MCP server will still work.');
        console.log('You can try running this setup script again or install editly manually.');
      }
    })
    .catch(console.error);
}

export { setupVirtualEnvironment, installEditlyWithVenv };