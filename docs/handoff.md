# 项目交接与演进记录 (Handoff & Changelog)

## 1. 当前生产状态清单 (Current System State)

截止 2026-10-03，项目已完全就绪并在移动端与大屏端完成全链路验证：

* **TVBox 订阅主入口**：
  * `https://raw.myvbox99.top/abcd666abcd/tvbox-rules/main/config.json`
* **活跃站点聚合**：
  * **综合视频仓库** (`media_spider.js`)：支持全量搜索、分类浏览与 HLS 0ms 解析。
  * **自制影像工坊** (`tangxin_spider.js`, v1.2.3)：国内极速 CDN 直链秒开、智能推荐页去重、创作者专区分类。
* **基础设施**：
  * 海外域名 `raw.myvbox99.top`。
  * Cloudflare Worker 服务 `gh-proxy-hub`，承担 GitHub 实时穿透、短视频页面反代与封面防盗链 Header 伪装。

---

## 2. 演进变更记录 (Changelog)

### [2026-10-03] 阶段性重大升级 (v2.2.0)
* **新增短视频爬虫适配器 (`tangxin_spider.js`)**：
  * 采用 ASTRO 静态卡片物理切割机制提取元数据。
  * 直连国内高速 CDN `t.5gcdn.xyz`，免逆向解密实现 0ms 透传秒播。
* **上线专属边缘反代网关**：
  * 突破 Fastly 边缘缓存时延，加入微秒时间戳穿透，实现 GitHub 提交无感热更新。
  * 部署 `/tx-img/` 路径反代，自动伪造 `Referer: https://tangxinvlog.app/` 与 UA，解决移动端 原生图片控件 403 防盗链报错。
* **Tab 体验去重优化**：
  * 重构分类字典，移出「精选合辑」独立分类，完全由 TVBox 原生「推荐」Tab (`homeVod`) 接管，消除了界面内容重复。
* **工程化与文档体系建设**：
  * 将临时 Worker 代码归档纳入项目 `worker/` 目录版本化管理。
  * 建立 `docs/architecture.md`、`docs/runbook.md` 与 `docs/handoff.md` 标准文档。

---

## 3. 设备与客户端兼容性验证矩阵

| 终端环境 | 播放内核 | JS 引擎 | 兼容状态 | 备注说明 |
|---|---|---|---|---|
| 红米 K80 (HyperOS) | ExoPlayer / IjkPlayer | QuickJS | ✅ 完全兼容 | 推荐页秒开，图片渲染正常 |
| TVBox (Android TV) | IjkPlayer | QuickJS | ✅ 完全兼容 | 纯数字 type_id 避免 SQLite 崩溃 |
| FongMi 影视 | Media3 / ExoPlayer | Duktape / QuickJS | ✅ 完全兼容 | 0ms play() 杜绝握手超时 |
| 阅读 3.x (Legado) | 系统外部调用播放器 | Rhino | ✅ 完全兼容 | 发现页平铺分类 |
