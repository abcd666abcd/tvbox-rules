# 运维与容灾操作手册 (Runbook)

## 1. 边缘网关部署与更新 (Cloudflare Worker)

网关源码位于项目根目录下的 `worker/` 目录。

### 1.1 依赖环境与准备
* 已配置 Cloudflare 账户及 Wrangler CLI。
* 代理环境配置（境内终端执行需配置 HTTP 代理）：
  ```powershell
  $env:HTTP_PROXY = "http://127.0.0.1:7890"
  $env:HTTPS_PROXY = "http://127.0.0.1:7890"
  ```

### 1.2 部署命令
进入项目 `worker/` 目录并发布：
```powershell
cd worker
npx wrangler deploy
```

---

## 2. 域名失效故障切换 (Failover)

当主站域名因网络阻断或运营商解析劫持导致失效时，按照以下步骤处理：

### 2.1 综合视频仓库 (`media_spider.js`)
* **自动化探测**：爬虫内部集成 `detectHost()` 机制，在冷启动时动态并发探测 `domains.json` 列表中的备选域名与本地递增域（`aauck.cc` / `aatck.cc` 等）。
* **人工热备注入**：
  1. 编辑远程仓库中的 [domains.json](file:///d:/开源项目/tvbox-rules/domains.json)；
  2. 在 JSON 数组最前部追加可用新域名（如 `https://111.newdomain.cc`）；
  3. Git 提交并推送到 `main` 分支。客户端下次启动或刷新配置即自动同步生效。

### 2.2 Legado 阅读书源 (`legado_source.json`)
* 打开 `legado_source.json`，修改根节点中的 `bookSourceUrl` 为最新的存活基准域名。
* 在阅读客户端中长按书源点击「更新」即可。
* **避坑提醒**：若修改了书源名称或分组，阅读客户端默认开启了「名称保护」，必须先在手机端删除旧书源再重新导入。

---

## 3. 冒烟测试与连通性验证 (Smoke Testing)

在完成代码或规则更新后，在本地终端运行以下命令以检验网关健康状态：

### 3.1 验证 TVBox 主配置订阅
```powershell
curl.exe -x http://127.0.0.1:7890 -s "https://raw.myvbox99.top/abcd666abcd/tvbox-rules/main/config.json"
```
* **期望结果**：HTTP 200，返回包含 `media_v_store`、`media_v_tangxin` 与 `media_v_p91` 的完整 JSON，且 API 后缀带有正确的版本号。

### 3.2 验证图片防盗链与 CDN 反代
```powershell
# 验证唐心封面防盗链反代
curl.exe -x http://127.0.0.1:7890 -I -s "https://raw.myvbox99.top/tx-img/2727.jpg"

# 验证 91 封面 CDN 反代
curl.exe -x http://127.0.0.1:7890 -I -s "https://raw.myvbox99.top/91-img/1248094.jpg"
```
* **期望结果**：HTTP 200，`Content-Type: image/jpeg`，且包含 `Cache-Control: public, max-age=604800, s-maxage=2592000`。

### 3.3 验证短视频目录代理
```powershell
curl.exe -x http://127.0.0.1:7890 -s "https://raw.myvbox99.top/tx/featured/" | Select-String -Pattern "card"
```
* **期望结果**：正常返回包含 `<article class="card">` 的 HTML 片段。
