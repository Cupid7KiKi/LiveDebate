package handlers

import (
	"backend-go/database"
	"backend-go/models"
	"backend-go/services"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func topicToDict(t *models.DebateTopic) gin.H {
	return gin.H{
		"id":            t.ID,
		"title":         t.Title,
		"description":   t.Description,
		"leftSide":      t.LeftSide,
		"rightSide":     t.RightSide,
		"leftPosition":  t.LeftPosition,
		"rightPosition": t.RightPosition,
	}
}

func getOrCreateTopic(streamID string) *models.DebateTopic {
	db := database.DB
	sid := services.ResolveStreamID(db, streamID)

	var topic models.DebateTopic
	err := db.Where("stream_id = ?", sid).First(&topic).Error
	if err != nil {
		topic = models.DebateTopic{
			ID:            uuid.New().String(),
			StreamID:      &sid,
			Title:         "今日辩题",
			Description:   "请选择你支持的观点",
			LeftSide:      "正方",
			RightSide:     "反方",
			LeftPosition:  "正方观点",
			RightPosition: "反方观点",
		}
		db.Create(&topic)
	}
	return &topic
}

// GET /api/v1/debate-topic, /api/debate-topic, /api/admin/debate
func GetDebateTopic(c *gin.Context) {
	streamID := c.Query("stream_id")
	topic := getOrCreateTopic(streamID)
	c.JSON(http.StatusOK, gin.H{"success": true, "data": topicToDict(topic)})
}

// PUT /api/admin/debate
func AdminUpdateDebate(c *gin.Context) {
	var body map[string]interface{}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusOK, gin.H{"success": false, "message": "参数错误"})
		return
	}

	streamID := toString(body["stream_id"])
	topic := getOrCreateTopic(streamID)

	if v, ok := body["title"].(string); ok {
		topic.Title = v
	}
	if v, ok := body["description"].(string); ok {
		topic.Description = v
	}
	if v, ok := body["leftSide"].(string); ok {
		topic.LeftSide = v
	}
	if v, ok := body["rightSide"].(string); ok {
		topic.RightSide = v
	}
	if v, ok := body["leftPosition"].(string); ok {
		topic.LeftPosition = v
	}
	if v, ok := body["rightPosition"].(string); ok {
		topic.RightPosition = v
	}

	database.DB.Save(topic)
	c.JSON(http.StatusOK, gin.H{"success": true, "data": topicToDict(topic)})
}

// GET /api/v1/admin/debate-topic
func AdminGetDebateTopicV1(c *gin.Context) {
	GetDebateTopic(c)
}

// POST /api/v1/admin/debates
func CreateDebate(c *gin.Context) {
	var body map[string]interface{}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusOK, gin.H{"success": false, "message": "参数错误"})
		return
	}

	sid := toString(body["stream_id"])
	var streamIDPtr *string
	if sid != "" {
		streamIDPtr = &sid
	}

	topic := models.DebateTopic{
		ID:            uuid.New().String(),
		StreamID:      streamIDPtr,
		Title:         toStringDefault(body["title"], ""),
		Description:   toStringDefault(body["description"], ""),
		LeftSide:      toStringDefault(body["leftSide"], "正方"),
		RightSide:     toStringDefault(body["rightSide"], "反方"),
		LeftPosition:  toStringDefault(body["leftPosition"], ""),
		RightPosition: toStringDefault(body["rightPosition"], ""),
	}
	database.DB.Create(&topic)
	c.JSON(http.StatusOK, gin.H{"success": true, "data": topicToDict(&topic)})
}

// GET /api/v1/admin/debates/:debate_id
func GetDebateByID(c *gin.Context) {
	debateID := c.Param("debate_id")
	var topic models.DebateTopic
	if err := database.DB.Where("id = ?", debateID).First(&topic).Error; err != nil {
		c.JSON(http.StatusOK, gin.H{"success": false, "message": "辩题不存在"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "data": topicToDict(&topic)})
}

// PUT /api/v1/admin/debates/:debate_id
func UpdateDebateByID(c *gin.Context) {
	debateID := c.Param("debate_id")
	var topic models.DebateTopic
	if err := database.DB.Where("id = ?", debateID).First(&topic).Error; err != nil {
		c.JSON(http.StatusOK, gin.H{"success": false, "message": "辩题不存在"})
		return
	}

	var body map[string]interface{}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusOK, gin.H{"success": false, "message": "参数错误"})
		return
	}

	if v, ok := body["title"].(string); ok {
		topic.Title = v
	}
	if v, ok := body["description"].(string); ok {
		topic.Description = v
	}
	if v, ok := body["leftSide"].(string); ok {
		topic.LeftSide = v
	}
	if v, ok := body["rightSide"].(string); ok {
		topic.RightSide = v
	}
	if v, ok := body["leftPosition"].(string); ok {
		topic.LeftPosition = v
	}
	if v, ok := body["rightPosition"].(string); ok {
		topic.RightPosition = v
	}
	if isActive, ok := body["isActive"].(bool); ok && !isActive {
		topic.StreamID = nil
	}

	database.DB.Save(&topic)
	c.JSON(http.StatusOK, gin.H{"success": true, "data": topicToDict(&topic)})
}

func toStringDefault(v interface{}, def string) string {
	if v == nil {
		return def
	}
	if s, ok := v.(string); ok {
		return s
	}
	return def
}
