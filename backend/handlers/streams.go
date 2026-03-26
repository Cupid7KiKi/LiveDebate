package handlers

import (
	"backend-go/database"
	"backend-go/models"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func streamToDict(s *models.Stream) gin.H {
	playUrls := gin.H{"rtmp": "", "hls": "", "flv": ""}
	switch s.Type {
	case "rtmp":
		playUrls["rtmp"] = s.URL
	case "hls":
		playUrls["hls"] = s.URL
	case "flv":
		playUrls["flv"] = s.URL
	}

	var startTime, stopTime interface{}
	if s.StartTime != nil {
		startTime = s.StartTime.Format(time.RFC3339)
	}
	if s.StopTime != nil {
		stopTime = s.StopTime.Format(time.RFC3339)
	}

	return gin.H{
		"id":          s.ID,
		"name":        s.Name,
		"url":         s.URL,
		"type":        s.Type,
		"description": s.Description,
		"enabled":     s.Enabled,
		"playUrls":    playUrls,
		"liveStatus": gin.H{
			"isLive":    s.IsLive,
			"liveId":    s.LiveID,
			"startTime": startTime,
			"stopTime":  stopTime,
			"streamUrl": s.URL,
		},
	}
}

// GET /api/v1/admin/streams
func GetStreams(c *gin.Context) {
	db := database.DB
	var streams []models.Stream
	db.Order("created_at desc").Find(&streams)

	items := make([]gin.H, len(streams))
	for i, s := range streams {
		items[i] = streamToDict(&s)
	}

	c.JSON(http.StatusOK, gin.H{
		"success":   true,
		"data":      gin.H{"streams": items, "total": len(streams)},
		"timestamp": time.Now().UnixMilli(),
	})
}

// POST /api/admin/streams, /api/v1/admin/streams
func CreateStream(c *gin.Context) {
	var body struct {
		Name        string `json:"name" binding:"required"`
		URL         string `json:"url" binding:"required"`
		Type        string `json:"type"`
		Description string `json:"description"`
		Enabled     *bool  `json:"enabled"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusOK, gin.H{"success": false, "message": "参数错误"})
		return
	}

	sType := "rtmp"
	if body.Type != "" {
		sType = body.Type
	}
	enabled := true
	if body.Enabled != nil {
		enabled = *body.Enabled
	}

	s := models.Stream{
		ID:          uuid.New().String(),
		Name:        body.Name,
		URL:         body.URL,
		Type:        sType,
		Description: body.Description,
		Enabled:     enabled,
	}
	database.DB.Create(&s)
	c.JSON(http.StatusOK, gin.H{"success": true, "data": streamToDict(&s)})
}

// GET /api/admin/streams/:stream_id, /api/v1/admin/streams/:stream_id
func GetStream(c *gin.Context) {
	streamID := c.Param("stream_id")
	var s models.Stream
	if err := database.DB.Where("id = ?", streamID).First(&s).Error; err != nil {
		c.JSON(http.StatusOK, gin.H{"success": false, "message": "直播流不存在"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "data": streamToDict(&s)})
}

// PUT /api/admin/streams/:stream_id, /api/v1/admin/streams/:stream_id
func UpdateStream(c *gin.Context) {
	streamID := c.Param("stream_id")
	var s models.Stream
	if err := database.DB.Where("id = ?", streamID).First(&s).Error; err != nil {
		c.JSON(http.StatusOK, gin.H{"success": false, "message": "直播流不存在"})
		return
	}

	var body map[string]interface{}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusOK, gin.H{"success": false, "message": "参数错误"})
		return
	}

	if v, ok := body["name"].(string); ok {
		s.Name = v
	}
	if v, ok := body["url"].(string); ok {
		s.URL = v
	}
	if v, ok := body["type"].(string); ok {
		s.Type = v
	}
	if v, ok := body["description"].(string); ok {
		s.Description = v
	}
	if v, ok := body["enabled"].(bool); ok {
		s.Enabled = v
	}

	database.DB.Save(&s)
	c.JSON(http.StatusOK, gin.H{"success": true, "data": streamToDict(&s)})
}

// DELETE /api/admin/streams/:stream_id, /api/v1/admin/streams/:stream_id
func DeleteStream(c *gin.Context) {
	streamID := c.Param("stream_id")
	var s models.Stream
	if err := database.DB.Where("id = ?", streamID).First(&s).Error; err != nil {
		c.JSON(http.StatusOK, gin.H{"success": false, "message": "直播流不存在"})
		return
	}
	database.DB.Delete(&s)
	c.JSON(http.StatusOK, gin.H{"success": true, "data": gin.H{"message": "删除成功"}})
}

// POST /api/admin/streams/:stream_id/toggle, /api/v1/admin/streams/:stream_id/toggle
func ToggleStream(c *gin.Context) {
	streamID := c.Param("stream_id")
	var s models.Stream
	if err := database.DB.Where("id = ?", streamID).First(&s).Error; err != nil {
		c.JSON(http.StatusOK, gin.H{"success": false, "message": "直播流不存在"})
		return
	}
	s.Enabled = !s.Enabled
	database.DB.Save(&s)
	c.JSON(http.StatusOK, gin.H{"success": true, "data": streamToDict(&s)})
}

// GET /api/v1/admin/streams/:stream_id/debate
func GetStreamDebate(c *gin.Context) {
	streamID := c.Param("stream_id")
	var topic models.DebateTopic
	if err := database.DB.Where("stream_id = ?", streamID).First(&topic).Error; err != nil {
		c.JSON(http.StatusOK, gin.H{"success": true, "data": nil})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "data": topicToDict(&topic)})
}

// PUT /api/v1/admin/streams/:stream_id/debate
func AssociateDebateToStream(c *gin.Context) {
	streamID := c.Param("stream_id")
	var body map[string]interface{}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusOK, gin.H{"success": false, "message": "参数错误"})
		return
	}

	debateID := toString(body["debate_id"])
	if debateID == "" {
		c.JSON(http.StatusOK, gin.H{"success": false, "message": "缺少 debate_id"})
		return
	}

	var topic models.DebateTopic
	if err := database.DB.Where("id = ?", debateID).First(&topic).Error; err != nil {
		c.JSON(http.StatusOK, gin.H{"success": false, "message": "辩题不存在"})
		return
	}

	topic.StreamID = &streamID
	database.DB.Save(&topic)
	c.JSON(http.StatusOK, gin.H{"success": true, "data": gin.H{"message": "关联成功"}})
}

// DELETE /api/v1/admin/streams/:stream_id/debate
func DeleteStreamDebate(c *gin.Context) {
	streamID := c.Param("stream_id")
	database.DB.Model(&models.DebateTopic{}).Where("stream_id = ?", streamID).Update("stream_id", nil)
	c.JSON(http.StatusOK, gin.H{"success": true, "data": gin.H{"message": "已解除关联"}})
}
