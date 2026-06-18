# Giscus 评论系统配置指南

## 什么是 Giscus？

Giscus 是一个基于 GitHub Discussions 的开源评论系统。用户可以通过 GitHub 账号发表评论，所有评论数据存储在 GitHub Discussions 中。

## 配置步骤

### 1. 在 GitHub 仓库启用 Discussions

1. 打开 `https://github.com/craftisle/craftisle-app/settings`
2. 滚动到 "Features" 部分
3. 勾选 "Discussions" 复选框
4. 点击 "Set up discussions" 按钮
5. 选择分类（建议选择 "General" 或创建 "Blog Comments" 分类）

### 2. 安装 Giscus GitHub App

1. 打开 `https://github.com/apps/giscus`
2. 点击 "Install" 按钮
3. 选择 `craftisle/craftisle-app` 仓库
4. 点击 "Install" 确认

### 3. 获取 Giscus 配置参数

1. 打开 `https://giscus.app/`
2. 填写以下信息：
   - **Repository**: `craftisle/craftisle-app`
   - **Repository ID**: （自动填充）
   - **Category**: `General` 或 `Blog Comments`
   - **Category ID**: （自动填充）
   - **Mapping**: `pathname` (推荐)
   - **Strict mode**: `false` (推荐)
   - **Theme**: `light` (Craftisle 默认浅色主题)
   - **Language**: `Simplified Chinese` 或 `English`

3. 复制生成的配置参数（在页面底部）

### 4. 配置 `.env.local` 环境变量

在 `craftisle-app/` 目录下创建或编辑 `.env.local` 文件，添加以下变量：

```bash
# Giscus 评论系统配置
NEXT_PUBLIC_GISCUS_REPO=craftisle/craftisle-app
NEXT_PUBLIC_GISCUS_REPO_ID=R_kgDOxxxxxxxxxxxxxxx  # 从 giscus.app 获取
NEXT_PUBLIC_GISCUS_CATEGORY=General
NEXT_PUBLIC_GISCUS_CATEGORY_ID=DIC_kwDOxxxxxxxxxxxxxxx  # 从 giscus.app 获取
NEXT_PUBLIC_GISCUS_MAPPING=pathname
NEXT_PUBLIC_GISCUS_STRICT=false
NEXT_PUBLIC_GISCUS_THEME=light
NEXT_PUBLIC_GISCUS_LANG=zh-CN
```

### 5. 验证配置

1. 本地运行 `npm run dev`
2. 打开任意博客文章页面（如 `/blog/tools/json-formatter`）
3. 滚动到页面底部，应该看到 Giscus 评论框
4. 尝试发表一条测试评论（需要 GitHub 登录）

## 已有组件

Craftisle 已有 Giscus 评论组件：

- `components/giscus-comments.tsx` — Giscus 评论组件
- `app/(marketing)/blog/tools/[slug]/page.tsx` — 已在页面底部引入 Giscus 组件

## 故障排查

### 评论框不显示

1. 检查 `.env.local` 环境变量是否正确
2. 检查 GitHub Discussions 是否已启用
3. 检查 Giscus GitHub App 是否已安装到仓库
4. 打开浏览器开发者工具，查看 Console 错误信息

### 评论数据不显示

1. 检查 GitHub Discussions 分类是否正确
2. 检查 `NEXT_PUBLIC_GISCUS_CATEGORY_ID` 是否匹配
3. 尝试在 GitHub Discussions 手动创建一条讨论

## 参考资料

- Giscus 官网: `https://giscus.app/`
- Giscus GitHub: `https://github.com/giscus/giscus`
- Next.js 环境变量: `https://nextjs.org/docs/basic-features/environment-variables`
