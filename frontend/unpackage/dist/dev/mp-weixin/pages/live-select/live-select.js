"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_apiService = require("../../utils/api-service.js");
const common_assets = require("../../common/assets.js");
const _sfc_main = {
  data() {
    return {
      loading: true,
      liveStreams: [],
      wsConnection: null,
      reconnectTimer: null
    };
  },
  onLoad() {
    common_vendor.index.__f__("log", "at pages/live-select/live-select.vue:95", "📺 直播选择页面加载");
    this.loadLiveStreams();
    this.connectWebSocket();
  },
  onShow() {
    this.refreshStreams();
  },
  onUnload() {
    this.disconnectWebSocket();
  },
  methods: {
    async loadLiveStreams() {
      try {
        this.loading = true;
        const streams = await utils_apiService.apiService.getStreamsList();
        if (!streams || streams.length === 0) {
          this.liveStreams = [];
          this.loading = false;
          return;
        }
        const enabledStreams = streams.filter((s) => s.enabled);
        if (enabledStreams.length === 0) {
          this.liveStreams = [];
          this.loading = false;
          return;
        }
        const streamsWithDetails = await Promise.all(
          enabledStreams.map((stream) => this.fetchStreamDetails(stream))
        );
        this.liveStreams = streamsWithDetails;
        this.loading = false;
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/live-select/live-select.vue:135", "❌ 加载直播流列表失败:", error);
        this.loading = false;
        common_vendor.index.showToast({
          title: "加载失败",
          icon: "none"
        });
      }
    },
    async fetchStreamDetails(stream) {
      try {
        const dashboard = await utils_apiService.apiService.getDashboard(stream.id);
        const isCurrentlyLive = (dashboard == null ? void 0 : dashboard.isLive) === true;
        let debateTopic = null;
        if (dashboard && dashboard.debateTopic) {
          debateTopic = {
            title: dashboard.debateTopic.title || "",
            leftSide: dashboard.debateTopic.leftSide || "",
            rightSide: dashboard.debateTopic.rightSide || "",
            description: dashboard.debateTopic.description || ""
          };
        }
        if (!debateTopic) {
          const debateResponse = await utils_apiService.apiService.getDebateTopic(stream.id);
          if (debateResponse && debateResponse.success && debateResponse.data) {
            debateTopic = debateResponse.data;
          } else if (debateResponse && debateResponse.data) {
            debateTopic = debateResponse.data;
          } else if (debateResponse && debateResponse.title) {
            debateTopic = debateResponse;
          }
        }
        return {
          ...stream,
          isLive: isCurrentlyLive,
          activeUsers: isCurrentlyLive ? (dashboard == null ? void 0 : dashboard.activeUsers) || 0 : 0,
          debateTopic
        };
      } catch (error) {
        return {
          ...stream,
          isLive: false,
          activeUsers: 0
        };
      }
    },
    async refreshStreams() {
      await this.loadLiveStreams();
      common_vendor.index.showToast({
        title: "刷新成功",
        icon: "success",
        duration: 1500
      });
    },
    enterLiveRoom(stream) {
      if (!stream.isLive) {
        common_vendor.index.showToast({
          title: "直播未开始",
          icon: "none"
        });
        return;
      }
      common_vendor.index.navigateTo({
        url: `/pages/home/home?streamId=${stream.id}`
      });
    },
    // WebSocket methods kept minimal for brevity but fully functional
    connectWebSocket() {
      try {
        const wsUrl = utils_apiService.apiService.getWebSocketUrl();
        this.wsConnection = common_vendor.index.connectSocket({
          url: wsUrl,
          success: () => common_vendor.index.__f__("log", "at pages/live-select/live-select.vue:215", "✅ WebSocket 连接请求已发送")
        });
        this.wsConnection.onMessage((event) => {
          try {
            const message = JSON.parse(event.data);
            this.handleWebSocketMessage(message);
          } catch (error) {
            common_vendor.index.__f__("error", "at pages/live-select/live-select.vue:222", "❌ 解析 WebSocket 消息失败:", error);
          }
        });
        this.wsConnection.onError(() => this.scheduleReconnect());
        this.wsConnection.onClose(() => this.scheduleReconnect());
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/live-select/live-select.vue:228", "❌ 创建 WebSocket 连接失败:", error);
      }
    },
    disconnectWebSocket() {
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }
      if (this.wsConnection) {
        this.wsConnection.close();
        this.wsConnection = null;
      }
    },
    scheduleReconnect() {
      if (this.reconnectTimer)
        return;
      this.reconnectTimer = setTimeout(() => {
        this.reconnectTimer = null;
        this.connectWebSocket();
      }, 5e3);
    },
    handleWebSocketMessage(message) {
      const { type, streamId, liveId, data } = message;
      const currentStreamId = streamId || liveId || (data == null ? void 0 : data.streamId) || (data == null ? void 0 : data.liveId);
      if (type === "liveStatus" || type === "live-status-changed") {
        if (currentStreamId && data)
          this.updateLiveStatus(currentStreamId, data);
      }
    },
    updateLiveStatus(streamId, data) {
      const stream = this.liveStreams.find((s) => s.id === streamId);
      if (stream) {
        const isLive = data.isLive !== void 0 ? data.isLive : data.status === "started" || data.status === "running";
        stream.isLive = isLive;
        if (data.activeUsers !== void 0)
          stream.activeUsers = data.activeUsers;
        this.$forceUpdate();
      }
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: $data.loading
  }, $data.loading ? {} : $data.liveStreams.length > 0 ? {
    c: common_vendor.f($data.liveStreams, (stream, k0, i0) => {
      return common_vendor.e({
        a: common_vendor.t(stream.isLive ? "LIVE NOW" : "OFFLINE"),
        b: stream.isLive ? 1 : "",
        c: stream.debateTopic && stream.debateTopic.title
      }, stream.debateTopic && stream.debateTopic.title ? {
        d: common_vendor.t(stream.debateTopic.title)
      } : {}, {
        e: stream.debateTopic && stream.debateTopic.leftSide
      }, stream.debateTopic && stream.debateTopic.leftSide ? {
        f: common_vendor.t(stream.debateTopic.leftSide),
        g: common_vendor.t(stream.debateTopic.rightSide)
      } : {}, {
        h: common_vendor.t(stream.isLive ? "ENTER" : "WAITING"),
        i: stream.isLive
      }, stream.isLive ? {
        j: common_assets._imports_1$1
      } : {
        k: common_assets._imports_1$2
      }, {
        l: !stream.isLive ? 1 : "",
        m: stream.id,
        n: stream.isLive ? 1 : "",
        o: common_vendor.o(($event) => $options.enterLiveRoom(stream), stream.id)
      });
    })
  } : {
    d: common_assets._imports_2$1
  }, {
    b: $data.liveStreams.length > 0,
    e: common_assets._imports_3,
    f: common_vendor.o((...args) => $options.refreshStreams && $options.refreshStreams(...args))
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-37499f9a"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/live-select/live-select.js.map
