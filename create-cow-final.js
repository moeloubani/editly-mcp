#!/usr/bin/env node

import fs from 'fs/promises';
import { spawn } from 'child_process';
import path from 'path';

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

async function createEnhancedCowVideo() {
  console.log('🐄 Creating Enhanced AI Milking a Cow compilation...\n');
  
  const videoDir = './cow/video';
  const videoFiles = await fs.readdir(videoDir);
  const cowVideos = videoFiles
    .filter(file => file.startsWith('cow') && file.endsWith('.mp4'))
    .sort();
  
  console.log('📹 Processing cow videos with text overlays:');
  cowVideos.forEach(file => {
    const text = filenameToText(file);
    console.log(`  ${file} → "${text}"`);
  });
  
  // Create individual clips with text overlays first
  const processedClips = [];
  
  for (let i = 0; i < cowVideos.length; i++) {
    const filename = cowVideos[i];
    const overlayText = filenameToText(filename);
    const outputClip = `./output/cow/clip-${i + 1}-${filename}`;
    
    console.log(`\n🎬 Processing clip ${i + 1}: "${overlayText}"`);
    
    // Create a simple config for this clip with text overlay
    const clipConfig = {
      outPath: outputClip,
      width: 1920,
      height: 1080,
      fps: 30,
      keepSourceAudio: true,
      clips: [
        {
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
              bottom: 80
            }
          ]
        }
      ]
    };
    
    const configPath = `./output/cow/config-${i + 1}.json`;
    await fs.writeFile(configPath, JSON.stringify(clipConfig, null, 2));
    
    // Process this clip
    await new Promise((resolve, reject) => {
      const editly = spawn('npx', ['editly', configPath], {
        stdio: 'pipe',
        shell: true
      });
      
      editly.on('close', async (code) => {
        await fs.unlink(configPath).catch(() => {});
        if (code === 0) {
          processedClips.push(outputClip);
          console.log(`  ✅ Clip ${i + 1} processed successfully`);
          resolve();
        } else {
          console.log(`  ❌ Clip ${i + 1} failed`);
          reject(new Error(`Clip processing failed`));
        }
      });
    });
  }
  
  console.log(`\n🎭 All clips processed, creating final compilation...`);
  
  // Now combine all processed clips with the intro
  const finalCommand = [
    'npx', 'editly',
    'title:AI Milking a Cow',
    ...processedClips,
    '--out', './output/cow/ai-milking-cow-final-with-text.mp4',
    '--audio-file-path', './cow/audio/intro.mp3',
    '--width', '1920',
    '--height', '1080',
    '--fps', '30',
    '--transition-name', 'fade',
    '--transition-duration', '0.5'
  ];
  
  console.log('🚀 Running final compilation...\n');
  
  return new Promise((resolve, reject) => {
    const editly = spawn(finalCommand[0], finalCommand.slice(1), {
      stdio: 'inherit',
      shell: true
    });
    
    editly.on('close', async (code) => {
      // Clean up temporary clips
      for (const clip of processedClips) {
        await fs.unlink(clip).catch(() => {});
      }
      
      if (code === 0) {
        try {
          const stats = await fs.stat('./output/cow/ai-milking-cow-final-with-text.mp4');
          console.log(`\n✅ Final video created successfully!`);
          console.log(`📁 Location: ./output/cow/ai-milking-cow-final-with-text.mp4`);
          console.log(`📏 Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
          resolve(true);
        } catch (error) {
          console.error('❌ Final video file not found');
          resolve(false);
        }
      } else {
        console.error(`❌ Final compilation failed with code ${code}`);
        resolve(false);
      }
    });
    
    editly.on('error', (err) => {
      console.error('❌ Error in final compilation:', err.message);
      resolve(false);
    });
  });
}

// Run the enhanced video creation
createEnhancedCowVideo()
  .then(success => {
    if (success) {
      console.log('\n🎉 Enhanced cow video compilation complete!');
      console.log('🐄 Your AI milking masterpiece is ready with custom text overlays!');
    } else {
      console.log('\n💔 Enhanced video creation failed');
    }
    process.exit(success ? 0 : 1);
  })
  .catch(console.error);