# CyberChef for VS Code

A VS Code extension providing an integrated sidebar workbench and editor commands for data encoding, decoding, hashing, and cryptographic transforms inspired by CyberChef.

## Language

**Operation**:
A self-contained transformation module with metadata, argument definitions, and an execution function that transforms input bytes into output bytes.
_Avoid_: Transform, filter, tool, converter, function

**Recipe**:
An ordered sequence of configured Operations executed sequentially where the output of each step serves as input to the next.
_Avoid_: Pipeline, flow, chain, macro

**Payload**:
The raw byte buffer (`Uint8Array`) passed between Operations, accompanied by presentation hints for display in the Workbench.
_Avoid_: Buffer, blob, data, message, string

**Workbench**:
The interactive Webview rendered inside the VS Code sidebar containing Input, Recipe/Operation configuration, and Output panes.
_Avoid_: Sidebar, panel, dashboard, UI

**Editor Transformer**:
The subsystem handling reading the active editor's selection and replacing it with transformed output in-place.
_Avoid_: Text replacer, editor sync, selection modifier
