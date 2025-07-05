#!/usr/bin/env node
/**
 * Post-installation script for editly-mcp
 * Automatically checks system compatibility and guides users through setup
 */

import { runSystemDiagnostic, getPlatformInstallInstructions } from './platform-utils.js';
import { promises as fs } from 'fs';
import path from 'path';

const SKIP_POSTINSTALL = process.env.SKIP_EDITLY_POSTINSTALL === 'true';
const CI_ENVIRONMENT = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';

async function main() {
  // Skip in CI environments or if explicitly disabled
  if (CI_ENVIRONMENT || SKIP_POSTINSTALL) {
    console.log('Skipping postinstall checks (CI environment or explicitly disabled)');
    return;
  }

  console.log('🔧 Running editly-mcp post-installation setup...\n');

  try {
    // Run system diagnostic
    const diagnostic = await runSystemDiagnostic();
    
    // Create a setup status file
    const setupStatus = {
      timestamp: new Date().toISOString(),
      platform: diagnostic.platform,
      compatible: diagnostic.compatible,
      issues: diagnostic.recommendations.length > 0 ? diagnostic.recommendations : null,
      setupComplete: false
    };

    if (diagnostic.compatible) {
      console.log('\n🎉 Great! Your system appears to be compatible with editly-mcp.');
      console.log('You can now use the MCP server with your preferred client.');
      setupStatus.setupComplete = true;
    } else {
      console.log('\n⚠️  Additional setup may be required for optimal functionality.');
      console.log('Please review the diagnostic output above.');
      
      // Show platform-specific quick start guide
      const instructions = getPlatformInstallInstructions();
      console.log('\n📋 Quick Setup Guide:');
      console.log(instructions.title);
      console.log('='.repeat(instructions.title.length));
      
      // Show first few critical steps
      const criticalSteps = instructions.steps.slice(0, 6);
      criticalSteps.forEach(step => {
        console.log(step);
      });
      
      console.log('\n💡 For complete setup instructions, run: npm run setup');
      console.log('💡 For detailed diagnostic, run: npm run diagnose');
    }

    // Save setup status
    await fs.writeFile(
      path.join(process.cwd(), '.editly-mcp-setup.json'),
      JSON.stringify(setupStatus, null, 2)
    );

    console.log('\n✅ Post-installation setup complete!');
    console.log('📖 Check README.md for usage examples and MCP client configuration.');

  } catch (error) {
    console.error('❌ Post-installation setup failed:', error.message);
    console.error('\nDon\'t worry! You can still use editly-mcp.');
    console.error('Run "npm run diagnose" for detailed system information.');
    
    // Create a failed setup status
    const failedStatus = {
      timestamp: new Date().toISOString(),
      platform: process.platform,
      compatible: false,
      error: error.message,
      setupComplete: false
    };

    try {
      await fs.writeFile(
        path.join(process.cwd(), '.editly-mcp-setup.json'),
        JSON.stringify(failedStatus, null, 2)
      );
    } catch (writeError) {
      // Ignore write errors in postinstall
    }
  }
}

// Only run if this script is executed directly (not imported)
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('Post-installation error:', error.message);
    process.exit(0); // Don't fail the entire installation
  });
}