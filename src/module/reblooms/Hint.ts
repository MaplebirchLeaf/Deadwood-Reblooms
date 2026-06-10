// ./src/module/reblooms/Hint.ts

class Hint {
  readonly log: ReturnType<typeof maplebirch.tool.createlog>;

  constructor(logger: ReturnType<typeof maplebirch.tool.createlog>) {
    this.log = logger;
  }

  public hintClicked() {
    $.wiki('<<maplebirchReplace "DeadwoodRebloomsHint" "title">>');
    void maplebirch.trigger('characterRender');
  }

  public searchButtonClicked() {
    this.clearButtonClicked();

    const value = T.DeadwoodRebloomsHintTextbox;
    if (!value || value.trim() === '') return;

    const keyword = value.trim();
    const contentEl = document.getElementById('DeadwoodRebloomsHintContent');
    if (!contentEl) return;

    const regex = new RegExp(`(${keyword})`, 'gi');
    const originalHtml = contentEl.innerHTML;

    contentEl.innerHTML = originalHtml.replace(regex, (match: string) => `<span class='gold searchResult'>${match}</span>`);

    const results = contentEl.getElementsByClassName('searchResult');
    if (results.length > 0) {
      results[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      const noResultEl = document.createElement('div');
      noResultEl.style.color = 'gold';
      noResultEl.style.marginTop = '10px';
      noResultEl.id = 'noSearchResult';
      noResultEl.textContent = '无结果';

      contentEl.parentNode?.insertBefore(noResultEl, contentEl);
    }
  }

  public clearButtonClicked() {
    const noResultEl = document.getElementById('noSearchResult');
    if (noResultEl) noResultEl.remove();

    const contentEl = document.getElementById('DeadwoodRebloomsHintContent');
    if (contentEl) {
      const results = contentEl.querySelectorAll('.searchResult');
      results.forEach(el => {
        const parent = el.parentNode as ParentNode;
        while (el.firstChild) parent.insertBefore(el.firstChild, el);
        parent.removeChild(el);
      });
    }
  }
}

export default Hint;
