import { Plugin, WorkspaceLeaf } from 'obsidian';
import { ExampleView, VIEW_TYPE_EXAMPLE } from './view';
import { Notice } from 'obsidian';

export default class ExamplePlugin extends Plugin {
  async onload() {
    this.registerView(
      VIEW_TYPE_EXAMPLE,
      (leaf) => new ExampleView(leaf)
    );

    this.addRibbonIcon('dice', 'Activate view', () => {
      this.activateView();
    });

    // 添加创建角色命令
    this.addCommand({
      id: 'create-character',
      name: '创建角色',
      callback: async () => {
        await this.createCharacter();
      }
    });
  }

  async onunload() {
  }

  async activateView() {
    const { workspace } = this.app;

    let leaf: WorkspaceLeaf | null = null;
    const leaves = workspace.getLeavesOfType(VIEW_TYPE_EXAMPLE);

    if (leaves.length > 0) {
      // A leaf with our view already exists, use that
      leaf = leaves[0];
    } else {
      // Our view could not be found in the workspace, create a new leaf
      // in the right sidebar for it
      leaf = workspace.getRightLeaf(false);
      await leaf.setViewState({ type: VIEW_TYPE_EXAMPLE, active: true });
    }

    // "Reveal" the leaf in case it is in a collapsed sidebar
    workspace.revealLeaf(leaf);
  }

  async createCharacter() {
    // 检查游戏目录是否存在
    const gameFolder = this.app.vault.getAbstractFileByPath('游戏');
    if (!gameFolder) {
      // 如果游戏文件夹不存在，创建它
      try {
        await this.app.vault.createFolder('游戏');
      } catch (error) {
        new Notice('创建游戏文件夹失败');
        return;
      }
    }

    // 检查角色文件是否已存在
    const characterFile = this.app.vault.getAbstractFileByPath('游戏/角色.md');
    if (characterFile) {
      new Notice('角色文件已存在');
      return;
    }

    // 创建角色文件内容
    const characterContent = `---
name: "Q"
level: 1
currentExp: 100
nextLevelExp: 1000
attributes:
  strength: 10    # 体能
  intelligence: 10 # 智力
  spirit: 10      # 心灵
  strategy: 10    # 谋略
skills:
  math: 3         # 数学
  physics: 2      # 物理
  computer: 4     # 计算机
  flute: 1        # 笛子
resources:
  gold: 1000      # 金币
  connections: 50 # 人脉
---

# 角色信息

这是你的角色信息页面。你可以在这里记录角色的成长历程和其他笔记。

## 基本信息
- 名称：{{name}}
- 等级：{{level}}
- 经验值：{{currentExp}}/{{nextLevelExp}}

## 属性
- 体能：{{attributes.strength}}
- 智力：{{attributes.intelligence}}
- 心灵：{{attributes.spirit}}
- 谋略：{{attributes.strategy}}

## 技能
- 数学：Lv.{{skills.math}}
- 物理：Lv.{{skills.physics}}
- 计算机：Lv.{{skills.computer}}
- 笛子：Lv.{{skills.flute}}

## 资源
- 金币：{{resources.gold}}
- 人脉：{{resources.connections}}
`;

    try {
      // 创建角色文件
      await this.app.vault.create('游戏/角色.md', characterContent);
      new Notice('角色文件创建成功');
    } catch (error) {
      new Notice('创建角色文件失败');
      console.error(error);
    }
  }
}