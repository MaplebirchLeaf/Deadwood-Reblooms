// ./src/module/IncantationCheatCollection.ts

interface CheatItem {
  name: string;
  code: string;
  type: 'twine' | 'javascript';
  favorite?: boolean;
}

class IncantationCheatCollection {
  // 命令库刻意保存在 IndexedDB，跨游戏存档共用；游戏剧情状态仍只存在当前存档的 V 中。
  private cache: CheatItem[] = [];
  private editingName: string | null = null;
  private sortOrder: number = 0;

  public constructor(readonly core: typeof maplebirch) {
    // IndexedDB 事件先于模块 preInit。缓存需在 onInit 渲染作弊集前读完。
    this.core.once(':indexedDB', () => this.core.idb('cheats', { keyPath: 'name' }));
    this.core.once(':idbReady', async () => await this.refreshCache());
  }

  private escapeCode(code: string): string {
    return code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\$/g, '&#36;').replace(/\\\$/g, '&#36;');
  }

  private async refreshCache(): Promise<void> {
    this.cache = await this.core.with('cheats', 'readonly', async tx => {
      const store = tx.objectStore('cheats');
      const items = await store.getAll();
      return items.map((item: CheatItem) => ({ ...item, favorite: Boolean(item.favorite) }));
    });
  }

  private updateContainer(containerId: string, content: string): void {
    if (!containerId) return;
    this.core.SugarCube.Wikifier.wikifyEval(`<<replace "#${containerId}">>${content}<</replace>>`);
  }

  private briefCode(code: string): string {
    return this.escapeCode(code.length > 50 ? code.substring(0, 50) + '...' : code);
  }

  private renderItemContent(item: CheatItem): string {
    const name = JSON.stringify(item.name);
    const favoriteClass = item.favorite ? 'gold' : 'blue';
    const favoriteMark = item.favorite ? '★' : '☆';
    const deleteLink = item.favorite ? '' : ` | <<lanLink '删除' 'capitalize' 'class:red'>><<run maplebirch.get("ICC").deleteForm(${name})>><</lanLink>>`;
    return `
      <span style='float:right'><<lanLink '${favoriteMark}' 'class:${favoriteClass}'>><<run maplebirch.get("ICC").toggleFavorite(${name})>><</lanLink>></span>
      <<lanLink ${name} 'class:strawberry'>><<run maplebirch.get("ICC").updateForm(${name})>><</lanLink>><br>
      <span class='cheat-code' data-type="${item.type === 'javascript' ? 'JS' : 'Twine'}">${this.briefCode(item.code)}</span>
      <<lanLink '执行' 'capitalize' 'class:teal'>><<run maplebirch.get("ICC").executeForm(${name})>><</lanLink>>${deleteLink}
    `;
  }

  private renderItem(item: CheatItem): string {
    const itemId: string = `cheat-item-${this.stringDJB2Hash(item.name)}`;
    return `<div id='${itemId}' class='settingsToggleItem'>${this.renderItemContent(item)}</div>`;
  }

  private renderItems(items: CheatItem[]): string {
    return items.map(item => this.renderItem(item)).join('');
  }

  private sortItems(items: CheatItem[]): CheatItem[] {
    return items.sort((a, b) => {
      if (a.favorite !== b.favorite) return a.favorite ? -1 : 1;
      if (this.sortOrder === 1) return a.name.localeCompare(b.name);
      if (this.sortOrder === 2) return b.name.localeCompare(a.name);
      if (this.sortOrder === 3) return a.type.localeCompare(b.type);
      if (this.sortOrder === 4) return b.type.localeCompare(a.type);
      return 0;
    });
  }

  private showStatus(isSuccess: boolean, english: string, chinese: string): void {
    const statusClass: string = isSuccess ? 'success' : 'error';
    const statusText: string = `<<lanSwitch ${JSON.stringify(english)} ${JSON.stringify(chinese)}>>`;
    this.updateContainer('maplebirch-cheat-status', `<div class="cheat-status ${statusClass} visible">${statusText}</div>`);
    setTimeout(() => this.updateContainer('maplebirch-cheat-status', ''), 3000);
  }

  public get panel(): string {
    T.IncantationCheatCollectionNamebox ??= '';
    T.IncantationCheatCollectionCodebox ??= '';
    let html: string = `<div class='input-row cheat-main-row'>`;
    html += `<span class='gold cheat-label'><<lanSwitch 'NAME' '命名'>></span>`;
    html += `<<textbox '_IncantationCheatCollectionNamebox' _IncantationCheatCollectionNamebox>>`;
    html += `<span class='gold cheat-label'><<lanSwitch 'CODE' '编码'>></span>`;
    html += `<<textbox '_IncantationCheatCollectionCodebox' _IncantationCheatCollectionCodebox>>`;
    html += `<span class='cheat-action-row'>`;
    const isExisting: CheatItem | undefined = this.cache.find(item => item.name === T.IncantationCheatCollectionNamebox);
    if (isExisting) {
      html += `<<lanButton lanSwitch('Modify', '修改') 'capitalize'>><<run maplebirch.get("ICC").modifyForm(_IncantationCheatCollectionNamebox, _IncantationCheatCollectionCodebox)>><</lanButton>>`;
    } else {
      html += `<<lanButton lanSwitch('Create', '创建') 'capitalize'>><<run maplebirch.get("ICC").createForm(_IncantationCheatCollectionNamebox, _IncantationCheatCollectionCodebox)>><</lanButton>>`;
    }
    html += `<<lanButton lanSwitch('Clear', '清除') 'capitalize' 'class:red'>><<run maplebirch.get("ICC").clearForm()>><</lanButton>>`;
    html += `</span>`;
    html += `</div>`;
    return html;
  }

  public get search(): string {
    T.IncantationCheatCollectionSearch ??= '';
    let html: string = `<div class='input-row cheat-search-row'>`;
    html += `<<textbox '_IncantationCheatCollectionSearch' _IncantationCheatCollectionSearch>>`;
    html += `<span class='cheat-search-action-row'>`;
    html += `<<lanButton lanSwitch('Search', '搜索') 'capitalize'>><<run maplebirch.get("ICC").searchForm(_IncantationCheatCollectionSearch)>><</lanButton>>`;
    html += `<<lanButton lanSwitch('Sort', '排序') 'capitalize'>><<run maplebirch.get("ICC").sortForm()>><</lanButton>>`;
    html += `</span>`;
    html += `<span class='cheat-transfer-row'>`;
    html += `<<lanButton lanSwitch('Export', '导出') 'capitalize' 'class:blue'>><<run maplebirch.get("ICC").exportForm()>><</lanButton>>`;
    html += `<<lanButton lanSwitch('Import', '导入') 'capitalize' 'class:teal'>><<run (() => { const input = document.getElementById('cheat-import-file'); if (input) input.click(); })()>><</lanButton>>`;
    html += `</span>`;
    html += `</div>`;
    html += `<input id='cheat-import-file' class='cheat-import-file' type='file' accept='.cheat' hidden onchange='void maplebirch.get("ICC").importFromFileInput(this)'>`;
    return html;
  }

  public get content(): string {
    if (this.cache.length === 0) return '';
    return this.renderItems(this.sortItems([...this.cache]));
  }

  public updateForm(name: string): void {
    if (T.IncantationCheatCollectionNamebox === name) {
      T.IncantationCheatCollectionNamebox = '';
      T.IncantationCheatCollectionCodebox = '';
      this.editingName = null;
    } else {
      const item: CheatItem | undefined = this.cache.find(c => c.name === name);
      if (!item) return;
      T.IncantationCheatCollectionNamebox = item.name;
      T.IncantationCheatCollectionCodebox = item.code;
      this.editingName = item.name;
    }
    this.updateContainer('maplebirch-cheat-panel', this.panel);
  }

  public async createForm(rawName: string, rawCode: string): Promise<boolean> {
    const name: string = rawName?.trim();
    const code: string = rawCode?.trim();
    if (!name || !code) return false;
    if (this.cache.find(c => c.name === name)) return false;
    const type: 'twine' | 'javascript' = code.startsWith('<<') ? 'twine' : 'javascript';
    await this.core.with('cheats', 'readwrite', async tx => {
      const store = tx.objectStore('cheats');
      await store.put({ name: name, code: code, type: type, favorite: false });
    });
    await this.refreshCache();
    T.IncantationCheatCollectionNamebox = T.IncantationCheatCollectionCodebox = '';
    this.editingName = null;
    this.updateContainer('maplebirch-cheat-panel', this.panel);
    this.updateDisplay();
    return true;
  }

  public async modifyForm(rawName: string, rawCode: string): Promise<boolean> {
    const newName: string = rawName?.trim();
    const newCode: string = rawCode?.trim();
    if (!newName || !newCode) return false;
    const oldItem: CheatItem | undefined = this.cache.find(item => item.name === this.editingName);
    if (!oldItem) return false;
    const oldName: string = oldItem.name;
    if (oldName !== newName && this.cache.find(item => item.name === newName)) return false;
    const type: 'twine' | 'javascript' = newCode.startsWith('<<') ? 'twine' : 'javascript';
    await this.core.with('cheats', 'readwrite', async tx => {
      const store = tx.objectStore('cheats');
      await store.delete(oldName);
      await store.put({ name: newName, code: newCode, type: type, favorite: Boolean(oldItem.favorite) });
    });
    await this.refreshCache();
    T.IncantationCheatCollectionNamebox = T.IncantationCheatCollectionCodebox = '';
    this.editingName = null;
    this.updateContainer('maplebirch-cheat-panel', this.panel);
    this.updateDisplay();
    return true;
  }

  public searchForm(rawTerm = ''): void {
    const term: string = rawTerm?.trim().toLowerCase();
    if (!term) {
      this.updateDisplay();
      return;
    }
    let results: CheatItem[] = this.cache.filter(item => item.name.toLowerCase().includes(term) || item.code.toLowerCase().includes(term));
    if (results.length === 0) {
      this.updateContainer('maplebirch-cheat-content', '');
      return;
    }
    this.updateContainer('maplebirch-cheat-content', this.renderItems(this.sortItems(results)));
  }

  public executeForm(name: string): boolean {
    const item: CheatItem | undefined = this.cache.find(c => c.name === name);
    if (!item) return false;
    const result: any = this.core.tool.console.execute(item.type, item.code);
    const isSuccess: boolean = result?.success ?? false;
    this.showStatus(isSuccess, isSuccess ? 'Execution successful' : 'Execution failed', isSuccess ? '执行成功' : '执行失败');
    return isSuccess;
  }

  public async toggleFavorite(name: string): Promise<boolean> {
    const item: CheatItem | undefined = this.cache.find(c => c.name === name);
    if (!item) return false;
    item.favorite = !item.favorite;
    await this.core.with('cheats', 'readwrite', async tx => {
      const store = tx.objectStore('cheats');
      await store.put(item);
    });
    await this.refreshCache();
    this.updateDisplay();
    return true;
  }

  public deleteForm(name: string): void {
    const item: CheatItem | undefined = this.cache.find(c => c.name === name);
    if (!item || item.favorite) return;
    const itemId: string = `cheat-item-${this.stringDJB2Hash(item.name)}`;
    const escapedCode: string = this.briefCode(item.code);
    const nameArg = JSON.stringify(item.name);
    const confirmHtml: string = `
      <span class='red'><<lanSwitch 'Confirm to delete: ' '确认删除：'>>"${item.name}"?</span><br>
      <span class='cheat-code' data-type="${item.type === 'javascript' ? 'JS' : 'Twine'}">${escapedCode}</span>
      <<lanLink '确认' 'capitalize' 'class:teal'>><<run maplebirch.get("ICC").removeForm(${nameArg})>><</lanLink>> | <<lanLink '取消' 'capitalize' 'class:blue'>><<run maplebirch.get("ICC").cancelDelete(${nameArg})>><</lanLink>>
    `;
    this.updateContainer(itemId, confirmHtml);
  }

  public async removeForm(name: string): Promise<boolean> {
    const item: CheatItem | undefined = this.cache.find(c => c.name === name);
    if (!item || item.favorite) return false;
    await this.core.with('cheats', 'readwrite', async tx => {
      const store = tx.objectStore('cheats');
      await store.delete(name);
    });
    await this.refreshCache();
    if (T.IncantationCheatCollectionNamebox === name) T.IncantationCheatCollectionNamebox = T.IncantationCheatCollectionCodebox = '';
    if (this.editingName === name) this.editingName = null;
    this.updateDisplay();
    return true;
  }

  public cancelDelete(name: string): void {
    const item: CheatItem | undefined = this.cache.find(c => c.name === name);
    if (!item) return;
    const itemId: string = `cheat-item-${this.stringDJB2Hash(item.name)}`;
    this.updateContainer(itemId, this.renderItemContent(item));
  }

  public sortForm(): void {
    // 实际排序已由 content → sortItems 完成；此处只轮换模式，不再重复改动缓存。
    this.sortOrder = (this.sortOrder + 1) % 5;
    this.updateDisplay();
  }

  public async exportForm(): Promise<boolean> {
    try {
      await this.refreshCache();
      const items: CheatItem[] = this.cache.map(item => ({ name: item.name, code: item.code, type: item.type, favorite: Boolean(item.favorite) }));
      const now: Date = new Date();
      const MM: string = String(now.getMonth() + 1).padStart(2, '0');
      const DD: string = String(now.getDate()).padStart(2, '0');
      const hh: string = String(now.getHours()).padStart(2, '0');
      const mm: string = String(now.getMinutes()).padStart(2, '0');
      const ss: string = String(now.getSeconds()).padStart(2, '0');
      const datestamp: string = `${now.getFullYear()}${MM}${DD}-${hh}${mm}${ss}`;
      const data: string = window.LZString.compressToBase64(JSON.stringify(items));
      const saveName: string = `IncantationCheatCollection-${datestamp}.cheat`;
      window.saveAs(new Blob([data], { type: 'text/plain;charset=UTF-8' }), saveName);
      this.showStatus(true, 'Export successful', '导出成功');
      return true;
    } catch (err) {
      console.error(err);
      this.showStatus(false, 'Export failed', '导出失败');
      return false;
    }
  }

  public async importFromFileInput(input: HTMLInputElement): Promise<boolean> {
    const file: File | undefined = input.files?.[0];
    input.value = '';
    if (!file || !file.name.toLowerCase().endsWith('.cheat')) return false;
    let importedItems: CheatItem[] = [];
    try {
      const text: string = await file.text();
      const json: string | null = window.LZString.decompressFromBase64(text.trim());
      if (!json) {
        this.showStatus(false, 'Invalid import file', '导入文件格式错误');
        return false;
      }
      const rawItems: unknown = JSON.parse(json);
      if (!Array.isArray(rawItems)) {
        this.showStatus(false, 'Invalid import file', '导入文件格式错误');
        return false;
      }
      // 导入文件不是可信存档；只保留支持的字段并按名称去重，避免覆盖时出现含糊的目标。
      const namesInFile: Set<string> = new Set();
      for (const rawItem of rawItems) {
        const item = rawItem as Record<string, unknown>;
        const name: string = String(item.name ?? '').trim();
        const code: string = String(item.code ?? '').trim();
        if (!name || !code) continue;
        if (namesInFile.has(name)) continue;
        const rawType = item.type;
        const type: 'twine' | 'javascript' = rawType === 'twine' || rawType === 'javascript' ? rawType : code.startsWith('<<') ? 'twine' : 'javascript';
        importedItems.push({ name, code, type, favorite: Boolean(item.favorite) });
        namesInFile.add(name);
      }
    } catch (err) {
      console.error(err);
      this.showStatus(false, 'Invalid import file', '导入文件格式错误');
      return false;
    }
    try {
      await this.core.with('cheats', 'readwrite', async tx => {
        const store = tx.objectStore('cheats');
        await store.clear();
        for (const item of importedItems) {
          await store.put({
            name: item.name,
            code: item.code,
            type: item.type,
            favorite: Boolean(item.favorite)
          });
        }
      });
      await this.refreshCache();
      if (!this.cache.find(item => item.name === T.IncantationCheatCollectionNamebox)) {
        T.IncantationCheatCollectionNamebox = T.IncantationCheatCollectionCodebox = '';
        this.editingName = null;
      }
      T.IncantationCheatCollectionSearch = '';
      this.updateContainer('maplebirch-cheat-panel', this.panel);
      this.updateContainer('maplebirch-cheat-search', this.search);
      this.updateContainer('maplebirch-cheat-content', this.content);
      this.showStatus(true, `Imported ${importedItems.length} codes`, `已导入 ${importedItems.length} 个命令`);
      return true;
    } catch (err) {
      console.error(err);
      this.showStatus(false, 'Import failed', '导入失败');
      return false;
    }
  }

  public clearForm(action?: string): void {
    const removableCount = this.cache.filter(item => !item.favorite).length;
    if (removableCount === 0 && !action) return;
    if (action === 'confirm') {
      void this.confirmClear();
    } else if (action === 'cancel') {
      this.updateContainer('maplebirch-cheat-content', this.content);
    } else {
      const confirmHtml: string = `
        <div class='settingsToggleItem'>
          <span class='red'><<lanSwitch 'Are you sure to clear' '确认清空'>> ${removableCount} <<lanSwitch 'codes' '个命令'>>?</span><br>
          <<lanLink '确认' 'capitalize' 'class:teal'>><<run maplebirch.get("ICC").clearForm('confirm')>>
          <</lanLink>>|<<lanLink '取消' 'capitalize' 'class:blue'>><<run maplebirch.get("ICC").clearForm('cancel')>><</lanLink>>
        </div>
      `;
      this.updateContainer('maplebirch-cheat-content', confirmHtml);
    }
  }

  private async confirmClear(): Promise<void> {
    const removableItems = this.cache.filter(item => !item.favorite);
    await this.core.with('cheats', 'readwrite', async tx => {
      const store = tx.objectStore('cheats');
      for (const item of removableItems) await store.delete(item.name);
    });
    await this.refreshCache();
    if (!this.cache.find(item => item.name === T.IncantationCheatCollectionNamebox)) {
      T.IncantationCheatCollectionNamebox = T.IncantationCheatCollectionCodebox = '';
      this.editingName = null;
    }
    T.IncantationCheatCollectionSearch = '';
    this.updateContainer('maplebirch-cheat-panel', this.panel);
    this.updateContainer('maplebirch-cheat-search', this.search);
    this.updateContainer('maplebirch-cheat-content', this.content);
  }

  private updateDisplay(): void {
    if (T.IncantationCheatCollectionSearch?.trim()) {
      this.searchForm(T.IncantationCheatCollectionSearch);
    } else {
      this.updateContainer('maplebirch-cheat-content', this.content);
    }
  }

  private stringDJB2Hash(str: string): string {
    let hash: number = 5381;
    for (let i: number = 0; i < str.length; i++) hash = (hash * 33) ^ str.charCodeAt(i);
    return (hash >>> 0).toString(16);
  }

  public preInit(): void {
    this.core.tool.onInit(() => {
      setup.maplebirch.content.push(`
        <div id='ConsoleCheat'>
          <details class='cheat-section' open>
            <summary class='cheat-section'><span class='gold'><<lanSwitch 'Cheating Collection' '作弊集'>></span></summary>
            <div id='maplebirch-cheat-panel' class='searchButtons'><<= maplebirch.get("ICC").panel>></div>
            <div id='maplebirch-cheat-search' class='searchButtons'><<= maplebirch.get("ICC").search>></div>
            <div id='maplebirch-cheat-status' class=''></div><div id='maplebirch-cheat-content' class='settingsGrid'><<= maplebirch.get("ICC").content>></div>
          </details>
        </div>
      `);
    });
  }
}

export default IncantationCheatCollection;
