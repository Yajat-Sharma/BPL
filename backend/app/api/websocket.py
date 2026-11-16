import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.services.websocket_manager import ws_manager

router = APIRouter(tags=["WebSocket"])
logger = logging.getLogger("bpl_websocket_endpoint")

@router.websocket("/ws/matches/{match_id}")
async def websocket_match_scoring(websocket: WebSocket, match_id: str):
    await ws_manager.connect(websocket, match_id)
    try:
        while True:
            # Keep connection alive; client can send pings
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket, match_id)
    except Exception as e:
        logger.error(f"WebSocket error on match {match_id}: {e}")
        ws_manager.disconnect(websocket, match_id)
