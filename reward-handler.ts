interface RewardRow {
    次数: string;
    项目: string;
    值: number;
}

export class RewardHandler {
    constructor(private app: App) {}

    async processTaskCompletion(file: TFile, completionCount: number) {
        const content = await this.app.vault.read(file);
        const newContent = await this.updateCompletionRecord(content, completionCount);
        await this.app.vault.modify(file, newContent);
        
        // 处理奖励
        const rewards = this.parseRewardTable(content);
        await this.distributeRewards(rewards, completionCount);
    }

    private parseRewardTable(content: string): RewardRow[] {
        const rewards: RewardRow[] = [];
        const tableMatch = content.match(/\|[^]*?\n$/m);
        
        if (tableMatch) {
            const lines = tableMatch[0].split('\n');
            // 跳过表头和分隔行
            for (let i = 2; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line || line === '') continue;
                
                const [_, 次数, 项目, 值] = line.split('|').map(cell => cell.trim());
                if (次数 && 项目 && 值) {
                    rewards.push({ 次数, 项目, 值: parseInt(值) });
                }
            }
        }
        
        return rewards;
    }

    private async updateCompletionRecord(content: string, completionCount: number): Promise<string> {
        const now = moment().format('YYYY/MM/DD HH:mm');
        const completionRecord = `在 ${now} 完成第${completionCount}次`;
        
        // 更新完成次数标题
        let newContent = content.replace(
            /# 完成记录(?:（已完成\d+次）)?/,
            `# 完成记录（已完成${completionCount}次）`
        );
        
        // 添加完成记录
        newContent += `\n${completionRecord}`;
        return newContent;
    }

    private async distributeRewards(rewards: RewardRow[], completionCount: number) {
        for (const reward of rewards) {
            const frequency = parseInt(reward.次数.match(/\d+/)[0]);
            
            // 检查是否满足次数条件
            if (completionCount % frequency === 0) {
                await this.applyReward(reward.项目, reward.值);
            }
        }
    }

    private async applyReward(type: string, value: number) {
        if (type === '经验值') {
            await this.addExperience(value);
        } else if (type.startsWith('属性/')) {
            const attributeName = type.split('/')[1];
            await this.addAttribute(attributeName, value);
        } else if (type.startsWith('资源/')) {
            const resourceName = type.split('/')[1];
            await this.addResource(resourceName, value);
        } else if (type.startsWith('技能/')) {
            const skillName = type.split('/')[1];
            await this.addSkillExperience(skillName, value);
        }
    }

    private async addExperience(value: number) {
        const characterFile = this.app.vault.getAbstractFileByPath('游戏/角色.md');
        if (characterFile instanceof TFile) {
            const content = await this.app.vault.read(characterFile);
            const cache = this.app.metadataCache.getFileCache(characterFile);
            
            let exp = parseInt(cache?.frontmatter?.经验值 || '0');
            let level = parseInt(cache?.frontmatter?.等级 || '1');
            let nextLevelExp = parseInt(cache?.frontmatter?.升级需要经验 || '1000');
            
            exp += value;
            
            // 检查是否升级
            while (exp >= nextLevelExp) {
                exp -= nextLevelExp;
                level += 1;
                nextLevelExp += 1000;
            }
            
            // 更新��色文件
            const newContent = content
                .replace(/经验值: \d+/, `经验值: ${exp}`)
                .replace(/等级: \d+/, `等级: ${level}`)
                .replace(/升级需要经验: \d+/, `升级需要经验: ${nextLevelExp}`);
            
            await this.app.vault.modify(characterFile, newContent);
        }
    }

    private async addAttribute(attributeName: string, value: number) {
        const attrFile = this.app.vault.getAbstractFileByPath(`游戏/属性/${attributeName}.md`);
        if (attrFile instanceof TFile) {
            const content = await this.app.vault.read(attrFile);
            const cache = this.app.metadataCache.getFileCache(attrFile);
            
            const currentValue = parseInt(cache?.frontmatter?.当前值 || '0');
            const newValue = currentValue + value;
            
            const newContent = content.replace(/当前值: \d+/, `当前值: ${newValue}`);
            await this.app.vault.modify(attrFile, newContent);
        }
    }

    private async addResource(resourceName: string, value: number) {
        const resourceFile = this.app.vault.getAbstractFileByPath(`游戏/资源/${resourceName}.md`);
        if (resourceFile instanceof TFile) {
            const content = await this.app.vault.read(resourceFile);
            const cache = this.app.metadataCache.getFileCache(resourceFile);
            
            const currentValue = parseInt(cache?.frontmatter?.当前值 || '0');
            const newValue = currentValue + value;
            
            const newContent = content.replace(/当前值: \d+/, `当前值: ${newValue}`);
            await this.app.vault.modify(resourceFile, newContent);
        }
    }

    private async addSkillExperience(skillName: string, value: number) {
        const skillFile = this.app.vault.getAbstractFileByPath(`游戏/技能/${skillName}.md`);
        if (skillFile instanceof TFile) {
            const content = await this.app.vault.read(skillFile);
            const cache = this.app.metadataCache.getFileCache(skillFile);
            
            let exp = parseInt(cache?.frontmatter?.当前经验 || '0');
            let level = parseInt(cache?.frontmatter?.等级 || '1');
            let nextLevelExp = parseInt(cache?.frontmatter?.升级需要经验 || '100');
            
            exp += value;
            
            // 检查是否升级
            while (exp >= nextLevelExp) {
                exp -= nextLevelExp;
                level += 1;
                nextLevelExp += 100;
            }
            
            // 更新技能文件
            const newContent = content
                .replace(/当前经验: \d+/, `当前经验: ${exp}`)
                .replace(/等级: \d+/, `等级: ${level}`)
                .replace(/升级需要经验: \d+/, `升级需要经验: ${nextLevelExp}`);
            
            await this.app.vault.modify(skillFile, newContent);
        }
    }
} 