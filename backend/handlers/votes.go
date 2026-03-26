package handlers

import (
	"backend-go/database"
	"backend-go/models"
	"backend-go/services"
	"math"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

func summaryToMap(s *models.VoteSummary) gin.H {
	return gin.H{
		"leftVotes":       s.LeftVotes,
		"rightVotes":      s.RightVotes,
		"totalVotes":      s.TotalVotes,
		"leftPercentage":  s.LeftPercentage,
		"rightPercentage": s.RightPercentage,
	}
}

// GET /api/v1/votes, /api/votes
func GetVotes(c *gin.Context) {
	streamID := c.Query("stream_id")
	db := database.DB
	sid := services.ResolveStreamID(db, streamID)
	summary := services.GetOrCreateSummary(db, sid)
	c.JSON(http.StatusOK, gin.H{"success": true, "data": summaryToMap(summary)})
}

// POST /api/v1/user-vote, /api/user-vote
func SubmitUserVote(c *gin.Context) {
	var body map[string]interface{}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusOK, gin.H{"success": false, "message": "参数错误"})
		return
	}

	var left, right int
	var streamID string
	var userID *string

	// Support wrapper format {request: {...}} and direct format
	if req, ok := body["request"].(map[string]interface{}); ok {
		left = toInt(req["leftVotes"])
		right = toInt(req["rightVotes"])
		streamID = toString(req["stream_id"])
		if streamID == "" {
			streamID = toString(req["streamId"])
		}
		if uid := toString(req["userId"]); uid != "" {
			userID = &uid
		}
	} else {
		left = toInt(body["leftVotes"])
		right = toInt(body["rightVotes"])
		streamID = toString(body["stream_id"])
		if streamID == "" {
			streamID = toString(body["streamId"])
		}
		if uid := toString(body["userId"]); uid != "" {
			userID = &uid
		}
	}

	db := database.DB
	streamID = services.ResolveStreamID(db, streamID)
	summary := services.SubmitVote(db, left, right, streamID, userID)
	c.JSON(http.StatusOK, gin.H{"success": true, "data": summaryToMap(summary)})
}

// GET /api/v1/user-votes
func GetUserVotes(c *gin.Context) {
	streamID := c.Query("stream_id")
	userIDParam := c.Query("user_id")
	db := database.DB
	sid := services.ResolveStreamID(db, streamID)

	query := db.Where("stream_id = ?", sid)
	if userIDParam != "" {
		query = query.Where("user_id = ?", userIDParam)
	}

	var vote models.Vote
	err := query.Order("created_at desc").First(&vote).Error
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"success": true, "data": gin.H{"leftVotes": 0, "rightVotes": 0}})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "data": gin.H{"leftVotes": vote.LeftVotes, "rightVotes": vote.RightVotes}})
}

// GET /api/v1/admin/votes/statistics, /api/admin/votes/statistics
func VoteStatistics(c *gin.Context) {
	streamID := c.Query("stream_id")
	db := database.DB
	sid := services.ResolveStreamID(db, streamID)
	summary := services.GetOrCreateSummary(db, sid)

	var votes []models.Vote
	db.Where("stream_id = ?", sid).Order("created_at desc").Limit(50).Find(&votes)

	timeline := make([]gin.H, 0)
	for i := len(votes) - 1; i >= 0; i-- {
		v := votes[i]
		timeline = append(timeline, gin.H{
			"timestamp":   v.CreatedAt.Format(time.RFC3339),
			"leftVotes":   v.LeftVotes,
			"rightVotes":  v.RightVotes,
			"totalVotes":  v.LeftVotes + v.RightVotes,
			"activeUsers": 1,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"summary": gin.H{
				"totalVotes":      summary.TotalVotes,
				"leftVotes":       summary.LeftVotes,
				"rightVotes":      summary.RightVotes,
				"leftPercentage":  summary.LeftPercentage,
				"rightPercentage": summary.RightPercentage,
				"growthRate":      0,
			},
			"timeline": timeline,
			"topVoters": []interface{}{},
		},
		"timestamp": time.Now().UnixMilli(),
	})
}

// GET /api/admin/votes
func AdminGetVotes(c *gin.Context) {
	GetVotes(c)
}

// PUT /api/admin/votes
func AdminUpdateVotes(c *gin.Context) {
	var body map[string]interface{}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusOK, gin.H{"success": false, "message": "参数错误"})
		return
	}

	streamID := toString(body["stream_id"])
	if streamID == "" {
		streamID = "default"
	}

	db := database.DB
	summary := services.GetOrCreateSummary(db, streamID)

	if v, ok := body["leftVotes"]; ok {
		summary.LeftVotes = toInt(v)
	}
	if v, ok := body["rightVotes"]; ok {
		summary.RightVotes = toInt(v)
	}
	summary.TotalVotes = summary.LeftVotes + summary.RightVotes
	if summary.TotalVotes > 0 {
		summary.LeftPercentage = math.Round(float64(summary.LeftVotes)/float64(summary.TotalVotes)*1000) / 10
		summary.RightPercentage = math.Round((100-summary.LeftPercentage)*10) / 10
	}
	db.Save(summary)
	c.JSON(http.StatusOK, gin.H{"success": true, "data": gin.H{"message": "更新成功"}})
}

// POST /api/admin/votes/reset
func AdminResetVotes(c *gin.Context) {
	var body map[string]interface{}
	c.ShouldBindJSON(&body)

	streamID := "default"
	if body != nil {
		if v := toString(body["stream_id"]); v != "" {
			streamID = v
		}
	}

	db := database.DB
	summary := services.GetOrCreateSummary(db, streamID)
	summary.LeftVotes = 0
	summary.RightVotes = 0
	summary.TotalVotes = 0
	summary.LeftPercentage = 50.0
	summary.RightPercentage = 50.0
	db.Save(summary)
	c.JSON(http.StatusOK, gin.H{"success": true, "data": gin.H{"message": "重置成功"}})
}

// POST /api/v1/admin/live/update-votes
func AdminLiveUpdateVotes(c *gin.Context) {
	var body map[string]interface{}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusOK, gin.H{"success": false, "message": "参数错误"})
		return
	}

	action := toString(body["action"])
	if action == "" {
		action = "set"
	}
	left := toInt(body["leftVotes"])
	right := toInt(body["rightVotes"])
	streamID := toString(body["streamId"])
	if streamID == "" {
		streamID = toString(body["stream_id"])
	}
	if streamID == "" {
		streamID = "default"
	}

	db := database.DB
	summary := services.GetOrCreateSummary(db, streamID)

	if action == "set" {
		summary.LeftVotes = left
		summary.RightVotes = right
	} else if action == "add" {
		summary.LeftVotes += left
		summary.RightVotes += right
	}

	summary.TotalVotes = summary.LeftVotes + summary.RightVotes
	if summary.TotalVotes > 0 {
		summary.LeftPercentage = math.Round(float64(summary.LeftVotes)/float64(summary.TotalVotes)*1000) / 10
		summary.RightPercentage = math.Round((100-summary.LeftPercentage)*10) / 10
	} else {
		summary.LeftPercentage = 50.0
		summary.RightPercentage = 50.0
	}
	db.Save(summary)

	services.Manager.Broadcast(map[string]interface{}{
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

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"leftVotes":       summary.LeftVotes,
			"rightVotes":      summary.RightVotes,
			"totalVotes":      summary.TotalVotes,
			"leftPercentage":  summary.LeftPercentage,
			"rightPercentage": summary.RightPercentage,
			"message":         "更新成功",
		},
	})
}

// POST /api/v1/admin/live/reset-votes
func AdminLiveResetVotes(c *gin.Context) {
	var body map[string]interface{}
	c.ShouldBindJSON(&body)

	streamID := toString(body["streamId"])
	if streamID == "" {
		streamID = toString(body["stream_id"])
	}
	if streamID == "" {
		streamID = "default"
	}

	resetTo, _ := body["resetTo"].(map[string]interface{})
	left := toInt(resetTo["leftVotes"])
	right := toInt(resetTo["rightVotes"])

	db := database.DB
	summary := services.GetOrCreateSummary(db, streamID)
	summary.LeftVotes = left
	summary.RightVotes = right
	summary.TotalVotes = left + right
	if summary.TotalVotes > 0 {
		summary.LeftPercentage = math.Round(float64(left)/float64(summary.TotalVotes)*1000) / 10
		summary.RightPercentage = math.Round((100-summary.LeftPercentage)*10) / 10
	} else {
		summary.LeftPercentage = 50.0
		summary.RightPercentage = 50.0
	}
	db.Save(summary)

	services.Manager.Broadcast(map[string]interface{}{
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

	c.JSON(http.StatusOK, gin.H{"success": true, "data": gin.H{"message": "重置成功"}})
}

// helpers
func toInt(v interface{}) int {
	if v == nil {
		return 0
	}
	switch val := v.(type) {
	case float64:
		return int(val)
	case int:
		return val
	case int64:
		return int(val)
	default:
		return 0
	}
}

func toString(v interface{}) string {
	if v == nil {
		return ""
	}
	if s, ok := v.(string); ok {
		return s
	}
	return ""
}
