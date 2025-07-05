#!/usr/bin/env node
/**
 * Comprehensive diagnostic script for editly-mcp
 * Provides detailed system analysis and troubleshooting information
 */

import { runSystemDiagnostic, getPlatformInstallInstructions, checkFFmpegAvailability } from './platform-utils.js';
import { promises as fs } from 'fs';
import path from 'path';

async function main() {
  console.log('🔍 editly-mcp System Diagnostic');
  console.log('=' .repeat(50));
  console.log('');

  try {
    // Check if setup status file exists
    const setupStatusPath = path.join(process.cwd(), '.editly-mcp-setup.json');
    let setupStatus = null;
    
    try {
      const statusData = await fs.readFile(setupStatusPath, 'utf-8');
      setupStatus = JSON.parse(statusData);
      console.log(`📋 Last setup check: ${new Date(setupStatus.timestamp).toLocaleString()}`);
      console.log(`🎯 Setup complete: ${setupStatus.setupComplete ? 'Yes' : 'No'}`);
      console.log('');
    } catch (error) {
      console.log('📋 No previous setup status found');
      console.log('');
    }

    // Run comprehensive diagnostic
    console.log('🔧 Running comprehensive system diagnostic...\n');
    const diagnostic = await runSystemDiagnostic();

    // Additional detailed checks
    console.log('');
    console.log('🔍 Detailed Component Analysis:');
    console.log('-'.repeat(40));

    // FFmpeg detailed check
    const ffmpegCheck = await checkFFmpegAvailability();
    console.log(`FFmpeg Status: ${ffmpegCheck.available ? '✅ Available' : '❌ Missing'}`);
    if (ffmpegCheck.available) {
      console.log(`   Path: ${ffmpegCheck.path}`);
      console.log(`   Command: ${ffmpegCheck.command}`);
    } else {
      console.log('   Install instructions:');
      ffmpegCheck.installInstructions.slice(0, 3).forEach(instruction => {
        console.log(`     ${instruction}`);
      });
    }

    // Node.js version check
    console.log(`Node.js Version: ${process.version}`);
    const nodeVersion = parseInt(process.version.slice(1));
    if (nodeVersion >= 16) {
      console.log('   ✅ Version is supported');
    } else {
      console.log('   ⚠️  Version may be too old (16+ recommended)');
    }

    // Platform-specific guidance
    console.log('');
    const instructions = getPlatformInstallInstructions();
    console.log('📋 Platform-Specific Setup Guide:');
    console.log(instructions.title);
    console.log('='.repeat(instructions.title.length));
    instructions.steps.forEach(step => {
      console.log(step);
    });

    // Environment variables
    console.log('');
    console.log('🌍 Environment Information:');
    console.log('-'.repeat(40));
    console.log(`Platform: ${process.platform}`);
    console.log(`Architecture: ${process.arch}`);
    console.log(`Node.js: ${process.version}`);
    console.log(`npm: ${process.env.npm_version || 'Unknown'}`);
    console.log(`HOME: ${process.env.HOME || process.env.USERPROFILE || 'Unknown'}`);
    console.log(`PATH length: ${(process.env.PATH || '').length} characters`);

    // Check for common issues
    console.log('');
    console.log('🔍 Common Issues Check:');
    console.log('-'.repeat(40));
    
    // Check PATH for common directories
    const pathDirs = (process.env.PATH || '').split(path.delimiter);
    const commonDirs = [
      '/usr/local/bin',
      '/usr/bin',
      '/opt/homebrew/bin',
      process.env.HOME ? path.join(process.env.HOME, '.local/bin') : null
    ].filter(Boolean);

    commonDirs.forEach(dir => {
      const inPath = pathDirs.includes(dir);
      console.log(`${dir}: ${inPath ? '✅ In PATH' : '❌ Not in PATH'}`);
    });

    // Check for virtual environments
    if (process.env.VIRTUAL_ENV) {
      console.log(`Python Virtual Environment: ${process.env.VIRTUAL_ENV}`);
    }

    // Memory and disk space (basic checks)
    console.log('');
    console.log('💾 System Resources:');
    console.log('-'.repeat(40));
    console.log(`Available memory: ${Math.round(process.memoryUsage().external / 1024 / 1024)} MB`);
    
    // Check current directory disk space
    try {
      const stats = await fs.stat('.');
      console.log(`Current directory accessible: ✅`);
    } catch (error) {
      console.log(`Current directory accessible: ❌ ${error.message}`);
    }

    // Final recommendations
    console.log('');
    console.log('🎯 Final Recommendations:');
    console.log('-'.repeat(40));
    
    if (diagnostic.compatible) {
      console.log('✅ Your system appears fully compatible!');
      console.log('   You should be able to use editly-mcp without issues.');
      console.log('   Try running a simple MCP tool call to verify.');
    } else {
      console.log('⚠️  Some setup is required for optimal functionality:');
      diagnostic.recommendations.forEach(rec => {
        console.log(`   • ${rec}`);
      });
    }

    console.log('');
    console.log('📚 Additional Resources:');
    console.log('   • README.md - Complete setup guide');
    console.log('   • GitHub Issues - Report problems');
    console.log('   • MCP Documentation - Integration guides');

    // Update setup status
    if (setupStatus) {
      setupStatus.lastDiagnostic = new Date().toISOString();
      setupStatus.diagnosticResult = diagnostic;
      await fs.writeFile(setupStatusPath, JSON.stringify(setupStatus, null, 2));
    }

  } catch (error) {
    console.error('❌ Diagnostic failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Run diagnostic
main().catch(error => {
  console.error('Fatal diagnostic error:', error.message);
  process.exit(1);
});