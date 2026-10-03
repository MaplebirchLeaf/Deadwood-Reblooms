[中文](README.md) | [English](README.EN.md)

# 枯木逢春 · Deadwood Reblooms

[![Game](https://img.shields.io/badge/Game-Degrees%20of%20Lewdity-purple)](https://gitgud.io/Vrelnir/degrees-of-lewdity)
[![Framework](https://img.shields.io/badge/Framework-maplebirch-blue)](https://github.com/MaplebirchLeaf/SCML-DOL-maplebirchFramework)
[![Issues](https://img.shields.io/github/issues-raw/MaplebirchLeaf/Deadwood-Reblooms?label=issues)](https://github.com/MaplebirchLeaf/Deadwood-Reblooms/issues)

**枯木逢春**是基于 [秋枫白桦框架](https://github.com/MaplebirchLeaf/SCML-DOL-maplebirchFramework) 的 _Degrees of Lewdity_ 内容模组。它扩展人物路线、校园生活、住宅与金融、转化、遭遇战及游戏界面。各部分作为独立模块在框架中管理。

---

## 目录

- [安装与前置](#安装与前置)
- [模块与游戏指南](#模块与游戏指南)
- [可选音频包](#可选音频包)
- [致谢与素材来源](#致谢与素材来源)
- [反馈与相关项目](#反馈与相关项目)

## 安装与前置

1. 准备支持 SugarCube 2 ModLoader 的 **DoL 0.5.12.13**。
2. 加载 [秋枫白桦框架](https://github.com/MaplebirchLeaf/SCML-DOL-maplebirchFramework)，版本须满足模组包声明的 `maplebirch >= 5.2.2`，并安装模组包所列的其他前置。
3. 从 [Releases](https://github.com/MaplebirchLeaf/Deadwood-Reblooms/releases) 加载 `deadwood-reblooms-*.modpack`。需要动态音乐时，再加载对应的 `deadwood-reblooms-audio-*.modpack`。
4. 需要调整模块时，在框架的模块管理中启用或关闭，并按提示重载。

`DeadwoodReblooms` 是根模块，关闭它会停用所有子模块。检测到功能重叠的外部模组时，枯木逢春会关闭自身对应模块，保留外部模组。角色剧情仍遵循原版的人物关系、地点和日程条件。

当前版本为 **1.3.0**，完整改动见[更新说明](.github/release-notes/v1.3.0.md)。新增果园、埃利斯与金融中心职业内容，并整理校园日程、战斗、服装和药效结算。

## 模块与游戏指南

| 模块                                | 内容                                           |
| ----------------------------------- | ---------------------------------------------- |
| `DeadwoodReblooms`                  | 基础设置、模组指南、服装搜索和模组统计         |
| `Sydney`                            | 悉尼宿舍、西里斯庄园与关系互动                 |
| `Robin`                             | 罗宾的摊位、峭壁街饮品店、共同生活与亲密互动   |
| `Whitney`                           | 地下妓院营救、重逢与后续日常                   |
| `Kylar`                             | 凯拉尔庄园留宿与房间互动                       |
| `LifeSimulation`                    | 免听凭证、风纪委员、学生会长、校园评价及健身房 |
| `Orchard`                           | 神殿与农场果园、果树照料、逐步开垦与雇工       |
| `VanillaPlus`                       | 属性突破、住宅、金融中心、银行与证券           |
| `CelestialAnomalies`                | 日蚀、流星雨与天气画面变化                     |
| `MoreTransformations`               | 马、鱼与渡鸦转化及相关地点、装备和特质         |
| `LongerCombat`                      | 更长的遭遇战、分阶段对白与体液显示             |
| `MoreLoveInterestsAndNPCAvatars`    | 更多恋人与社交栏小头像                         |
| `NPCSidebarPortrait`                | 场景与侧边栏的 NPC 立绘                        |
| `UnLockCheatAndCombatStatusDisplay` | 原版作弊入口与遭遇战数值显示                   |
| `IncantationCheatCollection`        | 可保存、搜索、导入及导出的作弊命令集           |
| `DynamicMusic`                      | 根据战斗、昼夜、天气与天体异象切换的动态音乐   |

在游戏侧边栏打开**模组提示**，可进入按模块排列的单页游戏指南。搜索框可查地点、人物、解锁条件与排查步骤。**角色页 → 统计 → 模组统计**显示当前存档的属性、校园、金融、房产和人物路线进度。人物剧情的下一步仍以游戏日志和实际场景为准。

### 目录中的模块开关

游戏指南目录将章节跳转与模块复选框放在同一项中。复选框共用框架模块管理的设置，依赖模块随父子关系一起调整。修改后显示待重载列表，先保存游戏，再点击「立即重载」。已发生的剧情与当前存档进度不会因关闭模块而回滚。动态音乐等存档内选项仍在模组设置中调整。

## 可选音频包

`DynamicMusic` 的音频和 `dynamic-music.json` 位于独立的音频包中。本体只提供播放调度。安装音频包后，在**模组设置 → 动态音乐**启用，并分别调整音乐与环境声的音量。缺少音频包时，动态音乐不会播放，其他模块可以照常使用。

## 致谢与素材来源

感谢以下作者的作品与协助。若已安装功能相近的原模组，枯木逢春会关闭自身对应功能：

- `LongerCombat`：狐千月的[更长遭遇战](https://github.com/emicoto/DOLMods/)。
- `MoreLoveInterestsAndNPCAvatars`：Eudemonism00 的[社交栏小头像](https://github.com/Eudemonism00/DOL-npcicon-mods/)与苯环的[更多恋人](https://github.com/Nephthelana/DoL-More-Love-Interests-Mod)。
- `Robin`：零环零幻想的[Dom 罗宾](https://github.com/ZeroRing233/Degrees-of-Lewdity-RobinMod)。
- `LifeSimulation`：丧心的[模拟人生](https://github.com/MissedHeart/Degrees-of-Lewdity-DolSims)。
- 马转化贴图：元夕。

动态音乐使用 Kresiek The Furry、Augmentality（Brandon Morris）、AdoTheLimey、primbal、Breviceps、Joth、TinyWorlds、isaiah658、SketchMan3 和 rubberduck 的 CC0 音频。逐曲来源见[音频素材记录](audio-pack/audio/CREDITS.md)。也感谢所有提供建议、测试反馈与帮助的朋友。

社交栏头像与场景立绘属于同人创作，不代表游戏官方形象。作者与素材来源也收录在游戏指南中。

## 反馈与相关项目

请在 [Issues](https://github.com/MaplebirchLeaf/Deadwood-Reblooms/issues) 中附上游戏、框架和模组版本，启用模块、发生问题的地点及复现步骤。若问题只在某个游戏分支或汉化组合中出现，也请写明。

- [Degrees of Lewdity](https://gitgud.io/Vrelnir/degrees-of-lewdity)
- [秋枫白桦框架](https://github.com/MaplebirchLeaf/SCML-DOL-maplebirchFramework)
