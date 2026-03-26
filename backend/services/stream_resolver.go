package services

import (
	"backend-go/models"

	"gorm.io/gorm"
)

func ResolveStreamID(db *gorm.DB, streamID string) string {
	if streamID != "" {
		return streamID
	}

	var s models.Stream

	// 找正在直播的流
	if err := db.Where("is_live = ?", true).First(&s).Error; err == nil {
		return s.ID
	}

	// 找第一个启用的流
	if err := db.Where("enabled = ?", true).Order("created_at asc").First(&s).Error; err == nil {
		return s.ID
	}

	// 找任意流
	if err := db.Order("created_at asc").First(&s).Error; err == nil {
		return s.ID
	}

	return "default"
}
