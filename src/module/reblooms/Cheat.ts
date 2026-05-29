// ./src/module/reblooms/Cheat.ts

interface CheatItem {
  name: string;
  code: string;
  type: 'twine' | 'javascript';
  favorite?: boolean;
}

class Cheat {
  private cache: CheatItem[] = [];
  private editingName: string | null = null;
  private sortOrder: number = 0;

  constructor(readonly core: typeof maplebirch) {
    this.core.once(':indexedDB', () => this.core.idb.register('cheats', { keyPath: 'name' }));
    this.core.once(':idbReady', async () => await this.refreshCache());
  }

  private escapeCode(code: string): string {
    return code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\$/g, '&#36;').replace(/\\\$/g, '&#36;');
  }

  private async refreshCache(): Promise<void> {
    this.cache = await this.core.idb.withTransaction(['cheats'], 'readonly', async (tx: any) => {
      const store = tx.objectStore('cheats');
      const items = await store.getAll();
      return items.map((item: CheatItem) => ({ ...item, favorite: Boolean(item.favorite) }));
    });
  }

  private updateContainer(containerId: string, content: string): void {
    if (!containerId) return;
    new this.core.SugarCube.Wikifier(null, `<<replace "#${containerId}">>${content}<</replace>>`);
  }

  private briefCode(code: string): string {
    return this.escapeCode(code.length > 50 ? code.substring(0, 50) + '...' : code);
  }

  private renderItemContent(item: CheatItem): string {
    const name = JSON.stringify(item.name);
    const favoriteClass = item.favorite ? 'gold' : 'blue';
    const favoriteMark = item.favorite ? '★' : '☆';
    const deleteLink = item.favorite ? '' : ` | <<lanLink 'delete' 'capitalize' 'class:red'>><<run maplebirch.rebloom.cheat.deleteForm(${name})>><</lanLink>>`;
    return `
      <span style='float:right'><<lanLink '${favoriteMark}' 'class:${favoriteClass}'>><<run maplebirch.rebloom.cheat.toggleFavorite(${name})>><</lanLink>></span>
      <<lanLink ${name} 'class:strawberry'>><<run maplebirch.rebloom.cheat.updateForm(${name})>><</lanLink>><br>
      <span class='cheat-code' data-type="${item.type === 'javascript' ? 'JS' : 'Twine'}">${this.briefCode(item.code)}</span>
      <<lanLink 'execute' 'capitalize' 'class:teal'>><<run maplebirch.rebloom.cheat.executeForm(${name})>><</lanLink>>${deleteLink}
    `;
  }

  private renderItem(item: CheatItem): string {
    const itemId: string = `cheat-item-${this.stringDJB2Hash(item.name)}`;
    return `
        <div id='${itemId}' class='settingsToggleItem'>
          ${this.renderItemContent(item)}
        </div>`;
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

  private showStatus(isSuccess: boolean): void {
    const statusClass: string = isSuccess ? 'success' : 'error';
    const statusText: string = isSuccess ? '<<lanSwitch "Execution successful" "执行成功">>' : '<<lanSwitch "Execution failed" "执行失败">>';
    this.updateContainer('maplebirch-cheat-status', `<div class="cheat-status ${statusClass} visible">${statusText}</div>`);
    setTimeout(() => this.updateContainer('maplebirch-cheat-status', ''), 3000);
  }

  public get panel(): string {
    T.DeadwoodRebloomsCheatNamebox ??= '';
    T.DeadwoodRebloomsCheatCodebox ??= '';
    let html: string = `<div class='input-row'>`;
    html += `<span class='gold'><<lanSwitch 'NAME' '命名'>></span><<textbox '_DeadwoodRebloomsCheatNamebox' _DeadwoodRebloomsCheatNamebox>>`;
    html += `<span class='gold'><<lanSwitch 'CODE' '编码'>></span><<textbox '_DeadwoodRebloomsCheatCodebox' _DeadwoodRebloomsCheatCodebox>>`;
    const isExisting: CheatItem | undefined = this.cache.find(item => item.name === T.DeadwoodRebloomsCheatNamebox);
    if (isExisting) {
      html += `<<lanButton 'modify' 'capitalize'>><<run maplebirch.rebloom.cheat.modifyForm(_DeadwoodRebloomsCheatNamebox, _DeadwoodRebloomsCheatCodebox)>><</lanButton>>`;
    } else {
      html += `<<lanButton 'create' 'capitalize'>><<run maplebirch.rebloom.cheat.createForm(_DeadwoodRebloomsCheatNamebox, _DeadwoodRebloomsCheatCodebox)>><</lanButton>>`;
    }
    html += `</div>`;
    return html;
  }

  public get search(): string {
    T.DeadwoodRebloomsCheatSearch ??= '';
    let html: string = `<div class='input-row'><<textbox '_DeadwoodRebloomsCheatSearch' _DeadwoodRebloomsCheatSearch>>`;
    html += `<<lanButton 'search' 'capitalize'>><<run maplebirch.rebloom.cheat.searchForm(_DeadwoodRebloomsCheatSearch)>><</lanButton>>`;
    html += `<<lanButton 'sort' 'capitalize'>><<run maplebirch.rebloom.cheat.sortForm()>><</lanButton>>`;
    html += `<<lanButton 'clear' 'capitalize' 'class:red'>><<run maplebirch.rebloom.cheat.clearForm()>><</lanButton>>`;
    html += `</div>`;
    return html;
  }

  public get content(): string {
    if (this.cache.length === 0) return '';
    return this.renderItems(this.sortItems([...this.cache]));
  }

  public updateForm(name: string): void {
    if (T.DeadwoodRebloomsCheatNamebox === name) {
      T.DeadwoodRebloomsCheatNamebox = '';
      T.DeadwoodRebloomsCheatCodebox = '';
      this.editingName = null;
    } else {
      const item: CheatItem | undefined = this.cache.find(c => c.name === name);
      if (!item) return;
      T.DeadwoodRebloomsCheatNamebox = item.name;
      T.DeadwoodRebloomsCheatCodebox = item.code;
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
    await this.core.idb.withTransaction(['cheats'], 'readwrite', async (tx: any) => {
      const store = tx.objectStore('cheats');
      await store.put({ name: name, code: code, type: type, favorite: false });
    });
    await this.refreshCache();
    T.DeadwoodRebloomsCheatNamebox = T.DeadwoodRebloomsCheatCodebox = '';
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
    if (oldName !== newName) {
      if (this.cache.find(item => item.name === newName)) return false;
    }
    const type: 'twine' | 'javascript' = newCode.startsWith('<<') ? 'twine' : 'javascript';
    await this.core.idb.withTransaction(['cheats'], 'readwrite', async (tx: any) => {
      const store = tx.objectStore('cheats');
      await store.delete(oldName);
      await store.put({ name: newName, code: newCode, type: type, favorite: Boolean(oldItem.favorite) });
    });
    await this.refreshCache();
    T.DeadwoodRebloomsCheatNamebox = T.DeadwoodRebloomsCheatCodebox = '';
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

  public async executeForm(name: string): Promise<boolean> {
    const item: CheatItem | undefined = this.cache.find(c => c.name === name);
    if (!item) return false;
    const result: any = this.core.tool.console.execute(item.type, item.code);
    const isSuccess: boolean = result?.success ?? false;
    this.showStatus(isSuccess);
    if (isSuccess) {
      try {
        await this.core.idb.withTransaction(['cheats'], 'readwrite', async (tx: any) => {
          const store = tx.objectStore('cheats');
          await store.put(item);
        });
      } catch (err) {}
    }
    return isSuccess;
  }

  public async toggleFavorite(name: string): Promise<boolean> {
    const item: CheatItem | undefined = this.cache.find(c => c.name === name);
    if (!item) return false;
    item.favorite = !item.favorite;
    await this.core.idb.withTransaction(['cheats'], 'readwrite', async (tx: any) => {
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
        <<lanLink 'confirm' 'capitalize' 'class:teal'>><<run maplebirch.rebloom.cheat.removeForm(${nameArg})>><</lanLink>> | <<lanLink 'cancel' 'capitalize' 'class:blue'>><<run maplebirch.rebloom.cheat.cancelDelete(${nameArg})>><</lanLink>>
      `;
    this.updateContainer(itemId, confirmHtml);
  }

  public async removeForm(name: string): Promise<boolean> {
    const item: CheatItem | undefined = this.cache.find(c => c.name === name);
    if (!item || item.favorite) return false;
    await this.core.idb.withTransaction(['cheats'], 'readwrite', async (tx: any) => {
      const store = tx.objectStore('cheats');
      await store.delete(name);
    });
    await this.refreshCache();
    if (T.DeadwoodRebloomsCheatNamebox === name) T.DeadwoodRebloomsCheatNamebox = T.DeadwoodRebloomsCheatCodebox = '';
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
    this.sortOrder = (this.sortOrder + 1) % 5;
    if (this.sortOrder === 0) {
      void this.refreshCache().then(() => this.updateDisplay());
    } else if (this.sortOrder === 1) {
      this.cache.sort((a, b) => a.name.localeCompare(b.name));
      this.updateDisplay();
    } else if (this.sortOrder === 2) {
      this.cache.sort((a, b) => b.name.localeCompare(a.name));
      this.updateDisplay();
    } else if (this.sortOrder === 3) {
      this.cache.sort((a, b) => a.type.localeCompare(b.type));
      this.updateDisplay();
    } else if (this.sortOrder === 4) {
      this.cache.sort((a, b) => b.type.localeCompare(a.type));
      this.updateDisplay();
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
          <<lanLink 'confirm' 'capitalize' 'class:teal'>><<run maplebirch.rebloom.cheat.clearForm('confirm')>>
          <</lanLink>>|<<lanLink 'cancel' 'capitalize' 'class:blue'>><<run maplebirch.rebloom.cheat.clearForm('cancel')>><</lanLink>>
        </div>`;
      this.updateContainer('maplebirch-cheat-content', confirmHtml);
    }
  }

  private async confirmClear(): Promise<void> {
    const removableItems = this.cache.filter(item => !item.favorite);
    await this.core.idb.withTransaction(['cheats'], 'readwrite', async (tx: any) => {
      const store = tx.objectStore('cheats');
      for (const item of removableItems) await store.delete(item.name);
    });
    await this.refreshCache();
    if (!this.cache.find(item => item.name === T.DeadwoodRebloomsCheatNamebox)) {
      T.DeadwoodRebloomsCheatNamebox = T.DeadwoodRebloomsCheatCodebox = '';
      this.editingName = null;
    }
    T.DeadwoodRebloomsCheatSearch = '';
    this.updateContainer('maplebirch-cheat-panel', this.panel);
    this.updateContainer('maplebirch-cheat-search', this.search);
    this.updateContainer('maplebirch-cheat-content', this.content);
  }

  private updateDisplay(): void {
    if (T.DeadwoodRebloomsCheatSearch?.trim()) {
      this.searchForm(T.DeadwoodRebloomsCheatSearch);
    } else {
      this.updateContainer('maplebirch-cheat-content', this.content);
    }
  }

  private stringDJB2Hash(str: string): string {
    let hash: number = 5381;
    for (let i: number = 0; i < str.length; i++) hash = (hash * 33) ^ str.charCodeAt(i);
    return (hash >>> 0).toString(16);
  }
}

export default Cheat;
