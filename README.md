<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# 情侣课表 - CoupleClass

一个支持情侣课表配对的智能课程表应用，采用扁平化设计风格，支持深浅色模式。

## 主要功能

### 📅 课程管理
- 添加、编辑、删除课程
- 自定义课程时间、地点、教师
- 支持单周、双周、每周或自定义周数上课
- 显示/隐藏非本周课程
- **一键导入课表**：从教务系统自动导入课表

### 💑 情侣配对
- **二维码扫码配对**：生成专属二维码，让TA扫描即可配对
- **手动输入邀请码**：支持6位邀请码手动输入配对
- 实时同步双方课表
- 智能显示：
  - 我的课程（蓝色）
  - TA的课程（粉色）
  - 一起上课（紫色）
  - 共同空闲（绿色）

### ⚙️ 灵活设置
- 自定义每日总节数
- 自定义每节课时长和课间休息
- 自定义每节课的开始时间
- 设置开学日期和总教学周数
- 显示/隐藏周末
- 扁平化设计，支持深浅色模式

## 使用方法

### 一键导入课表

1. **打开导入功能**
   - 在"我的课表"页面点击"一键导入课表"按钮
   - 输入你的教务系统网址（如：https://jwxt.example.edu.cn）

2. **登录并导航**
   - 在内嵌页面中登录教务系统
   - 找到并进入课表页面

3. **同步课表**
   - 点击"同步课表"按钮
   - 系统自动识别并导入课程信息
   - 支持自动识别周数、教师、地点等信息

4. **检查和调整**
   - 导入完成后检查课程信息
   - 如有需要，可手动编辑调整

### 情侣配对步骤

1. **生成二维码**
   - 进入"情侣课表"页面
   - 点击"生成配对二维码"按钮
   - 系统会生成一个专属二维码和6位邀请码

2. **扫码配对**
   - TA进入"情侣课表"页面
   - 点击"扫描二维码配对"按钮
   - 允许摄像头权限
   - 将二维码对准扫描框
   - 自动识别并配对成功

3. **手动配对**（备选方案）
   - 如果无法扫码，可以手动输入6位邀请码
   - 点击"连接"按钮完成配对

## Run Locally

**Prerequisites:**  Node.js

1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## 技术栈

- React 19
- TypeScript
- Tailwind CSS 4
- Zustand (状态管理)
- QRCode (二维码生成)
- jsQR (二维码扫描)
- Express (后端API)
- Better-SQLite3 (数据存储)

## AI Studio

View your app in AI Studio: https://ai.studio/apps/7ece5c09-b452-4f83-9103-6183217b8d1d
