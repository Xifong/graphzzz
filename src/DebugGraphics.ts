import { Scene } from 'phaser';

export interface SceneWithDebug extends Scene {
    debugGraphicsGroup: Phaser.GameObjects.Group;
}

export class DebugGraphics extends Phaser.GameObjects.Graphics {
    private debugGraphics: Phaser.GameObjects.Graphics;
    private parent: HasGetChildren;

    constructor(
        public scene: SceneWithDebug,
        parentObject: Scene | Phaser.GameObjects.Container,
    ) {
        super(scene);
        this.parent = new GetChildrenAdaptor(parentObject);
        this.debugGraphics = this.scene.add.graphics();
        scene.debugGraphicsGroup.add(this);

        this.on(Phaser.GameObjects.Events.DESTROY, () => {
            this.debugGraphics?.destroy();
        });
    }

    drawDebug() {
        this.debugGraphics.clear();
        for (const child of this.parent.getChildren()) {
            if (canGetBounds(child)) {
                const bounds = child.getBounds();
                this.debugGraphics.setDepth(Number.MAX_SAFE_INTEGER);
                this.debugGraphics.lineStyle(2, 0x00ff00, 1);
                this.debugGraphics.strokeRectShape(bounds);
            }
        }
    }
}

interface HasGetChildren {
    getChildren(): Phaser.GameObjects.GameObject[];
}

class GetChildrenAdaptor implements HasGetChildren {
    constructor(
        private toAdapt: Scene | Phaser.GameObjects.Container) {
    }

    public getChildren(): Phaser.GameObjects.GameObject[] {
        if (this.toAdapt instanceof Scene) {
            return this.toAdapt.children.list;
        }
        return this.toAdapt.list;
    }
}

interface HasGetBounds extends Phaser.GameObjects.GameObject {
    getBounds(): Phaser.Geom.Rectangle;
}

function canGetBounds(obj: Phaser.GameObjects.GameObject): obj is HasGetBounds {
    return obj && typeof (obj as any).getBounds === "function";
}
