package models

import "time"

type User struct {
	ID        string     `gorm:"primaryKey" json:"id"`
	Openid    *string    `gorm:"uniqueIndex" json:"openid"`
	NickName  string     `gorm:"default:微信用户" json:"nick_name"`
	AvatarURL string     `gorm:"default:''" json:"avatar_url"`
	IsAdmin   bool       `gorm:"default:false" json:"is_admin"`
	Status    string     `gorm:"default:active" json:"status"`
	CreatedAt time.Time  `json:"created_at"`
	LastLogin time.Time  `json:"last_login"`
}
