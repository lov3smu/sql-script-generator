# SQL Script Generator

<p align="center">
  <img src="assets/icon.png" width="120" height="120" alt="SQL Script Generator Logo">
</p>

<p align="center">
  <strong>SQL 脚本生成工具</strong> - 快速生成符合规范的 SQL 脚本文件
</p>

<p align="center">
  <a href="https://github.com/lov3smu/sql-script-generator/releases">
    <img src="https://img.shields.io/github/v/release/lov3smu/sql-script-generator?style=flat-square" alt="Release">
  </a>
  <a href="LICENSE.txt">
    <img src="https://img.shields.io/github/license/lov3smu/sql-script-generator?style=flat-square" alt="License">
  </a>
</p>

---

## ✨ 功能特性

### 🚀 核心功能

- **快速生成 SQL 脚本** - 通过简洁的图形界面，快速生成标准化的 SQL 脚本文件
- **多操作类型支持** - 支持 FIX（修复）、PUBLISH（发布）、QUERY（查询）三种操作类型
- **自定义数据库配置** - 可配置多个数据库连接信息
- **自定义脚本类型** - 支持配置多种脚本类型和描述
- **智能目录命名** - 自动生成带日期和用途的目录名
- **一键打开文件** - 生成后可立即用系统默认编辑器打开

### 🔐 密码生成器

- **安全随机密码** - 使用 Crypto API 生成高强度随机密码
- **灵活字符配置** - 支持大写字母、小写字母、数字、特殊字符组合
- **密码强度检测** - 实时显示密码强度评级
- **历史记录** - 保存最近生成的密码，支持一键复制
- **拖拽调节长度** - 支持 1-100 位密码长度调节

### ⏰ Cron 表达式生成器

- **可视化生成** - 通过图形界面生成 Cron 表达式
- **字段配置** - 支持秒、分钟、小时、日、月、周、年配置
- **表达式反解析** - 支持解析现有 Cron 表达式
- **执行时间预览** - 显示最近5次执行时间
- **快捷键配置** - 可自定义各功能快捷键

### ⏱️ Unix 时间戳转换器

- **实时显示** - 显示当前10位(秒级)和13位(毫秒级)时间戳
- **双向转换** - 支持时间戳转北京时间、北京时间转时间戳
- **快速输入** - 支持 YYYYMMDDHHMMSS 格式快速转换
- **一键复制** - 转换结果支持一键复制

### 📝 YAML 编辑验证器

- **格式化** - YAML 代码格式化，支持标准缩进
- **压缩** - YAML 代码压缩，减少空行
- **校验** - 实时校验 YAML 语法，提示错误位置
- **转换** - YAML 转 JSON，支持树形视图展示
- **文件加载** - 支持从本地文件加载 YAML

### 📁 文件管理器

- **目录浏览** - 浏览脚本存储目录结构
- **视图切换** - 支持列表视图、平铺视图、紧凑模式
- **时间排序** - 按创建时间正序/倒序排列
- **右键菜单** - 打开文件/文件夹、复制路径、查看属性
- **属性查看** - 显示文件类型、大小、创建/修改时间等信息

### 🎨 界面特色

- **现代化 UI** - 采用毛玻璃设计风格，简洁美观
- **动态宽度** - 页面宽度自适应窗口大小（最大90%屏幕宽度）
- **系统托盘** - 支持最小化到系统托盘
- **开机自启动** - 可配置开机自动运行
- **启动动画** - 加载时显示 splash 动画

---

## 📦 安装指南

### 下载安装

从 [Releases](https://github.com/lov3smu/sql-script-generator/releases) 页面下载对应平台的安装包：

| 平台 | 文件格式 | 说明 |
|:---:|:---:|:---|
| 🪟 Windows | `.exe` (NSIS 安装程序) | 标准 Windows 安装包 |
| 🍎 macOS | `.dmg` / `.zip` | macOS 磁盘镜像和压缩包 |
| 🐧 Linux | `.AppImage` / `.deb` / `.tar.gz` | Linux 通用格式 |

### 系统要求

- **Windows**: Windows 10 或更高版本 (x64)
- **macOS**: macOS 10.15 (Catalina) 或更高版本 (Intel/Apple Silicon)
- **Linux**: Ubuntu 18.04+ 或其他兼容发行版 (x64)
- **内存**: 至少 2GB RAM
- **磁盘空间**: 至少 100MB 可用空间

### 从源码运行

```bash
# 克隆仓库
git clone https://github.com/lov3smu/sql-script-generator.git
cd sql-script-generator

# 安装依赖
npm install

# 启动开发模式
npm run dev
```

---

## 🚀 快速开始

### 生成 SQL 脚本

1. **启动应用** - 运行 SQL Script Generator
2. **选择操作类型** - 点击 FIX / PUBLISH / QUERY 选择操作类型
3. **填写脚本用途** - 输入脚本用途描述
4. **选择数据库** - 从下拉列表选择目标数据库
5. **选择脚本类型** - 选择合适的脚本类型（FIX/PUBLISH 时）
6. **生成脚本** - 点击"🚀 生成脚本"按钮
7. **查看结果** - 脚本文件将自动生成并显示路径

### 使用密码生成器

1. **打开密码工具** - 点击菜单栏"工具" → "密码生成器" 或托盘菜单
2. **选择字符类型** - 勾选需要的字符类型（大写、小写、数字、特殊字符）
3. **调节密码长度** - 拖拽滑块或输入长度（1-100）
4. **生成密码** - 点击"🔄 生成密码"按钮
5. **复制使用** - 点击复制按钮或从历史记录中选择

### 使用 Cron 表达式生成器

1. **打开 Cron 工具** - 点击菜单栏"工具" → "Cron表达式生成器"
2. **选择字段** - 点击秒/分钟/小时等标签页
3. **配置规则** - 选择"每"、"周期"、"循环"、"指定"等规则
4. **查看结果** - 自动生成 Cron 表达式和描述
5. **复制使用** - 点击复制按钮

---

## 🛠️ 开发指南

### 项目结构

```
sql-script-generator/
├── assets/                 # 图标和资源文件
├── src/                    # 源代码目录
│   ├── main/               # Electron 主进程代码
│   │   ├── index.js        # 主进程入口
│   │   ├── ipc/            # IPC 通信
│   │   ├── windows/        # 窗口管理
│   │   ├── ui/             # UI 相关（菜单、托盘）
│   │   ├── services/       # 服务（配置、生成、更新、自启动）
│   │   ├── utils/          # 工具函数
│   │   └── constants/      # 常量定义
│   ├── preload/            # 预加载脚本
│   │   └── index.js        # 预加载入口
│   └── renderer/           # Vue 渲染进程代码
│       ├── src/
│       │   ├── views/      # 页面组件
│       │   │   ├── Home.vue         # 主页面
│       │   │   ├── Settings.vue     # 设置页面
│       │   │   ├── Password.vue     # 密码生成器
│       │   │   ├── Cron.vue         # Cron 表达式生成器
│       │   │   ├── UnixTimestamp.vue # Unix 时间戳转换器
│       │   │   ├── YamlEditor.vue   # YAML 编辑验证器
│       │   │   └── FileManager.vue  # 文件管理器
│       │   ├── styles/     # CSS 样式文件
│       │   ├── router/     # Vue Router 配置
│       │   ├── composables/ # Vue 组合式函数
│       │   ├── api/        # API 接口
│       │   ├── App.vue     # 根组件
│       │   └── main.js     # Vue 入口
│       └── index.html      # HTML 入口
├── .github/                # GitHub 配置
│   └ workflows/            # CI/CD 工作流
│     └ build.yml           # 构建发布流程
├── package.json            # 项目配置
├── electron.vite.config.js # Electron Vite 配置
└ LICENSE.txt               # 许可证
└ README.md                 # 说明文档
```

### 构建打包

```bash
# 构建 Windows 版本
npm run build:win

# 构建 macOS 版本
npm run build:mac

# 构建 Linux 版本
npm run build:linux

# 构建所有平台
npm run build
```

---

## 📝 配置说明

应用配置文件存储在应用安装目录下：

- 配置文件路径：`安装目录/config.json`

配置项包括：
- `base_path` - 脚本存储根目录
- `developer_ch_name` - 开发者中文名
- `developer_en_name` - 开发者英文名
- `text_edit_app` - 外部文本编辑器路径
- `databases` - 数据库列表
- `script_types` - 脚本类型列表
- `shortcuts` - 快捷键配置
  - `home` - 首页快捷键
  - `password` - 密码生成器快捷键
  - `cron` - Cron 生成器快捷键
  - `unixtimestamp` - Unix 时间戳转换器快捷键
  - `yamlEditor` - YAML 编辑器快捷键
  - `fileManager` - 文件管理器快捷键
  - `settings` - 设置快捷键
- `auto_update` - 自动更新开关
- `auto_start` - 开机自启动开关
- `close_action` - 关闭窗口行为（ask/hide/quit）

---

## 🔧 技术栈

- **[Electron](https://www.electronjs.org/)** - 跨平台桌面应用框架
- **[Vue 3](https://vuejs.org/)** - 渐进式 JavaScript 框架
- **[electron-vite](https://electron-vite.org/)** - Electron Vite 构建工具
- **[Vite](https://vitejs.dev/)** - 下一代前端构建工具
- **[Vue Router](https://router.vuejs.org/)** - Vue.js 官方路由
- **[electron-builder](https://www.electron.build/)** - 应用打包工具
- **[electron-log](https://github.com/megahertz/electron-log)** - 日志记录
- **[electron-updater](https://github.com/electron-userland/electron-updater)** - 自动更新
- **[js-yaml](https://github.com/nodeca/js-yaml)** - YAML 解析库

---

## 📄 许可证

本项目基于 [MIT 许可证](LICENSE.txt) 开源。

---

## 👨‍💻 作者

**lov3smu** - [imancoka@gmail.com](mailto:imancoka@gmail.com)

GitHub: [@lov3smu](https://github.com/lov3smu)

---

## 🙏 致谢

感谢所有为这个项目提供建议和帮助的朋友们！

如果您觉得这个项目对您有帮助，请给个 ⭐ Star 支持一下！