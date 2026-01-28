export class HistoryManager {
    constructor(game) {
        this.game = game;

        // History für Rückgängig/Wiederholen
        this.history = [];
        this.historyIndex = -1;
        this.maxHistoryLength = 20; // Reduziert für bessere Performance
    }

    resetHistory() {
        this.history = [];
        this.historyIndex = -1;
        this.updateHistoryButtons();
    }

    // Spielzustand speichern
    saveState() {
        if (this.historyIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.historyIndex + 1);
        }

        // Minimalen Zustand speichern
        const state = {
            players: JSON.parse(JSON.stringify(this.game.players.players)),
            pieces: JSON.parse(JSON.stringify(this.game.pieces)),
            statistics: JSON.parse(JSON.stringify(this.game.stats.statistics)),
            currentPlayerIndex: this.game.currentPlayerIndex,
            diceValue: this.game.diceValue,
            rollsThisTurn: this.game.rollsThisTurn,
            maxRolls: this.game.maxRolls,
            hasMovedThisTurn: this.game.hasMovedThisTurn,
            gameState: this.game.gameState,
            startRollsDone: this.game.startRollsDone,
            mandatoryCapture: this.game.mandatoryCapture,
            mandatoryMoveFromHome: this.game.mandatoryMoveFromHome,
            lastMoveWasMandatory: this.game.lastMoveWasMandatory,
            playerCount: this.game.players.playerCount
        };

        // Spielzeit konvertieren
        if (this.game.stats.statistics.gameStartTime) {
            state.statistics.gameStartTime = this.game.stats.statistics.gameStartTime.toISOString();
        }

        this.history.push(state);
        this.historyIndex++;

        // History-Länge begrenzen
        if (this.history.length > this.maxHistoryLength) {
            this.history.shift();
            this.historyIndex--;
        }

        this.updateHistoryButtons();
    }

    // Spielzustand laden
    loadState(state) {
        this.game.players.players = JSON.parse(JSON.stringify(state.players));
        this.game.pieces = JSON.parse(JSON.stringify(state.pieces));
        this.game.stats.statistics = JSON.parse(JSON.stringify(state.statistics));
        this.game.currentPlayerIndex = state.currentPlayerIndex;
        this.game.diceValue = state.diceValue;
        this.game.rollsThisTurn = state.rollsThisTurn;
        this.game.maxRolls = state.maxRolls;
        this.game.hasMovedThisTurn = state.hasMovedThisTurn;
        this.game.gameState = state.gameState;
        this.game.startRollsDone = state.startRollsDone;
        this.game.mandatoryCapture = state.mandatoryCapture;
        this.game.mandatoryMoveFromHome = state.mandatoryMoveFromHome;
        this.game.lastMoveWasMandatory = state.lastMoveWasMandatory;

        // PlayerCount, playerPaths müssen auch geladen werden
        this.game.players.playerCount = state.playerCount;
        this.game.players.playerPaths = state.playerPaths || {};

        // Spielzeit-String zurück in Date-Objekt konvertieren
        if (this.game.stats.statistics.gameStartTime && typeof this.game.stats.statistics.gameStartTime === 'string') {
            this.game.stats.statistics.gameStartTime = new Date(this.game.stats.statistics.gameStartTime);
        }

        this.updateAllPiecePositions();
        this.game.players.createPlayersInfo();
        this.game.dice.showDiceFace(this.game.diceValue);
        this.game.ui.updateRollCounter();
        this.game.ui.updateStatus(this.game.ui.getStatusMessage());
        this.game.stats.updateStatistics();

        this.updateHistoryButtons();

        if (this.game.gameState === 'playing') {
            document.getElementById('roll-btn').disabled = this.game.hasMovedThisTurn;
        }
    }

    // Alle Spielsteine aktualisieren
    updateAllPiecePositions() {
        this.game.pieces.forEach(piece => {
            const svgPiece = document.getElementById(piece.id);
            if (svgPiece) {
                svgPiece.setAttribute('cx', piece.position.x);
                svgPiece.setAttribute('cy', piece.position.y);

                if (piece.isHome) {
                    svgPiece.classList.add('in-home');
                } else {
                    svgPiece.classList.remove('in-home');
                }
            }
        });
    }

    // History-Buttons aktualisieren
    updateHistoryButtons() {
        const undoBtn = document.getElementById('undo-btn');
        const redoBtn = document.getElementById('redo-btn');

        undoBtn.disabled = this.historyIndex <= 0;
        redoBtn.disabled = this.historyIndex >= this.history.length - 1;
    }

    // Rückgängig machen
    undoMove() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            const state = this.history[this.historyIndex];
            this.loadState(state);
            this.game.ui.updateStatus("Zug rückgängig gemacht.", 'info');
        }
    }

    // Wiederholen
    redoMove() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            const state = this.history[this.historyIndex];
            this.loadState(state);
            this.game.ui.updateStatus("Zug wiederholt.", 'info');
        }
    }
}