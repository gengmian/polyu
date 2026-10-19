# 香港奶龍大學

纯静态单页，无构建步骤。所有资源以 `/assets/...` 绝对路径引用，必须部署在域名根目录。当前使用 HTTP 部署。

## 项目结构

```text
.
├── index.html
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
├── deploy/
│   ├── nginx-http.conf          # 当前 HTTP 部署
│   └── nginx.conf               # 以后上 HTTPS
├── scripts/
│   ├── serve.mjs                # 本地预览
│   └── check.mjs                # 文案与资源检查
├── docs/preview.png
├── favicon.ico
├── site.webmanifest
├── robots.txt
├── package.json
└── LICENSE
```

## 部署到服务器（Nginx / HTTP）

域名：`香港奶龙大学.com`，punycode：`xn--psszg58csy9ayt3cnsh.com`。

### 1. 解析域名

| 类型 | 主机 | 值 |
| --- | --- | --- |
| A | `@` | 服务器 IPv4 |
| CNAME | `www` | `xn--psszg58csy9ayt3cnsh.com` |

如果实际域名是 `xgnldx.com`，把后面 Nginx 配置里的 `server_name` 和 301 地址换成
`xgnldx.com` / `www.xgnldx.com`。

### 2. 上传文件

服务器上先建目录：

```bash
sudo mkdir -p /var/www/nailong
sudo chown "$USER" /var/www/nailong
```

本地项目目录执行：

```bash
rsync -avz --exclude .git --exclude .refs --exclude node_modules \
  --exclude '*.key' --exclude '*.pem' \
  --exclude '/polyu.png' --exclude '/naiwa.jpg' --exclude '/奶龙.png' \
  ./ user@服务器IP:/var/www/nailong/
```

再交还给 Web 用户：

```bash
sudo chown -R www-data:www-data /var/www/nailong
```

### 3. 启用 HTTP 配置

```bash
sudo cp /var/www/nailong/deploy/nginx-http.conf /etc/nginx/sites-available/nailong.conf
sudo ln -sf /etc/nginx/sites-available/nailong.conf /etc/nginx/sites-enabled/nailong.conf
sudo nginx -t && sudo systemctl reload nginx
```

`deploy/nginx-http.conf` 默认根目录是 `/var/www/nailong`，路径不同就改 `root`。

### 4. 验证

```bash
curl -I http://xn--psszg58csy9ayt3cnsh.com/
curl -I http://www.xn--psszg58csy9ayt3cnsh.com/    # 应 301 到裸域
```

### 更新

```bash
rsync -avz --exclude .git --exclude .refs --exclude node_modules \
  --exclude '*.key' --exclude '*.pem' \
  --exclude '/polyu.png' --exclude '/naiwa.jpg' --exclude '/奶龙.png' \
  ./ user@服务器IP:/var/www/nailong/
```

静态文件替换后不需要重启 Nginx。

### 说明

- 现在只有 80 端口，没有证书。`*.key` / `*.pem` 不要放进网站目录（rsync 已排除，Nginx 也拒绝访问）。
- 以后要 HTTPS：换成 `deploy/nginx.conf`，按文件头注释申请证书；同时把 `index.html` 里
  canonical / og 的 `http://` 改回 `https://`。
- 如果域名套了 Cloudflare：源站目前只有 80，SSL/TLS 模式先选 **Flexible**；以后源站上了
  443 再改 **Full (strict)**。
