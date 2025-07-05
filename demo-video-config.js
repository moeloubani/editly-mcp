#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';

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

async function generateVideoConfig() {
  console.log('🎬 AI Milking a Cow - Video Configuration Generator');
  console.log('=' .repeat(50));
  
  // List cow videos
  const videoDir = './cow/video';
  const videoFiles = await fs.readdir(videoDir);
  const cowVideos = videoFiles
    .filter(file => file.startsWith('cow') && file.endsWith('.mp4'))
    .sort();
  
  console.log('\n📹 Found cow videos:');
  cowVideos.forEach(file => {
    const text = filenameToText(file);
    console.log(`  ${file} → "${text}"`);
  });
  
  // Cool transitions to cycle through
  const transitions = ['dissolve', 'fade', 'circleOpen', 'crosswarp', 'dreamyzoom', 'burn', 'simplezoom'];
  
  // Generate video clips with text overlays
  const videoClips = cowVideos.map((filename, index) => {
    const overlayText = filenameToText(filename);
    
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
        name: transitions[index % transitions.length],
        duration: 0.7
      } : undefined
    };
  });
  
  // Create the complete video configuration
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
      // Intro clip with "AI Milking a Cow" on solid background
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
            fontColor: '#ecf0f1'
          },
          {
            type: 'subtitle',
            text: 'A Digital Dairy Adventure',
            fontSize: 32,
            fontColor: '#bdc3c7'
          }
        ],
        transition: { name: 'circleOpen', duration: 1 }
      },
      // All the cow video clips with text overlays
      ...videoClips
    ]
  };
  
  console.log('\n🎨 Generated Video Configuration:');
  console.log('=' .repeat(50));
  console.log(`📊 Total clips: ${videoConfig.clips.length}`);
  console.log(`⏱️  Estimated duration: ${videoConfig.clips.reduce((sum, clip) => sum + clip.duration, 0)} seconds`);
  console.log(`🎵 Background audio: ${videoConfig.audioFilePath}`);
  console.log(`📐 Resolution: ${videoConfig.width}x${videoConfig.height} @ ${videoConfig.fps}fps`);
  
  // Save configuration to file
  const configPath = './output/video-config.json';
  await fs.mkdir(path.dirname(configPath), { recursive: true });
  await fs.writeFile(configPath, JSON.stringify(videoConfig, null, 2));
  
  console.log(`\n💾 Configuration saved to: ${configPath}`);
  console.log('\n🚀 This configuration is ready to use with the Editly MCP server!');
  console.log('\nTo create the video when editly is available, use the MCP tool:');
  console.log('create_video with the above configuration');
  
  return videoConfig;
}

// Run the generator
generateVideoConfig().catch(console.error);