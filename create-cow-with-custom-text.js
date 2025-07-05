#!/usr/bin/env node

import fs from 'fs/promises';
import { spawn } from 'child_process';
import path from 'path';

async function createCustomCowVideo() {
  console.log('🐄 Creating AI Milking a Cow with custom text overlays...\n');
  
  // Your custom text for each video
  const customTexts = [
    "Seems to be catching the milk",
    "Milk right into poop", 
    "Neck milk",
    "More neck milk",
    "Is he spitting it into his hands?",
    "Close but the cow looks empty"
  ];
  
  const cowVideos = [
    'cow1-catching-milk.mp4',
    'cow2-into-poop.mp4', 
    'cow3-neck-milk.mp4',
    'cow4-more-neck-milk.mp4',
    'cow5-behind-cow-milk.mp4',
    'cow6-cow-is-empty.mp4'
  ];
  
  console.log('📹 Video text overlays:');
  cowVideos.forEach((file, index) => {
    console.log(`  ${index + 1}. ${file} → "${customTexts[index]}"`);
  });
  
  // Cool transitions that work well
  const coolTransitions = ['dissolve', 'fade', 'directional-left', 'directional-right', 'directional-up', 'directional-down'];
  
  // Create configuration with custom text and original audio
  const videoConfig = {
    outPath: './output/cow/ai-milking-cow-custom-text.mp4',
    width: 1920,
    height: 1080,
    fps: 30,
    audioFilePath: './cow/audio/intro.mp3',
    loopAudio: false,
    keepSourceAudio: true,  // Keep original video audio
    clipsAudioVolume: 0.7,  // Original video audio volume
    outputVolume: 0.9,
    defaults: {
      layer: {
        fontFamily: 'Arial',
        fontSize: 44,
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
            fontColor: '#ecf0f1'
          },
          {
            type: 'subtitle',
            text: 'A Digital Dairy Adventure',
            fontSize: 32,
            fontColor: '#bdc3c7'
          }
        ],
        transition: { name: 'fade', duration: 1 }
      },
      // Video clips with custom text
      ...cowVideos.map((filename, index) => ({
        duration: 4,
        layers: [
          {
            type: 'video',
            path: `./cow/video/${filename}`,
            resizeMode: 'cover'
          },
          {
            type: 'title',
            text: customTexts[index],
            position: 'bottom',
            fontSize: 44,
            fontColor: '#FFFFFF',
            bottom: 80
          }
        ],
        transition: index < cowVideos.length - 1 ? {
          name: coolTransitions[index % coolTransitions.length],
          duration: 0.6
        } : undefined
      }))
    ]
  };
  
  console.log('\n🎨 Video Configuration:');
  console.log(`📊 Total clips: ${videoConfig.clips.length}`);
  console.log(`⏱️  Estimated duration: ${videoConfig.clips.reduce((sum, clip) => sum + clip.duration, 0)} seconds`);
  console.log(`🎵 Background audio: ${videoConfig.audioFilePath} + original video audio`);
  console.log(`📐 Resolution: ${videoConfig.width}x${videoConfig.height} @ ${videoConfig.fps}fps`);
  console.log(`📁 Output: ${videoConfig.outPath}`);
  
  // Save config and create video
  const configPath = './output/cow/custom-text-config.json';
  await fs.writeFile(configPath, JSON.stringify(videoConfig, null, 2));
  console.log(`💾 Configuration saved to: ${configPath}`);
  
  console.log('\n🚀 Starting video creation with custom text and cool transitions...');
  console.log('This may take a few minutes for the full HD compilation...\n');
  
  return new Promise((resolve, reject) => {
    const editly = spawn('npx', ['editly', configPath], {
      stdio: 'inherit',
      shell: true
    });
    
    editly.on('close', async (code) => {
      // Clean up config file
      await fs.unlink(configPath).catch(() => {});
      
      if (code === 0) {
        try {
          const stats = await fs.stat(videoConfig.outPath);
          console.log(`\n✅ Custom text video created successfully!`);
          console.log(`📁 Location: ${videoConfig.outPath}`);
          console.log(`📏 Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
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

// If the complex config fails, fall back to command line approach
async function createFallbackVideo() {
  console.log('\n🔄 Trying fallback approach with command line...');
  
  const customTexts = [
    "Seems to be catching the milk",
    "Milk right into poop", 
    "Neck milk",
    "More neck milk", 
    "Is he spitting it into his hands?",
    "Close but the cow looks empty"
  ];
  
  // Create individual title clips first
  for (let i = 0; i < customTexts.length; i++) {
    const titleFile = `./output/cow/title-${i + 1}.mp4`;
    await new Promise((resolve) => {
      const editly = spawn('npx', ['editly', `title:${customTexts[i]}`, '--out', titleFile, '--width', '1920', '--height', '1080', '--clip-duration', '1'], {
        stdio: 'pipe',
        shell: true
      });
      editly.on('close', () => resolve());
    });
  }
  
  // Now create the final video
  const command = [
    'npx', 'editly',
    'title:AI Milking a Cow',
    './output/cow/title-1.mp4', './cow/video/cow1-catching-milk.mp4',
    './output/cow/title-2.mp4', './cow/video/cow2-into-poop.mp4',
    './output/cow/title-3.mp4', './cow/video/cow3-neck-milk.mp4', 
    './output/cow/title-4.mp4', './cow/video/cow4-more-neck-milk.mp4',
    './output/cow/title-5.mp4', './cow/video/cow5-behind-cow-milk.mp4',
    './output/cow/title-6.mp4', './cow/video/cow6-cow-is-empty.mp4',
    '--out', './output/cow/ai-milking-cow-fallback.mp4',
    '--audio-file-path', './cow/audio/intro.mp3',
    '--keep-source-audio',
    '--width', '1920', '--height', '1080', '--fps', '30',
    '--transition-name', 'random',
    '--transition-duration', '0.6'
  ];
  
  return new Promise((resolve) => {
    const editly = spawn(command[0], command.slice(1), {
      stdio: 'inherit',
      shell: true
    });
    
    editly.on('close', async (code) => {
      // Clean up title files
      for (let i = 1; i <= 6; i++) {
        await fs.unlink(`./output/cow/title-${i}.mp4`).catch(() => {});
      }
      resolve(code === 0);
    });
  });
}

// Run the video creation
createCustomCowVideo()
  .then(success => {
    if (success) {
      console.log('\n🎉 Custom text cow video compilation complete!');
      console.log('🐄 Your AI milking masterpiece with custom text is ready!');
    } else {
      console.log('\n🔄 Primary method failed, trying fallback...');
      return createFallbackVideo();
    }
    return success;
  })
  .then(finalSuccess => {
    if (finalSuccess) {
      console.log('\n🎉 Video creation successful!');
    } else {
      console.log('\n💔 Video creation failed');
    }
    process.exit(finalSuccess ? 0 : 1);
  })
  .catch(console.error);