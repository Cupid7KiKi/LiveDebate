package models

import "time"

type Vote struct {
	ID        string    `gorm:"primaryKey" json:"id"`
	UserID    *string   `json:"user_id"`
	StreamID  *string   `json:"stream_id"`
	LeftVotes  int      `gorm:"default:0" json:"left_votes"`
	RightVotes int      `gorm:"default:0" json:"right_votes"`
	CreatedAt time.Time `json:"created_at"`
}

type VoteSummary struct {
	ID              string    `gorm:"primaryKey" json:"id"`
	StreamID        *string   `gorm:"uniqueIndex" json:"stream_id"`
	LeftVotes       int       `gorm:"default:0" json:"left_votes"`
	RightVotes      int       `gorm:"default:0" json:"right_votes"`
	TotalVotes      int       `gorm:"default:0" json:"total_votes"`
	LeftPercentage  float64   `gorm:"default:50.0" json:"left_percentage"`
	RightPercentage float64   `gorm:"default:50.0" json:"right_percentage"`
	UpdatedAt       time.Time `json:"updated_at"`
}
