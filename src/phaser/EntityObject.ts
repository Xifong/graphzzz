import { Scene } from "phaser";
import { EntityPosition, EntityRenderData } from "../graph/GraphEntity";
import { PhaserPosition } from "../types";
import { ENTITY_DEPTH, ENTITY_GRAPHICS_STYLE, ENTITY_RADIUS } from "../scenes/vars";
import { NodeObject } from "./NodeObject";
import { EdgeObject } from "./EdgeObject";
import { getPhaserDuration } from "../util/positions";
import { GraphModificationEvent } from "../graph/types";
import { EntityRenderingError } from "./EntityRenderingError";

export type TweenCompletionEvent = {
    type: "MOVE_COMPLETE",
    entityID: number,
}

export class EntityObject extends Phaser.GameObjects.Container {
    private entityGraphics: Phaser.GameObjects.Graphics;
    private currentTween?: Phaser.Tweens.Tween;
    private previouslyRendered: boolean = false;

    constructor(
        public scene: Scene,
        public renderData: EntityRenderData,
        public entityPosition: EntityPosition,
        private onTweenComplete: (event: TweenCompletionEvent) => void,
        private initialEntityPosition?: PhaserPosition,
    ) {
        super(scene);

        this.entityGraphics = this.scene.add.graphics(ENTITY_GRAPHICS_STYLE);
        this.add(this.entityGraphics);
    }

    private renderOnto(point: PhaserPosition) {
        this.previouslyRendered = true;
        this.entityGraphics.clear();
        this.setDepth(ENTITY_DEPTH);
        this.entityGraphics.setPosition(point.x, point.y);

        this.entityGraphics.fillStyle(this.renderData.colour);
        const circle = new Phaser.Geom.Circle(0, 0, ENTITY_RADIUS);
        this.entityGraphics.fillCircleShape(circle);
        this.entityGraphics.strokeCircleShape(circle);
    }

    private completeMoveToNode = () => {
        this.onTweenComplete({
            type: "MOVE_COMPLETE",
            entityID: this.renderData.entityID,
        });
    }

    private tweenTo(duration: number, endPoint: PhaserPosition, onComplete?: () => void) {
        if (this.currentTween && this.entityPosition.type !== "ON_NODE") {
            throw new EntityRenderingError("should never overwrite tween unless on a node");
        }

        this.currentTween?.destroy();

        const newTween = {
            targets: this.entityGraphics,
            x: endPoint.x,
            y: endPoint.y,
            duration: duration,
            ease: 'Linear',
            onComplete: () => {
                this.currentTween = undefined;
                if (onComplete !== undefined) {
                    onComplete();
                }
            }
        }

        this.currentTween = this.scene.tweens.add(newTween);
    }

    renderOntoNodePoint = (suggestedStart: PhaserPosition, node: NodeObject, endPoint: PhaserPosition) => {
        node.add(this);
        if (!this.previouslyRendered) {
            this.renderOnto(suggestedStart);
        }

        const currentPosition = {
            x: this.entityGraphics.x,
            y: this.entityGraphics.y,
        }
        const duration = getPhaserDuration(currentPosition, this.renderData.simMoveSpeed, endPoint) * 1000;
        this.tweenTo(duration, endPoint);
    }

    renderOntoEdgeSide = (startPoint: PhaserPosition, _edge: EdgeObject, endPoint: PhaserPosition) => {
        this.scene.add.existing(this);

        if (this.initialEntityPosition !== undefined) {
            const duration = getPhaserDuration(this.initialEntityPosition, this.renderData.simMoveSpeed, startPoint) * 1000;
            this.renderOnto(this.initialEntityPosition);

            const completeMoveToEdgeStart = () => {
                const duration = getPhaserDuration(startPoint, this.renderData.simMoveSpeed, endPoint) * 1000;
                this.tweenTo(duration, endPoint, this.completeMoveToNode);
            }

            this.tweenTo(duration, startPoint, completeMoveToEdgeStart);
        } else {
            // points used here are absolute
            this.renderOnto(startPoint);
            const duration = getPhaserDuration(startPoint, this.renderData.simMoveSpeed, endPoint) * 1000;
            this.tweenTo(duration, endPoint, this.completeMoveToNode);
        }

    }

    renderOntoGraphCanvas = (startPoint: PhaserPosition, node?: NodeObject) => {
        this.scene.add.existing(this);
        this.renderOnto(startPoint);

        if (node !== undefined) {
            const duration = getPhaserDuration(startPoint, this.renderData.simMoveSpeed, node) * 1000;
            this.tweenTo(duration, { x: node.x, y: node.y }, this.completeMoveToNode);
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
        // This is an optimisation (we only need to convert from absolute back to world position when currently on a node)
        if (this.entityPosition.type == "ON_NODE") {
            const { tx, ty } = this.entityGraphics.getWorldTransformMatrix();
            return { x: tx, y: ty };
        }
        return {
            x: this.entityGraphics.x,
            y: this.entityGraphics.y
        }
    }

    preDestroy(): void {
        this.currentTween?.destroy();
    }
}
