"use strict";
const common_vendor = require("../../common/vendor.js");
const config_serverMode = require("../../config/server-mode.js");
const common_assets = require("../../common/assets.js");
const _sfc_main = {
  data() {
    return {
      isLoading: false,
      userInfo: null,
      hasUserInfo: false
    };
  },
  onLoad() {
    this.checkLoginStatus();
  },
  onUnload() {
  },
  methods: {
    async handleLogin() {
      try {
        common_vendor.index.__f__("log", "at pages/index/index.vue:90", "开始登录流程");
        this.isLoading = true;
        this.$nextTick(() => {
          this.initLoadingLottie();
        });
        await this.bypassWechatLogin();
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/index/index.vue:103", "登录处理失败:", error);
        this.isLoading = false;
        common_vendor.index.showToast({
          title: error.message || "登录失败",
          icon: "none",
          duration: 2e3
        });
      }
    },
    // ⚡ 临时方案：跳过微信登录，直接进入
    async bypassWechatLogin() {
      try {
        common_vendor.index.__f__("log", "at pages/index/index.vue:116", "⚡ 临时方案：跳过微信登录，直接进入小程序");
        const tempUserInfo = {
          nickName: "测试用户_" + Math.floor(Math.random() * 1e4),
          avatarUrl: "/static/iconfont/blue-user.png"
        };
        common_vendor.index.__f__("log", "at pages/index/index.vue:124", "生成临时用户信息:", tempUserInfo);
        this.userInfo = tempUserInfo;
        this.hasUserInfo = true;
        common_vendor.index.setStorageSync("userInfo", tempUserInfo);
        common_vendor.index.setStorageSync("loginCode", "temp_bypass_code");
        setTimeout(() => {
          this.isLoading = false;
          common_vendor.index.redirectTo({
            url: "/pages/live-select/live-select"
          });
        }, 1500);
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/index/index.vue:140", "临时登录失败:", error);
        this.isLoading = false;
        throw error;
      }
    },
    // 检查登录状态
    checkLoginStatus() {
      const userInfo = common_vendor.index.getStorageSync("userInfo");
      if (userInfo) {
        this.userInfo = userInfo;
        this.hasUserInfo = true;
        common_vendor.index.__f__("log", "at pages/index/index.vue:153", "已登录用户:", userInfo);
      }
    },
    // 执行微信登录
    async performWechatLogin(userInfoRes) {
      var _a, _b, _c;
      try {
        common_vendor.index.__f__("log", "at pages/index/index.vue:160", "开始微信登录流程...");
        common_vendor.index.__f__("log", "at pages/index/index.vue:161", "运行环境:", this.getPlatform());
        let serverRes;
        let loginCode;
        let currentUserInfo;
        const platform = this.getPlatform();
        const loginRes = await this.wxLogin();
        common_vendor.index.__f__("log", "at pages/index/index.vue:174", "微信登录结果:", loginRes);
        common_vendor.index.__f__("log", "at pages/index/index.vue:177", "%c═══════════════════════════════════════", "color: #4CAF50; font-weight: bold; font-size: 14px;");
        common_vendor.index.__f__("log", "at pages/index/index.vue:178", "%c 微信登录凭证 CODE 已获取 ", "background: #4CAF50; color: white; font-weight: bold; padding: 5px 10px; border-radius: 3px;");
        common_vendor.index.__f__("log", "at pages/index/index.vue:179", "%c═══════════════════════════════════════", "color: #4CAF50; font-weight: bold; font-size: 14px;");
        common_vendor.index.__f__("log", "at pages/index/index.vue:180", "%c Code:", "color: #FF6B9D; font-weight: bold; font-size: 14px;", loginRes.code);
        common_vendor.index.__f__("log", "at pages/index/index.vue:181", "%c 请立即复制此 Code 进行测试:", "color: #FF0000; font-weight: bold; font-size: 16px;");
        common_vendor.index.__f__("log", "at pages/index/index.vue:182", "%c", "color: #FF0000; font-weight: bold; font-size: 14px;", loginRes.code);
        common_vendor.index.__f__("log", "at pages/index/index.vue:183", "%c 完整 Code:", "color: #2196F3; font-weight: bold; font-size: 12px;", loginRes.code);
        common_vendor.index.__f__("log", "at pages/index/index.vue:184", "%c═══════════════════════════════════════", "color: #4CAF50; font-weight: bold; font-size: 14px;");
        if (!loginRes.code) {
          throw new Error("获取微信登录 code 失败");
        }
        common_vendor.index.__f__("log", "at pages/index/index.vue:190", "用户信息:", userInfoRes);
        serverRes = await this.sendToServer({
          code: loginRes.code,
          userInfo: userInfoRes.userInfo,
          encryptedData: userInfoRes.encryptedData,
          iv: userInfoRes.iv
        });
        loginCode = loginRes.code;
        currentUserInfo = userInfoRes.userInfo;
        common_vendor.index.__f__("log", "at pages/index/index.vue:204", "登录成功:", userInfoRes.userInfo);
        this.userInfo = currentUserInfo;
        this.hasUserInfo = true;
        common_vendor.index.setStorageSync("userInfo", currentUserInfo);
        common_vendor.index.setStorageSync("loginCode", loginCode);
        if ((_a = serverRes == null ? void 0 : serverRes.data) == null ? void 0 : _a.token) {
          common_vendor.index.setStorageSync("authToken", serverRes.data.token);
        }
        if ((_b = serverRes == null ? void 0 : serverRes.data) == null ? void 0 : _b.user) {
          common_vendor.index.setStorageSync("currentUser", serverRes.data.user);
        }
        common_vendor.index.__f__("log", "at pages/index/index.vue:223", "登录成功，用户信息已保存");
        common_vendor.index.__f__("log", "at pages/index/index.vue:224", "✅ Token:", ((_c = serverRes == null ? void 0 : serverRes.data) == null ? void 0 : _c.token) ? "已保存" : "未找到");
        setTimeout(() => {
          this.isLoading = false;
          common_vendor.index.redirectTo({
            url: "/pages/live-select/live-select"
          });
        }, 1e3);
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/index/index.vue:248", "微信登录失败:", error);
        this.isLoading = false;
        common_vendor.index.showToast({
          title: error.message || "登录失败，请重试",
          icon: "none",
          duration: 2e3
        });
      }
    },
    // 获取运行平台
    getPlatform() {
      return "mp-weixin";
    },
    // 微信静默登录
    wxLogin() {
      return new Promise((resolve, reject) => {
        common_vendor.index.login({
          provider: "weixin",
          success: (res) => {
            common_vendor.index.__f__("log", "at pages/index/index.vue:283", "微信登录成功:", res);
            resolve(res);
          },
          fail: (err) => {
            common_vendor.index.__f__("error", "at pages/index/index.vue:287", "微信登录失败:", err);
            reject(new Error("微信登录失败"));
          }
        });
      });
    },
    // 获取用户信息（需要用户授权）
    getUserProfile() {
      return new Promise((resolve, reject) => {
        common_vendor.index.getUserProfile({
          desc: "用于完善个人辩论档案",
          success: (res) => {
            common_vendor.index.__f__("log", "at pages/index/index.vue:302", "获取用户信息成功:", res);
            resolve(res);
          },
          fail: (err) => {
            common_vendor.index.__f__("error", "at pages/index/index.vue:306", "获取用户信息失败:", err);
            if (err.errMsg.includes("deny")) {
              resolve({
                userInfo: {
                  nickName: "微信用户",
                  avatarUrl: "/static/logo.png"
                },
                encryptedData: "",
                iv: ""
              });
            } else {
              reject(new Error("获取用户信息失败"));
            }
          }
        });
      });
    },
    // 发送登录信息到服务器
    async sendToServer(loginData) {
      var _a, _b, _c, _d;
      try {
        common_vendor.index.__f__("log", "at pages/index/index.vue:342", "发送登录数据到服务器");
        common_vendor.index.__f__("log", "at pages/index/index.vue:343", "Code (前15位):", ((_a = loginData.code) == null ? void 0 : _a.substring(0, 15)) + "...");
        common_vendor.index.__f__("log", "at pages/index/index.vue:344", "UserInfo:", (_b = loginData.userInfo) == null ? void 0 : _b.nickName);
        const apiBaseURL = config_serverMode.API_BASE_URL || "http://192.168.31.249:8081";
        common_vendor.index.__f__("log", "at pages/index/index.vue:350", "📡 API_BASE_URL 值:", config_serverMode.API_BASE_URL);
        common_vendor.index.__f__("log", "at pages/index/index.vue:351", "📡 实际使用的服务器地址:", apiBaseURL);
        common_vendor.index.__f__("log", "at pages/index/index.vue:352", "📡 完整请求URL:", `${apiBaseURL}/api/wechat-login`);
        const response = await common_vendor.index.request({
          url: `${apiBaseURL}/api/wechat-login`,
          method: "POST",
          data: loginData,
          header: {
            "Content-Type": "application/json"
          },
          timeout: 3e4
          // 增加超时时间到 30 秒，因为需要代理到后端服务器
        });
        common_vendor.index.__f__("log", "at pages/index/index.vue:364", "服务器响应状态:", response.statusCode);
        common_vendor.index.__f__("log", "at pages/index/index.vue:365", "服务器响应数据:", response.data);
        if (response.statusCode === 200 && response.data && response.data.success) {
          const token = (_c = response.data.data) == null ? void 0 : _c.token;
          if (token) {
            common_vendor.index.setStorageSync("authToken", token);
            common_vendor.index.__f__("log", "at pages/index/index.vue:372", "✅ Token 已保存到本地存储");
          }
          return response.data;
        } else {
          const errorMsg = ((_d = response.data) == null ? void 0 : _d.message) || "服务器验证失败";
          throw new Error(errorMsg);
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/index/index.vue:382", "服务器验证失败:", error);
        if (error.errMsg && error.errMsg.includes("timeout")) {
          throw new Error("网络超时，请检查网络连接");
        } else if (error.errMsg && error.errMsg.includes("fail")) {
          throw new Error("网络连接失败，请检查网络设置");
        } else {
          throw new Error(error.message || "服务器验证失败");
        }
      }
    },
    // 退出登录
    logout() {
      common_vendor.index.showModal({
        title: "确认退出",
        content: "确定要退出登录吗？",
        success: (res) => {
          if (res.confirm) {
            common_vendor.index.removeStorageSync("userInfo");
            common_vendor.index.removeStorageSync("loginCode");
            this.userInfo = null;
            this.hasUserInfo = false;
            common_vendor.index.showToast({
              title: "已退出登录",
              icon: "success"
            });
          }
        }
      });
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: common_assets._imports_0,
    b: common_assets._imports_1,
    c: common_assets._imports_2,
    d: common_vendor.o((...args) => $options.handleLogin && $options.handleLogin(...args)),
    e: $data.isLoading
  }, $data.isLoading ? {} : {});
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/index/index.js.map
