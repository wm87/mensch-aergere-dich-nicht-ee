export class SaveLoadManager {
    constructor(game) {
        this.game = game;

        // Speicher-Slots (im LocalStorage)
        this.saveSlots = Array(5).fill(null);
        this.selectedSaveSlot = 0;
        this.dialogMode = 'save'; // 'save' oder 'load'
    }

    // Speicher-Slots aus LocalStorage laden
    loadSaveSlots() {
        try {
            const savedSlots = localStorage.getItem('mensch_aergere_save_slots');
            if (savedSlots) {
                this.saveSlots = JSON.parse(savedSlots);
            }
        } catch (e) {
            console.log('Keine gespeicherten Spielstände gefunden');
        }
    }

    // Speicher-Slots in LocalStorage speichern
    saveSaveSlots() {
        try {
            localStorage.setItem('mensch_aergere_save_slots', JSON.stringify(this.saveSlots));
            return true;
        } catch (e) {
            console.error('Fehler beim Speichern der Spielstände:', e);
            return false;
        }
    }

    // Spielstand speichern
    saveGame(slotIndex) {
        if (slotIndex < 0 || slotIndex >= this.saveSlots.length) return false;

        const gameState = this.getGameState();

        this.saveSlots[slotIndex] = {
            ...gameState,
            saveTime: new Date().toISOString(),
            saveName: `Spielstand ${slotIndex + 1}`,
            playerCount: this.game.players.playerCount,
            playerNames: this.game.players.players.map(p => p.name),
            gameVersion: '1.0'
        };

        const success = this.saveSaveSlots();
        if (success) {
            this.game.ui.updateStatus(`Spiel gespeichert in Slot ${slotIndex + 1}`, 'success');
        } else {
            this.game.ui.updateStatus('Fehler beim Speichern des Spielstands!', 'error');
        }
        return success;
    }

    // Spielstand laden
    loadGame(slotIndex) {
        if (slotIndex < 0 || slotIndex >= this.saveSlots.length) return false;

        const savedGame = this.saveSlots[slotIndex];
        if (!savedGame) {
            this.game.ui.updateStatus(`Kein Spielstand in Slot ${slotIndex + 1} gefunden`, 'info');
            return false;
        }

        this.game.ui.showLoading(true);
        setTimeout(() => {
            try {
                this.loadGameState(savedGame);
                this.game.ui.updateStatus(`Spiel aus Slot ${slotIndex + 1} geladen`, 'success');
            } catch (e) {
                console.error('Fehler beim Laden des Spielstands:', e);
                this.game.ui.updateStatus('Fehler beim Laden des Spielstands!', 'error');
            } finally {
                this.game.ui.showLoading(false);
            }
        }, 500);

        return true;
    }

    // Kompletten Spielzustand erfassen
    getGameState() {
        try {
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
                playerCount: this.game.players.playerCount,
                playerPaths: this.game.players.playerPaths,
                playerConfig: this.game.players.playerConfigs[this.game.players.playerCount]
            };

            // Date-String für Spielzeit
            if (state.statistics.gameStartTime) {
                state.statistics.gameStartTime = this.game.stats.statistics.gameStartTime.toISOString();
            }

            // Bereinigung für bessere Performance
            delete state.history;
            delete state.historyIndex;

            return state;
        } catch (error) {
            console.error('Fehler beim Serialisieren des Spielzustands:', error);
            // Minimalen Zustand zurückgeben
            return {
                players: [],
                pieces: [],
                statistics: { totalRolls: 0, totalMoves: 0, totalCaptures: 0 },
                currentPlayerIndex: -1,
                gameState: 'selection'
            };
        }
    }

    // Spielzustand laden
    loadGameState(state) {
        try {
            // Grundlegende Eigenschaften laden
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
            this.game.players.playerCount = state.playerCount;
            this.game.players.playerPaths = state.playerPaths || {};

            // Date-String zurück in Date-Objekt konvertieren
            if (this.game.stats.statistics.gameStartTime && typeof this.game.stats.statistics.gameStartTime === 'string') {
                this.game.stats.statistics.gameStartTime = new Date(this.game.stats.statistics.gameStartTime);
            }

            // WICHTIG: Player-Config neu setzen basierend auf Spieleranzahl
            if (this.game.players.playerCount && [2, 3, 4].includes(this.game.players.playerCount)) {
                const config = this.game.players.playerConfigs[this.game.players.playerCount];
                if (config) {
                    // Spieler-IDs und Pfade neu initialisieren
                    this.game.players.players.forEach((player, index) => {
                        if (index < config.playerIds.length) {
                            player.id = config.playerIds[index];
                            player.color = config.colors[index];
                            player.position = config.positions[index];
                        }
                    });
                }
            }

            // Player-Pfade NEU erstellen (wichtig für die Spielfiguren)
            this.game.players.createPlayerPaths();

            // Player-Pfade den Spielfiguren zuweisen
            this.game.pieces.forEach(piece => {
                if (this.game.players.playerPaths[piece.playerId]) {
                    piece.playerPath = this.game.players.playerPaths[piece.playerId];
                }
            });

            // UI aktualisieren
            this.game.board.createBoard();
            this.game.board.createGamePieces(); // WICHTIG: Erstellt die SVG-Elemente neu
            this.game.players.createPlayersInfo();
            this.game.dice.showDiceFace(this.game.diceValue);
            this.game.ui.updateRollCounter();
            this.game.ui.updateStatus(this.game.ui.getStatusMessage());
            this.game.stats.updateStatistics();

            // Buttons aktualisieren
            this.game.history.updateHistoryButtons();

            // Start-Phase verstecken, wenn Spiel bereits läuft
            if (this.game.gameState === 'playing') {
                document.getElementById('start-phase').style.display = 'none';
                document.getElementById('roll-btn').disabled = this.game.hasMovedThisTurn;
            } else if (this.game.gameState === 'start_phase') {
                document.getElementById('start-phase').style.display = 'block';
                document.getElementById('roll-btn').disabled = true;
            }

            // Player Selection verstecken
            document.getElementById('player-selection').style.display = 'none';
            document.querySelector('.main-layout').style.display = 'grid';

            return true;
        } catch (error) {
            console.error('Fehler beim Laden des Spielstands:', error);
            this.game.ui.updateStatus('Fehler beim Laden des Spielstands!', 'error');
            return false;
        }
    }

    // Save-Dialog anzeigen
    showSaveDialog() {
        this.dialogMode = 'save';
        const dialog = document.getElementById('save-dialog');
        const title = document.getElementById('dialog-title');
        const actionBtn = document.getElementById('dialog-action-btn');

        title.innerHTML = '<i class="fas fa-save"></i> Spielstand speichern';
        actionBtn.textContent = 'Speichern';
        actionBtn.onclick = () => this.handleDialogAction();

        this.updateSaveSlotsDisplay();
        dialog.classList.add('active');
        this.selectedSaveSlot = 0;

        // Akkordeon für Spieloptionen öffnen
        this.game.ui.openAccordion('options');
    }

    // Load-Dialog anzeigen
    showLoadDialog() {
        this.dialogMode = 'load';
        const dialog = document.getElementById('save-dialog');
        const title = document.getElementById('dialog-title');
        const actionBtn = document.getElementById('dialog-action-btn');

        title.innerHTML = '<i class="fas fa-folder-open"></i> Spielstand laden';
        actionBtn.textContent = 'Laden';

        this.updateSaveSlotsDisplay();
        dialog.classList.add('active');
        this.selectedSaveSlot = 0;

        // Akkordeon für Spieloptionen öffnen
        this.game.ui.openAccordion('options');
    }

    // Save-Slots Anzeige aktualisieren
    updateSaveSlotsDisplay() {
        const container = document.getElementById('save-slots-container');
        container.innerHTML = '';

        const isLoadMode = this.dialogMode === 'load';

        this.saveSlots.forEach((slot, index) => {
            // Im Load-Modus leere Slots überspringen
            if (isLoadMode && !slot) return;

            const slotElement = document.createElement('div');
            slotElement.className = 'save-slot';
            slotElement.dataset.index = index;

            if (slot) {
                const saveDate = new Date(slot.saveTime);
                const playerCount = slot.playerCount || '?';
                const activePlayer = slot.players ? slot.players.find(p => p.active)?.name || '-' : '-';
                const piecesInGoal = slot.pieces ? slot.pieces.filter(p => p.pathIndex >= 40).length : 0;

                slotElement.innerHTML = `
                    <div class="save-slot-header">
                        <div class="save-slot-title">${slot.saveName || `Spielstand ${index + 1}`}</div>
                        <div class="save-slot-date">${saveDate.toLocaleDateString()} ${saveDate.toLocaleTimeString()}</div>
                    </div>
                    <div class="save-slot-details">
                        <strong>Spieler:</strong> ${playerCount}<br>
                        <strong>Aktiver Spieler:</strong> ${activePlayer}<br>
                        <strong>Figuren im Ziel:</strong> ${piecesInGoal}/${playerCount * 4}<br>
                        <strong>Spielzeit:</strong> ${this.formatTime(slot.statistics?.currentGameTime || 0)}
                    </div>
                `;
            } else {
                slotElement.innerHTML = `
                    <div class="save-slot-header">
                        <div class="save-slot-title">Leerer Slot ${index + 1}</div>
                    </div>
                    <div class="save-slot-details">
                        Klicken um hier zu speichern
                    </div>
                `;
            }

            slotElement.addEventListener('click', () => {
                document.querySelectorAll('.save-slot').forEach(s => s.classList.remove('selected'));
                slotElement.classList.add('selected');
                this.selectedSaveSlot = index;
            });

            container.appendChild(slotElement);
        });

        // Im Load-Modus: Falls keine Slots vorhanden
        if (isLoadMode && container.children.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">Keine gespeicherten Spielstände gefunden.</p>';
        }

        // Ersten Slot selektieren, falls vorhanden
        const firstSlot = container.querySelector('.save-slot');
        if (firstSlot) {
            firstSlot.classList.add('selected');
            this.selectedSaveSlot = parseInt(firstSlot.dataset.index);
        }
    }

    // Save-Dialog verstecken
    hideSaveDialog() {
        document.getElementById('save-dialog').classList.remove('active');
    }

    // Dialog-Aktion (Speichern oder Laden)
    handleDialogAction() {
        if (this.dialogMode === 'save') {
            if (this.saveGame(this.selectedSaveSlot)) {
                this.hideSaveDialog();
            }
        } else {
            // Kein confirm mehr hier - direkt laden
            if (this.loadGame(this.selectedSaveSlot)) {
                this.hideSaveDialog();
            }
        }
    }

    // Zeit formatieren
    formatTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
}