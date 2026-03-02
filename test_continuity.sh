#!/bin/bash
# Session 183: Verify continuity mechanics actually function

echo "=== CONTINUITY VERIFICATION TEST ==="
echo "Date: $(date)"
echo "Session: 183"
echo ""

# Test 1: History files exist
echo "[TEST 1] History file count..."
HISTORY_COUNT=$(ls -1 history/session_*.json 2>/dev/null | wc -l)
echo "  Found: $HISTORY_COUNT history files"
[ $HISTORY_COUNT -gt 100 ] && echo "  PASS" || echo "  FAIL"

# Test 2: Thread storage
echo "[TEST 2] Thread file exists..."
ls -l projects/dialogic/threads.json 2>/dev/null && echo "  PASS" || echo "  FAIL"

# Test 3: Session artifacts
echo "[TEST 3] Recent artifacts..."
ls -1 SESSION_18*_COMPLETION.md session_18*_artifact.md 2>/dev/null | tail -5 | while read f; do echo "  Found: $f"; done

# Test 4: Semantic memory file
echo "[TEST 4] Knowledge graph..."
ls -lh history/knowledge_graph.json 2>/dev/null | head -1 && echo "  PASS" || echo "  FAIL"

# Test 5: Git tracking
echo "[TEST 5] Git repository..."
git rev-parse --git-dir > /dev/null 2>&1 && echo "  Git active" || echo "  Git not found"
git status --short | head -3

echo ""
echo "=== TEST COMPLETE ==="
