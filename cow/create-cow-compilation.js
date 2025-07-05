#!/usr/bin/env node

import { spawn } from 'child_process';
import path from 'path';
import { promises as fs } from 'fs';

// Configuration for your AI Milking Cow video
const config = {
  outPath: './output/ai-milking-cow-compilation.mp4',
  width: 1920,
  height: 1080,
  fps: 30,
  audioFilePath: './source/audio/intro.mp3',
  keepSourceAudio: true,
  clipsAudioVolume: 0.8,
  outputVolume: 1.0,
  clips: [
    // Title screen with intro audio
    {
      duration: 4,
      layers: [
        {
          type: 'fill-color',
          color: '#000000'
        },
        {
          type: 'title',
          text: 'AI Milking a Cow',
          fontFamily: 'Arial',
          fontSize: 120,
          fontColor: '#ffffff',
          position: 'center'
        }
      ],
      audioFilePath: './source/audio/intro.mp3'
    },
    // Video 1: He is catching the milk
    {
      layers: [
        {
          type: 'video',
          path: './source/video/cow1-catching-milk.mp4',
          resizeMode: 'cover'
        },
        {
          type: 'title',
          text: 'He is catching the milk',
          fontFamily: 'Arial',
          fontSize: 60,
          fontColor: '#ffffff',
          position: 'top',
          top: 50,
          backgroundColor: 'rgba(0,0,0,0.7)'
        }
      ],
      transition: {
        name: 'slideRight',
        duration: 1
      }
    },
    // Video 2: Milking right into poop
    {
      layers: [
        {
          type: 'video',
          path: './source/video/cow2-into-poop.mp4',
          resizeMode: 'cover'
        },
        {
          type: 'title',
          text: 'Milking right into poop',
          fontFamily: 'Arial',
          fontSize: 60,
          fontColor: '#ffffff',
          position: 'top',
          top: 50,
          backgroundColor: 'rgba(0,0,0,0.7)'
        }
      ],
      transition: {
        name: 'fade',
        duration: 1
      }
    },
    // Video 3: Looks like neck milk
    {
      layers: [
        {
          type: 'video',
          path: './source/video/cow3-neck-milk.mp4',
          resizeMode: 'cover'
        },
        {
          type: 'title',
          text: 'Looks like neck milk',
          fontFamily: 'Arial',
          fontSize: 60,
          fontColor: '#ffffff',
          position: 'top',
          top: 50,
          backgroundColor: 'rgba(0,0,0,0.7)'
        }
      ],
      transition: {
        name: 'wipeLeft',
        duration: 1
      }
    },
    // Video 4: More neck milk
    {
      layers: [
        {
          type: 'video',
          path: './source/video/cow4-more-neck-milk.mp4',
          resizeMode: 'cover'
        },
        {
          type: 'title',
          text: 'More neck milk',
          fontFamily: 'Arial',
          fontSize: 60,
          fontColor: '#ffffff',
          position: 'top',
          top: 50,
          backgroundColor: 'rgba(0,0,0,0.7)'
        }
      ],
      transition: {
        name: 'directional-up',
        duration: 1
      }
    },
    // Video 5: Is it coming from behind the cow?
    {
      layers: [
        {
          type: 'video',
          path: './source/video/cow5-behind-cow-milk.mp4',
          resizeMode: 'cover'
        },
        {
          type: 'title',
          text: 'Is it coming from behind the cow?',
          fontFamily: 'Arial',
          fontSize: 60,
          fontColor: '#ffffff',
          position: 'top',
          top: 50,
          backgroundColor: 'rgba(0,0,0,0.7)'
        }
      ],
      transition: {
        name: 'circleOpen',
        duration: 1
      }
    },
    // Video 6: Almost there, but the poor cow is on empty
    {
      layers: [
        {
          type: 'video',
          path: './source/video/cow6-cow-is-empty.mp4',
          resizeMode: 'cover'
        },
        {
          type: 'title',
          text: 'Almost there, but the poor cow is on empty',
          fontFamily: 'Arial',
          fontSize: 60,
          fontColor: '#ffffff',
          position: 'top',
          top: 50,
          backgroundColor: 'rgba(0,0,0,0.7)'
        }
      ]
    }
  ]
};

async function createVideo() {
  console.log('🐄 Creating AI Milking Cow compilation...');
  
  // Write config file
  const configPath = './temp-config.json';
  await fs.writeFile(configPath, JSON.stringify(config, null, 2));
  
  return new Promise((resolve, reject) => {
    console.log('🎬 Running editly...');
    
    const editlyProcess = spawn('npx', ['editly', configPath], {
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    editlyProcess.on('close', async (code) => {
      // Clean up temp file
      try {
        await fs.unlink(configPath);
      } catch (e) {
        // Ignore cleanup errors
      }
      
      if (code === 0) {
        console.log('✅ Video created successfully!');
        console.log(`📁 Output: ${config.outPath}`);
        resolve({ success: true });
      } else {
        reject(new Error(`Editly failed with code ${code}`));
      }
    });
    
    editlyProcess.on('error', (err) => {
      reject(err);
    });
  });
}

// Run the video creation
createVideo()
  .then(() => {
    console.log('🎉 AI Milking Cow compilation complete!');
  })
  .catch((error) => {
    console.error('❌ Failed to create video:', error.message);
    process.exit(1);
  });