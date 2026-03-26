package handlers

import (
	"backend-go/config"
	"backend-go/database"
	"backend-go/models"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

type wechatLoginRequest struct {
	Code          string                 `json:"code"`
	UserInfo      map[string]interface{} `json:"userInfo"`
	EncryptedData string                 `json:"encryptedData"`
	IV            string                 `json:"iv"`
}

func WechatLogin(c *gin.Context) {
	var req wechatLoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusOK, gin.H{"success": false, "message": "参数错误"})
		return
	}

	openid := req.Code
	if openid == "" {
		openid = uuid.New().String()
	}

	nickName := "微信用户"
	avatarURL := ""
	if req.UserInfo != nil {
		if v, ok := req.UserInfo["nickName"].(string); ok {
			nickName = v
		}
		if v, ok := req.UserInfo["avatarUrl"].(string); ok {
			avatarURL = v
		}
	}

	db := database.DB
	var user models.User
	result := db.Where("openid = ?", openid).First(&user)

	if result.Error != nil {
		user = models.User{
			ID:        uuid.New().String(),
			Openid:    &openid,
			NickName:  nickName,
			AvatarURL: avatarURL,
			Status:    "active",
			CreatedAt: time.Now(),
			LastLogin: time.Now(),
		}
		db.Create(&user)
	} else {
		user.NickName = nickName
		user.AvatarURL = avatarURL
		user.LastLogin = time.Now()
		db.Save(&user)
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub": user.ID,
		"exp": time.Now().Add(time.Duration(config.JWTExpireHours) * time.Hour).Unix(),
	})
	tokenStr, _ := token.SignedString([]byte(config.JWTSecret))

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"token": tokenStr,
			"user": gin.H{
				"id":        user.ID,
				"nickName":  user.NickName,
				"avatarUrl": user.AvatarURL,
			},
		},
	})
}
