package ws

import (
	"backend-go/services"
	"encoding/json"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

func HandleWebSocket(c *gin.Context) {
	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Println("WebSocket upgrade error:", err)
		return
	}

	services.Manager.Connect(conn)
	defer func() {
		services.Manager.Disconnect(conn)
		conn.Close()
	}()

	for {
		_, message, err := conn.ReadMessage()
		if err != nil {
			break
		}

		var msg map[string]interface{}
		if err := json.Unmarshal(message, &msg); err != nil {
			continue
		}

		if msg["type"] == "ping" {
			pong, _ := json.Marshal(map[string]interface{}{"type": "pong"})
			conn.WriteMessage(websocket.TextMessage, pong)
		}
	}
}
