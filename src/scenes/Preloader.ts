import { Scene } from 'phaser';
import { BACKGROUND_BEIGE } from './vars';
import { GraphDeserialiser } from '../graph/InteractiveGraph';
import { EntityController } from '../graph/GraphEntity';

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
        this.load.json('graph-1', './data/graph_1.json');
        this.load.json('graph-2', './data/graph_2.json');
    }

    create() {
        this.cameras.main.setBackgroundColor(BACKGROUND_BEIGE);

        const graphDeserialiser = new GraphDeserialiser();
        const graphOnly = graphDeserialiser.deserialiseGraphOnly(this.cache.json.get("graph-2"));
        const entityController = new EntityController(graphOnly);

        const graphWithPositions = graphDeserialiser.deserialiseWithPositions(this.cache.json.get("graph-2"));
        this.scene.start(
            'GraphScene',
            { graph: graphWithPositions, entityController: entityController }
        );
    }
}
