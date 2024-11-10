import { ItemView, WorkspaceLeaf } from 'obsidian';
import { TFile } from 'obsidian';

export const VIEW_TYPE_EXAMPLE = 'example-view';

export class ExampleView extends ItemView {
  private characterData: any = null;

  constructor(leaf: WorkspaceLeaf) {
    super(leaf);
  }

  getViewType() {
    return VIEW_TYPE_EXAMPLE;
  }

  getDisplayText() {
    return 'Example view';
  }

  async loadCharacterData() {
    const characterFile = this.app.vault.getAbstractFileByPath('游戏/角色.md');
    if (characterFile instanceof TFile) {
      const content = await this.app.vault.read(characterFile);
      // 解析 frontmatter
      const frontmatter = this.app.metadataCache.getFileCache(characterFile)?.frontmatter;
      if (frontmatter) {
        this.characterData = frontmatter;
      }
    }
  }

  async onOpen() {
    await this.loadCharacterData();
    if (!this.characterData) {
      this.containerEl.children[1].innerHTML = '未找到角色数据';
      return;
    }

    const container = this.containerEl.children[1];
    container.empty();

    const htmlContent = `
        <div class="container">
            <div class="avatar-section">
                <img src="default-avatar.png" alt="角色头像" id="characterAvatar">
                <h2 class="character-name">${this.characterData.name}</h2>
            </div>
            
            <div class="level-section">
                <div class="level-info">等级 ${this.characterData.level} (${this.characterData.currentExp}/${this.characterData.nextLevelExp})</div>
                <div class="progress-bar">
                    <div class="progress" style="width: ${(this.characterData.currentExp / this.characterData.nextLevelExp) * 100}%"></div>
                </div>
            </div>

            <div class="attributes-section">
                <div class="section-title">基础属性</div>
                <div class="attributes-row">
                    <div class="attribute">
                        <span class="attribute-label">体能:</span>
                        <span class="attribute-value">${this.characterData.attributes.strength}</span>
                    </div>
                    <div class="attribute">
                        <span class="attribute-label">智力:</span>
                        <span class="attribute-value">${this.characterData.attributes.intelligence}</span>
                    </div>
                </div>
                <div class="attributes-row">
                    <div class="attribute">
                        <span class="attribute-label">心灵:</span>
                        <span class="attribute-value">${this.characterData.attributes.spirit}</span>
                    </div>
                    <div class="attribute">
                        <span class="attribute-label">谋略:</span>
                        <span class="attribute-value">${this.characterData.attributes.strategy}</span>
                    </div>
                </div>
            </div>

            <div class="skills-section">
                <div class="section-title">技能等级</div>
                <div class="attributes-row">
                    <div class="attribute">
                        <span class="attribute-label">数学:</span>
                        <span class="attribute-value">Lv.${this.characterData.skills.math}</span>
                    </div>
                    <div class="attribute">
                        <span class="attribute-label">物理:</span>
                        <span class="attribute-value">Lv.${this.characterData.skills.physics}</span>
                    </div>
                </div>
                <div class="attributes-row">
                    <div class="attribute">
                        <span class="attribute-label">计算机:</span>
                        <span class="attribute-value">Lv.${this.characterData.skills.computer}</span>
                    </div>
                    <div class="attribute">
                        <span class="attribute-label">笛子:</span>
                        <span class="attribute-value">Lv.${this.characterData.skills.flute}</span>
                    </div>
                </div>
            </div>

            <div class="resources-section">
                <div class="section-title">资源</div>
                <div class="resource-row">
                    <div class="resource">
                        <span class="resource-label">金币:</span>
                        <span class="resource-value">${this.characterData.resources.gold}</span>
                    </div>
                </div>
                <div class="resource-row">
                    <div class="resource">
                        <span class="resource-label">人脉:</span>
                        <span class="resource-value">${this.characterData.resources.connections}</span>
                    </div>
                </div>
            </div>
        </div>
    `;

    container.innerHTML = htmlContent;

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
        }

        .progress {
            height: 100%;
            background-color: #007bff;
            transition: width 0.3s ease;
        }

        .attributes-section {
            text-align: left;
            padding: 0 20px;
        }

        .attributes-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
        }

        .attribute {
            flex: 1;
            padding: 10px;
            background-color: #f8f9fa;
            border-radius: 5px;
            margin: 0 10px;
        }

        .attribute-label {
            font-weight: bold;
            margin-right: 10px;
        }

        .attribute-value {
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

        .skills-section {
            text-align: left;
            padding: 0 20px;
            margin-top: 30px;
        }

        .resources-section {
            text-align: left;
            padding: 0 20px;
            margin-top: 30px;
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

        .resource-label {
            font-weight: bold;
            margin-right: 10px;
        }

        .resource-value {
            color: #007bff;
        }
    `;
    container.appendChild(style);
  }

  async onClose() {
    // Nothing to clean up.
  }
}