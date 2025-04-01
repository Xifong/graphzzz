import { Scene } from 'phaser';
import { InteractiveGraph } from '../graph/types';
import { GraphDataDeserialiserImp } from '../graph/InteractiveGraph';
import { BACKGROUND_SEPIA } from './vars';

export class Preloader extends Scene {
    graph: InteractiveGraph;

    constructor() {
        super('Preloader');
    }

    init() {
        // Progress bar
        this.add.rectangle(512, 384, 468, 32).setStrokeStyle(1, 0xffffff);
        const bar = this.add.rectangle(512 - 230, 384, 4, 28, 0xffffff);

        this.load.on('progress', (progress: number) => {
            bar.width = 4 + (460 * progress);
        });
    }

    preload() {
        this.load.json('graph-data', './data/graph_1.json');
    }

    create() {
        this.cameras.main.setBackgroundColor(BACKGROUND_SEPIA);

        const graphDeserialiser = new GraphDataDeserialiserImp();
        // Probably will need to make this a Phaser global in future as more interactivity is added
        this.graph = graphDeserialiser.deserialise(this.cache.json.get("graph-data"));
        this.scene.start('GraphScene', this.graph.getRenderData());
    }
}
