export const BACKGROUND_BEIGE = 0xdfd0d1;
export const BLACK = 0x000000;

export const GRAPH_GRAPHICS_STYLE = {
    lineStyle: {
        width: 1.8,
        color: BLACK,
        alpha: 1,
    },
    fillStyle: {
        color: BACKGROUND_BEIGE,
        alpha: 1,
    }
}

export const ENTITY_GRAPHICS_STYLE = {
    lineStyle: {
        width: 1.8,
        color: BLACK,
        alpha: 1,
    },
    fillStyle: {
        color: BLACK,
        alpha: 1,
    }
}

export const NODE_RADIUS = 22;
export const ENTITY_RADIUS = 6;
export const ENTITY_DISPLAY_RADIUS_MULTIPLE = 2;

export const ENTITY_DEPTH = 1;
export const NODE_DEPTH = 0;
export const EDGE_DEPTH = -1;
export const CANVAS_DEPTH = -Number.MAX_SAFE_INTEGER;

export const TEXT_STYLE = {
    fontFamily: 'Courier',
    fontSize: '25px',
    fontStyle: '',
    backgroundColor: null,
    color: '#000000',
    stroke: '#000000',
    strokeThickness: 1,
    shadow: {
        offsetX: 0,
        offsetY: 0,
        color: '#000',
        blur: 0,
        stroke: false,
        fill: false
    },
    align: 'left',
    padding: {
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
    },
    maxLines: 0,
    lineSpacing: 0,
    fixedWidth: 0,
    fixedHeight: 0,
    rtl: false,
    testString: '|MÉqgy',
    wordWrap: {
        width: null,
        callback: null,
        callbackScope: null,
        useAdvancedWrap: false
    },
}
