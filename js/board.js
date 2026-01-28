export class Board {
    constructor(game) {
        this.game = game;

        // KORREKTE STARTFELDER IN DEN ECKEN:
        this.homePositions = {
            1: [ // ROTE Startfelder oben rechts
                { x: 9.5, y: 0.5 }, { x: 10.5, y: 0.5 },
                { x: 9.5, y: 1.5 }, { x: 10.5, y: 1.5 }
            ],
            2: [ // BLAUE Startfelder oben links
                { x: 0.5, y: 0.5 }, { x: 1.5, y: 0.5 },
                { x: 0.5, y: 1.5 }, { x: 1.5, y: 1.5 }
            ],
            3: [ // GELBE Startfelder unten rechts
                { x: 9.5, y: 9.5 }, { x: 10.5, y: 9.5 },
                { x: 9.5, y: 10.5 }, { x: 10.5, y: 10.5 }
            ],
            4: [ // GRÜNE Startfelder unten links
                { x: 0.5, y: 9.5 }, { x: 1.5, y: 9.5 },
                { x: 0.5, y: 10.5 }, { x: 1.5, y: 10.5 }
            ]
        };

        // SPIELPFAD (40 Felder Laufbahn + 4 Zielfelder = 44 Positionen)
        this.boardPath = [
            { x: 4.5, y: 0.5 },  // 0
            { x: 5.5, y: 0.5 },  // 1
            { x: 6.5, y: 0.5 },  // 2: Rot START
            { x: 6.5, y: 1.5 },  // 3
            { x: 6.5, y: 2.5 },  // 4
            { x: 6.5, y: 3.5 },  // 5
            { x: 6.5, y: 4.5 },  // 6
            { x: 7.5, y: 4.5 },  // 7
            { x: 8.5, y: 4.5 },  // 8
            { x: 9.5, y: 4.5 },  // 9
            { x: 10.5, y: 4.5 }, // 10
            { x: 10.5, y: 5.5 }, // 11
            { x: 10.5, y: 6.5 }, // 12: Gelb START
            { x: 9.5, y: 6.5 },  // 13
            { x: 8.5, y: 6.5 },  // 14
            { x: 7.5, y: 6.5 },  // 15
            { x: 6.5, y: 6.5 },  // 16
            { x: 6.5, y: 7.5 },  // 17
            { x: 6.5, y: 8.5 },  // 18
            { x: 6.5, y: 9.5 },  // 19
            { x: 6.5, y: 10.5 }, // 20
            { x: 5.5, y: 10.5 }, // 21
            { x: 4.5, y: 10.5 }, // 22: Grün START
            { x: 4.5, y: 9.5 },  // 23
            { x: 4.5, y: 8.5 },  // 24
            { x: 4.5, y: 7.5 },  // 25
            { x: 4.5, y: 6.5 },  // 26
            { x: 3.5, y: 6.5 },  // 27
            { x: 2.5, y: 6.5 },  // 28
            { x: 1.5, y: 6.5 },  // 29
            { x: 0.5, y: 6.5 },  // 30
            { x: 0.5, y: 5.5 },  // 31
            { x: 0.5, y: 4.5 },  // 32: Blau START
            { x: 1.5, y: 4.5 },  // 33
            { x: 2.5, y: 4.5 },  // 34
            { x: 3.5, y: 4.5 },  // 35
            { x: 4.5, y: 4.5 },  // 36
            { x: 4.5, y: 3.5 },  // 37
            { x: 4.5, y: 2.5 },  // 38
            { x: 4.5, y: 1.5 }   // 39: Letztes Feld vor der Zielgerade
        ];

        // STARTINDIZES:
        this.startIndices = {
            1: 2,   // Rot startet auf Feld 2
            2: 32,  // Blau startet auf Feld 32
            3: 12,  // Gelb startet auf Feld 12
            4: 22   // Grün startet auf Feld 22
        };

        // ZIELFELDER (Regel 14: von außen nach innen) - SICHTBARE FARBEN
        this.goalPaths = {
            1: [ // Rot Ziel (oben) - helles Rot
                { x: 5.5, y: 1.5 }, { x: 5.5, y: 2.5 },
                { x: 5.5, y: 3.5 }, { x: 5.5, y: 4.5 }
            ],
            2: [ // Blau Ziel (links) - helles Blau
                { x: 1.5, y: 5.5 }, { x: 2.5, y: 5.5 },
                { x: 3.5, y: 5.5 }, { x: 4.5, y: 5.5 }
            ],
            3: [ // Gelb Ziel (rechts) - helles Gelb
                { x: 9.5, y: 5.5 }, { x: 8.5, y: 5.5 },
                { x: 7.5, y: 5.5 }, { x: 6.5, y: 5.5 }
            ],
            4: [ // Grün Ziel (unten) - helles Grün
                { x: 5.5, y: 9.5 }, { x: 5.5, y: 8.5 },
                { x: 5.5, y: 7.5 }, { x: 5.5, y: 6.5 }
            ]
        };
    }

    createBoard() {
        const board = document.getElementById('game-board');
        board.innerHTML = '';

        // Hintergrund
        board.innerHTML += '<rect width="11" height="11" fill="#f5e5c8"/>';

        // Schriftzug
        board.innerHTML += `
            <text x="1.5" y="3.0" class="board-title" font-size="0.85" text-anchor="start">Mensch</text>
            <text x="9.5" y="3.0" class="board-title" font-size="0.85" text-anchor="end">ärgere</text>
            <text x="1.5" y="8.5" class="board-title" font-size="0.85" text-anchor="start">Dich</text>
            <text x="9.5" y="8.5" class="board-title" font-size="0.85" text-anchor="end">nicht!</text>
        `;

        // Weiße Spielfelder (40 Felder)
        board.innerHTML += '<g>';
        this.boardPath.forEach(pos => {
            board.innerHTML += `<circle cx="${pos.x}" cy="${pos.y}" r="0.45" fill="white" stroke="black" stroke-width="0.05"/>`;
        });
        board.innerHTML += '</g>';

        // Startfelder farblich markieren (nur für aktive Spieler)
        board.innerHTML += '<g>';
        this.game.players.players.forEach(player => {
            const startIndex = this.startIndices[player.id];
            const startPos = this.boardPath[startIndex];

            // Farbe basierend auf Spielerfarbe
            let fillColor;
            switch (player.id) {
                case 1: fillColor = '#ff9999'; break; // Rot
                case 2: fillColor = '#9999ff'; break; // Blau
                case 3: fillColor = '#ffed99'; break; // Gelb
                case 4: fillColor = '#99dd99'; break; // Grün
                default: fillColor = '#cccccc';
            }

            board.innerHTML += `<circle cx="${startPos.x}" cy="${startPos.y}" r="0.45" fill="${fillColor}" stroke="black" stroke-width="0.05"/>`;
        });
        board.innerHTML += '</g>';

        // ZIELFELDER - JETZT SICHTBAR FÜR ALLE SPIELER
        board.innerHTML += '<g stroke="black" stroke-width="0.05">';

        // Für 2 Spieler: Blau und Rot
        if (this.game.players.playerCount >= 2) {
            // Blau Ziel (links)
            board.innerHTML += '<circle cx="1.5" cy="5.5" r="0.45" fill="#ccccff"/>';
            board.innerHTML += '<circle cx="2.5" cy="5.5" r="0.45" fill="#ccccff"/>';
            board.innerHTML += '<circle cx="3.5" cy="5.5" r="0.45" fill="#ccccff"/>';
            board.innerHTML += '<circle cx="4.5" cy="5.5" r="0.45" fill="#ccccff"/>';

            // Rot Ziel (oben)
            board.innerHTML += '<circle cx="5.5" cy="1.5" r="0.45" fill="#ffcccc"/>';
            board.innerHTML += '<circle cx="5.5" cy="2.5" r="0.45" fill="#ffcccc"/>';
            board.innerHTML += '<circle cx="5.5" cy="3.5" r="0.45" fill="#ffcccc"/>';
            board.innerHTML += '<circle cx="5.5" cy="4.5" r="0.45" fill="#ffcccc"/>';
        }

        // Für 3 Spieler: zusätzlich Gelb
        if (this.game.players.playerCount >= 3) {
            // Gelb Ziel (rechts)
            board.innerHTML += '<circle cx="9.5" cy="5.5" r="0.45" fill="#ffffcc"/>';
            board.innerHTML += '<circle cx="8.5" cy="5.5" r="0.45" fill="#ffffcc"/>';
            board.innerHTML += '<circle cx="7.5" cy="5.5" r="0.45" fill="#ffffcc"/>';
            board.innerHTML += '<circle cx="6.5" cy="5.5" r="0.45" fill="#ffffcc"/>';
        }

        // Für 4 Spieler: zusätzlich Grün
        if (this.game.players.playerCount >= 4) {
            // Grün Ziel (unten)
            board.innerHTML += '<circle cx="5.5" cy="9.5" r="0.45" fill="#ccffcc"/>';
            board.innerHTML += '<circle cx="5.5" cy="8.5" r="0.45" fill="#ccffcc"/>';
            board.innerHTML += '<circle cx="5.5" cy="7.5" r="0.45" fill="#ccffcc"/>';
            board.innerHTML += '<circle cx="5.5" cy="6.5" r="0.45" fill="#ccffcc"/>';
        }

        board.innerHTML += '</g>';
    }

    createGamePieces() {
        const board = document.getElementById('game-board');

        // Alte Spielsteine entfernen
        document.querySelectorAll('.game-piece').forEach(p => p.remove());

        // Wenn pieces leer sind (Neustart), initiale Steine erstellen
        if (this.game.pieces.length === 0) {
            this.game.pieces = [];
            this.game.players.players.forEach(player => {
                const homePositions = this.homePositions[player.id];
                const playerPath = this.game.players.playerPaths[player.id];

                for (let i = 0; i < 4; i++) {
                    const piece = {
                        id: `piece-${player.id}-${i}`,
                        playerId: player.id,
                        position: homePositions[i],
                        isHome: true,
                        pathIndex: -1,
                        playerPath: playerPath
                    };

                    this.game.pieces.push(piece);
                }
            });
        }

        // SVG-Elemente für alle pieces erstellen
        this.game.pieces.forEach(piece => {
            const player = this.game.players.players.find(p => p.id === piece.playerId);
            if (!player) return;

            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('id', piece.id);
            circle.setAttribute('cx', piece.position.x.toString());
            circle.setAttribute('cy', piece.position.y.toString());
            circle.setAttribute('r', '0.42');
            circle.setAttribute('fill', player.color);
            circle.setAttribute('stroke', '#333');
            circle.setAttribute('stroke-width', '0.05');
            circle.classList.add('game-piece');

            if (piece.isHome) {
                circle.classList.add('in-home');
            }

            circle.addEventListener('click', () => this.game.handlePieceClick(piece));
            board.appendChild(circle);
        });
    }
}