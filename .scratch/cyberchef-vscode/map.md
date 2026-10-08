## Destination

A complete technical architecture specification and implementation plan for "CyberChef for VS Code" — a high-performance sidebar workbench and editor transformer powered by a native TypeScript conversion engine, supporting single-op quick transforms, recipe pipelines, and seamless in-place editor selection replacement.

## Notes

- Domain: VS Code Extension API, Webview communication, binary/string encoding, cryptographic transforms, editor AST/selection manipulation.
- Consult: `grilling`, `domain-modeling`, `codebase-design`.
- Standing preferences: Native TypeScript implementations over bulky external bundles; binary-first `Uint8Array` payloads; clean declarative operation plugin architecture.

## Decisions so far
- [Operation Interface and Registry Contract](issues/01-operation-interface-and-registry.md): Declarative typed Operation interface with Uint8Array buffers, typed ArgDefinitions, and singleton OperationRegistry with keyword search.
- [Codec Library Selection and Packaging Footprint](issues/02-codec-library-selection.md): Zero external npm dependencies; use native Node.js Buffer, crypto, BigInt, and pure TypeScript algorithms (<200KB VSIX).

## Not yet specified

- **Magic Heuristics & Auto-Detection**: Evaluating entropy, character sets, and regex signatures to automatically detect encoding types (analogous to CyberChef's Magic operation).
- **Recipe Persistence & CyberChef Interop**: Designing schema for exporting/importing recipes as JSON and compatibility with web CyberChef recipe formats.
- **Large Buffer / Streaming Strategy**: Handling large files or multi-megabyte buffers without blocking the VS Code extension host or lagging the Webview.
- **User Custom Operations**: Allowing developers to register custom JavaScript/TypeScript transforms via workspace configuration or local scripts.

## Out of scope

- Bundling the complete 50MB+ GCHQ CyberChef repository/npm bundle into the extension VSIX package.
- Non-text/arbitrary file upload parsing outside of VS Code workspace / active editors (e.g. PCAP network packet dissection).
