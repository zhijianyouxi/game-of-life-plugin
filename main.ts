import { Plugin, addIcon } from 'obsidian';
import { ExampleView, VIEW_TYPE_EXAMPLE } from './view';
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

    async onload() {
        await this.loadSettings();

        // 添加自定义图标
        addIcon('game-of-life', GAME_ICON);

        // 添加左侧边栏图标
        this.addRibbonIcon('game-of-life', '游戏人生', (evt: MouseEvent) => {
            this.activateView();
        });

        this.registerView(
            VIEW_TYPE_EXAMPLE,
            (leaf) => new ExampleView(leaf)
        );

        this.addCommand({
            id: 'show-example-view',
            name: '显示角色面板',
            callback: () => {
                this.activateView();
            }
        });

        this.addSettingTab(new GameOfLifeSettingTab(this.app, this));

        // 加载任务记录数据
        this.data = Object.assign({}, { completedTasks: {} }, await this.loadData());


    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }

    async activateView() {
        const { workspace } = this.app;
        
        let leaf = workspace.getLeavesOfType(VIEW_TYPE_EXAMPLE)[0];
        if (!leaf) {
            leaf = workspace.getRightLeaf(false);
            await leaf.setViewState({
                type: VIEW_TYPE_EXAMPLE,
                active: true,
            });
        }
        workspace.revealLeaf(leaf);
    }

    async savePluginData() {
        await this.saveData(this.data);
    }

}