# 账户系统设置指南

## 已实现的功能

✅ 用户注册（邮箱 + 密码）
✅ 邮箱验证
✅ 用户登录
✅ JWT 认证
✅ 登出功能
✅ 路由保护
✅ 密码加密（bcrypt）

## 安装步骤

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 到 `.env` 并填写配置：

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```env
# JWT密钥（必须修改为随机字符串）
JWT_SECRET=your_random_secret_key_here_at_least_32_characters

# 邮件配置（用于发送验证邮件）
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
EMAIL_FROM=CoupleClass <your_email@gmail.com>

# 应用URL
APP_URL=http://localhost:3000
```

### 3. Gmail 邮件配置

如果使用 Gmail 发送邮件：

1. 登录 Google 账号
2. 访问：https://myaccount.google.com/apppasswords
3. 创建应用专用密码
4. 将生成的密码填入 `EMAIL_PASSWORD`

### 4. 启动应用

```bash
npm run dev
```

## 使用流程

### 注册新用户

1. 访问 `http://localhost:3000/register`
2. 输入邮箱和密码（至少6个字符）
3. 点击"注册"
4. 查收验证邮件
5. 点击邮件中的验证链接

### 登录

1. 访问 `http://localhost:3000/login`
2. 输入邮箱和密码
3. 点击"登录"
4. 自动跳转到主页

### 登出

点击右上角的"登出"按钮

## 数据库结构

### users 表

- `id`: 用户ID（主键）
- `email`: 邮箱（唯一）
- `password`: 加密后的密码
- `is_verified`: 是否已验证邮箱
- `verification_token`: 验证令牌
- `verification_expires`: 令牌过期时间
- `created_at`: 创建时间
- `updated_at`: 更新时间

### schedules 表

- `id`: 课表ID（主键）
- `user_id`: 用户ID（外键）
- `data`: 课表数据（JSON）
- `updated_at`: 更新时间

## API 接口

### 认证相关

- `POST /api/auth/register` - 注册
- `GET /api/auth/verify-email?token=xxx` - 验证邮箱
- `POST /api/auth/login` - 登录
- `POST /api/auth/logout` - 登出
- `GET /api/auth/me` - 获取当前用户信息

### 课表相关（需要认证）

- `POST /api/schedules` - 保存课表
- `GET /api/schedules/:id` - 获取课表

## 安全特性

1. **密码加密**：使用 bcrypt 加密存储
2. **JWT 认证**：使用 JWT token 进行身份验证
3. **邮箱验证**：注册后必须验证邮箱才能登录
4. **令牌过期**：验证令牌24小时后自动过期
5. **HttpOnly Cookie**：JWT 存储在 HttpOnly cookie 中
6. **路由保护**：未登录用户无法访问主要功能

## 故障排除

### 邮件发送失败

1. 检查 Gmail 应用专用密码是否正确
2. 确认 Gmail 账号已启用"两步验证"
3. 查看服务器日志中的错误信息

### 无法登录

1. 确认邮箱已验证
2. 检查密码是否正确
3. 清除浏览器 cookie 和 localStorage

### Token 过期

- JWT token 有效期为 7 天
- 过期后需要重新登录

## 生产环境部署

1. 修改 `JWT_SECRET` 为强随机字符串
2. 使用 HTTPS
3. 配置正确的 `APP_URL`
4. 考虑使用专业邮件服务（如 SendGrid、AWS SES）
5. 定期备份数据库

## 后续改进建议

- [ ] 添加"忘记密码"功能
- [ ] 添加"重新发送验证邮件"功能
- [ ] 添加用户个人资料编辑
- [ ] 添加修改密码功能
- [ ] 添加第三方登录（Google、微信等）
- [ ] 添加登录日志
- [ ] 添加账号安全设置
