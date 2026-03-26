package handlers

import (
	"backend-go/database"
	"backend-go/models"
	"backend-go/services"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

func getDashboard(streamID string) gin.H {
	db := database.DB
	sid := services.ResolveStreamID(db, streamID)

	var totalUsers int64
	db.Model(&models.User{}).Count(&totalUsers)

	summary := services.GetOrCreateSummary(db, sid)

	var totalComments int64
	db.Model(&models.Comment{}).Count(&totalComments)

	var totalLikes int64
	db.Model(&models.Like{}).Count(&totalLikes)

	var debate interface{}
	var topic models.DebateTopic
	if err := db.Where("stream_id = ?", sid).First(&topic).Error; err == nil {
		debate = gin.H{
			"title":       topic.Title,
			"leftSide":    topic.LeftSide,
			"rightSide":   topic.RightSide,
			"description": topic.Description,
		}
	}

	// 查询具体 stream 的直播状态（而不是全局状态）
	// 确保管理端开启某个流的直播，不会影响其他流的页面
	isLive := false
	streamUrl := ""
	streamName := ""
	var startTime interface{}
	var returnStreamId interface{}

	var stream models.Stream
	if err := db.Where("id = ?", sid).First(&stream).Error; err == nil {
		isLive = stream.IsLive
		streamUrl = stream.URL
		streamName = stream.Name
		returnStreamId = stream.ID
		if stream.StartTime != nil {
			startTime = stream.StartTime.Format(time.RFC3339)
		}
	} else {
		// 如果是 "default" 或找不到具体 stream，回退到全局状态
		state := GetLiveState()
		isLive, _ = state["is_live"].(bool)
		streamUrl, _ = state["stream_url"].(string)
		streamName, _ = state["stream_name"].(string)
		startTime = state["start_time"]
		returnStreamId = state["stream_id"]
	}

	return gin.H{
		"success": true,
		"data": gin.H{
			"totalUsers":       totalUsers,
			"activeUsers":      services.Manager.ConnectionCount(),
			"isLive":           isLive,
			"liveStreamUrl":    streamUrl,
			"streamId":         returnStreamId,
			"activeStreamUrl":  streamUrl,
			"activeStreamId":   returnStreamId,
			"activeStreamName": streamName,
			"totalVotes":       summary.TotalVotes,
			"leftVotes":        summary.LeftVotes,
			"rightVotes":       summary.RightVotes,
			"leftPercentage":   summary.LeftPercentage,
			"rightPercentage":  summary.RightPercentage,
			"totalComments":    totalComments,
			"totalLikes":       totalLikes,
			"aiStatus":         "running",
			"debateTopic":      debate,
			"liveStartTime":    startTime,
			"liveDuration":     0,
		},
		"timestamp": time.Now().UnixMilli(),
	}
}

// GET /api/admin/dashboard, /api/v1/admin/dashboard
func AdminDashboard(c *gin.Context) {
	streamID := c.Query("stream_id")
	c.JSON(http.StatusOK, getDashboard(streamID))
}

// GET /api/admin/statistics/summary
func StatisticsSummary(c *gin.Context) {
	db := database.DB
	var totalUsers, totalComments, totalLikes int64
	db.Model(&models.User{}).Count(&totalUsers)
	db.Model(&models.Comment{}).Count(&totalComments)
	db.Model(&models.Like{}).Count(&totalLikes)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"totalUsers":    totalUsers,
			"totalComments": totalComments,
			"totalLikes":    totalLikes,
			"totalSessions": 1,
		},
	})
}

// GET /api/admin/statistics/daily
func StatisticsDaily(c *gin.Context) {
	days := 7
	if d := c.Query("days"); d != "" {
		if v := toInt(d); v > 0 {
			days = v
		}
	}

	today := time.Now()
	data := make([]gin.H, days)
	for i := 0; i < days; i++ {
		d := today.AddDate(0, 0, -(days - 1 - i))
		data[i] = gin.H{
			"date":     d.Format("2006-01-02"),
			"users":    0,
			"votes":    0,
			"comments": 0,
		}
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "data": data})
}
