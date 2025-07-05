#!/usr/bin/env node

// This is an example script showing how to use the Editly MCP server
// It demonstrates creating videos with the sample cow videos and audio

const exampleConfigs = {
  // Simple video with all cow clips and intro audio
  simpleVideo: {
    tool: "create_simple_video",
    args: {
      outputPath: "./output/cow-compilation-simple.mp4",
      clips: [
        { path: "./cow/video/cow1-catching-milk.mp4", transition: "dissolve" },
        { path: "./cow/video/cow2-into-poop.mp4", transition: "fade" },
        { path: "./cow/video/cow3-neck-milk.mp4", transition: "circleOpen" },
        { path: "./cow/video/cow4-more-neck-milk.mp4", transition: "crosswarp" },
        { path: "./cow/video/cow5-behind-cow-milk.mp4", transition: "dreamyzoom" },
        { path: "./cow/video/cow6-cow-is-empty.mp4" }
      ],
      audioPath: "./cow/audio/intro.mp3",
      width: 1920,
      height: 1080,
      fps: 30
    }
  },

  // Advanced video with titles and transitions
  advancedVideo: {
    tool: "create_video",
    args: {
      outputPath: "./output/cow-compilation-advanced.mp4",
      width: 1920,
      height: 1080,
      fps: 30,
      audioFilePath: "./cow/audio/intro.mp3",
      loopAudio: true,
      keepSourceAudio: false,
      clipsAudioVolume: 0.3,
      outputVolume: 0.8,
      defaults: {
        transition: {
          name: "fade",
          duration: 0.5
        },
        layer: {
          fontFamily: "Arial",
          fontSize: 60,
          fontColor: "#FFFFFF"
        }
      },
      clips: [
        // Title screen
        {
          duration: 3,
          layers: [
            {
              type: "fill-color",
              color: "#000000"
            },
            {
              type: "title",
              text: "The Cow Milk Chronicles",
              position: "center",
              fontSize: 80,
              fontColor: "#FFFFFF"
            },
            {
              type: "subtitle",
              text: "A dairy adventure",
              fontSize: 40,
              fontColor: "#CCCCCC"
            }
          ],
          transition: { name: "circleOpen", duration: 1 }
        },
        // Clip 1 with title overlay
        {
          duration: 4,
          layers: [
            {
              type: "video",
              path: "./cow/video/cow1-catching-milk.mp4",
              resizeMode: "cover"
            },
            {
              type: "title",
              text: "Chapter 1: Catching the Milk",
              position: "bottom",
              fontSize: 40,
              fontColor: "#FFFFFF",
              bottom: 100
            }
          ],
          transition: { name: "dissolve", duration: 0.5 }
        },
        // Clip 2
        {
          duration: 4,
          layers: [
            {
              type: "video",
              path: "./cow/video/cow2-into-poop.mp4",
              resizeMode: "cover"
            },
            {
              type: "slide-in-text",
              text: "Oops!",
              fontSize: 60,
              fontColor: "#FF0000"
            }
          ],
          transition: { name: "crosswarp", duration: 0.5 }
        },
        // Clip 3
        {
          duration: 4,
          layers: [
            {
              type: "video",
              path: "./cow/video/cow3-neck-milk.mp4",
              resizeMode: "cover"
            }
          ],
          transition: { name: "dreamyzoom", duration: 0.7 }
        },
        // Clip 4
        {
          duration: 4,
          layers: [
            {
              type: "video",
              path: "./cow/video/cow4-more-neck-milk.mp4",
              resizeMode: "cover"
            }
          ],
          transition: { name: "burn", duration: 0.5 }
        },
        // Clip 5
        {
          duration: 4,
          layers: [
            {
              type: "video",
              path: "./cow/video/cow5-behind-cow-milk.mp4",
              resizeMode: "cover"
            }
          ],
          transition: { name: "simplezoom", duration: 0.5 }
        },
        // Clip 6 with ending text
        {
          duration: 5,
          layers: [
            {
              type: "video",
              path: "./cow/video/cow6-cow-is-empty.mp4",
              resizeMode: "cover"
            },
            {
              type: "news-title",
              text: "Breaking: Cow is now empty! No more milk available!",
              fontSize: 30,
              fontColor: "#FFFFFF",
              backgroundColor: "#FF0000",
              speed: 3
            }
          ],
          transition: { name: "fade", duration: 1 }
        },
        // End screen
        {
          duration: 3,
          layers: [
            {
              type: "fill-color",
              color: "#000000"
            },
            {
              type: "title",
              text: "The End",
              position: "center",
              fontSize: 100,
              fontColor: "#FFFFFF"
            }
          ]
        }
      ]
    }
  },

  // Video with picture-in-picture effect
  pipVideo: {
    tool: "create_video",
    args: {
      outputPath: "./output/cow-pip-demo.mp4",
      width: 1920,
      height: 1080,
      fps: 30,
      clips: [
        {
          duration: 6,
          layers: [
            // Main video
            {
              type: "video",
              path: "./cow/video/cow1-catching-milk.mp4",
              resizeMode: "cover"
            },
            // Picture-in-picture
            {
              type: "video",
              path: "./cow/video/cow2-into-poop.mp4",
              resizeMode: "contain",
              width: 480,
              height: 270,
              left: 1400,
              top: 50,
              mixVolume: 0
            }
          ]
        }
      ]
    }
  }
};

// Print example usage
console.log("Editly MCP Server Test Examples");
console.log("================================");
console.log("\nThese are example configurations for testing the Editly MCP server.");
console.log("\nTo use these examples with the MCP server:");
console.log("1. Make sure the MCP server is running");
console.log("2. Use your MCP client to call the tools with these configurations");
console.log("\nExample configurations:\n");

Object.entries(exampleConfigs).forEach(([name, config]) => {
  console.log(`\n${name}:`);
  console.log(`Tool: ${config.tool}`);
  console.log("Arguments:", JSON.stringify(config.args, null, 2));
});

console.log("\n\nNote: The actual video creation requires editly to be properly installed.");
console.log("If editly installation fails, you may need to install additional system dependencies.");
console.log("\nFor macOS, you might need:");
console.log("- Xcode Command Line Tools: xcode-select --install");
console.log("- Python setuptools: pip install setuptools");
console.log("\nThen try: npm install -g editly");