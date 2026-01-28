export class PlayerManager {
    constructor(game) {
        this.game = game;

        // Spieleranzahl (2-4)
        this.playerCount = 4;
        this.playerNames = ['Spieler 1 (Blau)', 'Spieler 2 (Rot)', 'Spieler 3 (Gelb)', 'Spieler 4 (Grün)'];

        // Spieler-Array wird später basierend auf der Auswahl initialisiert
        this.players = [];

        // Spielkonfiguration für verschiedene Spieleranzahlen
        this.playerConfigs = {
            2: {
                playerIds: [2, 1], // Blau, Rot
                colors: ['#2196F3', '#F44336'],
                positions: ['Blau', 'Rot']
            },
            3: {
                playerIds: [2, 1, 3], // Blau, Rot, Gelb
                colors: ['#2196F3', '#F44336', '#FFC107'],
                positions: ['Blau', 'Rot', 'Gelb']
            },
            4: {
                playerIds: [2, 1, 3, 4], // Blau, Rot, Gelb, Grün
                colors: ['#2196F3', '#F44336', '#FFC107', '#4CAF50'],
                positions: ['Blau', 'Rot', 'Gelb', 'Grün']
            }
        };

        // LINEARE PFADE FÜR JEDEN SPIELER (44 Positionen)
        this.playerPaths = {};
    }

    initializePlayers() {
        this.players = [];
        const config = this.playerConfigs[this.playerCount];

        for (let i = 0; i < this.playerCount; i++) {
            this.players.push({
                id: config.playerIds[i],
                name: this.playerNames[i],
                color: config.colors[i],
                position: config.positions[i],
                startRoll: 0,
                active: false,
                stats: {
                    rolls: 0,
                    moves: 0,
                    captures: 0,
                    captured: 0,
                    sixes: 0,
                    piecesInGoal: 0
                }
            });
        }
    }

    createPlayerPaths() {
        this.playerPaths = {};

        // Nur Pfade für aktive Spieler erstellen
        this.players.forEach(player => {
            const playerId = player.id;
            const startIndex = this.game.board.startIndices[playerId];
            const path = [];

            for (let i = 0; i < 40; i++) {
                const pathIndex = (startIndex + i) % 40;
                path.push(this.game.board.boardPath[pathIndex]);
            }

            path.push(...this.game.board.goalPaths[playerId]);

            this.playerPaths[playerId] = path;
        });
    }

    updatePlayerNameInputs() {
        const playerCount = this.playerCount;
        for (let i = 0; i < 4; i++) {
            const input = document.getElementById(`player${i + 1}-name`);
            if (i < playerCount) {
                input.disabled = false;
                input.classList.remove('disabled');
                input.value = this.playerNames[i];
            } else {
                input.disabled = true;
                input.classList.add('disabled');
                input.value = '';
            }
        }
    }

    createPlayersInfo() {
        const container = document.getElementById('player-info');
        container.innerHTML = '';

        this.players.forEach((player, index) => {
            const playerEl = document.createElement('div');
            playerEl.className = `player ${player.active ? 'active' : ''}`;
            const piecesOnBoard = this.game.pieces.filter(p => p.playerId === player.id && !p.isHome && p.pathIndex < 40).length;
            const piecesInGoal = this.game.pieces.filter(p => p.playerId === player.id && p.pathIndex >= 40).length;
            const piecesInHome = this.game.pieces.filter(p => p.playerId === player.id && p.isHome).length;

            playerEl.innerHTML = `
                <div class="player-color" style="background:${player.color}"></div>
                <div class="player-details">
                    <div class="player-name">${player.name}</div>
                    <div class="player-stats">
                        <span><i class="fas fa-flag-checkered"></i> ${piecesInGoal}</span>
                        <span><i class="fas fa-chess-board"></i> ${piecesOnBoard}</span>
                        <span><i class="fas fa-home"></i> ${piecesInHome}</span>
                    </div>
                </div>
            `;
            container.appendChild(playerEl);
        });
    }

    reset() {
        this.players = [];
        this.playerNames = ['Spieler 1 (Blau)', 'Spieler 2 (Rot)', 'Spieler 3 (Gelb)', 'Spieler 4 (Grün)'];
        this.playerCount = 4;
        this.playerPaths = {};
    }
}