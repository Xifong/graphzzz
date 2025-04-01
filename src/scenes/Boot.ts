import { Scene } from 'phaser';
import { BACKGROUND_SEPIA } from './vars';

export class Boot extends Scene {
    constructor() {
        super('Boot');
    }

    preload() {

    }

    create() {
        this.cameras.main.setBackgroundColor(BACKGROUND_SEPIA);
        this.scene.start('Preloader');
    }
}
