#!/usr/bin/env node

import fs from 'fs/promises';

// Function to convert filename to proper text
function filenameToText(filename) {
  const nameWithoutExt = filename.replace(/\.(mp4|mov|avi|mkv)$/i, '');
  const match = nameWithoutExt.match(/cow\d+-(.+)/);
  if (!match) return nameWithoutExt;
  
  const text = match[1];
  return text
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

async function createSimpleConfig() {
  const videoDir = './cow/video';
  const videoFiles = await fs.readdir(videoDir);
  const cowVideos = videoFiles
    .filter(file => file.startsWith('cow') && file.endsWith('.mp4'))
    .sort();

  console.log('Creating simplified video configuration...');

  // Simple transitions that are less likely to fail
  const simpleTransitions = ['fade', 'dissolve'];

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
          fontColor: '#FFFFFF'
        }
      ],
      transition: index < cowVideos.length - 1 ? {
        name: simpleTransitions[index % simpleTransitions.length],
        duration: 0.5
      } : undefined
    };
  });

  const config = {
    outputPath: './output/ai-milking-cow-simple.mp4',
    width: 1920,
    height: 1080,
    fps: 30,
    audioFilePath: './cow/audio/intro.mp3',
    loopAudio: false,
    keepSourceAudio: false,
    clipsAudioVolume: 0.2,
    outputVolume: 0.8,
    clips: [
      // Simple intro
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
        transition: { name: 'fade', duration: 1 }
      },
      ...videoClips
    ]
  };

  const configPath = './output/simple-video-config.json';
  await fs.mkdir('./output', { recursive: true });
  await fs.writeFile(configPath, JSON.stringify(config, null, 2));
  
  console.log('✅ Simple configuration saved to:', configPath);
  return config;
}

createSimpleConfig().catch(console.error);