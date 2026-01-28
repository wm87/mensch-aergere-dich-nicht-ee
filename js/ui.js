export class UI {
    constructor(game) {
        this.game = game;

        // Akkordeon-Zustände
        this.accordionStates = {
            controls: true,   // Standardmäßig geöffnet
            options: false,
            stats: false
        };
    }

    // Akkordeons einrichten
    setupAccordions() {
        const accordions = [
            { id: 'controls', header: 'controls-header', content: 'controls-content' },
            { id: 'options', header: 'options-header', content: 'options-content' },
            { id: 'stats', header: 'stats-header', content: 'statistics-content' }
        ];

        accordions.forEach(acc => {
            const header = document.getElementById(acc.header);
            const content = document.getElementById(acc.content);

            // Initialen Zustand setzen
            if (this.accordionStates[acc.id]) {
                header.classList.add('active');
                content.classList.add('show');
            }

            header.addEventListener('click', () => {
                const isActive = header.classList.contains('active');
                header.classList.toggle('active', !isActive);
                content.classList.toggle('show', !isActive);
                this.accordionStates[acc.id] = !isActive;
            });
        });
    }

    // Akkordeon öffnen
    openAccordion(accordionId) {
        const accordions = {
            'controls': { header: 'controls-header', content: 'controls-content' },
            'options': { header: 'options-header', content: 'options-content' },
            'stats': { header: 'stats-header', content: 'statistics-content' }
        };

        const acc = accordions[accordionId];
        if (acc) {
            const header = document.getElementById(acc.header);
            const content = document.getElementById(acc.content);

            if (!header.classList.contains('active')) {
                header.classList.add('active');
                content.classList.add('show');
                this.accordionStates[accordionId] = true;
            }
        }
    }

    updateStatus(message, type = 'info') {
        const statusEl = document.getElementById('game-status');
        statusEl.textContent = message;

        // Typ-spezifisches Styling
        statusEl.classList.remove('important', 'mandatory');
        if (type === 'warning' || type === 'important') {
            statusEl.classList.add('important');
        } else if (type === 'error' || type === 'mandatory') {
            statusEl.classList.add('mandatory');
        }
    }

    updateRollCounter() {
        const counter = document.getElementById('roll-counter');
        counter.textContent = `Würfe: ${this.game.rollsThisTurn}/${this.game.maxRolls}`;
    }

    showLoading(show) {
        const spinner = document.getElementById('loading-spinner');
        spinner.classList.toggle('active', show);
    }

    getStatusMessage() {
        if (this.game.gameState === 'selection') {
            return "Wählen Sie die Spieleranzahl und Namen";
        }

        if (this.game.gameState === 'start_phase') {
            return "Regel 1: Bitte würfeln um die Startreihenfolge zu bestimmen";
        }

        if (this.game.gameState === 'finished') {
            const winner = this.game.players.players.find(p =>
                this.game.pieces.filter(piece => piece.playerId === p.id && piece.pathIndex >= 40).length === 4
            );
            return winner ? `🎉 ${winner.name} hat gewonnen! 🎉` : "Spiel beendet";
        }

        const player = this.game.currentPlayer;
        const hasPiecesOnBoardOrGoal = this.game.pieces.some(p =>
            p.playerId === player.id && !p.isHome
        );

        if (this.game.diceValue === 0) {
            return `${player.name} ist am Zug. ${!hasPiecesOnBoardOrGoal ? 'Regel 2: 3 Würfe möglich um eine 6 zu würfeln' : 'Regel 6: 1 Wurf möglich'}`;
        }

        return `${player.name} hat ${this.game.diceValue} gewürfelt. ${this.game.hasMovedThisTurn ? 'Bitte ziehen.' : 'Wähle eine Figur.'}`;
    }
}