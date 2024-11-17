import { App, TFile } from 'obsidian';
import { moment } from 'obsidian';
import { TaskTimeCalculator } from './utils';
import { TaskData, RefreshType, RefreshTimeBase } from './types';

export class TaskRefreshManager {
    private taskCheckInterval: NodeJS.Timer;
    private refreshInterval: number;
    private isRunning: boolean = false;

    constructor(private app: App) {
        const plugin = this.app.plugins.getPlugin('game-of-life-plugin');
        this.refreshInterval = (plugin.settings.refreshInterval || 5) * 1000;
    }

    startRefreshTimer() {
        if (this.isRunning) {
            console.log("定时器已在运行中");
            return;
        }

        console.log("启动任务刷新定时器");
        this.isRunning = true;
        
        // 立即执行一次检查
        this.checkTaskRefresh();
        
        // 设置定时器
        this.taskCheckInterval = setInterval(() => {
            // console.log("执行定时任务检查");
            this.checkTaskRefresh();
        }, this.refreshInterval);
    }

    stopRefreshTimer() {
        if (!this.isRunning) {
            console.log("定时器未在运行");
            return;
        }

        console.log("停止任务刷新定时器");
        if (this.taskCheckInterval) {
            clearInterval(this.taskCheckInterval);
            this.taskCheckInterval = null;
        }
        this.isRunning = false;
    }

    async checkTaskRefresh() {
        console.log("执行任务刷新检查");
        const now = moment();
        const files = await this.app.vault.getAllLoadedFiles();
        
        for (const file of files) {
            if (file instanceof TFile && 
                (file.path.startsWith('游戏/任务/周期任务/'))) {
                // console.log("检查任务刷新", file.path);
                await this.checkSingleTask(file, now);
            }
        }
    }

    private async checkSingleTask(file: TFile, now: moment.Moment) {
        const cache = this.app.metadataCache.getFileCache(file);
        const taskData: TaskData = cache?.frontmatter;
        
        if (taskData?.下一次刷新时间) {
            const nextRefresh = moment(taskData.下一次刷新时间);
            
            if (nextRefresh.isSameOrBefore(now)) {
                console.log("任务需要刷新");
                await this.refreshTask(file, taskData, now);

            }
        }
    }

    private async refreshTask(file: TFile, taskData: TaskData, now: moment.Moment) {
        const content = await this.app.vault.read(file);
        let newContent = content
            .replace(/本次任务完成情况: 已完成/, '本次任务完成情况: 未完成')
            .replace(/本次刷新时间:.*(\r?\n|$)/, `本次刷新时间: ${now.format('YYYY-MM-DD HH:mm:ss')}\n`);
        
        // 计算下一次刷新时间
        const nextTime = await this.calculateNextRefreshTime(taskData, now);
        console.log(`下一次刷新时间: ${nextTime}`);
        if (nextTime) {
            newContent = this.updateNextRefreshTime(newContent, nextTime);
            console.log(`🎮 任务刷新: ${file.basename}
            ├── 刷新方式: ${taskData.刷新方式}
            ├── 刷新间隔: ${taskData.刷新间隔 || '无'}
            ├── 刷新时间: ${taskData.刷新时间 || '无'}
            ├── 刷新间隔起算时间: ${taskData.刷新间隔起算时间 || '无'}
            ├── 更新前刷新时间: ${now.format('YYYY-MM-DD HH:mm:ss')}
            └── 更新后刷新时间: ${nextTime}`);
            await this.app.vault.modify(file, newContent);
        }
        
    }

    public async calculateNextRefreshTime(taskData: TaskData, now: moment.Moment): Promise<string | null> {
        switch (taskData.刷新方式) {
            case RefreshType.Manual:
                return null;
                
            case RefreshType.Interval:
                if (taskData.刷新间隔起算时间 === RefreshTimeBase.LastCompletion) {
                    return TaskTimeCalculator.addInterval(now, taskData.刷新间隔).format('YYYY-MM-DD HH:mm:ss');
                } else {
                    const lastRefresh = moment(taskData.本次刷新时间);
                    return TaskTimeCalculator.addInterval(lastRefresh, taskData.刷新间隔).format('YYYY-MM-DD HH:mm:ss');
                }
                
            case RefreshType.Scheduled:
                return TaskTimeCalculator.parseScheduledTime(taskData.刷新时间).format('YYYY-MM-DD HH:mm:ss');
        }
    }

    public updateNextRefreshTime(content: string, nextTime: string): string {
        const hasNextTime = content.includes('下一次刷新时间:');
        if (hasNextTime) {
            return content.replace(
                /下一次刷新时间:.*(\r?\n|$)/,
                `下一次刷新时间: ${nextTime}\n`
            );
        } else {
            return content.replace(
                /---\n/,
                `---\n下一次刷新时间: ${nextTime}\n`
            );
        }
    }
} 