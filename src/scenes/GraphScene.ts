import { Scene } from 'phaser';
import { GraphRenderData } from '../graph/types';

interface PhaserPosition {
    x: number
    y: number
}

export class GraphScene extends Scene {
    camera: Phaser.Cameras.Scene2D.Camera;
    background: Phaser.GameObjects.Image;
    msg_text: Phaser.GameObjects.Text;
    graphData: GraphRenderData;

    constructor() {
        super('GraphScene');
    }

    init(graphData: GraphRenderData) {
        this.graphData = graphData;
    }

    create() {
        this.camera = this.cameras.main;
        this.camera.setBackgroundColor(0xdfd0d1);
        this.render_graph_test();
    }

    translate(x: number, y: number): PhaserPosition {
        const width: number = this.scale.width;
        const height: number = this.scale.height;

        return {
            x: x * (width / 1000),
            y: y * (height / 1000)
        }
    }

    render_graph_test() {
        // GraphRenderer should create an interface for what it expects to render to and we should get Phaser to implement that interface
        // with the implementation being injected into the GraphRenderer
        // API: create node at game post
        // API: link nodes
        // i.e. GraphRenderer knows about what to render within the game context
        // and the injected instance knows about how to render in Phaser

        // Ultimately nodes and edges should probably be game objects (for exposing click events)
        // but probably only bother considering this once we intend to expose the event

        var graphics = this.add.graphics({
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
