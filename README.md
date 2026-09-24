# Deadwood Reblooms

基于秋枫白桦框架开发的 _Degrees of Lewdity_ 模组拓展项目。

> 当前仍处于 `1.0.0` 前的开发阶段，README、功能和存档结构尚未定稿。

## 模块管理

本模组使用秋枫白桦框架的模块管理。`DR` 是根模块，关闭后会同时停用本模组提供的全部子模块；其余模块可以按功能单独关闭，重载后生效：

- `UCACSD`：作弊按钮解锁与战斗状态显示
- `LongerCombat`：更长遭遇战
- `MLIANPCA`：更多恋人与 NPC 社交栏小头像
- `ICC`：言灵作弊集
- `CA`：日蚀与流星雨等天体异象
- `MoreTransformations`：更多转化
- `NPCSidebarPortrait`：NPC 侧边栏立绘扩展
- `VP`：原版增强
- `DM`：随昼夜、天气、天体异象与遭遇场景切换的动态环境音（功能选项默认关闭）

动态环境音需要同时安装构建产物中的 `deadwood-reblooms-audio-*.mod.zip`。主模组不再内置音频；缺少可选音频包时，`DM` 会保持静音，其余模块不受影响。

静态脚本补丁会在运行时再次确认对应模块处于启用状态，因此关闭模块后不会仅因旧存档仍保留相关数据而继续生效。

## 友情支持与致谢

本项目对以下模组的功能与内容进行了重构整合：

- **更多恋人系统**：苯环的 [Nephthelana/DoL-More-Love-Interests-Mod](https://github.com/Nephthelana/DoL-More-Love-Interests-Mod)
- <img src="public/img/misc/icon/bonus/wip.png" alt="WIP" width="30" height="30"> **NPC 社交栏头像**：Eudemonism00 的 [Eudemonism00/DOL-NPC-Avatars-Mod](https://github.com/Eudemonism00/DOL-NPC-Avatars-Mod)

NPC 头像为原模组作者创作的同人形象，并非游戏官方设定，请勿将其视为角色的官方形象。

## 开发中的内容

- 角色身体与携具面板
- 可配置物品及携带系统
- 角色特质与变身扩展
- 不限数量的恋人管理
- 根据角色状态变化的 NPC 社交栏头像
- 更长遭遇战：延续原版高潮结算，按接触落点记录 PC 射精、口交中的 PC 爱液与 NPC 自身高潮的体液，并沾染对应的相邻部位，不随时间自动扩散。框架按部位保存 `[goo, semen]`，爱液与精液各为 `0～5` 的等级，渲染时合计，不是样本数量。PC 干高潮不会算作射精，目前共用框架的原版体液素材。`penis` 只记录数据，原版侧边栏没有独立阴茎体液图层。

本地开发的类型依赖指向相邻的 `../SCML-DOL-maplebirchFramework/packages/types`，无需发布类型包。TypeScript 保留链接路径，使 SugarCube 类型扩展在本项目中解析；游戏中需加载本地构建的 `maplebirch >=4.3.6`。

延续对白按完成轮数分为前期、中期和后期，自愿与强迫使用独立的句子池。有限遭遇按设定上限三等分；以 10 轮为例，1～3 轮为前期、4～6 轮为中期、7 轮起为后期。无限模式固定以 10 轮作为分段基准，进入后期后继续随机，不循环回前期。每个 NPC 独立避免连续重复同一句，新遭遇会清空上一句记录；分支仍由原版自愿状态决定，不随轮数转为自愿。

扩充对白使用 `public/translations/CN.yaml` 和 `EN.yaml` 的 `deadwood-reblooms.LongerCombat.npc.{m|f}.{consensual|forced}.{adult|collegestudent}.{early|middle|late}.{编号}`。性别取当前战斗槽的 `npc.gender`：`m` 只用男池，`f` 只用女池，`h` 依次输出可用的男组和女组；未知性别不添加对白。不根据玩家性别、NPC 代词或部位动作猜测。每个 NPC 的男女通用句和专属前句分别记录上一句，不互相覆盖。`npc.adult === 1` 使用 `adult`，其余使用 `collegestudent`；该标记只选择句子池，明确 `age < 18` 时仍不添加延续对白。每个池从 `0` 连续编号，不要跳号，代码没有固定的句子条数；称谓沿用 NPC 代词。

`h` 每组的专属前句与通用句保持同一性别，自愿状态、年龄分组和阶段按该 NPC 当次状态统一选择。两组都有正文时，用“顿了顿”“缓了口气”或“稍作停顿”的随机叙述衔接；缺一组时只显示另一组，不留下空引号或衔接句。多人先输出完整的一位 NPC 段落，再用“而某某这边”等带姓名的过渡转向下一位，中文优先使用当前战斗槽的 `fullDescription_CN`。无文本的槽直接跳过，接触描述每位只输出一次。CN/EN YAML 的 `deadwood-reblooms.LongerCombat.npc.pause.*` 与 `npc.transition.*` 分别维护两组对白间和多人间的随机衔接，编号从 0 连续递增；多人模板用 `{name}` 放置姓名，衔接保持在对白引号外。

命名 NPC 的专属句是对应性别通用句前的可选引子，约有 60% 的概率出现，两句共用一对引号和一次“说道”，不另加尾句。支持 Robin、Sydney、Kylar、Whitney、Gwylan、Eden、Great Hawk、Black Wolf、Alex 和 Avery 的独立男女、自愿/强迫三阶段引子，译文可逐步补全；Sydney 按 `C.npc.Sydney.corruption >= 10` 区分 `corrupt` 与 `pure`。

专属句使用 `deadwood-reblooms.LongerCombat.npc.named.{原版英文名}.{m|f}.{consensual|forced}.{early|middle|late}.{编号}`，Sydney 的名字位置为 `Sydney.pure` 或 `Sydney.corrupt`。专属句和通用句使用相同的 NPC 性别、自愿状态及阶段，专属句不再按 `adult` 分组。每个阶段从 `0` 连续追加中英文句子即可。专属句与通用句分别避免连续重复，省略引子不会清空它的上一句记录；战斗槽换人和新遭遇不会继承上一人的记录。专属池缺失时只显示通用句，选中的通用池缺失时不单独输出引子，也不回退到另一性别、另一分组或旧格式池。

Great Hawk 仅在当前战斗槽为 `harpy` 时使用对白，Black Wolf 仅在 `wolfboy`/`wolfgirl` 时使用对白；不根据全局拟人化选项猜测形态，不修改原版设置，动物形态不输出这些对白。
