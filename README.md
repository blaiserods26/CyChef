# CyberChef for VS Code 🧑‍🍳

A fast, lightweight, and offline **CyberChef** workbench inside your VS Code sidebar with instant **in-place editor transforms**.

![CyberChef Sidebar](media/icon.svg)

---

## 🚀 Features

- **Integrated Sidebar Workbench**: Open the CyberChef workbench directly in the VS Code Activity Bar without switching to an external browser tab.
- **Dual Mode**:
  - **⚡ Quick Transform Mode**: One-click encode, decode, hash, or cipher with instant parameter controls.
  - **🧪 Recipe Mode**: Chain multiple operations sequentially (`From Hex` ➔ `XOR` ➔ `To Base64`) with reordering, toggles, and step-by-step preview.
- **✏️ In-Place Editor Replacement**:
  - Highlight any text in your editor, click **"Replace in Editor"** in the sidebar, and watch the text update instantly in your document with full undo/redo support.
  - Right-click text selection ➔ choose **CyberChef** ➔ apply common transforms directly.
- **Auto-Sync & Auto-Bake**:
  - Automatically loads your active editor's selection into the Input panel.
  - Live preview recalculates as you type or adjust parameters.
- **Zero External Runtime Dependencies**:
  - Powered by pure TypeScript algorithms and native Node.js V8 C++ bindings (`Buffer`, `node:crypto`, `BigInt`).
  - Total extension bundle is **~60 KB**, blazing fast with zero bloat.

---

## 🛠️ Supported Operations

### 1. Bases
- **To / From Base64**: Standard RFC 4648 Base64 & URL-safe (`-` and `_`) variant.
- **To / From Base32**: RFC 4648 Base32 with optional padding.
- **To / From Base58**: Bitcoin Base58 encoding with leading zero preservation.
- **To / From Base85 / Ascii85**: Adobe variant with `z` zero-run abbreviation.
- **To / From Base91**: BasE91 ASCII-armored binary encoding.

### 2. Radix Conversions
- **To / From Hex**: Delimiter options (`None`, `Space`, `Colon`, `0x with comma`).
- **To / From Binary**: 8-bit byte groups with custom delimiters.
- **To / From Decimal**: Byte decimal values (0–255).
- **To / From Octal**: 3-digit octal representations.

### 3. Ciphers & Bitwise
- **ROT13**: Classic symmetric Caesar rotation by 13.
- **ROT-N**: Parameterized Caesar shift by $N$ (1–25).
- **ROT47**: Printable ASCII rotation (ASCII 33–126).
- **XOR**: Repeating-key bitwise XOR with multi-format key support (`UTF-8`, `Hex`, `Base64`, `Latin1`).

### 4. Web & Tokens
- **JWT Decode**: Formatted inspector displaying Header, Payload, and auto-humanized ISO dates for `exp`, `iat`, and `nbf`.
- **URL Encode / Decode**: Standard URI component percent-encoding.

### 5. Hashes
- **MD5**: High-speed checksum via OpenSSL.
- **SHA-1, SHA-256, SHA-384, SHA-512**: Cryptographic secure hashes with Hex or Base64 output.

---

## ⌨️ Commands & Shortcuts

Access via **Command Palette** (`Ctrl+Shift+P` / `Cmd+Shift+P`):
- `CyberChef: Open Sidebar Workbench`
- `CyberChef: Transform Selection...` (fuzzy search across all operations)
- `CyberChef: To Base64` / `From Base64`
- `CyberChef: To Hex` / `From Hex`
- `CyberChef: JWT Decode`
- `CyberChef: ROT13`
- `CyberChef: MD5 Hash` / `SHA-256 Hash`
