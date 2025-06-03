# Mermaid Renderer Plugin for Obsidian

A plugin that renders Mermaid.js diagrams from `mermaidjs` code blocks in Obsidian.

## Features

- 🎨 Renders beautiful Mermaid diagrams directly in your notes
- 🌙 Automatic dark/light theme support
- 📱 Responsive design that works on all devices
- ⚡ Fast rendering with bundled Mermaid library
- 🎯 Custom `mermaidjs` code block support
- 🛠️ Comprehensive error handling with helpful messages

## Installation

### From Obsidian Community Plugins (Recommended)
1. Open Obsidian Settings
2. Go to Community Plugins and disable Safe Mode
3. Click Browse and search for "Mermaid Renderer"
4. Install and enable the plugin

### Manual Installation
1. Download the latest release from GitHub
2. Extract the files to `YourVault/.obsidian/plugins/custom-mermaid/`
3. Enable the plugin in Obsidian settings

## Usage

Create Mermaid diagrams using the `mermaidjs` code block:

````markdown
```mermaidjs
graph TD
    A[Start] --> B{Is it working?}
    B -->|Yes| C[Great!]
    B -->|No| D[Check syntax]
    D --> A
    C --> E[End]
```
````

### Supported Diagram Types

- **Flowcharts**: `graph TD`, `graph LR`, etc.
- **Sequence Diagrams**: `sequenceDiagram`
- **Class Diagrams**: `classDiagram`
- **State Diagrams**: `stateDiagram-v2`
- **Entity Relationship**: `erDiagram`
- **User Journey**: `journey`
- **Gantt Charts**: `gantt`
- **Pie Charts**: `pie`
- **Git Graphs**: `gitgraph`

### Examples

#### Flowchart
````markdown
```mermaidjs
graph LR
    A[Hard edge] -->|Link text| B(Round edge)
    B --> C{Decision}
    C -->|One| D[Result one]
    C -->|Two| E[Result two]
```
````

#### Sequence Diagram
````markdown
```mermaidjs
sequenceDiagram
    participant Alice
    participant Bob
    Alice->>John: Hello John, how are you?
    loop Healthcheck
        John->>John: Fight against hypochondria
    end
    Note right of John: Rational thoughts!
    John-->>Alice: Great!
    John->>Bob: How about you?
    Bob-->>John: Jolly good!
```
````

## Configuration

The plugin automatically adapts to your Obsidian theme and uses:
- **Light theme**: Default Mermaid theme
- **Dark theme**: Dark Mermaid theme
- **Font**: Uses your Obsidian interface font
- **Responsive**: Automatically scales to fit container

## Troubleshooting

### Diagram Not Rendering
- Check that your Mermaid syntax is correct
- Ensure the code block uses `mermaidjs` (not `mermaid`)
- Look for error messages in the rendered output

### Common Syntax Issues
- Missing quotes around labels with spaces
- Incorrect arrow syntax (`-->` vs `->`)
- Invalid diagram type declaration

### Getting Help
1. Check the [Mermaid documentation](https://mermaid.js.org/) for syntax help
2. Open an issue on this plugin's GitHub repository
3. Join the Obsidian Discord community

## Development

### Building from Source
```bash
# Clone the repository
git clone https://github.com/yourusername/obsidian-custom-mermaid

# Install dependencies
npm install

# Build the plugin
npm run build

# For development with auto-reload
npm run dev
```

### Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This plugin is licensed under the MIT License. See [LICENSE](LICENSE) for details.

## Acknowledgments

- Built with [Mermaid.js](https://mermaid.js.org/)
- Inspired by the Obsidian community
- Thanks to all contributors and users

## Changelog

### 1.0.0
- Initial release
- Support for all major Mermaid diagram types
- Dark/light theme integration
- Responsive design
- Error handling and validation
