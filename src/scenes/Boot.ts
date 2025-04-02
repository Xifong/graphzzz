import { Scene } from 'phaser';
import { BACKGROUND_BEIGE } from './vars';

export class Boot extends Scene {
    constructor() {
        super('Boot');
    }

    preload() {

    }

    create() {
        this.cameras.main.setBackgroundColor(BACKGROUND_BEIGE);
        this.scene.start('Preloader');
    }
}
