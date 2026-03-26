package handlers

import (
	"backend-go/database"
	"backend-go/models"
	"backend-go/services"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func contentToDict(c *models.AIContent, comments []gin.H) gin.H {
	side := "left"
	if c.Type != "recognition" {
		side = "right"
	}
	return gin.H{
		"id":        c.ID,
		"content":   c.Content,
		"text":      c.Content,
		"side":      side,
		"timestamp": c.CreatedAt.Format(time.RFC3339),
		"type":      c.Type,
		"likes":     c.Likes,
		"comments":  comments,
	}
}

func commentToDict(c *models.Comment) gin.H {
	return gin.H{
		"id":        c.ID,
		"contentId": c.ContentID,
		"user":      c.User,
		"text":      c.Text,
		"avatar":    c.Avatar,
		"likes":     c.Likes,
		"timestamp": c.CreatedAt.Format(time.RFC3339),
	}
}

func getContentsWithComments(streamID string) []gin.H {
	db := database.DB
	sid := services.ResolveStreamID(db, streamID)

	var contents []models.AIContent
	query := db.Order("created_at desc")
	if sid != "" && sid != "default" {
		query = query.Where("stream_id = ?", sid)
	}
	query.Find(&contents)

	items := make([]gin.H, len(contents))
	for i, c := range contents {
		var comments []models.Comment
		db.Where("content_id = ?", c.ID).Order("created_at asc").Find(&comments)
		commentDicts := make([]gin.H, len(comments))
		for j, cm := range comments {
			commentDicts[j] = commentToDict(&cm)
		}
		items[i] = contentToDict(&c, commentDicts)
	}
	return items
}

// GET /api/v1/ai-content, /api/ai-content
func GetAIContent(c *gin.Context) {
	streamID := c.Query("stream_id")
	items := getContentsWithComments(streamID)
	c.JSON(http.StatusOK, gin.H{"success": true, "data": items})
}

// GET /api/v1/admin/ai-content/list, /api/admin/ai-content/list, /api/admin/ai-content
func AdminListAIContent(c *gin.Context) {
	GetAIContent(c)
}

// GET /api/admin/ai-content/:content_id
func AdminGetAIContent(c *gin.Context) {
	contentID := c.Param("content_id")
	var content models.AIContent
	if err := database.DB.Where("id = ?", contentID).First(&content).Error; err != nil {
		c.JSON(http.StatusOK, gin.H{"success": false, "message": "内容不存在"})
		return
	}

	var comments []models.Comment
	database.DB.Where("content_id = ?", content.ID).Order("created_at asc").Find(&comments)
	commentDicts := make([]gin.H, len(comments))
	for i, cm := range comments {
		commentDicts[i] = commentToDict(&cm)
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "data": contentToDict(&content, commentDicts)})
}

// POST /api/admin/ai-content
func AdminCreateAIContent(c *gin.Context) {
	var body struct {
		Content  string  `json:"content" binding:"required"`
		Type     string  `json:"type"`
		StreamID *string `json:"stream_id"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusOK, gin.H{"success": false, "message": "参数错误"})
		return
	}

	contentType := "recognition"
	if body.Type != "" {
		contentType = body.Type
	}

	content := models.AIContent{
		ID:       uuid.New().String(),
		Content:  body.Content,
		Type:     contentType,
		StreamID: body.StreamID,
	}
	database.DB.Create(&content)
	c.JSON(http.StatusOK, gin.H{"success": true, "data": contentToDict(&content, []gin.H{})})
}

// PUT /api/admin/ai-content/:content_id
func AdminUpdateAIContent(c *gin.Context) {
	contentID := c.Param("content_id")
	var content models.AIContent
	if err := database.DB.Where("id = ?", contentID).First(&content).Error; err != nil {
		c.JSON(http.StatusOK, gin.H{"success": false, "message": "内容不存在"})
		return
	}

	var body map[string]interface{}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusOK, gin.H{"success": false, "message": "参数错误"})
		return
	}

	if v, ok := body["content"].(string); ok {
		content.Content = v
	}
	if v, ok := body["type"].(string); ok {
		content.Type = v
	}
	database.DB.Save(&content)
	c.JSON(http.StatusOK, gin.H{"success": true, "data": contentToDict(&content, []gin.H{})})
}

// DELETE /api/admin/ai-content/:content_id, /api/admin/ai/content/:content_id
func AdminDeleteAIContent(c *gin.Context) {
	contentID := c.Param("content_id")
	var content models.AIContent
	if err := database.DB.Where("id = ?", contentID).First(&content).Error; err != nil {
		c.JSON(http.StatusOK, gin.H{"success": false, "message": "内容不存在"})
		return
	}
	database.DB.Delete(&content)
	c.JSON(http.StatusOK, gin.H{"success": true, "data": gin.H{"message": "删除成功"}})
}
