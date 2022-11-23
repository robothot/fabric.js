import { fabric } from '../../HEADER';
import { Point } from '../point.class';
import { FabricObject } from '../shapes/fabricObject.class';
import { getRandomInt } from '../util/internals';
import { Canvas, Rect } from '../__types__';
import { BaseBrush } from './base_brush.class';

/**
 * @todo remove transient
 */
const { Group, Rect } = fabric;

export type SprayBrushPoint = {
  x: number;
  y: number;
  width: number;
  opacity: number;
};

/**
 *
 * @param rects
 * @returns
 */
function getUniqueRects(rects: Rect[]) {
  const uniqueRects: Record<string, boolean> = {};
  const uniqueRectsArray: Rect[] = [];

  for (let i = 0, key: string; i < rects.length; i++) {
    key = `${rects[i].left}${rects[i].top}`;
    if (!uniqueRects[key]) {
      uniqueRects[key] = true;
      uniqueRectsArray.push(rects[i]);
    }
  }

  return uniqueRectsArray;
}

export class SprayBrush extends BaseBrush<FabricObject> {
  /**
   * Width of a spray
   * @type Number
   * @default
   */
  width = 10;

  /**
   * Density of a spray (number of dots per chunk)
   * @type Number
   * @default
   */
  density = 20;

  /**
   * Width of spray dots
   * @type Number
   * @default
   */
  dotWidth = 1;

  /**
   * Width variance of spray dots
   * @type Number
   * @default
   */
  dotWidthVariance = 1;

  /**
   * Whether opacity of a dot should be random
   * @type Boolean
   * @default
   */
  randomOpacity = false;

  /**
   * Whether overlapping dots (rectangles) should be removed (for performance reasons)
   * @type Boolean
   * @default
   */
  optimizeOverlapping = true;

  private sprayChunks: SprayBrushPoint[][];

  private sprayChunk: SprayBrushPoint[];

  /**
   * Constructor
   * @param {Canvas} canvas
   * @return {SprayBrush} Instance of a spray brush
   */
  constructor(canvas: Canvas) {
    super(canvas);
    this.sprayChunks = [];
    this.sprayChunk = [];
  }

  _setBrushStyles(ctx: CanvasRenderingContext2D = this.canvas.contextTop) {
    super._setBrushStyles(ctx);
    ctx.fillStyle = this.color;
  }

  protected finalizeShape() {
    const rects = [];
    for (let i = 0; i < this.sprayChunks.length; i++) {
      const sprayChunk = this.sprayChunks[i];
      for (let j = 0; j < sprayChunk.length; j++) {
        const chunk = sprayChunk[j];
        const rect = new Rect({
          width: chunk.width,
          height: chunk.width,
          left: chunk.x + 1,
          top: chunk.y + 1,
          originX: 'center',
          originY: 'center',
          fill: this.color,
        });
        rects.push(rect);
      }
    }
    return new Group(this.optimizeOverlapping ? getUniqueRects(rects) : rects, {
      objectCaching: true,
      layout: 'fixed',
      subTargetCheck: false,
      interactive: false,
    });
  }

  /**
   * Invoked on mouse down
   * @param {Point} pointer
   */
  onMouseDown(pointer: Point) {
    this.sprayChunks = [];
    this.canvas.clearContext(this.canvas.contextTop);
    this._setBrushStyles();
    this._setShadow();
    this.addSprayChunk(pointer);
    this.renderChunk(this.sprayChunk);
  }

  /**
   * Invoked on mouse move
   * @param {Point} pointer
   */
  onMouseMove(pointer: Point) {
    if (this.limitedToCanvasSize === true && this._isOutSideCanvas(pointer)) {
      return;
    }
    this.addSprayChunk(pointer);
    this.renderChunk(this.sprayChunk);
  }

  /**
   * Invoked on mouse up
   */
  onMouseUp() {
    this.finalize();
  }

  protected drawChunk(
    ctx: CanvasRenderingContext2D,
    sprayChunk: SprayBrushPoint[]
  ) {
    for (let i = 0; i < sprayChunk.length; i++) {
      const point = sprayChunk[i];
      ctx.globalAlpha = point.opacity;
      ctx.fillRect(point.x, point.y, point.width, point.width);
    }
  }

  protected renderChunk(sprayChunk: SprayBrushPoint[]) {
    const ctx = this.canvas.contextTop;
    ctx.save();
    this.transform(ctx);
    this.drawChunk(ctx, sprayChunk);
    this._drawClipPath(ctx, this.clipPath);
    ctx.restore();
  }

  /**
   * Render all spray chunks
   */
  protected _render(ctx: CanvasRenderingContext2D) {
    for (let i = 0; i < this.sprayChunks.length; i++) {
      this.drawChunk(ctx, this.sprayChunks[i]);
    }
    ctx.restore();
  }

  /**
   * @param {Point} pointer
   */
  addSprayChunk(pointer: Point) {
    this.sprayChunk = [];
    const radius = this.width / 2;

    for (let i = 0; i < this.density; i++) {
      this.sprayChunk.push({
        x: getRandomInt(pointer.x - radius, pointer.x + radius),
        y: getRandomInt(pointer.y - radius, pointer.y + radius),
        width: this.dotWidthVariance
          ? getRandomInt(
              // bottom clamp width to 1
              Math.max(1, this.dotWidth - this.dotWidthVariance),
              this.dotWidth + this.dotWidthVariance
            )
          : this.dotWidth,
        opacity: this.randomOpacity ? getRandomInt(0, 100) / 100 : 1,
      });
    }

    this.sprayChunks.push(this.sprayChunk);
  }
}

fabric.SprayBrush = SprayBrush;
