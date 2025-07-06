#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { spawn } from 'child_process';
import { promisify } from 'util';
import which from 'which';
import { 
  checkFFmpegAvailability, 
  checkBuildTools, 
  getSpawnOptions, 
  getPlatformInstallInstructions,
  runSystemDiagnostic 
} from './platform-utils.js';
import { 
  createSimpleVideoFFmpeg, 
  createVideoWithTextFFmpeg,
  checkFFmpegCompatibility 
} from './ffmpeg-backend.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Schema definitions for Editly operations
const CreateVideoSchema = z.object({
  outputPath: z.string().describe('Path where the output video will be saved'),
  width: z.number().optional().default(1920).describe('Video width in pixels'),
  height: z.number().optional().default(1080).describe('Video height in pixels'),
  fps: z.number().optional().default(30).describe('Frames per second'),
  duration: z.number().optional().describe('Total duration of the video in seconds'),
  defaults: z.object({
    transition: z.object({
      name: z.string().optional(),
      duration: z.number().optional()
    }).optional(),
    layer: z.object({
      fontFamily: z.string().optional(),
      fontSize: z.number().optional(),
      fontColor: z.string().optional()
    }).optional()
  }).optional(),
  audioFilePath: z.string().optional().describe('Path to background audio file'),
  audioNorm: z.object({
    enable: z.boolean().optional(),
    gaussSize: z.number().optional(),
    maxGain: z.number().optional()
  }).optional().describe('Audio normalization settings'),
  loopAudio: z.boolean().optional().describe('Loop background audio if shorter than video'),
  keepSourceAudio: z.boolean().optional().describe('Keep audio from source video clips'),
  clipsAudioVolume: z.number().optional().describe('Volume of audio from video clips (0-1)'),
  outputVolume: z.number().optional().describe('Master output volume (0-1)'),
  clips: z.array(z.object({
    duration: z.number().describe('Duration of this clip in seconds'),
    layers: z.array(z.union([
      // Video layer
      z.object({
        type: z.literal('video'),
        path: z.string().describe('Path to video file'),
        resizeMode: z.enum(['contain', 'cover', 'stretch']).optional(),
        cutFrom: z.number().optional().describe('Start time in source video'),
        cutTo: z.number().optional().describe('End time in source video'),
        mixVolume: z.number().optional().describe('Audio volume (0-1)'),
        top: z.number().optional(),
        left: z.number().optional(),
        width: z.number().optional(),
        height: z.number().optional(),
        originX: z.enum(['left', 'center', 'right']).optional(),
        originY: z.enum(['top', 'center', 'bottom']).optional()
      }),
      // Image layer
      z.object({
        type: z.literal('image'),
        path: z.string().describe('Path to image file'),
        resizeMode: z.enum(['contain', 'cover', 'stretch']).optional(),
        zoomDirection: z.enum(['in', 'out', null]).optional(),
        zoomAmount: z.number().optional().describe('Zoom amount (e.g., 0.1 for 10%)'),
        top: z.number().optional(),
        left: z.number().optional(),
        width: z.number().optional(),
        height: z.number().optional(),
        originX: z.enum(['left', 'center', 'right']).optional(),
        originY: z.enum(['top', 'center', 'bottom']).optional()
      }),
      // Title layer
      z.object({
        type: z.literal('title'),
        text: z.string().describe('Text to display'),
        fontFamily: z.string().optional(),
        fontSize: z.number().optional(),
        fontColor: z.string().optional(),
        position: z.enum(['center', 'top', 'bottom', 'left', 'right', 
                         'top-left', 'top-right', 'bottom-left', 'bottom-right']).optional(),
        textAlign: z.enum(['left', 'center', 'right']).optional(),
        top: z.number().optional(),
        bottom: z.number().optional(),
        left: z.number().optional(),
        right: z.number().optional()
      }),
      // Canvas layer with various shapes
      z.object({
        type: z.literal('canvas'),
        func: z.string().describe('Canvas drawing function')
      }),
      // Subtitle layer
      z.object({
        type: z.literal('subtitle'),
        text: z.string().describe('Subtitle text'),
        fontFamily: z.string().optional(),
        fontSize: z.number().optional(),
        fontColor: z.string().optional(),
        backgroundColor: z.string().optional()
      }),
      // News title layer
      z.object({
        type: z.literal('news-title'),
        text: z.string().describe('News ticker text'),
        fontFamily: z.string().optional(),
        fontSize: z.number().optional(),
        fontColor: z.string().optional(),
        backgroundColor: z.string().optional(),
        speed: z.number().optional()
      }),
      // Slide-in text layer
      z.object({
        type: z.literal('slide-in-text'),
        text: z.string().describe('Text that slides in'),
        fontFamily: z.string().optional(),
        fontSize: z.number().optional(),
        fontColor: z.string().optional(),
        charSpacing: z.number().optional(),
        color: z.string().optional()
      }),
      // Fill color layer
      z.object({
        type: z.literal('fill-color'),
        color: z.string().describe('Fill color (hex or named)')
      }),
      // Pause layer
      z.object({
        type: z.literal('pause'),
        pauseFor: z.number().describe('Pause duration in seconds')
      })
    ])).describe('Layers to composite in this clip'),
    transition: z.object({
      name: z.string().optional().describe('Transition effect name'),
      duration: z.number().optional().describe('Transition duration in seconds'),
      params: z.record(z.any()).optional().describe('Transition-specific parameters')
    }).optional()
  })).describe('Array of clips that make up the video')
});

const ListTransitionsSchema = z.object({});

const ListFontsSchema = z.object({});

const CreateSimpleVideoSchema = z.object({
  outputPath: z.string().describe('Path where the output video will be saved'),
  clips: z.array(z.object({
    path: z.string().describe('Path to video/image file'),
    duration: z.number().optional().describe('Duration for images or to trim videos'),
    transition: z.string().optional().describe('Transition to next clip')
  })).describe('Simple array of video/image paths'),
  audioPath: z.string().optional().describe('Background audio file path'),
  width: z.number().optional().default(1920),
  height: z.number().optional().default(1080),
  fps: z.number().optional().default(30)
});

// Enhanced system check with cross-platform compatibility
async function checkSystemCompatibility() {
  const results = {
    editly: { available: false },
    ffmpeg: { available: false },
    buildTools: {},
    compatible: false,
    errors: [],
    recommendations: []
  };

  // Check FFmpeg availability
  const ffmpegCheck = await checkFFmpegAvailability();
  results.ffmpeg = ffmpegCheck;
  
  if (!ffmpegCheck.available) {
    results.errors.push('FFmpeg is required but not found');
    results.recommendations.push(...ffmpegCheck.installInstructions);
  }

  // Check editly availability
  try {
    await which('editly');
    results.editly = { available: true, command: 'editly' };
  } catch (error) {
    try {
      const editlyPath = path.join(__dirname, 'node_modules', '.bin', 'editly');
      await fs.access(editlyPath);
      results.editly = { available: true, command: 'npx editly' };
    } catch (npxError) {
      results.editly = { 
        available: false, 
        error: 'Editly not found. Please run the setup script or install editly manually.' 
      };
      results.errors.push('Editly not available');
    }
  }

  // Check build tools
  const buildToolsCheck = await checkBuildTools();
  results.buildTools = buildToolsCheck;
  
  if (buildToolsCheck.recommendations.length > 0) {
    results.recommendations.push(...buildToolsCheck.recommendations);
  }

  // Determine overall compatibility
  results.compatible = results.editly.available && results.ffmpeg.available;

  return results;
}

// Helper function to check if editly is available (legacy compatibility)
async function checkEditlyAvailability() {
  const systemCheck = await checkSystemCompatibility();
  return systemCheck.editly;
}

// Enhanced executeEditly with FFmpeg fallback for Node.js compatibility
async function executeEditly(config) {
  const configPath = path.join(__dirname, 'temp-config.json');
  
  try {
    // Try editly first
    try {
      return await executeEditlyWithConfig(config, configPath);
    } catch (editlyConfigError) {
      // If config approach fails, try command line
      try {
        return await executeEditlyCommandLine(config);
      } catch (editlyCommandError) {
        // If both editly approaches fail (likely due to Node.js version issues), 
        // fall back to FFmpeg direct approach
        // Editly failed, falling back to FFmpeg backend
        
        // Check if this looks like a Node.js module version error
        if (editlyCommandError.message.includes('NODE_MODULE_VERSION') || 
            editlyCommandError.message.includes('was compiled against a different Node.js version')) {
          
          // Try FFmpeg fallback
          const ffmpegCheck = await checkFFmpegCompatibility();
          if (ffmpegCheck.available) {
            // Determine which FFmpeg function to use based on config complexity
            if (hasComplexLayers(config)) {
              return await createVideoWithTextFFmpeg(config);
            } else {
              return await createSimpleVideoFFmpeg(config);
            }
          } else {
            throw new Error(`Both Editly and FFmpeg backends failed. Editly error: ${editlyCommandError.message}. FFmpeg error: ${ffmpegCheck.error}`);
          }
        } else {
          // Re-throw the original editly error if it's not a Node.js version issue
          throw editlyCommandError;
        }
      }
    }
  } catch (error) {
    // Clean up temp file on error
    await fs.unlink(configPath).catch(() => {});
    throw error;
  }
}

// Helper function to determine if config has complex layers requiring special handling
function hasComplexLayers(config) {
  if (!config.clips) return false;
  
  return config.clips.some(clip => 
    clip.layers && clip.layers.some(layer => 
      layer.type === 'title' || layer.type === 'subtitle' || layer.type === 'canvas'
    )
  );
}

// Execute editly with JSON config
async function executeEditlyWithConfig(config, configPath) {
  // Write config to temporary file
  await fs.writeFile(configPath, JSON.stringify(config, null, 2));
  
  return new Promise((resolve, reject) => {
    const spawnOptions = getSpawnOptions();
    const editlyProcess = spawn('editly', [configPath], spawnOptions);
    
    let stdout = '';
    let stderr = '';
    let resolved = false;
    
    // Set a timeout to prevent hanging
    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        editlyProcess.kill('SIGTERM');
        fs.unlink(configPath).catch(() => {});
        reject(new Error('Editly process timed out after 300 seconds'));
      }
    }, 300000); // 5 minutes timeout
    
    const cleanup = () => {
      if (timeout) clearTimeout(timeout);
      fs.unlink(configPath).catch(() => {});
    };
    
    editlyProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    editlyProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    editlyProcess.on('close', (code) => {
      if (!resolved) {
        resolved = true;
        cleanup();
        
        if (code === 0) {
          resolve({ success: true, output: stdout });
        } else {
          reject(new Error(`Editly config failed with code ${code}: ${stderr}`));
        }
      }
    });
    
    editlyProcess.on('error', (err) => {
      if (!resolved) {
        resolved = true;
        cleanup();
        reject(err);
      }
    });
  });
}

// Fallback to command line approach with proper title handling
async function executeEditlyCommandLine(config) {
  // Extract clips for command line
  const clips = [];
  
  for (const clip of config.clips) {
    // Handle intro/title-only clips
    if (clip.layers && clip.layers.find(l => l.type === 'title' && !clip.layers.find(v => v.type === 'video'))) {
      const titleLayer = clip.layers.find(l => l.type === 'title');
      clips.push(`title:${titleLayer.text}`);
      continue;
    }
    
    // Handle video clips with optional title overlays
    const videoLayer = clip.layers && clip.layers.find(l => l.type === 'video');
    if (videoLayer) {
      // Add title before video if there's a title layer
      const titleLayer = clip.layers.find(l => l.type === 'title');
      if (titleLayer) {
        clips.push(`title:${titleLayer.text}`);
      }
      clips.push(videoLayer.path);
    }
  }
  
  // Build command line arguments - use global editly installation
  const args = ['editly'];
  
  // Add clips with proper handling
  clips.forEach(clip => {
    args.push(clip);
  });
  
  // Add output and options
  args.push('--out', config.outPath);
  args.push('--width', config.width?.toString() || '1920');
  args.push('--height', config.height?.toString() || '1080');
  args.push('--fps', config.fps?.toString() || '30');
  args.push('--transition-name', 'fade');
  args.push('--transition-duration', '0.5');
  args.push('--clip-duration', '3');
  
  if (config.audioFilePath) {
    args.push('--audio-file-path', config.audioFilePath);
  }
  
  if (config.keepSourceAudio) {
    args.push('--keep-source-audio');
  }
  
  if (config.loopAudio) {
    args.push('--loop-audio');
  }
  
  // MCP Server executing editly command
  
  return new Promise((resolve, reject) => {
    const spawnOptions = { ...getSpawnOptions(), stdio: 'pipe' };
    const editlyProcess = spawn('editly', args.slice(1), spawnOptions);
    
    let stdout = '';
    let stderr = '';
    let resolved = false;
    
    // Set a timeout to prevent hanging
    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        editlyProcess.kill('SIGTERM');
        reject(new Error('Editly command line process timed out after 300 seconds'));
      }
    }, 300000); // 5 minutes timeout
    
    const cleanup = () => {
      if (timeout) clearTimeout(timeout);
    };
    
    editlyProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    editlyProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    editlyProcess.on('close', (code) => {
      if (!resolved) {
        resolved = true;
        cleanup();
        
        if (code === 0) {
          resolve({ success: true, output: stdout || 'MCP Server command line execution completed' });
        } else {
          reject(new Error(`MCP Server editly execution failed with code ${code}: ${stderr}`));
        }
      }
    });
    
    editlyProcess.on('error', (err) => {
      if (!resolved) {
        resolved = true;
        cleanup();
        reject(err);
      }
    });
  });
}

// Create server instance
const server = new Server(
  {
    name: 'editly-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Handle list tools request
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'create_video',
        description: 'Create a video using Editly with full control over clips, layers, transitions, and effects',
        inputSchema: zodToJsonSchema(CreateVideoSchema),
      },
      {
        name: 'create_simple_video',
        description: 'Create a simple video from a list of video/image files with optional transitions and audio',
        inputSchema: zodToJsonSchema(CreateSimpleVideoSchema),
      },
      {
        name: 'list_transitions',
        description: 'List all available transition effects in Editly',
        inputSchema: zodToJsonSchema(ListTransitionsSchema),
      },
      {
        name: 'list_fonts',
        description: 'List all available system fonts for text layers',
        inputSchema: zodToJsonSchema(ListFontsSchema),
      },
      {
        name: 'system_diagnostic',
        description: 'Run comprehensive system diagnostic to check compatibility and dependencies',
        inputSchema: zodToJsonSchema(z.object({})),
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'create_video': {
        const validatedArgs = CreateVideoSchema.parse(args);
        
        // Convert paths to absolute paths
        const absoluteOutputPath = path.resolve(validatedArgs.outputPath);
        
        // Build editly configuration
        const config = {
          outPath: absoluteOutputPath,
          width: validatedArgs.width,
          height: validatedArgs.height,
          fps: validatedArgs.fps,
          defaults: validatedArgs.defaults,
          audioFilePath: validatedArgs.audioFilePath ? 
            path.resolve(validatedArgs.audioFilePath) : undefined,
          clips: validatedArgs.clips.map(clip => ({
            ...clip,
            layers: clip.layers.map(layer => {
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
        
        // Add duration if specified
        if (validatedArgs.duration) {
          config.duration = validatedArgs.duration;
        }
        
        // Execute editly
        const result = await executeEditly(config);
        
        return {
          content: [
            {
              type: 'text',
              text: `Video created successfully at: ${absoluteOutputPath}`,
            },
          ],
        };
      }
      
      case 'list_transitions': {
        // List of available transitions in editly
        const transitions = [
          'directional-left',
          'directional-right', 
          'directional-up',
          'directional-down',
          'directional-up-left',
          'directional-up-right',
          'directional-down-left',
          'directional-down-right',
          'random',
          'dummy',
          'dissolve',
          'circleOpen',
          'circleClose',
          'horizontal-open',
          'horizontal-close',
          'vertical-open',
          'vertical-close',
          'fade',
          'fadegrayscale',
          'crosswarp',
          'dreamyzoom',
          'burn',
          'crosszoom',
          'simplezoom',
          'linearblur',
          'swirl',
          'angular',
          'radial',
          'windowslice',
          'directionalwarp',
          'wind',
          'ripple',
          'morph',
          'heart',
          'rotate',
          'rotateScale',
          'doorway',
          'pixelize',
          'glitchMemories',
          'glitchDisplace',
          'overexposure',
          'kanban',
          'cube',
          'undulating',
          'wipeLeft',
          'wipeRight',
          'wipeUp', 
          'wipeDown'
        ];
        
        return {
          content: [
            {
              type: 'text',
              text: `Available transitions:\n${transitions.join('\n')}`,
            },
          ],
        };
      }
      
      case 'list_fonts': {
        // This would normally list system fonts, but for now return common ones
        const fonts = [
          'Arial',
          'Arial Black',
          'Comic Sans MS',
          'Courier New',
          'Georgia',
          'Helvetica',
          'Impact',
          'Times New Roman',
          'Trebuchet MS',
          'Verdana',
          'Palatino',
          'Garamond',
          'Bookman',
          'Tahoma'
        ];
        
        return {
          content: [
            {
              type: 'text',
              text: `Common fonts (actual availability depends on system):\n${fonts.join('\n')}`,
            },
          ],
        };
      }
      
      case 'system_diagnostic': {
        const systemCheck = await checkSystemCompatibility();
        const installInstructions = getPlatformInstallInstructions();
        
        let diagnostic = [
          '🔍 System Diagnostic Report',
          '=' .repeat(40),
          '',
          `Platform: ${systemCheck.buildTools.platform}`,
          `FFmpeg: ${systemCheck.ffmpeg.available ? '✅ Available' : '❌ Missing'}`,
          `Editly: ${systemCheck.editly.available ? '✅ Available' : '❌ Missing'}`,
          `Overall Compatible: ${systemCheck.compatible ? '✅ Yes' : '❌ No'}`,
          ''
        ];
        
        if (systemCheck.errors.length > 0) {
          diagnostic.push('❌ Issues Found:');
          systemCheck.errors.forEach(error => {
            diagnostic.push(`   • ${error}`);
          });
          diagnostic.push('');
        }
        
        if (systemCheck.recommendations.length > 0) {
          diagnostic.push('📝 Recommendations:');
          systemCheck.recommendations.forEach(rec => {
            diagnostic.push(`   • ${rec}`);
          });
          diagnostic.push('');
        }
        
        diagnostic.push('📋 Platform-Specific Installation Guide:');
        diagnostic.push(installInstructions.title);
        diagnostic.push('-'.repeat(installInstructions.title.length));
        diagnostic.push(...installInstructions.steps);
        
        return {
          content: [
            {
              type: 'text',
              text: diagnostic.join('\n'),
            },
          ],
        };
      }
      
      case 'create_simple_video': {
        const validatedArgs = CreateSimpleVideoSchema.parse(args);
        
        // Convert simple format to full editly format
        const clips = validatedArgs.clips.map((clip, index) => {
          const isImage = /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(clip.path);
          const layers = [{
            type: isImage ? 'image' : 'video',
            path: path.resolve(clip.path),
            resizeMode: 'cover'
          }];
          
          const clipConfig = {
            duration: clip.duration || (isImage ? 3 : undefined),
            layers
          };
          
          // Add transition if specified and not the last clip
          if (clip.transition && index < validatedArgs.clips.length - 1) {
            clipConfig.transition = {
              name: clip.transition,
              duration: 0.5
            };
          }
          
          return clipConfig;
        });
        
        const config = {
          outPath: path.resolve(validatedArgs.outputPath),
          width: validatedArgs.width,
          height: validatedArgs.height,
          fps: validatedArgs.fps,
          clips
        };
        
        // Add audio if specified
        if (validatedArgs.audioPath) {
          config.audioFilePath = path.resolve(validatedArgs.audioPath);
          config.loopAudio = true;
        }
        
        // Execute editly
        const result = await executeEditly(config);
        
        return {
          content: [
            {
              type: 'text',
              text: `Simple video created successfully at: ${config.outPath}`,
            },
          ],
        };
      }
      
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    // Ensure we always return a detailed error message
    const errorMessage = error.message || error.toString() || 'Unknown error occurred';
    const errorStack = error.stack || 'No stack trace available';
    
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${errorMessage}\n\nStack trace:\n${errorStack}`,
        },
      ],
    };
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // Editly MCP server started - log to stderr to avoid interfering with JSON-RPC
  
  // Handle cleanup on exit
  process.on('SIGINT', () => process.exit(0));
  process.on('SIGTERM', () => process.exit(0));
}

main().catch(console.error);