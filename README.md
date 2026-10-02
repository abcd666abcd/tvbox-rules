# Media Aggregator Core (TVBox Protocol Engine)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/Version-2.1.0-brightgreen.svg)]()
[![Platform](https://img.shields.io/badge/Platform-TVBox%20%7C%20CatVod-orange.svg)]()

A modular, lightweight streaming rule parser and media indexing engine designed for open-source media terminal players.

---

## 📌 项目介绍 (Overview)

本仓库提供通用的流媒体接口规范定义与网络协议测试脚本，旨在优化端侧设备在复杂网络环境下的多媒体元数据索引与直连传输能力。

* **低延迟握手**：针对 CatVod 引擎优化底层异步 HTTP 握手逻辑。
* **隔离解析架构**：采用块级 HTML 切割与本地安全解码算法，杜绝元数据错位。
* **云端即时同步**：基于 Git 分支管理，实现多端配置一键热更新。

---

## 🚀 快速接入 (Subscription)

在支持 TVBox / CatVod 协议的播放终端中，将以下远程加速接口配置至**点播配置源**：

```text
https://raw.myvbox99.top/abcd666abcd/tvbox-rules/main/config.json
```
