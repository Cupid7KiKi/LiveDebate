package models

import "time"

type Stream struct {
	ID          string     `gorm:"primaryKey" json:"id"`
	Name        string     `gorm:"not null" json:"name"`
	URL         string     `gorm:"not null" json:"url"`
	Type        string     `gorm:"default:rtmp" json:"type"`
	Description string     `json:"description"`
	Enabled     bool       `gorm:"default:true" json:"enabled"`
	IsLive      bool       `gorm:"default:false" json:"is_live"`
	LiveID      *string    `json:"live_id"`
	StartTime   *time.Time `json:"start_time"`
	StopTime    *time.Time `json:"stop_time"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
}
