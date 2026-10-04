// ./src/module/Guide.ts

interface GuideSection {
  id: string;
  title: string;
  content: string;
  module?: string;
}

class GuideView {
  constructor(
    private readonly textbox: HTMLInputElement,
    private readonly content: HTMLElement,
    private readonly core: typeof maplebirch
  ) {
    this.content.addEventListener('click', event => {
      if (!(event.target instanceof Element)) return;
      if (event.target.closest('[data-guide-reload]')) {
        event.preventDefault();
        location.reload();
        return;
      }
      const target = event.target as HTMLElement;
      const link = target.closest<HTMLAnchorElement>('a[data-guide-target]');
      if (!link) return;
      const section = document.getElementById(link.dataset.guideTarget || '');
      if (!section) return;
      event.preventDefault();
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    this.content.addEventListener('change', event => {
      const checkbox = event.target;
      if (checkbox instanceof HTMLInputElement && checkbox.matches('[data-guide-module]') && !checkbox.disabled) void this.toggle(checkbox);
    });
    this.refresh();
  }

  private refresh(): void {
    const gui = this.core.services.gui;
    const enabled = new Set(gui.enabledModules.map(module => module.name));
    const modules = [...gui.enabledModules, ...gui.disabledModules];
    for (const checkbox of this.content.querySelectorAll<HTMLInputElement>('[data-guide-module]')) {
      const module = modules.find(item => item.name === checkbox.dataset.guideModule);
      checkbox.disabled = !module || module.protected || (module.type === 'exposed' && !module.lifecycle);
      checkbox.checked = enabled.has(checkbox.dataset.guideModule || '');
      checkbox.title = !module ? lanSwitch('Unavailable', '未载入') : '';
    }
    const graph = this.core.services.modules.dependencyGraph;
    const pending = modules.filter(module => enabled.has(module.name) !== (graph[module.name]?.state !== 'DISABLED'));
    for (const [index, status] of [...this.content.querySelectorAll<HTMLElement>('[data-guide-status]')].entries()) {
      status.replaceChildren();
      const visible = index === 0 && pending.length > 0;
      status.classList.toggle('settingsToggleItemWide', visible);
      status.hidden = !visible;
      if (!visible) continue;
      const text = document.createElement('span');
      text.textContent = lanSwitch('Reload required: ', '待重载：') + pending.map(module => module.name).join(', ');
      const reload = document.createElement('a');
      reload.href = '#';
      reload.className = 'teal';
      reload.dataset.guideReload = '';
      reload.textContent = lanSwitch('Reload now', '立即重载');
      status.append(text, document.createTextNode(' '), reload);
    }
  }

  private async toggle(checkbox: HTMLInputElement): Promise<void> {
    const gui = this.core.services.gui;
    const name = checkbox.dataset.guideModule!;
    const enabled = checkbox.checked;
    const affected = gui.cascadeModules(enabled ? 'enable' : 'disable', name, { enabled: gui.enabledModules, disabled: gui.disabledModules });
    const checkboxes = [...this.content.querySelectorAll<HTMLInputElement>('[data-guide-module]')];
    checkboxes.forEach(item => (item.disabled = true));
    try {
      await gui.setModuleStates(Object.fromEntries(affected.map(module => [module, enabled])));
      this.refresh();
    } catch (error) {
      this.refresh();
      const status = this.content.querySelector<HTMLElement>('[data-guide-status]');
      if (status) {
        status.hidden = false;
        status.classList.add('settingsToggleItemWide');
        const message = document.createElement('span');
        message.className = 'red';
        message.textContent = lanSwitch('Could not save module settings. ', '模块开关保存失败。') + (error instanceof Error ? error.message : String(error));
        status.append(message);
      }
    }
  }

  public search() {
    this.clear();
    const keyword = this.textbox.value.trim();
    if (!keyword) return;
    const regex = new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    // 只高亮文字节点。改写整段 innerHTML 会误中标签属性，也会销毁内容里的事件监听器。
    const walker = document.createTreeWalker(this.content, NodeFilter.SHOW_TEXT);
    const nodes: Text[] = [];
    while (walker.nextNode()) {
      const node = walker.currentNode as Text;
      if (node.parentElement && !['SCRIPT', 'STYLE'].includes(node.parentElement.tagName) && !node.parentElement.closest('nav, button, [data-guide-status]')) nodes.push(node);
    }
    for (const node of nodes) {
      const source = node.data;
      const matches = [...source.matchAll(regex)];
      if (matches.length === 0) continue;
      const fragment = document.createDocumentFragment();
      let offset = 0;
      for (const match of matches) {
        const start = match.index;
        fragment.append(document.createTextNode(source.slice(offset, start)));
        const highlight = document.createElement('span');
        highlight.className = 'gold searchResult';
        highlight.textContent = match[0];
        fragment.append(highlight);
        offset = start + match[0].length;
      }
      fragment.append(document.createTextNode(source.slice(offset)));
      node.replaceWith(fragment);
    }
    const result = this.content.querySelector('.searchResult');
    if (result) {
      result.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    const noResult = document.createElement('div');
    noResult.className = 'gold noSearchResult';
    noResult.textContent = lanSwitch('No results', '无结果');
    this.content.before(noResult);
  }

  public clear() {
    this.content.parentElement?.querySelector('.noSearchResult')?.remove();
    this.content.querySelectorAll('.searchResult').forEach(element => element.replaceWith(...element.childNodes));
  }
}

export default class Guide {
  private readonly groups = new Map<string, () => readonly GuideSection[]>();

  public constructor(private readonly core: typeof maplebirch) {}

  public add(id: string, sections: () => readonly GuideSection[]): void {
    this.groups.set(id, sections);
  }

  public bind(textbox: HTMLInputElement, content: HTMLElement): GuideView {
    return new GuideView(textbox, content, this.core);
  }

  public render(id: string, intro: string, sections: readonly GuideSection[]): string {
    const scoped = (prefix: string, sections: readonly GuideSection[]): GuideSection[] => sections.map(section => ({ ...section, id: `${prefix}-${section.id}` }));
    const entries = scoped(id, sections);
    const extra = [...this.groups].flatMap(([prefix, sections]) => scoped(prefix, sections()));
    const credits = sections.findIndex(section => section.id === 'Credits');
    entries.splice(credits < 0 ? entries.length : credits, 0, ...extra);
    const escape = (text: string): string => text.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!);
    const markdown = (text: string): string => {
      const rendered = this.core.marked.parse(text);
      return typeof rendered === 'string' ? rendered : '';
    };
    const target = (section: GuideSection): string => escape(section.id);
    const contents = entries
      .map(
        section =>
          `<div class='settingsToggleItem' style='display:flex;align-items:center;gap:.5em'><a href='#${target(section)}' data-guide-target='${target(section)}' style='min-width:0;overflow-wrap:anywhere'>${escape(section.title)}</a>${section.module ? `<input type='checkbox' data-guide-module='${escape(section.module)}' aria-label='${escape(section.title)}' style='margin-left:auto;flex-shrink:0' disabled>` : ''}</div>`
      )
      .join('');
    const body = entries.map(section => `<section id='${target(section)}'><h2><span class='gold'>${escape(section.title)}</span></h2>${markdown(section.content)}</section>`).join('<br>');
    return `${markdown(intro)}<nav aria-label='${lanSwitch('Guide contents', '指南目录')}'><div class='settingsGrid'>${contents}<div data-guide-status role='status' aria-live='polite' hidden></div></div></nav><br>${body}`;
  }
}
