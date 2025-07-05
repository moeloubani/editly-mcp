#!/usr/bin/env node

import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';

// Function to simulate an MCP tool call
async function testMCPToolCall() {
  console.log('🧪 Testing MCP Server create_simple_video tool...\n');
  
  // Create a simple video configuration using our MCP server's tool
  const toolArgs = {
    outputPath: './output/mcp-test-video.mp4',
    clips: [
      { path: './cow/video/cow1-catching-milk.mp4', duration: 3 },
      { path: './cow/video/cow2-into-poop.mp4', duration: 3 },
      { path: './cow/video/cow3-neck-milk.mp4', duration: 3 }
    ],
    audioPath: './cow/audio/intro.mp3',
    width: 1280,
    height: 720,
    fps: 24
  };
  
  console.log('📋 Tool Arguments:');
  console.log(JSON.stringify(toolArgs, null, 2));
  
  // Convert to editly format (simulate what our MCP server does)
  const clips = toolArgs.clips.map((clip, index) => {
    const isImage = /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(clip.path);
    const layers = [{
      type: isImage ? 'image' : 'video',
      path: path.resolve(clip.path),
      resizeMode: 'cover'
    }];
    
    return {
      duration: clip.duration || (isImage ? 3 : undefined),
      layers
    };
  });
  
  const editlyConfig = {
    outPath: path.resolve(toolArgs.outputPath),
    width: toolArgs.width,
    height: toolArgs.height,
    fps: toolArgs.fps,
    audioFilePath: path.resolve(toolArgs.audioPath),
    loopAudio: false,
    clips
  };
  
  console.log('\n🎬 Generated Editly Configuration:');
  console.log(JSON.stringify(editlyConfig, null, 2));
  
  // Save config and run editly
  const configPath = './output/mcp-test-config.json';
  await fs.writeFile(configPath, JSON.stringify(editlyConfig, null, 2));
  
  console.log('\n🚀 Running editly via MCP simulation...');
  
  return new Promise((resolve, reject) => {
    const editly = spawn('npx', ['editly', configPath], {
      stdio: 'inherit',
      shell: true
    });
    
    editly.on('close', (code) => {
      if (code === 0) {
        console.log('\n✅ MCP Tool Call Successful!');
        resolve(true);
      } else {
        console.log(`\n❌ MCP Tool Call Failed with code ${code}`);
        resolve(false);
      }
    });
    
    editly.on('error', (err) => {
      console.error('\n❌ MCP Tool Call Error:', err.message);
      resolve(false);
    });
  });
}

// Run the test
testMCPToolCall()
  .then(async (success) => {
    if (success) {
      try {
        const stats = await fs.stat('./output/mcp-test-video.mp4');
        console.log(`📁 Output: ./output/mcp-test-video.mp4`);
        console.log(`📏 Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
        console.log('\n🎉 MCP Server simulation complete - editly is working perfectly!');
      } catch (error) {
        console.log('❌ Video file not found');
      }
    }
    
    // Clean up
    await fs.unlink('./output/mcp-test-config.json').catch(() => {});
  })
  .catch(console.error);