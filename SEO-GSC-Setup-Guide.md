# Google Search Console 提交指南

## 操作步骤

### 1. 验证网站所有权
1. 访问 [Google Search Console](https://search.google.com/search-console)
2. 点击"添加资源"
3. 选择"网址前缀"：`https://craftisle.com/`
4. 验证方法选择 **HTML标记**：
   - 复制 `<meta>` 标签
   - 添加到 `app/layout.tsx` 的 `<head>` 中
   - 点击"验证"

### 2. 提交Sitemap
1. 在GSC左侧菜单选择"站点地图"
2. 点击"添加新的站点地图"
3. 输入：`sitemap.xml`
4. 点击"提交"

### 3. 请求索引
1. 在GSC中选择"网址检查"
2. 输入要索引的URL（如 `https://craftisle.com/tools`）
3. 如果显示"网址不在Google上"，点击"请求索引"

### 4. 监控索引状态
- 查看"覆盖范围"报告
  - 有效：已索引的页面
  - 警告：已索引但有问题
  - 错误：未索引的页面
  - 已排除：故意未索引的页面

## 其他搜索引擎

### Bing Webmaster Tools
1. 访问 [Bing Webmaster Tools](https://www.bing.com/webmasters)
2. 添加网站 `craftisle.com`
3. 验证所有权（同上）
4. 提交sitemap：`https://craftisle.com/sitemap.xml`

### Yandex Webmaster (俄罗斯)
1. 访问 [Yandex Webmaster](https://webmaster.yandex.com)
2. 添加网站
3. 验证所有权
4. 提交sitemap

### Baidu Search Resources (中国)
1. 访问 [百度搜索资源平台](https://ziyuan.baidu.com)
2. 添加网站
3. 验证所有权
4. 提交sitemap

## 监控指标

### 每周长监控
- 索引页面数量
- 点击次数（Clicks）
- 展示次数（Impressions）
- 平均排名（Average Position）
- 点击率（CTR）

### 每月监控
- 关键词排名变化
- 索引覆盖率变化
- Core Web Vitals 状态
- 移动设备易用性错误
