#!/bin/bash

# Maximum allowed TypeScript errors (current baseline)
# TODO: Decrease this number as errors are fixed, never increase it
# Note: CI environment may have different error count than local due to dependency differences
MAX_ERRORS=146

# Run TypeScript compiler and capture output
OUTPUT=$(tsc --noEmit --pretty --skipLibCheck 2>&1)
EXIT_CODE=$?

# If tsc succeeded (no errors), we're done
if [ $EXIT_CODE -eq 0 ]; then
  echo "✓ No TypeScript errors found!"
  exit 0
fi

# Parse the error count from tsc output
# Looking for "Found X errors in Y files"
ERROR_COUNT=$(echo "$OUTPUT" | grep -oP 'Found \K\d+(?= errors?)' | head -1)

# If we couldn't parse the error count, show output and fail
if [ -z "$ERROR_COUNT" ]; then
  echo "$OUTPUT"
  echo ""
  echo "❌ Could not parse TypeScript error count"
  exit 1
fi

# Show the output
echo "$OUTPUT"
echo ""
echo "────────────────────────────────────────"
echo "Type-check: $ERROR_COUNT errors found"
echo "Threshold:  $MAX_ERRORS errors maximum"
echo "────────────────────────────────────────"

# Check if we're within the threshold
if [ $ERROR_COUNT -gt $MAX_ERRORS ]; then
  echo "❌ FAILED: Error count ($ERROR_COUNT) exceeds maximum allowed ($MAX_ERRORS)"
  echo "You have introduced new TypeScript errors. Please fix them before committing."
  exit 1
fi

echo "✓ Within error threshold - no new errors introduced!"
exit 0
