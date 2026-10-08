# 01 - Operation Interface and Registry Contract

Type: grilling
Status: resolved
Blocked by:

## Question

What is the exact TypeScript interface contract for an `Operation`, its metadata, argument schemas (`ArgDefinition`), and the lifecycle of the central `OperationRegistry`?
Specifically:
- How are argument types (e.g. string key, numeric shift, dropdown format/encoding) typed and validated?
- How does the registry expose operations for quick lookups, categorization, and fuzzy search?

## Answer

### 1. `Operation` Interface Contract
```typescript
export type OperationCategory = 'Bases' | 'Radix' | 'Ciphers' | 'Hashing' | 'Web & Tokens';

export type ArgType = 'text' | 'number' | 'boolean' | 'choice';

export interface ArgChoiceOption {
  label: string;
  value: string | number;
}

export interface ArgDefinition<T = any> {
  name: string;
  label: string;
  description?: string;
  type: ArgType;
  defaultValue: T;
  options?: ArgChoiceOption[]; // for 'choice'
  min?: number;                // for 'number'
  max?: number;
  step?: number;
}

export interface OperationContext {
  signal?: AbortSignal;
}

export interface Operation<TArgs = Record<string, any>> {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly category: OperationCategory;
  readonly keywords: readonly string[];
  readonly args?: readonly ArgDefinition[];
  run(input: Uint8Array, args: TArgs, context?: OperationContext): Promise<Uint8Array> | Uint8Array;
}
```

### 2. `OperationRegistry` Contract
- Singleton lifecycle initialized at extension startup (`activate(context)`).
- Provides static indexing by ID, category, and keyword search:
```typescript
export class OperationRegistry {
  private static instance: OperationRegistry;
  private readonly operations = new Map<string, Operation>();

  static getInstance(): OperationRegistry {
    if (!OperationRegistry.instance) {
      OperationRegistry.instance = new OperationRegistry();
    }
    return OperationRegistry.instance;
  }

  register(op: Operation): void {
    if (this.operations.has(op.id)) {
      throw new Error(`Operation "${op.id}" is already registered`);
    }
    this.operations.set(op.id, op);
  }

  get(id: string): Operation | undefined {
    return this.operations.get(id);
  }

  getAll(): Operation[] {
    return Array.from(this.operations.values());
  }

  getByCategory(category: OperationCategory): Operation[] {
    return this.getAll().filter(op => op.category === category);
  }

  search(query: string): Operation[] {
    const q = query.trim().toLowerCase();
    if (!q) return this.getAll();
    return this.getAll().filter(op =>
      op.id.toLowerCase().includes(q) ||
      op.name.toLowerCase().includes(q) ||
      op.description.toLowerCase().includes(q) ||
      op.keywords.some(k => k.toLowerCase().includes(q))
    );
  }
}
```
