const { app, BrowserWindow, ipcMain, dialog, shell, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const fsPromises = require('fs').promises;
const { exec } = require('child_process');
const log = require('electron-log');
const { autoUpdater } = require('electron-updater');

// ========== 配置自动更新日志 ==========
autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';

// ========== 获取安装目录 ==========
function getInstallDir() {
    if (app.isPackaged) {
        return path.dirname(app.getPath('exe'));
    } else {
        return process.cwd();
    }
}

// ========== 配置日志路径（安装目录下的 logs 文件夹） ==========
const installDir = getInstallDir();
const logDir = path.join(installDir, 'logs');
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}
log.transports.file.resolvePathFn = () => path.join(logDir, 'main.log');
log.transports.file.level = 'info';
log.transports.console.level = 'debug';
log.info('应用启动，安装目录:', installDir);
log.info('日志目录:', logDir);

// ========== 确保更新缓存目录存在 ==========
const updateCacheDir = path.join(app.getPath('userData'), 'update-cache');
if (!fs.existsSync(updateCacheDir)) {
    fs.mkdirSync(updateCacheDir, { recursive: true });
    log.info('创建更新缓存目录:', updateCacheDir);
}
// 配置 autoUpdater 使用自定义缓存目录
autoUpdater.updateCachePath = updateCacheDir;

let mainWindow;
let config = {};

const configPath = path.join(installDir, 'config.json');
log.info('配置文件路径:', configPath);

// 读取 package.json 中的版本号和作者信息
const packageJson = require('./package.json');
const appVersion = packageJson.version;
let appAuthor = packageJson.author || '未知作者';

// 去除 author 中 <> 包裹的内容（如邮箱）
appAuthor = appAuthor.replace(/<[^>]*>/g, '').trim();

function getIconPath() {
    const icoPath = path.join(installDir, 'assets', 'icon.ico');
    const pngPath = path.join(installDir, 'assets', 'icon.png');
    if (fs.existsSync(icoPath)) return icoPath;
    if (fs.existsSync(pngPath)) return pngPath;
    log.warn('未找到图标文件');
    return null;
}

function getDefaultConfigContent() {
    const defaultBasePath = path.join(installDir, 'Develop', '11 - Database Script');
    log.info('生成默认配置，基础路径:', defaultBasePath);
    return {
        base_path: defaultBasePath,
        developer_ch_name: "张三",
        developer_en_name: "zhangsan",
        text_edit_app: "",
        databases: [
            "order_db", "product_db", "community_db", "content_db", "device_db",
            "main_db", "promotion_db", "ota_db", "payment_db", "pmp_db",
            "report_db", "report_data_db", "sharespace_db", "user_db",
            "workbench_db", "worktask_db", "data_warehouse_db"
        ],
        script_types: [
            { name: "DDL", description: "Data Definition Language (CREATE, ALTER, DROP)" },
            { name: "DML", description: "Data Manipulation Language (INSERT, UPDATE, DELETE)" },
            { name: "DQL", description: "Data Query Language (SELECT)" }
        ]
    };
}

async function createDefaultConfig() {
    try {
        const defaultConfig = getDefaultConfigContent();
        await fsPromises.writeFile(configPath, JSON.stringify(defaultConfig, null, 2), 'utf8');
        log.info('已创建默认配置文件:', configPath);
        return defaultConfig;
    } catch (error) {
        log.error('创建默认配置文件失败:', error);
        throw error;
    }
}

async function loadConfig() {
    try {
        const data = await fsPromises.readFile(configPath, 'utf8');
        config = JSON.parse(data);
        log.info('配置文件加载成功');
        log.debug('数据库数量:', config.databases?.length);
        log.debug('脚本类型数量:', config.script_types?.length);
        
        if (!config.base_path || !config.developer_ch_name || !config.developer_en_name) {
            throw new Error('配置文件缺少必要字段');
        }
        if (!Array.isArray(config.databases) || !Array.isArray(config.script_types)) {
            throw new Error('配置文件 databases 或 script_types 不是数组');
        }
        return config;
    } catch (error) {
        if (error.code === 'ENOENT') {
            log.info('配置文件不存在，创建默认配置');
            config = await createDefaultConfig();
            return config;
        }
        log.error('加载配置文件失败:', error);
        dialog.showErrorBox('配置错误', `无法加载配置文件 config.json：\n${error.message}\n\n请检查文件格式是否正确。`);
        app.quit();
        return null;
    }
}

async function saveConfig(newConfig) {
    try {
        await fsPromises.writeFile(configPath, JSON.stringify(newConfig, null, 2), 'utf8');
        config = newConfig;
        log.info('配置保存成功');
        return true;
    } catch (error) {
        log.error('保存配置文件失败:', error);
        return false;
    }
}

// ========== 关于对话框 ==========
function showAboutDialog() {
    const appName = 'SQL Script Generator';
    const version = appVersion;
    const author = appAuthor;
    const description = 'SQL脚本生成工具，用于快速生成符合规范的SQL脚本文件。';
    const copyright = `© ${new Date().getFullYear()} ${author}. All rights reserved.`;
    
    dialog.showMessageBox(mainWindow, {
        type: 'info',
        title: '关于',
        message: `${appName} ${version}`,
        detail: `${description}\n\n作者：${author}\n\n${copyright}`,
        buttons: ['确定'],
        icon: getIconPath()
    });
}

// ========== 检查更新 ==========
function checkForUpdates(manual = true) {
    // 开发环境跳过更新检查
    if (!app.isPackaged) {
        log.info('开发环境，跳过更新检查');
        if (manual) {
            dialog.showMessageBox(mainWindow, {
                type: 'info',
                title: '检查更新',
                message: '当前为开发环境，无法检查更新。\n请打包后测试更新功能。',
                buttons: ['确定']
            });
        }
        return;
    }
    
    log.info('开始检查更新，手动触发:', manual);
    
    // 设置更新服务器
    autoUpdater.setFeedURL({
        provider: 'github',
        owner: 'lov3smu',
        repo: 'sql-script-generator',
        releaseType: 'release'
    });
    
    // 移除之前的监听器，避免重复绑定
    autoUpdater.removeAllListeners('checking-for-update');
    autoUpdater.removeAllListeners('update-available');
    autoUpdater.removeAllListeners('update-not-available');
    autoUpdater.removeAllListeners('error');
    autoUpdater.removeAllListeners('download-progress');
    autoUpdater.removeAllListeners('update-downloaded');
    
    autoUpdater.on('checking-for-update', () => {
        log.info('正在检查更新...');
        if (manual && mainWindow) {
            mainWindow.webContents.send('update-status', '正在检查更新...');
        }
    });
    
    autoUpdater.on('update-available', (info) => {
        log.info('发现新版本:', info.version);
        if (mainWindow) {
            dialog.showMessageBox(mainWindow, {
                type: 'info',
                title: '发现新版本',
                message: `发现新版本 ${info.version}（当前版本 ${appVersion}），是否立即下载？`,
                buttons: ['下载', '以后']
            }).then(result => {
                if (result.response === 0) {
                    // 开始下载前确保缓存目录存在
                    if (!fs.existsSync(updateCacheDir)) {
                        fs.mkdirSync(updateCacheDir, { recursive: true });
                    }
                    autoUpdater.downloadUpdate();
                }
            });
        }
    });
    
    autoUpdater.on('update-not-available', () => {
        log.info('当前已是最新版本');
        if (manual && mainWindow) {
            dialog.showMessageBox(mainWindow, {
                type: 'info',
                title: '检查更新',
                message: `当前已是最新版本（${appVersion}）`,
                buttons: ['确定']
            });
        }
    });
    
    autoUpdater.on('error', (err) => {
        log.error('更新出错:', err);
        if (manual && mainWindow) {
            let errorMessage = err.message;
            if (err.message.includes('404')) {
                errorMessage = '未找到更新文件，请确保已正确发布最新版本到 GitHub Releases。';
            } else if (err.message.includes('ENOENT') || err.message.includes('download')) {
                errorMessage = '下载目录创建失败，请检查磁盘空间和写入权限。';
            }
            dialog.showErrorBox('检查更新失败', `无法检查更新：${errorMessage}`);
        }
    });
    
    autoUpdater.on('download-progress', (progressObj) => {
        log.info(`下载进度: ${progressObj.percent}%`);
        if (mainWindow) {
            mainWindow.webContents.send('update-progress', progressObj.percent);
        }
    });
    
    autoUpdater.on('update-downloaded', (info) => {
        log.info('更新下载完成:', info);
        dialog.showMessageBox(mainWindow, {
            type: 'info',
            title: '更新就绪',
            message: `新版本 ${info.version} 已下载完成，是否立即重启安装？`,
            buttons: ['立即重启', '稍后']
        }).then(result => {
            if (result.response === 0) {
                autoUpdater.quitAndInstall();
            }
        });
    });
    
    // 执行检查
    autoUpdater.checkForUpdatesAndNotify();
}

// ========== 创建应用菜单 ==========
function createAppMenu() {
    const template = [
        {
            label: '文件',
            submenu: [
                { role: 'quit', label: '退出' }
            ]
        },
        {
            label: '帮助',
            submenu: [
                {
                    label: '关于',
                    click: () => showAboutDialog()
                },
                {
                    label: '检查更新',
                    click: () => checkForUpdates(true)
                }
            ]
        }
    ];
    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}

function createWindow() {
    const iconPath = getIconPath();
    mainWindow = new BrowserWindow({
        width: 900,
        height: 700,
        icon: iconPath,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        },
        title: 'SQL Script Generator Tool'
    });

    mainWindow.loadFile('index.html');
    log.info('主窗口已创建');
    
    if (process.env.NODE_ENV === 'development') {
        mainWindow.webContents.openDevTools();
    }
    
    // 创建菜单
    createAppMenu();
}

async function generateSQLFile(scriptInfo) {
    try {
        log.info('开始生成SQL文件', scriptInfo);
        const now = new Date();
        const currentYear = now.getFullYear().toString();
        const currentDate = now.toISOString().split('T')[0];
        const dateCompact = now.toISOString().slice(2, 10).replace(/-/g, '');
        
        let targetPath;
        switch (scriptInfo.operateType) {
            case 'FIX':
                targetPath = path.join(config.base_path, 'PRODUCT-FIX', currentYear, scriptInfo.dirName);
                if (scriptInfo.scriptType) targetPath = path.join(targetPath, scriptInfo.scriptType);
                break;
            case 'PUBLISH':
                targetPath = path.join(config.base_path, 'PUBLISH', currentYear, scriptInfo.dirName);
                if (scriptInfo.scriptType) targetPath = path.join(targetPath, scriptInfo.scriptType);
                break;
            case 'QUERY':
                targetPath = path.join(config.base_path, 'DATA-QUERY', currentYear, scriptInfo.dirName);
                break;
            default:
                throw new Error('无效的操作类型');
        }
        
        await fsPromises.mkdir(targetPath, { recursive: true });
        log.debug('创建目录:', targetPath);
        
        const files = await fsPromises.readdir(targetPath);
        const sqlFiles = files.filter(f => f.endsWith('.sql'));
        const fileCount = sqlFiles.length + 1;
        const sNumber = fileCount < 10 ? `S0${fileCount}` : `S${fileCount}`;
        
        let filename;
        if (scriptInfo.operateType === 'QUERY') {
            filename = `${sNumber}-${currentDate}-${scriptInfo.database}-${scriptInfo.usage}.sql`;
        } else {
            filename = `${sNumber}-${currentDate}-${scriptInfo.scriptType}-${scriptInfo.database}-${scriptInfo.usage}.sql`;
        }
        filename = filename.replace(/\s/g, '_');
        
        const filePath = path.join(targetPath, filename);
        
        const content = `-- Please use UTF8 encoding without BOM
-- Script Usage: ${scriptInfo.usage}
-- Script Author: ${config.developer_ch_name}
-- Creation Time: ${currentDate}

USE ${scriptInfo.database};

BEGIN;

SET @author = '${config.developer_en_name}${dateCompact}';

INSERT INTO t_script_history (scriptName, remark, create_by, modify_by, create_time, modify_time)
VALUES ('${filename}', '${scriptInfo.usage}', @author, @author, NOW(), NOW());

COMMIT;
`;
        
        await fsPromises.writeFile(filePath, content, 'utf8');
        log.info('SQL文件生成成功:', filePath);
        
        return {
            success: true,
            filePath: filePath,
            filename: filename,
            targetPath: targetPath
        };
    } catch (error) {
        log.error('生成SQL文件失败:', error);
        return { success: false, error: error.message };
    }
}

async function openFile(filePath, editor) {
    try {
        await fsPromises.access(filePath);
        if (editor && editor !== '') {
            exec(`"${editor}" "${filePath}"`);
            log.debug('使用编辑器打开文件:', editor, filePath);
        } else {
            await shell.openPath(filePath);
            log.debug('使用系统默认程序打开文件:', filePath);
        }
        return true;
    } catch (error) {
        log.error('打开文件失败:', error);
        return false;
    }
}

async function openFolder(folderPath) {
    try {
        await fsPromises.access(folderPath);
        await shell.openPath(folderPath);
        log.debug('打开文件夹:', folderPath);
        return true;
    } catch (error) {
        log.error('打开文件夹失败:', error);
        return false;
    }
}

async function setupIPCHandlers() {
    ipcMain.handle('get-config', async () => {
        log.debug('IPC: 获取配置');
        return config;
    });
    ipcMain.handle('save-config', async (event, newConfig) => {
        log.info('IPC: 保存配置');
        return await saveConfig(newConfig);
    });
    ipcMain.handle('generate-script', async (event, scriptInfo) => {
        log.info('IPC: 生成脚本');
        return await generateSQLFile(scriptInfo);
    });
    ipcMain.handle('open-file', async (event, filePath) => {
        log.debug('IPC: 打开文件', filePath);
        return await openFile(filePath, config.text_edit_app);
    });
    ipcMain.handle('open-folder', async (event, folderPath) => {
        log.debug('IPC: 打开文件夹', folderPath);
        return await openFolder(folderPath);
    });
    ipcMain.handle('select-directory', async () => {
        log.debug('IPC: 选择文件夹');
        const result = await dialog.showOpenDialog(mainWindow, { properties: ['openDirectory'] });
        return result.filePaths[0] || '';
    });
    ipcMain.handle('select-file', async () => {
        log.debug('IPC: 选择文件');
        const result = await dialog.showOpenDialog(mainWindow, {
            properties: ['openFile'],
            filters: [
                { name: '可执行文件', extensions: ['exe'] },
                { name: '所有文件', extensions: ['*'] }
            ]
        });
        return result.filePaths[0] || '';
    });
    ipcMain.handle('reload-config', async () => {
        log.info('IPC: 重新加载配置');
        config = await loadConfig();
        return config;
    });
}

app.whenReady().then(async () => {
    log.info('Electron 应用准备就绪');
    await loadConfig();
    await setupIPCHandlers();
    createWindow();
});

app.on('window-all-closed', () => {
    log.info('所有窗口已关闭');
    if (process.platform !== 'darwin') app.quit();
});