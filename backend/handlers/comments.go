package handlers

import (
	"backend-go/database"
	"backend-go/models"
	"backend-go/services"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// POST /api/comment
func AddComment(c *gin.Context) {
	var body struct {
		ContentID string `json:"contentId" binding:"required"`
		Text      string `json:"text" binding:"required"`
		User      string `json:"user"`
		Avatar    string `json:"avatar"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusOK, gin.H{"success": false, "message": "参数错误"})
		return
	}

	user := body.User
	if user == "" {
		user = "匿名用户"
	}

	comment := models.Comment{
		ID:        uuid.New().String(),
		ContentID: body.ContentID,
		User:      user,
		Text:      body.Text,
		Avatar:    body.Avatar,
	}
	database.DB.Create(&comment)

	dict := commentToDict(&comment)
	services.Manager.Broadcast(map[string]interface{}{
		"type": "comment-added",
		"data": dict,
	})

	c.JSON(http.StatusOK, gin.H{"success": true, "data": dict})
}

// DELETE /api/comment/:comment_id
func DeleteComment(c *gin.Context) {
	commentID := c.Param("comment_id")
	var comment models.Comment
	if err := database.DB.Where("id = ?", commentID).First(&comment).Error; err != nil {
		c.JSON(http.StatusOK, gin.H{"success": false, "message": "评论不存在"})
		return
	}
	database.DB.Delete(&comment)
	c.JSON(http.StatusOK, gin.H{"success": true, "message": "删除成功"})
}

// POST /api/like
func LikeContent(c *gin.Context) {
	var body struct {
		ContentID string  `json:"contentId" binding:"required"`
		CommentID *string `json:"commentId"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusOK, gin.H{"success": false, "message": "参数错误"})
		return
	}

	like := models.Like{
		ID:        uuid.New().String(),
		ContentID: body.ContentID,
		CommentID: body.CommentID,
	}
	database.DB.Create(&like)

	if body.CommentID != nil && *body.CommentID != "" {
		var comment models.Comment
		if err := database.DB.Where("id = ?", *body.CommentID).First(&comment).Error; err == nil {
			comment.Likes++
			database.DB.Save(&comment)
			c.JSON(http.StatusOK, gin.H{"success": true, "data": gin.H{"likes": comment.Likes}})
			return
		}
	} else {
		var content models.AIContent
		if err := database.DB.Where("id = ?", body.ContentID).First(&content).Error; err == nil {
			content.Likes++
			database.DB.Save(&content)
			c.JSON(http.StatusOK, gin.H{"success": true, "data": gin.H{"likes": content.Likes}})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "data": gin.H{"likes": 1}})
}

// GET /api/admin/ai-content/:content_id/comments, /api/v1/admin/ai-content/:content_id/comments
func GetContentComments(c *gin.Context) {
	contentID := c.Param("content_id")
	var comments []models.Comment
	database.DB.Where("content_id = ?", contentID).Order("created_at asc").Find(&comments)

	items := make([]gin.H, len(comments))
	for i, cm := range comments {
		items[i] = commentToDict(&cm)
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "data": items})
}

// DELETE /api/v1/admin/ai-content/:content_id/comments/:comment_id
func AdminDeleteComment(c *gin.Context) {
	commentID := c.Param("comment_id")
	var comment models.Comment
	if err := database.DB.Where("id = ?", commentID).First(&comment).Error; err != nil {
		c.JSON(http.StatusOK, gin.H{"success": false, "message": "评论不存在"})
		return
	}
	database.DB.Delete(&comment)
	c.JSON(http.StatusOK, gin.H{"success": true, "message": "删除成功"})
}
