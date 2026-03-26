package models

import "time"

type Statistics struct {
	ID            string    `gorm:"primaryKey" json:"id"`
	Date          time.Time `json:"date"`
	TotalUsers    int       `gorm:"default:0" json:"total_users"`
	ActiveUsers   int       `gorm:"default:0" json:"active_users"`
	TotalVotes    int       `gorm:"default:0" json:"total_votes"`
	TotalComments int       `gorm:"default:0" json:"total_comments"`
	TotalLikes    int       `gorm:"default:0" json:"total_likes"`
	StreamID      *string   `json:"stream_id"`
	CreatedAt     time.Time `json:"created_at"`
}
