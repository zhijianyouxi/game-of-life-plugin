import { Plugin, addIcon } from 'obsidian';
import { ExampleView, VIEW_TYPE_EXAMPLE } from './src/view';
import { GameOfLifeSettings, DEFAULT_SETTINGS, GameOfLifeSettingTab } from './settings';

// 定义图标 SVG
const GAME_ICON = `<svg viewBox="0 0 100 100" width="100" height="100">
    <circle cx="50" cy="50" r="45" stroke="currentColor" stroke-width="2" fill="none"/>
    <text x="50" cy="50" text-anchor="middle" dominant-baseline="middle" font-size="60" fill="currentColor">G</text>
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
    private view: ExampleView;

    async onload() {
        console.log("加载游戏人生插件");
        
        // 初始化数据
        this.data = Object.assign({ completedTasks: {} }, await this.loadData());
        await this.loadSettings();
        
        // 注册视图
        this.registerView(
            VIEW_TYPE_EXAMPLE,
            (leaf) => {
                console.log("创建视图实例");
                this.view = new ExampleView(leaf);
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
        
        // 如果需要，自动打开视图
        await this.activateView();
    }

    async activateView() {
        console.log("激活视图");
        const { workspace } = this.app;
        
        let leaf = workspace.getLeavesOfType(VIEW_TYPE_EXAMPLE)[0];
        
        if (!leaf) {
            console.log("创建新的视图页面");
            leaf = workspace.getRightLeaf(false);
            await leaf.setViewState({
                type: VIEW_TYPE_EXAMPLE,
                active: true,
            });
        }
        
        console.log("显示视图");
        workspace.revealLeaf(leaf);
    }

    async onunload() {
        console.log("卸载游戏人生插件");
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
            type: VIEW_TYPE_EXAMPLE,
            active: true,
        });
        workspace.revealLeaf(leaf);
    }
}