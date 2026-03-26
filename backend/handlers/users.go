package handlers

import (
	"backend-go/database"
	"backend-go/models"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

func userToDict(u *models.User) gin.H {
	createdAt := ""
	if !u.CreatedAt.IsZero() {
		createdAt = u.CreatedAt.Format(time.RFC3339)
	}
	lastLogin := ""
	if !u.LastLogin.IsZero() {
		lastLogin = u.LastLogin.Format(time.RFC3339)
	}
	return gin.H{
		"id":        u.ID,
		"nickName":  u.NickName,
		"avatarUrl": u.AvatarURL,
		"status":    u.Status,
		"isAdmin":   u.IsAdmin,
		"createdAt": createdAt,
		"lastLogin": lastLogin,
	}
}

// GET /api/admin/users, /api/admin/miniprogram/users
func GetUsers(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("pageSize", "20"))
	status := c.Query("status")

	db := database.DB
	query := db.Model(&models.User{}).Order("created_at desc")
	countQuery := db.Model(&models.User{})

	if status != "" {
		query = query.Where("status = ?", status)
		countQuery = countQuery.Where("status = ?", status)
	}

	var total int64
	countQuery.Count(&total)

	var users []models.User
	query.Offset((page - 1) * pageSize).Limit(pageSize).Find(&users)

	items := make([]gin.H, len(users))
	for i, u := range users {
		items[i] = userToDict(&u)
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"users":    items,
			"total":    total,
			"page":     page,
			"pageSize": pageSize,
		},
	})
}

// GET /api/admin/users/:user_id
func GetUser(c *gin.Context) {
	userID := c.Param("user_id")
	var u models.User
	if err := database.DB.Where("id = ?", userID).First(&u).Error; err != nil {
		c.JSON(http.StatusOK, gin.H{"success": false, "message": "用户不存在"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "data": userToDict(&u)})
}
