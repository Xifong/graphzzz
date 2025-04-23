import { Scene } from 'phaser';
import { BACKGROUND_BEIGE } from './vars';
import { GraphDeserialiser } from '../graph/InteractiveGraph';
import { EntityController } from '../graph/GraphEntity';
import { USE_GRAPH } from '../vars';

export class Preloader extends Scene {
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
        this.load.json('graph-2', './data/graph_2.json');
        this.load.json('line-graph', './data/line_graph.json');
    }

    create() {
        this.cameras.main.setBackgroundColor(BACKGROUND_BEIGE);

        const graphDeserialiser = new GraphDeserialiser();
        const json = this.cache.json.get(USE_GRAPH);
        const graphOnly = graphDeserialiser.deserialiseGraphOnly(json);
        const graphWithPositions = graphDeserialiser.deserialiseWithPositions(json);

        const entityController = new EntityController(graphOnly, graphWithPositions);
        this.scene.start(
            'GraphScene',
            { graph: graphWithPositions, entityController: entityController }
        );
    }
}
