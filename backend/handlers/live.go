package handlers

import (
	"backend-go/database"
	"backend-go/models"
	"backend-go/services"
	"fmt"
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// In-memory live state
var (
	liveStateMu sync.RWMutex
	liveState   = map[string]interface{}{
		"is_live":     false,
		"stream_id":   nil,
		"live_id":     nil,
		"start_time":  nil,
		"stop_time":   nil,
		"stream_url":  "",
		"stream_name": "",
	}

	scheduleMu sync.RWMutex
	schedule   map[string]interface{}

	aiStatesMu sync.RWMutex
	aiStates   = map[string]map[string]interface{}{}
)

func GetLiveState() map[string]interface{} {
	liveStateMu.RLock()
	defer liveStateMu.RUnlock()
	cp := make(map[string]interface{}, len(liveState))
	for k, v := range liveState {
		cp[k] = v
	}
	return cp
}

// GET /api/admin/live/status, /api/v1/admin/live/status
func GetLiveStatus(c *gin.Context) {
	state := GetLiveState()
	scheduleMu.RLock()
	sched := schedule
	scheduleMu.RUnlock()

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"isLive":           state["is_live"],
			"streamUrl":        state["stream_url"],
			"streamId":         state["stream_id"],
			"liveId":           state["live_id"],
			"startTime":        state["start_time"],
			"stopTime":         state["stop_time"],
			"activeStreamUrl":  state["stream_url"],
			"activeStreamId":   state["stream_id"],
			"activeStreamName": state["stream_name"],
			"schedule":         sched,
		},
	})
}

func startLive(streamID string) gin.H {
	lid := uuid.New().String()
	now := time.Now().UTC().Format(time.RFC3339)

	streamURL := ""
	streamName := ""

	if streamID != "" {
		db := database.DB
		var s models.Stream
		if err := db.Where("id = ?", streamID).First(&s).Error; err == nil {
			nowTime := time.Now().UTC()
			s.IsLive = true
			s.LiveID = &lid
			s.StartTime = &nowTime
			streamURL = s.URL
			streamName = s.Name
			db.Save(&s)
		}
	}

	liveStateMu.Lock()
	liveState["is_live"] = true
	liveState["stream_id"] = streamID
	liveState["live_id"] = lid
	liveState["start_time"] = now
	liveState["stop_time"] = nil
	liveState["stream_url"] = streamURL
	liveState["stream_name"] = streamName
	liveStateMu.Unlock()

	services.Manager.Broadcast(map[string]interface{}{
		"type":     "liveStatus",
		"streamId": streamID,
		"liveId":   lid,
		"data": map[string]interface{}{
			"isLive":      true,
			"status":      "started",
			"activeUsers": services.Manager.ConnectionCount(),
		},
	})

	return gin.H{
		"success": true,
		"message": "直播已开始",
		"data": gin.H{
			"isLive":    true,
			"streamUrl": streamURL,
			"streamId":  streamID,
			"liveId":    lid,
			"startTime": now,
		},
	}
}

func stopLive(streamID string) gin.H {
	now := time.Now().UTC().Format(time.RFC3339)

	liveStateMu.RLock()
	sid := streamID
	if sid == "" {
		if v, ok := liveState["stream_id"].(string); ok {
			sid = v
		}
	}
	liveStateMu.RUnlock()

	if sid != "" {
		db := database.DB
		var s models.Stream
		if err := db.Where("id = ?", sid).First(&s).Error; err == nil {
			nowTime := time.Now().UTC()
			s.IsLive = false
			s.StopTime = &nowTime
			db.Save(&s)
		}
	}

	liveStateMu.Lock()
	liveState["is_live"] = false
	liveState["stop_time"] = now
	liveStateMu.Unlock()

	services.Manager.Broadcast(map[string]interface{}{
		"type":     "liveStatus",
		"streamId": sid,
		"data":     map[string]interface{}{"isLive": false, "status": "stopped"},
	})

	return gin.H{
		"success": true,
		"message": "直播已停止",
		"data":    gin.H{"isLive": false, "stopTime": now},
	}
}

// POST /api/admin/live/start, /api/v1/admin/live/start
func StartLive(c *gin.Context) {
	var body map[string]interface{}
	c.ShouldBindJSON(&body)
	streamID := toString(body["streamId"])
	c.JSON(http.StatusOK, startLive(streamID))
}

// POST /api/admin/live/stop, /api/v1/admin/live/stop
func StopLive(c *gin.Context) {
	var body map[string]interface{}
	c.ShouldBindJSON(&body)
	streamID := toString(body["streamId"])
	c.JSON(http.StatusOK, stopLive(streamID))
}

// POST /api/admin/live/control, /api/live/control
func LiveControl(c *gin.Context) {
	var body map[string]interface{}
	c.ShouldBindJSON(&body)
	action := toString(body["action"])
	streamID := toString(body["streamId"])

	switch action {
	case "start":
		c.JSON(http.StatusOK, startLive(streamID))
	case "stop":
		c.JSON(http.StatusOK, stopLive(streamID))
	default:
		c.JSON(http.StatusOK, gin.H{"success": false, "message": "未知操作"})
	}
}

// POST /api/admin/live/setup-and-start
func SetupAndStart(c *gin.Context) {
	var body map[string]interface{}
	c.ShouldBindJSON(&body)
	streamID := toString(body["streamId"])
	c.JSON(http.StatusOK, startLive(streamID))
}

// GET /api/admin/rtmp/urls
func GetRTMPUrls(c *gin.Context) {
	roomName := c.DefaultQuery("room_name", "default")
	base := fmt.Sprintf("rtmp://live.example.com/live/%s", roomName)
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"room_name": roomName,
			"push_url":  base + "?auth=push",
			"play_flv":  fmt.Sprintf("http://live.example.com/live/%s.flv", roomName),
			"play_hls":  fmt.Sprintf("http://live.example.com/live/%s.m3u8", roomName),
		},
	})
}

// POST /api/admin/live/schedule
func CreateSchedule(c *gin.Context) {
	var body map[string]interface{}
	c.ShouldBindJSON(&body)

	sched := map[string]interface{}{
		"id":        uuid.New().String(),
		"title":     toString(body["title"]),
		"startTime": toString(body["startTime"]),
		"endTime":   toString(body["endTime"]),
		"streamId":  toString(body["streamId"]),
		"status":    "scheduled",
	}

	scheduleMu.Lock()
	schedule = sched
	scheduleMu.Unlock()

	c.JSON(http.StatusOK, gin.H{"success": true, "data": sched})
}

// GET /api/admin/live/schedule
func GetSchedule(c *gin.Context) {
	scheduleMu.RLock()
	sched := schedule
	scheduleMu.RUnlock()
	c.JSON(http.StatusOK, gin.H{"success": true, "data": sched})
}

// POST /api/admin/live/schedule/cancel
func CancelSchedule(c *gin.Context) {
	scheduleMu.Lock()
	schedule = nil
	scheduleMu.Unlock()
	c.JSON(http.StatusOK, gin.H{"success": true, "data": gin.H{"message": "日程已取消"}})
}

// ==================== AI Control ====================

func getAIState(streamID string) map[string]interface{} {
	if streamID == "" {
		streamID = "global"
	}
	aiStatesMu.Lock()
	defer aiStatesMu.Unlock()
	if _, ok := aiStates[streamID]; !ok {
		aiStates[streamID] = map[string]interface{}{
			"status":    "stopped",
			"sessionId": nil,
			"settings":  map[string]interface{}{},
		}
	}
	return aiStates[streamID]
}

// POST /api/v1/admin/ai/start
func StartAI(c *gin.Context) {
	var body map[string]interface{}
	c.ShouldBindJSON(&body)
	streamID := toString(body["streamId"])
	if streamID == "" {
		streamID = "global"
	}

	state := getAIState(streamID)
	sessionID := uuid.New().String()
	state["status"] = "running"
	state["sessionId"] = sessionID
	if settings, ok := body["settings"].(map[string]interface{}); ok {
		state["settings"] = settings
	}

	services.Manager.Broadcast(map[string]interface{}{
		"type": "aiStatus",
		"data": map[string]interface{}{"status": "running", "streamId": streamID, "sessionId": sessionID},
	})

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"status":    "running",
			"sessionId": sessionID,
			"streamId":  streamID,
			"message":   "AI识别已启动",
		},
	})
}

// POST /api/v1/admin/ai/stop
func StopAI(c *gin.Context) {
	var body map[string]interface{}
	c.ShouldBindJSON(&body)
	streamID := toString(body["streamId"])
	if streamID == "" {
		streamID = "global"
	}

	state := getAIState(streamID)
	state["status"] = "stopped"

	services.Manager.Broadcast(map[string]interface{}{
		"type": "aiStatus",
		"data": map[string]interface{}{"status": "stopped", "streamId": streamID},
	})

	c.JSON(http.StatusOK, gin.H{"success": true, "data": gin.H{"status": "stopped", "message": "AI识别已停止"}})
}

// POST /api/v1/admin/ai/toggle
func ToggleAI(c *gin.Context) {
	var body map[string]interface{}
	c.ShouldBindJSON(&body)
	action := toString(body["action"])
	if action == "" {
		action = "pause"
	}
	streamID := toString(body["streamId"])
	if streamID == "" {
		streamID = "global"
	}

	state := getAIState(streamID)
	if action == "pause" {
		state["status"] = "paused"
	} else if action == "resume" {
		state["status"] = "running"
	}

	services.Manager.Broadcast(map[string]interface{}{
		"type": "aiStatus",
		"data": map[string]interface{}{"status": state["status"], "streamId": streamID},
	})

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    gin.H{"status": state["status"], "message": fmt.Sprintf("AI已%s", action)},
	})
}

// ==================== Viewers ====================

// GET /api/v1/admin/live/viewers
func GetViewers(c *gin.Context) {
	streamID := c.Query("stream_id")
	viewers := services.Manager.ConnectionCount()

	if streamID != "" {
		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"data": gin.H{
				"streamId":  streamID,
				"viewers":   viewers,
				"timestamp": time.Now().UnixMilli(),
			},
		})
		return
	}

	state := GetLiveState()
	sid := "default"
	if v, ok := state["stream_id"].(string); ok && v != "" {
		sid = v
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"streams":          gin.H{sid: viewers},
			"totalConnections": viewers,
			"timestamp":        time.Now().UnixMilli(),
		},
	})
}

// POST /api/v1/admin/live/broadcast-viewers
func BroadcastViewers(c *gin.Context) {
	var body map[string]interface{}
	c.ShouldBindJSON(&body)
	streamID := toString(body["streamId"])
	if streamID == "" {
		streamID = "default"
	}
	viewers := services.Manager.ConnectionCount()

	services.Manager.Broadcast(map[string]interface{}{
		"type": "viewersUpdate",
		"data": map[string]interface{}{"streamId": streamID, "viewers": viewers},
	})

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    gin.H{"streamId": streamID, "viewers": viewers, "message": "已广播"},
	})
}
