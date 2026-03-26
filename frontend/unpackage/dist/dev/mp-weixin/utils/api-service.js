"use strict";
const common_vendor = require("../common/vendor.js");
const utils_apiInterceptor = require("./api-interceptor.js");
const config_serverMode = require("../config/server-mode.js");
const currentUrl = config_serverMode.API_BASE_URL;
const API_CONFIG = {
  development: {
    local: currentUrl,
    original: currentUrl,
    swagger: currentUrl,
    ngrok: currentUrl,
    backend: currentUrl,
    current: currentUrl
  },
  testing: {
    local: currentUrl,
    ngrok: currentUrl,
    backend: currentUrl,
    current: currentUrl
  },
  production: {
    local: currentUrl,
    ngrok: currentUrl,
    backend: currentUrl,
    current: currentUrl
  }
};
const getCurrentEnv = () => {
  return "development";
};
const getCurrentConfig = () => {
  const env = getCurrentEnv();
  return API_CONFIG[env] || API_CONFIG.development;
};
class ApiService {
  constructor() {
    this.config = getCurrentConfig();
    this.baseURL = config_serverMode.API_BASE_URL;
    this.timeout = 1e4;
    if (typeof console !== "undefined") {
      common_vendor.index.__f__("log", "at utils/api-service.js:59", "🔧 ApiService 初始化");
      common_vendor.index.__f__("log", "at utils/api-service.js:60", "📡 API_BASE_URL:", config_serverMode.API_BASE_URL);
      common_vendor.index.__f__("log", "at utils/api-service.js:61", "📡 this.baseURL:", this.baseURL);
    }
  }
  /**
   * 更新API配置
   * @param {string} serverUrl - 新的服务器地址
   */
  updateConfig(serverUrl) {
    this.baseURL = serverUrl || config_serverMode.API_BASE_URL || "http://192.168.31.249:8081";
    if (typeof console !== "undefined") {
      common_vendor.index.__f__("log", "at utils/api-service.js:75", "🔧 ApiService.updateConfig 被调用");
      common_vendor.index.__f__("log", "at utils/api-service.js:76", "📡 新地址:", this.baseURL);
    }
  }
  /**
   * 通用请求方法
   * @param {Object} options - 请求配置
   * @returns {Promise} 请求结果
   */
  async request(options) {
    const {
      url,
      method = "GET",
      data = null,
      headers = {},
      timeout = this.timeout
    } = options;
    const baseUrl = this.baseURL || config_serverMode.API_BASE_URL || "http://192.168.31.249:8081";
    const fullUrl = url.startsWith("http") ? url : `${baseUrl}${url}`;
    if (typeof console !== "undefined") {
      common_vendor.index.__f__("log", "at utils/api-service.js:101", `📤 API请求: ${method} ${fullUrl}`);
    }
    let authToken = null;
    try {
      if (typeof common_vendor.index !== "undefined" && common_vendor.index.getStorageSync) {
        authToken = common_vendor.index.getStorageSync("authToken");
      }
      if (!authToken && typeof localStorage !== "undefined") {
        authToken = localStorage.getItem("authToken");
      }
    } catch (error) {
      common_vendor.index.__f__("log", "at utils/api-service.js:117", "获取 token 失败:", error);
    }
    if (typeof console !== "undefined" && true) {
      if (authToken) {
        common_vendor.index.__f__("log", "at utils/api-service.js:123", "✅ 已找到认证 token，将添加到请求头");
      } else {
        common_vendor.index.__f__("log", "at utils/api-service.js:125", "⚠️  未找到认证 token");
      }
    }
    const defaultHeaders = {
      "Content-Type": "application/json",
      ...headers
    };
    if (authToken) {
      defaultHeaders["Authorization"] = `Bearer ${authToken}`;
    }
    const requestConfig = {
      url: fullUrl,
      method: method.toUpperCase(),
      header: defaultHeaders,
      timeout,
      dataType: "json"
      // 明确指定数据类型
    };
    if (method.toUpperCase() === "POST" && data) {
      requestConfig.data = data;
      common_vendor.index.__f__("log", "at utils/api-service.js:156", "📤 [POST请求] 发送的数据:", JSON.stringify(data, null, 2));
      common_vendor.index.__f__("log", "at utils/api-service.js:157", "📤 [POST请求] 数据类型:", typeof data);
      common_vendor.index.__f__("log", "at utils/api-service.js:158", "📤 [POST请求] Content-Type:", defaultHeaders["Content-Type"]);
    } else {
      requestConfig.data = data;
    }
    return await utils_apiInterceptor.apiInterceptor.requestWithRetry(async (config) => {
      var _a;
      const response = await common_vendor.index.request(config);
      if (response.statusCode >= 200 && response.statusCode < 300) {
        return response.data;
      } else {
        common_vendor.index.__f__("error", "at utils/api-service.js:172", "❌ API请求失败:", {
          url: fullUrl,
          method,
          statusCode: response.statusCode,
          response: response.data,
          responseString: JSON.stringify(response.data, null, 2),
          headers: response.header || response.headers
        });
        const error = new Error(`HTTP ${response.statusCode}: ${((_a = response.data) == null ? void 0 : _a.message) || response.data || "请求失败"}`);
        error.statusCode = response.statusCode;
        error.response = response.data;
        error.url = fullUrl;
        error.method = method;
        throw error;
      }
    }, requestConfig);
  }
  /**
   * 错误处理
   * @param {Error} error - 错误对象
   * @returns {string} 错误信息
   */
  handleError(error) {
    if (error.statusCode === 403) {
      return "服务器拒绝请求（403），可能是权限或CORS配置问题。请检查服务器配置。";
    } else if (error.statusCode === 401) {
      return "未授权（401），请先登录";
    } else if (error.statusCode === 404) {
      return "接口不存在（404），请检查API地址";
    } else if (error.statusCode === 500) {
      return "服务器内部错误（500），请稍后重试";
    }
    if (error.message.includes("timeout")) {
      return "请求超时，请检查网络连接";
    } else if (error.message.includes("network")) {
      return "网络连接失败，请检查网络设置";
    } else if (error.message.includes("403")) {
      return "服务器拒绝请求（403），可能是权限或CORS配置问题";
    } else if (error.message.includes("404")) {
      return "接口不存在，请检查API地址";
    } else if (error.message.includes("500")) {
      return "服务器内部错误，请稍后重试";
    } else {
      return error.message || "请求失败，请稍后重试";
    }
  }
  // ==================== 投票系统接口 ====================
  /**
   * 获取票数统计
   * @param {string} streamId - 直播流ID（必需）
   * @returns {Promise<Object>} 票数数据
   */
  async getVotes(streamId) {
    if (!streamId) {
      throw new Error("获取票数必须指定直播流ID (streamId)");
    }
    const url = `/api/v1/votes?stream_id=${streamId}`;
    return await this.request({
      url,
      method: "GET"
    });
  }
  async getVote(streamId = null) {
    const url = streamId ? `/api/votes?stream_id=${streamId}` : "/api/votes";
    return await this.request({
      url,
      method: "GET"
    });
  }
  /**
   * 用户投票
   * @param {string} side - 投票方 ('left' 或 'right')
   * @param {number} votes - 投票数量，默认10
   * @param {string} streamId - 直播流ID（必需，用于指定投票所属的直播流）
   * @returns {Promise<Object>} 投票结果
   */
  async userVote(side, votes = 10, streamId = null) {
    if (!side || !["left", "right"].includes(side)) {
      throw new Error('投票方必须是 "left" 或 "right"');
    }
    if (!streamId) {
      throw new Error("投票必须指定直播流ID (streamId)");
    }
    const voteCount = parseInt(votes, 10);
    if (isNaN(voteCount) || voteCount < 0 || voteCount > 100) {
      throw new Error("投票数量必须在 0-100 之间（总和必须为100）");
    }
    let userId = null;
    try {
      if (typeof common_vendor.index !== "undefined" && common_vendor.index.getStorageSync) {
        const currentUser = common_vendor.index.getStorageSync("currentUser");
        if (currentUser && currentUser.id) {
          userId = currentUser.id;
        }
      } else if (typeof localStorage !== "undefined") {
        const currentUserStr = localStorage.getItem("currentUser");
        if (currentUserStr) {
          try {
            const currentUser = JSON.parse(currentUserStr);
            if (currentUser && currentUser.id) {
              userId = currentUser.id;
            }
          } catch (e) {
          }
        }
      }
    } catch (error) {
    }
    const totalRequired = 100;
    let leftVotes, rightVotes;
    if (side === "left") {
      leftVotes = voteCount;
      rightVotes = totalRequired - voteCount;
    } else {
      rightVotes = voteCount;
      leftVotes = totalRequired - voteCount;
    }
    if (leftVotes < 0 || leftVotes > totalRequired || rightVotes < 0 || rightVotes > totalRequired) {
      throw new Error(`投票数量无效：单方票数必须在 0-100 之间，总和必须为 ${totalRequired}`);
    }
    const requestData = {
      leftVotes,
      rightVotes
    };
    if (userId) {
      requestData.userId = String(userId);
    }
    requestData.streamId = streamId;
    common_vendor.index.__f__("log", "at utils/api-service.js:334", "📤 投票请求数据 (服务器格式):", JSON.stringify(requestData, null, 2));
    common_vendor.index.__f__("log", "at utils/api-service.js:335", "📤 原始参数:", { side, votes: voteCount });
    try {
      const requestBody = {
        request: {
          ...requestData,
          stream_id: requestData.streamId || streamId
        }
      };
      common_vendor.index.__f__("log", "at utils/api-service.js:347", "📤 最终发送的请求体:", JSON.stringify(requestBody, null, 2));
      const response = await this.request({
        url: "/api/v1/user-vote",
        method: "POST",
        data: requestBody
      });
      try {
        const totals = await this.getVote(streamId);
        return totals;
      } catch (e0) {
        try {
          const totalsV1 = await this.getVotes(streamId);
          return totalsV1;
        } catch (e1) {
          return response;
        }
      }
    } catch (error) {
      common_vendor.index.__f__("error", "at utils/api-service.js:367", "❌ 投票请求失败详细信息:", {
        statusCode: error.statusCode,
        message: error.message,
        response: error.response,
        url: error.url,
        requestData
      });
      if (error.response && error.response.message) {
        common_vendor.index.__f__("error", "at utils/api-service.js:377", "📋 服务器错误消息:", error.response.message);
        common_vendor.index.__f__("error", "at utils/api-service.js:378", "📋 服务器完整响应:", JSON.stringify(error.response, null, 2));
      }
      throw error;
    }
  }
  /**
   * 直接按分布投票（left/right 和为100）
   */
  async userVoteDistribution(leftVotes, rightVotes, streamId, userId = null) {
    if (typeof leftVotes !== "number" || typeof rightVotes !== "number") {
      throw new Error("leftVotes/rightVotes 必须是数字");
    }
    const total = Math.round(leftVotes) + Math.round(rightVotes);
    if (total !== 100) {
      throw new Error("投票总和必须为100");
    }
    if (!streamId) {
      throw new Error("投票必须指定直播流ID (streamId)");
    }
    if (!userId) {
      try {
        if (typeof common_vendor.index !== "undefined" && common_vendor.index.getStorageSync) {
          const currentUser = common_vendor.index.getStorageSync("currentUser");
          if (currentUser && currentUser.id) {
            userId = currentUser.id;
          }
        }
      } catch (e) {
        common_vendor.index.__f__("warn", "at utils/api-service.js:410", "⚠️ 无法获取本地存储的用户ID:", e);
      }
    }
    if (!userId) {
      userId = "guest";
    }
    const testConfigs = [
      {
        name: "格式1-v1路径（直接格式）",
        url: "/api/v1/user-vote",
        data: {
          leftVotes: Math.round(leftVotes),
          rightVotes: Math.round(rightVotes),
          streamId,
          stream_id: streamId,
          userId,
          user_id: userId
        }
      },
      {
        name: "格式2-v1路径（包装格式）",
        url: "/api/v1/user-vote",
        data: {
          request: {
            leftVotes: Math.round(leftVotes),
            rightVotes: Math.round(rightVotes),
            streamId,
            stream_id: streamId,
            userId,
            user_id: userId
          }
        }
      },
      {
        name: "格式3-非v1路径（直接格式）",
        url: "/api/user-vote",
        data: {
          leftVotes: Math.round(leftVotes),
          rightVotes: Math.round(rightVotes),
          streamId,
          stream_id: streamId,
          userId,
          user_id: userId
        }
      },
      {
        name: "格式4-非v1路径（包装格式）",
        url: "/api/user-vote",
        data: {
          request: {
            leftVotes: Math.round(leftVotes),
            rightVotes: Math.round(rightVotes),
            streamId,
            stream_id: streamId,
            userId,
            user_id: userId
          }
        }
      }
    ];
    common_vendor.index.__f__("log", "at utils/api-service.js:475", "🔍 投票请求诊断信息:");
    common_vendor.index.__f__("log", "at utils/api-service.js:476", "  streamId:", streamId);
    common_vendor.index.__f__("log", "at utils/api-service.js:477", "  userId:", userId);
    common_vendor.index.__f__("log", "at utils/api-service.js:478", "  leftVotes:", Math.round(leftVotes));
    common_vendor.index.__f__("log", "at utils/api-service.js:479", "  rightVotes:", Math.round(rightVotes));
    common_vendor.index.__f__("log", "at utils/api-service.js:480", "  测试配置总数:", testConfigs.length);
    for (let i = 0; i < testConfigs.length; i++) {
      const config = testConfigs[i];
      try {
        common_vendor.index.__f__("log", "at utils/api-service.js:486", `📤 [${i + 1}/${testConfigs.length}] 尝试 ${config.name}`);
        common_vendor.index.__f__("log", "at utils/api-service.js:487", "   URL:", config.url);
        common_vendor.index.__f__("log", "at utils/api-service.js:488", "   Data:", JSON.stringify(config.data, null, 2));
        const response = await this.request({
          url: config.url,
          method: "POST",
          data: config.data
        });
        common_vendor.index.__f__("log", "at utils/api-service.js:496", `✅ ${config.name} 成功！返回数据:`, response);
        try {
          const totals = await this.getVote(streamId);
          return totals;
        } catch (e0) {
          try {
            const totalsV1 = await this.getVotes(streamId);
            return totalsV1;
          } catch (e1) {
            return response;
          }
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at utils/api-service.js:511", `❌ ${config.name} 失败:`, {
          statusCode: error.statusCode,
          message: error.message,
          response: error.response
        });
        if (i === testConfigs.length - 1) {
          common_vendor.index.__f__("error", "at utils/api-service.js:520", "🔍 所有格式都失败了！完整错误信息:", {
            statusCode: error.statusCode,
            message: error.message,
            response: error.response,
            url: error.url,
            allAttempts: testConfigs.map((c) => c.name)
          });
          throw error;
        }
      }
    }
  }
  // ==================== AI内容接口 ====================
  /**
   * 获取AI识别内容
   * @param {string} streamId - 直播流ID（可选，不传则使用全局辩题）
   * @returns {Promise<Object>} AI内容列表
   */
  async getAiContent(streamId = null) {
    const url = streamId ? `/api/v1/ai-content?stream_id=${streamId}` : "/api/v1/ai-content";
    return await this.request({
      url,
      method: "GET"
    });
  }
  // ==================== 评论系统接口 ====================
  /**
   * 添加评论
   * @param {string} contentId - 内容ID（UUID字符串）
   * @param {string} text - 评论内容
   * @param {string} user - 用户名，默认"匿名用户"
   * @param {string} avatar - 用户头像，默认"👤"
   * @returns {Promise<Object>} 评论结果
   */
  async addComment(contentId, text, user = "匿名用户", avatar = "👤") {
    if (!contentId || !text) {
      throw new Error("内容ID和评论内容不能为空");
    }
    return await this.request({
      url: "/api/comment",
      method: "POST",
      data: {
        contentId: String(contentId),
        // 确保是字符串
        text: text.trim(),
        user: user.trim() || "匿名用户",
        avatar: avatar || "👤"
      }
    });
  }
  /**
   * 点赞功能
   * @param {string} contentId - 内容ID（UUID字符串）
   * @param {string} commentId - 评论ID（UUID字符串，可选，不传则点赞内容）
   * @returns {Promise<Object>} 点赞结果
   */
  async like(contentId, commentId = null) {
    if (!contentId) {
      throw new Error("内容ID不能为空");
    }
    const data = {
      contentId: String(contentId)
      // 确保是字符串
    };
    if (commentId !== null && commentId !== void 0) {
      data.commentId = String(commentId);
    }
    return await this.request({
      url: "/api/like",
      method: "POST",
      data
    });
  }
  /**
   * 删除评论
   * @param {string} contentId - 内容ID（UUID字符串）
   * @param {string} commentId - 评论ID（UUID字符串）
   * @returns {Promise<Object>} 删除结果
   */
  async deleteComment(contentId, commentId) {
    if (!contentId || !commentId) {
      throw new Error("内容ID和评论ID不能为空");
    }
    return await this.request({
      url: `/api/comment/${commentId}`,
      method: "DELETE",
      data: {
        contentId: String(contentId)
        // 确保是字符串
      }
    });
  }
  // ==================== 辩题管理接口 ====================
  /**
   * 获取辩题信息
   * @param {string} streamId - 直播流ID（可选，不传则使用全局辩题）
   * @returns {Promise<Object>} 辩题数据
   */
  async getDebateTopic(streamId = null) {
    const url = streamId ? `/api/v1/debate-topic?stream_id=${streamId}` : "/api/v1/debate-topic";
    const response = await this.request({
      url,
      method: "GET"
    });
    let debateData = null;
    if (response && response.success && response.data) {
      debateData = response.data;
    } else if (response && response.data) {
      debateData = response.data;
    } else if (response && typeof response === "object" && !response.success) {
      debateData = response;
    } else {
      common_vendor.index.__f__("warn", "at utils/api-service.js:652", "⚠️ 辩题响应格式不符合预期:", response);
      return null;
    }
    if (debateData) {
      if (debateData.leftPosition && !debateData.leftSide) {
        debateData.leftSide = debateData.leftPosition;
      }
      if (debateData.rightPosition && !debateData.rightSide) {
        debateData.rightSide = debateData.rightPosition;
      }
      return {
        success: true,
        data: {
          id: debateData.id || null,
          title: debateData.title || "",
          description: debateData.description || "",
          leftSide: debateData.leftSide || debateData.leftPosition || "",
          rightSide: debateData.rightSide || debateData.rightPosition || "",
          leftPosition: debateData.leftPosition || debateData.leftSide || "",
          rightPosition: debateData.rightPosition || debateData.rightSide || ""
        }
      };
    }
    return null;
  }
  /**
   * 查询用户投票状态
   * @param {string} streamId - 直播流ID（必需）
   * @returns {Promise<Object>} 用户投票数据
   */
  async getUserVotes(streamId) {
    if (!streamId) {
      throw new Error("查询用户投票状态必须指定直播流ID (streamId)");
    }
    let userId = null;
    try {
      if (typeof common_vendor.index !== "undefined" && common_vendor.index.getStorageSync) {
        const currentUser = common_vendor.index.getStorageSync("currentUser");
        if (currentUser && currentUser.id) {
          userId = currentUser.id;
        }
      } else if (typeof localStorage !== "undefined") {
        const currentUserStr = localStorage.getItem("currentUser");
        if (currentUserStr) {
          try {
            const currentUser = JSON.parse(currentUserStr);
            if (currentUser && currentUser.id) {
              userId = currentUser.id;
            }
          } catch (e) {
          }
        }
      }
    } catch (error) {
    }
    if (!userId) {
      throw new Error("用户未登录，无法获取投票记录");
    }
    const url = `/api/v1/user-votes?stream_id=${streamId}&user_id=${userId}`;
    const response = await this.request({ url, method: "GET" });
    if (response && response.success && response.data) {
      return response.data;
    }
    return response;
  }
  // ==================== 工具方法 ====================
  /**
   * 测试API连接
   * @param {string} streamId - 直播流ID（可选，如果提供则测试投票API，否则仅测试基础连接）
   * @returns {Promise<boolean>} 连接是否成功
   */
  async testConnection(streamId = null) {
    try {
      if (streamId) {
        await this.getVotes(streamId);
      } else {
        await this.request({
          url: "/api/admin/live/status",
          method: "GET"
        });
      }
      return true;
    } catch (error) {
      return false;
    }
  }
  /**
   * 获取当前配置信息
   * @returns {Object} 当前配置
   */
  getCurrentConfig() {
    return {
      baseURL: this.baseURL,
      timeout: this.timeout,
      config: this.config
    };
  }
  /**
   * 切换API服务器
   * @param {string} serverType - 服务器类型
   * @returns {string|null} 新的服务器地址
   */
  switchApiServer(serverType) {
    const env = getCurrentEnv();
    const config = API_CONFIG[env];
    if (config && config[serverType]) {
      config.current = config[serverType];
      this.baseURL = config[serverType];
      return config[serverType];
    } else {
      return null;
    }
  }
  /**
   * 获取当前服务器信息
   * @returns {Object} 服务器信息
   */
  getCurrentServerInfo() {
    const config = getCurrentConfig();
    const availableServers = Object.keys(config).filter((key) => key !== "current");
    return {
      current: config.current,
      environment: getCurrentEnv(),
      available: availableServers.map((type) => ({
        type,
        url: config[type]
      }))
    };
  }
  /**
   * 获取当前直播状态
   * @returns {Promise<Object>} { isLive, streamUrl, ... }
   */
  async getLiveStatus() {
    return this.request({ url: "/api/admin/live/status", method: "GET" });
  }
  /**
   * 获取数据概览（包含直播状态）
   * @param {string|null} streamId - 可选，指定要查询的直播流ID。如果提供，则查询该流的Dashboard；否则查询默认Dashboard
   * @returns {Promise<Object>} { isLive, liveStreamUrl, totalUsers, activeUsers, ... }
   */
  async getDashboard(streamId = null) {
    const url = streamId ? `/api/v1/admin/dashboard?stream_id=${streamId}` : "/api/admin/dashboard";
    const response = await this.request({ url, method: "GET" });
    if (response && response.success && response.data) {
      return response.data;
    }
    return response;
  }
  /**
   * 控制直播（用户直接控制）
   * @param {string} action - 'start' 或 'stop'
   * @param {string} streamId - 可选的直播流ID，不传则使用默认启用的直播流
   * @returns {Promise<Object>} 操作结果
   */
  async controlLive(action, streamId = null) {
    if (!action || !["start", "stop"].includes(action)) {
      throw new Error('action 必须是 "start" 或 "stop"');
    }
    const data = { action };
    if (streamId) {
      data.streamId = streamId;
    }
    return this.request({
      url: "/api/live/control",
      method: "POST",
      data
    });
  }
  /**
   * 开始直播（用户直接调用）
   * @param {string} streamId - 可选的直播流ID
   * @returns {Promise<Object>} 操作结果
   */
  async startLive(streamId = null) {
    return this.controlLive("start", streamId);
  }
  /**
   * 停止直播（用户直接调用）
   * @returns {Promise<Object>} 操作结果
   */
  async stopLive() {
    return this.controlLive("stop");
  }
  /**
   * 获取直播流列表
   * @returns {Promise<Array>} 直播流列表
   */
  async getStreamsList() {
    const response = await this.request({ url: "/api/v1/admin/streams", method: "GET" });
    if (response && response.success && response.data && Array.isArray(response.data.streams)) {
      return response.data.streams;
    }
    if (response && response.success && Array.isArray(response.data)) {
      return response.data;
    }
    if (Array.isArray(response)) {
      return response;
    }
    if (response && Array.isArray(response.streams)) {
      return response.streams;
    }
    if (response && response.data && Array.isArray(response.data)) {
      return response.data;
    }
    common_vendor.index.__f__("warn", "at utils/api-service.js:901", "⚠️ 无法解析直播流列表响应格式:", response);
    return [];
  }
  /**
   * 获取指定直播流的投票统计
   * @param {string} streamId - 直播流ID（可选）
   * @returns {Promise<Object>} 投票统计数据
   */
  async getVotesStatistics(streamId = null) {
    const url = streamId ? `/api/v1/admin/votes/statistics?stream_id=${streamId}` : "/api/v1/admin/votes/statistics";
    const response = await this.request({ url, method: "GET" });
    if (response && response.success && response.data) {
      return response.data;
    }
    return response;
  }
  /**
   * 获取 WebSocket URL
   * @returns {string} WebSocket连接地址
   */
  getWebSocketUrl() {
    const baseUrl = this.baseURL || config_serverMode.API_BASE_URL || "http://192.168.31.249:8081";
    const wsProtocol = baseUrl.startsWith("https") ? "wss" : "ws";
    const wsHost = baseUrl.replace(/^https?:\/\//, "");
    return `${wsProtocol}://${wsHost}/ws`;
  }
  /**
   * 获取RTMP转HLS播放地址
   * @param {string} roomName - 房间名称/流名称
   * @returns {Promise<Object>} HLS播放地址等信息
   */
  async getRtmpToHlsUrls(roomName) {
    if (!roomName) {
      throw new Error("房间名称不能为空");
    }
    try {
      const response = await this.request({
        url: `/api/admin/rtmp/urls?room_name=${encodeURIComponent(roomName)}`,
        method: "GET"
      });
      if (response && response.success && response.data) {
        common_vendor.index.__f__("log", "at utils/api-service.js:950", "✅ [RTMP转HLS] API返回数据:", {
          room_name: response.data.room_name,
          push_url: response.data.push_url,
          play_flv: response.data.play_flv,
          play_hls: response.data.play_hls
        });
        return response.data;
      }
      common_vendor.index.__f__("warn", "at utils/api-service.js:959", "⚠️ [RTMP转HLS] API返回格式异常:", response);
      return response;
    } catch (error) {
      common_vendor.index.__f__("error", "at utils/api-service.js:962", "获取RTMP转HLS地址失败:", error);
      throw error;
    }
  }
  /**
   * 从流URL中提取房间名（用于RTMP转HLS）
   * @param {string} streamUrl - 流地址
   * @returns {string|null} 房间名
   */
  extractRoomNameFromUrl(streamUrl) {
    if (!streamUrl)
      return null;
    try {
      let path = streamUrl.replace(/^[a-zA-Z]+:\/\//, "");
      const parts = path.split("/");
      if (parts.length < 3)
        return null;
      let roomName = parts[parts.length - 1];
      roomName = roomName.replace(/\.(m3u8|flv|mp4)$/, "");
      return roomName || null;
    } catch (error) {
      common_vendor.index.__f__("error", "at utils/api-service.js:995", "解析房间名失败:", error);
      return null;
    }
  }
  /**
   * 智能转换流地址为HLS格式（如果需要）
   * @param {string} streamUrl - 原始流地址
   * @param {string} streamName - 流名称（可选）
   * @returns {Promise<string>} HLS播放地址
   */
  async convertToHlsIfNeeded(streamUrl, streamName = null) {
    if (!streamUrl) {
      throw new Error("流地址不能为空");
    }
    if (streamUrl.includes(".m3u8")) {
      common_vendor.index.__f__("log", "at utils/api-service.js:1013", "✅ 流地址已经是HLS格式，无需转换:", streamUrl);
      return streamUrl;
    }
    if (streamUrl.startsWith("rtmp://") || streamUrl.includes(".flv")) {
      common_vendor.index.__f__("log", "at utils/api-service.js:1019", "🔄 检测到RTMP/FLV格式流，正在获取FLV地址...");
      const roomName = streamName || this.extractRoomNameFromUrl(streamUrl);
      if (!roomName) {
        common_vendor.index.__f__("error", "at utils/api-service.js:1025", "❌ 无法从URL中提取房间名:", streamUrl);
        throw new Error("无法解析流地址，请提供房间名");
      }
      try {
        common_vendor.index.__f__("log", "at utils/api-service.js:1031", "🔍 [FLV转换] 正在调用API，房间名:", roomName);
        const urls = await this.getRtmpToHlsUrls(roomName);
        common_vendor.index.__f__("log", "at utils/api-service.js:1034", "📦 [FLV转换] API返回结果:", JSON.stringify(urls, null, 2));
        if (urls && urls.play_hls) {
          common_vendor.index.__f__("log", "at utils/api-service.js:1038", "✅ [HLS转换] 成功获取HLS地址:", urls.play_hls);
          let hlsUrl = urls.play_hls;
          if (hlsUrl.includes("localhost")) {
            const apiBaseUrl = this.baseURL || config_serverMode.API_BASE_URL;
            const serverIpMatch = apiBaseUrl.match(/https?:\/\/([^:\/]+)/);
            const serverIp = serverIpMatch ? serverIpMatch[1] : "192.168.31.189";
            hlsUrl = hlsUrl.replace("localhost", serverIp);
            common_vendor.index.__f__("log", "at utils/api-service.js:1051", "🔄 [HLS转换] 已修正 localhost 为真实IP:", hlsUrl);
          }
          if (hlsUrl.includes("192.168.31.189:8086")) {
            common_vendor.index.__f__("log", "at utils/api-service.js:1057", "🔄 [HLS转换] 使用原始SRS地址（不使用代理）:", {
              原始地址: hlsUrl,
              说明: "直接使用SRS服务器，避免代理转发的兼容性问题"
            });
          }
          common_vendor.index.__f__("log", "at utils/api-service.js:1063", "📺 [HLS转换] 最终HLS地址:", hlsUrl);
          common_vendor.index.__f__("log", "at utils/api-service.js:1064", "📺 [转换完成] 流地址信息:", {
            push_url: urls.push_url,
            play_flv: urls.play_flv,
            play_hls: hlsUrl,
            格式: "HLS (原生video组件支持更好)"
          });
          return hlsUrl;
        } else if (urls && urls.play_flv) {
          common_vendor.index.__f__("warn", "at utils/api-service.js:1073", "⚠️ [HLS转换] 无法获取HLS地址，使用FLV作为备选");
          let flvUrl = urls.play_flv;
          if (flvUrl.includes("localhost")) {
            const apiBaseUrl = this.baseURL || config_serverMode.API_BASE_URL;
            const serverIpMatch = apiBaseUrl.match(/https?:\/\/([^:\/]+)/);
            const serverIp = serverIpMatch ? serverIpMatch[1] : "192.168.31.189";
            flvUrl = flvUrl.replace("localhost", serverIp);
          }
          if (flvUrl.includes("192.168.31.189:8086")) {
            common_vendor.index.__f__("log", "at utils/api-service.js:1085", "🔄 [FLV备选] 使用原始SRS地址（不使用代理）:", flvUrl);
          }
          common_vendor.index.__f__("log", "at utils/api-service.js:1088", "📺 [FLV备选] 最终FLV地址:", flvUrl);
          return flvUrl;
        } else {
          common_vendor.index.__f__("error", "at utils/api-service.js:1091", "❌ [FLV转换] API返回数据中没有FLV或HLS地址, 完整响应:", urls);
          throw new Error("无法获取播放地址");
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at utils/api-service.js:1095", "❌ [FLV转换] 转换失败:", {
          error: error.message,
          stack: error.stack,
          roomName
        });
        throw new Error(`获取播放地址失败: ${error.message}`);
      }
    }
    common_vendor.index.__f__("log", "at utils/api-service.js:1105", "⚠️ 未知格式的流地址，直接返回:", streamUrl);
    return streamUrl;
  }
}
const apiService = new ApiService();
exports.apiService = apiService;
//# sourceMappingURL=../../.sourcemap/mp-weixin/utils/api-service.js.map
