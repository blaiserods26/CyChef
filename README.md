<p align="center">
  <img src="media/icon.png" width="140" height="140" alt="CyChef Logo" />
</p>

<h1 align="center">CyChef for VS Code</h1>

<p align="center">
  <strong>The Swiss Army Knife for Ciphers, Encodings, Hashes, and Token Inspections right inside VS Code.</strong>
</p>

<p align="center">
  <a href="https://marketplace.visualstudio.com/items?itemName=BlaiseRodrigues.cychef"><img src="https://img.shields.io/badge/VS_Code_Marketplace-v0.1.0-blue?logo=visual-studio-code" alt="Visual Studio Marketplace" /></a>
  <a href="https://open-vsx.org/extension/BlaiseRodrigues/cychef"><img src="https://img.shields.io/badge/Open_VSX-v0.1.0-purple?logo=eclipse-ide" alt="Open VSX" /></a>
  <img src="https://img.shields.io/badge/License-MIT-green.svg" alt="MIT License" />
  <img src="https://img.shields.io/badge/Dependencies-0_KB-brightgreen" alt="Zero Dependencies" />
</p>

---

## 📖 Overview

Why leave your editor and switch to a browser tab just to decode a JWT, inspect a base64 payload, or format hex bytes? 

**CyChef** brings the power, speed, and privacy of CyberChef directly into your VS Code environment. Whether you are debugging API tokens, analyzing binary dumps, reversing malware artifacts, or encoding configuration keys, CyChef gives you an instant interactive workbench in the primary sidebar and seamless in-place text replacement in your editor.

---

## ✨ Key Features

- 🧑‍🍳 **Integrated Sidebar Workbench**: Access the full conversion workbench from your VS Code Activity Bar without context switching.
- ✏️ **One-Click In-Place Editor Replacement**: Highlight any text in your editor, execute an operation or recipe, and replace it in-place with complete undo/redo stack (`Ctrl+Z`) support.
- ⚡ **Dual Execution Modes**:
  - **Quick Mode**: Instant single-operation conversion with real-time parameter tuning (keys, formats, delimiters).
  - **Recipe Mode**: Chain multiple sequential steps (`From Hex` ➔ `XOR` ➔ `To Base64`) with reordering, step enabling/disabling, and pipeline baking.
- 🔄 **Real-Time Editor Sync & Auto-Bake**:
  - Automatically loads your active text editor selection into the Input panel upon sidebar focus.
  - Live preview recalculates output instantaneously as you type or adjust parameters.
- 🔒 **100% Offline, Secure & Private**:
  - All operations execute locally inside the VS Code runtime.
  - Zero network calls. Your keys, tokens, and payloads never leave your computer.
- 🪶 **Zero External Runtime Dependencies**:
  - Built with pure TypeScript algorithms and native Node.js V8 C++ primitives (`Buffer`, `node:crypto`, `BigInt`).
  - Total extension bundle is **~60 KB** — lightweight, instant startup, and zero bloat.

---

## 🛠️ Supported Operations Catalogue

### 1. 🔤 Base Encodings
| Operation | Description | Parameters |
| :--- | :--- | :--- |
| **To / From Base64** | Standard RFC 4648 Base64 & URL-Safe variant | `URL Safe` toggle (`-` and `_`) |
| **To / From Base32** | RFC 4648 Base32 encoding & decoding | `Padding` toggle (`=`) |
| **To / From Base58** | Bitcoin Base58 alphabet with leading-zero preservation | — |
| **To / From Base85 (Ascii85)** | Adobe Ascii85 variant with `z` zero-run abbreviation | — |
| **To / From Base91** | BasE91 ASCII-armored binary encoding | — |

### 2. 🔢 Radix & Numerical Conversions
| Operation | Description | Parameters |
| :--- | :--- | :--- |
| **To / From Hex** | Converts between raw bytes/text and hexadecimal string | Delimiters: `None`, `Space`, `Colon`, `0x with comma` |
| **To / From Binary** | Formats bytes as 8-bit binary bitstreams | Delimiters: `Space`, `Comma`, `None` |
| **To / From Decimal** | Byte decimal representation (0–255) | Delimiters: `Space`, `Comma` |
| **To / From Octal** | 3-digit octal byte representation | Delimiters: `Space`, `Comma`, `None` |

### 3. 🔐 Ciphers & Bitwise Operations
| Operation | Description | Parameters |
| :--- | :--- | :--- |
| **ROT13** | Classic symmetric Caesar cipher rotating letters by 13 | Symmetric (Encode = Decode) |
| **ROT-N** | Parameterized Caesar shift by $N$ positions | `Shift Amount` (1 to 25) |
| **ROT47** | Rotates printable ASCII characters (ASCII 33–126) by 47 | Symmetric (Encode = Decode) |
| **XOR** | Repeating-key bitwise XOR cipher | `Key` (string) & `Key Format` (`UTF-8`, `Hex`, `Base64`, `Latin1`) |

### 4. 🌐 Web & Token Utilities
| Operation | Description | Output |
| :--- | :--- | :--- |
| **JWT Decode** | Inspects JSON Web Tokens (header, claims, signature) | Pretty-printed JSON + Auto-converted ISO timestamps for `exp`, `iat`, `nbf` |
| **URL Encode** | Percent-encodes special characters for URLs (`encodeURIComponent`) | Encoded URI string |
| **URL Decode** | Decodes percent-encoded URL characters (`decodeURIComponent`) | Decoded string |

### 5. 🛡️ Cryptographic Hashes
| Operation | Algorithm | Format Options |
| :--- | :--- | :--- |
| **MD5** | Fast OpenSSL MD5 checksum | `Hex` or `Base64` |
| **SHA-1** | NIST SHA-1 hash | `Hex` or `Base64` |
| **SHA-256** | SHA-2 256-bit cryptographic digest | `Hex` or `Base64` |
| **SHA-384** | SHA-2 384-bit cryptographic digest | `Hex` or `Base64` |
| **SHA-512** | SHA-2 512-bit cryptographic digest | `Hex` or `Base64` |

---

## 🚀 How to Use

### Workflow A: The Sidebar Workbench
1. Click the **Chef Hat Icon** in the VS Code Activity Bar (left sidebar) to open **CyChef Workbench**.
2. **Input**:
   - Type or paste text into the **Input** textarea, or click **Sync Selection** to grab whatever is currently highlighted in your active editor.
3. **Select Operation**:
   - Filter by category pills (`Bases`, `Radix`, `Ciphers`, `Hashing`, `Web`) or search (e.g. type `jwt`, `b64`, `hex`, `sha`).
   - Click an operation to select it. If the operation accepts parameters (like XOR key or Hex delimiter), adjust them in the **Parameters** box.
4. **Output & Actions**:
   - With **Auto-Bake** enabled, results appear instantly in the **Output** textarea.
   - Click **✏️ Replace in Editor** to immediately substitute the active selection in your open file with the result.
   - Click **Copy** to copy the output to your clipboard, or **Use as Input** to chain manual transformations.

```
+------------------------------------------+
|  CyChef                [Quick] [Recipe]  |
|------------------------------------------|
|  INPUT                 [Sync]   [Clear]  |
|  [ eyJhbGciOiJIUzI1NiIsIn...           ] |
|------------------------------------------|
|  OPERATIONS            [x] Auto-Bake     |
|  [Search operations...                 ] |
|  (All) (Bases) (Radix) (Ciphers) (Web)   |
|  * JWT Decode                            |
|  * To Base64                             |
|  * From Hex                              |
|------------------------------------------|
|  OUTPUT                [Use Input] [Copy]|
|  [ { "HEADER": { "alg": "HS256" } ...  ] |
|                                          |
|  [ Done (1ms) ]   [ ✏️ Replace in Editor ]|
+------------------------------------------+
```

---

### Workflow B: In-Place Editor Transformations (Zero Sidebar Needed)
1. Highlight any text in your editor (e.g., a Base64 string, Hex bytes, or JWT).
2. **Right-click** the selection ➔ Hover over **`CyChef`** in the context menu.
3. Select an operation (e.g., **`CyChef: From Base64`** or **`CyChef: From Hex`**).
4. The highlighted text is instantly converted and replaced in-place!
5. Hit `Ctrl+Z` (`Cmd+Z`) anytime if you want to undo the edit.

---

### Workflow C: Command Palette Quick Access
1. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on macOS).
2. Type `CyChef` to access all registered commands:
   - `CyChef: Open Sidebar Workbench`
   - `CyChef: Transform Selection...` (fuzzy search across all operations with interactive prompts for parameters)
   - `CyChef: To Base64` / `From Base64`
   - `CyChef: To Hex` / `From Hex`
   - `CyChef: To Binary` / `From Binary`
   - `CyChef: To Decimal` / `From Decimal`
   - `CyChef: ROT13` / `ROT-N`
   - `CyChef: XOR`
   - `CyChef: JWT Decode`
   - `CyChef: MD5 Hash` / `SHA-256 Hash`

---

### Workflow D: Chaining Multi-Step Recipes
1. In the CyChef sidebar, switch from **Quick** mode to **Recipe** mode at the top.
2. Click operations to append them as sequential steps (e.g., `From Hex` ➔ `XOR` ➔ `To Base64`).
3. Reorder steps with `▲` and `▼` or remove steps with `✕`.
4. Click **⚡ Bake Recipe** to execute the pipeline through all stages.

---

## ⌨️ Command Reference

| Command | Identifier | Description |
| :--- | :--- | :--- |
| **Open Workbench** | `cychef.openWorkbench` | Focuses the CyChef workbench in the activity bar |
| **Transform Selection...** | `cychef.transformSelection` | QuickPick menu of all operations with interactive argument prompts |
| **To Base64** | `cychef.toBase64` | Encodes editor selection to Base64 |
| **From Base64** | `cychef.fromBase64` | Decodes Base64 editor selection to raw string |
| **To Hex** | `cychef.toHex` | Encodes editor selection to Hex |
| **From Hex** | `cychef.fromHex` | Decodes Hex editor selection to raw string |
| **To Binary** | `cychef.toBinary` | Encodes editor selection to 8-bit binary |
| **From Binary** | `cychef.fromBinary` | Decodes binary string to bytes |
| **To Decimal** | `cychef.toDecimal` | Converts editor selection to decimal bytes |
| **From Decimal** | `cychef.fromDecimal` | Decodes decimal bytes to string |
| **ROT13** | `cychef.rot13` | Applies ROT13 substitution to editor selection |
| **ROT-N** | `cychef.rotN` | Prompts for shift amount and applies Caesar cipher |
| **XOR** | `cychef.xor` | Prompts for key and applies bitwise XOR |
| **JWT Decode** | `cychef.jwtDecode` | Formats and inspects JWT header, payload, and claims |
| **MD5 Hash** | `cychef.md5` | Computes MD5 hash of editor selection |
| **SHA-256 Hash** | `cychef.sha256` | Computes SHA-256 hash of editor selection |

---

## 📦 Installation

### From VS Code Marketplace
Search for **CyChef** in the VS Code Extensions tab (`Ctrl+Shift+X`) and click **Install**.

### From Open VSX
Search for **CyChef** in VSCodium, Cursor, Gitpod, or Eclipse Theia.

### From VSIX File
```powershell
code --install-extension "cychef-0.1.0.vsix"
```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
CyChef is an independent open-source VS Code extension inspired by GCHQ's CyberChef.
