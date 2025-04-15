import { Boot } from './scenes/Boot';
import { GraphScene } from './scenes/GraphScene';
import { Preloader } from './scenes/Preloader';

import { Game, Types } from "phaser";
import { CANVAS_HEIGHT, CANVAS_WIDTH } from './vars';

/**
 * Main game configuration object
 * @see https://newdocs.phaser.io/docs/3.70.0/Phaser.Types.Core.GameConfig
 */
const config: Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
    parent: 'game-container',
    backgroundColor: '#dfd0d1',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: [
        Boot,
        Preloader,
        GraphScene,
    ],
    disableContextMenu: true,
    physics: {
        default: 'arcade',
        arcade: {
            debug: false,
            gravity: { x: 0, y: 0 }
        }
    },
    render: {
        antialias: true,
        pixelArt: false
    }
};

export default new Game(config);
