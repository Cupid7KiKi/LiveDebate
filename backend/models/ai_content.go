package models

import "time"

type AIContent struct {
	ID        string    `gorm:"primaryKey" json:"id"`
	StreamID  *string   `json:"stream_id"`
	Content   string    `gorm:"not null" json:"content"`
	Type      string    `gorm:"default:recognition" json:"type"`
	Likes     int       `gorm:"default:0" json:"likes"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type Comment struct {
	ID        string    `gorm:"primaryKey" json:"id"`
	ContentID string    `gorm:"not null" json:"content_id"`
	User      string    `gorm:"default:匿名用户" json:"user"`
	Text      string    `gorm:"not null" json:"text"`
	Avatar    string    `gorm:"default:''" json:"avatar"`
	Likes     int       `gorm:"default:0" json:"likes"`
	CreatedAt time.Time `json:"created_at"`
}

type Like struct {
	ID        string    `gorm:"primaryKey" json:"id"`
	ContentID string    `gorm:"not null" json:"content_id"`
	CommentID *string   `json:"comment_id"`
	UserID    *string   `json:"user_id"`
	CreatedAt time.Time `json:"created_at"`
}
