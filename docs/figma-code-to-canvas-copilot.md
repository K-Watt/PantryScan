# Figma Code to Canvas — GitHub Copilot Setup

Capture your running web UI as editable Figma layers directly from GitHub Copilot in VS Code.

---

## Prerequisites

- VS Code with the **GitHub Copilot** extension installed
- A Figma account with a **Full seat** (edit access)
- VS Code **1.99 or later** (MCP support required)

---

## Setup Steps

### 1. Open VS Code MCP Configuration

Press `Cmd+Shift+P` and run one of:
- **MCP: Open User Configuration** — enables Figma across all projects
- **MCP: Open Workspace Folder MCP Configuration** — this project only

### 2. Add the Figma Remote Server

Paste the following into the config file that opens:

```json
{
  "inputs": [],
  "servers": {
    "figma": {
      "url": "https://mcp.figma.com/mcp",
      "type": "http"
    }
  }
}
```

Save the file.

### 3. Authenticate with Figma

- In the MCP panel, click **Start** next to the Figma server
- Click **Allow Access** when prompted
- Complete the OAuth login in the browser (uses your Figma account)

### 4. Verify the Connection

Press `Cmd+Shift+P` → **MCP: List Servers** and confirm Figma shows as connected.

---

## Capturing Your UI

1. Have your app running locally in a browser
2. Open GitHub Copilot Chat (`Cmd+Shift+I`)
3. Prompt Copilot, for example:

   > "Start a local server and capture the UI in a new Figma file"

   > "Capture the current UI to [paste Figma file URL here]"

   > "Capture the UI to my clipboard"

4. A browser toolbar appears — click **Entire screen** or **Select element**
5. The UI is sent to Figma as editable design layers (not a screenshot)

---

## Tips

- You can capture multiple screens or states in one session into the same file
- Use **Select element** to isolate individual components for closer inspection
- The result is fully editable in Figma — move, restyle, annotate, hand off to designers
