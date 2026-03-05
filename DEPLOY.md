# Glimmer Closet - 完整部署流程

## 架构

```
[Vercel 前端] ←──→ [Cloudflare Tunnel] ←──→ [本地 Docker (API + DB)]
```

## 前置条件

- Docker Desktop 运行中
- cloudflared 已安装 (`brew install cloudflared`)
- Vercel CLI 已安装 (`npm i -g vercel`)
- 项目位置：`~/.openclaw/workspace/glimmer-closet`

---

## 1. 本地 Docker 部署

```bash
cd ~/.openclaw/workspace/glimmer-closet

# 确保 .env 配置正确
# 关键变量：
# - WEB_ORIGIN=https://glimmer-closet.vercel.app
# - PUBLIC_BASE_URL=<tunnel-url>
# - CONTENT_API_BASE_URL=<tunnel-url>

# 启动全套服务
docker compose -f compose.yml up --build -d

# 验证
 docker ps | grep closet
curl http://localhost:4001/health
curl http://localhost:3001
```

**服务端口：**
- Web: `http://localhost:3001`
- API: `http://localhost:4001`
- DB: `localhost:5433`

---

## 2. Cloudflare Tunnel（暴露本地 API）

```bash
# 启动临时 tunnel（暴露 localhost:4001）
cloudflared tunnel --url http://localhost:4001

# 会输出类似：
# https://xxxx.trycloudflare.com
```

**注意：** 临时 tunnel URL 每次重启会变。如需固定 URL，创建 named tunnel：
```bash
cloudflared tunnel create glimmer-closet-api
cloudflared tunnel route dns glimmer-closet-api api.yourdomain.com
cloudflared tunnel run glimmer-closet-api
```

---

## 3. Vercel 部署

### 首次部署

```bash
cd ~/.openclaw/workspace/glimmer-closet

# 使用 token 登录并部署
vercel --token $VERCEL_TOKEN --yes

# 或使用交互式登录
vercel login
vercel --yes
```

### 设置环境变量

```bash
# 添加 API 地址（替换为实际 tunnel URL）
vercel --token $VERCEL_TOKEN env add CONTENT_API_BASE_URL production
# 输入: https://xxxx.trycloudflare.com

vercel --token $VERCEL_TOKEN env add NEXT_PUBLIC_CONTENT_API_BASE_URL production
# 输入: https://xxxx.trycloudflare.com
```

### 重新部署

```bash
vercel --token $VERCEL_TOKEN --prod --yes
```

---

## 4. 更新后端 CORS（关键！）

编辑 `~/.openclaw/workspace/glimmer-closet/.env`：
```bash
WEB_ORIGIN=https://glimmer-closet.vercel.app
```

然后重启 API 容器（必须 recreate 才能加载新 env）：
```bash
cd ~/.openclaw/workspace/glimmer-closet
docker compose up -d --force-recreate api
```

---

## 5. 验证部署

```bash
# 检查所有服务
docker ps | grep closet

# 检查后端 CORS
curl -s -H "Origin: https://glimmer-closet.vercel.app" \
  -I https://xxxx.trycloudflare.com/health | grep access-control

# 访问前端
open https://glimmer-closet.vercel.app
```

---

## 故障排查

| 问题 | 原因 | 解决 |
|------|------|------|
| "加载衣柜失败" | CORS 配置错误 | 更新 `WEB_ORIGIN` 并 `--force-recreate` API 容器 |
| API 无响应 | Tunnel 断开 | 重启 cloudflared |
| 前端 404 | Vercel 部署失败 | 检查构建日志 |
| 数据库连接失败 | 容器未启动 | `docker compose up -d db` |

---

## 环境变量参考

### 后端 `.env`
```bash
ADMIN_TOKEN=change_me
PUBLIC_BASE_URL=https://xxxx.trycloudflare.com
WEB_ORIGIN=https://glimmer-closet.vercel.app
CONTENT_API_BASE_URL=http://api:4000
NEXT_PUBLIC_CONTENT_API_BASE_URL=http://localhost:4001
```

### Vercel 环境变量
```bash
CONTENT_API_BASE_URL=https://xxxx.trycloudflare.com
NEXT_PUBLIC_CONTENT_API_BASE_URL=https://xxxx.trycloudflare.com
```

---

## 快捷命令

```bash
# 一键重启本地服务
cd ~/.openclaw/workspace/glimmer-closet && docker compose up -d --force-recreate

# 一键重新部署 Vercel
cd ~/.openclaw/workspace/glimmer-closet && vercel --token $VERCEL_TOKEN --prod --yes

# 查看日志
docker logs -f glimmer-closet-api
docker logs -f glimmer-closet-web
```
