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
    vscode.commands.registerCommand('cychef.openWorkbench', () => {
      vscode.commands.executeCommand('workbench.view.extension.cychef-sidebar');
    })
  );

  // General Interactive Transform Command
  context.subscriptions.push(
    vscode.commands.registerCommand('cychef.transformSelection', async () => {
      const ops = registry.getAll();
      const pick = await vscode.window.showQuickPick(
        ops.map(op => ({
          label: op.name,
          description: `[${op.category}] ${op.description}`,
          id: op.id
        })),
        { placeHolder: 'Select CyChef Operation to apply to selection...' }
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

  registerOpCommand('cychef.toBase64', 'to-base64');
  registerOpCommand('cychef.fromBase64', 'from-base64');
  registerOpCommand('cychef.toHex', 'to-hex');
  registerOpCommand('cychef.fromHex', 'from-hex');
  registerOpCommand('cychef.toBinary', 'to-binary');
  registerOpCommand('cychef.fromBinary', 'from-binary');
  registerOpCommand('cychef.toDecimal', 'to-decimal');
  registerOpCommand('cychef.fromDecimal', 'from-decimal');
  registerOpCommand('cychef.rot13', 'rot13');
  registerOpCommand('cychef.rotN', 'rot-n');
  registerOpCommand('cychef.xor', 'xor');
  registerOpCommand('cychef.jwtDecode', 'jwt-decode');
  registerOpCommand('cychef.md5', 'md5');
  registerOpCommand('cychef.sha256', 'sha256');

  console.log('CyChef is now active.');
}

export function deactivate() {}
