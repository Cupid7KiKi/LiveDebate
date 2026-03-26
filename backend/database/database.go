package database

import (
	"backend-go/models"
	"log"
	"math"
	"time"

	"github.com/google/uuid"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

func Init() {
	var err error
	DB, err = gorm.Open(sqlite.Open("data.db"), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Warn),
	})
	if err != nil {
		log.Fatal("Failed to connect database:", err)
	}

	err = DB.AutoMigrate(
		&models.User{},
		&models.Stream{},
		&models.DebateTopic{},
		&models.Vote{},
		&models.VoteSummary{},
		&models.AIContent{},
		&models.Comment{},
		&models.Like{},
		&models.Statistics{},
	)
	if err != nil {
		log.Fatal("Failed to migrate:", err)
	}

	seedMockData()
}

func seedMockData() {
	var userCount int64
	DB.Model(&models.User{}).Count(&userCount)
	if userCount > 0 {
		return
	}

	log.Println("注入 Mock 数据...")
	now := time.Now()

	// 与Python版一致的本地视频URL
	videoURL := "http://1.15.95.154:8000/static/test-live.mp4"

	// ==================== 用户 ====================
	adminOpenid := "admin_openid_001"
	users := []models.User{
		{
			ID: uuid.New().String(), Openid: &adminOpenid,
			NickName: "管理员", AvatarURL: "https://api.dicebear.com/7.x/avataaars/svg?seed=admin",
			IsAdmin: true, Status: "active",
			CreatedAt: now.Add(-30 * 24 * time.Hour), LastLogin: now,
		},
	}
	mockUsers := []struct {
		openid, nickName, seed string
		daysAgo                int
	}{
		{"user_openid_001", "张三", "zhangsan", 25},
		{"user_openid_002", "李四", "lisi", 20},
		{"user_openid_003", "王五", "wangwu", 15},
		{"user_openid_004", "赵六", "zhaoliu", 10},
		{"user_openid_005", "钱七", "qianqi", 8},
		{"user_openid_006", "孙八", "sunba", 5},
		{"user_openid_007", "周九", "zhoujiu", 3},
		{"user_openid_008", "吴十", "wushi", 1},
	}
	for _, u := range mockUsers {
		openid := u.openid
		users = append(users, models.User{
			ID: uuid.New().String(), Openid: &openid,
			NickName: u.nickName, AvatarURL: "https://api.dicebear.com/7.x/avataaars/svg?seed=" + u.seed,
			IsAdmin: false, Status: "active",
			CreatedAt: now.Add(-time.Duration(u.daysAgo) * 24 * time.Hour),
			LastLogin: now.Add(-time.Duration(u.daysAgo/2) * 24 * time.Hour),
		})
	}
	for i := range users {
		DB.Create(&users[i])
	}
	log.Printf("  -> %d 个用户", len(users))

	// ==================== 直播流 (与Python版一致，使用本地视频) ====================
	stream1ID := uuid.New().String()
	stream2ID := uuid.New().String()
	stream3ID := uuid.New().String()

	streams := []models.Stream{
		{
			ID: stream1ID, Name: "主辩论直播间", URL: videoURL,
			Type: "hls", Description: "主辩论赛直播间，高清画质",
			Enabled: true, IsLive: false,
			CreatedAt: now.Add(-20 * 24 * time.Hour), UpdatedAt: now,
		},
		{
			ID: stream2ID, Name: "科技前沿辩论", URL: videoURL,
			Type: "hls", Description: "科技前沿话题辩论直播间",
			Enabled: true, IsLive: false,
			CreatedAt: now.Add(-15 * 24 * time.Hour), UpdatedAt: now,
		},
		{
			ID: stream3ID, Name: "教育改革辩论", URL: videoURL,
			Type: "hls", Description: "教育改革话题辩论直播间",
			Enabled: true, IsLive: false,
			CreatedAt: now.Add(-10 * 24 * time.Hour), UpdatedAt: now,
		},
	}
	for i := range streams {
		DB.Create(&streams[i])
	}
	log.Printf("  -> %d 个直播流", len(streams))

	// ==================== 辩题 (每个流一个) ====================
	debates := []models.DebateTopic{
		{
			ID: uuid.New().String(), StreamID: &stream1ID,
			Title: "AI是否会取代人类工作", Description: "探讨AI技术发展对就业市场的影响",
			LeftSide: "正方", RightSide: "反方",
			LeftPosition: "AI将大规模取代人类工作岗位，未来20年内47%的工作面临自动化风险",
			RightPosition: "AI只是工具，将创造更多新型工作机会，历史上每次技术革命都证明了这一点",
			CreatedAt: now.Add(-10 * 24 * time.Hour), UpdatedAt: now,
		},
		{
			ID: uuid.New().String(), StreamID: &stream2ID,
			Title: "基因编辑技术是否应该被允许", Description: "探讨基因编辑技术的伦理边界",
			LeftSide: "支持方", RightSide: "反对方",
			LeftPosition: "基因编辑可以消除遗传疾病、提升人类健康水平，镰刀细胞贫血症治疗成功率达92%",
			RightPosition: "基因编辑存在伦理风险，可能导致基因歧视和不可预见的后果",
			CreatedAt: now.Add(-5 * 24 * time.Hour), UpdatedAt: now,
		},
		{
			ID: uuid.New().String(), StreamID: &stream3ID,
			Title: "高考是否应该取消", Description: "探讨高考制度的存废问题",
			LeftSide: "取消派", RightSide: "保留派",
			LeftPosition: "高考制度过于单一，扼杀学生创造力，芬兰已取消统一考试且教育质量世界领先",
			RightPosition: "高考是最公平的人才选拔机制，取消后将加剧教育不公平",
			CreatedAt: now.Add(-2 * 24 * time.Hour), UpdatedAt: now,
		},
	}
	for i := range debates {
		DB.Create(&debates[i])
	}
	log.Printf("  -> %d 个辩题", len(debates))

	// ==================== 投票 (每个流都有大量投票，与Python版规模一致) ====================
	type voteData struct {
		streamID string
		userIdx  int
		left     int
		right    int
		hoursAgo int
	}

	var votesData []voteData
	// stream1: 总计约1000票 (487 vs 513)
	for i := 0; i < 50; i++ {
		userIdx := (i % 8) + 1
		l, r := 1, 0
		if i%100 >= 49 { // ~51% 投右
			l, r = 0, 1
		}
		votesData = append(votesData, voteData{stream1ID, userIdx, l * 10, r * 10, 200 - i*3})
	}
	// stream2: 总计约600票 (297 vs 303)
	for i := 0; i < 30; i++ {
		userIdx := (i % 8) + 1
		l, r := 1, 0
		if i%2 == 0 { // ~50% 投右
			l, r = 0, 1
		}
		votesData = append(votesData, voteData{stream2ID, userIdx, l * 10, r * 10, 150 - i*3})
	}
	// stream3: 总计约500票 (259 vs 241)
	for i := 0; i < 25; i++ {
		userIdx := (i % 8) + 1
		l, r := 1, 0
		if i%100 >= 52 { // ~48% 投右
			l, r = 0, 1
		}
		votesData = append(votesData, voteData{stream3ID, userIdx, l * 10, r * 10, 100 - i*3})
	}

	summaryMap := map[string]*models.VoteSummary{}
	for _, vd := range votesData {
		userID := users[vd.userIdx].ID
		sid := vd.streamID
		vote := models.Vote{
			ID: uuid.New().String(), UserID: &userID, StreamID: &sid,
			LeftVotes: vd.left, RightVotes: vd.right,
			CreatedAt: now.Add(-time.Duration(vd.hoursAgo) * time.Hour),
		}
		DB.Create(&vote)
		if _, ok := summaryMap[sid]; !ok {
			summaryMap[sid] = &models.VoteSummary{ID: uuid.New().String(), StreamID: &sid}
		}
		summaryMap[sid].LeftVotes += vd.left
		summaryMap[sid].RightVotes += vd.right
	}
	for _, s := range summaryMap {
		s.TotalVotes = s.LeftVotes + s.RightVotes
		if s.TotalVotes > 0 {
			s.LeftPercentage = math.Round(float64(s.LeftVotes)/float64(s.TotalVotes)*1000) / 10
			s.RightPercentage = math.Round((100-s.LeftPercentage)*10) / 10
		} else {
			s.LeftPercentage = 50.0
			s.RightPercentage = 50.0
		}
		DB.Create(s)
	}
	log.Printf("  -> %d 条投票记录, %d 个投票汇总", len(votesData), len(summaryMap))

	// ==================== AI 内容 (每个流都有) ====================
	aiContents := []struct {
		content, cType, streamID string
		hoursAgo                 int
	}{
		// stream1: AI是否取代人类工作
		{"正方辩手引用了牛津大学研究报告：未来20年内47%的工作岗位面临被自动化取代的风险，这是一个不可忽视的趋势。", "recognition", stream1ID, 48},
		{"反方辩手提出历史类比论证：工业革命时期也曾大规模淘汰手工业者，但最终创造了更多工作机会，人类的适应能力不容小觑。", "recognition", stream1ID, 47},
		{"正方继续引用数据：ChatGPT发布仅一年，已有数百万内容创作者、翻译和客服人员受到冲击，这次革命的速度前所未有。", "recognition", stream1ID, 46},
		{"反方反驳：AI无法替代需要创造力、情感交流和复杂道德判断的工作，人类的核心价值在于独特的思维能力。", "recognition", stream1ID, 45},
		{"AI检测到双方在'创造性工作是否可被替代'核心议题上产生了激烈交锋。正方强调速度和规模，反方强调人类独特性。", "analysis", stream1ID, 44},
		// stream2: 基因编辑
		{"支持方引用了镰刀细胞贫血症的基因治疗案例，临床试验成功率达到92%，这证明基因编辑技术可以拯救无数生命。", "recognition", stream2ID, 30},
		{"反对方指出基因编辑可能导致基因歧视，富人可以编辑后代基因获得优势，将加剧社会不平等。", "recognition", stream2ID, 29},
		{"支持方回应：技术本身是中性的，关键在于如何监管。我们不能因噎废食，放弃拯救生命的机会。", "recognition", stream2ID, 28},
		{"AI分析：双方争议焦点在于技术风险与医疗收益的平衡，监管框架是核心问题。", "analysis", stream2ID, 27},
		// stream3: 高考是否取消
		{"取消派辩手指出芬兰已取消统一考试多年，教育质量位居世界前列。保留派反驳国情不同，直接照搬不可行。", "recognition", stream3ID, 20},
		{"保留派强调：高考虽然不完美，但在中国国情下是最公平的选拔机制，取消后农村学生上升通道将更窄。", "recognition", stream3ID, 19},
		{"取消派提出替代方案：可以采用综合素质评价加多次考试的方式，减少一考定终身的压力。", "recognition", stream3ID, 18},
		{"AI总结：教育公平是双方共同关注的核心，分歧在于实现路径而非目标本身。", "analysis", stream3ID, 17},
	}

	aiIDs := make([]string, len(aiContents))
	for i, ac := range aiContents {
		sid := ac.streamID
		aiID := uuid.New().String()
		aiIDs[i] = aiID
		content := models.AIContent{
			ID: aiID, StreamID: &sid, Content: ac.content,
			Type: ac.cType, Likes: 0,
			CreatedAt: now.Add(-time.Duration(ac.hoursAgo) * time.Hour),
			UpdatedAt: now,
		}
		DB.Create(&content)
	}
	log.Printf("  -> %d 条AI内容", len(aiContents))

	// ==================== 评论 ====================
	commentsData := []struct {
		aiIdx, userIdx int
		text           string
		hoursAgo       int
	}{
		{0, 1, "说得太对了，我身边很多工厂已经在用机器人了", 47},
		{0, 3, "但是新的工作岗位也在不断出现啊", 46},
		{1, 2, "历史确实是这样的，蒸汽机时代也有类似的恐慌", 46},
		{1, 4, "但这次AI革命的速度比以往快得多", 45},
		{2, 5, "ChatGPT确实太强了，翻译行业已经受到很大冲击", 45},
		{3, 6, "创造力确实是人类独有的优势", 44},
		{3, 1, "但AI绘画和写作已经很厉害了", 43},
		{4, 7, "AI分析得很中肯，双方都有道理", 43},
		{5, 2, "基因治疗真的能救命，我支持", 29},
		{6, 3, "基因歧视是个很现实的问题", 28},
		{7, 4, "监管确实是关键", 27},
		{8, 5, "技术应该为人类服务", 26},
		{9, 6, "芬兰的教育模式确实值得学习", 19},
		{10, 7, "农村孩子确实需要高考这个通道", 18},
		{11, 1, "综合评价听起来不错，但操作难度大", 17},
		{12, 2, "AI总结得很到位", 16},
	}

	commentIDs := make([]string, len(commentsData))
	for i, cd := range commentsData {
		cID := uuid.New().String()
		commentIDs[i] = cID
		comment := models.Comment{
			ID: cID, ContentID: aiIDs[cd.aiIdx],
			User: users[cd.userIdx].NickName, Text: cd.text,
			Avatar: users[cd.userIdx].AvatarURL, Likes: 0,
			CreatedAt: now.Add(-time.Duration(cd.hoursAgo) * time.Hour),
		}
		DB.Create(&comment)
	}
	log.Printf("  -> %d 条评论", len(commentsData))

	// ==================== 点赞 ====================
	contentLikes := []struct{ aiIdx, userIdx int }{
		{0, 1}, {0, 2}, {0, 5}, {0, 7},
		{1, 3}, {1, 4}, {1, 6},
		{2, 1}, {2, 6}, {2, 7},
		{3, 2}, {3, 5}, {3, 6},
		{4, 1}, {4, 2}, {4, 3}, {4, 4}, {4, 8},
		{5, 5}, {5, 6}, {5, 1},
		{6, 2}, {6, 7},
		{7, 3}, {7, 4},
		{8, 1}, {8, 2}, {8, 3},
		{9, 4}, {9, 5}, {9, 6}, {9, 7},
		{10, 1}, {10, 8},
		{11, 2}, {11, 3},
		{12, 4}, {12, 5}, {12, 6}, {12, 7}, {12, 8},
	}
	for _, cl := range contentLikes {
		uid := users[cl.userIdx].ID
		DB.Create(&models.Like{
			ID: uuid.New().String(), ContentID: aiIDs[cl.aiIdx], UserID: &uid,
			CreatedAt: now.Add(-time.Duration(40-cl.aiIdx*2) * time.Hour),
		})
	}
	likeCounts := map[int]int{}
	for _, cl := range contentLikes {
		likeCounts[cl.aiIdx]++
	}
	for aiIdx, count := range likeCounts {
		DB.Model(&models.AIContent{}).Where("id = ?", aiIDs[aiIdx]).Update("likes", count)
	}

	commentLikesData := []struct{ commentIdx, userIdx int }{
		{0, 2}, {0, 4}, {1, 1}, {1, 5},
		{2, 3}, {3, 6}, {3, 7},
		{4, 1}, {4, 2}, {5, 3},
		{8, 4}, {9, 5}, {9, 6},
		{12, 1}, {12, 2}, {13, 3},
		{14, 4}, {15, 5}, {15, 6},
	}
	for _, cl := range commentLikesData {
		uid := users[cl.userIdx].ID
		DB.Create(&models.Like{
			ID: uuid.New().String(), ContentID: aiIDs[0],
			CommentID: &commentIDs[cl.commentIdx], UserID: &uid,
			CreatedAt: now.Add(-time.Duration(35) * time.Hour),
		})
	}
	commentLikeCounts := map[int]int{}
	for _, cl := range commentLikesData {
		commentLikeCounts[cl.commentIdx]++
	}
	for commentIdx, count := range commentLikeCounts {
		DB.Model(&models.Comment{}).Where("id = ?", commentIDs[commentIdx]).Update("likes", count)
	}

	log.Printf("  -> %d 个点赞 (内容%d + 评论%d)", len(contentLikes)+len(commentLikesData), len(contentLikes), len(commentLikesData))
	log.Println("Mock 数据注入完成!")
}
