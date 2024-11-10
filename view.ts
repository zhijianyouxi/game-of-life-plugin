import { ItemView, WorkspaceLeaf } from 'obsidian';
import { TFile } from 'obsidian';
import { v4 as uuidv4 } from 'uuid';
import { moment } from 'obsidian';
import { RewardHandler } from './reward-handler';

export const VIEW_TYPE_EXAMPLE = 'example-view';

export class ExampleView extends ItemView {
  private characterData: any = null;
  private attributes: Map<string, any> = new Map();
  private skills: Map<string, any> = new Map();
  private resources: Map<string, any> = new Map();
  private equipment: Map<string, any> = new Map();
  private refreshInterval: number;
  private currentView: 'character' | 'daily' | 'weekly' | 'other' = 'character';
  private tasks: any[] = [];
  private rewardHandler: RewardHandler;

  constructor(leaf: WorkspaceLeaf) {
    super(leaf);
    this.refreshInterval = this.app.plugins.getPlugin('game-of-life-plugin').settings.refreshInterval || 3;
    this.rewardHandler = new RewardHandler(this.app);
  }

  getViewType() {
    return VIEW_TYPE_EXAMPLE;
  }

  getDisplayText() {
    return 'Example view';
  }

  async loadAllData() {
    await Promise.all([
      this.loadCharacterData(),
      this.loadAttributes(),
      this.loadSkills(),
      this.loadResources(),
      this.loadEquipment(),
      this.scanTasks()
    ]);
    
    this.unfinishedTasks = await this.checkUnfinishedTasks();
    
    this.updateView();
  }

  async loadCharacterData() {
    const characterFile = this.app.vault.getAbstractFileByPath('游戏/角色.md');
    if (characterFile instanceof TFile) {
      const frontmatter = this.app.metadataCache.getFileCache(characterFile)?.frontmatter;
      
      const content = await this.app.vault.read(characterFile);
      
      const avatarMatch = content.match(/头像:\s*!\[\[(.*?)\]\]/);
      const imagePath = this.app.plugins.getPlugin('game-of-life-plugin').settings.imagePath;
      const avatarPath = avatarMatch ? imagePath + avatarMatch[1] : null;
      
      if (frontmatter) {
        this.characterData = {
          ...frontmatter,
          头像: avatarPath
        };
      }
    }
  }

  async loadAttributes() {
    this.attributes.clear();
    const attributesFolder = this.app.vault.getAbstractFileByPath('游戏/属性');
    if (attributesFolder) {
        const files = await this.app.vault.getAllLoadedFiles();
        for (const file of files) {
            if (file instanceof TFile && file.path.startsWith('游戏/属性/')) {
                const cache = this.app.metadataCache.getFileCache(file);
                
                const hasTags = cache?.frontmatter?.tags?.includes('游戏人生') || 
                               cache?.frontmatter?.tags?.includes('属性');

                if (hasTags || !cache?.frontmatter?.tags) {
                    const frontmatter = cache?.frontmatter;
                    if (frontmatter) {
                        this.attributes.set(file.basename, frontmatter);
                    }
                }
            }
        }
    }
  }

  async loadSkills() {
    this.skills.clear();
    const files = await this.app.vault.getAllLoadedFiles();
    for (const file of files) {
      if (file instanceof TFile && file.path.startsWith('游戏/技能/') && file.path.endsWith('/信息.md')) {
        const cache = this.app.metadataCache.getFileCache(file);
        if (cache?.frontmatter) {
          const skillName = file.path.split('/')[2];
          this.skills.set(skillName, cache.frontmatter);
        }
      }
    }
  }

  async loadResources() {
    this.resources.clear();
    const files = await this.app.vault.getAllLoadedFiles();
    for (const file of files) {
        if (file instanceof TFile && file.path.startsWith('游戏/资源/')) {
            const cache = this.app.metadataCache.getFileCache(file);
            const hasTags = cache?.frontmatter?.tags?.includes('游戏人生') || 
                           cache?.frontmatter?.tags?.includes('资源');

            if (hasTags || !cache?.frontmatter?.tags) {
                const frontmatter = cache?.frontmatter;
                if (frontmatter) {
                    this.resources.set(file.basename, frontmatter);
                }
            }
        }
    }
  }

  async loadEquipment() {
    this.equipment.clear();
    const files = await this.app.vault.getAllLoadedFiles();
    for (const file of files) {
        if (file instanceof TFile && file.path.startsWith('游戏/装备/')) {
            const cache = this.app.metadataCache.getFileCache(file);
            const hasTags = cache?.frontmatter?.tags?.includes('游戏人生') || 
                           cache?.frontmatter?.tags?.includes('装备');

            if (hasTags || !cache?.frontmatter?.tags) {
                const frontmatter = cache?.frontmatter;
                if (frontmatter) {
                    this.equipment.set(file.basename, frontmatter);
                }
            }
        }
    }
  }

  async scanTasks() {
    const files = await this.app.vault.getAllLoadedFiles();
    for (const file of files) {
        if (file instanceof TFile && 
            (file.path.startsWith('游戏/任务/周期任务/') || 
             file.path.startsWith('游戏/任务/副本任务/'))) {
            
            const cache = this.app.metadataCache.getFileCache(file);
            if (!cache?.frontmatter?.uuid) {
                try {
                    await this.addUuidToTask(file);
                    console.log(`Added UUID to task: ${file.path}`);
                } catch (error) {
                    console.error(`Failed to add UUID to task: ${file.path}`, error);
                }
            }
        }
    }
  }

  async addUuidToTask(file: TFile) {
    const content = await this.app.vault.read(file);
    const uuid = uuidv4();
    
    // 检查是否有 frontmatter
    if (content.startsWith('---')) {
      // 在 frontmatter 中添加 uuid
      const newContent = content.replace('---\n', `---\nuuid: "${uuid}"\n`);
      await this.app.vault.modify(file, newContent);
    } else {
      // 如果没有 frontmatter，创建一个
      const newContent = `---\nuuid: "${uuid}"\n---\n\n${content}`;
      await this.app.vault.modify(file, newContent);
    }
  }

  async checkTaskCompletion(taskUuid: string): Promise<boolean> {
    const plugin = this.app.plugins.getPlugin('game-of-life-plugin');
    return !!plugin.data.completedTasks[taskUuid];
  }

  async recordTaskCompletion(taskUuid: string, rewards: any) {
    const plugin = this.app.plugins.getPlugin('game-of-life-plugin');
    plugin.data.completedTasks[taskUuid] = {
      uuid: taskUuid,
      completedTime: new Date().toISOString(),
      rewards: rewards
    };
    await plugin.savePluginData();
  }

  // 检查是否有未完成的任务
  async checkUnfinishedTasks() {
    const plugin = this.app.plugins.getPlugin('game-of-life-plugin');
    const files = await this.app.vault.getAllLoadedFiles();
    
    let hasUnfinishedCyclicTasks = false;
    let hasUnfinishedDungeonTasks = false;

    for (const file of files) {
      if (file instanceof TFile) {
        const cache = this.app.metadataCache.getFileCache(file);
        const uuid = cache?.frontmatter?.uuid;
        
        if (!uuid) continue;

        if (file.path.startsWith('游戏/任务/周期任务/')) {
          if (!plugin.data.completedTasks[uuid]) {
            hasUnfinishedCyclicTasks = true;
          }
        } else if (file.path.startsWith('游戏/任务/副本任务/')) {
          if (!plugin.data.completedTasks[uuid]) {
            hasUnfinishedDungeonTasks = true;
          }
        }
      }
    }

    return {
      cyclic: hasUnfinishedCyclicTasks,
      dungeon: hasUnfinishedDungeonTasks
    };
  }

  private renderTaskButtons() {
    return `
      <div class="task-buttons-section">
        <button class="task-button" id="cyclic-task-btn">
          周期任务
          <span class="notification-dot ${this.unfinishedTasks?.cyclic ? 'active' : ''}"></span>
        </button>
        <button class="task-button" id="dungeon-task-btn">
          副本任务
          <span class="notification-dot ${this.unfinishedTasks?.dungeon ? 'active' : ''}"></span>
        </button>
      </div>
    `;
  }

  private addStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .container {
        max-width: 400px;
        margin: 0 auto;
        padding: 20px;
        text-align: center;
      }

      .avatar-section {
        margin-bottom: 30px;
      }

      #characterAvatar {
        width: 120px;
        height: 120px;
        border-radius: 60px;
        margin-bottom: 10px;
        border: 3px solid #007bff;
      }

      .character-name {
        font-size: 1.5em;
        margin: 10px 0;
      }

      .level-section {
        margin-bottom: 30px;
      }

      .level-info {
        margin-bottom: 10px;
        font-size: 1.1em;
      }

      .progress-bar {
        width: 100%;
        height: 20px;
        background-color: #e9ecef;
        border-radius: 10px;
        overflow: hidden;
        position: relative;
      }

      .progress {
        height: 100%;
        background-color: #007bff;
        transition: width 0.3s ease;
        position: absolute;
        left: 0;
        top: 0;
      }

      .attributes-section, .skills-section, .resources-section, .equipment-section {
        text-align: left;
        padding: 0 20px;
        margin-top: 30px;
      }

      .attributes-row {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-bottom: 20px;
      }

      .attribute {
        flex: 1;
        min-width: 150px;
        padding: 10px;
        background-color: #f8f9fa;
        border-radius: 5px;
      }

      .attribute-label, .resource-label {
        font-weight: bold;
        margin-right: 10px;
      }

      .attribute-value, .resource-value {
        color: #007bff;
      }

      .section-title {
        font-size: 1.2em;
        font-weight: bold;
        margin: 20px 0 15px 0;
        text-align: left;
        padding-left: 10px;
        border-left: 4px solid #007bff;
      }

      .resource-row {
        margin-bottom: 15px;
      }

      .resource {
        padding: 10px;
        background-color: #f8f9fa;
        border-radius: 5px;
        margin: 0 10px;
      }

      .task-buttons-section {
        display: flex;
        justify-content: center;
        gap: 20px;
        margin-top: 30px;
        padding: 0 20px;
      }

      .task-button {
        position: relative;
        padding: 10px 20px;
        border: none;
        border-radius: 5px;
        background-color: #007bff;
        color: white;
        cursor: pointer;
        font-size: 1em;
        transition: background-color 0.3s;
      }

      .task-button:hover {
        background-color: #0056b3;
      }

      .notification-dot {
        position: absolute;
        top: -5px;
        right: -5px;
        width: 10px;
        height: 10px;
        background-color: #ff4444;
        border-radius: 50%;
      }

      .back-button {
        margin-bottom: 20px;
        padding: 5px 15px;
        background: var(--interactive-accent);
        color: var(--text-on-accent);
        border: none;
        border-radius: 3px;
        cursor: pointer;
      }

      .task-list {
        padding: 20px;
      }

      .task-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px;
        background: var(--background-secondary);
        margin-bottom: 10px;
        border-radius: 5px;
      }

      .task-link {
        text-decoration: none;
        color: var(--text-normal);
      }

      .task-complete-btn {
        padding: 5px 10px;
        background: var(--interactive-accent);
        color: var(--text-on-accent);
        border: none;
        border-radius: 3px;
        cursor: pointer;
      }

      .no-tasks {
        text-align: center;
        color: var(--text-muted);
      }

      .task-navigation {
        position: fixed;
        bottom: 40px;
        left: 0;
        right: 0;
        padding: 12px 20px;
        background: var(--background-secondary);
        border-top: 1px solid var(--background-modifier-border);
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 10px;
        z-index: 100;
      }

      .task-nav-buttons {
        display: flex;
        gap: 10px;
      }

      .nav-button {
        padding: 10px 20px;
        border: none;
        border-radius: 4px;
        background: var(--background-modifier-form-field);
        color: var(--text-normal);
        cursor: pointer;
        transition: all 0.2s ease;
        height: 38px;
        line-height: 18px;
        font-size: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .nav-button:hover {
        background: var(--interactive-hover);
      }

      .nav-button.active {
        background: var(--interactive-accent);
        color: var(--text-on-accent);
      }

      .task-list {
        margin-bottom: 80px;
        padding: 20px;
      }

      .container {
        height: 100%;
        overflow-y: auto;
        padding-bottom: 80px;
      }

      .back-button {
        min-width: 80px;
      }
    `;
    this.containerEl.appendChild(style);
  }

  async onOpen() {
    await this.loadAllData();
    this.registerInterval(
      window.setInterval(() => this.loadAllData(), this.refreshInterval * 1000)
    );
    
    // 只在视图打开时注册一次事件
    this.registerEventHandlers();
  }

  async updateView() {
    const container = this.containerEl.children[1];
    container.empty();

    if (this.currentView === 'character') {
        container.innerHTML = `
            <div class="container">
                ${this.renderCharacterSection()}
                ${this.renderAttributesSection()}
                ${this.renderSkillsSection()}
                ${this.renderResourcesSection()}
                ${this.renderEquipmentSection()}
                ${this.renderTaskButtons()}
            </div>
        `;
    } else {
        container.innerHTML = `
            <div class="container">
                <div class="task-list">
                    <h2>${this.getTaskTypeTitle()}</h2>
                    ${this.renderTasks()}
                </div>
                ${this.renderTaskNavigation()}
            </div>
        `;
    }

    this.addStyles();
  }

  private renderCharacterSection() {
    if (!this.characterData) return '';
    
    const avatarPath = this.characterData.头像 
        ? this.app.vault.adapter.getResourcePath(this.characterData.头像)
        : "default-avatar.png";
        
    return `
        <div class="avatar-section">
            <img src="${avatarPath}" alt="角色头像" id="characterAvatar">
            <h2 class="character-name">${this.characterData.名字}</h2>
        </div>
        
        <div class="level-section">
            <div class="level-info">等级 ${this.characterData.等级} (${this.characterData.当前经验值}/${this.characterData.升级所需经验值})</div>
            <div class="progress-bar">
                <div class="progress" style="width: ${(this.characterData.当前经验值 / this.characterData.升级所需经验值) * 100}%"></div>
            </div>
        </div>
    `;
  }

  private renderAttributesSection() {
    if (this.attributes.size === 0) return '';
    
    const attributesHtml = Array.from(this.attributes.entries())
      .map(([name, data]) => `
        <div class="attribute">
          <span class="attribute-label">${name}:</span>
          <span class="attribute-value">${data.当前值}</span>
        </div>
      `).join('');

    return `
      <div class="attributes-section">
        <div class="section-title">属性</div>
        <div class="attributes-row">
          ${attributesHtml}
        </div>
      </div>
    `;
  }

  private renderSkillsSection() {
    if (this.skills.size === 0) return '';
    
    const skillsHtml = Array.from(this.skills.entries())
      .map(([name, data]) => `
        <div class="attribute">
          <span class="attribute-label">${name}:</span>
          <span class="attribute-value">Lv.${data.前等级}</span>
        </div>
      `).join('');

    return `
      <div class="skills-section">
        <div class="section-title">技能</div>
        <div class="attributes-row">
          ${skillsHtml}
        </div>
      </div>
    `;
  }

  private renderResourcesSection() {
    if (this.resources.size === 0) return '';
    
    const resourcesHtml = Array.from(this.resources.entries())
      .map(([name, data]) => `
        <div class="resource-row">
          <div class="resource">
            <span class="resource-label">${name}:</span>
            <span class="resource-value">${data.数量}</span>
          </div>
        </div>
      `).join('');

    return `
      <div class="resources-section">
        <div class="section-title">资源</div>
        ${resourcesHtml}
      </div>
    `;
  }

  private renderEquipmentSection() {
    if (this.equipment.size === 0) return '';
    
    // 定义装备等对应的颜色
    const equipmentColors = {
        '白色': '#ffffff',
        '绿色': '#4CAF50',
        '蓝色': '#2196F3',
        '紫色': '#9C27B0',
        '金色': '#FFD700',
        '红色': '#FF0000'
    };
    
    const equipmentHtml = Array.from(this.equipment.entries())
        .map(([name, data]) => `
            <div class="attribute">
                <span class="attribute-value" style="color: ${equipmentColors[data.装备等级] || '#ffffff'}">${name}</span>
            </div>
        `).join('');

    return `
        <div class="equipment-section">
            <div class="section-title">装备</div>
            <div class="attributes-row">
                ${equipmentHtml}
            </div>
        </div>
    `;
  }

  private renderTasks() {
    if (this.tasks.length === 0) {
        return '<p class="no-tasks">暂无未完成任务</p>';
    }

    return this.tasks.map(task => `
        <div class="task-item">
            <a href="#" class="task-link" data-path="${task.path}">${task.basename}</a>
            <button class="task-complete-btn" data-uuid="${task.uuid}">标记完成</button>
        </div>
    `).join('');
  }

  private getTaskTypeTitle() {
    const titles = {
        'daily': '每日任务',
        'weekly': '每周任务',
        'other': '其他任务'
    };
    return titles[this.currentView];
  }

  private renderTaskNavigation() {
    return `
        <div class="task-navigation">
            <button class="nav-button back-button">返回</button>
            <div class="task-nav-buttons">
                <button class="nav-button task-type-button ${this.currentView === 'daily' ? 'active' : ''}" 
                        data-type="daily">每日任务</button>
                <button class="nav-button task-type-button ${this.currentView === 'weekly' ? 'active' : ''}" 
                        data-type="weekly">每周任务</button>
                <button class="nav-button task-type-button ${this.currentView === 'other' ? 'active' : ''}" 
                        data-type="other">其他任务</button>
            </div>
        </div>
    `;
  }

  private async loadTasks() {
    const pathMap = {
        'daily': '游戏/任务/周期任务/每日任务',
        'weekly': '游戏/任务/周期任务/每周任务',
        'other': '游戏/任务/周期任务/其他任务'
    };

    this.tasks = [];
    const files = await this.app.vault.getAllLoadedFiles();
    const folderPath = pathMap[this.currentView];
    
    for (const file of files) {
        if (file instanceof TFile && file.path.startsWith(folderPath)) {
            const cache = this.app.metadataCache.getFileCache(file);
            const frontmatter = cache?.frontmatter;
            
            if (frontmatter?.任务状态 === '进行中' && 
                frontmatter?.本次任务完成情况 === '未完成') {
                this.tasks.push({
                    path: file.path,
                    basename: file.basename,
                    uuid: frontmatter.uuid
                });
            }
        }
    }
  }

  private registerEventHandlers() {
    const container = this.containerEl;
    
    // 使用事件委托，并确保事件只绑定一次
    container.off('click', '#cyclic-task-btn');
    container.off('click', '.back-button');
    container.off('click', '.task-type-button');
    container.off('click', '.task-complete-btn');

    container.on('click', '#cyclic-task-btn', async () => {
        this.currentView = 'daily';
        await this.loadTasks();
        this.updateView();
    });

    container.on('click', '.back-button', () => {
        this.currentView = 'character';
        this.updateView();
    });

    container.on('click', '.task-type-button', async (e) => {
        const type = (e.target as HTMLElement).dataset.type as 'daily' | 'weekly' | 'other';
        this.currentView = type;
        await this.loadTasks();
        this.updateView();
    });

    container.on('click', '.task-complete-btn', async (e) => {
        const uuid = (e.target as HTMLElement).dataset.uuid;
        if (uuid) {
            await this.markTaskComplete(uuid);
            await this.loadTasks();
            this.updateView();
        }
    });
  }

  async onClose() {
    // 在视图关闭时移除所有事件监听
    const container = this.containerEl;
    container.off('click', '#cyclic-task-btn');
    container.off('click', '.back-button');
    container.off('click', '.task-type-button');
    container.off('click', '.task-complete-btn');
  }

  async markTaskComplete(uuid: string) {
    const files = await this.app.vault.getAllLoadedFiles();
    for (const file of files) {
      if (file instanceof TFile) {
        const cache = this.app.metadataCache.getFileCache(file);
        if (cache?.frontmatter?.uuid === uuid) {
          const content = await this.app.vault.read(file);
          
          // 获取当前完成次数
          const completionMatch = content.match(/# 完成记录（已完成(\d+)次）/);
          const completionCount = (completionMatch ? parseInt(completionMatch[1]) : 0) + 1;
          
          // 处理任务完成和奖励
          await this.rewardHandler.processTaskCompletion(file, completionCount);
          
          // 更新任务状态
          let newContent = content.replace(
            /本次任务完成情况: 未完成/,
            '本次任务完成情况: 已完成'
          );

          // 计算下一次刷新时间
          const nextRefreshTime = await this.calculateNextRefreshTime(cache.frontmatter);
          if (nextRefreshTime) {
            newContent = this.updateNextRefreshTime(newContent, nextRefreshTime);
          }

          await this.app.vault.modify(file, newContent);
          break;
        }
      }
    }
  }

  private async calculateNextRefreshTime(taskData: TaskData): Promise<string | null> {
    const now = moment();

    switch (taskData.刷新方式) {
      case RefreshType.Manual:
        // 弹出对话框让用户输入下一次刷新时间
        return await this.promptForNextRefreshTime();
        
      case RefreshType.Interval:
        if (taskData.刷新间隔起算时间 === RefreshTimeBase.LastCompletion) {
          // 从当前完成时间开始计算
          return TaskTimeCalculator.addInterval(now, taskData.刷新间隔).format('YYYY-MM-DD HH:mm:ss');
        } else {
          // 从上次刷新时间开始计算
          const lastRefresh = moment(taskData.本次刷新时间);
          return TaskTimeCalculator.addInterval(lastRefresh, taskData.刷新间隔).format('YYYY-MM-DD HH:mm:ss');
        }
        
      case RefreshType.Scheduled:
        return TaskTimeCalculator.parseScheduledTime(taskData.刷新时间).format('YYYY-MM-DD HH:mm:ss');
    }
  }

  private async promptForNextRefreshTime(): Promise<string> {
    // 这里需要实现一个日期时间选择对话框
    // 可以使用 obsidian 的 Modal API 或其他 UI 组件
    return new Promise((resolve) => {
      // 实现对话框逻辑
      // 暂时返回24小时后
      resolve(moment().add(24, 'hours').format('YYYY-MM-DD HH:mm:ss'));
    });
  }

  private updateNextRefreshTime(content: string, nextTime: string): string {
    const hasNextTime = content.includes('下一次刷新时间:');
    if (hasNextTime) {
      return content.replace(
        /下一次刷新时间:.*(\r?\n|$)/,
        `下一次刷新时间: ${nextTime}\n`
      );
    } else {
      // 在 frontmatter 中添加新字段
      return content.replace(
        /---\n/,
        `---\n下一次刷新时间: ${nextTime}\n`
      );
    }
  }

  async checkTaskRefresh() {
    const now = moment();
    const files = await this.app.vault.getAllLoadedFiles();
    
    for (const file of files) {
        if (file instanceof TFile && 
            (file.path.startsWith('游戏/任务/周期任务/'))) {
            const cache = this.app.metadataCache.getFileCache(file);
            const taskData: TaskData = cache?.frontmatter;
            
            if (taskData?.下一次刷新时间) {
                const nextRefresh = moment(taskData.下一次刷新时间);
                
                if (nextRefresh.isSameOrBefore(now)) {
                    // 更新任务状态
                    const content = await this.app.vault.read(file);
                    let newContent = content
                        .replace(/本次任务完成情况: 已完成/, '本次任务完成情况: 未完成')
                        .replace(/本次刷新时间:.*(\r?\n|$)/, `本次刷新时间: ${now.format('YYYY-MM-DD HH:mm:ss')}\n`);
                    
                    // 计算下一次刷新时间
                    const nextTime = await this.calculateNextRefreshTime(taskData);
                    if (nextTime) {
                        newContent = this.updateNextRefreshTime(newContent, nextTime);
                    }
                    
                    await this.app.vault.modify(file, newContent);
                }
            }
        }
    }
  }

  async onload() {
    // ... 其他代码 ...
    
    // 每分钟检查一次任务刷新
    this.registerInterval(
        window.setInterval(() => this.checkTaskRefresh(), 60 * 1000)
    );
  }
}