// Extension Activation Entry Point
import * as vscode from 'vscode';
import { OperationRegistry } from './core/registry.js';
import { EditorTransformer } from './editor/transformer.js';
import { WorkbenchViewProvider } from './webview/workbenchViewProvider.js';

export function activate(context: vscode.ExtensionContext) {
  // Initialize Registry
  const registry = OperationRegistry.getInstance();
  const transformer = EditorTransformer.getInstance();

  // Register Sidebar Webview Provider
  const provider = new WorkbenchViewProvider(context.extensionUri);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      WorkbenchViewProvider.viewType,
      provider,
      { webviewOptions: { retainContextWhenHidden: true } }
    )
  );

  // Focus Sidebar Command
  context.subscriptions.push(
    vscode.commands.registerCommand('cyberchef.openWorkbench', () => {
      vscode.commands.executeCommand('workbench.view.extension.cyberchef-sidebar');
    })
  );

  // General Interactive Transform Command
  context.subscriptions.push(
    vscode.commands.registerCommand('cyberchef.transformSelection', async () => {
      const ops = registry.getAll();
      const pick = await vscode.window.showQuickPick(
        ops.map(op => ({
          label: op.name,
          description: `[${op.category}] ${op.description}`,
          id: op.id
        })),
        { placeHolder: 'Select CyberChef Operation to apply to selection...' }
      );

      if (pick) {
        await transformer.transformSelection(pick.id);
      }
    })
  );

  // Dedicated In-Place Editor Commands
  const registerOpCommand = (commandId: string, opId: string, preArgs?: Record<string, any>) => {
    context.subscriptions.push(
      vscode.commands.registerCommand(commandId, async () => {
        await transformer.transformSelection(opId, preArgs);
      })
    );
  };

  registerOpCommand('cyberchef.toBase64', 'to-base64');
  registerOpCommand('cyberchef.fromBase64', 'from-base64');
  registerOpCommand('cyberchef.toHex', 'to-hex');
  registerOpCommand('cyberchef.fromHex', 'from-hex');
  registerOpCommand('cyberchef.toBinary', 'to-binary');
  registerOpCommand('cyberchef.fromBinary', 'from-binary');
  registerOpCommand('cyberchef.toDecimal', 'to-decimal');
  registerOpCommand('cyberchef.fromDecimal', 'from-decimal');
  registerOpCommand('cyberchef.rot13', 'rot13');
  registerOpCommand('cyberchef.rotN', 'rot-n');
  registerOpCommand('cyberchef.xor', 'xor');
  registerOpCommand('cyberchef.jwtDecode', 'jwt-decode');
  registerOpCommand('cyberchef.md5', 'md5');
  registerOpCommand('cyberchef.sha256', 'sha256');

  console.log('CyberChef for VS Code is now active.');
}

export function deactivate() {}
