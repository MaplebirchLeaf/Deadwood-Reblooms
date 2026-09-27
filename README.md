[中文](README.md) | [English](README.EN.md)

# 枯木逢春 · Deadwood Reblooms

[![Game](https://img.shields.io/badge/Game-Degrees%20of%20Lewdity-purple)](https://gitgud.io/Vrelnir/degrees-of-lewdity)
[![Framework](https://img.shields.io/badge/Framework-maplebirch-blue)](https://github.com/MaplebirchLeaf/SCML-DOL-maplebirchFramework)
[![Issues](https://img.shields.io/github/issues-raw/MaplebirchLeaf/Deadwood-Reblooms?label=issues)](https://github.com/MaplebirchLeaf/Deadwood-Reblooms/issues)

**枯木逢春**是基于 [秋枫白桦框架](https://github.com/MaplebirchLeaf/SCML-DOL-maplebirchFramework) 的 _Degrees of Lewdity_ 内容模组。它扩展人物路线、校园生活、住宅与金融、转化、遭遇战及游戏界面。各部分作为独立模块管理，玩家可在首次加载时选择启用内容。

---

## 目录

- [安装与前置](#安装与前置)
- [模块与游戏指南](#模块与游戏指南)
- [可选音频包](#可选音频包)
- [相关作品](#相关作品)
- [反馈与相关项目](#反馈与相关项目)

## 安装与前置

1. 准备支持 SugarCube 2 ModLoader 的游戏。当前构建以 **DoL 0.5.12.13** 为目标。
2. 加载 [秋枫白桦框架](https://github.com/MaplebirchLeaf/SCML-DOL-maplebirchFramework)，版本须满足模组包声明的 `maplebirch >= 5.1.0`，并安装模组包所列的其他前置。
3. 从 [Releases](https://github.com/MaplebirchLeaf/Deadwood-Reblooms/releases) 加载 `deadwood-reblooms-*.modpack`。需要动态音乐时，再加载独立的 `deadwood-reblooms-audio-*.modpack`。
4. 首次进入游戏时选择模块。以后可在框架的模块管理中调整，发生更改时按提示重载。

`DR` 是根模块，关闭它会停用所有子模块。检测到功能重叠的外部模组时，首次选择界面会说明来源，并关闭枯木逢春中对应的模块，保留外部模组。角色剧情仍遵循原版的人物关系、地点和日程条件。

## 模块与游戏指南

| 模块                  | 内容                                         |
| --------------------- | -------------------------------------------- |
| `DR`                  | 基础设置、模组指南、服装搜索和模组统计       |
| `SydneyExpansion`     | 悉尼宿舍、西里斯庄园与关系互动               |
| `RobinExpansion`      | 罗宾的摊位、峭壁街饮品店、共同生活与亲密互动 |
| `WhitneyExpansion`    | 地下妓院营救、重逢与后续日常                 |
| `KylarExpansion`      | 凯拉尔庄园留宿与房间互动                     |
| `LS`                  | 免听凭证、风纪委员、学生会长及校园评价       |
| `VP`                  | 属性突破、住宅、银行、证券及其他原版增强     |
| `CA`                  | 日蚀、流星雨与天气画面变化                   |
| `MoreTransformations` | 马与鱼转化及相关地点、装备和特质             |
| `LongerCombat`        | 更长的遭遇战、分阶段对白与体液显示           |
| `MLIANPCA`            | 更多恋人与社交栏小头像                       |
| `NPCSidebarPortrait`  | 场景与侧边栏的 NPC 立绘                      |
| `UCACSD`              | 原版作弊入口与遭遇战数值显示                 |
| `ICC`                 | 可保存、搜索、导入及导出的作弊命令集         |
| `DM`                  | 根据战斗、昼夜、天气与天体异象切换的动态音乐 |

在游戏侧边栏打开**模组提示**，可进入按模块折叠的游戏指南。目录和搜索框可查地点、人物、解锁条件与排查步骤。**角色页 → 统计 → 模组统计**显示当前存档的属性、校园、金融、房产和人物路线进度。人物剧情的下一步仍以游戏日志和实际场景为准。

## 可选音频包

`DM` 的音频和 `dynamic-music.json` 位于独立的音频包中。本体只提供播放调度。安装音频包后，在**模组设置 → 动态音乐**启用，并分别调整音乐与环境声的音量。缺少音频包时，动态音乐不会播放，其他模块可以照常使用。

## 相关作品

枯木逢春的部分功能受以下作品启发。若已安装原模组，可在模块选择界面关闭枯木逢春的对应功能：

- `LongerCombat`：狐千月的[更长遭遇战](https://github.com/emicoto/DOLMods/)。
- `MLIANPCA`：Eudemonism00 的[社交栏小头像](https://github.com/Eudemonism00/DOL-npcicon-mods/)与苯环的[更多恋人](https://github.com/Nephthelana/DoL-More-Love-Interests-Mod)。
- `RobinExpansion`：零环零幻想的[Dom 罗宾](https://github.com/ZeroRing233/Degrees-of-Lewdity-RobinMod)。
- `LS`：丧心的[模拟人生](https://github.com/MissedHeart/Degrees-of-Lewdity-DolSims)。

社交栏头像与场景立绘属于同人创作，不代表游戏官方形象。相关作品和作者也收录在游戏指南中。

## 反馈与相关项目

请在 [Issues](https://github.com/MaplebirchLeaf/Deadwood-Reblooms/issues) 中附上游戏、框架和模组版本，启用模块、发生问题的地点及复现步骤。若问题只在某个游戏分支或汉化组合中出现，也请写明。

- [Degrees of Lewdity](https://gitgud.io/Vrelnir/degrees-of-lewdity)
- [秋枫白桦框架](https://github.com/MaplebirchLeaf/SCML-DOL-maplebirchFramework)
- [DOL Mod Protection Tools](https://github.com/MaplebirchLeaf/Dol-Mod-Protection-Tools)
