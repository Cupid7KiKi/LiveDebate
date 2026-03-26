package services

import (
	"backend-go/models"
	"math"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

func GetOrCreateSummary(db *gorm.DB, streamID string) *models.VoteSummary {
	var summary models.VoteSummary
	result := db.Where("stream_id = ?", streamID).First(&summary)
	if result.Error != nil {
		summary = models.VoteSummary{
			ID:              uuid.New().String(),
			StreamID:        &streamID,
			LeftVotes:       0,
			RightVotes:      0,
			TotalVotes:      0,
			LeftPercentage:  50.0,
			RightPercentage: 50.0,
		}
		db.Create(&summary)
	}
	return &summary
}

func SubmitVote(db *gorm.DB, left, right int, streamID string, userID *string) *models.VoteSummary {
	vote := models.Vote{
		ID:         uuid.New().String(),
		UserID:     userID,
		StreamID:   &streamID,
		LeftVotes:  left,
		RightVotes: right,
	}
	db.Create(&vote)

	summary := GetOrCreateSummary(db, streamID)
	summary.LeftVotes += left
	summary.RightVotes += right
	summary.TotalVotes = summary.LeftVotes + summary.RightVotes
	if summary.TotalVotes > 0 {
		summary.LeftPercentage = math.Round(float64(summary.LeftVotes)/float64(summary.TotalVotes)*1000) / 10
		summary.RightPercentage = math.Round((100-summary.LeftPercentage)*10) / 10
	} else {
		summary.LeftPercentage = 50.0
		summary.RightPercentage = 50.0
	}
	db.Save(summary)

	Manager.Broadcast(map[string]interface{}{
		"type":     "votesUpdate",
		"streamId": streamID,
		"data": map[string]interface{}{
			"leftVotes":       summary.LeftVotes,
			"rightVotes":      summary.RightVotes,
			"totalVotes":      summary.TotalVotes,
			"leftPercentage":  summary.LeftPercentage,
			"rightPercentage": summary.RightPercentage,
		},
	})

	return summary
}
