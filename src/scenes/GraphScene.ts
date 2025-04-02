import { Scene } from 'phaser';
import { GraphRenderData } from '../graph/types';
import { BACKGROUND_BEIGE } from './vars';
import { translatePos, translateRegion } from '../util';

export class GraphCanvas extends Phaser.GameObjects.Zone {
    constructor(
        public scene: Scene,
        public x: number,
        public y: number,
        public width: number,
        public height: number,
        public graphData: GraphRenderData
    ) {
        super(scene, x, y, width, height);
        scene.add.existing(this);
    }

    addedToScene() {
        this.renderGraph();
    }

    renderGraph() {
        const graphics = this.scene.add.graphics({
            lineStyle: {
                width: 1,
                color: 0x000000,
                alpha: 1,
            },
            fillStyle: {
                color: this.scene.cameras.main.backgroundColor.color,
                alpha: 1,
            }
        });

        for (const edge of this.graphData.edges) {
            const leftNode = this.graphData.nodes.filter((n) => n.id === edge.leftNodeID)[0];
            const rightNode = this.graphData.nodes.filter((n) => n.id === edge.rightNodeID)[0];

            const phaserPositionL = translatePos(leftNode.x, leftNode.y);
            const phaserPositionR = translatePos(rightNode.x, rightNode.y);

            graphics.lineBetween(phaserPositionL.x, phaserPositionL.y, phaserPositionR.x, phaserPositionR.y);
        }

        for (const node of this.graphData.nodes) {
            const phaserPosition = translatePos(node.x, node.y);
            graphics.fillCircle(phaserPosition.x, phaserPosition.y, 20)
            graphics.strokeCircle(phaserPosition.x, phaserPosition.y, 20)
        }
    }
}

export class GraphScene extends Scene {
    graphData: GraphRenderData;
    camera: Phaser.Cameras.Scene2D.Camera;

    constructor() {
        super('GraphScene');
    }

    init(graphData: GraphRenderData) {
        this.graphData = graphData;
    }

    create() {
        this.camera = this.cameras.main;
        this.camera.setBackgroundColor(BACKGROUND_BEIGE);

        const phaserRegion = translateRegion(500, 500, 1000, 1000);
        new GraphCanvas(this, phaserRegion.x, phaserRegion.y, phaserRegion.width, phaserRegion.height, this.graphData);
    }
}
