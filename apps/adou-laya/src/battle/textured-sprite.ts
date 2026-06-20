// TexturedSprite — a Sprite that draws a single texture with adjustable alpha.
//
// Faithful reconstruction of the original bundle's `O` class
// (reconstruction/reference/bundle.pretty.js lines ~3350-3392). Lazily loads the
// texture, redraws on alpha change, and can use the source texture size.
//
//   url=Jn  texture=tr  width=sr  height=ir  _alpha=hr  setTexture=er  redraw=ar

/* eslint-disable @typescript-eslint/no-explicit-any */

export class TexturedSprite extends Laya.Sprite {
  private _url = "";
  private _texture: any = null;
  private texWidth = 0;
  private texHeight = 0;
  private _useSourceSize = false;
  private _alpha = 1;

  constructor(url: string, width: number, height: number, useSourceSize = false) {
    super();
    this._useSourceSize = useSourceSize;
    this.texWidth = width;
    this.texHeight = height;
    this.setTexture(url);
  }

  /** Set (and lazily load) the texture. (`er`) */
  setTexture(url: string, width?: number, height?: number): void {
    this._url = url;
    if (width !== undefined) this.texWidth = width;
    if (height !== undefined) this.texHeight = height;
    const cached = Laya.loader.getRes(url);
    if (cached) {
      this._texture = cached;
      this.redraw();
      return;
    }
    Laya.loader.load(
      url,
      Laya.Handler.create(this, (tex: any) => {
        if (this._url === url) {
          this._texture = tex;
          this.redraw();
        }
      }),
    );
  }

  get alpha(): number {
    return this._alpha;
  }
  set alpha(v: number) {
    const a = v < 0 ? 0 : v > 1 ? 1 : v;
    if (this._alpha !== a) {
      this._alpha = a;
      this.redraw();
    }
  }

  /** (`ar`) */
  private redraw(): void {
    if (!this._texture) return;
    const w = this._useSourceSize ? this._texture.width : this.texWidth;
    const h = this._useSourceSize ? this._texture.height : this.texHeight;
    this.graphics.clear();
    this.graphics.drawTexture(this._texture, 0, 0, w, h, null, this._alpha);
    this.repaint();
  }
}
