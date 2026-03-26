package handlers

import (
	"backend-go/services"
	"fmt"
	"net/http"
	"sync"

	"github.com/gin-gonic/gin"
)

var (
	flowConfigsMu sync.RWMutex
	flowConfigs   = map[string]map[string]interface{}{}

	judgesConfigsMu sync.RWMutex
	judgesConfigs   = map[string][]interface{}{}

	flowStatesMu sync.RWMutex
	flowStates   = map[string]map[string]interface{}{}
)

var defaultSegments = []interface{}{
	map[string]interface{}{"name": "正方发言", "duration": 180, "side": "left", "order": 1},
	map[string]interface{}{"name": "反方质问", "duration": 120, "side": "right", "order": 2},
	map[string]interface{}{"name": "反方发言", "duration": 180, "side": "right", "order": 3},
	map[string]interface{}{"name": "正方质问", "duration": 120, "side": "left", "order": 4},
	map[string]interface{}{"name": "自由辩论", "duration": 300, "side": "both", "order": 5},
	map[string]interface{}{"name": "正方总结", "duration": 120, "side": "left", "order": 6},
	map[string]interface{}{"name": "反方总结", "duration": 120, "side": "right", "order": 7},
}

// GET /api/admin/debate-flow
func GetDebateFlow(c *gin.Context) {
	streamID := c.DefaultQuery("stream_id", "default")

	flowConfigsMu.RLock()
	config, ok := flowConfigs[streamID]
	flowConfigsMu.RUnlock()

	if !ok {
		config = map[string]interface{}{"segments": defaultSegments}
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "data": config})
}

// POST /api/admin/debate-flow
func SaveDebateFlow(c *gin.Context) {
	var body map[string]interface{}
	c.ShouldBindJSON(&body)

	streamID := toStringDefault(body["stream_id"], "default")
	segments, ok := body["segments"].([]interface{})
	if !ok {
		segments = defaultSegments
	}

	flowConfigsMu.Lock()
	flowConfigs[streamID] = map[string]interface{}{"segments": segments}
	flowConfigsMu.Unlock()

	services.Manager.Broadcast(map[string]interface{}{
		"type": "debate-flow-updated",
		"data": map[string]interface{}{"streamId": streamID, "segments": segments},
	})

	c.JSON(http.StatusOK, gin.H{"success": true, "data": gin.H{"message": "保存成功", "segments": segments}})
}

// POST /api/admin/debate-flow/control
func DebateFlowControl(c *gin.Context) {
	var body map[string]interface{}
	c.ShouldBindJSON(&body)

	streamID := toStringDefault(body["stream_id"], "default")
	action := toStringDefault(body["action"], "start")

	flowStatesMu.Lock()
	if _, ok := flowStates[streamID]; !ok {
		flowStates[streamID] = map[string]interface{}{
			"status":         "stopped",
			"currentSegment": 0,
			"elapsed":        0,
		}
	}
	state := flowStates[streamID]

	switch action {
	case "start":
		state["status"] = "running"
		state["currentSegment"] = 0
		state["elapsed"] = 0
	case "pause":
		state["status"] = "paused"
	case "resume":
		state["status"] = "running"
	case "reset":
		state["status"] = "stopped"
		state["currentSegment"] = 0
		state["elapsed"] = 0
	case "next":
		if cs, ok := state["currentSegment"].(int); ok {
			state["currentSegment"] = cs + 1
		}
		state["elapsed"] = 0
	case "prev":
		if cs, ok := state["currentSegment"].(int); ok {
			if cs > 0 {
				state["currentSegment"] = cs - 1
			}
		}
		state["elapsed"] = 0
	}
	flowStatesMu.Unlock()

	broadcastData := map[string]interface{}{
		"streamId": streamID,
		"action":   action,
	}
	for k, v := range state {
		broadcastData[k] = v
	}

	services.Manager.Broadcast(map[string]interface{}{
		"type": "debate-flow-control",
		"data": broadcastData,
	})

	respData := gin.H{"action": action}
	for k, v := range state {
		respData[k] = v
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "data": respData})
}

// GET /api/v1/admin/judges
func GetJudges(c *gin.Context) {
	streamID := c.DefaultQuery("stream_id", "default")

	judgesConfigsMu.RLock()
	judges, ok := judgesConfigs[streamID]
	judgesConfigsMu.RUnlock()

	if !ok {
		judges = []interface{}{}
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "data": gin.H{"judges": judges}})
}

// POST /api/admin/judges
func SaveJudges(c *gin.Context) {
	var body map[string]interface{}
	c.ShouldBindJSON(&body)

	streamID := toStringDefault(body["stream_id"], "default")
	judges, ok := body["judges"].([]interface{})
	if !ok {
		judges = []interface{}{}
	}

	judgesConfigsMu.Lock()
	judgesConfigs[streamID] = judges
	judgesConfigsMu.Unlock()

	services.Manager.Broadcast(map[string]interface{}{
		"type": "judges-updated",
		"data": map[string]interface{}{"streamId": streamID, "judges": judges},
	})

	_ = fmt.Sprintf("judges saved for %s", streamID)
	c.JSON(http.StatusOK, gin.H{"success": true, "data": gin.H{"message": "保存成功", "judges": judges}})
}
