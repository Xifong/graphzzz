import { Scene } from "phaser";
import { EntityPosition, EntityRenderData } from "../graph/GraphEntity";
import { PhaserPosition } from "../types";
import { ENTITY_DEPTH, ENTITY_GRAPHICS_STYLE, ENTITY_RADIUS } from "../scenes/vars";
import { NodeObject } from "./NodeObject";
import { EdgeObject } from "./EdgeObject";
import { getPhaserDuration } from "../util";
import { GraphModificationEvent } from "../graph/types";
import { EntityRenderingError } from "./GraphEntityRenderer";

export type TweenCompletionEvent = {
    type: "MOVE_COMPLETE",
    entityID: number,
}

export class EntityObject extends Phaser.GameObjects.Container {
    private entityGraphics: Phaser.GameObjects.Graphics;
    private currentTween?: Phaser.Tweens.Tween;

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

    private tweenBetween(startPoint: PhaserPosition, endPoint: PhaserPosition) {
        if (this.currentTween) {
            throw new EntityRenderingError("attempted to move entity that was already moving");
        }

        const newTween = {
            targets: this.entityGraphics,
            x: endPoint.x,
            y: endPoint.y,
            duration: getPhaserDuration(startPoint, this.renderData.simMoveSpeed, endPoint) * 1000,
            ease: 'Linear',
            onComplete: () => {
                this.currentTween = undefined;
                this.onTweenComplete({
                    type: "MOVE_COMPLETE",
                    entityID: this.renderData.entityID,
                });
            }
        }

        this.currentTween = this.scene.tweens.add(newTween);
    }

    renderOntoEdgeSide = (startPoint: PhaserPosition, _edge: EdgeObject, endPoint: PhaserPosition) => {
        this.scene.add.existing(this);
        // points used here are absolute
        this.renderOnto(startPoint);

        this.tweenBetween(startPoint, endPoint);
    }

    renderOntoGraphCanvas = (startPoint: PhaserPosition, node?: NodeObject) => {
        this.scene.add.existing(this);
        this.renderOnto(startPoint);

        if (node !== undefined) {
            this.tweenBetween(startPoint, { x: node.x, y: node.y });
        }
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

    currentPosition(): PhaserPosition {
        const { tx, ty } = this.entityGraphics.getWorldTransformMatrix();
        return { x: tx, y: ty };
    }

    preDestroy(): void {
        this.currentTween?.destroy();
    }
}
