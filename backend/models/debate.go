package models

import "time"

type DebateTopic struct {
	ID            string    `gorm:"primaryKey" json:"id"`
	StreamID      *string   `json:"stream_id"`
	Title         string    `gorm:"default:''" json:"title"`
	Description   string    `json:"description"`
	LeftSide      string    `gorm:"default:正方" json:"left_side"`
	RightSide     string    `gorm:"default:反方" json:"right_side"`
	LeftPosition  string    `gorm:"default:''" json:"left_position"`
	RightPosition string    `gorm:"default:''" json:"right_position"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}
