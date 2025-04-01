import { GraphRenderData } from './types';
import { GraphImp } from '../graph/Graph';

export class InteractiveGraph {

}

const nodes = [
    {
        id: 0,
        x: 100,
        y: 50
    },
    {
        id: 1,
        x: 20,
        y: 20
    },
    {
        id: 2,
        x: 500,
        y: 500
    },
    {
        id: 3,
        x: 600,
        y: 100
    },
    {
        id: 4,
        x: 800,
        y: 850
    },
];

const edges = [
    {
        id: 0,
        leftNode: 0,
        rightNode: 1,
    },
    {
        id: 1,
        leftNode: 0,
        rightNode: 2,
    },
    {
        id: 2,
        leftNode: 0,
        rightNode: 3,
    },
    {
        id: 3,
        leftNode: 3,
        rightNode: 4,
    },
    {
        id: 4,
        leftNode: 2,
        rightNode: 3,
    },
    {
        id: 5,
        leftNode: 4,
        rightNode: 2,
    },
]

const graph = new GraphImp();

for (const node of nodes) {
    graph.upsertNode(node.id);
}

for (const edge of edges) {
    graph.upsertEdge(edge.id, edge.leftNode, edge.rightNode);
}

export const graphRenderData: GraphRenderData = {
    nodes: nodes,
    edges: edges.map((edge) => ({ leftNodeID: edge.leftNode, rightNodeID: edge.rightNode })),
}
