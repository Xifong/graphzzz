import { SimPosition } from "../types"

export type NodePosition = {
    type: "node",
    nodeID: number
}

export type EdgePosition = {
    type: "edge",
    edgeID: number,
    toNodeID: number,
    progressRatio: number,
}

export type FreePosition = SimPosition & {
    type: "free",
    toNodeID: number,
}

export type EntityPosition = NodePosition | EdgePosition | FreePosition
