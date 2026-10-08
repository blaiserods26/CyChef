// Core Types and Interfaces for CyberChef for VS Code

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
  options?: ArgChoiceOption[];
  min?: number;
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

export interface RecipeStep {
  opId: string;
  args: Record<string, any>;
  enabled: boolean;
}

export interface StepExecutionResult {
  opId: string;
  output: Uint8Array;
  durationMs: number;
  error?: string;
}

export interface RecipeExecutionResult {
  success: boolean;
  finalOutput: Uint8Array;
  stepResults: StepExecutionResult[];
  failedStepIndex?: number;
  error?: string;
}
