"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_apiService = require("../../utils/api-service.js");
const config_serverMode = require("../../config/server-mode.js");
const common_assets = require("../../common/assets.js");
const PopDecoration = () => "../../components/PopDecoration.js";
const _sfc_main = {
  components: {
    PopDecoration
  },
  data() {
    return {
      statusBarHeight: 0,
      isLiveCollapsed: false,
      // 多直播支持 - 当前直播间ID
      streamId: null,
      // 当前直播间的ID，从URL参数获取
      // 直播流地址 - 需要配置真实的直播推流地址
      liveStreamUrl: "",
      // rtmp://xxx 或 https://xxx.m3u8
      isMuted: false,
      // 是否静音
      liveStatus: "",
      // 直播状态
      // 顶部对抗条数据（实时统计，不受用户操作影响）
      topLeftVotes: 0,
      topRightVotes: 0,
      // 底部对抗条数据（用户操作，点击投票改变）
      leftVotes: 0,
      rightVotes: 0,
      userVote: null,
      leftClickCount: 0,
      // 正方按钮点击次数
      rightClickCount: 0,
      // 反方按钮点击次数
      triggerEffect: null,
      // 触发特效状态
      voteEffects: [],
      // 投票特效数组
      effectIdCounter: 0,
      // 特效ID计数器
      dividerHit: false,
      // 分割线被击中状态
      xiangsuIcons: [
        // 祥素图标列表
        "/static/xiangsu/xiangsu_aixin.png",
        "/static/xiangsu/xiangsu_biaoqing.png",
        "/static/xiangsu/xiangsu_caomei.png",
        "/static/xiangsu/xiangsu_fangzi.png",
        "/static/xiangsu/xiangsu_jiangbei.png",
        "/static/xiangsu/xiangsu_jinbi.png",
        "/static/xiangsu/xiangsu_mao.png",
        "/static/xiangsu/xiangsu_pijiu.png",
        "/static/xiangsu/xiangsu_tuzi.png",
        "/static/xiangsu/xiangsu_wuqi.png",
        "/static/xiangsu/xiangsu_xiaoya.png",
        "/static/xiangsu/xiangsu_youxiji.png",
        "/static/xiangsu/xiangsu_zuanshi.png",
        "/static/xiangsu/xiangsu-denglong.png",
        "/static/xiangsu/xiangsu-hanbao.png",
        "/static/xiangsu/xiangsu-hongyingwu.png",
        "/static/xiangsu/xiangsu-huangsehua.png",
        "/static/xiangsu/xiangsu-huomiao.png",
        "/static/xiangsu/xiangsu-huoyan.png",
        "/static/xiangsu/xiangsu-kouzhao.png",
        "/static/xiangsu/xiangsu-lvsehudie.png",
        "/static/xiangsu/xiangsu-maliao.png",
        "/static/xiangsu/xiangsu-mifeng-01.png",
        "/static/xiangsu/xiangsu-pisa.png",
        "/static/xiangsu/xiangsu-xingqiu.png",
        "/static/xiangsu/xiangsu-xuehua.png",
        "/static/xiangsu/xiangsu-zhadan.png",
        "/static/xiangsu/xiangsu-zhaji.png",
        "/static/xiangsu/xiangsu-zhongguojie.png",
        "/static/xiangsu/xiangsu-zipitang-01.png",
        "/static/xiangsu/xiangsu-zisehua.png",
        "/static/xiangsu/xiangsu-zisehudie.png",
        "/static/xiangsu/xiangsufeng_dangao.png",
        "/static/xiangsu/xiangsufeng_dianshiji.png",
        "/static/xiangsu/xiangsufeng_fangzi.png",
        "/static/xiangsu/xiangsufeng_feidie.png",
        "/static/xiangsu/xiangsufeng_huapen.png",
        "/static/xiangsu/xiangsufeng_shouyinji.png",
        "/static/xiangsu/xiangsufeng_xianhua.png",
        "/static/xiangsu/xiangsufeng_xiaoxi.png",
        "/static/xiangsu/xiangsufeng_xinfeng.png",
        "/static/xiangsu/xiangsufeng_xunzhang.png",
        "/static/xiangsu/huwenmao.png",
        "/static/xiangsu/yumi-daipi.png"
      ],
      // 直播状态和预设观点相关
      isLiveStarted: false,
      // 直播是否已开始
      presetOpinion: 50,
      // 预设观点倾向 (0-100, 初始50表示50%票数投正方，50%投反方)
      showPresetSlider: true,
      // 是否显示预设滑块
      showPresetPanel: true,
      // 是否显示预设观点面板（直播开始后可通过按钮控制）
      isValueChanging: false,
      // 数值变化动画状态
      initialLeftVotes: 0,
      // 初始正方票数
      initialRightVotes: 0,
      // 初始反方票数
      initialVotesSubmitted: false,
      // 是否已提交初始100票
      initialVotesTotal: 100,
      // 初始总票数（100票）
      presetSliderChanged: false,
      // 预设滑块是否有变化（直播开始后拖动时使用）
      votesChanged: false,
      // 票数是否有变化（无论是拖动进度条还是点击投票按钮）
      debateTitle: "",
      // 辩题标题--始终为空，后端动态取
      currentDebateTopic: "",
      // 当前辩题--始终为空，后端动态取
      debateDescription: "",
      // 描述
      // 预设观点对抗条数据（显示用户预设倾向）
      presetLeftVotes: 0,
      // 预设正方票数
      presetRightVotes: 0,
      // 预设反方票数
      // 百分数变化提示
      showPercentageTip: false,
      // 是否显示百分数变化提示
      percentageTipText: "",
      // 提示文字
      percentageTipClass: "",
      // 提示样式类
      // AI语音识别相关数据
      isListening: true,
      // 是否正在监听
      aiMessages: [],
      // AI对话消息列表
      scrollTop: 0,
      // 滚动位置
      messageIdCounter: 0,
      // 消息ID计数器
      showModal: false,
      // 是否显示弹窗
      selectedMessage: null,
      // 当前选中的消息
      // 评论弹窗相关
      showCommentModal: false,
      commentText: "",
      commentPlaceholder: "请输入您对这条AI总结的评论...",
      currentCommentMessage: null,
      // AI对话数据现在从服务器获取
      // 定时器引用
      recognitionTimer: null,
      liveStatusPollingTimer: null,
      // 直播状态轮询定时器
      // 服务器配置
      // API配置相关
      serverUrl: "",
      // 当前使用的服务器地址（由API服务层管理）
      apiServerInfo: null,
      // 当前API服务器信息
      availableServers: [],
      // 可用的服务器列表
      topBarUpdateTimer: null,
      // 顶部对抗条更新定时器
      // 性能优化相关
      isVoting: false,
      // 是否正在处理投票（防抖）
      voteQueue: [],
      // 投票队列
      lastVoteTime: 0,
      // 上次投票时间
      lastLeftVoteTime: 0,
      // 上次左侧投票时间
      lastRightVoteTime: 0,
      // 上次右侧投票时间
      isDividerHitInProgress: false,
      // 分割线特效是否在进行中
      isEffectCreating: false,
      // 特效是否在创建中
      isToastShowing: false,
      // Toast是否显示中
      updatePresetOpinionTimeout: null,
      // 预设观点更新定时器
      effectTimeouts: [],
      // 特效超时ID列表
      fetchVoteDataTimeout: null,
      // 获取票数数据的防抖定时器
      // 性能监控
      performanceStats: {
        voteCount: 0,
        avgResponseTime: 0,
        lastResponseTime: 0
      },
      // 特效性能优化
      maxConcurrentEffects: 30,
      // 最大同时特效数量
      effectCleanupInterval: null,
      // 特效清理定时器
      lastEffectCleanup: 0,
      // 上次清理时间
      // WebSocket 连接
      socketTask: null,
      // WebSocket连接实例
      wsReconnectTimer: null,
      // WebSocket重连定时器
      wsHeartbeatTimer: null,
      // WebSocket心跳定时器
      wsReconnectAttempts: 0,
      // WebSocket重连次数
      wsMaxReconnectAttempts: 5,
      // WebSocket最大重连次数
      // ==================== HLS 播放器配置 ====================
      hlsConfig: {
        // 缓冲区配置（单位：秒）
        minCache: 1,
        // 最小缓冲区，减少延迟
        maxCache: 3,
        // 最大缓冲区，保证流畅
        // 画面方向 (vertical: 竖屏, horizontal: 横屏)
        orientation: "vertical",
        // 画中画模式 ([] 表示禁用)
        pipMode: [],
        // 声音输出方式 (speaker: 扬声器, ear: 听筒)
        soundMode: "speaker"
      },
      // HLS 播放状态
      hlsStatus: {
        show: false,
        // 是否显示状态提示
        message: "",
        // 状态消息
        type: "info",
        // 状态类型: info / success / warning / error
        code: 0,
        // 状态码
        connectTime: 0
        // 连接时间
      },
      // HLS 网络质量监控
      hlsNetQuality: {
        videoBitrate: 0,
        // 视频码率 (kbps)
        audioBitrate: 0,
        // 音频码率 (kbps)
        videoFPS: 0,
        // 视频帧率
        videoGOP: 0,
        // 视频GOP
        netSpeed: 0,
        // 网络速度 (kbps)
        netJitter: 0,
        // 网络抖动 (ms)
        videoWidth: 0,
        // 视频宽度
        videoHeight: 0
        // 视频高度
      },
      // HLS 自动重连配置
      hlsReconnect: {
        enabled: true,
        // 是否启用自动重连
        attempts: 0,
        // 当前重连次数
        maxAttempts: 3,
        // 最大重连次数
        delay: 3e3,
        // 重连延迟 (ms)
        timer: null,
        // 重连定时器
        exponentialBackoff: true
        // 是否使用指数退避
      },
      // HLS 质量统计
      hlsStats: {
        totalPlayTime: 0,
        // 总播放时长 (秒)
        bufferingCount: 0,
        // 卡顿次数
        bufferingTime: 0,
        // 卡顿总时长 (秒)
        errorCount: 0,
        // 错误次数
        lastErrorTime: 0,
        // 最后错误时间
        startTime: 0
        // 开始播放时间
      }
    };
  },
  computed: {
    // 顶部对抗条计算属性（实时统计）
    topTotalVotes() {
      return this.topLeftVotes + this.topRightVotes;
    },
    topLeftPercentage() {
      return this.topTotalVotes > 0 ? Math.round(this.topLeftVotes / this.topTotalVotes * 100) : 50;
    },
    topRightPercentage() {
      return this.topTotalVotes > 0 ? Math.round(this.topRightVotes / this.topTotalVotes * 100) : 50;
    },
    // 底部对抗条计算属性（用户操作）
    totalVotes() {
      return this.leftVotes + this.rightVotes;
    },
    leftPercentage() {
      return this.totalVotes > 0 ? Math.round(this.leftVotes / this.totalVotes * 100) : 50;
    },
    rightPercentage() {
      return this.totalVotes > 0 ? Math.round(this.rightVotes / this.totalVotes * 100) : 50;
    },
    // 预设观点对抗条计算属性（显示用户预设倾向）
    presetTotalVotes() {
      return this.presetLeftVotes + this.presetRightVotes;
    },
    presetLeftPercentage() {
      return this.presetOpinion;
    },
    presetRightPercentage() {
      return 100 - this.presetOpinion;
    },
    // 当前对抗条计算属性（根据直播状态决定数据源）
    currentLeftPercentage() {
      return this.isLiveStarted ? this.leftPercentage : this.presetLeftPercentage;
    },
    currentRightPercentage() {
      return this.isLiveStarted ? this.rightPercentage : this.presetRightPercentage;
    }
  },
  onLoad(options) {
    if (options && options.streamId) {
      this.streamId = options.streamId;
    }
    this.initApiService();
    this.getSystemInfo();
    if (typeof this.updateInitialVotes === "function")
      this.updateInitialVotes();
    this.updatePresetBattleBar();
    this.startEffectCleanup();
    this.fetchDebateTopic();
    this.fetchUserVoteRecord();
    if (!this.liveStreamUrl) {
      setTimeout(async () => {
        var _a, _b;
        try {
          const service = this.apiService || utils_apiService.apiService;
          if (service) {
            if (this.streamId) {
              try {
                const streams = await service.getStreamsList();
                const targetStream = streams.find((s) => s.id === this.streamId);
                if (targetStream) {
                  const streamUrl = ((_a = targetStream.playUrls) == null ? void 0 : _a.hls) || targetStream.url;
                  await this.setLiveStreamUrlWithHls(streamUrl, targetStream.name);
                  if ((_b = targetStream.playUrls) == null ? void 0 : _b.hls) {
                  } else {
                  }
                } else {
                }
              } catch (error) {
              }
            } else {
              try {
                const dashboardData = await service.getDashboard(this.streamId);
                if (dashboardData) {
                  const streamUrl = dashboardData.liveStreamUrl || dashboardData.activeStreamUrl;
                  if (streamUrl) {
                    await this.setLiveStreamUrlWithHls(streamUrl, dashboardData.activeStreamName);
                    if (dashboardData.activeStreamName) {
                    }
                  } else {
                  }
                }
              } catch (dashboardError) {
                try {
                  const streamUrl = await this.fetchActiveStreamFromServerAlternative();
                  if (streamUrl) {
                    await this.setLiveStreamUrlWithHls(streamUrl);
                  }
                } catch (streamsError) {
                }
              }
            }
          }
        } catch (error) {
        }
      }, 500);
    }
    this.fetchLiveStatus().then(() => {
      setTimeout(() => {
        if (this.streamId && (this.topLeftVotes === 0 && this.topRightVotes === 0)) {
          this.fetchTopBarVotes();
        }
      }, 200);
    });
    setTimeout(() => {
      if (this.streamId) {
        this.fetchTopBarVotes();
        this.startTopBarRealTimeUpdate();
      } else {
        setTimeout(() => {
          if (this.streamId) {
            this.fetchTopBarVotes();
            this.startTopBarRealTimeUpdate();
          }
        }, 500);
      }
    }, 300);
    this.startLiveStatusPolling();
    this.connectWebSocket();
  },
  onShow() {
    this.fetchDebateTopic();
    this.fetchLiveStatus();
    if (this.streamId) {
      this.fetchTopBarVotes();
    }
  },
  onUnload() {
    if (this.recognitionTimer) {
      clearInterval(this.recognitionTimer);
      this.recognitionTimer = null;
    }
    if (this.topBarSimulationTimer) {
      clearInterval(this.topBarSimulationTimer);
      this.topBarSimulationTimer = null;
    }
    if (this.topBarUpdateTimer) {
      clearInterval(this.topBarUpdateTimer);
      this.topBarUpdateTimer = null;
    }
    if (this.liveStatusPollingTimer) {
      clearInterval(this.liveStatusPollingTimer);
      this.liveStatusPollingTimer = null;
    }
    this.stopEffectCleanup();
    if (this.effectTimeouts) {
      this.effectTimeouts.forEach((timeoutId) => {
        clearTimeout(timeoutId);
      });
      this.effectTimeouts = [];
    }
    this.disconnectWebSocket();
    if (this.fetchVoteDataTimeout) {
      clearTimeout(this.fetchVoteDataTimeout);
      this.fetchVoteDataTimeout = null;
    }
  },
  onReady() {
    this.setSafeArea();
    setTimeout(() => {
      this.initButtonAnimations();
    }, 1e3);
    setTimeout(() => {
      this.initFireAnimation();
    }, 1500);
  },
  methods: {
    // ==================== 播放器配置方法 ====================
    /**
     * 根据流格式获取播放器模式
     * - RTMP 格式：使用 "live" 模式
     * - FLV 格式：使用 "RTC" 模式（重要！）
     * - HLS 格式：使用 "RTC" 模式
     */
    getPlayerMode() {
      if (this.liveStreamUrl) {
        if (this.liveStreamUrl.includes(".flv")) {
          return "RTC";
        } else if (this.liveStreamUrl.includes("rtmp://")) {
          return "live";
        } else if (this.liveStreamUrl.includes(".m3u8")) {
          return "RTC";
        }
      }
      return "RTC";
    },
    /**
     * 根据流格式获取最小缓冲时间
     * FLV 格式延迟较小（推荐1-2秒）
     * HLS 格式延迟较大（推荐2-3秒）
     */
    getPlayerMinCache() {
      if (this.liveStreamUrl && this.liveStreamUrl.includes(".flv")) {
        return 1;
      }
      return 2;
    },
    /**
     * 根据流格式获取最大缓冲时间
     */
    getPlayerMaxCache() {
      if (this.liveStreamUrl && this.liveStreamUrl.includes(".flv")) {
        return 3;
      }
      return 5;
    },
    // 初始化API服务
    async initApiService() {
      try {
        this.apiService = utils_apiService.apiService;
        const configUrl = config_serverMode.API_BASE_URL || "http://192.168.31.249:8081";
        utils_apiService.apiService.updateConfig(configUrl);
        this.apiServerInfo = utils_apiService.apiService.getCurrentServerInfo();
        this.serverUrl = configUrl;
        this.availableServers = this.apiServerInfo.available;
        this.apiService = utils_apiService.apiService;
      } catch (error) {
      }
    },
    // ==================== HLS转换辅助方法 ====================
    /**
     * 智能设置流地址（自动转换为HLS格式）
     * @param {string} streamUrl - 原始流地址
     * @param {string} streamName - 流名称（可选，用于提取房间名）
     * @returns {Promise<boolean>} 是否成功设置流地址
     */
    async setLiveStreamUrlWithHls(streamUrl, streamName = null) {
      if (!streamUrl) {
        return false;
      }
      try {
        const service = this.apiService || utils_apiService.apiService;
        if (streamUrl.includes(".m3u8")) {
          let hlsUrl = streamUrl;
          if (hlsUrl.includes("localhost")) {
            const apiBaseUrl = service.baseURL || config_serverMode.API_BASE_URL;
            const serverIpMatch = apiBaseUrl.match(/https?:\/\/([^:\/]+)/);
            const serverIp = serverIpMatch ? serverIpMatch[1] : "192.168.31.189";
            hlsUrl = hlsUrl.replace("localhost", serverIp);
          }
          if (streamName && hlsUrl.includes(".m3u8")) {
            const urlParts = hlsUrl.split("/");
            const currentFileName = urlParts[urlParts.length - 1];
            const correctFileName = `${streamName}.m3u8`;
            if (currentFileName !== correctFileName) {
              const oldUrl = hlsUrl;
              hlsUrl = hlsUrl.replace(currentFileName, correctFileName);
              common_vendor.index.showToast({
                title: `已自动修正为 ${streamName} 流`,
                icon: "success",
                duration: 2e3
              });
            }
          }
          if (hlsUrl.includes("192.168.31.189:8086")) {
            const middlewareServerUrl = "http://192.168.31.249:8081";
            const originalUrl = hlsUrl;
            hlsUrl = hlsUrl.replace("http://192.168.31.189:8086", middlewareServerUrl);
          }
          this.liveStreamUrl = hlsUrl;
          return true;
        }
        if (streamUrl.startsWith("rtmp://") || streamUrl.includes(".flv")) {
          try {
            const hlsUrl = await service.convertToHlsIfNeeded(streamUrl, streamName);
            if (hlsUrl) {
              this.liveStreamUrl = hlsUrl;
              if (!this.isLiveStarted && this.liveStreamUrl) {
              }
              return true;
            } else {
              this.liveStreamUrl = streamUrl;
              return false;
            }
          } catch (conversionError) {
            common_vendor.index.showToast({
              title: "HLS转换失败: " + (conversionError.message || "未知错误"),
              icon: "none",
              duration: 3e3
            });
            this.liveStreamUrl = streamUrl;
            return false;
          }
        }
        this.liveStreamUrl = streamUrl;
        return true;
      } catch (error) {
        return false;
      }
    },
    // 获取直播状态（通过 dashboard 接口）
    async fetchLiveStatus() {
      try {
        const service = this.apiService || utils_apiService.apiService;
        if (!service) {
          return;
        }
        const dashboardData = await service.getDashboard(this.streamId);
        if (dashboardData) {
          const responseStreamId = dashboardData.streamId || dashboardData.liveId;
          if (this.streamId && responseStreamId && responseStreamId !== this.streamId) {
            return;
          }
          if (dashboardData.leftVotes !== void 0 && dashboardData.rightVotes !== void 0) {
            if (!this.streamId || !responseStreamId || responseStreamId === this.streamId) {
              this.topLeftVotes = dashboardData.leftVotes || 0;
              this.topRightVotes = dashboardData.rightVotes || 0;
            }
          }
          if (dashboardData.isLive !== void 0) {
            const wasLive = this.isLiveStarted;
            const nowLive = dashboardData.isLive;
            const streamUrl = dashboardData.liveStreamUrl || dashboardData.activeStreamUrl;
            if (streamUrl) {
              await this.setLiveStreamUrlWithHls(streamUrl, dashboardData.activeStreamName);
            }
            if (nowLive && !wasLive) {
              if (!this.liveStreamUrl && dashboardData.liveStreamUrl) {
                this.liveStreamUrl = dashboardData.liveStreamUrl;
              }
              if (!this.liveStreamUrl) {
                await this.fetchActiveStreamFromServer();
              }
              this.$nextTick(async () => {
                if (this.liveStreamUrl && this.liveStreamUrl.startsWith("rtmp://")) {
                  common_vendor.index.showToast({
                    title: "RTMP流需要转换为HLS格式",
                    icon: "none",
                    duration: 3e3
                  });
                  this.isLiveStarted = true;
                } else if (this.liveStreamUrl) {
                  this.isLiveStarted = true;
                  common_vendor.index.showToast({
                    title: "直播已开始",
                    icon: "success",
                    duration: 2e3
                  });
                  setTimeout(() => {
                    this.startAIContentAfterLiveStart();
                  }, 1e3);
                } else {
                  this.isLiveStarted = true;
                }
              });
            } else if (nowLive && wasLive) {
              if (!this.isLiveStarted) {
                this.isLiveStarted = true;
              }
              if (!this.liveStreamUrl && streamUrl) {
                await this.setLiveStreamUrlWithHls(streamUrl, dashboardData.activeStreamName);
              }
            } else if (!nowLive && wasLive) {
              this.isLiveStarted = false;
              common_vendor.index.showToast({
                title: "直播已结束，即将返回",
                icon: "none",
                duration: 2e3
              });
              setTimeout(() => {
                common_vendor.index.redirectTo({
                  url: "/pages/live-select/live-select",
                  success: () => {
                  },
                  fail: (err) => {
                    common_vendor.index.navigateBack({
                      delta: 1,
                      fail: () => {
                        common_vendor.index.navigateTo({
                          url: "/pages/live-select/live-select"
                        });
                      }
                    });
                  }
                });
              }, 1500);
            } else {
              if (nowLive !== wasLive) {
                this.isLiveStarted = nowLive;
                if (nowLive && typeof this.startAIContentAfterLiveStart === "function") {
                  setTimeout(() => {
                    this.startAIContentAfterLiveStart();
                  }, 1e3);
                }
              }
              if (nowLive && this.isLiveStarted && this.liveStreamUrl) {
                if (!this.recognitionTimer && typeof this.startAIContentRealTimeUpdate === "function") {
                  setTimeout(() => {
                    this.startAIContentAfterLiveStart();
                  }, 1e3);
                }
              }
            }
          }
        }
      } catch (error) {
      }
    },
    // 启动直播状态轮询（作为WebSocket的备用方案）
    startLiveStatusPolling() {
      if (this.liveStatusPollingTimer) {
        clearInterval(this.liveStatusPollingTimer);
      }
      this.liveStatusPollingTimer = setInterval(() => {
        this.fetchLiveStatus();
      }, 5e3);
    },
    // 停止直播状态轮询
    stopLiveStatusPolling() {
      if (this.liveStatusPollingTimer) {
        clearInterval(this.liveStatusPollingTimer);
        this.liveStatusPollingTimer = null;
      }
    },
    // 从服务器获取启用的直播流地址（优先使用 dashboard 接口）
    async fetchActiveStreamFromServer() {
      try {
        const service = this.apiService || utils_apiService.apiService;
        if (!service) {
          return null;
        }
        try {
          const dashboardData = await service.getDashboard(this.streamId);
          if (dashboardData) {
            const streamUrl = dashboardData.liveStreamUrl || dashboardData.activeStreamUrl;
            if (streamUrl) {
              await this.setLiveStreamUrlWithHls(streamUrl, dashboardData.activeStreamName);
              if (dashboardData.activeStreamName) {
              }
              return this.liveStreamUrl;
            }
          }
        } catch (dashboardError) {
          const statusResponse = await service.getLiveStatus();
          if (statusResponse) {
            const streamUrl = statusResponse.streamUrl || statusResponse.activeStreamUrl;
            if (streamUrl) {
              await this.setLiveStreamUrlWithHls(streamUrl, statusResponse.activeStreamName);
              if (statusResponse.activeStreamName) {
              }
              return this.liveStreamUrl;
            }
          }
        }
      } catch (error) {
        if (error.message && error.message.includes("404")) {
          return await this.fetchActiveStreamFromServerAlternative();
        }
      }
      return null;
    },
    // 备用方案：通过直播流列表接口获取启用直播流（如果 /api/admin/live/status 不存在）
    async fetchActiveStreamFromServerAlternative() {
      var _a, _b;
      try {
        const service = this.apiService || utils_apiService.apiService;
        if (!service) {
          return null;
        }
        const streamsResponse = await service.request({
          url: "/api/admin/streams",
          method: "GET"
        });
        let streams = [];
        if (streamsResponse && streamsResponse.success && streamsResponse.data) {
          if (Array.isArray(streamsResponse.data.streams)) {
            streams = streamsResponse.data.streams;
          } else if (Array.isArray(streamsResponse.data)) {
            streams = streamsResponse.data;
          }
        } else if (Array.isArray(streamsResponse)) {
          streams = streamsResponse;
        } else {
          return null;
        }
        const activeStream = streams.find((s) => s.enabled === true);
        if (activeStream) {
          const streamUrl = ((_a = activeStream.playUrls) == null ? void 0 : _a.hls) || activeStream.url;
          if (streamUrl) {
            await this.setLiveStreamUrlWithHls(streamUrl, activeStream.name);
            if ((_b = activeStream.playUrls) == null ? void 0 : _b.hls) {
            } else {
            }
            return this.liveStreamUrl;
          }
        } else {
        }
        return null;
      } catch (error) {
        return null;
      }
    },
    // 切换API服务器
    async switchApiServer(serverType) {
      try {
        const newUrl = utils_apiService.apiService.switchApiServer(serverType);
        if (newUrl) {
          this.serverUrl = newUrl;
          utils_apiService.apiService.updateConfig(newUrl);
          this.apiServerInfo = utils_apiService.apiService.getCurrentServerInfo();
          common_vendor.index.showToast({
            title: `已切换到${serverType}服务器`,
            icon: "success"
          });
        }
      } catch (error) {
        common_vendor.index.showToast({
          title: "切换服务器失败",
          icon: "error"
        });
      }
    },
    // 获取服务器 URL（兼容旧代码）
    getServerUrl() {
      return this.serverUrl || config_serverMode.API_BASE_URL;
    },
    // ==================== HLS 播放器事件处理（优化版） ====================
    // 处理直播状态变化
    handleLiveStateChange(e) {
      const code = e.detail.code;
      e.detail.message || "";
      if (this.hlsReconnect.timer) {
        clearTimeout(this.hlsReconnect.timer);
        this.hlsReconnect.timer = null;
      }
      switch (code) {
        case 2001:
          this.liveStatus = "connecting";
          this.showHlsStatus("正在连接直播服务器...", "info");
          break;
        case 2002:
          this.liveStatus = "pulling";
          this.showHlsStatus("开始拉取直播流...", "info");
          break;
        case 2003:
          this.liveStatus = "buffering";
          this.showHlsStatus("接收视频数据中...", "info");
          this.hlsStats.startTime = Date.now();
          break;
        case 2004:
          this.liveStatus = "playing";
          this.showHlsStatus("直播连接成功 ✓", "success", 2e3);
          this.hlsReconnect.attempts = 0;
          const connectTime = Date.now() - (this.hlsStats.startTime || Date.now());
          this.hlsStatus.connectTime = connectTime;
          break;
        case 2007:
          this.liveStatus = "loading";
          this.showHlsStatus("视频加载中...", "warning");
          this.hlsStats.bufferingCount++;
          break;
        case 2008:
          this.liveStatus = "decoding";
          break;
        case -2301:
          this.liveStatus = "disconnected";
          this.hlsStats.errorCount++;
          this.showHlsStatus("网络连接已断开", "error", 3e3);
          this.tryHlsReconnect();
          break;
        case -2302:
          this.liveStatus = "error";
          this.hlsStats.errorCount++;
          this.showHlsStatus("无法获取直播地址", "error", 3e3);
          this.tryHlsReconnect();
          break;
        case -2303:
          this.liveStatus = "error";
          this.hlsStats.errorCount++;
          this.showHlsStatus("直播地址无效，请检查配置", "error", 5e3);
          break;
        case -2304:
          this.liveStatus = "error";
          this.hlsStats.errorCount++;
          this.showHlsStatus("不支持此直播格式", "error", 5e3);
          break;
        case -2305:
          this.liveStatus = "error";
          this.hlsStats.errorCount++;
          this.showHlsStatus("播放器出错", "error", 3e3);
          this.tryHlsReconnect();
          break;
        case -2306:
          this.liveStatus = "error";
          this.hlsStats.errorCount++;
          this.showHlsStatus("视频解码失败", "error", 3e3);
          this.tryHlsReconnect();
          break;
        default:
          this.hlsStatus.code = code;
      }
    },
    // 处理直播错误
    handleVideoError(e) {
      e.detail.errCode;
      e.detail.errMsg || "";
      if (this.liveStreamUrl && this.liveStreamUrl.includes(".flv"))
        ;
    },
    // 保留原有的 live-player 错误处理
    handleLiveError(e) {
      e.detail.errCode;
      const errMsg = e.detail.errMsg || "";
      this.liveStatus = "error";
      this.hlsStats.errorCount++;
      this.hlsStats.lastErrorTime = Date.now();
      if (errMsg && errMsg.includes("jsapi has no permission")) {
        try {
          const systemInfo = common_vendor.index.getSystemInfoSync();
          const isRealDevice = systemInfo.platform !== "devtools";
          if (isRealDevice) {
            common_vendor.index.showModal({
              title: "⚠️ 权限配置问题",
              content: 'live-player 组件需要配置微信公众平台权限。\n\n✅ 请登录微信公众平台：\n1. 开发 -> 开发管理 -> 开发设置\n2. 添加服务器域名：http://192.168.31.249:8081\n3. 检查服务类目是否包含"视频"或"直播"\n\n如果仍然无法使用，可能需要升级小程序主体类型（个人 -> 企业）。',
              showCancel: false,
              confirmText: "我知道了"
            });
          } else {
            common_vendor.index.showModal({
              title: "⚠️ 开发者工具限制",
              content: 'live-player 组件在开发者工具中无法正常工作，这是微信的已知限制。\n\n✅ 请使用"预览"功能，用微信扫码在真机上测试，真机上的播放器可以正常工作。',
              showCancel: false,
              confirmText: "我知道了"
            });
          }
        } catch (error) {
          common_vendor.index.showModal({
            title: "⚠️ 权限问题",
            content: 'live-player 组件出现权限错误。\n\n✅ 请使用"预览"功能在真机上测试，并确保在微信公众平台配置了正确的服务器域名和服务类目。',
            showCancel: false,
            confirmText: "我知道了"
          });
        }
        return;
      }
      let errorMessage = "直播播放出错";
      if (errMsg) {
        errorMessage = errMsg;
      }
      this.showHlsStatus(errorMessage, "error", 3e3);
      if (this.hlsReconnect.enabled && !errMsg.includes("jsapi has no permission")) {
        this.tryHlsReconnect();
      }
    },
    // 处理网络状态（HLS 质量监控）
    handleNetStatus(e) {
      if (!e.detail || !e.detail.info) {
        return;
      }
      const info = e.detail.info;
      this.hlsNetQuality = {
        videoBitrate: info.videoBitrate || 0,
        // 视频码率 (kbps)
        audioBitrate: info.audioBitrate || 0,
        // 音频码率 (kbps)
        videoFPS: info.videoFPS || 0,
        // 视频帧率
        videoGOP: info.videoGOP || 0,
        // 视频GOP
        netSpeed: info.netSpeed || 0,
        // 网络速度 (kbps)
        netJitter: info.netJitter || 0,
        // 网络抖动 (ms)
        videoWidth: info.videoWidth || 0,
        // 视频宽度
        videoHeight: info.videoHeight || 0
        // 视频高度
      };
      if (this.hlsStats.startTime > 0) {
        this.hlsStats.totalPlayTime = Math.floor((Date.now() - this.hlsStats.startTime) / 1e3);
      }
      this.checkNetworkQuality();
    },
    // 处理全屏变化
    handleFullScreenChange(e) {
      e.detail.fullScreen;
    },
    // 处理音量通知
    handleAudioVolumeNotify(e) {
    },
    // ==================== HLS 辅助方法 ====================
    // 显示 HLS 状态提示
    showHlsStatus(message, type = "info", duration = 0) {
      this.hlsStatus = {
        show: true,
        message,
        type,
        code: this.hlsStatus.code
      };
      if (duration > 0) {
        setTimeout(() => {
          this.hlsStatus.show = false;
        }, duration);
      }
    },
    // 隐藏 HLS 状态提示
    hideHlsStatus() {
      this.hlsStatus.show = false;
    },
    // HLS 自动重连
    tryHlsReconnect() {
      if (!this.hlsReconnect.enabled) {
        return;
      }
      if (this.hlsReconnect.attempts >= this.hlsReconnect.maxAttempts) {
        this.showHlsStatus(`重连失败，已尝试${this.hlsReconnect.maxAttempts}次`, "error", 5e3);
        return;
      }
      if (this.hlsReconnect.timer) {
        clearTimeout(this.hlsReconnect.timer);
      }
      let delay = this.hlsReconnect.delay;
      if (this.hlsReconnect.exponentialBackoff) {
        delay = this.hlsReconnect.delay * Math.pow(2, this.hlsReconnect.attempts);
      }
      this.hlsReconnect.attempts++;
      this.showHlsStatus(`正在重连... (${this.hlsReconnect.attempts}/${this.hlsReconnect.maxAttempts})`, "warning");
      this.hlsReconnect.timer = setTimeout(() => {
        this.isLiveStarted = false;
        this.$nextTick(() => {
          this.isLiveStarted = true;
          this.showHlsStatus("重新连接中...", "info");
        });
      }, delay);
    },
    // 检测网络质量
    checkNetworkQuality() {
      const quality = this.hlsNetQuality;
      if (quality.videoBitrate > 0 && quality.videoBitrate < 100)
        ;
      if (quality.videoFPS > 0 && quality.videoFPS < 15)
        ;
      if (quality.netJitter > 200)
        ;
    },
    // 重置 HLS 统计数据
    resetHlsStats() {
      this.hlsStats = {
        totalPlayTime: 0,
        bufferingCount: 0,
        bufferingTime: 0,
        errorCount: 0,
        lastErrorTime: 0,
        startTime: 0
      };
      this.hlsReconnect.attempts = 0;
    },
    // 获取 HLS 播放质量报告
    getHlsQualityReport() {
      return {
        status: this.liveStatus,
        playTime: this.hlsStats.totalPlayTime,
        bufferingCount: this.hlsStats.bufferingCount,
        errorCount: this.hlsStats.errorCount,
        reconnectAttempts: this.hlsReconnect.attempts,
        currentQuality: {
          videoBitrate: this.hlsNetQuality.videoBitrate,
          audioBitrate: this.hlsNetQuality.audioBitrate,
          videoFPS: this.hlsNetQuality.videoFPS,
          resolution: `${this.hlsNetQuality.videoWidth}x${this.hlsNetQuality.videoHeight}`
        },
        connectTime: this.hlsStatus.connectTime
      };
    },
    // API调用方法
    async fetchDebateTopic() {
      try {
        const response = await utils_apiService.apiService.getDebateTopic(this.streamId);
        if (response && response.success && response.data) {
          const data = response.data;
          this.debateTitle = data.title || "";
          this.debateDescription = data.description || "";
          this.currentDebateTopic = data.title || "";
        } else if (response && response.data) {
          const data = response.data;
          this.debateTitle = data.title || "";
          this.debateDescription = data.description || "";
          this.currentDebateTopic = data.title || "";
        } else if (response && response.title) {
          this.debateTitle = response.title || "";
          this.debateDescription = response.description || "";
          this.currentDebateTopic = response.title || "";
        } else {
        }
      } catch (error) {
        common_vendor.index.showToast({
          title: "获取辩题失败",
          icon: "error"
        });
      }
    },
    async fetchTopBarVotes() {
      try {
        const service = this.apiService || utils_apiService.apiService;
        if (!this.streamId) {
          return;
        }
        const response = await service.getVote(this.streamId);
        if (response) {
          const data = response;
          if (data.leftVotes !== void 0 && data.rightVotes !== void 0) {
            const newLeftVotes = data.leftVotes || 0;
            const newRightVotes = data.rightVotes || 0;
            const newTotal = newLeftVotes + newRightVotes;
            this.topLeftVotes = Math.max(0, newLeftVotes + 50);
            this.topRightVotes = Math.max(0, newRightVotes + 50);
          } else {
          }
        } else {
        }
      } catch (error) {
      }
    },
    // 获取用户之前的投票记录
    async fetchUserVoteRecord() {
      try {
        if (!this.streamId) {
          return;
        }
        let userId = null;
        try {
          if (typeof common_vendor.index !== "undefined" && common_vendor.index.getStorageSync) {
            const currentUser = common_vendor.index.getStorageSync("currentUser");
            if (currentUser && currentUser.id) {
              userId = currentUser.id;
            }
          }
        } catch (e) {
        }
        if (!userId) {
          return;
        }
        const service = this.apiService || utils_apiService.apiService;
        const userVoteData = await service.getUserVotes(this.streamId);
        if (userVoteData && userVoteData.success !== false) {
          const voteData = userVoteData.data || userVoteData;
          const leftVotes = voteData.leftVotes || 0;
          const rightVotes = voteData.rightVotes || 0;
          if (leftVotes > 0 || rightVotes > 0) {
            const total = leftVotes + rightVotes;
            if (total > 0) {
              this.presetOpinion = Math.round(leftVotes / total * 100);
              this.leftVotes = leftVotes;
              this.rightVotes = rightVotes;
              this.initialVotesSubmitted = true;
            }
          } else {
            this.leftVotes = Math.round(this.presetOpinion / 100 * 100);
            this.rightVotes = 100 - this.leftVotes;
          }
        } else {
          this.leftVotes = Math.round(this.presetOpinion / 100 * 100);
          this.rightVotes = 100 - this.leftVotes;
        }
      } catch (error) {
      }
    },
    async fetchAIContent(isInitialLoad = false) {
      try {
        const service = this.apiService || utils_apiService.apiService;
        if (!service) {
          return;
        }
        const response = await service.getAiContent(this.streamId);
        if (response && response.success) {
          if (isInitialLoad) {
            this.aiMessages = [];
            this.messageIdCounter = 0;
          }
          const serverMessages = response.data || [];
          let addedCount = 0;
          serverMessages.forEach((content) => {
            const exists = this.aiMessages.some(
              (msg) => msg.serverId === content.id || msg.text === content.text && msg.side === content.side
            );
            if (!exists) {
              this.addAIMessage(content);
              addedCount++;
            }
          });
          if (addedCount > 0) {
          } else {
          }
        } else {
        }
      } catch (error) {
      }
    },
    async sendUserVote(side, votes = 10) {
      var _a;
      const startTime = Date.now();
      try {
        if (!this.streamId) {
          common_vendor.index.showToast({
            title: "❌ 投票失败: 未指定直播间",
            icon: "error",
            duration: 3e3
          });
          throw new Error("投票必须指定直播流ID (streamId)");
        }
        let userId = null;
        try {
          if (typeof common_vendor.index !== "undefined" && common_vendor.index.getStorageSync) {
            const currentUser = common_vendor.index.getStorageSync("currentUser");
            if (currentUser && currentUser.id) {
              userId = currentUser.id;
            }
          }
        } catch (e) {
        }
        const leftDist = Math.max(0, Math.min(100, Math.round(this.presetOpinion / 100 * 100)));
        const rightDist = 100 - leftDist;
        const service = this.apiService || utils_apiService.apiService;
        const response = await service.userVoteDistribution(leftDist, rightDist, this.streamId, userId);
        const responseTime = Date.now() - startTime;
        this.updatePerformanceStats(responseTime);
        const isSuccess = (response == null ? void 0 : response.success) === true || (response == null ? void 0 : response.success) === void 0 && response !== void 0;
        if (isSuccess) {
          this.topLeftVotes = leftDist;
          this.topRightVotes = rightDist;
          this.fetchTopBarVotes();
          this.debouncedFetchVoteData();
          return { success: true, data: (response == null ? void 0 : response.data) || response };
        } else {
          const error = new Error((response == null ? void 0 : response.message) || "投票失败");
          error.response = response;
          throw error;
        }
      } catch (error) {
        let errorMessage = "投票失败";
        if (error.statusCode === 400) {
          const serverMessage = ((_a = error.response) == null ? void 0 : _a.message) || error.message || "参数错误";
          errorMessage = `请求参数错误：${serverMessage}`;
        } else if (error.statusCode === 403) {
          errorMessage = "服务器拒绝请求（403），请检查服务器CORS配置";
        } else if (error.statusCode === 401) {
          errorMessage = "未授权（401），请先登录";
        } else if (error.statusCode === 404) {
          errorMessage = "接口不存在（404）";
        } else if (error.statusCode === 500) {
          errorMessage = "服务器内部错误（500）";
        } else if (error.message) {
          errorMessage = utils_apiService.apiService.handleError(error);
        }
        common_vendor.index.showToast({
          title: errorMessage,
          icon: "error",
          duration: 3e3
        });
      }
    },
    // 防抖获取票数数据 - 延迟1秒后获取最新票数统计
    debouncedFetchVoteData() {
      if (this.fetchVoteDataTimeout) {
        clearTimeout(this.fetchVoteDataTimeout);
      }
      this.fetchVoteDataTimeout = setTimeout(() => {
        this.fetchTopBarVotes();
        this.fetchVoteDataTimeout = null;
      }, 1e3);
    },
    // 更新性能统计
    updatePerformanceStats(responseTime) {
      this.performanceStats.voteCount++;
      this.performanceStats.lastResponseTime = responseTime;
      const totalTime = this.performanceStats.avgResponseTime * (this.performanceStats.voteCount - 1) + responseTime;
      this.performanceStats.avgResponseTime = Math.round(totalTime / this.performanceStats.voteCount);
    },
    // 异步投票方法，不阻塞UI
    async sendUserVoteAsync(side, votes = 10) {
      const now = Date.now();
      this.voteQueue.push({ side, votes, timestamp: now });
      if (this.isVoting) {
        return;
      }
      this.processVoteQueue();
    },
    // 处理投票队列
    async processVoteQueue() {
      if (this.voteQueue.length === 0 || this.isVoting) {
        return;
      }
      this.isVoting = true;
      try {
        const voteMap = /* @__PURE__ */ new Map();
        while (this.voteQueue.length > 0) {
          const vote = this.voteQueue.shift();
          const key = vote.side;
          if (voteMap.has(key)) {
            voteMap.get(key).votes += vote.votes;
          } else {
            voteMap.set(key, { side: vote.side, votes: vote.votes });
          }
        }
        for (const vote of voteMap.values()) {
          await this.sendUserVote(vote.side, vote.votes);
        }
      } catch (error) {
      } finally {
        this.isVoting = false;
        if (this.voteQueue.length > 0) {
          setTimeout(() => {
            this.processVoteQueue();
          }, 100);
        }
      }
    },
    async addCommentToServer(contentId, text, user = "匿名用户", avatar = "👤") {
      var _a;
      try {
        const response = await utils_apiService.apiService.addComment(contentId, text, user, avatar);
        const isSuccess = (response == null ? void 0 : response.success) === true || (response == null ? void 0 : response.success) === void 0 && response !== void 0;
        if (isSuccess) {
          return (response == null ? void 0 : response.data) || response;
        } else {
          const error = new Error((response == null ? void 0 : response.message) || "评论失败");
          error.response = response;
          throw error;
        }
      } catch (error) {
        let errorMessage = "添加评论失败";
        if (error.statusCode === 400) {
          const serverMessage = ((_a = error.response) == null ? void 0 : _a.message) || error.message || "参数错误";
          errorMessage = `请求参数错误：${serverMessage}`;
        } else if (error.statusCode === 403) {
          errorMessage = "服务器拒绝请求（403）";
        } else if (error.statusCode === 401) {
          errorMessage = "未授权（401），请先登录";
        } else if (error.statusCode === 404) {
          errorMessage = "接口不存在（404）";
        } else if (error.statusCode === 500) {
          errorMessage = "服务器内部错误（500）";
        } else if (error.message) {
          errorMessage = error.message;
        }
        common_vendor.index.showToast({
          title: errorMessage,
          icon: "error",
          duration: 3e3
        });
        throw error;
      }
    },
    async likeContent(contentId, commentId = null) {
      var _a, _b;
      try {
        const response = await utils_apiService.apiService.like(contentId, commentId);
        const isSuccess = (response == null ? void 0 : response.success) === true || (response == null ? void 0 : response.success) === void 0 && response !== void 0;
        if (isSuccess) {
          return (response == null ? void 0 : response.data) || response;
        } else {
          const error = new Error((response == null ? void 0 : response.message) || "点赞失败");
          error.response = response;
          throw error;
        }
      } catch (error) {
        let errorMessage = "点赞失败";
        if (error.statusCode === 400) {
          const serverMessage = ((_a = error.response) == null ? void 0 : _a.message) || error.message || "参数错误";
          errorMessage = `请求参数错误：${serverMessage}`;
        } else if (error.statusCode === 403) {
          errorMessage = "服务器拒绝请求（403）";
        } else if (error.statusCode === 401) {
          errorMessage = "未授权（401），请先登录";
        } else if (error.statusCode === 404) {
          errorMessage = ((_b = error.response) == null ? void 0 : _b.message) || "内容不存在（404）";
        } else if (error.statusCode === 500) {
          errorMessage = "服务器内部错误（500）";
        } else if (error.message) {
          errorMessage = error.message;
        }
        common_vendor.index.showToast({
          title: errorMessage,
          icon: "error",
          duration: 3e3
        });
        throw error;
      }
    },
    // 启动顶部对抗条实时更新
    startTopBarRealTimeUpdate() {
      if (this.topBarUpdateTimer) {
        clearInterval(this.topBarUpdateTimer);
        this.topBarUpdateTimer = null;
      }
      this.fetchTopBarVotes();
      this.topBarUpdateTimer = setInterval(() => {
        this.fetchTopBarVotes();
      }, 5e3);
    },
    // 启动AI内容实时更新
    startAIContentRealTimeUpdate() {
      this.fetchAIContent(true);
      if (this.recognitionTimer) {
        clearInterval(this.recognitionTimer);
      }
      this.recognitionTimer = setInterval(() => {
        this.fetchAIContent();
      }, 4e3);
    },
    // 直播开始后自动启动AI内容获取
    async startAIContentAfterLiveStart() {
      try {
        const service = this.apiService || utils_apiService.apiService;
        if (!service) {
          return;
        }
        const dashboardData = await service.getDashboard(this.streamId);
        if (dashboardData) {
          if (dashboardData.aiStatus !== void 0) {
            if (dashboardData.aiStatus === "running") {
              if (typeof this.fetchAIContent === "function") {
                await this.fetchAIContent(true);
              } else {
              }
              if (typeof this.startAIContentRealTimeUpdate === "function") {
                this.startAIContentRealTimeUpdate();
              } else {
              }
            } else {
              if (typeof this.fetchAIContent === "function") {
                this.fetchAIContent(true);
              }
            }
          } else {
            if (typeof this.fetchAIContent === "function") {
              this.fetchAIContent(true);
            }
          }
        } else {
        }
      } catch (error) {
        try {
          if (typeof this.fetchAIContent === "function") {
            await this.fetchAIContent(true);
          }
          if (typeof this.startAIContentRealTimeUpdate === "function") {
            this.startAIContentRealTimeUpdate();
          }
        } catch (fetchError) {
        }
      }
    },
    getSystemInfo() {
      common_vendor.index.getSystemInfo({
        success: (res) => {
          this.statusBarHeight = res.statusBarHeight;
          common_vendor.index.setStorageSync("statusBarHeight", res.statusBarHeight);
        }
      });
    },
    setSafeArea() {
      common_vendor.index.getStorageSync("statusBarHeight") || 0;
      const query = common_vendor.index.createSelectorQuery().in(this);
      query.select(".home-container").boundingClientRect((rect) => {
      }).exec();
    },
    toggleLiveCollapse() {
      this.isLiveCollapsed = !this.isLiveCollapsed;
    },
    // 返回直播选择页面
    goBackToSelect() {
      common_vendor.index.redirectTo({
        url: "/pages/live-select/live-select",
        success: () => {
        },
        fail: (err) => {
          common_vendor.index.navigateBack({
            delta: 1,
            fail: () => {
              common_vendor.index.navigateTo({
                url: "/pages/live-select/live-select"
              });
            }
          });
        }
      });
    },
    voteLeft() {
      if (!this.isLiveStarted || !this.checkVoteRateLimit("left")) {
        return;
      }
      this.handleVote("left");
    },
    voteRight() {
      if (!this.isLiveStarted || !this.checkVoteRateLimit("right")) {
        return;
      }
      this.handleVote("right");
    },
    // 检查投票速率限制（200ms最小间隔）
    checkVoteRateLimit(side) {
      const now = Date.now();
      const lastTime = side === "left" ? this.lastLeftVoteTime : this.lastRightVoteTime;
      if (now - lastTime < 200) {
        return false;
      }
      if (side === "left") {
        this.lastLeftVoteTime = now;
      } else {
        this.lastRightVoteTime = now;
      }
      return true;
    },
    // 统一的投票处理逻辑（增强版本 - 包含丰富的交互反馈）
    handleVote(side) {
      if (side === "left") {
        this.leftClickCount++;
      } else {
        this.rightClickCount++;
      }
      if (side === "left") {
        this.leftVotes += 10;
      } else {
        this.rightVotes += 10;
      }
      this.userVote = side;
      this.triggerButtonEffect(side);
      this.$nextTick(() => {
        if (!this.isDividerHitInProgress) {
          this.triggerDividerHit();
        }
        this.createVoteEffects(side);
        this.debouncedUpdatePresetOpinion();
        if (!this.isLiveStarted) {
          return;
        }
        if (this.isLiveStarted) {
          this.votesChanged = true;
        }
      });
      this.showVoteToastOptimized(side);
      this.triggerVibrationFeedback(side);
    },
    // 触发按钮点击特效
    triggerButtonEffect(side) {
      this.triggerEffect = { side, timestamp: Date.now() };
      setTimeout(() => {
        this.triggerEffect = null;
      }, 1200);
    },
    // 触觉反馈 - 根据点击次数产生不同强度的振动（超级增强版）
    triggerVibrationFeedback(side) {
      const clickCount = side === "left" ? this.leftClickCount : this.rightClickCount;
      this.playVoteSound(clickCount);
    },
    // 播放投票音效
    playVoteSound(clickCount) {
    },
    // 防抖的预设观点更新
    debouncedUpdatePresetOpinion() {
      clearTimeout(this.updatePresetOpinionTimeout);
      this.updatePresetOpinionTimeout = setTimeout(() => {
        this.updatePresetOpinionFromVotes();
      }, 100);
    },
    // 优化版本的投票提示（防止Toast堆积）
    showVoteToastOptimized(side) {
      if (this.isToastShowing) {
        return;
      }
      const clickCount = side === "left" ? this.leftClickCount : this.rightClickCount;
      const sideName = side === "left" ? "正方" : "反方";
      let title = "";
      if (clickCount === 1) {
        title = `🎉 支持${sideName}！`;
      } else if (clickCount <= 3) {
        title = `💪 ${sideName}加油！`;
      } else if (clickCount <= 5) {
        title = `🔥 ${sideName}必胜！`;
      } else if (clickCount <= 10) {
        title = `⚡ ${sideName}无敌！`;
      } else if (clickCount <= 20) {
        title = `🚀 ${sideName}超神！`;
      } else if (clickCount <= 50) {
        title = `💎 ${sideName}传奇！`;
      } else {
        title = `👑 ${sideName}王者！`;
      }
      this.isToastShowing = true;
      common_vendor.index.showToast({
        title,
        icon: "none",
        duration: 800
      });
      setTimeout(() => {
        this.isToastShowing = false;
      }, 800);
    },
    // 触发分割线被击中效果（优化：避免频繁触发）
    triggerDividerHit() {
      if (this.isDividerHitInProgress) {
        return;
      }
      this.isDividerHitInProgress = true;
      this.dividerHit = true;
      setTimeout(() => {
        this.dividerHit = false;
        this.isDividerHitInProgress = false;
      }, 300);
    },
    // 创建投票特效（从按钮两端飘出爱心）
    createVoteEffects(side) {
      const effectCount = Math.floor(Math.random() * 2) + 2;
      for (let i = 0; i < effectCount; i++) {
        let startX, startY;
        if (side === "left") {
          startX = "10%";
          startY = "78%";
        } else {
          startX = "82%";
          startY = "78%";
        }
        const randomOffsetX = (Math.random() - 0.5) * 100;
        const randomOffsetY = (Math.random() - 0.5) * 50;
        const duration = 3 + Math.random() * 1;
        const delay = i * 100 / 1e3;
        this.effectIdCounter++;
        const effectId = this.effectIdCounter;
        const randomIcon = this.xiangsuIcons[Math.floor(Math.random() * this.xiangsuIcons.length)];
        const effect = {
          id: effectId,
          side,
          class: `vote-effect-${side}`,
          createTime: Date.now(),
          icon: randomIcon,
          style: {
            left: `calc(${startX} + ${randomOffsetX}rpx)`,
            top: `calc(${startY} + ${randomOffsetY}rpx)`,
            animationDuration: `${duration}s`,
            animationDelay: `${delay}s`,
            opacity: 1
          }
        };
        this.voteEffects.push(effect);
        const totalTime = (delay + duration) * 1e3;
        const timeoutId = setTimeout(() => {
          this.removeVoteEffect(effectId);
        }, totalTime + 500);
        if (!this.effectTimeouts) {
          this.effectTimeouts = [];
        }
        this.effectTimeouts.push(timeoutId);
        if (this.effectTimeouts.length > 50) {
          this.effectTimeouts.shift();
        }
      }
    },
    // 初始化按钮动画
    initButtonAnimations() {
    },
    // 移除投票特效
    removeVoteEffect(effectId) {
      const index = this.voteEffects.findIndex((effect) => effect.id === effectId);
      if (index > -1) {
        this.voteEffects.splice(index, 1);
      }
    },
    // 特效性能优化 - 定期清理过期特效
    startEffectCleanup() {
      if (this.effectCleanupInterval) {
        return;
      }
      this.effectCleanupInterval = setInterval(() => {
        const now = Date.now();
        if (now - this.lastEffectCleanup < 5e3) {
          return;
        }
        this.lastEffectCleanup = now;
        const initialCount = this.voteEffects.length;
        this.voteEffects = this.voteEffects.filter((effect) => {
          return now - effect.createTime < 1e4;
        });
        if (this.effectTimeouts.length > 50) {
          const toRemove = this.effectTimeouts.splice(0, 25);
          toRemove.forEach((timeoutId) => {
            clearTimeout(timeoutId);
          });
        }
        if (initialCount !== this.voteEffects.length)
          ;
      }, 2e3);
    },
    // 停止特效清理
    stopEffectCleanup() {
      if (this.effectCleanupInterval) {
        clearInterval(this.effectCleanupInterval);
        this.effectCleanupInterval = null;
      }
    },
    // 预设观点滑块变化处理
    onPresetChange(e) {
      this.presetOpinion = e.detail.value;
      if (!this.isLiveStarted) {
        this.updatePresetBattleBar();
      } else {
        const currentTotal = this.leftVotes + this.rightVotes;
        if (currentTotal > 0) {
          this.leftVotes = Math.round(this.presetOpinion / 100 * currentTotal);
          this.rightVotes = currentTotal - this.leftVotes;
        } else {
          const baseVotes = 100;
          this.leftVotes = Math.round(this.presetOpinion / 100 * baseVotes);
          this.rightVotes = baseVotes - this.leftVotes;
        }
        this.presetSliderChanged = true;
        this.votesChanged = true;
      }
    },
    // 提交预设观点投票（初始100票或直播后拖动后的票数）
    async confirmPresetVotes() {
      if (!this.isLiveStarted) {
        const leftVotes = Math.round(this.presetOpinion / 100 * this.initialVotesTotal);
        const rightVotes = this.initialVotesTotal - leftVotes;
        let userId = null;
        try {
          if (typeof common_vendor.index !== "undefined" && common_vendor.index.getStorageSync) {
            const currentUser = common_vendor.index.getStorageSync("currentUser");
            if (currentUser && currentUser.id) {
              userId = currentUser.id;
            }
          }
        } catch (e) {
        }
        try {
          let finalLeftVotes = leftVotes;
          let finalRightVotes = rightVotes;
          const total = finalLeftVotes + finalRightVotes;
          if (total !== 100) {
            const scale = 100 / total;
            finalLeftVotes = Math.round(finalLeftVotes * scale);
            finalRightVotes = 100 - finalLeftVotes;
          }
          const service = this.apiService || utils_apiService.apiService;
          const voteResult = await service.userVoteDistribution(finalLeftVotes, finalRightVotes, this.streamId, userId);
          if (voteResult && voteResult.success !== false) {
            this.initialVotesSubmitted = true;
            this.votesChanged = false;
            if (!this.isLiveStarted) {
              this.showPresetSlider = false;
              this.showPresetPanel = false;
            }
            this.leftVotes = finalLeftVotes;
            this.rightVotes = finalRightVotes;
            this.topLeftVotes = finalLeftVotes;
            this.topRightVotes = finalRightVotes;
            this.fetchTopBarVotes();
            common_vendor.index.showToast({
              title: "✅ 初始投票已提交",
              icon: "success",
              duration: 2e3
            });
          } else {
          }
        } catch (error) {
          common_vendor.index.showToast({
            title: "提交失败，请重试",
            icon: "error"
          });
        }
      } else {
        let leftVotes = this.leftVotes;
        let rightVotes = this.rightVotes;
        const currentTotal = leftVotes + rightVotes;
        let userId = null;
        try {
          if (typeof common_vendor.index !== "undefined" && common_vendor.index.getStorageSync) {
            const currentUser = common_vendor.index.getStorageSync("currentUser");
            if (currentUser && currentUser.id) {
              userId = currentUser.id;
            }
          }
        } catch (e) {
        }
        if (currentTotal === 0) {
          leftVotes = Math.round(this.presetOpinion / 100 * 100);
          rightVotes = 100 - leftVotes;
        }
        try {
          const total = leftVotes + rightVotes;
          if (total !== 100) {
            const scale = 100 / total;
            leftVotes = Math.round(leftVotes * scale);
            rightVotes = 100 - leftVotes;
          }
          const service = this.apiService || utils_apiService.apiService;
          const voteResult = await service.userVoteDistribution(leftVotes, rightVotes, this.streamId, userId);
          if (voteResult && voteResult.success !== false) {
            this.presetSliderChanged = false;
            this.votesChanged = false;
            this.topLeftVotes = leftVotes;
            this.topRightVotes = rightVotes;
            this.fetchTopBarVotes();
            common_vendor.index.showToast({
              title: "✅ 投票已更新",
              icon: "success",
              duration: 2e3
            });
          } else {
          }
        } catch (error) {
          common_vendor.index.showToast({
            title: "提交失败，请重试",
            icon: "error"
          });
        }
      }
    },
    // 更新预设观点对抗条显示
    updatePresetBattleBar() {
      const baseVotes = 1e3;
      this.presetLeftVotes = Math.round(this.presetOpinion / 100 * baseVotes);
      this.presetRightVotes = baseVotes - this.presetLeftVotes;
    },
    // 获取预设观点描述
    getPresetDescription() {
      if (this.presetOpinion < 30) {
        return "强烈支持反方";
      } else if (this.presetOpinion < 45) {
        return "偏向反方";
      } else if (this.presetOpinion < 55) {
        return "保持中立";
      } else if (this.presetOpinion < 70) {
        return "偏向正方";
      } else {
        return "强烈支持正方";
      }
    },
    // 切换预设观点面板显示/隐藏
    togglePresetPanel() {
      if (this.initialVotesSubmitted && !this.isLiveStarted) {
        return;
      }
      if (!this.showPresetPanel) {
        this.showPresetSlider = true;
        this.showPresetPanel = true;
        common_vendor.index.showToast({
          title: "🎯 观点倾向面板已展开",
          icon: "success",
          duration: 1500
        });
      } else {
        this.showPresetPanel = false;
        common_vendor.index.showToast({
          title: "🎯 观点倾向面板已收起",
          icon: "none",
          duration: 1500
        });
      }
    },
    // 根据当前投票比例更新预设观点倾向
    updatePresetOpinionFromVotes() {
      if (this.totalVotes > 0) {
        const newValue = Math.round(this.leftPercentage);
        if (newValue !== this.presetOpinion) {
          this.triggerValueChangeAnimation();
          this.presetOpinion = newValue;
        }
      }
    },
    // 触发数值变化动画
    triggerValueChangeAnimation() {
      this.isValueChanging = true;
      setTimeout(() => {
        this.isValueChanging = false;
      }, 600);
    },
    // 手动开始直播（优先从服务器获取直播流地址）
    async startLive() {
      try {
        if (this.isLiveStarted) {
          common_vendor.index.showToast({
            title: "直播已在进行中",
            icon: "none",
            duration: 2e3
          });
          return;
        }
        if (!this.apiService) {
          await this.initApiService();
          if (!this.apiService) {
            this.apiService = utils_apiService.apiService;
          }
        }
        let serverStreamUrl = null;
        let isServerLive = false;
        let activeStreamUrl = null;
        try {
          const service = this.apiService || utils_apiService.apiService;
          try {
            const dashboardData = await service.getDashboard(this.streamId);
            if (dashboardData && dashboardData.isLive) {
              isServerLive = true;
              if (dashboardData.liveStreamUrl) {
                serverStreamUrl = dashboardData.liveStreamUrl;
              }
            } else if (dashboardData && dashboardData.liveStreamUrl && !dashboardData.isLive) {
              serverStreamUrl = dashboardData.liveStreamUrl;
            }
            if (dashboardData && dashboardData.activeStreamUrl) {
              activeStreamUrl = dashboardData.activeStreamUrl;
            }
          } catch (dashboardError) {
            const statusResponse = await service.getLiveStatus();
            if (statusResponse && statusResponse.isLive) {
              isServerLive = true;
              if (statusResponse.streamUrl) {
                serverStreamUrl = statusResponse.streamUrl;
              }
            } else if (statusResponse && statusResponse.streamUrl && !statusResponse.isLive) {
              serverStreamUrl = statusResponse.streamUrl;
            }
            if (statusResponse && statusResponse.activeStreamUrl) {
              activeStreamUrl = statusResponse.activeStreamUrl;
            }
          }
        } catch (error) {
          if (error.message && error.message.includes("404")) {
            try {
              await this.fetchActiveStreamFromServerAlternative();
            } catch (altError) {
            }
          }
        }
        let finalStreamUrl = null;
        if (serverStreamUrl) {
          finalStreamUrl = serverStreamUrl;
        } else if (activeStreamUrl) {
          finalStreamUrl = activeStreamUrl;
        } else if (this.liveStreamUrl) {
          finalStreamUrl = this.liveStreamUrl;
        } else {
          try {
            const streamUrl = await this.fetchActiveStreamFromServerAlternative();
            if (streamUrl) {
              finalStreamUrl = streamUrl;
            } else {
            }
          } catch (streamsError) {
          }
        }
        if (!finalStreamUrl) {
          common_vendor.index.showToast({
            title: "未找到可用的直播流，请先配置",
            icon: "none",
            duration: 3e3
          });
          return;
        }
        this.liveStreamUrl = finalStreamUrl;
        await this.$nextTick();
        this.isLiveStarted = true;
        common_vendor.index.showToast({
          title: isServerLive ? "已连接到服务器直播" : "开始播放直播流",
          icon: "success",
          duration: 2e3
        });
        setTimeout(() => {
          if (typeof this.fetchTopBarVotes === "function") {
            this.fetchTopBarVotes();
            if (typeof this.startTopBarRealTimeUpdate === "function") {
              this.startTopBarRealTimeUpdate();
            }
          }
          if (typeof this.fetchAIContent === "function") {
            this.fetchAIContent(true);
            if (typeof this.startAIContentRealTimeUpdate === "function") {
              this.startAIContentRealTimeUpdate();
            }
          }
          if (typeof this.fetchVotes === "function") {
            this.fetchVotes();
          }
        }, 500);
      } catch (error) {
        common_vendor.index.showToast({
          title: "启动直播失败: " + (error.message || "请稍后重试"),
          icon: "none",
          duration: 3e3
        });
      }
    },
    // AI语音识别相关方法（现在从服务器获取数据）
    // 添加AI消息到对话列表
    addAIMessage(dialogueData) {
      this.messageIdCounter++;
      const comments = (dialogueData.comments || []).map((comment, index) => ({
        ...comment,
        id: comment.id || Date.now() + index
        // 如果服务器没有提供 id，生成一个
      }));
      const newMessage = {
        id: this.messageIdCounter,
        serverId: dialogueData.id,
        // 保存服务器ID用于去重
        debate_id: dialogueData.debate_id || null,
        // 保存辩题ID，标识该观点属于哪个辩题
        text: dialogueData.text,
        side: dialogueData.side,
        comments,
        likes: dialogueData.likes,
        isLiked: false,
        timestamp: (/* @__PURE__ */ new Date()).getTime()
      };
      this.aiMessages.push(newMessage);
      this.$nextTick(() => {
        this.scrollToBottom();
      });
    },
    // 滚动到底部
    scrollToBottom() {
      this.$nextTick(() => {
        this.scrollTop = this.aiMessages.length * 120;
      });
    },
    // 停止AI识别（实际项目中用于停止语音识别服务）
    stopRecognition() {
      if (this.recognitionTimer) {
        clearInterval(this.recognitionTimer);
        this.recognitionTimer = null;
        this.isListening = false;
      }
    },
    // 处理消息点击事件
    handleMessageClick(message) {
      this.showMessageComments(message);
    },
    // 显示消息的评论详情
    showMessageComments(message) {
      this.selectedMessage = message;
      this.showModal = true;
    },
    // 关闭弹窗
    closeModal() {
      this.showModal = false;
      this.selectedMessage = null;
    },
    // 为消息添加评论
    addCommentToMessage(message) {
      this.showModal = false;
      this.currentCommentMessage = message;
      this.commentText = "";
      this.showCommentModal = true;
    },
    // 关闭评论弹窗
    closeCommentModal() {
      this.showCommentModal = false;
      this.commentText = "";
      this.currentCommentMessage = null;
    },
    // 提交评论
    async submitComment() {
      if (!this.commentText.trim()) {
        common_vendor.index.showToast({
          title: "请输入评论内容",
          icon: "none",
          duration: 1500
        });
        return;
      }
      if (!this.currentCommentMessage) {
        common_vendor.index.showToast({
          title: "评论失败，请重试",
          icon: "error",
          duration: 2e3
        });
        return;
      }
      try {
        const contentId = this.currentCommentMessage.serverId || this.currentCommentMessage.id;
        const serverComment = await this.addCommentToServer(
          contentId,
          this.commentText.trim(),
          // text
          "我",
          // user
          "👤"
          // avatar
        );
        const newComment = {
          id: (serverComment == null ? void 0 : serverComment.id) || Date.now(),
          // 使用服务器返回的 id 或生成临时 id
          user: "我",
          text: this.commentText.trim(),
          time: "刚刚",
          avatar: "👤",
          likes: 0
        };
        this.currentCommentMessage.comments.unshift(newComment);
        this.closeCommentModal();
        if (this.currentCommentMessage) {
          this.showMessageComments(this.currentCommentMessage);
        }
        common_vendor.index.showToast({
          title: "评论发表成功！",
          icon: "success",
          duration: 2e3
        });
      } catch (error) {
        common_vendor.index.showToast({
          title: "网络错误，请重试",
          icon: "error",
          duration: 2e3
        });
      }
    },
    // 评论输入事件
    onCommentInput(e) {
      this.commentText = e.detail.value;
    },
    // 评论输入框获得焦点
    onCommentFocus() {
    },
    // 评论输入框失去焦点
    onCommentBlur() {
    },
    // 处理消息评论点击
    handleMessageComment(message) {
      this.addCommentToMessage(message);
    },
    // 删除评论
    async deleteComment(message, commentIndex) {
      const comment = message.comments[commentIndex];
      if (!comment) {
        return;
      }
      const wasModalOpen = this.showModal;
      if (wasModalOpen) {
        this.showModal = false;
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
      const res = await common_vendor.index.showModal({
        title: "确认删除",
        content: "确定要删除这条评论吗？",
        confirmText: "删除",
        cancelText: "取消",
        confirmColor: "#ff4757"
      });
      if (!res.confirm) {
        if (wasModalOpen) {
          this.showModal = true;
        }
        return;
      }
      try {
        if (comment.id) {
          const contentId = message.serverId || message.id;
          const response = await utils_apiService.apiService.deleteComment(contentId, comment.id);
          const isSuccess = (response == null ? void 0 : response.success) === true || (response == null ? void 0 : response.success) === void 0 && response !== void 0;
          if (!isSuccess) {
            const errorMessage = (response == null ? void 0 : response.message) || "删除失败";
            throw new Error(errorMessage);
          }
        }
        message.comments.splice(commentIndex, 1);
        if (wasModalOpen) {
          this.showModal = true;
        }
        common_vendor.index.showToast({
          title: "评论已删除",
          icon: "success",
          duration: 1500
        });
      } catch (error) {
        if (wasModalOpen) {
          this.showModal = true;
        }
        common_vendor.index.showToast({
          title: "删除失败，请重试",
          icon: "error",
          duration: 2e3
        });
      }
    },
    // 处理消息点赞点击
    async handleMessageLike(message) {
      if (message.isLiked) {
        message.likes--;
        message.isLiked = false;
        common_vendor.index.showToast({
          title: "取消点赞",
          icon: "none"
        });
      } else {
        const contentId = message.serverId || message.id;
        const result = await this.likeContent(contentId);
        if (result) {
          message.likes = result.likes;
          message.isLiked = true;
          common_vendor.index.showToast({
            title: "点赞成功！",
            icon: "success"
          });
        }
      }
    },
    // 导航栏切换方法
    // ==================== WebSocket 连接与消息处理 ====================
    // 建立WebSocket连接
    connectWebSocket() {
      try {
        const serverUrl = this.getServerUrl() || config_serverMode.API_BASE_URL;
        const wsUrl = serverUrl.replace(/^http/, "ws") + "/ws";
        this.socketTask = common_vendor.index.connectSocket({
          url: wsUrl,
          success: () => {
          },
          fail: (err) => {
            this.scheduleWSReconnect();
          }
        });
        this.socketTask.onOpen(() => {
          this.wsReconnectAttempts = 0;
          this.startWSHeartbeat();
          this.sendWSMessage({
            type: "register",
            clientType: "miniprogram",
            userId: common_vendor.index.getStorageSync("userId") || "guest"
          });
        });
        this.socketTask.onMessage((res) => {
          try {
            const data = JSON.parse(res.data);
            this.handleWSMessage(data);
          } catch (error) {
          }
        });
        this.socketTask.onClose(() => {
          this.stopWSHeartbeat();
          this.scheduleWSReconnect();
        });
        this.socketTask.onError((err) => {
          this.stopWSHeartbeat();
          this.scheduleWSReconnect();
        });
      } catch (error) {
        this.scheduleWSReconnect();
      }
    },
    // 处理WebSocket消息
    handleWSMessage(data) {
      if (this.streamId && data.streamId && data.streamId !== this.streamId) {
        return;
      }
      switch (data.type) {
        case "liveStatus":
        case "live-status-changed":
          let liveData = data.data;
          if (data.type === "live-status-changed") {
            liveData = {
              isLive: data.data.status === "started",
              streamUrl: data.data.streamUrl,
              liveId: data.data.liveId,
              startTime: data.data.startTime
            };
          }
          this.handleLiveStatusUpdate(liveData);
          break;
        case "aiStatus":
          this.handleAIStatusUpdate(data.data);
          break;
        case "votesUpdate":
        case "votes-updated":
          this.handleVotesUpdate(data.data);
          break;
        case "newAIContent":
          this.handleNewAIContent(data.data);
          break;
        case "aiContentDeleted":
          this.handleAIContentDeleted(data.data);
          break;
      }
    },
    // 处理直播状态更新（WebSocket推送）
    async handleLiveStatusUpdate(data) {
      const messageStreamId = data.streamId || data.liveId;
      if (this.streamId && messageStreamId && messageStreamId !== this.streamId) {
        return;
      }
      if (data.streamUrl) {
        await this.setLiveStreamUrlWithHls(data.streamUrl, data.streamName);
      } else if (!this.liveStreamUrl) {
        await this.fetchActiveStreamFromServer();
      }
      if (data.isLive !== void 0) {
        const wasLive = this.isLiveStarted;
        if (data.isLive && !wasLive) {
          if (!this.liveStreamUrl) {
            await this.fetchLiveStatus();
            if (!this.liveStreamUrl) {
              await this.fetchActiveStreamFromServer();
            }
            if (!this.liveStreamUrl) {
              common_vendor.index.showToast({
                title: "未找到可用的直播流，请先配置",
                icon: "none",
                duration: 3e3
              });
              return;
            }
          }
          this.$nextTick(async () => {
            if (this.liveStreamUrl) {
              this.isLiveStarted = true;
              common_vendor.index.showToast({
                title: "直播已开始",
                icon: "success",
                duration: 2e3
              });
              setTimeout(() => {
                this.startAIContentAfterLiveStart();
              }, 1e3);
            } else {
              common_vendor.index.showToast({
                title: "收到直播开始信号，但缺少流地址",
                icon: "none",
                duration: 3e3
              });
            }
          });
        } else if (!data.isLive && wasLive) {
          this.isLiveStarted = false;
          common_vendor.index.showToast({
            title: "直播已结束，即将返回",
            icon: "none",
            duration: 2e3
          });
          setTimeout(() => {
            common_vendor.index.redirectTo({
              url: "/pages/live-select/live-select",
              success: () => {
              },
              fail: (err) => {
                common_vendor.index.navigateBack({
                  delta: 1,
                  fail: () => {
                    common_vendor.index.navigateTo({
                      url: "/pages/live-select/live-select"
                    });
                  }
                });
              }
            });
          }, 1500);
        } else if (data.isLive === wasLive)
          ;
      } else {
        if (data.streamUrl) {
          await this.setLiveStreamUrlWithHls(data.streamUrl, data.streamName);
        }
      }
    },
    // 处理AI状态更新
    handleAIStatusUpdate(data) {
      if (data.status) {
        this.isListening = data.status === "running";
        if (data.status === "running") {
          if (this.recognitionTimer) {
            clearInterval(this.recognitionTimer);
          }
          this.recognitionTimer = setInterval(() => {
            this.fetchAIContent();
          }, 5e3);
        } else if (data.status === "stopped") {
          if (this.recognitionTimer) {
            clearInterval(this.recognitionTimer);
            this.recognitionTimer = null;
          }
        }
      }
    },
    // 处理票数更新（支持多直播流）- 完全符合文档要求
    handleVotesUpdate(data) {
      const streamId = data.streamId || null;
      const currentStreamId = this.streamId || null;
      if (streamId === currentStreamId || streamId === null) {
        if (data.leftVotes !== void 0 && data.rightVotes !== void 0) {
          const leftVal = Number(data.leftVotes) || 0;
          const rightVal = Number(data.rightVotes) || 0;
          if (leftVal < 0 || rightVal < 0) {
            this.topLeftVotes = Math.max(0, this.topLeftVotes + leftVal);
            this.topRightVotes = Math.max(0, this.topRightVotes + rightVal);
            this.debouncedFetchVoteData();
          } else {
            this.topLeftVotes = Math.max(0, leftVal + 50);
            this.topRightVotes = Math.max(0, rightVal + 50);
          }
        }
        if (data.leftPercentage !== void 0) {
          this.leftPercentage = data.leftPercentage;
        }
        if (data.rightPercentage !== void 0) {
          this.rightPercentage = data.rightPercentage;
        }
      }
    },
    // 处理新增AI内容
    handleNewAIContent(data) {
      const exists = this.aiMessages.some((msg) => msg.serverId === data.id);
      if (!exists) {
        this.addAIMessage(data);
      }
    },
    // 处理AI内容删除
    handleAIContentDeleted(data) {
      const contentId = data.contentId;
      this.aiMessages = this.aiMessages.filter((msg) => msg.serverId !== contentId);
    },
    // 发送WebSocket消息
    sendWSMessage(data) {
      if (this.socketTask) {
        this.socketTask.send({
          data: JSON.stringify(data),
          success: () => {
          },
          fail: (err) => {
          }
        });
      }
    },
    // 启动心跳
    startWSHeartbeat() {
      this.stopWSHeartbeat();
      this.wsHeartbeatTimer = setInterval(() => {
        this.sendWSMessage({ type: "ping" });
      }, 3e4);
    },
    // 停止心跳
    stopWSHeartbeat() {
      if (this.wsHeartbeatTimer) {
        clearInterval(this.wsHeartbeatTimer);
        this.wsHeartbeatTimer = null;
      }
    },
    // 计划重连
    scheduleWSReconnect() {
      if (this.wsReconnectTimer) {
        clearTimeout(this.wsReconnectTimer);
        this.wsReconnectTimer = null;
      }
      if (this.wsReconnectAttempts >= this.wsMaxReconnectAttempts) {
        return;
      }
      this.wsReconnectAttempts++;
      const delay = Math.min(1e3 * Math.pow(2, this.wsReconnectAttempts), 3e4);
      this.wsReconnectTimer = setTimeout(() => {
        this.connectWebSocket();
      }, delay);
    },
    // 断开WebSocket连接
    disconnectWebSocket() {
      if (this.socketTask) {
        this.socketTask.close({
          success: () => {
          }
        });
        this.socketTask = null;
      }
      this.stopWSHeartbeat();
      if (this.wsReconnectTimer) {
        clearTimeout(this.wsReconnectTimer);
        this.wsReconnectTimer = null;
      }
    }
  }
};
if (!Array) {
  const _component_PopDecoration = common_vendor.resolveComponent("PopDecoration");
  _component_PopDecoration();
}
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: common_vendor.o((...args) => $options.goBackToSelect && $options.goBackToSelect(...args)),
    b: common_assets._imports_0$1,
    c: common_vendor.o((...args) => $options.toggleLiveCollapse && $options.toggleLiveCollapse(...args)),
    d: common_vendor.t($data.topLeftVotes),
    e: $options.topLeftPercentage + "%",
    f: $options.topLeftPercentage + "%",
    g: common_vendor.t($data.topRightVotes),
    h: $options.topRightPercentage + "%",
    i: $data.isLiveStarted && $data.liveStreamUrl
  }, $data.isLiveStarted && $data.liveStreamUrl ? {
    j: $data.liveStreamUrl,
    k: $data.liveStreamUrl,
    l: $data.isMuted,
    m: common_vendor.o((...args) => $options.handleVideoError && $options.handleVideoError(...args))
  } : {}, {
    n: $data.hlsStatus.show
  }, $data.hlsStatus.show ? {
    o: common_vendor.t($data.hlsStatus.message),
    p: common_vendor.n($data.hlsStatus.type)
  } : {}, {
    q: !$data.isLiveStarted
  }, !$data.isLiveStarted ? {} : {}, {
    r: !$data.isLiveStarted
  }, !$data.isLiveStarted ? {
    s: common_assets._imports_1$1,
    t: common_vendor.o((...args) => $options.startLive && $options.startLive(...args))
  } : {}, {
    v: $data.isLiveStarted
  }, $data.isLiveStarted ? {} : {}, {
    w: $data.isLiveCollapsed ? 1 : "",
    x: $data.isLiveCollapsed
  }, $data.isLiveCollapsed ? common_vendor.e({
    y: $data.isLiveStarted
  }, $data.isLiveStarted ? {} : {}, {
    z: common_vendor.t($data.topLeftVotes),
    A: $options.topLeftPercentage + "%",
    B: $options.topLeftPercentage + "%",
    C: common_vendor.t($data.topRightVotes),
    D: $options.topRightPercentage + "%"
  }) : {}, {
    E: $data.isLiveCollapsed
  }, $data.isLiveCollapsed ? {
    F: common_assets._imports_2$2,
    G: common_vendor.o((...args) => $options.toggleLiveCollapse && $options.toggleLiveCollapse(...args))
  } : {}, {
    H: common_vendor.f($data.aiMessages, (message, k0, i0) => {
      return {
        a: common_vendor.t(message.text),
        b: common_vendor.t(message.comments.length),
        c: common_vendor.o(($event) => $options.handleMessageComment(message), message.id),
        d: common_vendor.t(message.likes),
        e: common_vendor.o(($event) => $options.handleMessageLike(message), message.id),
        f: message.isLiked ? 1 : "",
        g: message.id,
        h: message.side === "left" ? 1 : "",
        i: message.side === "right" ? 1 : "",
        j: common_vendor.o(($event) => $options.handleMessageClick(message), message.id)
      };
    }),
    I: common_assets._imports_3$1,
    J: common_assets._imports_4,
    K: $data.aiMessages.length === 0
  }, $data.aiMessages.length === 0 ? common_vendor.e({
    L: !$data.isLiveStarted
  }, !$data.isLiveStarted ? {} : {}, {
    M: !$data.isLiveStarted
  }, !$data.isLiveStarted ? {} : {}) : {}, {
    N: $data.scrollTop,
    O: $data.isLiveCollapsed ? 1 : "",
    P: $data.isLiveStarted && !$data.showPresetPanel ? 1 : "",
    Q: $data.showPresetSlider && (!$data.isLiveStarted || $data.isLiveStarted && $data.showPresetPanel)
  }, $data.showPresetSlider && (!$data.isLiveStarted || $data.isLiveStarted && $data.showPresetPanel) ? common_vendor.e({
    R: $data.isLiveStarted
  }, $data.isLiveStarted ? {
    S: common_vendor.o((...args) => $options.togglePresetPanel && $options.togglePresetPanel(...args))
  } : {}, {
    T: $data.presetOpinion,
    U: common_vendor.o((...args) => $options.onPresetChange && $options.onPresetChange(...args)),
    V: common_vendor.t($data.presetOpinion),
    W: common_vendor.t($options.getPresetDescription()),
    X: !$data.isLiveStarted && !$data.initialVotesSubmitted || $data.isLiveStarted && $data.votesChanged
  }, !$data.isLiveStarted && !$data.initialVotesSubmitted || $data.isLiveStarted && $data.votesChanged ? {
    Y: common_vendor.o((...args) => $options.confirmPresetVotes && $options.confirmPresetVotes(...args))
  } : {}) : {}, {
    Z: $data.isLiveStarted && !$data.showPresetPanel
  }, $data.isLiveStarted && !$data.showPresetPanel ? {
    aa: common_vendor.t($data.presetOpinion),
    ab: $data.isValueChanging ? 1 : "",
    ac: common_vendor.o((...args) => $options.togglePresetPanel && $options.togglePresetPanel(...args)),
    ad: $data.isValueChanging ? 1 : ""
  } : {}, {
    ae: $data.showPercentageTip
  }, $data.showPercentageTip ? {
    af: common_vendor.t($data.percentageTipText),
    ag: common_vendor.n($data.percentageTipClass)
  } : {}, {
    ah: common_vendor.t($options.currentLeftPercentage),
    ai: $options.currentLeftPercentage + "%",
    aj: $data.dividerHit ? 1 : "",
    ak: $options.currentLeftPercentage + "%",
    al: common_vendor.t($options.currentRightPercentage),
    am: $options.currentRightPercentage + "%",
    an: common_vendor.o((...args) => $options.voteLeft && $options.voteLeft(...args)),
    ao: $data.userVote === "left" ? 1 : "",
    ap: !$data.isLiveStarted ? 1 : "",
    aq: common_vendor.o((...args) => $options.voteRight && $options.voteRight(...args)),
    ar: $data.userVote === "right" ? 1 : "",
    as: !$data.isLiveStarted ? 1 : "",
    at: common_vendor.f($data.voteEffects, (effect, k0, i0) => {
      return {
        a: effect.icon,
        b: effect.id,
        c: common_vendor.n(effect.class),
        d: common_vendor.s(effect.style)
      };
    }),
    av: $data.showModal
  }, $data.showModal ? common_vendor.e({
    aw: common_assets._imports_5,
    ax: common_vendor.t($data.selectedMessage ? $data.selectedMessage.text : ""),
    ay: common_assets._imports_3$1,
    az: common_vendor.t($data.selectedMessage ? $data.selectedMessage.comments.length : 0),
    aA: $data.selectedMessage && $data.selectedMessage.comments.length > 0
  }, $data.selectedMessage && $data.selectedMessage.comments.length > 0 ? {
    aB: common_vendor.f($data.selectedMessage.comments, (comment, index, i0) => {
      return common_vendor.e({
        a: common_vendor.t(comment.user),
        b: common_vendor.t(comment.time),
        c: comment.user === "我"
      }, comment.user === "我" ? {
        d: common_assets._imports_6,
        e: common_vendor.o(($event) => $options.deleteComment($data.selectedMessage, index), comment.id || index)
      } : {}, {
        f: common_vendor.t(comment.text),
        g: comment.id || index
      });
    })
  } : {}, {
    aC: common_vendor.o((...args) => $options.closeModal && $options.closeModal(...args)),
    aD: common_vendor.o(($event) => $options.addCommentToMessage($data.selectedMessage)),
    aE: common_vendor.o(() => {
    }),
    aF: common_vendor.o((...args) => $options.closeModal && $options.closeModal(...args))
  }) : {}, {
    aG: $data.showCommentModal
  }, $data.showCommentModal ? {
    aH: common_vendor.o((...args) => $options.closeCommentModal && $options.closeCommentModal(...args)),
    aI: $data.commentPlaceholder,
    aJ: common_vendor.o([($event) => $data.commentText = $event.detail.value, (...args) => $options.onCommentInput && $options.onCommentInput(...args)]),
    aK: common_vendor.o((...args) => $options.onCommentFocus && $options.onCommentFocus(...args)),
    aL: common_vendor.o((...args) => $options.onCommentBlur && $options.onCommentBlur(...args)),
    aM: $data.commentText,
    aN: common_vendor.t($data.commentText.length),
    aO: common_vendor.o((...args) => $options.closeCommentModal && $options.closeCommentModal(...args)),
    aP: common_vendor.o((...args) => $options.submitComment && $options.submitComment(...args)),
    aQ: !$data.commentText.trim() ? 1 : "",
    aR: common_vendor.o(() => {
    }),
    aS: common_vendor.o((...args) => $options.closeCommentModal && $options.closeCommentModal(...args))
  } : {});
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/home/home.js.map
