#!/usr/bin/env bash
# Composable bash functions for quick FreeClimb metrics.
# Source this file, then call individual functions:
#   source .claude/skills/freeclimb-dashboards/scripts/fc-metrics.sh
#   fc_active_calls
#   fc_queue_depth
#   fc_error_rate
#   fc_call_volume

# Count of currently in-progress calls
fc_active_calls() {
    local result
    result=$(freeclimb calls:list --status inProgress --fields callId --json 2>/dev/null)
    if [ $? -ne 0 ]; then
        echo "ERROR: Failed to fetch active calls" >&2
        return 1
    fi
    local count
    count=$(echo "$result" | jq '.data | length')
    echo "Active calls: $count"
}

# Queue sizes across all queues
fc_queue_depth() {
    local result
    result=$(freeclimb call-queues:list --fields queueId,alias,currentSize --json 2>/dev/null)
    if [ $? -ne 0 ]; then
        echo "ERROR: Failed to fetch queues" >&2
        return 1
    fi
    echo "Queue depths:"
    echo "$result" | jq -r '.data[] | "  \(.alias // .queueId): \(.currentSize) callers"'
    local total
    total=$(echo "$result" | jq '[.data[].currentSize] | add // 0')
    echo "  Total: $total"
}

# Error count from recent logs
fc_error_rate() {
    local result
    result=$(freeclimb logs:filter --pql 'level = "ERROR"' --json 2>/dev/null)
    if [ $? -ne 0 ]; then
        echo "ERROR: Failed to fetch logs" >&2
        return 1
    fi
    local count
    count=$(echo "$result" | jq '.data | length')
    echo "Recent errors: $count"
    if [ "$count" -gt 0 ]; then
        echo "Top error messages:"
        echo "$result" | jq -r '.data | group_by(.message) | map({msg: .[0].message, count: length}) | sort_by(-.count) | .[:5][] | "  [\(.count)] \(.msg)"'
    fi
}

# Total calls by status from last page of results
fc_call_volume() {
    local result
    result=$(freeclimb calls:list --fields status --json 2>/dev/null)
    if [ $? -ne 0 ]; then
        echo "ERROR: Failed to fetch calls" >&2
        return 1
    fi
    local total
    total=$(echo "$result" | jq '.data | length')
    echo "Call volume (last $total results):"
    echo "$result" | jq -r '.data | group_by(.status) | map({status: .[0].status, count: length}) | sort_by(-.count)[] | "  \(.status): \(.count)"'
}

# Summary: run all metrics
fc_summary() {
    echo "=== FreeClimb Metrics Summary ==="
    echo ""
    fc_active_calls
    echo ""
    fc_queue_depth
    echo ""
    fc_error_rate
    echo ""
    fc_call_volume
    echo ""
    echo "=== End Summary ==="
}
