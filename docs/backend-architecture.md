# Craftisle 后端架构设计文档

## 1. 概述

本文档描述 Craftisle 目录站的后端架构设计，包括用户系统、数据库设计、API 结构等。

**目标**：
- 支持用户注册/登录
- 支持用户评分、评论、收藏
- 支持用户生成内容（评论、讨论）
- 为未来功能扩展提供基础

**技术栈**：
- **框架**: Next.js 15 App Router (API Routes)
- **数据库**: PostgreSQL
- **ORM**: Prisma
- **认证**: NextAuth.js (支持邮箱 + OAuth)
- **部署**: Vercel (API Routes) + Vercel Postgres

---

## 2. 用户系统架构

### 2.1 用户注册/登录

**支持的方式**：
1. **邮箱注册/登录** (邮箱 + 密码)
2. **OAuth 登录** (GitHub, Google)
3. **魔法链接** (邮箱验证码，可选)

**认证流程**：
```
用户登录 → NextAuth.js 验证 → 创建 Session → 返回 Session Token
```

**Session 管理**：
- 使用 NextAuth.js 的 JWT Session 策略
- Session Token 存储在 HTTP-only Cookie
- 过期时间：30 天（可刷新）

### 2.2 用户角色

| 角色 | 权限 |
|------|------|
| `USER` | 基础用户：评分、评论、收藏 |
| `CONTRIBUTOR` | 贡献者：可以提交新资源、编辑资源信息 |
| `MODERATOR` | 版主：可以审核评论、删除不当内容 |
| `ADMIN` | 管理员：全部权限 |

### 2.3 用户资料

**用户资料包含**：
- 基本信息：用户名、邮箱、头像
- 个人简介
- 注册时间
- 贡献统计（提交资源数、评论数、评分数）
- 收藏的资源列表

---

## 3. 数据库设计 (Prisma Schema)

### 3.1 核心模型

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ── 用户模型 ───────────────────────────────────────
model User {
  id            String    @id @default(cuid())
  name          String?
  email         String?   @unique
  emailVerified DateTime?
  image         String?
  password      String?   // 加密后的密码（邮箱注册用）
  
  // OAuth
  accounts Account[]
  
  // 用户角色
  role Role @default(USER)
  
  // 用户生成内容
  reviews    Review[]
  ratings    Rating[]
  comments   Comment[]
  favorites Favorite[]
  
  // 时间戳
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

enum Role {
  USER
  CONTRIBUTOR
  MODERATOR
  ADMIN
}

// ── OAuth 账户 ────────────────────────────────────
model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

// ── 资源模型 ───────────────────────────────────────
model Resource {
  id          String   @id
  name        String
  url         String
  description String?
  
  // 分类
  category    String
  categoryName String?
  categoryIcon String?
  
  // 数据源
  source      String
  
  // GitHub 数据
  githubUrl       String?
  githubStars     Int?
  githubLicense   String?
  githubLastUpdated DateTime?
  
  // 属性
  isOpenSource   Boolean @default(false)
  isSelfHosted   Boolean @default(false)
  tags           String[]
  
  // 用户生成内容
  reviews  Review[]
  ratings  Rating[]
  favorites Favorite[]
  comments Comment[]
  
  // 统计
  avgRating Float? @default(0)
  reviewCount Int @default(0)
  
  // 时间戳
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

// ── 评测/评论 ────────────────────────────────────
model Review {
  id          String   @id @default(cuid())
  title       String?
  content     String   @db.Text
  rating      Int      // 1-5 分
  
  // 作者
  authorId    String
  author      User     @relation(fields: [authorId], references: [id], onDelete: Cascade)
  
  // 资源
  resourceId  String
  resource    Resource @relation(fields: [resourceId], references: [id], onDelete: Cascade)
  
  // 点赞
  helpful     Int @default(0)
  
  // 时间戳
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@unique([authorId, resourceId]) // 一个用户只能给一个资源写一个评测
}

// ── 评分 ─────────────────────────────────────────
model Rating {
  id          String   @id @default(cuid())
  value       Int      // 1-5 分
  
  // 用户
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // 资源
  resourceId  String
  resource    Resource @relation(fields: [resourceId], references: [id], onDelete: Cascade)
  
  // 时间戳
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@unique([userId, resourceId]) // 一个用户只能给一个资源评一次分
}

// ── 收藏 ─────────────────────────────────────────
model Favorite {
  id          String   @id @default(cuid())
  
  // 用户
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // 资源
  resourceId  String
  resource    Resource @relation(fields: [resourceId], references: [id], onDelete: Cascade)
  
  // 时间戳
  createdAt DateTime @default(now())
  
  @@unique([userId, resourceId]) // 一个用户只能收藏一个资源一次
}

// ── 评论 ─────────────────────────────────────────
model Comment {
  id          String   @id @default(cuid())
  content     String   @db.Text
  
  // 作者
  authorId    String
  author      User     @relation(fields: [authorId], references: [id], onDelete: Cascade)
  
  // 资源
  resourceId  String
  resource    Resource @relation(fields: [resourceId], references: [id], onDelete: Cascade)
  
  // 父评论（支持回复）
  parentId    String?
  parent      Comment? @relation("CommentReplies", fields: [parentId], references: [id], onDelete: Cascade)
  replies     Comment[] @relation("CommentReplies")
  
  // 点赞
  helpful     Int @default(0)
  
  // 时间戳
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### 3.2 数据库迁移策略

**阶段 1**：创建用户相关表（User, Account）
**阶段 2**：迁移现有资源数据到 PostgreSQL
**阶段 3**：添加用户生成内容表（Review, Rating, Favorite, Comment）

---

## 4. API Routes 结构

### 4.1 认证相关

```
GET  /api/auth/signin
GET  /api/auth/signout
GET  /api/auth/session
GET  /api/auth/csrf
POST /api/auth/callback/[provider]
```

使用 NextAuth.js 自动生成，无需手动实现。

### 4.2 用户相关

```
GET    /api/users/me           # 获取当前用户信息
PATCH  /api/users/me           # 更新当前用户信息
GET    /api/users/[id]         # 获取用户公开资料
```

### 4.3 资源相关

```
GET    /api/resources                    # 获取资源列表（支持分页、筛选）
GET    /api/resources/[id]              # 获取资源详情
POST   /api/resources                   # 提交新资源（需要 CONTRIBUTOR 权限）
PATCH  /api/resources/[id]              # 更新资源信息（需要 CONTRIBUTOR 权限）
DELETE /api/resources/[id]              # 删除资源（需要 ADMIN 权限）
```

### 4.4 评分相关

```
GET    /api/resources/[id]/ratings       # 获取资源的评分列表
POST   /api/resources/[id]/ratings       # 给资源评分
DELETE /api/resources/[id]/ratings       # 删除我的评分
```

### 4.5 评测相关

```
GET    /api/resources/[id]/reviews       # 获取资源的评测列表
POST   /api/resources/[id]/reviews       # 写评测
PATCH  /api/reviews/[id]                 # 更新评测
DELETE /api/reviews/[id]                 # 删除评测
```

### 4.6 收藏相关

```
GET    /api/users/me/favorites           # 获取我的收藏列表
POST   /api/resources/[id]/favorite      # 收藏资源
DELETE /api/resources/[id]/favorite      # 取消收藏
```

### 4.7 评论相关

```
GET    /api/resources/[id]/comments      # 获取资源的评论列表
POST   /api/resources/[id]/comments      # 发表评论
PATCH  /api/comments/[id]               # 编辑评论
DELETE /api/comments/[id]               # 删除评论
```

---

## 5. 实施计划

### 5.1 阶段 1：用户系统基础（1-2 周）

- [ ] 安装并配置 NextAuth.js
- [ ] 创建 User 和 Account 模型
- [ ] 实现邮箱注册/登录
- [ ] 实现 OAuth 登录（GitHub, Google）
- [ ] 创建用户资料页面

### 5.2 阶段 2：数据库迁移（2-3 周）

- [ ] 设置 Vercel Postgres 数据库
- [ ] 创建完整的 Prisma Schema
- [ ] 编写数据迁移脚本（从 JSON 迁移到 PostgreSQL）
- [ ] 迁移现有资源数据
- [ ] 验证数据完整性

### 5.3 阶段 3：用户生成内容（3-4 周）

- [ ] 实现评分功能
- [ ] 实现评论功能
- [ ] 实现收藏功能
- [ ] 实现评测功能
- [ ] 添加用户通知系统

### 5.4 阶段 4：高级功能（4-5 周）

- [ ] 实现资源提交/审核流程
- [ ] 实现用户权限管理
- [ ] 实现内容审核系统
- [ ] 添加用户仪表板
- [ ] 性能优化和缓存策略

---

## 6. 安全考虑

### 6.1 认证安全

- 使用 HTTPS（Vercel 自动提供）
- 密码加密（bcrypt）
- Session Token 使用 HTTP-only Cookie
- 实现速率限制（防止暴力破解）

### 6.2 数据安全

- 输入验证（使用 Zod）
- SQL 注入防护（Prisma 自动处理）
- XSS 防护（React 自动转义）
- CSRF 防护（NextAuth.js 自动处理）

### 6.3 权限控制

- API 级别权限检查
- 资源级别权限检查（用户只能编辑自己的内容）
- 管理员操作日志

---

## 7. 性能优化

### 7.1 数据库优化

- 添加索引（userId, resourceId, createdAt）
- 使用连接池
- 使用查询优化（select 特定字段）

### 7.2 缓存策略

- 使用 Next.js ISR/SSR 缓存静态页面
- 使用 Vercel Edge Cache
- 使用 Redis 缓存热门数据（可选）

### 7.3 API 优化

- 实现分页
- 实现字段选择（?fields=name,rating）
- 实现批量操作

---

## 8. 监控和分析

### 8.1 错误监控

- 使用 Sentry 或 Vercel Error Tracking

### 8.2 性能监控

- 使用 Vercel Analytics
- 使用 Prisma Metrics

### 8.3 用户行为分析

- 跟踪用户评分、评论、收藏行为
- 分析热门资源

---

## 9. 后续扩展

### 9.1 可能的功能扩展

- 用户关注系统
- 资源推荐算法
- 邮件通知系统
- 移动应用 API
- 实时通知（WebSocket）

### 9.2 国际化支持

- 多语言资源描述
- 多语言用户界面

---

## 10. 总结

本架构设计为 Craftisle 提供了完整的后端支持方案，包括用户系统、数据库设计、API 结构等。实施将分阶段进行，确保每个阶段都有可交付的成果。

**下一步**：
1. 创建 Prisma Schema 文件
2. 设置 Vercel Postgres 数据库
3. 安装并配置 NextAuth.js
4. 开始实施阶段 1

---

**文档版本**: v1.0  
**最后更新**: 2026-06-12  
**作者**: Craftisle Team
