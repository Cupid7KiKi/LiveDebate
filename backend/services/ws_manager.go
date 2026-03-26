package services

import (
	"encoding/json"
	"sync"

	"github.com/gorilla/websocket"
)

type WSManager struct {
	mu          sync.RWMutex
	connections []*websocket.Conn
}

var Manager = &WSManager{}

func (m *WSManager) Connect(conn *websocket.Conn) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.connections = append(m.connections, conn)
}

func (m *WSManager) Disconnect(conn *websocket.Conn) {
	m.mu.Lock()
	defer m.mu.Unlock()
	for i, c := range m.connections {
		if c == conn {
			m.connections = append(m.connections[:i], m.connections[i+1:]...)
			return
		}
	}
}

func (m *WSManager) Broadcast(message interface{}) {
	data, err := json.Marshal(message)
	if err != nil {
		return
	}
	m.mu.RLock()
	conns := make([]*websocket.Conn, len(m.connections))
	copy(conns, m.connections)
	m.mu.RUnlock()

	var disconnected []*websocket.Conn
	for _, conn := range conns {
		if err := conn.WriteMessage(websocket.TextMessage, data); err != nil {
			disconnected = append(disconnected, conn)
		}
	}

	if len(disconnected) > 0 {
		m.mu.Lock()
		for _, dc := range disconnected {
			for i, c := range m.connections {
				if c == dc {
					m.connections = append(m.connections[:i], m.connections[i+1:]...)
					break
				}
			}
		}
		m.mu.Unlock()
	}
}

func (m *WSManager) ConnectionCount() int {
	m.mu.RLock()
	defer m.mu.RUnlock()
	return len(m.connections)
}
