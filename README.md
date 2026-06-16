# 小叶发布器 / Article-published
支持 11+ 内容平台
平台	ID	类型	状态
微信公众号	weixin	主流自媒体	✅
小红书	xiaohongshu	主流自媒体	✅
哔哩哔哩	bilibili	视频平台	✅
微博	weibo	主流自媒体	✅
CSDN	csdn	技术社区	✅
知乎	zhihu	知识社区	✅
掘金	juejin	技术社区	✅
百家号	baijiahao	内容平台	✅
雪球	xueqiu	财经社区	✅
人人都是产品经理	woshipm	产品社区	✅
Markdown 压缩包	markdown_zip	本地导出	✅
语雀	yuque	文档平台	✅

## 主要能力

- 浏览器扩展：在 Chrome/Edge 中读取当前页面和登录状态。
- 文章提取：支持从当前标签页提取标题、正文、封面和摘要。
- 草稿保存：把文章保存到已登录平台的草稿箱。
- MCP 服务：让 AI 客户端通过工具调用浏览器发布能力。
- 本地分发：不依赖 Chrome Web Store，用户可以从 GitHub 下载后本地加载。

## 环境要求

- Node.js 20 或更高版本
- Chrome 或 Edge 浏览器
- 一个支持 MCP 的客户端，例如 Claude Desktop、Codex、WorkBuddy 或 Hermes

## 快速开始

克隆项目：

```powershell
git clone https://github.com/yesheng-oss/Article-published.git
cd Article-published
```

安装依赖并构建：

```powershell
npm install
npm run build
```

只构建浏览器扩展：

```powershell
npm run build:extension
```

构建完成后，浏览器扩展目录在：

```text
packages/extension/dist
```

## 安装浏览器扩展

1. 打开 Chrome 或 Edge。
2. 进入 `chrome://extensions` 或 `edge://extensions`。
3. 开启右上角“开发者模式”。
4. 点击“加载已解压的扩展程序”。
5. 选择本项目里的 `packages/extension/dist` 文件夹。
6. 浏览器右上角会出现“小叶发布器”图标。

如果你是从 GitHub Releases 下载的压缩包，请先解压，再选择解压后的 `dist` 文件夹。

## 启动 MCP 服务

在项目根目录运行：

```powershell
$env:MCP_TOKEN="your-token"
npm run mcp
```

`MCP_TOKEN` 是浏览器扩展和 MCP 服务之间的本地连接密钥。你可以换成任意较长的随机字符串。

默认地址：

- 浏览器扩展 WebSocket：`ws://localhost:9527`
- SSE 服务：`http://localhost:9529/sse`

如果需要 SSE 模式：

```powershell
$env:MCP_TOKEN="your-token"
node packages/mcp-server/dist/index.js --sse
```

## 配置浏览器扩展

1. 点击浏览器右上角“小叶发布器”图标。
2. 打开设置。
3. 填入和 MCP 服务一致的 token。
4. 服务地址可以留空，默认使用 `ws://localhost:9527`。
5. 保持 MCP 服务运行，再刷新扩展连接状态。

## MCP 客户端配置示例

把下面路径改成你自己电脑上的项目路径：

```json
{
  "mcpServers": {
    "browser-assistant": {
      "command": "node",
      "args": [
        "D:/your/path/Article-published/packages/mcp-server/dist/index.js"
      ],
      "env": {
        "MCP_TOKEN": "your-token"
      }
    }
  }
}
```
注意：

- `MCP_TOKEN` 要和扩展设置里的一致。
- 修改 MCP 配置后，通常需要重启对应 AI 客户端。
- Windows 路径可以使用 `/`，例如 `D:/your/path/...`。

## 如何使用

1. 在浏览器中登录你要发布的平台。
2. 打开一篇文章页面，例如微信公众号文章页。
3. 点击“小叶发布器”扩展图标，确认文章已被识别。
4. 在 AI 客户端中调用 MCP 工具，或在扩展弹窗中选择平台。
5. 执行同步后，文章会保存到目标平台草稿箱。
6. 打开平台后台检查内容，确认无误后手动发布。

## 可用 MCP 工具

- `list_platforms`：列出扩展侧可用平台和登录状态。
- `check_auth`：检查指定平台是否已登录。
- `extract_article`：从当前浏览器标签页提取文章。
- `sync_article`：把文章保存到一个或多个平台草稿箱。
- `upload_image_file`：通过已连接的浏览器扩展上传本地图片。



## 许可证

本项目基于 GPL-3.0 协议发布，部分实现参考并改造自开源社区项目。相关来源与许可证信息见仓库中的 `NOTICE` 文件。

## 免责声明

本项目仅用于个人内容整理和草稿发布辅助。请遵守目标平台的服务条款，不要用于垃圾内容、批量骚扰、绕过平台风控或任何违法违规用途。
