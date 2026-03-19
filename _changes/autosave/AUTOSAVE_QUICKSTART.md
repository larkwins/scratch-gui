# 🎨 Scratch GUI 自动保存功能 - 快速开始

## ✨ 已实现的功能

为 Scratch Web 项目添加了**自动保存到浏览器缓存**的功能！

### 核心特性
- ✅ **自动保存**：编辑项目时每 3 秒自动保存到浏览器 localStorage
- ✅ **自动恢复**：刷新页面时提示恢复之前的项目
- ✅ **智能管理**：超大项目自动跳过，存储不足优雅处理
- ✅ **开发工具**：浏览器控制台提供管理命令

## 🚀 立即开始

### 1. 启动项目
```bash
npm start
```

### 2. 打开浏览器
访问 `http://localhost:8601`

### 3. 开始使用
- 按 F12 打开开发者工具（查看控制台）
- 编辑项目（添加积木、角色等）
- 等待 3 秒，看到控制台日志：`✓ 项目已自动保存`
- 刷新页面，确认恢复弹窗
- 点击"确定"恢复项目

## 🎮 控制台命令

在浏览器控制台输入以下命令：

```javascript
// 查看帮助
ScratchAutoSave.help()

// 检查是否有自动保存
ScratchAutoSave.check()

// 查看存储使用情况
ScratchAutoSave.storageInfo()

// 导出自动保存为文件
ScratchAutoSave.export('my-project.sb3')

// 清除自动保存
ScratchAutoSave.clear()
```

## 📄 相关文档

- **功能说明**: [AUTOSAVE_README.md](./AUTOSAVE_README.md)
- **测试指南**: [AUTOSAVE_TEST.md](./AUTOSAVE_TEST.md)
- **实现总结**: [AUTOSAVE_SUMMARY.md](./AUTOSAVE_SUMMARY.md)

## 📦 新增文件

```
src/
├── lib/
│   ├── auto-save-hoc.jsx      # 自动保存核心组件
│   └── auto-save-utils.js     # 控制台工具函数
└── containers/
    └── gui.jsx                # 已集成自动保存

文档/
├── AUTOSAVE_README.md         # 功能说明和使用指南
├── AUTOSAVE_TEST.md           # 测试指南
├── AUTOSAVE_SUMMARY.md        # 实现总结
└── AUTOSAVE_QUICKSTART.md     # 本文件
```

## ⚡ 快速测试

### 测试 1: 自动保存
1. 编辑项目（添加积木）
2. 等待 3 秒
3. 控制台看到：`✓ 项目已自动保存 (X.XX MB)`

### 测试 2: 自动恢复
1. 刷新页面（F5）
2. 看到恢复提示弹窗
3. 点击"确定"
4. 项目恢复到之前状态

### 测试 3: 控制台工具
```javascript
ScratchAutoSave.check()
// 输出：
// ✓ 发现自动保存的项目
//   保存时间: 2026/3/19 10:30:00
//   大小: 约 0.52MB
```

## 💡 使用技巧

### 对于用户
- **无需任何操作**：自动保存会在后台工作
- **定期备份**：重要项目请手动下载保存
- **查看日志**：打开控制台了解保存状态

### 对于开发者
- **调试工具**：使用 `ScratchAutoSave` 命令调试
- **监控日志**：所有操作都有控制台日志
- **修改配置**：编辑 `auto-save-hoc.jsx` 调整参数

## ⚙️ 配置说明

在 `src/lib/auto-save-hoc.jsx` 中可修改：

```javascript
const AUTOSAVE_DELAY_MS = 3000;  // 保存延迟（毫秒）
const MAX_SIZE_MB = 8;           // 最大保存大小（MB）
```

## ❓ 常见问题

### Q: 自动保存保存在哪里？
A: 浏览器的 localStorage，只在当前浏览器有效。

### Q: 数据会丢失吗？
A: 清除浏览器数据会丢失，建议重要项目手动下载备份。

### Q: 支持多大的项目？
A: 建议小于 8MB，超大项目会自动跳过保存。

### Q: 如何关闭自动保存？
A: 从 `gui.jsx` 中移除 `AutoSaveHOC` 即可。

### Q: 支持哪些浏览器？
A: Chrome、Firefox、Safari、Edge 等现代浏览器。

## 🔗 有用链接

- [Scratch GUI 官方仓库](https://github.com/scratchfoundation/scratch-gui)
- [localStorage API 文档](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)

## 🎉 开始体验

现在就启动项目，体验无忧编程！

```bash
npm start
```

访问 `http://localhost:8601` 开始创作！

---

**注意**：自动保存是辅助功能，重要项目务必手动下载备份！

**提示**：按 F12 打开控制台，输入 `ScratchAutoSave.help()` 查看所有命令。
