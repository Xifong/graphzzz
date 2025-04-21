import { Scene } from "phaser";
import { EntityPosition, EntityRenderData } from "../graph/GraphEntity";
import { PhaserPosition } from "../types";
import { ENTITY_DEPTH, ENTITY_GRAPHICS_STYLE, ENTITY_RADIUS } from "../scenes/vars";
import { NodeObject } from "./NodeObject";
import { EdgeObject } from "./EdgeObject";
import { getPhaserDuration } from "../util";
import { GraphModificationEvent } from "../graph/types";

export type TweenCompletionEvent = {
    type: "MOVE_COMPLETE",
    entityID: number,
}


export class EntityObject extends Phaser.GameObjects.Container {
    private entityGraphics: Phaser.GameObjects.Graphics;
    private destroyed: boolean = false;

    constructor(
        public scene: Scene,
        public renderData: EntityRenderData,
        public entityPosition: EntityPosition,
        private onTweenComplete: (event: TweenCompletionEvent) => void
    ) {
        super(scene);

        this.entityGraphics = this.scene.add.graphics(ENTITY_GRAPHICS_STYLE);
        this.add(this.entityGraphics);
    }

    private renderOnto(point: PhaserPosition) {
        this.entityGraphics.clear();
        this.setDepth(ENTITY_DEPTH);
        this.entityGraphics.setPosition(point.x, point.y);

        this.entityGraphics.fillStyle(this.renderData.colour);
        const circle = new Phaser.Geom.Circle(0, 0, ENTITY_RADIUS);
        this.entityGraphics.fillCircleShape(circle);
        this.entityGraphics.strokeCircleShape(circle);
    }

    renderOntoNodePoint = (point: PhaserPosition, node: NodeObject) => {
        node.add(this);
        // multiply by 2 to double the render twice the radius away from the node centre
        // points used here are relative to the node centre
        this.renderOnto({ x: point.x * 2, y: point.y * 2 });
    }

    renderOntoEdgeSide = (startPoint: PhaserPosition, _edge: EdgeObject, endPoint: PhaserPosition) => {
        if (this.scene === undefined) {
            debugger;
        }

        this.scene.add.existing(this);
        // points used here are absolute
        this.renderOnto(startPoint);

        this.scene.tweens.add({
            targets: this.entityGraphics,
            x: endPoint.x,
            y: endPoint.y,
            duration: getPhaserDuration(startPoint, this.renderData.simMoveSpeed, endPoint) * 1000,
            ease: 'Linear',
            onComplete: () => {
                this.onTweenComplete({
                    type: "MOVE_COMPLETE",
                    entityID: this.renderData.entityID,
                });
            }
        })
    }

    handleGraphModification(event: GraphModificationEvent) {
        switch (event.type) {
            case "NODE_DELETED":
                console.log(`entity '${this.renderData.entityID}', handling NODE_DELETED`);
                break;
            case "EDGE_DELETED":
                console.log(`entity '${this.renderData.entityID}', handling EDGE_DELETED`);
                break;
            case "NODE_MOVED":
                console.log(`entity '${this.renderData.entityID}', handling NODE_MOVED`);
                break;
            case "NODE_ADDED":
                console.log(`entity '${this.renderData.entityID}', handling NODE_ADDED`);
                break;
            case "EDGE_ADDED":
                console.log(`entity '${this.renderData.entityID}', handling EDGE_ADDED`);
                break;
        }
    }

    protected preDestroy(): void {
        this.destroyed = true;
    }
}
