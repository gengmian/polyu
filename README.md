# 香港奶龍大學

纯静态单页，无构建步骤。所有资源以 `/assets/...` 绝对路径引用，必须部署在域名根目录。

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
│   ├── nginx-http.conf          # 首次申请证书用（80）
│   └── nginx.conf               # 生产 HTTPS
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

## 部署到服务器（Nginx）

域名：`香港奶龙大学.com`，punycode：`xn--psszg58csy9ayt3cnsh.com`。

### 1. 解析域名

| 类型 | 主机 | 值 |
| --- | --- | --- |
| A | `@` | 服务器 IPv4 |
| CNAME | `www` | `xn--psszg58csy9ayt3cnsh.com` |

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

### 3. 先启用 HTTP 配置

```bash
sudo cp /var/www/nailong/deploy/nginx-http.conf /etc/nginx/sites-available/nailong.conf
sudo ln -sf /etc/nginx/sites-available/nailong.conf /etc/nginx/sites-enabled/nailong.conf
sudo nginx -t && sudo systemctl reload nginx
```

### 4. 申请证书

```bash
sudo apt install certbot        # 已安装可跳过
sudo certbot certonly --webroot -w /var/www/nailong \
  -d xn--psszg58csy9ayt3cnsh.com -d www.xn--psszg58csy9ayt3cnsh.com
```

### 5. 启用 HTTPS 配置

```bash
sudo cp /var/www/nailong/deploy/nginx.conf /etc/nginx/sites-available/nailong.conf
sudo nginx -t && sudo systemctl reload nginx
```

`deploy/nginx.conf` 默认使用：

- 根目录：`/var/www/nailong`
- 证书：`/etc/letsencrypt/live/xn--psszg58csy9ayt3cnsh.com/`

路径不同时改这两处即可。

### 6. 验证

```bash
curl -I https://xn--psszg58csy9ayt3cnsh.com/
curl -I https://www.xn--psszg58csy9ayt3cnsh.com/    # 应 301 到裸域
```

### 已有证书

如果使用自己的证书（例如 `xgnldx.com.pem` / `xgnldx.com.key`）：

1. 上传到服务器，例如 `/etc/nginx/ssl/`。
2. 修改 `deploy/nginx.conf`：

```nginx
ssl_certificate     /etc/nginx/ssl/xgnldx.com.pem;
ssl_certificate_key /etc/nginx/ssl/xgnldx.com.key;
```

3. 如果实际域名是 `xgnldx.com`，把 `server_name` 和 80 端口的跳转地址一并改成
   `xgnldx.com www.xgnldx.com`。

### 更新

```bash
rsync -avz --exclude .git --exclude .refs --exclude node_modules \
  --exclude '*.key' --exclude '*.pem' \
  --exclude '/polyu.png' --exclude '/naiwa.jpg' --exclude '/奶龙.png' \
  ./ user@服务器IP:/var/www/nailong/
```

静态文件替换后不需要重启 Nginx。
