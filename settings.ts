import { App, PluginSettingTab, Setting } from 'obsidian';
import GameOfLifePlugin from './main';

export interface GameOfLifeSettings {
    refreshInterval: number;
    imagePath: string;
}

export const DEFAULT_SETTINGS: GameOfLifeSettings = {
    refreshInterval: 3,
    imagePath: '游戏/资料/图片/'
}

export class GameOfLifeSettingTab extends PluginSettingTab {
    plugin: GameOfLifePlugin;

    constructor(app: App, plugin: GameOfLifePlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const {containerEl} = this;
        containerEl.empty();

        new Setting(containerEl)
            .setName('刷新间隔')
            .setDesc('设置数据刷新间隔（秒）')
            .addText(text => text
                .setPlaceholder('3')
                .setValue(String(this.plugin.settings.refreshInterval))
                .onChange(async (value) => {
                    const numValue = Number(value);
                    if (!isNaN(numValue) && numValue > 0) {
                        this.plugin.settings.refreshInterval = numValue;
                        await this.plugin.saveSettings();
                    }
                }));

        new Setting(containerEl)
            .setName('图片路径')
            .setDesc('设置图片文件夹路径')
            .addText(text => text
                .setPlaceholder('游戏/资料/图片/')
                .setValue(this.plugin.settings.imagePath)
                .onChange(async (value) => {
                    this.plugin.settings.imagePath = value;
                    await this.plugin.saveSettings();
                }));
    }
} 