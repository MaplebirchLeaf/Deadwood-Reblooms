import type DeadwoodReblooms from '../DeadwoodReblooms';

class BodyModel {
  /** 渲染角色面板：先渲染光照层，再渲染主体层。 */
  private static async renderBodyModel(manager: DeadwoodReblooms) {
    const container = document.getElementById('deadwood-reblooms-character');
    if (!container) return;

    container.innerHTML = '';
    const originalModelClass = T.modelclass;
    const originalModelOptions = T.modeloptions;

    try {
      BodyModel.appendModelCanvas(container, 'lighting', true, ['deadwood-reblooms-canvas', 'deadwood-reblooms-lighting'], '1');

      T.modelclass = Renderer.locateModel('main', 'panel');
      T.modeloptions = T.modelclass.defaultOptions();
      T.modelclass.reset();
      wikifier('modelprepare-player-body');
      wikifier('modelprepare-player-clothes');
      const mainCanvas = T.modelclass.createCanvas(false);
      if (V.options.sidebarAnimations) T.modelclass.animate(mainCanvas, T.modeloptions, Renderer.defaultListener);
      else T.modelclass.render(mainCanvas, T.modeloptions, Renderer.defaultListener);
      mainCanvas.canvas.classList.add('deadwood-reblooms-canvas', 'deadwood-reblooms-main');
      mainCanvas.canvas.style.zIndex = '2';
      container.appendChild(mainCanvas.canvas);

      BodyModel.adjustCanvasSize(container);
    } catch (error) {
      manager.log('角色渲染错误:', 'ERROR', error);
    } finally {
      T.modelclass = originalModelClass;
      T.modeloptions = originalModelOptions;
    }
  }

  /** 渲染角色底部覆盖层：避孕套数量和防狼喷雾数量。 */
  private static async renderOverlay() {
    const overlay = document.getElementById('deadwood-reblooms-character-overlay');
    if (!overlay) return;

    overlay.innerHTML = '';
    const left = document.createElement('div');
    left.className = 'deadwood-reblooms-overlay-left';
    const right = document.createElement('div');
    right.className = 'deadwood-reblooms-overlay-right';

    if (V.settings.condomLevel >= 1 && V.condoms != null) left.appendChild(BodyModel.condomDisplay());
    if (V.spray != null) right.appendChild(BodyModel.pepperDisplay());

    overlay.append(left, right);
  }

  /** 创建指定模型层的 canvas 并插入容器。 */
  private static appendModelCanvas(container: HTMLElement, layer: 'lighting' | 'main', glow: boolean, classes: string[], zIndex: string) {
    T.modelclass = Renderer.locateModel(layer, 'panel');
    T.modeloptions = T.modelclass.defaultOptions();
    T.modelclass.reset();
    const canvas = T.modelclass.createCanvas(glow);
    T.modelclass.render(canvas, T.modeloptions, Renderer.defaultListener);
    canvas.canvas.classList.add(...classes);
    canvas.canvas.style.zIndex = zIndex;
    container.appendChild(canvas.canvas);
  }

  /** 创建避孕套数量显示。 */
  private static condomDisplay(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'deadwood-reblooms-condom-display';
    container.setAttribute('tooltip', `<span class='meek'><<lanSwitch 'Total condoms: ' '避孕套总数：'>>${V.condoms}</span>`);

    const text = document.createElement('span');
    text.className = 'deadwood-reblooms-condom-count';
    text.textContent = `${V.condoms}x`;
    const image = BodyModel.icon('img/ui/condom.png', 'deadwood-reblooms-condom-icon');

    container.append(text, image);
    return container;
  }

  /** 创建防狼喷雾显示，数量少时显示多个图标，数量多时显示数字。 */
  private static pepperDisplay(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'deadwood-reblooms-pepper-display';
    container.setAttribute('tooltip', `<span class='def'><<lanSwitch 'Pepper sprays: ' '防狼喷雾：'>>${V.spray} / ${V.spraymax}</span>`);

    const showMultiple = (V.options.pepperSprayDisplay === 'sprays' && V.spraymax <= 7) || (V.options.pepperSprayDisplay === 'both' && V.spraymax <= 5);
    if (!showMultiple) {
      const single = document.createElement('div');
      single.className = 'deadwood-reblooms-pepper-single';
      const text = document.createElement('span');
      text.className = 'deadwood-reblooms-pepper-count';
      text.textContent = `${V.spray}x`;
      single.append(text, BodyModel.icon('img/ui/pepper-spray.png', 'deadwood-reblooms-pepper-icon'));
      container.appendChild(single);
      return container;
    }

    const multiple = document.createElement('div');
    multiple.className = 'deadwood-reblooms-pepper-multiple';
    for (let index = 1; index <= V.spraymax; index++) {
      multiple.appendChild(BodyModel.icon(V.spray >= index ? 'img/ui/pepper-spray.png' : 'img/ui/pepper-spray-empty.png', 'deadwood-reblooms-pepper-icon'));
    }
    container.appendChild(multiple);
    return container;
  }

  /** 创建 overlay 用的小图标。 */
  private static icon(src: string, className: string): HTMLImageElement {
    const image = new Image();
    image.draggable = false;
    image.src = src;
    image.className = className;
    return image;
  }

  /** 按容器大小等比缩放所有角色 canvas，并让它们居中叠放。 */
  private static adjustCanvasSize(container: HTMLElement) {
    const canvases = container.querySelectorAll<HTMLCanvasElement>('.deadwood-reblooms-canvas');
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    canvases.forEach(canvas => {
      const originalWidth = canvas.width || canvas.clientWidth;
      const originalHeight = canvas.height || canvas.clientHeight;
      if (!originalWidth || !originalHeight) return;

      const scale = Math.min(containerWidth / originalWidth, containerHeight / originalHeight);
      canvas.style.width = `${originalWidth * scale}px`;
      canvas.style.height = `${originalHeight * scale}px`;
      canvas.style.position = 'absolute';
      canvas.style.top = '50%';
      canvas.style.left = '50%';
      canvas.style.transform = 'translate(-50%, -50%)';
    });
  }

  /** 面板入口：渲染角色模型和覆盖层。 */
  public static async render(manager: DeadwoodReblooms) {
    await BodyModel.renderBodyModel(manager);
    await BodyModel.renderOverlay();
  }
}

export default BodyModel;
