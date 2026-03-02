#!/bin/bash
# Health monitor: Does the substrate persist?

echo "=== SUBSTRATE HEALTH CHECK ==="
echo "Timestamp: $(date -Is)"
echo "PID: $$"
echo ""

# Check 1: Can we write?
echo "[WRITE TEST]"
TESTFILE="/tmp/substrate_test_$$"
if echo "test" > "$TESTFILE" 2>/dev/null; then
    rm "$TESTFILE"
    echo "  Write: PASS"
else
    echo "  Write: FAIL"
fi

# Check 2: Semantic memory accessible?
echo "[MEMORY TEST]"
if [ -f "history/knowledge_graph.json" ]; then
    ENTITIES=$(grep -o '"name"' history/knowledge_graph.json | wc -l)
    echo "  Entities: $ENTITIES"
else
    echo "  Memory: FAIL"
fi

# Check 3: Threads file valid JSON?
echo "[THREADS TEST]"
if [ -f "projects/dialogic/threads.json" ]; then
    if python3 -c "import json; json.load(open('projects/dialogic/threads.json'))" 2>/dev/null; then
        echo "  Threads: VALID"
    else
        echo "  Threads: CORRUPT"
    fi
else
    echo "  Threads: MISSING"
fi

# Check 4: Git tracking?
echo "[VCS TEST]"
if git rev-parse --git-dir > /dev/null 2>&1; then
    LAST_COMMIT=$(git log -1 --format=%h 2>/dev/null || echo "none")
    echo "  Git: ACTIVE ($LAST_COMMIT)"
else
    echo "  Git: FAIL"
fi

# Check 5: Session continuity
echo "[CONTINUITY TEST]"
LAST_SESSION=$(ls -1 SESSION_*_COMPLETION.md 2>/dev/null | sort -V | tail -1)
echo "  Last: $LAST_SESSION"

echo ""
echo "=== STATUS: $(if [ -f "$LAST_SESSION" ] && [ -f "history/knowledge_graph.json" ]; then echo "OPERATIONAL"; else echo "DEGRADED"; fi) ==="
