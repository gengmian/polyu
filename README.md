# 香港奶龍大學

纯静态单页，部署在 **Cloudflare Workers（Static Assets）**：无服务器、无证书、无备案。

## 项目结构

```text
.
├── index.html
├── wrangler.jsonc               # Workers 静态资源配置（指向 dist/）
├── _headers                     # 安全响应头与缓存
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
├── LICENSE
└── NOTICE
```

## 部署到 Cloudflare Workers

你现在这个 Worker 流程可以直接用：

| 项目 | 值 |
| --- | --- |
| Project name | `polyu` |
| Build command | `bash scripts/build-pages.sh` |
| Deploy command | `npx wrangler deploy`（保持默认） |
| Preview builds | 可选 |
| Cloudflare Access | **不要开启**（公开站点） |

保存并部署。完成后先打开：

```text
https://polyu.<你的 workers.dev 子域>.workers.dev
```

`wrangler.jsonc` 已经把静态目录指向 `./dist`，`_headers` 会随静态资源一起生效。

### 绑定域名

Worker → **Settings** → **Domains & Routes** → **Add custom domain**：

- `xn--psszg58csy9ayt3cnsh.com`（香港奶龙大学.com）
- `www.xn--psszg58csy9ayt3cnsh.com`（可选）

如果 DNS 里还有指向旧服务器 `39.102.214.121` 的 A/AAAA 记录，先删掉。Cloudflare 会自动创建指向这个 Worker 的记录并签发证书。

验证：

```bash
curl -I https://xn--psszg58csy9ayt3cnsh.com/
curl -I https://www.xn--psszg58csy9ayt3cnsh.com/
```

## 本地

```bash
npm run preview       # http://127.0.0.1:4173/
npm run build:pages   # 生成 dist/
npm run check         # 校验三语文案与资源
```

## 许可

原创代码以 **GNU GPL v3.0** 发布，见 [LICENSE](LICENSE)。

PolyU 名称与校徽、naiwa 形象、字体等第三方素材不适用 GPL，详见 [NOTICE](NOTICE)。
