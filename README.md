# Editly MCP Server

> ⚠️ **BETA SOFTWARE - UNDER ACTIVE DEVELOPMENT** ⚠️
> 
> This package is currently in **BETA** and under active development. While functional, you may encounter:
> - Installation challenges on some systems
> - Compatibility issues with certain video formats
> - Breaking changes in future releases
> - Limited testing across all platform combinations
> 
> **Use in production at your own risk.** We recommend testing thoroughly in your environment before deploying.
> 
> 🐛 **Found an issue?** Please report it on [GitHub Issues](https://github.com/moeloubani/editly-mcp/issues)

A comprehensive [Model Context Protocol (MCP)](https://docs.anthropic.com/en/docs/build-with-claude/mcp) server that provides video editing capabilities using the powerful [Editly](https://github.com/mifi/editly) library. Create professional videos with transitions, text overlays, audio mixing, and complex layer compositions through simple MCP tool calls.

## 🎬 Features

- **Complete Video Creation**: Full control over clips, layers, transitions, and effects
- **Simple Video Compilation**: Quick video creation from file lists
- **Rich Text Overlays**: Titles, subtitles, news tickers, and animated text
- **Audio Control**: Background music, volume mixing, audio normalization
- **Advanced Transitions**: 40+ transition effects between clips
- **Multiple Layer Types**: Video, image, text, shapes, and canvas elements
- **Automatic Dependency Handling**: Python virtual environment setup
- **Robust Fallback System**: Graceful degradation for compatibility

## 🚀 Quick Start

### Automatic Installation (Recommended)

Choose your platform and run the automated installer:

**Windows:**
```cmd
# Download and run the installer
curl -O https://raw.githubusercontent.com/moeloubani/editly-mcp/main/install-windows.bat
install-windows.bat
```

**macOS/Linux:**
```bash
# Download and run the installer
curl -O https://raw.githubusercontent.com/moeloubani/editly-mcp/main/install-unix.sh
chmod +x install-unix.sh
./install-unix.sh
```

### Manual Installation

If you prefer manual installation or need more control:

```bash
npm install -g editly-mcp
```

### Prerequisites

- **Node.js 14+** (16+ recommended for best compatibility)
- **FFmpeg** installed and available in PATH
- **Python 3.8+** (automatically configured during installation)
- **Platform-specific build tools** (see detailed requirements below)

## 📋 Platform-Specific Setup

### Windows Requirements

**Essential Components:**
- **Visual Studio Build Tools 2022** (or Visual Studio Community)
  - Download: https://visualstudio.microsoft.com/downloads/
  - Include: "C++ build tools" and "Windows 10/11 SDK"
- **Python 3.8+** with "Add Python to PATH" enabled
  - Download: https://python.org/downloads/
- **FFmpeg** - Multiple installation options:
  - **Chocolatey**: `choco install ffmpeg`
  - **winget**: `winget install --id=Gyan.FFmpeg`
  - **Manual**: Download from https://ffmpeg.org/download.html

**Quick Windows Setup:**
```cmd
# Run as Administrator
npm run install-windows
```

### macOS Requirements

**Essential Components:**
- **Xcode Command Line Tools**: `xcode-select --install`
- **Homebrew** (recommended): https://brew.sh/
- **Dependencies**: `brew install python3 ffmpeg node`

**Apple Silicon Notes:**
- Ensure you're using native Node.js for Apple Silicon
- Check with: `node -p "process.arch"` (should show "arm64")
- Use Homebrew for Apple Silicon: `/opt/homebrew/bin/brew`

**Quick macOS Setup:**
```bash
# Install Xcode Command Line Tools
xcode-select --install

# Install via Homebrew
brew install python3 ffmpeg node

# Install editly-mcp
npm install -g editly-mcp
```

### Linux Requirements

**Ubuntu/Debian:**
```bash
# Install build tools and libraries
sudo apt-get update
sudo apt-get install -y build-essential pkg-config python3-dev python3-pip
sudo apt-get install -y libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev
sudo apt-get install -y ffmpeg nodejs npm

# Install editly-mcp
npm install -g editly-mcp
```

**CentOS/RHEL/Fedora:**
```bash
# Install build tools and libraries
sudo dnf install -y gcc gcc-c++ make pkg-config python3-devel python3-pip
sudo dnf install -y cairo-devel pango-devel libjpeg-turbo-devel giflib-devel librsvg2-devel
sudo dnf install -y ffmpeg nodejs npm

# Install editly-mcp
npm install -g editly-mcp
```

**Arch Linux:**
```bash
# Install dependencies
sudo pacman -S --needed base-devel python cairo pango libjpeg-turbo giflib librsvg ffmpeg nodejs npm

# Install editly-mcp
npm install -g editly-mcp
```

## 🛠️ Installation Troubleshooting

### System Diagnostic

Run the built-in diagnostic tool to check your system:

```bash
# After installation
npm run diagnose

# Or for detailed help
npx editly-mcp system_diagnostic
```

### Common Issues

**"FFmpeg not found"**
- **Windows**: Ensure FFmpeg is in your PATH or use `choco install ffmpeg`
- **macOS**: Install via Homebrew: `brew install ffmpeg`
- **Linux**: Install via package manager: `sudo apt-get install ffmpeg`

**"Python not found" or "distutils missing"**
- **Windows**: Reinstall Python with "Add to PATH" checked
- **macOS**: Install Python 3: `brew install python3`
- **Linux**: Install Python dev packages: `sudo apt-get install python3-dev python3-pip`

**"Build tools not found"**
- **Windows**: Install Visual Studio Build Tools
- **macOS**: Install Xcode Command Line Tools: `xcode-select --install`
- **Linux**: Install build-essential: `sudo apt-get install build-essential`

**"Cairo/Canvas compilation failed"**
- **Windows**: Ensure Visual Studio Build Tools are properly installed
- **macOS**: Install Xcode Command Line Tools
- **Linux**: Install Cairo development libraries: `sudo apt-get install libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev`

### Alternative Installation Methods

**If global installation fails:**
```bash
# Try with unsafe-perm flag
npm install -g editly-mcp --unsafe-perm

# Or install locally
npm install editly-mcp
npx editly-mcp
```

**Docker Installation (Advanced):**
```bash
# Build Docker image with all dependencies
docker build -t editly-mcp .
docker run -it editly-mcp
```

## 🔧 MCP Configuration

Add to your MCP client configuration:

```json
{
  "mcpServers": {
    "editly": {
      "command": "editly-mcp"
    }
  }
}
```

### Claude Desktop Configuration

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "editly": {
      "command": "editly-mcp"
    }
  }
}
```

## 🛠️ Available Tools

### `create_video`

Create videos with full control over every aspect:

```javascript
{
  "outputPath": "./output/my-video.mp4",
  "width": 1920,
  "height": 1080,
  "fps": 30,
  "audioFilePath": "./audio/background.mp3",
  "keepSourceAudio": true,
  "clips": [
    {
      "duration": 3,
      "layers": [
        {
          "type": "fill-color",
          "color": "#2c3e50"
        },
        {
          "type": "title",
          "text": "My Amazing Video",
          "position": "center",
          "fontSize": 80,
          "fontColor": "#FFFFFF"
        }
      ],
      "transition": {
        "name": "fade",
        "duration": 1
      }
    },
    {
      "duration": 5,
      "layers": [
        {
          "type": "video",
          "path": "./videos/clip1.mp4",
          "resizeMode": "cover"
        },
        {
          "type": "title",
          "text": "Amazing Scene",
          "position": "bottom",
          "fontSize": 48,
          "fontColor": "#FFFFFF"
        }
      ]
    }
  ]
}
```

### `create_simple_video`

Quick video compilation from a list of files:

```javascript
{
  "outputPath": "./output/compilation.mp4",
  "clips": [
    { "path": "./video1.mp4", "duration": 3 },
    { "path": "./video2.mp4", "duration": 4 },
    { "path": "./image1.jpg", "duration": 2 }
  ],
  "audioPath": "./background.mp3",
  "width": 1920,
  "height": 1080
}
```

### `list_transitions`

Get all available transition effects:
- `fade`, `dissolve`, `circleOpen`, `crosswarp`, `dreamyzoom`
- `burn`, `simplezoom`, `linearblur`, `swirl`, `directional-*`
- And 30+ more creative transitions

### `list_fonts`

Get available system fonts for text overlays.

### `system_diagnostic`

Run comprehensive system diagnostic to check compatibility and dependencies:

```javascript
// No parameters required
{}
```

This tool provides:
- Platform detection and compatibility status
- FFmpeg and Editly availability checks
- Build tools and Python environment status
- Platform-specific installation recommendations
- Detailed troubleshooting guidance

## 🎨 Layer Types

### Video Layers
```javascript
{
  "type": "video",
  "path": "./video.mp4",
  "resizeMode": "cover", // "contain", "cover", "stretch"
  "cutFrom": 10,         // Start time in seconds
  "cutTo": 20,          // End time in seconds
  "mixVolume": 0.8      // Audio volume (0-1)
}
```

### Image Layers
```javascript
{
  "type": "image", 
  "path": "./image.jpg",
  "resizeMode": "cover",
  "zoomDirection": "in", // "in", "out", null
  "zoomAmount": 0.1
}
```

### Text Layers
```javascript
{
  "type": "title",
  "text": "My Title",
  "position": "center",    // "center", "top", "bottom", etc.
  "fontSize": 48,
  "fontColor": "#FFFFFF",
  "fontFamily": "Arial"
}
```

### Special Layers
- `subtitle` - Bottom-aligned subtitles
- `news-title` - Scrolling news ticker
- `slide-in-text` - Animated text entry
- `fill-color` - Solid color backgrounds
- `canvas` - Custom drawing functions

## 🎵 Audio Features

- **Background Music**: Add audio files with volume control
- **Source Audio**: Keep or remove original video audio
- **Audio Mixing**: Control volume levels for different sources
- **Audio Normalization**: Automatic level adjustment
- **Loop Control**: Loop background audio to match video length

## ⚡ Transitions

Over 40 transition effects available:

**Basic**: `fade`, `dissolve`, `directional-left/right/up/down`

**Creative**: `dreamyzoom`, `burn`, `crosswarp`, `morph`

**Geometric**: `circleOpen`, `circleClose`, `cube`, `rotate`

**Effects**: `glitchMemories`, `pixelize`, `overexposure`

## 🧪 Testing & Verification

### Quick Test

After installation, verify everything works:

```bash
# Run system diagnostic
npm run diagnose

# Test basic MCP functionality
npm test

# Test all MCP tools
npm run test-all
```

### Manual MCP Testing

Test individual tools through the MCP interface:

```bash
# Run the MCP server
npx editly-mcp

# In another terminal, test system diagnostic
echo '{"method": "tools/call", "params": {"name": "system_diagnostic", "arguments": {}}}' | npx editly-mcp
```

## 🔧 Advanced Troubleshooting

### Environment Variables

Control behavior with environment variables:

```bash
# Skip postinstall checks in CI environments
export SKIP_EDITLY_POSTINSTALL=true

# Force specific Python version
export PYTHON=/usr/bin/python3.9

# Debug mode for detailed logging
export DEBUG=editly-mcp:*
```

### Manual Dependency Resolution

If automatic setup fails:

```bash
# Manual Python virtual environment setup
python3 -m venv .venv
source .venv/bin/activate  # or .venv\Scripts\activate on Windows
pip install setuptools wheel

# Manual native dependency installation
npm rebuild

# Clear npm cache
npm cache clean --force
```

### Performance Optimization

For better performance on resource-constrained systems:

```javascript
// Use lower resolution and frame rate
{
  "width": 1280,
  "height": 720,
  "fps": 24
}

// Reduce transition complexity
{
  "transition": {
    "name": "fade",  // Use simple transitions
    "duration": 0.5
  }
}
```

### Logging and Debug Information

Enable detailed logging:

```bash
# Enable MCP server debug output
DEBUG=* npx editly-mcp

# Save diagnostic output
npm run diagnose > system-diagnostic.txt
```

## 🔄 Cross-Platform Compatibility

This package is designed to work equally well across platforms:

### Compatibility Matrix

| Platform | Node.js | FFmpeg | Build Tools | Status |
|----------|---------|--------|-------------|--------|
| macOS (Intel) | ✅ | ✅ | ✅ | Fully Supported |
| macOS (Apple Silicon) | ✅ | ✅ | ✅ | Fully Supported |
| Ubuntu/Debian | ✅ | ✅ | ✅ | Fully Supported |
| CentOS/RHEL/Fedora | ✅ | ✅ | ✅ | Fully Supported |
| Arch Linux | ✅ | ✅ | ✅ | Fully Supported |
| Windows 10/11 | ✅ | ⚠️ | ⚠️ | Supported with Setup |

### Platform-Specific Notes

**Windows:**
- Requires Visual Studio Build Tools for native compilation
- FFmpeg needs manual PATH configuration in some cases
- Use automated installer: `npm run install-windows`

**macOS:**
- Apple Silicon requires native Node.js build
- Uses compatibility fork of Editly for OpenGL issues
- Homebrew installation recommended

**Linux:**
- Requires Cairo development libraries
- Distribution-specific package names may vary
- Most reliable platform for automated installation

## 🏗️ Architecture

The MCP server uses a robust dual-strategy approach:

1. **Primary**: JSON configuration for complex video projects
2. **Fallback**: Command-line interface for guaranteed compatibility

This ensures that video creation always succeeds, even when complex features encounter compatibility issues.

## 📁 Project Structure

```
editly-mcp/
├── index.js          # Main MCP server
├── setup-venv.js     # Python environment setup
├── package.json      # Package configuration
├── README.md         # This file
├── LICENSE           # MIT license
└── .npmrc           # NPM configuration
```

## 🔌 Integration Examples

### Claude Desktop

Create a video compilation:
> "Create a video compilation from these clips with fade transitions and background music"

### API Integration

```javascript
// MCP client call
const result = await mcpClient.call('create_video', {
  outputPath: './my-video.mp4',
  clips: [...],
  audioFilePath: './music.mp3'
});
```

## 🤝 Contributing

Contributions welcome! Please read the contributing guidelines and submit pull requests to the GitHub repository.

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Editly](https://github.com/mifi/editly) - The powerful video editing library
- [Sailplan Editly Fork](https://github.com/sailplan/editly) - macOS compatibility fixes
- [Model Context Protocol](https://docs.anthropic.com/en/docs/build-with-claude/mcp) - AI integration framework

---

**Made with ❤️ by [Moe Loubani](https://github.com/moeloubani)**