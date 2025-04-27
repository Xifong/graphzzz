export interface InteractiveGraph {
    placeNodeAt: (x: number, y: number) => void;
    moveNodeTo: (nodeID: number, x: number, y: number) => void;
    connectNodeTo: (fromNodeID: number, toNodeID: number) => void;
    deleteEdge: (edgeID: number) => boolean;
    deleteNode: (nodeID: number) => boolean;
    getRenderData: () => GraphRenderData;
    nearestNodeTo: (x: number, y: number) => number | null;
}


export interface InteractiveGraphDeserialiser {
    deserialiseGraphOnly: (graphRepresentation: string) => Graph;
    deserialiseWithPositions: (graphRepresentation: string) => InteractiveGraph;
}

export interface InteractiveGraphSerialiser {
    serialise: (graph: InteractiveGraph) => string;
}

export interface GraphEdge {
    id: number;
    leftNode: GraphNode;
    rightNode: GraphNode;
}

export interface GraphNode {
    id: number;
    edges: GraphEdge[];

    neighboursCopy: Set<GraphNode>;
}

export interface Graph {
    iterableNodeCopy: Iterable<GraphNode>;
    iterableEdgeCopy: Iterable<GraphEdge>;

    upsertNode: (nodeID: number, edgeIDs?: number[]) => GraphNode;
    upsertEdge: (edgeID: number, leftNodeID: number, rightNodeID: number) => GraphEdge;
    deleteIfExistsNode: (nodeID: number) => boolean;
    deleteIfExistsEdge: (edgeID: number) => boolean;

    neighboursOf: (nodeID: number) => GraphNode[];
    connectionBetween: (nodeID: number, otherNodeID: number) => GraphEdge | null;
    hasNode: (nodeID: number) => boolean;
    edgesCopyOf: (nodeID: number) => GraphEdge[];
}

export interface GraphRenderData {
    nodes: {
        id: number,
        x: number,
        y: number,
    }[],
    edges: {
        id: number,
        leftNodeID: number,
        rightNodeID: number,
    }[],
}

export interface GraphEventEmitter {
    onGraphModification: (callback: (event: GraphModificationEvent) => void) => void;
}

export type GraphModificationEvent = {
    type: 'NODE_DELETED';
    nodeID: number;
} | {
    type: 'EDGE_DELETED';
    edgeID: number;
} | {
    type: 'NODE_MOVED';
    nodeID: number;
    newX: number;
    newY: number;
} | {
    type: 'EDGE_MOVED';
    edgeID: number;
} | {
    type: 'NODE_ADDED';
    nodeID: number;
    x: number;
    y: number;
} | {
    type: 'EDGE_ADDED';
    edgeID: number;
    fromNodeID: number;
    toNodeID: number;
};
