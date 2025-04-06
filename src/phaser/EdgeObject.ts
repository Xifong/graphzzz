import { Scene } from "phaser";
import { EDGE_DEPTH, GRAPHICS_STYLE } from "../scenes/vars";
import { getPhaserPositionOf } from "../util";

const HITBOX_THICKNESS = 20;

export class EdgeObject extends Phaser.GameObjects.Graphics {
    private hitboxPolygon: Phaser.Geom.Polygon | null = null;
    private currentGraphicsStyle: Phaser.Types.GameObjects.Graphics.Options = JSON.parse(JSON.stringify(GRAPHICS_STYLE));

    constructor(
        public scene: Scene,
        public readonly id: number,
        public simStartX: number,
        public simStartY: number,
        public simEndX: number,
        public simEndY: number,
    ) {
        super(scene, GRAPHICS_STYLE);

        this.setData("id", id);
        this.setName(`Edge '${this.id}'`);

        this.hitboxPolygon = this.getHitbox();
        this.drawEdge();

        this.setInteractive(
            this.hitboxPolygon,
            Phaser.Geom.Polygon.Contains
        );

        this.on(
            Phaser.Input.Events.POINTER_OVER,
            () => {
                if (this.currentGraphicsStyle.lineStyle) {
                    this.currentGraphicsStyle.lineStyle.color = 0xff0000;
                }
                this.drawEdge();
            }
        );

        this.on(
            Phaser.Input.Events.POINTER_OUT,
            () => {
                this.currentGraphicsStyle = JSON.parse(JSON.stringify(GRAPHICS_STYLE));
                this.drawEdge();
            }
        );

        // const points = this.hitboxPolygon?.getPoints(100);
        // for (const point of points!) {
        //     this.fillStyle(0xff0000);
        //     this.fillPoint(point.x, point.y, 10);
        // }
    }

    private getHitbox(): Phaser.Geom.Polygon | null {
        const phaserPositionStart = getPhaserPositionOf(this.simStartX, this.simStartY);
        const phaserPositionEnd = getPhaserPositionOf(this.simEndX, this.simEndY);

        return createHitboxPolygon(
            phaserPositionStart.x, phaserPositionStart.y,
            phaserPositionEnd.x, phaserPositionEnd.y,
            HITBOX_THICKNESS
        );
    }


    private drawEdge() {
        this.clear();
        this.setDefaultStyles(this.currentGraphicsStyle);
        const phaserPositionStart = getPhaserPositionOf(this.simStartX, this.simStartY);
        const phaserPositionEnd = getPhaserPositionOf(this.simEndX, this.simEndY);
        this.lineBetween(phaserPositionStart.x, phaserPositionStart.y, phaserPositionEnd.x, phaserPositionEnd.y);
        this.setDepth(EDGE_DEPTH);
    }
}


function createHitboxPolygon(
    x1: number, y1: number,
    x2: number, y2: number,
    thickness: number
): Phaser.Geom.Polygon | null {

    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.sqrt(dx * dx + dy * dy);

    if (length === 0) {
        return null;
    }

    // Normalized direction vector (parallel to the line)
    const nx = dx / length;
    const ny = dy / length;

    // Normalized perpendicular vector
    const px = -ny;
    const py = nx;

    // Calculate the half-thickness offset vector components
    const hx = px * (thickness / 2);
    const hy = py * (thickness / 2);

    // Calculate the 4 corner points of the thick line polygon
    const p1x = x1 - hx;
    const p1y = y1 - hy;
    const p2x = x2 - hx;
    const p2y = y2 - hy;
    const p3x = x2 + hx;
    const p3y = y2 + hy;
    const p4x = x1 + hx;
    const p4y = y1 + hy;

    // Create the polygon using the calculated world coordinates
    // Pass coordinates as a flat array [x1, y1, x2, y2, ...]
    return new Phaser.Geom.Polygon([
        p1x, p1y,
        p2x, p2y,
        p3x, p3y,
        p4x, p4y
    ]);
}
