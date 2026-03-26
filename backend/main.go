package main

import (
	"backend-go/database"
	"backend-go/handlers"
	"backend-go/ws"
	"log"
	"os"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	// Initialize database
	database.Init()

	gin.SetMode(gin.ReleaseMode)
	r := gin.Default()

	// CORS
	r.Use(cors.New(cors.Config{
		AllowAllOrigins:  true,
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"},
		AllowHeaders:     []string{"*"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// Root
	r.GET("/", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"success": true,
			"data":    gin.H{"message": "Live 直播辩论平台 API", "version": "1.0.0"},
		})
	})

	// WebSocket
	r.GET("/ws", ws.HandleWebSocket)

	// Static files
	staticDir := "../Live/static"
	if _, err := os.Stat(staticDir); err == nil {
		r.Static("/static", staticDir)
	}

	// ==================== Auth ====================
	r.POST("/api/wechat-login", handlers.WechatLogin)

	// ==================== Votes ====================
	r.GET("/api/v1/votes", handlers.GetVotes)
	r.GET("/api/votes", handlers.GetVotes)
	r.POST("/api/v1/user-vote", handlers.SubmitUserVote)
	r.POST("/api/user-vote", handlers.SubmitUserVote)
	r.GET("/api/v1/user-votes", handlers.GetUserVotes)
	r.GET("/api/v1/admin/votes/statistics", handlers.VoteStatistics)
	r.GET("/api/admin/votes/statistics", handlers.VoteStatistics)
	r.GET("/api/admin/votes", handlers.AdminGetVotes)
	r.PUT("/api/admin/votes", handlers.AdminUpdateVotes)
	r.POST("/api/admin/votes/reset", handlers.AdminResetVotes)
	r.POST("/api/v1/admin/live/update-votes", handlers.AdminLiveUpdateVotes)
	r.POST("/api/v1/admin/live/reset-votes", handlers.AdminLiveResetVotes)

	// ==================== Debate Topics ====================
	r.GET("/api/v1/debate-topic", handlers.GetDebateTopic)
	r.GET("/api/debate-topic", handlers.GetDebateTopic)
	r.GET("/api/admin/debate", handlers.GetDebateTopic)
	r.PUT("/api/admin/debate", handlers.AdminUpdateDebate)
	r.GET("/api/v1/admin/debate-topic", handlers.AdminGetDebateTopicV1)
	r.POST("/api/v1/admin/debates", handlers.CreateDebate)
	r.GET("/api/v1/admin/debates/:debate_id", handlers.GetDebateByID)
	r.PUT("/api/v1/admin/debates/:debate_id", handlers.UpdateDebateByID)

	// ==================== Streams ====================
	r.GET("/api/v1/admin/streams", handlers.GetStreams)
	r.POST("/api/admin/streams", handlers.CreateStream)
	r.POST("/api/v1/admin/streams", handlers.CreateStream)

	// Stream CRUD - need careful ordering to avoid route conflicts
	// Specific sub-resource routes first
	r.GET("/api/v1/admin/streams/:stream_id/debate", handlers.GetStreamDebate)
	r.PUT("/api/v1/admin/streams/:stream_id/debate", handlers.AssociateDebateToStream)
	r.DELETE("/api/v1/admin/streams/:stream_id/debate", handlers.DeleteStreamDebate)
	r.POST("/api/admin/streams/:stream_id/toggle", handlers.ToggleStream)
	r.POST("/api/v1/admin/streams/:stream_id/toggle", handlers.ToggleStream)

	// Generic stream routes
	r.GET("/api/admin/streams/:stream_id", handlers.GetStream)
	r.PUT("/api/admin/streams/:stream_id", handlers.UpdateStream)
	r.DELETE("/api/admin/streams/:stream_id", handlers.DeleteStream)
	r.GET("/api/v1/admin/streams/:stream_id", handlers.GetStream)
	r.PUT("/api/v1/admin/streams/:stream_id", handlers.UpdateStream)
	r.DELETE("/api/v1/admin/streams/:stream_id", handlers.DeleteStream)

	// ==================== AI Content ====================
	r.GET("/api/v1/ai-content", handlers.GetAIContent)
	r.GET("/api/ai-content", handlers.GetAIContent)
	r.GET("/api/v1/admin/ai-content/list", handlers.AdminListAIContent)
	r.GET("/api/admin/ai-content/list", handlers.AdminListAIContent)
	r.GET("/api/admin/ai-content", handlers.AdminListAIContent)
	r.POST("/api/admin/ai-content", handlers.AdminCreateAIContent)
	r.GET("/api/admin/ai-content/:content_id", handlers.AdminGetAIContent)
	r.PUT("/api/admin/ai-content/:content_id", handlers.AdminUpdateAIContent)
	r.DELETE("/api/admin/ai-content/:content_id", handlers.AdminDeleteAIContent)
	r.DELETE("/api/admin/ai/content/:content_id", handlers.AdminDeleteAIContent)

	// ==================== Comments & Likes ====================
	r.POST("/api/comment", handlers.AddComment)
	r.DELETE("/api/comment/:comment_id", handlers.DeleteComment)
	r.POST("/api/like", handlers.LikeContent)
	r.GET("/api/admin/ai-content/:content_id/comments", handlers.GetContentComments)
	r.GET("/api/v1/admin/ai-content/:content_id/comments", handlers.GetContentComments)
	r.DELETE("/api/v1/admin/ai-content/:content_id/comments/:comment_id", handlers.AdminDeleteComment)

	// ==================== Live Control ====================
	r.GET("/api/admin/live/status", handlers.GetLiveStatus)
	r.GET("/api/v1/admin/live/status", handlers.GetLiveStatus)
	r.POST("/api/admin/live/start", handlers.StartLive)
	r.POST("/api/v1/admin/live/start", handlers.StartLive)
	r.POST("/api/admin/live/stop", handlers.StopLive)
	r.POST("/api/v1/admin/live/stop", handlers.StopLive)
	r.POST("/api/admin/live/control", handlers.LiveControl)
	r.POST("/api/live/control", handlers.LiveControl)
	r.POST("/api/admin/live/setup-and-start", handlers.SetupAndStart)
	r.GET("/api/admin/rtmp/urls", handlers.GetRTMPUrls)
	r.POST("/api/admin/live/schedule", handlers.CreateSchedule)
	r.GET("/api/admin/live/schedule", handlers.GetSchedule)
	r.POST("/api/admin/live/schedule/cancel", handlers.CancelSchedule)

	// ==================== AI Control ====================
	r.POST("/api/v1/admin/ai/start", handlers.StartAI)
	r.POST("/api/v1/admin/ai/stop", handlers.StopAI)
	r.POST("/api/v1/admin/ai/toggle", handlers.ToggleAI)

	// ==================== Viewers ====================
	r.GET("/api/v1/admin/live/viewers", handlers.GetViewers)
	r.POST("/api/v1/admin/live/broadcast-viewers", handlers.BroadcastViewers)

	// ==================== Dashboard & Statistics ====================
	r.GET("/api/admin/dashboard", handlers.AdminDashboard)
	r.GET("/api/v1/admin/dashboard", handlers.AdminDashboard)
	r.GET("/api/admin/statistics/summary", handlers.StatisticsSummary)
	r.GET("/api/admin/statistics/daily", handlers.StatisticsDaily)

	// ==================== Users ====================
	r.GET("/api/admin/users", handlers.GetUsers)
	r.GET("/api/admin/miniprogram/users", handlers.GetUsers)
	r.GET("/api/admin/users/:user_id", handlers.GetUser)

	// ==================== Debate Flow & Judges ====================
	r.GET("/api/admin/debate-flow", handlers.GetDebateFlow)
	r.POST("/api/admin/debate-flow", handlers.SaveDebateFlow)
	r.POST("/api/admin/debate-flow/control", handlers.DebateFlowControl)
	r.GET("/api/v1/admin/judges", handlers.GetJudges)
	r.POST("/api/admin/judges", handlers.SaveJudges)

	log.Println("Live 直播辩论平台 API (Go/Gin) running on :8000")
	if err := r.Run(":8000"); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}
