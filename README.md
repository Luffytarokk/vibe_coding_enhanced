# Vibe Coding Enhanced

Enhance your Vibe Coding experience with a suite of powerful tools.

This toolkit provides original AIDL functionality, recording every AI decision detail. It makes AI behavior predictable and traceable.

## ❌ Without VCE

### Means no AIDL

LLMs make every decision on their own, without understanding your true intent.

- ❌ Unplanned, baseless decisions  
- ❌ Decision motives and reasons cannot be traced  
- ❌ Hallucinations lead to loss of context

## ✅ With VCE

AIDL enables LLMs to:  
- Make reasoned decisions and generate traceable decision logs.  
- Provide measurable success criteria, costs, pros and cons of implementation.  
- Make it easier to evaluate whether to adopt the strategy.

## Capabilities Provided by VCE

- **AIDL**: Agent Important Decision Log, recording detailed information about an agent’s important decisions.

## Usage

### Requirements

- Node.js >= v18.0.0  
- Cursor, Windsurf, Claude Desktop, or another MCP Client

[![Install MCP Server](https://cursor.com/deeplink/mcp-install-dark.svg)](https://cursor.com/en/install-mcp?name=Vibe%20Coding%20Enhanced&config=JTdCJTIyY29tbWFuZCUyMiUzQSUyMm5weCUyMHklMjB2aWJlX2NvZGluZ19lbmhhbmNlZCUyMiU3RA%3D%3D)

Due to the nature of VCE, you must install this MCP server locally. In most MCP clients, you can use the following configuration:

```json
{
  "mcpServers": {
    "Vibe Coding Enhanced": {
      "command": "npx",
      "args": ["-y", "vibe_coding_enhanced"]
    }
  }
}
```

Add it to your configuration as directed in your client’s documentation. If your client requires special configuration, please refer to the relevant documentation.

## Development

This project uses **pnpm** for development.

During development, you can start an MCP Inspector instance to help with debugging by running:

```bash
pnpm inspector
```

## Disclaimer

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR  
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,  
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE  
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER  
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,  
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE  
SOFTWARE.

## License

MIT
