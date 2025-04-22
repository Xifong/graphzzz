import { Scene } from "phaser";
import { EDGE_DEPTH, GRAPH_GRAPHICS_STYLE } from "../scenes/vars";
import { getPhaserPositionOf } from "../util";
import { DEBUG_VISUALS } from "../vars";
import { getEdgePositioner } from "../util/positioners";
import { EdgeEntityPositionerImp } from "./EdgeEntityPositioner";

const HITBOX_THICKNESS = 20;

export const EdgeEvents = {
    REQUEST_DELETE: 'request-delete'
};


export class EdgeObject extends Phaser.GameObjects.Container {
    private graphics: Phaser.GameObjects.Graphics;
    private hitboxPolygon: Phaser.Geom.Polygon | null = null;
    private currentGraphicsStyle: Phaser.Types.GameObjects.Graphics.Options = JSON.parse(JSON.stringify(GRAPH_GRAPHICS_STYLE));
    private leftPositioner: EdgeEntityPositionerImp;
    private rightPositioner: EdgeEntityPositionerImp;

    constructor(
        public scene: Scene,
        public readonly id: number,
        public simStartX: number,
        public simStartY: number,
        public startID: number,
        public simEndX: number,
        public simEndY: number,
        public endID: number,
        public isInteractive: boolean = true,
    ) {
        super(scene);

        this.graphics = this.scene.add.graphics(GRAPH_GRAPHICS_STYLE);
        this.setDepth(EDGE_DEPTH);

        this.setData("id", id);
        this.setName(`Edge '${this.id}'`);

        // skip the hitbox and positioners in situations where the edge is being resized i.e. edge drawing
        if (this.isInteractive) {
            this.hitboxPolygon = this.getHitbox();

            this.leftPositioner = new EdgeEntityPositionerImp(
                this.scene,
                { x: simStartX, y: simStartY },
                this,
                { x: simEndX, y: simEndY },
                endID,
            );
            this.add(this.leftPositioner);
            this.scene.data.set(getEdgePositioner(id, endID), this.leftPositioner);

            this.rightPositioner = new EdgeEntityPositionerImp(
                this.scene,
                { x: simEndX, y: simEndY },
                this,
                { x: simStartX, y: simStartY },
                startID,
            );
            this.add(this.rightPositioner);
            this.scene.data.set(getEdgePositioner(id, startID), this.rightPositioner);
        }

        this.drawEdge();

        if (this.hitboxPolygon) {
            this.setInteractive(
                this.hitboxPolygon,
                Phaser.Geom.Polygon.Contains
            );
        } else {
            this.disableInteractive();
        }

        this.on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, (pointer: Phaser.Input.Pointer) => {
            if (pointer.rightButtonDown()) {
                pointer.event.preventDefault();
                this.emit(EdgeEvents.REQUEST_DELETE, this.id);
            }
        });

        this.on(
            Phaser.Input.Events.GAMEOBJECT_POINTER_OVER,
            () => {
                if (this.currentGraphicsStyle.lineStyle) {
                    this.currentGraphicsStyle.lineStyle.color = 0xff0000;
                }
                this.drawEdge();
            }
        );

        this.on(
            Phaser.Input.Events.GAMEOBJECT_POINTER_OUT,
            () => {
                this.currentGraphicsStyle = JSON.parse(JSON.stringify(GRAPH_GRAPHICS_STYLE));
                this.drawEdge();
            }
        );

        const points = this.hitboxPolygon?.getPoints(100);
        if (points && DEBUG_VISUALS) {
            for (const point of points) {
                this.graphics.fillStyle(0xff0000);
                this.graphics.fillPoint(point.x, point.y, 10);
            }
        }
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
        this.graphics.clear();
        this.graphics.setDefaultStyles(this.currentGraphicsStyle);
        const phaserPositionStart = getPhaserPositionOf(this.simStartX, this.simStartY);
        const phaserPositionEnd = getPhaserPositionOf(this.simEndX, this.simEndY);
        this.graphics.lineBetween(phaserPositionStart.x, phaserPositionStart.y, phaserPositionEnd.x, phaserPositionEnd.y);
        this.graphics.setDepth(EDGE_DEPTH);
    }

    private removePositioners() {
        this.scene.data.remove(getEdgePositioner(this.id, this.startID));
        this.scene.data.remove(getEdgePositioner(this.id, this.endID));
        this.leftPositioner?.destroy();
        this.rightPositioner?.destroy();
    }

    preDestroy(_scene?: boolean): void {
        this.removePositioners();
        this.graphics.clear();
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
