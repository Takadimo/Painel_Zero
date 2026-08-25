/**
 * Matriz Dinâmica de Repertório e Trechos Ativos
 * Gerencia as peças, compositores e microblocos de estudo.
 */

const INITIAL_REPERTOIRE = [
    {
        id: "czerny_823_1",
        title: "Exercício Op. 823",
        composer: "Carl Czerny",
        blocks: [
            { id: "c823_1_4", compass: "1-4", type: "Microbloco", status: "Em Estudo" },
            { id: "c823_5_8", compass: "5-8", type: "Microbloco", status: "Novo" }
        ]
    },
    {
        id: "burgmuller_109_1",
        title: "Études de Expression Op. 109",
        composer: "Johann Friedrich Burgmüller",
        blocks: [
            { id: "bg109_1_8", compass: "1-8", type: "Frase Principal", status: "Em Estudo" }
        ]
    }
];

class RepertoireManager {
    constructor() {
        // Inicializa o repertório no estado global se ainda não existir
        if (!State.getState().repertoire || State.getState().repertoire.length === 0) {
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
}

const Repertoire = new RepertoireManager();
