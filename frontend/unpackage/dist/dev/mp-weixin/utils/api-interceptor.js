"use strict";
class ApiInterceptor {
  constructor() {
    this.requestInterceptors = [];
    this.responseInterceptors = [];
    this.errorHandlers = [];
    this.retryConfig = {
      maxRetries: 3,
      retryDelay: 1e3,
      retryCondition: (error) => {
        return error.message.includes("network") || error.message.includes("timeout") || error.statusCode && error.statusCode >= 500;
      }
    };
  }
  /**
   * 添加请求拦截器
   * @param {Function} interceptor - 拦截器函数
   */
  addRequestInterceptor(interceptor) {
    this.requestInterceptors.push(interceptor);
  }
  /**
   * 添加响应拦截器
   * @param {Function} interceptor - 拦截器函数
   */
  addResponseInterceptor(interceptor) {
    this.responseInterceptors.push(interceptor);
  }
  /**
   * 添加错误处理器
   * @param {Function} handler - 错误处理函数
   */
  addErrorHandler(handler) {
    this.errorHandlers.push(handler);
  }
  /**
   * 执行请求拦截器
   * @param {Object} config - 请求配置
   * @returns {Object} 处理后的配置
   */
  async executeRequestInterceptors(config) {
    let processedConfig = { ...config };
    for (const interceptor of this.requestInterceptors) {
      try {
        processedConfig = await interceptor(processedConfig);
      } catch (error) {
      }
    }
    return processedConfig;
  }
  /**
   * 执行响应拦截器
   * @param {Object} response - 响应数据
   * @returns {Object} 处理后的响应
   */
  async executeResponseInterceptors(response) {
    let processedResponse = { ...response };
    for (const interceptor of this.responseInterceptors) {
      try {
        processedResponse = await interceptor(processedResponse);
      } catch (error) {
      }
    }
    return processedResponse;
  }
  /**
   * 执行错误处理器
   * @param {Error} error - 错误对象
   * @param {Object} config - 原始请求配置
   */
  async executeErrorHandlers(error, config) {
    for (const handler of this.errorHandlers) {
      try {
        await handler(error, config);
      } catch (handlerError) {
      }
    }
  }
  /**
   * 带重试的请求方法
   * @param {Function} requestFn - 请求函数
   * @param {Object} config - 请求配置
   * @param {number} retryCount - 当前重试次数
   * @returns {Promise} 请求结果
   */
  async requestWithRetry(requestFn, config, retryCount = 0) {
    try {
      const processedConfig = await this.executeRequestInterceptors(config);
      const response = await requestFn(processedConfig);
      const processedResponse = await this.executeResponseInterceptors(response);
      return processedResponse;
    } catch (error) {
      if (retryCount < this.retryConfig.maxRetries && this.retryConfig.retryCondition(error)) {
        await new Promise((resolve) => setTimeout(resolve, this.retryConfig.retryDelay));
        return await this.requestWithRetry(requestFn, config, retryCount + 1);
      }
      await this.executeErrorHandlers(error, config);
      throw error;
    }
  }
  /**
   * 设置重试配置
   * @param {Object} config - 重试配置
   */
  setRetryConfig(config) {
    this.retryConfig = { ...this.retryConfig, ...config };
  }
  /**
   * 创建默认拦截器
   */
  createDefaultInterceptors() {
    this.addRequestInterceptor((config) => {
      config.timestamp = Date.now();
      config.requestId = `req_${Math.random().toString(36).substr(2, 9)}`;
      return config;
    });
    this.addResponseInterceptor((response) => {
      if (response.config) {
        Date.now() - response.config.timestamp;
      }
      return response;
    });
    this.addErrorHandler((error, config) => {
      ({
        message: error.message,
        code: error.code || "UNKNOWN_ERROR",
        timestamp: Date.now(),
        requestId: config == null ? void 0 : config.requestId,
        url: config == null ? void 0 : config.url,
        method: config == null ? void 0 : config.method
      });
    });
  }
  /**
   * 错误上报（可扩展）
   * @param {Object} errorInfo - 错误信息
   */
  reportError(errorInfo) {
  }
}
const apiInterceptor = new ApiInterceptor();
apiInterceptor.createDefaultInterceptors();
exports.apiInterceptor = apiInterceptor;
//# sourceMappingURL=../../.sourcemap/mp-weixin/utils/api-interceptor.js.map
