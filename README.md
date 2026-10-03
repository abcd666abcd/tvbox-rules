# Media Aggregator Core (TVBox Protocol Engine)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/Version-2.2.0-brightgreen.svg)]()
[![Platform](https://img.shields.io/badge/Platform-TVBox%20%7C%20CatVod-orange.svg)]()
[![CDN: Private](https://img.shields.io/badge/CDN-High--Availability-success.svg)]()

A modular, lightweight streaming rule parser and media indexing engine designed for open-source media terminal players.

---

## 📌 项目特性 (Features)

本仓库提供面向现代播放终端的免嗅探流媒体接口规范与自动化调度引擎：

* **多源聚合架构**：
  * **全量资源引擎**（`media_spider.js`）：多域名热备探测、本地闭环验证与免嗅探直链逆向。
  * **自制短视频工坊**（`tangxin_spider.js`）：国内高速 CDN 直链 0ms 秒开、智能推荐页去重与创作者分类体系。
  * **数字原创工坊**（`p91_spider.js`）：短视频社区精选、全分类索引与签名直链快速解析。
* **专属边缘网关加速**：
  * 依托海外私有 CDN 节点（`raw.myvbox99.top`），配置亚秒级穿透与边缘微缓存。
  * 内置图片防盗链动态反代，突破移动端底层播放器 Header 注入限制。
* **隔离块级解析**：
  * 严格遵循物理块级切割规范，杜绝跨行正则回溯与元数据错位。
  * 完美适配 QuickJS 引擎与 Android SQLite 索引标准。

---

## 🚀 订阅接入 (Subscription)

在支持 TVBox / CatVod 协议的终端（如 TVBox、FongMi 影视等）中，将以下专属加速接口填入**点播配置地址**：

```text
https://raw.myvbox99.top/abcd666abcd/tvbox-rules/main/config.json
```

---

## 🛠️ 仓库架构速览 (Repository Structure)

```text
tvbox-rules/
├── config.json          # TVBox 主订阅配置文件
├── media_spider.js      # 综合视频聚合爬虫实现
├── tangxin_spider.js    # 自制影像工坊爬虫实现
├── p91_spider.js        # 数字原创工坊爬虫实现
├── domains.json         # 动态域名备用池（热更新）
├── legado_source.json   # 阅读 3.x 外部流媒体调用规则
├── worker/              # Cloudflare Edge Worker 网关工程
└── docs/                # 架构设计与运维手册
```

---

## 📄 免责声明 (Disclaimer)

本项目仅用于网络协议研究、解析算法性能测试及个人设备自用流媒体聚合，不存储、不分发任何音视频实体文件。使用本工具须遵守当地法律法规。
