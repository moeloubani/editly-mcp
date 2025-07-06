#!/usr/bin/env node
/**
 * FFmpeg-based video creation backend
 * Alternative to editly that avoids Node.js native module dependencies
 */

import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { getSpawnOptions } from './platform-utils.js';

/**
 * Create a simple video using FFmpeg directly
 */
export async function createSimpleVideoFFmpeg(config) {
  const { outputPath, clips, audioPath, width = 1920, height = 1080, fps = 30 } = config;
  
  // Create a filter complex for concatenating videos
  let filterComplex = '';
  let inputs = [];
  
  // Add video inputs
  clips.forEach((clip, i) => {
    inputs.push('-i', clip.path);
    
    // Scale and pad each input to consistent size
    filterComplex += `[${i}:v]scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2,setpts=PTS-STARTPTS,fps=${fps}[v${i}];`;
  });
  
  // Concatenate all videos
  const videoInputs = clips.map((_, i) => `[v${i}]`).join('');
  filterComplex += `${videoInputs}concat=n=${clips.length}:v=1:a=0[outv]`;
  
  // Build FFmpeg command
  const ffmpegArgs = [
    ...inputs,
    '-filter_complex', filterComplex,
    '-map', '[outv]',
    '-c:v', 'libx264',
    '-preset', 'medium',
    '-crf', '23',
    '-pix_fmt', 'yuv420p'
  ];
  
  // Add audio if specified
  if (audioPath) {
    ffmpegArgs.push('-i', audioPath);
    ffmpegArgs.push('-c:a', 'aac');
    ffmpegArgs.push('-shortest'); // Stop when shortest stream ends
  }
  
  ffmpegArgs.push('-y', outputPath); // Overwrite output file
  
  return executeFFmpeg(ffmpegArgs);
}

/**
 * Create a video with text overlays using FFmpeg
 */
export async function createVideoWithTextFFmpeg(config) {
  const { outputPath, clips, width = 1920, height = 1080, fps = 30 } = config;
  
  // For now, create a simple version - we can expand this later
  // This would require more complex FFmpeg filter chains for text overlays
  
  if (clips.length === 1 && clips[0].layers) {
    const clip = clips[0];
    const titleLayer = clip.layers.find(l => l.type === 'title');
    const colorLayer = clip.layers.find(l => l.type === 'fill-color');
    
    if (titleLayer && colorLayer) {
      // Create a simple title card
      const color = colorLayer.color.replace('#', '0x');
      const text = titleLayer.text.replace(/['"]/g, '\\"');
      
      const ffmpegArgs = [
        '-f', 'lavfi',
        '-i', `color=${color}:size=${width}x${height}:duration=${clip.duration}:rate=${fps}`,
        '-vf', `drawtext=text='${text}':fontsize=${titleLayer.fontSize || 48}:fontcolor=${titleLayer.fontColor || 'white'}:x=(w-text_w)/2:y=(h-text_h)/2`,
        '-c:v', 'libx264',
        '-preset', 'medium',
        '-crf', '23',
        '-pix_fmt', 'yuv420p',
        '-y', outputPath
      ];
      
      return executeFFmpeg(ffmpegArgs);
    }
  }
  
  // Fallback to simple video creation
  return createSimpleVideoFFmpeg(config);
}

/**
 * Execute FFmpeg command with proper error handling
 */
async function executeFFmpeg(args) {
  return new Promise((resolve, reject) => {
    const spawnOptions = { ...getSpawnOptions(), stdio: 'pipe' };
    const ffmpegProcess = spawn('ffmpeg', args, spawnOptions);
    
    let stdout = '';
    let stderr = '';
    let resolved = false;
    
    // Set a timeout to prevent hanging
    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        ffmpegProcess.kill('SIGTERM');
        reject(new Error('FFmpeg process timed out after 300 seconds'));
      }
    }, 300000); // 5 minutes timeout
    
    const cleanup = () => {
      if (timeout) clearTimeout(timeout);
    };
    
    ffmpegProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    ffmpegProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    ffmpegProcess.on('close', (code) => {
      if (!resolved) {
        resolved = true;
        cleanup();
        
        if (code === 0) {
          resolve({ success: true, output: 'FFmpeg execution completed successfully' });
        } else {
          reject(new Error(`FFmpeg execution failed with code ${code}: ${stderr}`));
        }
      }
    });
    
    ffmpegProcess.on('error', (err) => {
      if (!resolved) {
        resolved = true;
        cleanup();
        reject(err);
      }
    });
  });
}

/**
 * Check if FFmpeg is available and working
 */
export async function checkFFmpegCompatibility() {
  try {
    const result = await executeFFmpeg(['-version']);
    return { available: true, backend: 'ffmpeg' };
  } catch (error) {
    return { available: false, error: error.message };
  }
}