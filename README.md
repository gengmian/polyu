# 香港奶龍大學

纯静态单页，部署在 **Cloudflare Pages**：无服务器、无证书、无备案、无构建依赖。

## 项目结构

```text
.
├── index.html
├── _headers                     # Pages 安全响应头与缓存
├── assets/
│   ├── css/style.css
│   ├── js/
│   │   ├── lang.js              # 首屏前确定语言
│   │   ├── i18n.js              # 三语文案
│   │   └── app.js               # 倒计时、取消跳转、语言切换
│   ├── img/
│   │   ├── naiwa.jpg
│   │   ├── polyu-crest.png
│   │   ├── polyu-crest-192.png
│   │   ├── polyu-crest-512.png
│   │   ├── apple-touch-icon.png
│   │   └── og.png
│   └── fonts/                   # Roboto / Playfair Display
├── scripts/
│   ├── build-pages.sh           # 生成 dist/
│   ├── serve.mjs                # 本地预览
│   └── check.mjs                # 文案与资源检查
├── docs/preview.png
├── favicon.ico
├── site.webmanifest
├── robots.txt
├── package.json
└── LICENSE
```

## 部署到 Cloudflare Pages

### 1. 连接 GitHub 仓库

Cloudflare Dashboard → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**。

选择仓库 `gengmian/polyu`，分支 `main`。

### 2. 构建设置

| 项目 | 值 |
| --- | --- |
| Framework preset | None |
| Build command | `bash scripts/build-pages.sh` |
| Build output directory | `dist` |
| Production branch | `main` |

保存并 Deploy。第一次构建完成后会得到 `https://<项目名>.pages.dev`，先确认这个地址能打开。

### 3. 绑定域名

Pages 项目 → **Custom domains** → 添加：

- `xn--psszg58csy9ayt3cnsh.com`（香港奶龙大学.com）
- `www.xn--psszg58csy9ayt3cnsh.com`（可选）

域名已经在 Cloudflare。如果 DNS 里还有指向旧服务器 `39.102.214.121` 的 A/AAAA 记录，先删掉，再让 Pages 创建指向 `<项目名>.pages.dev` 的 CNAME。旧服务器已经停用，删掉不会有影响。

### 4. HTTPS 与验证

- SSL/TLS → **Full (strict)**
- SSL/TLS → Edge Certificates → 打开 **Always Use HTTPS**

```bash
curl -I https://xn--psszg58csy9ayt3cnsh.com/
curl -I https://www.xn--psszg58csy9ayt3cnsh.com/
```

证书由 Cloudflare 自动签发，不需要再管 80/443、备案或 Nginx。

## 本地

```bash
npm run preview       # http://127.0.0.1:4173/
npm run build:pages   # 生成 dist/，与 Pages 构建一致
npm run check         # 校验三语文案与资源
```
