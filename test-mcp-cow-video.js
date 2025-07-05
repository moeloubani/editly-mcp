#!/usr/bin/env node

import { promises as fs } from 'fs';
import path from 'path';

// Import our MCP server functions
import './index.js';

// Simulate MCP tool call for create_video
async function testCreateVideo() {
  console.log('🐄 Testing MCP Server: create_video with custom cow text...\n');
  
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
  
  console.log('📹 Video configuration:');
  cowVideos.forEach((file, index) => {
    console.log(`  ${index + 1}. ${file} → "${customTexts[index]}"`);
  });
  
  // Cool transitions for each clip
  const coolTransitions = [
    'dissolve', 'fade', 'directional-left', 'directional-right', 'directional-up'
  ];
  
  // Create MCP tool arguments
  const toolArgs = {
    outputPath: './output/cow/ai-milking-cow-mcp-final.mp4',
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
      // Video clips with custom text overlays
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
  
  console.log('\n🎨 MCP Tool Arguments:');
  console.log(`📊 Total clips: ${toolArgs.clips.length}`);
  console.log(`⏱️  Duration: ${toolArgs.clips.reduce((sum, clip) => sum + clip.duration, 0)} seconds`);
  console.log(`🎵 Audio: ${toolArgs.audioFilePath} + original video audio`);
  console.log(`📁 Output: ${toolArgs.outputPath}`);
  
  // Simulate the MCP server's create_video tool execution
  console.log('\n🚀 Executing MCP create_video tool...');
  
  try {
    // This simulates what the MCP server does internally
    const { executeEditly } = await import('./index.js');
    
    // Convert paths to absolute paths (like the MCP server does)
    const config = {
      ...toolArgs,
      outPath: path.resolve(toolArgs.outputPath),
      audioFilePath: toolArgs.audioFilePath ? path.resolve(toolArgs.audioFilePath) : undefined,
      clips: toolArgs.clips.map(clip => ({
        ...clip,
        layers: clip.layers?.map(layer => {
          if ('path' in layer) {
            return {
              ...layer,
              path: path.resolve(layer.path)
            };
          }
          return layer;
        })
      }))
    };
    
    // Execute editly through MCP server logic
    const result = await executeEditly(config);
    
    console.log('\n✅ MCP Tool Execution Successful!');
    
    // Check output file
    const stats = await fs.stat(toolArgs.outputPath);
    console.log(`📁 Video created: ${toolArgs.outputPath}`);
    console.log(`📏 Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
    
    return true;
    
  } catch (error) {
    console.error('\n❌ MCP Tool Execution Failed:', error.message);
    return false;
  }
}

// Run the test
testCreateVideo()
  .then(success => {
    if (success) {
      console.log('\n🎉 MCP Server successfully created your custom cow video!');
      console.log('🐄 AI Milking a Cow compilation with your text overlays is ready!');
    } else {
      console.log('\n💔 MCP video creation failed');
    }
    process.exit(success ? 0 : 1);
  })
  .catch(console.error);