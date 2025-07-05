#!/usr/bin/env node

import { promises as fs } from 'fs';
import { spawn } from 'child_process';
import path from 'path';

// Function to run editly directly via command line
async function runEditlyCommand(configPath) {
  return new Promise((resolve, reject) => {
    console.log(`Running: npx editly ${configPath}`);
    
    const editly = spawn('npx', ['editly', configPath], {
      stdio: 'inherit',
      shell: true
    });
    
    editly.on('close', (code) => {
      if (code === 0) {
        resolve({ success: true });
      } else {
        reject(new Error(`Editly process exited with code ${code}`));
      }
    });
    
    editly.on('error', (err) => {
      reject(err);
    });
  });
}

async function createVideo() {
  try {
    console.log('🎬 Creating AI Milking a Cow compilation video...');
    
    // Read the video configuration
    const configPath = './output/video-config.json';
    const config = JSON.parse(await fs.readFile(configPath, 'utf8'));
    
    console.log('📋 Configuration loaded:');
    console.log(`   Output: ${config.outputPath}`);
    console.log(`   Resolution: ${config.width}x${config.height}`);
    console.log(`   Clips: ${config.clips.length}`);
    console.log(`   Audio: ${config.audioFilePath}`);
    
    // Ensure output directory exists
    await fs.mkdir(path.dirname(config.outputPath), { recursive: true });
    
    // Create a temporary config file for editly
    const tempConfigPath = './output/temp-editly-config.json';
    await fs.writeFile(tempConfigPath, JSON.stringify(config, null, 2));
    
    console.log('\n🚀 Starting video creation with editly...');
    console.log('This may take a few minutes depending on video length and system performance.');
    
    // Run editly command
    await runEditlyCommand(tempConfigPath);
    
    // Clean up temp file
    await fs.unlink(tempConfigPath).catch(() => {});
    
    // Check if output file was created
    try {
      const stats = await fs.stat(config.outputPath);
      console.log(`\n✅ Video created successfully!`);
      console.log(`📁 Location: ${config.outputPath}`);
      console.log(`📏 Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
      return true;
    } catch (statError) {
      throw new Error('Video file was not created');
    }
    
  } catch (error) {
    console.error('\n❌ Failed to create video:', error.message);
    
    if (error.code === 'ENOENT') {
      console.error('\n💡 Editly is not installed or not available in PATH.');
      console.error('Install editly globally: npm install -g editly');
      console.error('Or use the MCP server setup: npm run setup');
    }
    
    return false;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  createVideo()
    .then(success => {
      process.exit(success ? 0 : 1);
    });
}

export { createVideo };