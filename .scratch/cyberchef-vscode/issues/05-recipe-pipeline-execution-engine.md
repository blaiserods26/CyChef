# 05 - Recipe Pipeline Execution Engine and Error Handling

Type: grilling
Status: open
Blocked by: 01

## Question

How does the Recipe runner execute sequential Operations on `Payload` buffers, report per-step status, and handle failure states?
Specifically:
- What happens if step $i$ fails (e.g. invalid base64 input or key mismatch)? Does execution halt, or output the error state at step $i$?
- How is step-by-step intermediate inspection rendered in the UI?
- How is execution cancelled if an operation is computationally intensive or if the user types into the input box while a recipe is baking?
