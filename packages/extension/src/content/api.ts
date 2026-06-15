/**
 * API 兼容层 - 提供 $syncer/$poster API（兼容旧版插件）
 *
 * 旧版 API:
 * - $syncer.getAccounts(cb) - 获取已登录平台
 * - $syncer.addTask(task, statusHandler, cb) - 添加同步任务
 * - $syncer.uploadImage(data, cb) - 上传图片（实际调用 magicCall）
 * - $syncer.magicCall(data, cb) - 魔术调用
 * - $syncer.updateDriver(data, cb) - 更新驱动（敏感API，仅白名单）
 * - $syncer.startInspect(handler, cb) - 开始检查（敏感API，仅白名单）
 *
 * 注入脚本位于 public/inject-api.js（Manifest V3 不支持内联脚本）
 */

import { htmlToMarkdownNative } from '@wechatsync/core'
import { createLogger } from '../lib/logger'

const logger = createLogger('Wechatsync')

// 敏感 API 白名单（仅 updateDriver 和 startInspect 需要检查）
const SENSITIVE_API_WHITELIST = [
  'https://www.wechatsync.com',
  'https://developer.wechatsync.com',
  'http://localhost:8080',
];

// 当前同步任务 ID（用于过滤消息）
let currentSyncId: string | null = null;

// 当前同步任务的账户状态（兼容旧版 API）
interface AccountStatus {
  type: string;
  title: string;
  displayName?: string;
  icon?: string;
  avatar?: string;
  uid?: string;
  home?: string;
  supportTypes?: string[];
  status: 'pending' | 'uploading' | 'done' | 'failed';
  msg?: string;
  error?: string;
  editResp?: { draftLink?: string } | null;
}
let currentAccounts: AccountStatus[] = [];

/**
 * 发送消息到页面
 */
function sendToWindow(msg: Record<string, unknown>) {
  msg.callReturn = true;
  window.postMessage(JSON.stringify(msg), '*');
}

/**
 * 发送进度更新到页面
 */
function sendTaskUpdate(task: Record<string, unknown>) {
  window.postMessage(JSON.stringify({
    method: 'taskUpdate',
    task,
  }), '*');
}

/**
 * 发送控制台日志到页面
 */
function sendConsoleLog(args: unknown) {
  window.postMessage(JSON.stringify({
    method: 'consoleLog',
    args,
  }), '*');
}

/**
 * 监听来自 background 的消息
 */
chrome.runtime.onMessage.addListener((message, _sender, _sendResponse) => {
  try {
    // 过滤不相关的 syncId
    if (message.syncId && currentSyncId && message.syncId !== currentSyncId) {
      return;
    }

    // 旧版 taskUpdate 消息格式
    if (message.method === 'taskUpdate') {
      sendToWindow({
        task: message.task,
        method: 'taskUpdate',
      });
      return;
    }

    // 旧版 consoleLog 消息格式
    if (message.method === 'consoleLog') {
      sendToWindow({
        args: message.args,
        method: 'consoleLog',
      });
      return;
    }

    // 新版同步进度更新 -> 转换为旧版格式（更新对应账户状态）
    if (message.type === 'SYNC_PROGRESS') {
      const result = message.result || message.payload?.result;
      if (result) {
        // 更新对应账户的状态
        const account = currentAccounts.find(a => a.type === result.platform);
        if (account) {
          account.status = result.success ? 'done' : 'failed';
          account.error = result.error;
          account.msg = undefined;
          account.editResp = result.success ? { draftLink: result.postUrl || result.url } : null;
        }
        // 发送完整的账户状态列表
        sendTaskUpdate({ accounts: currentAccounts });
      }
    }

    // 新版详细进度更新 -> 转换为旧版格式（更新对应账户状态）
    if (message.type === 'SYNC_DETAIL_PROGRESS') {
      const progress = message.payload || message;
      // 更新对应账户的状态
      const account = currentAccounts.find(a => a.type === progress.platform);
      if (account) {
        account.status = 'uploading';
        account.msg = progress.stage === 'uploading_images'
          ? `上传图片 ${progress.imageProgress?.current}/${progress.imageProgress?.total}`
          : progress.stage === 'saving' ? '保存中...' : progress.stage;
      }
      // 发送完整的账户状态列表
      sendTaskUpdate({ accounts: currentAccounts });
    }

    // 同步完成
    if (message.type === 'SYNC_COMPLETE') {
      currentSyncId = null;
      currentAccounts = [];
    }
  } catch (e) {
    logger.error('Error handling message:', e);
  }
});

/**
 * 监听来自页面的消息
 */
window.addEventListener('message', async (evt) => {
  try {
    const action = JSON.parse(evt.data);
    if (!action.method) return;

    // getAccounts - 获取已登录平台（任何页面可调用）
    if (action.method === 'getAccounts') {
      chrome.runtime.sendMessage({ type: 'CHECK_ALL_AUTH' }, (resp) => {
        if (chrome.runtime.lastError) {
          logger.error('getAccounts error:', chrome.runtime.lastError);
          sendToWindow({ eventID: action.eventID, result: [] });
          return;
        }

        // 只返回已登录的平台（与旧版保持一致）
        const accounts = (resp?.platforms || [])
          .filter((p: any) => p.isAuthenticated)
          .map((p: any) => ({
            type: p.id,
            title: p.username || p.name,
            displayName: p.name,
            icon: p.icon,
            avatar: p.icon,
            uid: p.username,
            home: p.homepage,
            supportTypes: ['html'],
          }));

        sendToWindow({ eventID: action.eventID, result: accounts });
      });
    }

    // addTask - 添加同步任务（任何页面可调用）
    if (action.method === 'addTask') {
      const { task } = action;
      const { post, accounts } = task;
      const platforms = accounts.map((a: any) => a.type);

      // 生成 syncId 用于追踪进度
      currentSyncId = `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // 初始化账户状态（保留原始账户信息：icon、title 等）
      currentAccounts = accounts.map((a: any) => ({
        type: a.type,
        title: a.title,
        displayName: a.displayName,
        icon: a.icon,
        avatar: a.avatar,
        uid: a.uid,
        home: a.home,
        supportTypes: a.supportTypes,
        status: 'uploading' as const,
        msg: '准备同步...',
        error: undefined,
        editResp: null,
      }));

      // 立即发送初始状态
      sendTaskUpdate({ accounts: currentAccounts });

      // 如果没有 markdown 但有 content，自动转换
      const htmlContent = post.content || '';
      const markdown = post.markdown || (htmlContent ? htmlToMarkdownNative(htmlContent) : '');

      chrome.runtime.sendMessage({
        type: 'SYNC_ARTICLE',
        payload: {
          article: {
            title: post.title,
            content: htmlContent,
            html: htmlContent,
            markdown,
            cover: post.thumb,
          },
          platforms,
          source: 'legacy-api',
          syncId: currentSyncId,
        },
      }, (resp) => {
        if (chrome.runtime.lastError) {
          logger.error('addTask error:', chrome.runtime.lastError);
        }
      });
    }

    // magicCall - 魔术调用（任何页面可调用）
    if (action.method === 'magicCall') {
      const { methodName, data } = action;

      // uploadImage 特殊处理
      if (methodName === 'uploadImage') {
        chrome.runtime.sendMessage({
          type: 'UPLOAD_IMAGE',
          payload: {
            src: data.src,
            platform: data.account?.type || 'weibo',
          },
        }, (resp) => {
          if (chrome.runtime.lastError) {
            sendToWindow({ eventID: action.eventID, result: { error: chrome.runtime.lastError.message } });
            return;
          }
          sendToWindow({ eventID: action.eventID, result: resp });
        });
      } else {
        // 其他 magicCall 方法
        chrome.runtime.sendMessage({
          type: 'MAGIC_CALL',
          payload: { methodName, data },
        }, (resp) => {
          if (chrome.runtime.lastError) {
            sendToWindow({ eventID: action.eventID, result: { error: chrome.runtime.lastError.message } });
            return;
          }
          sendToWindow({ eventID: action.eventID, result: resp });
        });
      }
    }

    // ============ 敏感 API（仅白名单域名可调用）============

    if (SENSITIVE_API_WHITELIST.indexOf(evt.origin) > -1) {
      // updateDriver - 更新驱动
      if (action.method === 'updateDriver') {
        // v2 版本不再支持动态更新驱动，返回成功但不做任何事
        logger.warn('updateDriver is deprecated in v2');
        sendToWindow({ eventID: action.eventID, result: { success: true, deprecated: true } });
      }

      // startInspect - 开始检查
      if (action.method === 'startInspect') {
        // v2 版本不再支持 inspect 模式，返回成功但不做任何事
        logger.warn('startInspect is deprecated in v2');
        sendToWindow({ eventID: action.eventID, result: { success: true, deprecated: true } });
      }
    }

  } catch (e) {
    // 忽略非 JSON 消息
  }
});

/**
 * 注入 API 到页面（使用外部脚本文件，Manifest V3 兼容）
 */
function injectAPI() {
  setTimeout(function() {
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('inject-api.js');
    script.onload = function() {
      script.remove();
    };
    (document.head || document.documentElement).appendChild(script);
  }, 50);
}

// 页面加载后注入
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', injectAPI);
} else {
  injectAPI();
}

