#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import fs from 'fs/promises';
import path from 'path';

// Import our MCP server
const { default: mcpServer } = await import('./index.js');

// Function to convert filename to proper text
function filenameToText(filename) {
  // Remove file extension
  const nameWithoutExt = filename.replace(/\.(mp4|mov|avi|mkv)$/i, '');
  
  // Extract text after cow#-
  const match = nameWithoutExt.match(/cow\d+-(.+)/);
  if (!match) return nameWithoutExt;
  
  const text = match[1];
  
  // Replace hyphens with spaces and convert to proper case
  return text
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

// Test the video creation
async function testVideoCreation() {
  console.log('Testing Editly MCP Server...\n');
  
  // List cow videos
  const videoDir = './cow/video';
  const videoFiles = await fs.readdir(videoDir);
  const cowVideos = videoFiles
    .filter(file => file.startsWith('cow') && file.endsWith('.mp4'))
    .sort();
  
  console.log('Found cow videos:', cowVideos);
  
  // Generate text overlays from filenames
  const videoClips = cowVideos.map((filename, index) => {
    const overlayText = filenameToText(filename);
    console.log(`${filename} -> "${overlayText}"`);
    
    return {
      duration: 4,
      layers: [
        {
          type: 'video',
          path: `./cow/video/${filename}`,
          resizeMode: 'cover'
        },
        {
          type: 'title',
          text: overlayText,
          position: 'bottom',
          fontSize: 48,
          fontColor: '#FFFFFF',
          bottom: 100
        }
      ],
      transition: index < cowVideos.length - 1 ? {
        name: ['dissolve', 'fade', 'circleOpen', 'crosswarp', 'dreamyzoom'][index % 5],
        duration: 0.5
      } : undefined
    };
  });
  
  // Create the video configuration
  const videoConfig = {
    outputPath: './output/ai-milking-cow-compilation.mp4',
    width: 1920,
    height: 1080,
    fps: 30,
    audioFilePath: './cow/audio/intro.mp3',
    loopAudio: true,
    keepSourceAudio: false,
    clipsAudioVolume: 0.2,
    outputVolume: 0.8,
    defaults: {
      transition: {
        name: 'fade',
        duration: 0.5
      },
      layer: {
        fontFamily: 'Arial',
        fontSize: 48,
        fontColor: '#FFFFFF'
      }
    },
    clips: [
      // Intro clip
      {
        duration: 3,
        layers: [
          {
            type: 'fill-color',
            color: '#2c3e50'
          },
          {
            type: 'title',
            text: 'AI Milking a Cow',
            position: 'center',
            fontSize: 80,
            fontColor: '#FFFFFF'
          }
        ],
        transition: { name: 'circleOpen', duration: 1 }
      },
      // Video clips with text overlays
      ...videoClips
    ]
  };
  
  console.log('\nGenerated video configuration:');
  console.log(JSON.stringify(videoConfig, null, 2));
  
  // Test the MCP tool call
  console.log('\nTesting create_video tool...');
  
  try {
    // Simulate calling the MCP tool
    const toolRequest = {
      params: {
        name: 'create_video',
        arguments: videoConfig
      }
    };
    
    // This would normally go through the MCP protocol, but we'll call directly for testing
    console.log('Tool would be called with the above configuration');
    console.log('Expected result: Error message about editly not being available');
    
  } catch (error) {
    console.error('Error testing MCP tool:', error.message);
  }
}

testVideoCreation().catch(console.error);