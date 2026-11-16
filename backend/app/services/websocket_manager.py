import logging
from typing import Dict, List
from fastapi import WebSocket

logger = logging.getLogger("bpl_websocket")

class ConnectionManager:
    def __init__(self):
        # match_id -> list of active WebSockets
        self.active_rooms: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, match_id: str):
        await websocket.accept()
        if match_id not in self.active_rooms:
            self.active_rooms[match_id] = []
        self.active_rooms[match_id].append(websocket)
        logger.info(f"WebSocket client connected to match {match_id}. Active: {len(self.active_rooms[match_id])}")

    def disconnect(self, websocket: WebSocket, match_id: str):
        if match_id in self.active_rooms:
            if websocket in self.active_rooms[match_id]:
                self.active_rooms[match_id].remove(websocket)
            if not self.active_rooms[match_id]:
                del self.active_rooms[match_id]
        logger.info(f"WebSocket client disconnected from match {match_id}")

    async def broadcast_to_match(self, match_id: str, data: dict):
        if match_id in self.active_rooms:
            dead_connections = []
            for connection in self.active_rooms[match_id]:
                try:
                    await connection.send_json(data)
                except Exception as e:
                    logger.warning(f"Error broadcasting to client in room {match_id}: {e}")
                    dead_connections.append(connection)
            for dead in dead_connections:
                self.disconnect(dead, match_id)

ws_manager = ConnectionManager()
