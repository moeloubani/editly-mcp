#!/usr/bin/env node

import fs from 'fs/promises';
import { spawn } from 'child_process';
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

async function createCowVideo() {
  console.log('🐄 Creating AI Milking a Cow video compilation...\n');
  
  // List cow videos
  const videoDir = './cow/video';
  const videoFiles = await fs.readdir(videoDir);
  const cowVideos = videoFiles
    .filter(file => file.startsWith('cow') && file.endsWith('.mp4'))
    .sort();
  
  console.log('📹 Found cow videos:');
  cowVideos.forEach(file => {
    const text = filenameToText(file);
    console.log(`  ${file} → "${text}"`);
  });
  
  // Cool transitions to cycle through
  const coolTransitions = [
    'dissolve', 'fade', 'circleOpen', 'crosswarp', 'dreamyzoom', 
    'burn', 'simplezoom', 'crosszoom', 'linearblur', 'swirl'
  ];
  
  // Generate video clips with text overlays
  const videoClips = cowVideos.map((filename, index) => {
    const overlayText = filenameToText(filename);
    const transition = coolTransitions[index % coolTransitions.length];
    
    console.log(`📺 Clip ${index + 1}: "${overlayText}" with ${transition} transition`);
    
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
        name: transition,
        duration: 0.7
      } : undefined
    };
  });
  
  // Create the complete video configuration
  const videoConfig = {
    outPath: './output/cow/ai-milking-cow-compilation.mp4',
    width: 1920,
    height: 1080,
    fps: 30,
    audioFilePath: './cow/audio/intro.mp3',
    loopAudio: false,
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
      // All the cow video clips with text overlays and cool transitions
      ...videoClips
    ]
  };
  
  console.log('\n🎨 Video Configuration:');
  console.log(`📊 Total clips: ${videoConfig.clips.length}`);
  console.log(`⏱️  Estimated duration: ${videoConfig.clips.reduce((sum, clip) => sum + clip.duration, 0)} seconds`);
  console.log(`🎵 Background audio: ${videoConfig.audioFilePath}`);
  console.log(`📐 Resolution: ${videoConfig.width}x${videoConfig.height} @ ${videoConfig.fps}fps`);
  console.log(`📁 Output: ${videoConfig.outPath}`);
  
  // Save configuration to file
  const configPath = './output/cow/video-config.json';
  await fs.writeFile(configPath, JSON.stringify(videoConfig, null, 2));
  console.log(`💾 Configuration saved to: ${configPath}`);
  
  console.log('\n🚀 Starting video creation with editly...');
  console.log('This will take a few minutes for the full HD compilation...\n');
  
  // Run editly with the configuration
  return new Promise((resolve, reject) => {
    const editly = spawn('npx', ['editly', configPath], {
      stdio: 'inherit',
      shell: true
    });
    
    editly.on('close', async (code) => {
      if (code === 0) {
        try {
          const stats = await fs.stat(videoConfig.outPath);
          console.log(`\n✅ Video created successfully!`);
          console.log(`📁 Location: ${videoConfig.outPath}`);
          console.log(`📏 Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
          
          // Clean up config file
          await fs.unlink(configPath).catch(() => {});
          
          resolve(true);
        } catch (statError) {
          console.error('❌ Video file was not created');
          resolve(false);
        }
      } else {
        console.error(`❌ Video creation failed with code ${code}`);
        resolve(false);
      }
    });
    
    editly.on('error', (err) => {
      console.error('❌ Error running editly:', err.message);
      resolve(false);
    });
  });
}

// Run the video creation
createCowVideo()
  .then(success => {
    if (success) {
      console.log('\n🎉 Cow video compilation complete!');
      console.log('🐄 Ready to show off your AI milking skills!');
    } else {
      console.log('\n💔 Video creation failed');
    }
    process.exit(success ? 0 : 1);
  })
  .catch(console.error);