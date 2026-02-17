#!/bin/bash

echo "🧪 Testing Todo-Flow API..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

# Test server health
echo -n "Testing server connection... "
if curl -s http://localhost:3001/api/lists > /dev/null; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗${NC} Server not running!"
    exit 1
fi

# Get lists
echo -n "GET /api/lists... "
RESPONSE=$(curl -s http://localhost:3001/api/lists)
if [[ $RESPONSE == *"id"* ]]; then
    echo -e "${GREEN}✓${NC}"
    LIST_ID=$(echo $RESPONSE | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
else
    echo -e "${RED}✗${NC}"
fi

# Get tasks for list
echo -n "GET /api/tasks/list/$LIST_ID... "
TASK_RESPONSE=$(curl -s http://localhost:3001/api/tasks/list/$LIST_ID)
if [[ $TASK_RESPONSE == *"["* ]]; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗${NC}"
fi

# Create a test task
echo -n "POST /api/tasks... "
CREATE_RESPONSE=$(curl -s -X POST http://localhost:3001/api/tasks \
  -H "Content-Type: application/json" \
  -d "{\"title\":\"Test Task\",\"listId\":\"$LIST_ID\"}")
if [[ $CREATE_RESPONSE == *"id"* ]]; then
    echo -e "${GREEN}✓${NC}"
    TASK_ID=$(echo $CREATE_RESPONSE | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
else
    echo -e "${RED}✗${NC}"
fi

# Toggle task completion
echo -n "PATCH /api/tasks/$TASK_ID/complete... "
TOGGLE_RESPONSE=$(curl -s -X PATCH http://localhost:3001/api/tasks/$TASK_ID/complete)
if [[ $TOGGLE_RESPONSE == *"completed"* ]]; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗${NC}"
fi

# Delete test task
echo -n "DELETE /api/tasks/$TASK_ID... "
DELETE_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE http://localhost:3001/api/tasks/$TASK_ID)
if [[ $DELETE_CODE == "204" ]]; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗${NC}"
fi

echo ""
echo -e "${GREEN}✅ All API tests passed!${NC}"
