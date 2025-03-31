import { Scene, Types } from 'phaser';

interface PhaserPosition {
    x: number
    y: number
}

export class Game extends Scene {
    camera: Phaser.Cameras.Scene2D.Camera;
    background: Phaser.GameObjects.Image;
    msg_text: Phaser.GameObjects.Text;

    constructor() {
        super('Game');
    }

    create() {
        this.camera = this.cameras.main;
        this.camera.setBackgroundColor(0xdfd0d1);
        // this.background = this.add.image(512 * 1.1, 384 * 1.1, 'background');
        // this.background.setAlpha(0.5);

        // this.msg_text = this.add.text(512, 384, 'Make something fun!\nand share it with us:\nsupport@phaser.io', {
        //     fontFamily: 'Arial Black', fontSize: 38, color: '#ffffff',
        //     stroke: '#000000', strokeThickness: 8,
        //     align: 'center'
        // });
        // this.msg_text.setOrigin(0.5);

        this.render_graph_test();


        this.input.once('pointerdown', () => {
        });
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
        const nodes = [{
            id: 0,
            x: 100,
            y: 50
        },
        {
            id: 1,
            x: 20,
            y: 20
        },
        {
            id: 2,
            x: 500,
            y: 500
        },
        {
            id: 3,
            x: 600,
            y: 100
        },
        {
            id: 4,
            x: 800,
            y: 850
        },
        ];

        const edges = [
            {
                leftNode: 0,
                rightNode: 1,
            },
            {
                leftNode: 0,
                rightNode: 2,
            },
            {
                leftNode: 0,
                rightNode: 3,
            },
            {
                leftNode: 3,
                rightNode: 4,
            },
            {
                leftNode: 2,
                rightNode: 3,
            },
            {
                leftNode: 4,
                rightNode: 2,
            },
        ]

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

        for (const edge of edges) {
            const leftNode = nodes.filter((n) => n.id === edge.leftNode)[0];
            const rightNode = nodes.filter((n) => n.id === edge.rightNode)[0];

            const phaserPositionL = this.translate(leftNode.x, leftNode.y);
            const phaserPositionR = this.translate(rightNode.x, rightNode.y);

            graphics.lineBetween(phaserPositionL.x, phaserPositionL.y, phaserPositionR.x, phaserPositionR.y);
        }

        for (const node of nodes) {
            const phaserPosition = this.translate(node.x, node.y);
            graphics.fillCircle(phaserPosition.x, phaserPosition.y, 20)
            graphics.strokeCircle(phaserPosition.x, phaserPosition.y, 20)
        }
    }
}
