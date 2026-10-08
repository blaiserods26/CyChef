// Recipe Pipeline Execution Engine
import { OperationRegistry } from './registry.js';
import {
  RecipeStep,
  RecipeExecutionResult,
  StepExecutionResult,
  OperationContext
} from './types.js';

export { RecipeStep, RecipeExecutionResult, StepExecutionResult };

export async function executeRecipe(
  input: Uint8Array,
  steps: RecipeStep[],
  context?: OperationContext
): Promise<RecipeExecutionResult> {
  const registry = OperationRegistry.getInstance();
  const stepResults: StepExecutionResult[] = [];
  let current = input;

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    if (!step.enabled) {
      continue;
    }

    if (context?.signal?.aborted) {
      return {
        success: false,
        finalOutput: current,
        stepResults,
        failedStepIndex: i,
        error: 'Recipe execution cancelled'
      };
    }

    const op = registry.get(step.opId);
    if (!op) {
      return {
        success: false,
        finalOutput: current,
        stepResults,
        failedStepIndex: i,
        error: `Unknown operation: "${step.opId}"`
      };
    }

    const startTime = Date.now();
    try {
      current = await op.run(current, step.args || {}, context);
      const durationMs = Date.now() - startTime;
      stepResults.push({
        opId: step.opId,
        output: current,
        durationMs
      });
    } catch (err: any) {
      const durationMs = Date.now() - startTime;
      const errorMsg = err?.message || String(err);
      stepResults.push({
        opId: step.opId,
        output: current,
        durationMs,
        error: errorMsg
      });

      return {
        success: false,
        finalOutput: current,
        stepResults,
        failedStepIndex: i,
        error: `Step ${i + 1} (${op.name}) failed: ${errorMsg}`
      };
    }
  }

  return {
    success: true,
    finalOutput: current,
    stepResults
  };
}
