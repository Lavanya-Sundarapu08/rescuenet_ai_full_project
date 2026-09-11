#!/bin/bash
echo "========================================================"
echo "  RESCUENET AI - EMERGENCY MANAGEMENT GIS PLATFORM"
echo "========================================================"

(cd backend && python -m uvicorn main:app --host 127.0.0.1 --port 8010 --reload) &
BACKEND_PID=$!

(cd frontend && npm run dev) &
FRONTEND_PID=$!

echo "Backend PID: $BACKEND_PID | Frontend PID: $FRONTEND_PID"
echo "Frontend: http://localhost:5173"
echo "Backend:  http://127.0.0.1:8010"

trap "kill $BACKEND_PID $FRONTEND_PID" SIGINT SIGTERM
wait
