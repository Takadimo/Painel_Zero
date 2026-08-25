/**
 * Matriz Dinâmica Avançada de Repertório e Microblocos
 * Suporta múltiplos blocos por peça, marcação de compassos e controle de status.
 */

const INITIAL_REPERTOIRE = [
    {
        id: "czerny_823_1",
        title: "Exercício Op. 823",
        composer: "Carl Czerny",
        blocks: [
            { id: "c823_1_4", compass: "1-4", type: "Microbloco", status: "Em Estudo" },
            { id: "c823_5_8", compass: "5-8", type: "Microbloco", status: "Novo" },
            { id: "c823_9_12", compass: "9-12", type: "Microbloco", status: "Novo" }
        ]
    },
    {
        id: "burgmuller_109_1",
        title: "Études de Expression Op. 109",
        composer: "Johann Friedrich Burgmüller",
        blocks: [
            { id: "bg109_1_4", compass: "1-4", type: "Frase Principal", status: "Consolidado" },
            { id: "bg109_5_8", compass: "5-8", type: "Frase Principal", status: "Em Estudo" }
        ]
    }
];

class RepertoireManager {
    constructor() {
        const stateRepertoire = State.getState().repertoire;
        if (!stateRepertoire || stateRepertoire.length === 0) {
            State.updateState(state => {
                state.repertoire = INITIAL_REPERTOIRE;
            });
        }
    }

    getRepertoire() {
        return State.getState().repertoire || [];
    }

    addPiece(pieceData) {
        State.updateState(state => {
            if (!state.repertoire) state.repertoire = [];
            state.repertoire.push(pieceData);
        });
    }

    addBlockToPiece(pieceId, blockData) {
        State.updateState(state => {
            const piece = state.repertoire.find(p => p.id === pieceId);
            if (piece) {
                if (!piece.blocks) piece.blocks = [];
                piece.blocks.push(blockData);
            }
        });
    }

    updateBlockStatus(pieceId, blockId, newStatus) {
        State.updateState(state => {
            const piece = state.repertoire.find(p => p.id === pieceId);
            if (piece && piece.blocks) {
                const block = piece.blocks.find(b => b.id === blockId);
                if (block) {
                    block.status = newStatus;
                }
            }
        });
    }
}

const Repertoire = new RepertoireManager();
