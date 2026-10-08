# 04 - Workbench Webview Bidirectional Message Protocol

Type: grilling
Status: open
Blocked by: 01

## Question

What is the typed message protocol between the VS Code Extension Host and the sidebar Webview?
Specifically:
- How does the extension host push editor selection changes and active document updates to the Webview?
- How does the Webview request operation execution, single-op bake, recipe updates, or "Replace in Editor" actions back to the host?
- How are large payload strings/buffers transferred across `postMessage` boundaries without performance degradation?
