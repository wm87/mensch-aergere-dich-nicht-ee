import { Board } from './board.js';
import { Dice } from './dice.js';
import { PlayerManager } from './players.js';
import { Rules } from './rules.js';
import { Statistics } from './stats.js';
import { UI } from './ui.js';
import { SaveLoadManager } from './save-load.js';
import { HistoryManager } from './history.js';

export class Game {
    constructor() {
        this.board = new Board(this);
        this.dice = new Dice(this);
        this.players = new PlayerManager(this);
        this.rules = new Rules(this);
        this.stats = new Statistics(this);
        this.ui = new UI(this);
        this.saveLoad = new SaveLoadManager(this);
        this.history = new HistoryManager(this);

        // Spielzustand
        this.gameState = 'selection';
        this.currentPlayerIndex = -1;
        this.diceValue = 0;
        this.rollsThisTurn = 0;
        this.maxRolls = 3;
        this.selectedPiece = null;
        this.pieces = [];
        this.startRollsDone = 0;
        this.hasMovedThisTurn = false;
        this.isRolling = false;
        this.mandatoryCapture = false;
        this.mandatoryMoveFromHome = false;
        this.touchedPiece = null;
        this.lastMoveWasMandatory = false;

        // Initialisierung
        this.init();
    }

    init() {
        this.board.createBoard();
        this.rules.createRulesAccordion();
        this.dice.create3DDice();
        this.setupEventListeners();
        this.players.updatePlayerNameInputs();
        this.saveLoad.loadSaveSlots();
        this.ui.setupAccordions();

        // Statistik-Update-Intervall starten
        setInterval(() => this.stats.updateGameTime(), 1000);
    }

    setupEventListeners() {
        // Player Count Selection
        document.querySelectorAll('.player-count-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.player-count-btn').forEach(b => b.classList.remove('selected'));
                e.target.classList.add('selected');
                this.players.playerCount = parseInt(e.target.dataset.count);
                this.players.updatePlayerNameInputs();
            });
        });

        // Start Game Button
        document.getElementById('start-game-btn').addEventListener('click', () => this.startGame());

        // Player Name Inputs
        for (let i = 1; i <= 4; i++) {
            const input = document.getElementById(`player${i}-name`);
            input.addEventListener('input', (e) => {
                this.players.playerNames[i - 1] = e.target.value;
            });
        }

        // Game Controls
        document.getElementById('roll-btn').addEventListener('click', () => this.rollDice());
        document.getElementById('start-roll-btn').addEventListener('click', () => this.rollForStart());

        // History Controls
        document.getElementById('undo-btn').addEventListener('click', () => this.history.undoMove());
        document.getElementById('redo-btn').addEventListener('click', () => this.history.redoMove());

        // Save/Load/Restart Controls
        document.getElementById('save-game-btn').addEventListener('click', () => this.saveLoad.showSaveDialog());
        document.getElementById('load-game-btn').addEventListener('click', () => this.saveLoad.showLoadDialog());
        document.getElementById('restart-btn').addEventListener('click', () => this.restartGame());

        // Save Dialog Controls
        document.getElementById('save-cancel-btn').addEventListener('click', () => this.saveLoad.hideSaveDialog());
        document.getElementById('dialog-action-btn').addEventListener('click', () => this.saveLoad.handleDialogAction());

        // Close dialog on background click
        document.getElementById('save-dialog').addEventListener('click', (e) => {
            if (e.target === document.getElementById('save-dialog')) {
                this.saveLoad.hideSaveDialog();
            }
        });
    }

    showPlayerSelection() {
        document.getElementById('player-selection').style.display = 'block';
        document.querySelector('.main-layout').style.display = 'none';
        this.gameState = 'selection';
    }

    startGame() {
        // Spieleranzahl aus Buttons lesen
        const selectedBtn = document.querySelector('.player-count-btn.selected');
        this.players.playerCount = parseInt(selectedBtn.dataset.count);

        // Spielernamen aus Inputs lesen
        for (let i = 0; i < 4; i++) {
            const input = document.getElementById(`player${i + 1}-name`);
            if (input && input.value.trim() !== '') {
                this.players.playerNames[i] = input.value.trim();
            }
        }

        // Spieler initialisieren
        this.players.initializePlayers();

        // Player-Pfade erstellen
        this.players.createPlayerPaths();

        // Spielbrett NEU erstellen mit korrekten Zielfeldern
        this.board.createBoard();
        this.board.createGamePieces();
        this.players.createPlayersInfo();

        // UI aktualisieren
        document.getElementById('player-selection').style.display = 'none';
        document.querySelector('.main-layout').style.display = 'grid';
        this.showStartPhase();

        // Spielzeit starten
        this.stats.statistics.gameStartTime = new Date();
        this.stats.statistics.gameState = 'start_phase';

        // Erste Statistik anzeigen
        this.stats.updateStatistics();

        // Reset History
        this.history.resetHistory();

        // Akkordeon für Spielsteuerung öffnen
        this.ui.openAccordion('controls');
    }

    showStartPhase() {
        document.getElementById('start-phase').style.display = 'block';
        document.getElementById('roll-btn').disabled = true;
        this.ui.updateStatus("Regel 1: Bitte würfeln um die Startreihenfolge zu bestimmen");
        this.gameState = 'start_phase';
    }

    rollForStart() {
        if (this.startRollsDone >= this.players.players.length) return;

        const player = this.players.players[this.startRollsDone];
        player.startRoll = Math.floor(Math.random() * 6) + 1;

        const container = document.getElementById('start-dice-container');
        if (this.startRollsDone === 0) container.innerHTML = '';

        const diceDiv = document.createElement('div');
        diceDiv.style.display = 'flex';
        diceDiv.style.flexDirection = 'column';
        diceDiv.style.alignItems = 'center';
        diceDiv.style.margin = '10px';
        diceDiv.style.padding = '15px';
        diceDiv.style.background = 'white';
        diceDiv.style.borderRadius = '10px';
        diceDiv.style.boxShadow = '0 3px 10px rgba(0,0,0,0.1)';

        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '50');
        svg.setAttribute('height', '50');
        svg.setAttribute('viewBox', '0 0 80 80');
        svg.style.marginBottom = '10px';

        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');

        const dotPositions = this.dice.getCorrectDotPositions(player.startRoll);
        dotPositions.forEach(pos => {
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            const x = 20 + (pos.col * 20);
            const y = 20 + (pos.row * 20);
            circle.setAttribute('cx', x);
            circle.setAttribute('cy', y);
            circle.setAttribute('r', '5');
            circle.setAttribute('fill', '#333');
            g.appendChild(circle);
        });

        svg.appendChild(g);
        diceDiv.innerHTML = `
            <div class="player-color" style="background:${player.color}; margin-bottom: 8px;"></div>
            <div style="font-weight: bold; margin-bottom: 5px;">${player.name}</div>
        `;
        diceDiv.appendChild(svg);
        diceDiv.innerHTML += `<div style="font-size: 0.9rem; color: #666;">Würfelt: ${player.startRoll}</div>`;
        container.appendChild(diceDiv);

        this.startRollsDone++;

        if (this.startRollsDone === this.players.players.length) {
            let maxRoll = 0;
            let startPlayerIndex = 0;

            this.players.players.forEach((player, index) => {
                if (player.startRoll > maxRoll) {
                    maxRoll = player.startRoll;
                    startPlayerIndex = index;
                }
            });

            this.currentPlayerIndex = startPlayerIndex;
            this.players.players[this.currentPlayerIndex].active = true;
            this.gameState = 'playing';

            setTimeout(() => {
                document.getElementById('start-phase').style.display = 'none';
                this.startTurn();
                // Ersten Zustand speichern
                this.history.saveState();
            }, 2000);
        }
    }

    startTurn() {
        if (this.gameState !== 'playing') return;

        const player = this.players.players[this.currentPlayerIndex];
        this.rollsThisTurn = 0;
        this.hasMovedThisTurn = false;
        this.diceValue = 0;
        this.dice.showDiceFace(1);
        this.mandatoryCapture = false;
        this.mandatoryMoveFromHome = false;
        this.touchedPiece = null;
        this.lastMoveWasMandatory = false;

        const hasPiecesOnBoardOrGoal = this.pieces.some(p =>
            p.playerId === player.id && !p.isHome
        );

        this.maxRolls = !hasPiecesOnBoardOrGoal ? 3 : 1;

        this.ui.updateStatus(`${player.name} ist am Zug. ${!hasPiecesOnBoardOrGoal ? 'Regel 2: 3 Würfe möglich um eine 6 zu würfeln' : 'Regel 6: 1 Wurf möglich'}`);
        this.ui.updateRollCounter();
        this.players.createPlayersInfo();

        document.getElementById('roll-btn').disabled = false;

        // Akkordeon für Spielsteuerung öffnen
        this.ui.openAccordion('controls');
    }

    rollDice() {
        if (this.isRolling || this.gameState !== 'playing') return;

        const player = this.players.players[this.currentPlayerIndex];
        const hasPiecesOnBoardOrGoal = this.pieces.some(p => p.playerId === player.id && !p.isHome);

        if (this.hasMovedThisTurn && this.diceValue !== 6) {
            this.ui.updateStatus("Du hast bereits gezogen! Nächster Spieler.");
            setTimeout(() => this.nextPlayer(), 1500);
            return;
        }

        if (!hasPiecesOnBoardOrGoal && this.rollsThisTurn >= 3 && this.diceValue !== 6) {
            this.ui.updateStatus(`${player.name} hat 3x keine 6 gewürfelt (Regel 3). Nächster Spieler!`);
            setTimeout(() => this.nextPlayer(), 1500);
            return;
        }

        this.isRolling = true;
        document.getElementById('roll-btn').disabled = true;

        const dice = document.getElementById('dice-3d');
        dice.classList.add('rolling');

        setTimeout(() => {
            this.diceValue = Math.floor(Math.random() * 6) + 1;
            this.dice.showDiceFace(this.diceValue);
            dice.classList.remove('rolling');

            this.rollsThisTurn++;
            this.stats.statistics.totalRolls++;

            // Spieler-Statistik aktualisieren
            if (this.stats.statistics.playerStats[player.id]) {
                this.stats.statistics.playerStats[player.id].rolls++;
                if (this.diceValue === 6) {
                    this.stats.statistics.playerStats[player.id].sixes++;
                }
            }

            this.ui.updateRollCounter();
            this.stats.updateStatistics();

            this.isRolling = false;

            this.afterRoll();
        }, 800);
    }

    afterRoll() {
        const player = this.players.players[this.currentPlayerIndex];
        const playerId = player.id;
        const hasPiecesOnBoardOrGoal = this.pieces.some(p => p.playerId === player.id && !p.isHome);

        const possibleMoves = this.getPossibleMoves(playerId);

        if (possibleMoves.length === 0) {
            if (!hasPiecesOnBoardOrGoal && this.rollsThisTurn >= 3 && this.diceValue !== 6) {
                this.ui.updateStatus(`${player.name} kann keine Figur bewegen und hat 3x keine 6 (Regel 3 & 8). Nächster Spieler!`);
                setTimeout(() => this.nextPlayer(), 1500);
                return;
            }

            if (this.diceValue === 6 && !this.hasMovedThisTurn) {
                this.ui.updateStatus("6 gewürfelt, aber keine Figur kann bewegt werden! Nächster Spieler.");
                setTimeout(() => this.nextPlayer(), 1500);
                return;
            }

            if (hasPiecesOnBoardOrGoal) {
                this.ui.updateStatus(`${player.name} kann keine Figur bewegen (Regel 8). Nächster Spieler!`);
                setTimeout(() => this.nextPlayer(), 1500);
                return;
            }

            if (!hasPiecesOnBoardOrGoal && this.rollsThisTurn < 3) {
                this.ui.updateStatus(`${player.name} hat ${this.diceValue} gewürfelt. Braucht 6 zum Rauskommen. Noch ${3 - this.rollsThisTurn} Würfe.`);
                document.getElementById('roll-btn').disabled = false;
                return;
            }

            return;
        }

        const mandatoryMoves = this.getMandatoryMoves(possibleMoves, playerId);

        if (mandatoryMoves.length > 0) {
            this.mandatoryMoveFromHome = mandatoryMoves.some(move => move.piece.isHome);
            this.mandatoryCapture = mandatoryMoves.some(move => move.wouldCapture);

            if (this.mandatoryCapture) {
                this.ui.updateStatus("REGEL 10: SCHLAGPFLICHT! Wähle eine Figur zum Schlagen.", 'mandatory');
            } else if (this.mandatoryMoveFromHome && this.diceValue === 6) {
                this.ui.updateStatus("REGEL 4: Bei 6 muss eine Figur aus der Ecke gesetzt werden!", 'mandatory');
            }

            mandatoryMoves.forEach(move => {
                const pieceEl = document.getElementById(move.piece.id);
                if (pieceEl) {
                    pieceEl.classList.add('selected');
                }
            });

            return;
        }

        this.ui.updateStatus(`${player.name} hat ${this.diceValue} gewürfelt. Wähle eine Figur.`);

        if (!hasPiecesOnBoardOrGoal && this.rollsThisTurn < 3) {
            document.getElementById('roll-btn').disabled = false;
        }
    }

    getPossibleMoves(playerId) {
        const moves = [];
        const playerPieces = this.pieces.filter(p => p.playerId === playerId);

        playerPieces.forEach(piece => {
            if (piece.isHome) {
                if (this.diceValue === 6) {
                    const startPosition = piece.playerPath[0];
                    const pieceOnStart = this.pieces.find(p =>
                        !p.isHome &&
                        Math.abs(p.position.x - startPosition.x) < 0.1 &&
                        Math.abs(p.position.y - startPosition.y) < 0.1
                    );

                    // Nur wenn Startfeld leer ist oder von Gegner besetzt
                    if (!pieceOnStart || pieceOnStart.playerId !== playerId) {
                        moves.push({
                            piece: piece,
                            wouldCapture: pieceOnStart && pieceOnStart.playerId !== playerId,
                            fromHome: true
                        });
                    }
                    // Wenn Startfeld von eigenem Spieler besetzt: KEIN möglicher Zug
                }
            } else {
                const newPathIndex = piece.pathIndex + this.diceValue;

                if (newPathIndex <= 43) {
                    const targetPosition = piece.playerPath[newPathIndex];

                    if (newPathIndex >= 40) {
                        const pieceOnTarget = this.pieces.find(p =>
                            !p.isHome &&
                            Math.abs(p.position.x - targetPosition.x) < 0.1 &&
                            Math.abs(p.position.y - targetPosition.y) < 0.1 &&
                            p.playerId === playerId
                        );

                        if (!pieceOnTarget) {
                            moves.push({
                                piece: piece,
                                wouldCapture: false,
                                toGoal: true
                            });
                        }
                    } else {
                        const pieceOnTarget = this.pieces.find(p =>
                            !p.isHome &&
                            Math.abs(p.position.x - targetPosition.x) < 0.1 &&
                            Math.abs(p.position.y - targetPosition.y) < 0.1
                        );

                        if (!pieceOnTarget || pieceOnTarget.playerId !== playerId) {
                            moves.push({
                                piece: piece,
                                wouldCapture: pieceOnTarget && pieceOnTarget.playerId !== playerId,
                                toGoal: false
                            });
                        }
                    }
                }
            }
        });

        return moves;
    }

    getMandatoryMoves(possibleMoves, playerId) {
        const mandatoryMoves = [];

        const captureMoves = possibleMoves.filter(move => move.wouldCapture);
        if (captureMoves.length > 0) {
            return captureMoves;
        }

        if (this.diceValue === 6) {
            const homeMoves = possibleMoves.filter(move => move.fromHome);
            if (homeMoves.length > 0) {
                return homeMoves;
            }
        }

        return mandatoryMoves;
    }

    handlePieceClick(piece) {
        if (this.gameState !== 'playing' || this.diceValue === 0) return;

        const player = this.players.players[this.currentPlayerIndex];
        if (piece.playerId !== player.id) {
            this.ui.updateStatus("Das ist nicht deine Spielfigur!", 'warning');
            return;
        }

        this.touchedPiece = piece;

        document.querySelectorAll('.game-piece').forEach(p =>
            p.classList.remove('selected'));

        const possibleMoves = this.getPossibleMoves(player.id);
        const pieceMoves = possibleMoves.filter(move => move.piece.id === piece.id);

        if (pieceMoves.length === 0) {
            this.ui.updateStatus("Mit dieser Figur kann nicht gezogen werden!", 'warning');
            return;
        }

        const mandatoryMoves = this.getMandatoryMoves(possibleMoves, player.id);
        if (mandatoryMoves.length > 0) {
            const isMandatory = mandatoryMoves.some(move => move.piece.id === piece.id);
            if (!isMandatory) {
                this.ui.updateStatus("REGEL 10: Du musst einen Pflichtzug ausführen!", 'mandatory');
                return;
            }
        }

        document.getElementById(piece.id).classList.add('selected');

        // Zustand vor dem Zug speichern
        this.history.saveState();
        this.executeMove(piece);
    }

    executeMove(piece) {
        const player = this.players.players[this.currentPlayerIndex];

        if (piece.isHome) {
            if (this.diceValue === 6) {
                this.movePieceToBoard(piece);
            } else {
                this.ui.updateStatus("REGEL 4: Nur mit einer 6 kannst du eine Figur aus der Ecke holen!", 'mandatory');
                return;
            }
        } else {
            this.movePieceOnBoard(piece);
        }
    }

    movePieceToBoard(piece) {
        const playerId = piece.playerId;
        const startPosition = piece.playerPath[0];

        const pieceOnStart = this.pieces.find(p =>
            !p.isHome &&
            Math.abs(p.position.x - startPosition.x) < 0.1 &&
            Math.abs(p.position.y - startPosition.y) < 0.1
        );

        if (pieceOnStart) {
            if (pieceOnStart.playerId === playerId) {
                this.ui.updateStatus("REGEL 5: Bewege zuerst die Figur auf deinem Startfeld!", 'mandatory');
                return;
            } else {
                // REGEL 10: Zuerst den Gegner schlagen
                this.capturePiece(pieceOnStart);
                this.lastMoveWasMandatory = true;

                // JETZT: Nach dem Schlagen die eigene Figur aufs Startfeld setzen
                // Das Startfeld ist jetzt frei, weil der Gegner geschlagen wurde
                piece.isHome = false;
                piece.pathIndex = 0;
                piece.position = startPosition;

                this.updatePiecePosition(piece);

                const svgPiece = document.getElementById(piece.id);
                svgPiece.classList.remove('in-home');

                this.hasMovedThisTurn = true;
                this.lastMoveWasMandatory = this.mandatoryMoveFromHome;

                // Statistik aktualisieren
                this.stats.statistics.totalMoves++;
                if (this.stats.statistics.playerStats[playerId]) {
                    this.stats.statistics.playerStats[playerId].moves++;
                }

                this.ui.updateStatus("REGEL 10: Gegner geschlagen und eigene Figur auf Startfeld gesetzt!", 'important');
                this.players.createPlayersInfo();
                this.stats.updateStatistics();

                this.afterMove();
                return;
            }
        }

        // Normaler Fall: Startfeld ist leer
        piece.isHome = false;
        piece.pathIndex = 0;
        piece.position = startPosition;

        this.updatePiecePosition(piece);

        const svgPiece = document.getElementById(piece.id);
        svgPiece.classList.remove('in-home');

        this.hasMovedThisTurn = true;
        this.lastMoveWasMandatory = this.mandatoryMoveFromHome;

        // Statistik aktualisieren
        this.stats.statistics.totalMoves++;
        if (this.stats.statistics.playerStats[playerId]) {
            this.stats.statistics.playerStats[playerId].moves++;
        }

        this.ui.updateStatus("Figur ist jetzt auf der Laufbahn!");
        this.players.createPlayersInfo();
        this.stats.updateStatistics();

        this.afterMove();
    }

    capturePiece(capturedPiece) {
        // KORREKTUR: homePositions ist in board.homePositions
        const homePositions = this.board.homePositions[capturedPiece.playerId];

        if (!homePositions) {
            console.error('Keine homePositions gefunden für Spieler:', capturedPiece.playerId);
            return;
        }

        const firstFreeHome = homePositions.find(pos =>
            !this.pieces.some(p =>
                p.playerId === capturedPiece.playerId &&
                p.isHome &&
                Math.abs(p.position.x - pos.x) < 0.1 &&
                Math.abs(p.position.y - pos.y) < 0.1
            )
        );

        if (firstFreeHome) {
            capturedPiece.position = firstFreeHome;
            capturedPiece.isHome = true;
            capturedPiece.pathIndex = -1;

            this.updatePiecePosition(capturedPiece);

            const svgPiece = document.getElementById(capturedPiece.id);
            if (svgPiece) {
                svgPiece.classList.add('in-home');
            }

            // Statistik aktualisieren
            this.stats.statistics.totalCaptures++;

            // Schlagender Spieler
            const currentPlayer = this.players.players[this.currentPlayerIndex];
            if (this.stats.statistics.playerStats[currentPlayer.id]) {
                this.stats.statistics.playerStats[currentPlayer.id].captures++;
            }

            // Geschlagener Spieler
            if (this.stats.statistics.playerStats[capturedPiece.playerId]) {
                this.stats.statistics.playerStats[capturedPiece.playerId].captured++;
            }

            const playerName = this.players.players.find(p => p.id === capturedPiece.playerId).name;
            this.ui.updateStatus(`REGEL 10: Figur von ${playerName} geschlagen!`, 'important');
            this.players.createPlayersInfo();
            this.stats.updateStatistics();
        }
    }

    movePieceOnBoard(piece) {
        const playerId = piece.playerId;
        const newPathIndex = piece.pathIndex + this.diceValue;

        if (newPathIndex > 43) {
            this.ui.updateStatus("Du würdelst zu hoch! Nächster Spieler.");
            this.nextPlayer();
            return;
        }

        const targetPosition = piece.playerPath[newPathIndex];

        if (newPathIndex >= 40) {
            const pieceOnTarget = this.pieces.find(p =>
                !p.isHome &&
                Math.abs(p.position.x - targetPosition.x) < 0.1 &&
                Math.abs(p.position.y - targetPosition.y) < 0.1 &&
                p.playerId === playerId
            );

            if (pieceOnTarget) {
                this.ui.updateStatus("REGEL 14: Im Ziel dürfen eigene Figuren nicht übersprungen werden!", 'mandatory');
                return;
            }

            piece.pathIndex = newPathIndex;
            piece.position = targetPosition;

            const goalPosition = newPathIndex - 40 + 1;
            this.ui.updateStatus(`Figur geht ins Ziel! Position ${goalPosition}/4.`);
        } else {
            const pieceOnTarget = this.pieces.find(p =>
                !p.isHome &&
                Math.abs(p.position.x - targetPosition.x) < 0.1 &&
                Math.abs(p.position.y - targetPosition.y) < 0.1
            );

            if (pieceOnTarget) {
                if (pieceOnTarget.playerId === playerId) {
                    this.ui.updateStatus("REGEL 10: Du kannst deine eigene Figur nicht schlagen!", 'warning');
                    return;
                } else {
                    this.capturePiece(pieceOnTarget);
                    this.lastMoveWasMandatory = true;
                }
            }

            piece.pathIndex = newPathIndex;
            piece.position = targetPosition;

            if (newPathIndex === 39) {
                this.ui.updateStatus("Figur steht vor der Zielgerade! Würfle genau 1-4 um ins Ziel zu gehen.");
            }
        }

        this.updatePiecePosition(piece);
        this.hasMovedThisTurn = true;

        // Statistik aktualisieren
        this.stats.statistics.totalMoves++;
        if (this.stats.statistics.playerStats[playerId]) {
            this.stats.statistics.playerStats[playerId].moves++;
        }

        this.stats.updateStatistics();
        this.afterMove();
    }

    afterMove() {
        // Prüfen ob Spieler gewonnen hat
        const currentPlayerId = this.players.players[this.currentPlayerIndex].id;
        const playerPiecesInGoal = this.pieces.filter(p =>
            p.playerId === currentPlayerId && p.pathIndex >= 40
        ).length;

        if (playerPiecesInGoal === 4) {
            this.gameState = 'finished';
            const winnerName = this.players.players[this.currentPlayerIndex].name;
            this.ui.updateStatus(`🎉 REGEL 16: ${winnerName} hat gewonnen! 🎉`, 'success');
            document.getElementById('roll-btn').disabled = true;

            // Gewinner in Statistiken speichern
            this.stats.recordWin(winnerName);

            // Statistik sofort aktualisieren, um den Gewinner anzuzeigen
            this.stats.updateStatistics();

            this.createConfetti();
            return;
        }

        if (this.diceValue === 6) {
            this.diceValue = 0;
            this.dice.showDiceFace(1);
            this.rollsThisTurn = 0;
            this.hasMovedThisTurn = false;
            this.mandatoryCapture = false;
            this.mandatoryMoveFromHome = false;
            this.ui.updateStatus("REGEL 7: 6 gewürfelt! Nochmal würfeln.", 'info');
            document.getElementById('roll-btn').disabled = false;
        } else {
            this.nextPlayer();
        }

        this.selectedPiece = null;
        document.querySelectorAll('.game-piece').forEach(p =>
            p.classList.remove('selected'));
    }

    createConfetti() {
        const colors = ['#ff6666', '#6666ff', '#ffdd55', '#55cc55', '#ff9966', '#66ccff'];
        const board = document.getElementById('game-board');

        for (let i = 0; i < 50; i++) {
            setTimeout(() => {
                const confetti = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                const x = Math.random() * 11;
                const y = Math.random() * 11;
                const color = colors[Math.floor(Math.random() * colors.length)];
                const size = Math.random() * 0.3 + 0.1;

                confetti.setAttribute('cx', x);
                confetti.setAttribute('cy', y);
                confetti.setAttribute('r', size);
                confetti.setAttribute('fill', color);
                confetti.style.opacity = '0.9';
                board.appendChild(confetti);

                setTimeout(() => {
                    if (confetti.parentNode) {
                        confetti.parentNode.removeChild(confetti);
                    }
                }, 3000);
            }, i * 50);
        }
    }

    updatePiecePosition(piece) {
        const svgPiece = document.getElementById(piece.id);
        svgPiece.setAttribute('cx', piece.position.x);
        svgPiece.setAttribute('cy', piece.position.y);
    }

    nextPlayer() {
        // Pflichtzug-Überprüfung
        if (this.lastMoveWasMandatory === false &&
            (this.mandatoryCapture || this.mandatoryMoveFromHome) &&
            this.touchedPiece) {
            this.ui.updateStatus("REGEL 13: Pflichtzug nicht durchgeführt! Figur zurück und nächster Spieler.", 'error');

            // KORREKTUR: homePositions ist in board.homePositions
            const homePositions = this.board.homePositions[this.touchedPiece.playerId];

            if (homePositions) {
                const firstFreeHome = homePositions.find(pos =>
                    !this.pieces.some(p =>
                        p.playerId === this.touchedPiece.playerId &&
                        p.isHome &&
                        Math.abs(p.position.x - pos.x) < 0.1 &&
                        Math.abs(p.position.y - pos.y) < 0.1 &&
                        p.id !== this.touchedPiece.id
                    )
                );

                if (firstFreeHome) {
                    this.touchedPiece.position = firstFreeHome;
                    this.touchedPiece.isHome = true;
                    this.touchedPiece.pathIndex = -1;
                    this.updatePiecePosition(this.touchedPiece);

                    const svgPiece = document.getElementById(this.touchedPiece.id);
                    if (svgPiece) {
                        svgPiece.classList.add('in-home');
                    }
                }
            }
        }

        // Aktuellen Spieler deaktivieren
        this.players.players[this.currentPlayerIndex].active = false;

        // Nächsten Spieler bestimmen
        this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.players.length;
        this.players.players[this.currentPlayerIndex].active = true;

        // Reset für nächsten Spieler
        this.diceValue = 0;
        this.rollsThisTurn = 0;
        this.hasMovedThisTurn = false;
        this.dice.showDiceFace(1);
        this.mandatoryCapture = false;
        this.mandatoryMoveFromHome = false;
        this.touchedPiece = null;
        this.lastMoveWasMandatory = false;

        this.players.createPlayersInfo();
        this.startTurn();

        // Zustand nach Spielerwechsel speichern
        this.history.saveState();
    }

    restartGame() {
        if (confirm("Möchten Sie das Spiel wirklich neu starten? Der aktuelle Spielstand geht verloren.")) {
            this.showPlayerSelection();

            // Reset aller Daten
            this.players.reset();
            this.pieces = [];
            this.stats.resetStatistics();
            this.gameState = 'selection';
            this.currentPlayerIndex = -1;
            this.diceValue = 0;
            this.rollsThisTurn = 0;
            this.maxRolls = 3;
            this.selectedPiece = null;
            this.startRollsDone = 0;
            this.hasMovedThisTurn = false;
            this.isRolling = false;
            this.mandatoryCapture = false;
            this.mandatoryMoveFromHome = false;
            this.touchedPiece = null;
            this.lastMoveWasMandatory = false;

            // History zurücksetzen
            this.history.resetHistory();

            // UI zurücksetzen
            document.getElementById('start-dice-container').innerHTML = '';
            document.getElementById('game-status').textContent = "Regel 1: Bitte würfeln um die Startreihenfolge zu bestimmen";
            this.dice.showDiceFace(1);
            this.ui.updateRollCounter();
            this.stats.updateStatistics();
            this.history.updateHistoryButtons();
        }
    }

    // Getter für den aktuellen Spieler
    get currentPlayer() {
        return this.players.players[this.currentPlayerIndex];
    }
}