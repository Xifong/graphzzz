import { CANVAS_HEIGHT, CANVAS_WIDTH } from "../vars";

export const ASPECT_RATIO = CANVAS_WIDTH / CANVAS_HEIGHT;
export const GRAPH_MAX_Y = 1000;
export const GRAPH_MAX_X = GRAPH_MAX_Y * ASPECT_RATIO;

export const GRAPH_ENTITY_NUM = 100;
export const GRAPH_ENTITY_SPEED = 100;
export const GRAPH_ENTITY_FREE_SPEED = 250;
export const GRAPH_ENTITY_MOVE_INTERVAL = 100;
