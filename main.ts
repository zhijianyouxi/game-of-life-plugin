import { Plugin, addIcon } from 'obsidian';
import { GameOfLifeView, VIEW_TYPE_GAME_OF_LIFE } from './src/view';
import { GameOfLifeSettings, DEFAULT_SETTINGS, GameOfLifeSettingTab } from './src/settings';
import { TaskRefreshManager } from './src/task-refresh-manager';

// 定义图标 SVG - 游戏手柄样式
const GAME_ICON = `<svg viewBox="0 0 512 512">
    <path d="M377.8,100.1C332.9,86.8,318.8,112,256,112s-76.9-25.3-121.8-11.9c-44.9,13.3-67.3,60.4-88.5,148.8  c-21.2,88.5-17.3,152.4,7.7,164.3c25,11.9,53.2-15.4,80.1-49.1C155.3,337.7,166.2,336,256,336c89.7,0,99,0.7,122.5,28.1  c26.9,33.7,55.1,61,80.1,49.1c25-11.9,28.9-75.8,7.7-164.3C445.1,160.5,422.6,113.5,377.8,100.1z M128.2,263.7  c-21.7,0-39.3-17.7-39.3-39.6c0-21.8,17.6-39.6,39.3-39.6c21.7,0,39.3,17.8,39.3,39.6S149.9,263.7,128.2,263.7z M309.7,243.6  c-10.6,0-19.3-8.7-19.3-19.4c0-10.7,8.7-19.4,19.3-19.4c10.7,0,19.4,8.7,19.4,19.4C329,234.9,320.4,243.6,309.7,243.6z M351.9,286  c-10.6,0-19.3-8.7-19.3-19.4c0-10.8,8.7-19.4,19.3-19.4c10.7,0,19.4,8.7,19.4,19.4C371.3,277.4,362.6,286,351.9,286z M351.9,201.1  c-10.6,0-19.3-8.7-19.3-19.4c0-10.7,8.7-19.4,19.3-19.4c10.7,0,19.4,8.7,19.4,19.4C371.3,192.4,362.6,201.1,351.9,201.1z   M394.2,243.6c-10.7,0-19.3-8.7-19.3-19.4c0-10.7,8.7-19.4,19.3-19.4c10.6,0,19.3,8.7,19.3,19.4  C413.5,234.9,404.9,243.6,394.2,243.6z" 
          fill="currentColor"/>
</svg>`;

interface TaskRecord {
    uuid: string;
    completedTime: string;
    rewards: any;
}

interface GameOfLifeData {
    completedTasks: {[uuid: string]: TaskRecord};
}

export default class GameOfLifePlugin extends Plugin {
    settings: GameOfLifeSettings;
    data: GameOfLifeData;
    private view: GameOfLifeView;
    private taskRefreshManager: TaskRefreshManager;

    async onload() {
        console.log("加载游戏人生插件");
        
        // 初始化数据
        this.data = Object.assign({ completedTasks: {} }, await this.loadData());
        await this.loadSettings();
        
        // 添加图标
        addIcon('game-of-life', GAME_ICON);
        
        // 添加侧边栏按钮
        this.addRibbonIcon('game-of-life', '游戏人生', async () => {
            await this.activateView();
        });
        
        // 初始化任务刷新管理器
        this.taskRefreshManager = new TaskRefreshManager(this.app);
        
        // 注册视图
        this.registerView(
            VIEW_TYPE_GAME_OF_LIFE,
            (leaf) => {
                this.view = new GameOfLifeView(leaf, this.taskRefreshManager);
                return this.view;
            }
        );

        // 添加命令
        this.addCommand({
            id: 'open-game-of-life',
            name: '打开游戏人生',
            callback: () => this.activateView()
        });

        // 添加设置页
        this.addSettingTab(new GameOfLifeSettingTab(this.app, this));
        
        // 启动任务刷新定时器
        this.taskRefreshManager.startRefreshTimer();
    }

    async activateView() {
        const { workspace } = this.app;
        
        let leaf = workspace.getLeavesOfType(VIEW_TYPE_GAME_OF_LIFE)[0];
        
        if (!leaf) {
            leaf = workspace.getRightLeaf(false);
            await leaf.setViewState({
                type: VIEW_TYPE_GAME_OF_LIFE,
                active: true,
            });
        }
        
        workspace.revealLeaf(leaf);
    }

    async onunload() {
        console.log("卸载游戏人生插件");
        this.taskRefreshManager.stopRefreshTimer();
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }

    async savePluginData() {
        await this.saveData(this.data);
    }

    async openGameOfLife() {
        const workspace = this.app.workspace;
        const leaf = workspace.getRightLeaf(false);
        await leaf.setViewState({
            type: VIEW_TYPE_GAME_OF_LIFE,
            active: true,
        });
        workspace.revealLeaf(leaf);
    }
}