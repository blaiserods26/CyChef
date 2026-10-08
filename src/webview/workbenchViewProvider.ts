// Workbench Webview Provider for VS Code Sidebar
import * as vscode from 'vscode';
import { OperationRegistry } from '../core/registry.js';
import { executeRecipe, RecipeStep } from '../core/pipeline.js';
import { EditorTransformer } from '../editor/transformer.js';

export class WorkbenchViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'cyberchef.workbenchView';
  private _view?: vscode.WebviewView;

  constructor(private readonly _extensionUri: vscode.Uri) {}

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ): void {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri]
    };

    webviewView.webview.html = this.getHtmlForWebview(webviewView.webview);

    // Listen to messages from the Webview
    webviewView.webview.onDidReceiveMessage(async (message) => {
      switch (message.command) {
        case 'fetchSelection': {
          const selection = EditorTransformer.getInstance().getActiveText();
          this.sendMessage({
            command: 'updateInput',
            text: selection.text,
            isSelection: selection.isSelection
          });
          break;
        }

        case 'replaceInEditor': {
          await EditorTransformer.getInstance().replaceActiveSelection(message.text);
          break;
        }

        case 'executeSingleOp': {
          await this.handleSingleOpExecution(message.opId, message.input, message.args);
          break;
        }

        case 'executeRecipe': {
          await this.handleRecipeExecution(message.input, message.steps);
          break;
        }

        case 'getOperations': {
          this.sendMessage({ command: 'operationsLoaded', operations: this.getOperationsList() });
          break;
        }
      }
    });

    // Send operations and current editor selection on initial load
    setTimeout(() => {
      this.sendMessage({ command: 'operationsLoaded', operations: this.getOperationsList() });

      const active = EditorTransformer.getInstance().getActiveText();
      if (active.text && active.isSelection) {
        this.sendMessage({
          command: 'updateInput',
          text: active.text,
          isSelection: true
        });
      }
    }, 200);

    // Track active selection changes in the editor
    vscode.window.onDidChangeTextEditorSelection(e => {
      if (!this._view || !this._view.visible) return;
      const selText = e.textEditor.document.getText(e.selections[0]);
      if (selText) {
        this.sendMessage({
          command: 'editorSelectionPreview',
          text: selText
        });
      }
    });
  }

  private getOperationsList() {
    return OperationRegistry.getInstance().getAll().map(op => ({
      id: op.id,
      name: op.name,
      description: op.description,
      category: op.category,
      keywords: op.keywords,
      args: op.args
    }));
  }

  public sendMessage(message: any): void {
    this._view?.webview.postMessage(message);
  }

  private async handleSingleOpExecution(opId: string, inputStr: string, args: Record<string, any>): Promise<void> {
    const op = OperationRegistry.getInstance().get(opId);
    if (!op) {
      this.sendMessage({
        command: 'executionResult',
        success: false,
        error: `Unknown operation: ${opId}`
      });
      return;
    }

    const textEncoder = new TextEncoder();
    const textDecoder = new TextDecoder();
    const startTime = Date.now();

    try {
      const inputBytes = textEncoder.encode(inputStr);
      const outputBytes = await op.run(inputBytes, args || {});
      const outputStr = textDecoder.decode(outputBytes);
      const durationMs = Date.now() - startTime;

      this.sendMessage({
        command: 'executionResult',
        success: true,
        output: outputStr,
        durationMs
      });
    } catch (err: any) {
      this.sendMessage({
        command: 'executionResult',
        success: false,
        error: err?.message || String(err),
        durationMs: Date.now() - startTime
      });
    }
  }

  private async handleRecipeExecution(inputStr: string, steps: RecipeStep[]): Promise<void> {
    const textEncoder = new TextEncoder();
    const textDecoder = new TextDecoder();
    const startTime = Date.now();

    try {
      const inputBytes = textEncoder.encode(inputStr);
      const result = await executeRecipe(inputBytes, steps);
      const outputStr = textDecoder.decode(result.finalOutput);
      const durationMs = Date.now() - startTime;

      this.sendMessage({
        command: 'executionResult',
        success: result.success,
        output: outputStr,
        error: result.error,
        durationMs
      });
    } catch (err: any) {
      this.sendMessage({
        command: 'executionResult',
        success: false,
        error: err?.message || String(err),
        durationMs: Date.now() - startTime
      });
    }
  }

  private getHtmlForWebview(_webview: vscode.Webview): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CyberChef Workbench</title>
  <style>
    :root {
      --bg: var(--vscode-editor-background);
      --fg: var(--vscode-editor-foreground);
      --card-bg: var(--vscode-sideBar-background);
      --border: var(--vscode-panel-border, #3c3c3c);
      --btn-bg: var(--vscode-button-background);
      --btn-fg: var(--vscode-button-foreground);
      --btn-hover: var(--vscode-button-hoverBackground);
      --input-bg: var(--vscode-input-background);
      --input-fg: var(--vscode-input-foreground);
      --input-border: var(--vscode-input-border, #3c3c3c);
      --badge-bg: var(--vscode-badge-background);
      --badge-fg: var(--vscode-badge-foreground);
      --accent: var(--vscode-textLink-foreground, #4fc1ff);
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: var(--vscode-font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif);
      font-size: var(--vscode-font-size, 12px);
      color: var(--fg);
      background-color: var(--bg);
      padding: 8px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid var(--border);
      padding-bottom: 6px;
    }
    .header h2 { font-size: 13px; font-weight: 600; }
    .mode-switch {
      display: flex;
      gap: 4px;
      background: var(--input-bg);
      border-radius: 4px;
      padding: 2px;
    }
    .mode-btn {
      background: transparent;
      border: none;
      color: var(--fg);
      padding: 2px 8px;
      border-radius: 3px;
      cursor: pointer;
      font-size: 11px;
    }
    .mode-btn.active {
      background: var(--btn-bg);
      color: var(--btn-fg);
      font-weight: 600;
    }

    .pane-title {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 4px;
      font-weight: 600;
      font-size: 11px;
      color: var(--accent);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .pane-actions { display: flex; gap: 4px; }

    textarea {
      width: 100%;
      height: 90px;
      background: var(--input-bg);
      color: var(--input-fg);
      border: 1px solid var(--input-border);
      border-radius: 4px;
      padding: 6px;
      font-family: var(--vscode-editor-font-family, monospace);
      font-size: 11px;
      resize: vertical;
    }

    .btn {
      background: var(--btn-bg);
      color: var(--btn-fg);
      border: none;
      border-radius: 3px;
      padding: 4px 10px;
      cursor: pointer;
      font-size: 11px;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
    .btn:hover { background: var(--btn-hover); }
    .btn-secondary {
      background: var(--input-bg);
      color: var(--fg);
      border: 1px solid var(--input-border);
    }
    .btn-secondary:hover { background: var(--border); }
    .btn-sm { padding: 2px 6px; font-size: 10px; }

    .search-box {
      width: 100%;
      background: var(--input-bg);
      color: var(--input-fg);
      border: 1px solid var(--input-border);
      border-radius: 4px;
      padding: 5px;
      margin-bottom: 6px;
      font-size: 11px;
    }

    .category-pills {
      display: flex;
      flex-wrap: wrap;
      gap: 3px;
      margin-bottom: 6px;
    }
    .pill {
      background: var(--input-bg);
      border: 1px solid var(--input-border);
      border-radius: 10px;
      padding: 2px 7px;
      cursor: pointer;
      font-size: 10px;
      opacity: 0.8;
    }
    .pill.active {
      background: var(--btn-bg);
      color: var(--btn-fg);
      opacity: 1;
      border-color: var(--btn-bg);
    }

    .ops-grid {
      display: flex;
      flex-direction: column;
      gap: 4px;
      max-height: 180px;
      overflow-y: auto;
      border: 1px solid var(--border);
      border-radius: 4px;
      padding: 4px;
      background: var(--card-bg);
    }
    .op-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 5px 8px;
      border-radius: 3px;
      background: var(--input-bg);
      cursor: pointer;
      border: 1px solid transparent;
    }
    .op-item:hover { border-color: var(--accent); }
    .op-item.selected {
      background: var(--btn-bg);
      color: var(--btn-fg);
      font-weight: 600;
    }
    .op-meta { display: flex; flex-direction: column; gap: 1px; }
    .op-name { font-size: 11px; }
    .op-cat { font-size: 9px; opacity: 0.7; }

    .op-args-panel {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 4px;
      padding: 6px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      margin-top: 4px;
    }
    .arg-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 6px;
      font-size: 11px;
    }
    .arg-input {
      background: var(--input-bg);
      color: var(--input-fg);
      border: 1px solid var(--input-border);
      border-radius: 3px;
      padding: 3px 6px;
      font-size: 11px;
      flex: 1;
      max-width: 140px;
    }

    .output-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 6px;
      gap: 6px;
    }
    .status-badge {
      font-size: 10px;
      opacity: 0.8;
      display: flex;
      gap: 6px;
    }
    .error-msg {
      color: #f48771;
      font-size: 11px;
      margin-top: 4px;
      padding: 4px;
      background: rgba(244, 135, 113, 0.1);
      border-radius: 3px;
      border: 1px solid #f48771;
    }

    /* Recipe Builder Styles */
    .recipe-steps {
      display: flex;
      flex-direction: column;
      gap: 4px;
      max-height: 160px;
      overflow-y: auto;
      border: 1px solid var(--border);
      border-radius: 4px;
      padding: 4px;
      background: var(--card-bg);
    }
    .recipe-step-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 4px 6px;
      border-radius: 3px;
      background: var(--input-bg);
      border: 1px solid var(--input-border);
      font-size: 11px;
    }
    .step-actions { display: flex; gap: 2px; }
  </style>
</head>
<body>
  <div class="header">
    <h2>CyberChef</h2>
    <div class="mode-switch">
      <button id="mode-quick" class="mode-btn active" onclick="setMode('quick')">Quick</button>
      <button id="mode-recipe" class="mode-btn" onclick="setMode('recipe')">Recipe</button>
    </div>
  </div>

  <!-- Input Section -->
  <div>
    <div class="pane-title">
      <span>Input</span>
      <div class="pane-actions">
        <button class="btn btn-secondary btn-sm" onclick="fetchActiveSelection()">Sync Selection</button>
        <button class="btn btn-secondary btn-sm" onclick="clearInput()">Clear</button>
      </div>
    </div>
    <textarea id="input-text" placeholder="Type, paste, or highlight code in editor..." oninput="onInputChanged()"></textarea>
  </div>

  <!-- Operations Section -->
  <div id="ops-container">
    <div class="pane-title">
      <span id="ops-title">Operations</span>
      <div class="pane-actions">
        <label style="font-size: 10px; display: flex; align-items: center; gap: 3px; cursor: pointer;">
          <input type="checkbox" id="auto-bake" checked onchange="toggleAutoBake()"> Auto-Bake
        </label>
      </div>
    </div>

    <input type="text" id="search-input" class="search-box" placeholder="Search (e.g. b64, hex, jwt, rot, sha)..." oninput="filterOperations()">

    <div class="category-pills" id="category-pills">
      <span class="pill active" onclick="selectCategory('All')">All</span>
      <span class="pill" onclick="selectCategory('Bases')">Bases</span>
      <span class="pill" onclick="selectCategory('Radix')">Radix</span>
      <span class="pill" onclick="selectCategory('Ciphers')">Ciphers</span>
      <span class="pill" onclick="selectCategory('Hashing')">Hashing</span>
      <span class="pill" onclick="selectCategory('Web & Tokens')">Web</span>
    </div>

    <!-- Quick Mode View -->
    <div id="quick-mode-view">
      <div class="ops-grid" id="ops-grid"></div>
      <div id="op-args-panel" class="op-args-panel" style="display: none;"></div>
      <div style="margin-top: 6px; display: flex; gap: 4px;">
        <button class="btn" style="flex: 1;" onclick="bakeSingleOp()">⚡ Bake Operation</button>
      </div>
    </div>

    <!-- Recipe Mode View -->
    <div id="recipe-mode-view" style="display: none;">
      <div class="pane-title" style="margin-top: 4px;">Recipe Pipeline</div>
      <div class="recipe-steps" id="recipe-steps">
        <div style="font-size: 10px; opacity: 0.6; text-align: center; padding: 10px;">Select operations from above to build recipe</div>
      </div>
      <div style="margin-top: 6px; display: flex; gap: 4px;">
        <button class="btn" style="flex: 1;" onclick="bakeRecipe()">⚡ Bake Recipe</button>
        <button class="btn btn-secondary btn-sm" onclick="clearRecipe()">Clear Steps</button>
      </div>
    </div>
  </div>

  <!-- Output Section -->
  <div>
    <div class="pane-title">
      <span>Output</span>
      <div class="pane-actions">
        <button class="btn btn-secondary btn-sm" onclick="useAsInput()">Use as Input</button>
        <button class="btn btn-secondary btn-sm" onclick="copyOutput()">Copy</button>
      </div>
    </div>
    <textarea id="output-text" readonly placeholder="Output appears here..."></textarea>
    <div id="error-box" class="error-msg" style="display: none;"></div>

    <div class="output-footer">
      <div class="status-badge" id="status-badge">Ready</div>
      <button class="btn" onclick="replaceInEditor()" style="background: var(--accent); color: #000; font-weight: 600;">
        ✏️ Replace in Editor
      </button>
    </div>
  </div>

  <script>
    const vscode = acquireVsCodeApi();
    let allOperations = [];
    let selectedCategory = 'All';
    let selectedOpId = 'to-base64';
    let currentMode = 'quick';
    let currentArgs = {};
    let recipeSteps = [];
    let autoBakeEnabled = true;

    // Initialize
    window.addEventListener('message', event => {
      const msg = event.data;
      switch (msg.command) {
        case 'operationsLoaded':
          allOperations = msg.operations;
          renderOperations();
          selectOperation(selectedOpId);
          break;
        case 'updateInput':
          document.getElementById('input-text').value = msg.text;
          if (autoBakeEnabled) triggerBake();
          break;
        case 'editorSelectionPreview':
          // Auto-sync editor highlight if input was empty or user wishes
          if (!document.getElementById('input-text').value) {
            document.getElementById('input-text').value = msg.text;
            if (autoBakeEnabled) triggerBake();
          }
          break;
        case 'executionResult':
          handleResult(msg);
          break;
      }
    });

    vscode.postMessage({ command: 'getOperations' });

    function setMode(mode) {
      currentMode = mode;
      document.getElementById('mode-quick').classList.toggle('active', mode === 'quick');
      document.getElementById('mode-recipe').classList.toggle('active', mode === 'recipe');
      document.getElementById('quick-mode-view').style.display = mode === 'quick' ? 'block' : 'none';
      document.getElementById('recipe-mode-view').style.display = mode === 'recipe' ? 'block' : 'none';
      renderOperations();
    }

    function toggleAutoBake() {
      autoBakeEnabled = document.getElementById('auto-bake').checked;
      if (autoBakeEnabled) triggerBake();
    }

    function selectCategory(cat) {
      selectedCategory = cat;
      const pills = document.querySelectorAll('#category-pills .pill');
      pills.forEach(p => p.classList.toggle('active', p.textContent === cat || (cat === 'Web & Tokens' && p.textContent === 'Web')));
      renderOperations();
    }

    function filterOperations() {
      renderOperations();
    }

    function renderOperations() {
      const grid = document.getElementById('ops-grid');
      const query = document.getElementById('search-input').value.toLowerCase().trim();

      const filtered = allOperations.filter(op => {
        const matchCat = selectedCategory === 'All' || op.category === selectedCategory;
        const matchQuery = !query ||
          op.id.toLowerCase().includes(query) ||
          op.name.toLowerCase().includes(query) ||
          op.description.toLowerCase().includes(query) ||
          (op.keywords && op.keywords.some(k => k.toLowerCase().includes(query)));
        return matchCat && matchQuery;
      });

      grid.innerHTML = '';
      filtered.forEach(op => {
        const item = document.createElement('div');
        item.className = 'op-item' + (currentMode === 'quick' && op.id === selectedOpId ? ' selected' : '');
        item.innerHTML = \`
          <div class="op-meta">
            <span class="op-name">\${op.name}</span>
            <span class="op-cat">\${op.category}</span>
          </div>
          \${currentMode === 'recipe' ? '<button class="btn btn-secondary btn-sm">+ Add</button>' : ''}
        \`;

        item.onclick = (e) => {
          if (currentMode === 'quick') {
            selectOperation(op.id);
          } else {
            addToRecipe(op.id);
          }
        };
        grid.appendChild(item);
      });
    }

    function selectOperation(opId) {
      selectedOpId = opId;
      currentArgs = {};
      renderOperations();
      renderArgsPanel();
      if (autoBakeEnabled) triggerBake();
    }

    function renderArgsPanel() {
      const panel = document.getElementById('op-args-panel');
      const op = allOperations.find(o => o.id === selectedOpId);
      if (!op || !op.args || op.args.length === 0) {
        panel.style.display = 'none';
        return;
      }

      panel.style.display = 'flex';
      panel.innerHTML = '<div style="font-weight: 600; font-size: 10px; text-transform: uppercase;">Parameters</div>';

      op.args.forEach(arg => {
        const row = document.createElement('div');
        row.className = 'arg-row';

        const label = document.createElement('span');
        label.textContent = arg.label;
        row.appendChild(label);

        if (arg.type === 'choice') {
          const select = document.createElement('select');
          select.className = 'arg-input';
          (arg.options || []).forEach(opt => {
            const optElem = document.createElement('option');
            optElem.value = opt.value;
            optElem.textContent = opt.label;
            if (opt.value === arg.defaultValue) optElem.selected = true;
            select.appendChild(optElem);
          });
          currentArgs[arg.name] = select.value;
          select.onchange = () => {
            currentArgs[arg.name] = select.value;
            if (autoBakeEnabled) triggerBake();
          };
          row.appendChild(select);
        } else if (arg.type === 'boolean') {
          const checkbox = document.createElement('input');
          checkbox.type = 'checkbox';
          checkbox.checked = Boolean(arg.defaultValue);
          currentArgs[arg.name] = checkbox.checked;
          checkbox.onchange = () => {
            currentArgs[arg.name] = checkbox.checked;
            if (autoBakeEnabled) triggerBake();
          };
          row.appendChild(checkbox);
        } else {
          const input = document.createElement('input');
          input.type = arg.type === 'number' ? 'number' : 'text';
          input.className = 'arg-input';
          input.value = arg.defaultValue ?? '';
          if (arg.min !== undefined) input.min = arg.min;
          if (arg.max !== undefined) input.max = arg.max;
          currentArgs[arg.name] = input.value;
          input.oninput = () => {
            currentArgs[arg.name] = arg.type === 'number' ? Number(input.value) : input.value;
            if (autoBakeEnabled) triggerBake();
          };
          row.appendChild(input);
        }

        panel.appendChild(row);
      });
    }

    function addToRecipe(opId) {
      const op = allOperations.find(o => o.id === opId);
      if (!op) return;
      const defaultArgs = {};
      (op.args || []).forEach(a => defaultArgs[a.name] = a.defaultValue);
      recipeSteps.push({ opId, args: defaultArgs, enabled: true });
      renderRecipeSteps();
      if (autoBakeEnabled) triggerBake();
    }

    function renderRecipeSteps() {
      const container = document.getElementById('recipe-steps');
      if (recipeSteps.length === 0) {
        container.innerHTML = '<div style="font-size: 10px; opacity: 0.6; text-align: center; padding: 10px;">Select operations from above to build recipe</div>';
        return;
      }

      container.innerHTML = '';
      recipeSteps.forEach((step, index) => {
        const op = allOperations.find(o => o.id === step.opId);
        const item = document.createElement('div');
        item.className = 'recipe-step-item';
        item.innerHTML = \`
          <span style="font-weight: 500;">\${index + 1}. \${op?.name || step.opId}</span>
          <div class="step-actions">
            <button class="btn btn-secondary btn-sm" onclick="moveStep(\${index}, -1)" \${index === 0 ? 'disabled' : ''}>▲</button>
            <button class="btn btn-secondary btn-sm" onclick="moveStep(\${index}, 1)" \${index === recipeSteps.length - 1 ? 'disabled' : ''}>▼</button>
            <button class="btn btn-secondary btn-sm" onclick="removeStep(\${index})">✕</button>
          </div>
        \`;
        container.appendChild(item);
      });
    }

    function moveStep(idx, delta) {
      const newIdx = idx + delta;
      if (newIdx < 0 || newIdx >= recipeSteps.length) return;
      const temp = recipeSteps[idx];
      recipeSteps[idx] = recipeSteps[newIdx];
      recipeSteps[newIdx] = temp;
      renderRecipeSteps();
      if (autoBakeEnabled) triggerBake();
    }

    function removeStep(idx) {
      recipeSteps.splice(idx, 1);
      renderRecipeSteps();
      if (autoBakeEnabled) triggerBake();
    }

    function clearRecipe() {
      recipeSteps = [];
      renderRecipeSteps();
      if (autoBakeEnabled) triggerBake();
    }

    function onInputChanged() {
      if (autoBakeEnabled) triggerBake();
    }

    function triggerBake() {
      if (currentMode === 'quick') {
        bakeSingleOp();
      } else {
        bakeRecipe();
      }
    }

    function bakeSingleOp() {
      const input = document.getElementById('input-text').value;
      vscode.postMessage({
        command: 'executeSingleOp',
        opId: selectedOpId,
        input,
        args: currentArgs
      });
    }

    function bakeRecipe() {
      const input = document.getElementById('input-text').value;
      vscode.postMessage({
        command: 'executeRecipe',
        input,
        steps: recipeSteps
      });
    }

    function handleResult(msg) {
      const outputElem = document.getElementById('output-text');
      const errorBox = document.getElementById('error-box');
      const badge = document.getElementById('status-badge');

      if (msg.success) {
        outputElem.value = msg.output;
        errorBox.style.display = 'none';
        badge.textContent = \`Done (\${msg.durationMs}ms) • \${msg.output.length} chars\`;
      } else {
        errorBox.textContent = msg.error || 'Execution failed';
        errorBox.style.display = 'block';
        badge.textContent = 'Error';
      }
    }

    function fetchActiveSelection() {
      vscode.postMessage({ command: 'fetchSelection' });
    }

    function clearInput() {
      document.getElementById('input-text').value = '';
      document.getElementById('output-text').value = '';
      document.getElementById('error-box').style.display = 'none';
      document.getElementById('status-badge').textContent = 'Cleared';
    }

    function useAsInput() {
      const out = document.getElementById('output-text').value;
      document.getElementById('input-text').value = out;
      triggerBake();
    }

    function copyOutput() {
      const out = document.getElementById('output-text').value;
      navigator.clipboard.writeText(out);
      const badge = document.getElementById('status-badge');
      badge.textContent = 'Copied to clipboard!';
      setTimeout(() => badge.textContent = 'Ready', 1500);
    }

    function replaceInEditor() {
      const out = document.getElementById('output-text').value;
      if (!out) return;
      vscode.postMessage({
        command: 'replaceInEditor',
        text: out
      });
    }
  </script>
</body>
</html>`;
  }
}
