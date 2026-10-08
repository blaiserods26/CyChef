// Editor Transformer: Synchronizes active editor selection and handles in-place replacement
import * as vscode from 'vscode';
import { OperationRegistry } from '../core/registry.js';
import { ArgDefinition } from '../core/types.js';

export class EditorTransformer {
  private static instance: EditorTransformer;

  static getInstance(): EditorTransformer {
    if (!EditorTransformer.instance) {
      EditorTransformer.instance = new EditorTransformer();
    }
    return EditorTransformer.instance;
  }

  /**
   * Retrieves the currently selected text in the active text editor.
   * If there is no selection, returns the full document text (or empty string).
   */
  getActiveText(): { text: string; isSelection: boolean } {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return { text: '', isSelection: false };
    }

    const selection = editor.selection;
    if (!selection.isEmpty) {
      return {
        text: editor.document.getText(selection),
        isSelection: true
      };
    }

    return {
      text: editor.document.getText(),
      isSelection: false
    };
  }

  /**
   * Replaces the currently active selection(s) in the editor with the given text.
   * If there are multiple cursors/selections, replaces all selections or primary.
   */
  async replaceActiveSelection(newText: string): Promise<boolean> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showWarningMessage('No active editor open to replace text in.');
      return false;
    }

    const selections = editor.selections;
    const hasSelection = selections.some(s => !s.isEmpty);

    const success = await editor.edit(editBuilder => {
      if (hasSelection) {
        for (const sel of selections) {
          if (!sel.isEmpty) {
            editBuilder.replace(sel, newText);
          }
        }
      } else {
        // If no selection was made, replace the whole document
        const fullRange = new vscode.Range(
          editor.document.positionAt(0),
          editor.document.positionAt(editor.document.getText().length)
        );
        editBuilder.replace(fullRange, newText);
      }
    });

    if (success) {
      vscode.window.showInformationMessage('Successfully replaced in editor.');
    }
    return success;
  }

  /**
   * Directly transforms the active editor selection using an Operation.
   * If the operation requires arguments, prompts the user via VS Code native UI.
   */
  async transformSelection(opId: string, preArgs?: Record<string, any>): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showWarningMessage('Open an editor to transform text.');
      return;
    }

    const op = OperationRegistry.getInstance().get(opId);
    if (!op) {
      vscode.window.showErrorMessage(`CyChef operation "${opId}" not found.`);
      return;
    }

    const args: Record<string, any> = { ...preArgs };

    // Prompt for missing required arguments
    if (op.args && op.args.length > 0) {
      for (const argDef of op.args) {
        if (args[argDef.name] !== undefined) continue;

        const collected = await this.promptForArg(argDef);
        if (collected === undefined) {
          // User cancelled prompt
          return;
        }
        args[argDef.name] = collected;
      }
    }

    const selections = editor.selections;
    const hasSelection = selections.some(s => !s.isEmpty);
    const rangesToTransform = hasSelection
      ? selections.filter(s => !s.isEmpty)
      : [
          new vscode.Range(
            editor.document.positionAt(0),
            editor.document.positionAt(editor.document.getText().length)
          )
        ];

    const textEncoder = new TextEncoder();
    const textDecoder = new TextDecoder();

    try {
      // Pre-compute all replacements asynchronously before calling synchronous editor.edit
      const replacements: { range: vscode.Range; text: string }[] = [];
      for (const range of rangesToTransform) {
        const originalText = editor.document.getText(range);
        const inputBytes = textEncoder.encode(originalText);
        const outputBytes = await op.run(inputBytes, args);
        const transformedText = textDecoder.decode(outputBytes);
        replacements.push({ range, text: transformedText });
      }

      await editor.edit(editBuilder => {
        for (const { range, text } of replacements) {
          editBuilder.replace(range, text);
        }
      });
    } catch (err: any) {
      vscode.window.showErrorMessage(`Transform failed: ${err?.message || err}`);
    }
  }

  private async promptForArg(argDef: ArgDefinition): Promise<any> {
    if (argDef.type === 'choice' && argDef.options) {
      const pick = await vscode.window.showQuickPick(
        argDef.options.map(opt => ({
          label: opt.label,
          value: opt.value,
          description: opt.value === argDef.defaultValue ? '(Default)' : undefined
        })),
        {
          placeHolder: `Select ${argDef.label}`
        }
      );
      return pick ? pick.value : undefined;
    }

    if (argDef.type === 'boolean') {
      const pick = await vscode.window.showQuickPick(
        [
          { label: 'Yes', value: true },
          { label: 'No', value: false }
        ],
        { placeHolder: `${argDef.label}?` }
      );
      return pick ? pick.value : undefined;
    }

    const input = await vscode.window.showInputBox({
      prompt: `Enter ${argDef.label}`,
      value: String(argDef.defaultValue ?? ''),
      validateInput: val => {
        if (argDef.type === 'number') {
          const num = Number(val);
          if (isNaN(num)) return 'Must be a valid number';
          if (argDef.min !== undefined && num < argDef.min) return `Minimum is ${argDef.min}`;
          if (argDef.max !== undefined && num > argDef.max) return `Maximum is ${argDef.max}`;
        }
        return null;
      }
    });

    if (input === undefined) return undefined;
    return argDef.type === 'number' ? Number(input) : input;
  }
}
