import { Scene } from 'phaser';
import { GraphRenderData } from '../graph/types';
import { GRAPH_MAX_X, GRAPH_MAX_Y } from '../graph/vars';
import { BACKGROUND_BEIGE } from './vars';

interface PhaserPosition {
    x: number
    y: number
}

export class GraphScene extends Scene {
    camera: Phaser.Cameras.Scene2D.Camera;
    graphData: GraphRenderData;

    constructor() {
        super('GraphScene');
    }

    init(graphData: GraphRenderData) {
        this.graphData = graphData;
    }

    create() {
        this.camera = this.cameras.main;
        this.camera.setBackgroundColor(BACKGROUND_BEIGE);
        this.renderGraph();
    }

    translate(x: number, y: number): PhaserPosition {
        const width: number = this.scale.width;
        const height: number = this.scale.height;

        return {
            x: x * (width / GRAPH_MAX_X),
            y: y * (height / GRAPH_MAX_Y)
        }
    }

    renderGraph() {
        const graphics = this.add.graphics({
            lineStyle: {
                width: 1,
                color: 0x000000,
                alpha: 1,
            },
            fillStyle: {
                color: this.cameras.main.backgroundColor.color,
                alpha: 1,
            }
        });

        for (const edge of this.graphData.edges) {
            const leftNode = this.graphData.nodes.filter((n) => n.id === edge.leftNodeID)[0];
            const rightNode = this.graphData.nodes.filter((n) => n.id === edge.rightNodeID)[0];

            const phaserPositionL = this.translate(leftNode.x, leftNode.y);
            const phaserPositionR = this.translate(rightNode.x, rightNode.y);

            graphics.lineBetween(phaserPositionL.x, phaserPositionL.y, phaserPositionR.x, phaserPositionR.y);
        }

        for (const node of this.graphData.nodes) {
            const phaserPosition = this.translate(node.x, node.y);
            graphics.fillCircle(phaserPosition.x, phaserPosition.y, 20)
            graphics.strokeCircle(phaserPosition.x, phaserPosition.y, 20)
        }
    }
}
