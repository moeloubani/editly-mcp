#!/usr/bin/env node

import { promises as fs } from 'fs';
import { spawn } from 'child_process';
import path from 'path';
import which from 'which';

/**
 * Cross-platform utility functions for editly-mcp
 */

// Platform detection
export const platform = process.platform;
export const isWindows = platform === 'win32';
export const isMacOS = platform === 'darwin';
export const isLinux = platform === 'linux';

/**
 * Check if a command is available in the system PATH
 */
export async function checkCommand(command) {
  try {
    await which(command);
    return { available: true, path: await which(command) };
  } catch (error) {
    return { available: false, error: error.message };
  }
}

/**
 * Check for FFmpeg availability with platform-specific paths
 */
export async function checkFFmpegAvailability() {
  // First check if ffmpeg is in PATH
  const pathCheck = await checkCommand('ffmpeg');
  if (pathCheck.available) {
    return { available: true, command: 'ffmpeg', path: pathCheck.path };
  }

  // Check common installation paths for each platform
  const commonPaths = getCommonFFmpegPaths();
  
  for (const ffmpegPath of commonPaths) {
    try {
      await fs.access(ffmpegPath);
      return { available: true, command: ffmpegPath, path: ffmpegPath };
    } catch (error) {
      // Continue checking other paths
    }
  }

  return { 
    available: false, 
    error: 'FFmpeg not found in PATH or common installation locations',
    installInstructions: getFFmpegInstallInstructions()
  };
}

/**
 * Get common FFmpeg installation paths by platform
 */
function getCommonFFmpegPaths() {
  if (isWindows) {
    return [
      'C:\\ffmpeg\\bin\\ffmpeg.exe',
      'C:\\Program Files\\ffmpeg\\bin\\ffmpeg.exe',
      'C:\\Program Files (x86)\\ffmpeg\\bin\\ffmpeg.exe',
      path.join(process.env.LOCALAPPDATA || '', 'ffmpeg', 'bin', 'ffmpeg.exe'),
      path.join(process.env.PROGRAMFILES || '', 'ffmpeg', 'bin', 'ffmpeg.exe')
    ];
  } else if (isMacOS) {
    return [
      '/usr/local/bin/ffmpeg',
      '/opt/homebrew/bin/ffmpeg',
      '/usr/bin/ffmpeg',
      '/opt/local/bin/ffmpeg'
    ];
  } else {
    // Linux and other Unix-like systems
    return [
      '/usr/bin/ffmpeg',
      '/usr/local/bin/ffmpeg',
      '/snap/bin/ffmpeg',
      '/opt/ffmpeg/bin/ffmpeg'
    ];
  }
}

/**
 * Get FFmpeg installation instructions by platform
 */
function getFFmpegInstallInstructions() {
  if (isWindows) {
    return [
      '1. Download FFmpeg from https://ffmpeg.org/download.html#build-windows',
      '2. Extract to C:\\ffmpeg\\',
      '3. Add C:\\ffmpeg\\bin to your system PATH',
      '4. Restart your command prompt/terminal',
      '5. Alternative: Install via chocolatey: choco install ffmpeg',
      '6. Alternative: Install via winget: winget install --id=Gyan.FFmpeg'
    ];
  } else if (isMacOS) {
    return [
      '1. Install via Homebrew: brew install ffmpeg',
      '2. Alternative: Install via MacPorts: sudo port install ffmpeg',
      '3. Alternative: Download from https://evermeet.cx/ffmpeg/',
      '4. Restart your terminal after installation'
    ];
  } else {
    return [
      '1. Ubuntu/Debian: sudo apt-get install ffmpeg',
      '2. CentOS/RHEL: sudo yum install ffmpeg (or dnf install ffmpeg)',
      '3. Arch Linux: sudo pacman -S ffmpeg',
      '4. Fedora: sudo dnf install ffmpeg',
      '5. SUSE: sudo zypper install ffmpeg',
      '6. Snap: sudo snap install ffmpeg'
    ];
  }
}

/**
 * Check for platform-specific build tools
 */
export async function checkBuildTools() {
  const results = {
    platform: platform,
    ffmpeg: await checkFFmpegAvailability(),
    buildTools: {},
    python: {},
    recommendations: []
  };

  if (isWindows) {
    // Check for Visual Studio Build Tools
    results.buildTools.visualStudio = await checkCommand('cl');
    results.buildTools.msbuild = await checkCommand('msbuild');
    results.buildTools.python = await checkCommand('python') || await checkCommand('python3');
    results.buildTools.nodeGyp = await checkCommand('node-gyp');
    
    // Check Python specifically
    results.python.python = await checkCommand('python');
    results.python.python3 = await checkCommand('python3');
    results.python.pip = await checkCommand('pip');
    
    if (!results.buildTools.visualStudio.available && !results.buildTools.msbuild.available) {
      results.recommendations.push('Install Visual Studio Build Tools: https://visualstudio.microsoft.com/downloads/');
    }
    if (!results.python.python.available && !results.python.python3.available) {
      results.recommendations.push('Install Python 3.8+ from https://python.org/downloads/');
    }
  } else if (isMacOS) {
    // Check for Xcode Command Line Tools
    results.buildTools.xcode = await checkCommand('xcode-select');
    results.buildTools.gcc = await checkCommand('gcc');
    results.buildTools.make = await checkCommand('make');
    results.buildTools.python3 = await checkCommand('python3');
    
    // Check Python specifically
    results.python.python3 = await checkCommand('python3');
    results.python.pip3 = await checkCommand('pip3');
    
    if (!results.buildTools.xcode.available || !results.buildTools.gcc.available) {
      results.recommendations.push('Install Xcode Command Line Tools: xcode-select --install');
    }
    if (!results.python.python3.available) {
      results.recommendations.push('Install Python 3.8+ via Homebrew: brew install python3');
    }
  } else {
    // Linux
    results.buildTools.gcc = await checkCommand('gcc');
    results.buildTools.make = await checkCommand('make');
    results.buildTools.pkgConfig = await checkCommand('pkg-config');
    results.buildTools.python3 = await checkCommand('python3');
    results.buildTools.pythonDev = await checkCommand('python3-config');
    
    // Check Python specifically
    results.python.python3 = await checkCommand('python3');
    results.python.pip3 = await checkCommand('pip3');
    
    if (!results.buildTools.gcc.available || !results.buildTools.make.available) {
      results.recommendations.push('Install build tools: sudo apt-get install build-essential (Ubuntu/Debian) or equivalent');
    }
    if (!results.buildTools.pkgConfig.available) {
      results.recommendations.push('Install pkg-config: sudo apt-get install pkg-config (Ubuntu/Debian) or equivalent');
    }
    if (!results.python.python3.available) {
      results.recommendations.push('Install Python 3.8+: sudo apt-get install python3-dev python3-pip (Ubuntu/Debian) or equivalent');
    }
    
    // Check for Cairo development libraries (required for Canvas)
    const cairoLibs = [
      'libcairo2-dev',
      'libpango1.0-dev', 
      'libjpeg-dev',
      'libgif-dev',
      'librsvg2-dev'
    ];
    
    results.buildTools.cairo = { available: false, missing: [] };
    for (const lib of cairoLibs) {
      const check = await checkCommand(`dpkg -l | grep ${lib}`);
      if (!check.available) {
        results.buildTools.cairo.missing.push(lib);
      }
    }
    
    if (results.buildTools.cairo.missing.length > 0) {
      results.recommendations.push(`Install Cairo libraries: sudo apt-get install ${results.buildTools.cairo.missing.join(' ')} (Ubuntu/Debian) or equivalent`);
    } else {
      results.buildTools.cairo.available = true;
    }
  }

  return results;
}

/**
 * Get platform-specific spawn options
 */
export function getSpawnOptions() {
  const options = {
    stdio: 'pipe',
    shell: true
  };

  if (isWindows) {
    options.windowsHide = true;
  }

  return options;
}

/**
 * Get platform-specific installation instructions
 */
export function getPlatformInstallInstructions() {
  if (isWindows) {
    return {
      title: 'Windows Installation Requirements',
      steps: [
        '1. Install Visual Studio Build Tools 2022 (or Visual Studio Community)',
        '   Download from: https://visualstudio.microsoft.com/downloads/',
        '   Make sure to include "C++ build tools" and "Windows 10/11 SDK"',
        '',
        '2. Install Python 3.8 or newer',
        '   Download from: https://python.org/downloads/',
        '   ⚠️  Make sure to check "Add Python to PATH" during installation',
        '',
        '3. Install FFmpeg',
        '   Option A: Download from https://ffmpeg.org/download.html#build-windows',
        '            Extract to C:\\ffmpeg\\ and add C:\\ffmpeg\\bin to PATH',
        '   Option B: Use package manager:',
        '            choco install ffmpeg (if you have Chocolatey)',
        '            winget install --id=Gyan.FFmpeg (if you have winget)',
        '',
        '4. Install Node.js 16 or newer from https://nodejs.org/',
        '',
        '5. Restart your command prompt/PowerShell after installation',
        '',
        '6. Run: npm install -g editly-mcp'
      ]
    };
  } else if (isMacOS) {
    return {
      title: 'macOS Installation Requirements',
      steps: [
        '1. Install Xcode Command Line Tools',
        '   Run: xcode-select --install',
        '',
        '2. Install Homebrew (if not already installed)',
        '   Run: /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"',
        '',
        '3. Install required dependencies',
        '   Run: brew install python3 ffmpeg',
        '',
        '4. Install Node.js 16 or newer',
        '   Run: brew install node',
        '   Or download from: https://nodejs.org/',
        '',
        '5. For Apple Silicon Macs, ensure you\'re using native Node.js',
        '   Check with: node -p "process.arch"',
        '   Should show "arm64" for Apple Silicon',
        '',
        '6. Run: npm install -g editly-mcp'
      ]
    };
  } else {
    return {
      title: 'Linux Installation Requirements',
      steps: [
        '1. Install build tools and development libraries',
        '   Ubuntu/Debian:',
        '   sudo apt-get update',
        '   sudo apt-get install build-essential pkg-config python3-dev python3-pip',
        '   sudo apt-get install libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev',
        '',
        '   CentOS/RHEL/Fedora:',
        '   sudo yum install gcc gcc-c++ make python3-devel python3-pip',
        '   sudo yum install cairo-devel pango-devel libjpeg-turbo-devel giflib-devel librsvg2-devel',
        '',
        '   Arch Linux:',
        '   sudo pacman -S base-devel python cairo pango libjpeg-turbo giflib librsvg',
        '',
        '2. Install FFmpeg',
        '   Ubuntu/Debian: sudo apt-get install ffmpeg',
        '   CentOS/RHEL: sudo yum install ffmpeg',
        '   Fedora: sudo dnf install ffmpeg',
        '   Arch Linux: sudo pacman -S ffmpeg',
        '',
        '3. Install Node.js 16 or newer',
        '   Ubuntu/Debian: sudo apt-get install nodejs npm',
        '   Or use NodeSource repository for latest versions',
        '',
        '4. Run: npm install -g editly-mcp'
      ]
    };
  }
}

/**
 * Comprehensive system diagnostic
 */
export async function runSystemDiagnostic() {
  console.log('🔍 Running system diagnostic for editly-mcp...\n');
  
  const buildTools = await checkBuildTools();
  
  console.log(`Platform: ${buildTools.platform}`);
  console.log(`FFmpeg: ${buildTools.ffmpeg.available ? '✅ Available' : '❌ Missing'}`);
  
  if (!buildTools.ffmpeg.available) {
    console.log('📋 FFmpeg Installation Instructions:');
    buildTools.ffmpeg.installInstructions.forEach(instruction => {
      console.log(`   ${instruction}`);
    });
    console.log('');
  }
  
  console.log('🛠️  Build Tools Status:');
  Object.entries(buildTools.buildTools).forEach(([tool, status]) => {
    if (typeof status === 'object' && status.available !== undefined) {
      console.log(`   ${tool}: ${status.available ? '✅' : '❌'}`);
    } else {
      console.log(`   ${tool}: ${status ? '✅' : '❌'}`);
    }
  });
  
  console.log('🐍 Python Status:');
  Object.entries(buildTools.python).forEach(([tool, status]) => {
    if (typeof status === 'object' && status.available !== undefined) {
      console.log(`   ${tool}: ${status.available ? '✅' : '❌'}`);
    } else {
      console.log(`   ${tool}: ${status ? '✅' : '❌'}`);
    }
  });
  
  if (buildTools.recommendations.length > 0) {
    console.log('\n📝 Recommendations:');
    buildTools.recommendations.forEach(rec => {
      console.log(`   • ${rec}`);
    });
  }
  
  return buildTools;
}