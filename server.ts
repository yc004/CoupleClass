import express from 'express';
import { createServer as createViteServer } from 'vite';
import Database from 'better-sqlite3';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const db = new Database('schedules.db');

// 创建数据库表
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    is_verified INTEGER DEFAULT 0,
    verification_token TEXT,
    verification_expires INTEGER,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS schedules (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    data TEXT NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_schedules_user_id ON schedules(user_id);
  CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
  CREATE INDEX IF NOT EXISTS idx_users_verification_token ON users(verification_token);
`);

// 邮件配置
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: parseInt(process.env.EMAIL_PORT || '587') === 465, // 465端口使用SSL
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false, // 允许自签名证书
  },
  connectionTimeout: 10000, // 10秒连接超时
  greetingTimeout: 10000, // 10秒问候超时
  socketTimeout: 10000, // 10秒socket超时
});

// JWT密钥
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

// 认证中间件
const authenticateToken = (req: any, res: any, next: any) => {
  const token = req.cookies.token || req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: '未登录' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; email: string };
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: '登录已过期，请重新登录' });
  }
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(cookieParser());

  // 请求日志中间件
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });

  const clients = new Map<WebSocket, Set<string>>();

  // ==================== 认证相关 API ====================

  // 注册
  app.post('/api/auth/register', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: '邮箱和密码不能为空' });
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: '邮箱格式不正确' });
    }

    // 验证密码强度
    if (password.length < 6) {
      return res.status(400).json({ error: '密码至少需要6个字符' });
    }

    try {
      // 检查邮箱是否已存在
      const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
      if (existingUser) {
        return res.status(400).json({ error: '该邮箱已被注册' });
      }

      // 加密密码
      const hashedPassword = await bcrypt.hash(password, 10);

      // 生成验证令牌
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const verificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24小时后过期

      // 创建用户
      const now = Date.now();
      const result = db.prepare(
        'INSERT INTO users (email, password, verification_token, verification_expires, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
      ).run(email, hashedPassword, verificationToken, verificationExpires, now, now);

      // 发送验证邮件
      const verificationUrl = `${process.env.APP_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;
      
      let emailSent = false;
      try {
        await transporter.sendMail({
          from: process.env.EMAIL_FROM || process.env.EMAIL_USER || 'noreply@example.com',
          to: email,
          subject: '验证您的邮箱 - 情侣课表',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #3b82f6;">欢迎使用情侣课表！</h2>
              <p>感谢您注册情侣课表。请点击下面的按钮验证您的邮箱：</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${verificationUrl}" 
                   style="background-color: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                  验证邮箱
                </a>
              </div>
              <p style="color: #666; font-size: 14px;">
                如果按钮无法点击，请复制以下链接到浏览器：<br>
                <a href="${verificationUrl}">${verificationUrl}</a>
              </p>
              <p style="color: #666; font-size: 14px;">
                此链接将在24小时后失效。
              </p>
            </div>
          `,
        });
        emailSent = true;
      } catch (emailError) {
        console.error('发送验证邮件失败:', emailError);
      }

      res.json({ 
        success: true, 
        message: emailSent ? '注册成功！请查收验证邮件。' : '注册成功！但验证邮件发送失败，请联系管理员手动验证。',
        emailSent,
        userId: result.lastInsertRowid 
      });
    } catch (err) {
      console.error('注册错误:', err);
      res.status(500).json({ error: '注册失败，请稍后重试' });
    }
  });

  // 验证邮箱
  app.get('/api/auth/verify-email', (req, res) => {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ error: '验证令牌无效' });
    }

    try {
      const user = db.prepare(
        'SELECT id, verification_expires FROM users WHERE verification_token = ? AND is_verified = 0'
      ).get(token);

      if (!user) {
        return res.status(400).json({ error: '验证令牌无效或已被使用' });
      }

      const userRow = user as { id: number; verification_expires: number };

      // 检查令牌是否过期
      if (Date.now() > userRow.verification_expires) {
        return res.status(400).json({ error: '验证令牌已过期，请重新注册' });
      }

      // 更新用户为已验证
      db.prepare(
        'UPDATE users SET is_verified = 1, verification_token = NULL, verification_expires = NULL, updated_at = ? WHERE id = ?'
      ).run(Date.now(), userRow.id);

      res.json({ success: true, message: '邮箱验证成功！' });
    } catch (err) {
      console.error('验证邮箱错误:', err);
      res.status(500).json({ error: '验证失败，请稍后重试' });
    }
  });

  // 重新发送验证邮件
  app.post('/api/auth/resend-verification', async (req, res) => {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: '邮箱不能为空' });
    }

    try {
      const user = db.prepare('SELECT id, is_verified FROM users WHERE email = ?').get(email);

      if (!user) {
        return res.status(404).json({ error: '用户不存在' });
      }

      const userRow = user as { id: number; is_verified: number };

      if (userRow.is_verified) {
        return res.status(400).json({ error: '该邮箱已验证' });
      }

      // 生成新的验证令牌
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const verificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24小时后过期

      // 更新验证令牌
      db.prepare(
        'UPDATE users SET verification_token = ?, verification_expires = ?, updated_at = ? WHERE id = ?'
      ).run(verificationToken, verificationExpires, Date.now(), userRow.id);

      // 发送验证邮件
      const verificationUrl = `${process.env.APP_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;
      
      try {
        await transporter.sendMail({
          from: process.env.EMAIL_FROM || process.env.EMAIL_USER || 'noreply@example.com',
          to: email,
          subject: '验证您的邮箱 - 情侣课表',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #3b82f6;">欢迎使用情侣课表！</h2>
              <p>感谢您注册情侣课表。请点击下面的按钮验证您的邮箱：</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${verificationUrl}" 
                   style="background-color: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                  验证邮箱
                </a>
              </div>
              <p style="color: #666; font-size: 14px;">
                如果按钮无法点击，请复制以下链接到浏览器：<br>
                <a href="${verificationUrl}">${verificationUrl}</a>
              </p>
              <p style="color: #666; font-size: 14px;">
                此链接将在24小时后失效。
              </p>
            </div>
          `,
        });

        res.json({ success: true, message: '验证邮件已重新发送！' });
      } catch (emailError) {
        console.error('发送验证邮件失败:', emailError);
        res.status(500).json({ error: '邮件发送失败，请稍后重试或联系管理员手动验证' });
      }
    } catch (err) {
      console.error('重新发送验证邮件错误:', err);
      res.status(500).json({ error: '操作失败，请稍后重试' });
    }
  });

  // 登录
  app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: '邮箱和密码不能为空' });
    }

    try {
      const user = db.prepare('SELECT id, email, password, is_verified FROM users WHERE email = ?').get(email);

      if (!user) {
        return res.status(401).json({ error: '邮箱或密码错误' });
      }

      const userRow = user as { id: number; email: string; password: string; is_verified: number };

      // 验证密码
      const isValidPassword = await bcrypt.compare(password, userRow.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: '邮箱或密码错误' });
      }

      // 检查邮箱是否已验证
      if (!userRow.is_verified) {
        return res.status(403).json({ error: '请先验证您的邮箱' });
      }

      // 生成 JWT
      const token = jwt.sign(
        { userId: userRow.id, email: userRow.email },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      // 设置 cookie
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7天
        sameSite: 'lax',
      });

      res.json({
        success: true,
        token,
        user: {
          id: userRow.id,
          email: userRow.email,
        },
      });
    } catch (err) {
      console.error('登录错误:', err);
      res.status(500).json({ error: '登录失败，请稍后重试' });
    }
  });

  // 登出
  app.post('/api/auth/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ success: true, message: '已登出' });
  });

  // 获取当前用户信息
  app.get('/api/auth/me', authenticateToken, (req: any, res) => {
    res.json({
      success: true,
      user: {
        id: req.user.userId,
        email: req.user.email,
      },
    });
  });

  // ==================== 课表相关 API ====================

  // 保存课表（需要认证）
  app.post('/api/schedules', authenticateToken, (req: any, res) => {
    const { id, data } = req.body;
    const userId = req.user.userId;

    if (!id || !data) {
      return res.status(400).json({ error: 'Missing id or data' });
    }

    try {
      const stmt = db.prepare(
        'INSERT OR REPLACE INTO schedules (id, user_id, data, updated_at) VALUES (?, ?, ?, ?)'
      );
      stmt.run(id, userId, JSON.stringify(data), Date.now());

      // Broadcast to WebSocket subscribers
      const msg = JSON.stringify({ type: 'update', id, data });
      for (const [ws, subs] of clients.entries()) {
        if (subs.has(id) && ws.readyState === WebSocket.OPEN) {
          ws.send(msg);
        }
      }

      res.json({ success: true, id });
    } catch (err) {
      console.error('保存课表错误:', err);
      res.status(500).json({ error: '保存失败' });
    }
  });

  // 获取课表
  app.get('/api/schedules/:id', (req, res) => {
    const { id } = req.params;

    try {
      const stmt = db.prepare('SELECT data FROM schedules WHERE id = ?');
      const row = stmt.get(id) as { data: string } | undefined;

      if (!row) {
        return res.status(404).json({ error: 'Schedule not found' });
      }

      res.json({ data: JSON.parse(row.data) });
    } catch (err) {
      console.error('获取课表错误:', err);
      res.status(500).json({ error: '获取失败' });
    }
  });

  // Create HTTP server first
  const httpServer = createServer(app);

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
  }

  // Start listening
  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  const wss = new WebSocketServer({ server: httpServer });

  wss.on('connection', (ws) => {
    clients.set(ws, new Set());

    ws.on('message', (message) => {
      try {
        const parsed = JSON.parse(message.toString());
        if (parsed.type === 'subscribe') {
          clients.set(ws, new Set(parsed.ids));
        }
      } catch (e) {}
    });

    ws.on('close', () => {
      clients.delete(ws);
    });

    ws.on('error', (error) => {
      clients.delete(ws);
    });
  });
}

startServer();
