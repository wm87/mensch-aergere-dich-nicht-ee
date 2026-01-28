export class Statistics {
    constructor(game) {
        this.game = game;
        this.updateTimeout = null;
        this.lastUpdate = 0;

        // Erweiterte Statistik
        this.statistics = {
            totalRolls: 0,
            totalMoves: 0,
            totalCaptures: 0,
            sixesRolled: 0,
            gameStartTime: null,
            currentGameTime: 0,
            playerStats: {},
            gameState: 'not_started',
            achievements: []
        };
    }

    // Spielzeit aktualisieren
    updateGameTime() {
        if (this.statistics.gameStartTime && this.game.gameState !== 'selection' && this.game.gameState !== 'finished') {
            const now = new Date();
            this.statistics.currentGameTime = Math.floor((now - this.statistics.gameStartTime) / 1000);
            this.updateStatistics();
        }
    }

    // Formatierte Spielzeit
    getFormattedGameTime() {
        const seconds = this.statistics.currentGameTime;
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    // KORRIGIERTE Führungsberechnung - EINFACH UND RICHTIG
    calculateLeader() {
        const playerProgress = [];

        // Null-Sicherheit
        if (!this.game.players || !this.game.players.players) {
            return playerProgress;
        }

        this.game.players.players.forEach(player => {
            // Alle Figuren dieses Spielers
            const pieces = this.game.pieces.filter(p => p.playerId === player.id);

            // Summe aller bereits gelaufenen Felder berechnen
            let totalSteps = 0;
            let piecesInGoal = 0;

            pieces.forEach(piece => {
                // Figur im Ziel (Feld 40-43) zählt 40 Grundfelder + Zielfelder
                if (piece.pathIndex >= 40) {
                    totalSteps += 40 + (piece.pathIndex - 40 + 1); // 40 + Zielfeldnummer (1-4)
                    piecesInGoal++;
                }
                // Figur auf dem Spielfeld
                else if (piece.pathIndex >= 0 && !piece.isHome) {
                    totalSteps += piece.pathIndex + 1; // +1 weil Index 0 = Feld 1
                }
                // Figur bereits rausgewürfelt? (außerhalb vom Haus aber pathIndex < 0 nicht möglich)
                // Figur im Haus zählt 0
            });

            // Maximale mögliche Schritte: 4 Figuren * 44 Felder = 176
            const maxPossibleSteps = 4 * 44;
            const progressPercentage = (totalSteps / maxPossibleSteps) * 100;

            playerProgress.push({
                player,
                piecesInGoal,
                totalSteps,
                progressPercentage,
                rank: 1
            });
        });

        // Nach totalSteps absteigend sortieren (meiste Schritte = bester Fortschritt)
        playerProgress.sort((a, b) => b.totalSteps - a.totalSteps);

        // Ränge zuweisen
        playerProgress.forEach((item, index) => {
            item.rank = index + 1;
        });

        return playerProgress;
    }

    // KORRIGIERT: Führungsvorsprung berechnen
    calculateLeadGap(leaderboard) {
        if (!leaderboard || leaderboard.length < 2) {
            return 0;
        }

        const leader = leaderboard[0];
        const second = leaderboard[1];

        // Einfache Subtraktion: Schritte des Ersten minus Schritte des Zweiten
        return leader.totalSteps - second.totalSteps;
    }

    // Leaderboard als HTML
    getLeaderboardHtml(leaderboard) {
        if (!leaderboard || leaderboard.length === 0) {
            return '<div class="no-data">Keine Spielerdaten verfügbar</div>';
        }

        // Vorsprung berechnen
        const leadGap = this.calculateLeadGap(leaderboard);

        return leaderboard.map((item, index) => {
            // Fortschritt in Prozent (maximal 176 Schritte = 100%)
            const progressPercent = Math.min(100, (item.totalSteps / 176) * 100);

            // Besondere Klassen für den Führenden
            const isLeader = index === 0;
            const leaderClass = isLeader ? 'leader' : '';
            const leaderInfo = isLeader && leaderboard.length > 1
                ? `<div class="lead-info">Vorsprung: ${leadGap} Feld${leadGap !== 1 ? 'er' : ''}</div>`
                : '';

            return `
                <div class="leaderboard-item ${leaderClass}">
                    <div class="leaderboard-rank">${item.rank}.</div>
                    <div class="leaderboard-name" style="color: ${item.player.color}">
                        ${item.player.name}
                        ${isLeader ? '<i class="fas fa-crown"></i>' : ''}
                    </div>
                    <div class="leaderboard-stats">
                        <div class="step-count">${item.totalSteps} Schritte</div>
                        <div class="pieces-goal">${item.piecesInGoal}/4 im Ziel</div>
                    </div>
                    <div class="leaderboard-progress">
                        <div class="progress-bar" style="width: ${progressPercent}%"></div>
                    </div>
                    ${leaderInfo}
                </div>
            `;
        }).join('');
    }

    // Statistik für einzelnen Spieler aktualisieren
    updatePlayerStats(playerId, stats) {
        if (!this.statistics.playerStats[playerId]) {
            this.statistics.playerStats[playerId] = {
                rolls: 0,
                moves: 0,
                captures: 0,
                sixesRolled: 0,
                failedAttempts: 0,
                longestMove: 0,
                totalSteps: 0
            };
        }

        const playerStats = this.statistics.playerStats[playerId];
        if (stats.rolls) playerStats.rolls += stats.rolls;
        if (stats.moves) playerStats.moves += stats.moves;
        if (stats.captures) playerStats.captures += stats.captures;
        if (stats.sixesRolled) playerStats.sixesRolled += stats.sixesRolled;
        if (stats.failedAttempts) playerStats.failedAttempts += stats.failedAttempts;
        if (stats.longestMove && stats.longestMove > playerStats.longestMove) {
            playerStats.longestMove = stats.longestMove;
        }
        if (stats.steps) playerStats.totalSteps += stats.steps;
    }

    // Erfolge/Trophäen prüfen
    checkAchievements() {
        const achievements = [];
        const globalStats = this.loadGlobalStats();

        // Spielbezogene Erfolge
        if (this.statistics.totalCaptures >= 5) {
            achievements.push({
                name: 'Aggressor',
                description: '5 Figuren in einem Spiel geschlagen',
                icon: 'fa-crosshairs'
            });
        }

        if (this.statistics.sixesRolled >= 3) {
            achievements.push({
                name: 'Glückspilz',
                description: '3 Sechser in einem Spiel gewürfelt',
                icon: 'fa-dice-six'
            });
        }

        // Globale Erfolge
        if (globalStats.totalWins >= 10) {
            achievements.push({
                name: 'Veteran',
                description: '10 Spiele gewonnen',
                icon: 'fa-medal'
            });
        }

        if (globalStats.gamesPlayed >= 25) {
            achievements.push({
                name: 'Spielernatur',
                description: '25 Spiele gespielt',
                icon: 'fa-gamepad'
            });
        }

        if (globalStats.totalRolls >= 1000) {
            achievements.push({
                name: 'Würfelmeister',
                description: '1000 Würfe gesammelt',
                icon: 'fa-dice'
            });
        }

        // Nur einzigartige Erfolge zurückgeben
        const uniqueAchievements = achievements.filter((achievement, index, self) =>
            index === self.findIndex((a) => a.name === achievement.name)
        );

        this.statistics.achievements = uniqueAchievements;
        return uniqueAchievements;
    }

    // Berechnung der durchschnittlichen Spielzeit
    calculateAverageGameTime() {
        const globalStats = this.loadGlobalStats();
        if (globalStats.gamesPlayed > 0 && globalStats.gameTimes && globalStats.gameTimes.length > 0) {
            const sum = globalStats.gameTimes.reduce((a, b) => a + b, 0);
            return Math.floor(sum / globalStats.gameTimes.length);
        }
        return 0;
    }

    // Standard-Statistikwerte
    getDefaultStats() {
        return {
            totalWins: 0,
            totalRolls: 0,
            totalMoves: 0,
            gamesPlayed: 0,
            winners: [],
            gameTimes: [],
            totalGameTime: 0,
            fastestWin: null,
            longestGame: 0
        };
    }

    // Globale Statistiken laden
    loadGlobalStats() {
        try {
            const saved = localStorage.getItem('mensch_aergere_global_stats');
            if (saved) {
                const stats = JSON.parse(saved);

                // Komplette Validierung aller Felder
                return {
                    totalWins: Number(stats.totalWins) || 0,
                    totalRolls: Number(stats.totalRolls) || 0,
                    totalMoves: Number(stats.totalMoves) || 0,
                    gamesPlayed: Number(stats.gamesPlayed) || 0,
                    winners: Array.isArray(stats.winners) ? stats.winners : [],
                    gameTimes: Array.isArray(stats.gameTimes) ? stats.gameTimes : [],
                    totalGameTime: Number(stats.totalGameTime) || 0,
                    fastestWin: stats.fastestWin || null,
                    longestGame: Number(stats.longestGame) || 0
                };
            }
        } catch (e) {
            console.error('Fehler beim Laden der Statistiken:', e);
        }

        return this.getDefaultStats();
    }

    // Globale Statistiken speichern
    saveGlobalStats(stats) {
        try {
            localStorage.setItem('mensch_aergere_global_stats', JSON.stringify(stats));
            return true;
        } catch (e) {
            console.error('Fehler beim Speichern der globalen Statistiken:', e);
            return false;
        }
    }

    // Globale Statistiken zurücksetzen
    resetGlobalStats() {
        const defaultStats = this.getDefaultStats();
        this.saveGlobalStats(defaultStats);
        return defaultStats;
    }

    // Gewinner in Statistiken speichern
    recordWin(winnerName, gameTime) {
        if (!winnerName || winnerName.trim() === '') {
            console.error('Kein Gewinnername angegeben');
            return false;
        }

        const stats = this.loadGlobalStats();

        // Validierung der Daten
        if (typeof stats.totalWins !== 'number') stats.totalWins = 0;
        if (typeof stats.gamesPlayed !== 'number') stats.gamesPlayed = 0;
        if (!Array.isArray(stats.winners)) stats.winners = [];
        if (!Array.isArray(stats.gameTimes)) stats.gameTimes = [];

        // Sieg zählen
        stats.totalWins++;
        stats.gamesPlayed++;

        // Spielzeit speichern
        const currentGameTime = gameTime || this.statistics.currentGameTime;
        if (currentGameTime > 0) {
            stats.gameTimes.push(currentGameTime);
            stats.totalGameTime += currentGameTime;

            // Rekorde aktualisieren
            if (!stats.fastestWin || currentGameTime < stats.fastestWin.time) {
                stats.fastestWin = { name: winnerName, time: currentGameTime };
            }
            if (currentGameTime > stats.longestGame) {
                stats.longestGame = currentGameTime;
            }

            // Nur die letzten 100 Spielzeiten behalten
            if (stats.gameTimes.length > 100) {
                const removedTime = stats.gameTimes.shift();
                stats.totalGameTime -= removedTime;
            }
        }

        // Gewinner in Liste aktualisieren
        let winnerEntry = stats.winners.find(w => w.name === winnerName);
        if (winnerEntry) {
            winnerEntry.wins++;
        } else {
            stats.winners.push({ name: winnerName, wins: 1 });
        }

        // Nach Anzahl Siege sortieren
        stats.winners.sort((a, b) => b.wins - a.wins);

        // Aktuelle Spielstatistik zu globalen Statistiken hinzufügen
        stats.totalRolls += this.statistics.totalRolls;
        stats.totalMoves += this.statistics.totalMoves;

        this.saveGlobalStats(stats);
        return true;
    }

    // Statistiken exportieren
    exportStats() {
        const globalStats = this.loadGlobalStats();
        const exportData = {
            ...globalStats,
            exportDate: new Date().toISOString(),
            exportVersion: '2.0'
        };

        const dataStr = JSON.stringify(exportData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

        const exportFileDefaultName = `maedn_stats_${new Date().toISOString().split('T')[0]}.json`;

        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        document.body.appendChild(linkElement);
        linkElement.click();
        document.body.removeChild(linkElement);

        return true;
    }

    // Statistiken importieren
    importStats(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const importedStats = JSON.parse(e.target.result);

                    // Grundlegende Validierung
                    if (!importedStats || typeof importedStats !== 'object') {
                        reject('Ungültige Datei');
                        return;
                    }

                    // Optionale: Version prüfen
                    if (importedStats.exportVersion && importedStats.exportVersion !== '2.0') {
                        if (!confirm('Diese Statistikdatei stammt von einer anderen Version. Trotzdem importieren?')) {
                            reject('Import abgebrochen');
                            return;
                        }
                    }

                    // Wichtige Felder validieren
                    const validatedStats = {
                        totalWins: Number(importedStats.totalWins) || 0,
                        totalRolls: Number(importedStats.totalRolls) || 0,
                        totalMoves: Number(importedStats.totalMoves) || 0,
                        gamesPlayed: Number(importedStats.gamesPlayed) || 0,
                        winners: Array.isArray(importedStats.winners) ? importedStats.winners : [],
                        gameTimes: Array.isArray(importedStats.gameTimes) ? importedStats.gameTimes : [],
                        totalGameTime: Number(importedStats.totalGameTime) || 0,
                        fastestWin: importedStats.fastestWin || null,
                        longestGame: Number(importedStats.longestGame) || 0
                    };

                    this.saveGlobalStats(validatedStats);
                    resolve(true);
                } catch (error) {
                    reject('Fehler beim Parsen der Datei: ' + error.message);
                }
            };
            reader.onerror = () => reject('Fehler beim Lesen der Datei');
            reader.readAsText(file);
        });
    }

    // Datenvalidierung
    validateStats(stats) {
        return stats &&
            typeof stats.totalWins === 'number' &&
            typeof stats.totalRolls === 'number' &&
            typeof stats.totalMoves === 'number' &&
            typeof stats.gamesPlayed === 'number' &&
            Array.isArray(stats.winners) &&
            Array.isArray(stats.gameTimes);
    }

    // Erweiterte Statistik anzeigen
    updateStatistics(immediate = false) {
        const now = Date.now();

        // Debouncing: Maximal alle 500ms aktualisieren
        if (!immediate && now - this.lastUpdate < 500) {
            if (this.updateTimeout) clearTimeout(this.updateTimeout);
            this.updateTimeout = setTimeout(() => this.updateStatistics(true), 500);
            return;
        }

        this.lastUpdate = now;

        const content = document.getElementById('statistics-content');
        if (!content) return;

        // Führungsberechnung
        const leaderboard = this.calculateLeader();
        const leader = leaderboard.length > 0 ? leaderboard[0] : null;
        const second = leaderboard.length > 1 ? leaderboard[1] : null;
        const leadGap = this.calculateLeadGap(leaderboard);

        // Erfolge prüfen
        const achievements = this.checkAchievements();

        // Globale Statistiken aus localStorage laden
        const globalStats = this.loadGlobalStats();

        // Durchschnittliche Spielzeit berechnen
        const avgGameTime = this.calculateAverageGameTime();
        const avgGameTimeFormatted = avgGameTime > 0 ?
            `${Math.floor(avgGameTime / 60)}:${(avgGameTime % 60).toString().padStart(2, '0')}` :
            '-';

        // Gewinnerliste erstellen
        let winnersHtml = '';
        if (globalStats.winners && globalStats.winners.length > 0) {
            winnersHtml = globalStats.winners.slice(0, 5).map(winner =>
                `<div class="winner-history-item">
                    <span class="winner-name">${winner.name}</span>
                    <span class="winner-count">${winner.wins} Sieg${winner.wins !== 1 ? 'e' : ''}</span>
                 </div>`
            ).join('');
        } else {
            winnersHtml = '<div class="no-winners">Noch keine Siege</div>';
        }

        // Erfolgsanzeige
        let achievementsHtml = '';
        if (achievements.length > 0) {
            achievementsHtml = achievements.slice(0, 3).map(ach =>
                `<div class="achievement-item">
                    <i class="fas ${ach.icon}"></i>
                    <div>
                        <strong>${ach.name}</strong><br>
                        <small>${ach.description}</small>
                    </div>
                 </div>`
            ).join('');
        }

        content.innerHTML = `
            <div class="statistics-content">

                <div class="stat-card">
                    <h4><i class="fas fa-clock"></i> Zeitstatistik</h4>
                    <div class="stat-value">${this.getFormattedGameTime()}</div>
                    <div class="stat-details">
                        <div class="time-stats">
                            <div class="time-stat">
                                <small>Aktuelles Spiel</small>
                            </div>
                            <div class="time-stat">
                                <small>Schnellster Sieg:</small>
                                ${globalStats.fastestWin ?
                `<strong>${Math.floor(globalStats.fastestWin.time / 60)}:${(globalStats.fastestWin.time % 60).toString().padStart(2, '0')}</strong><br>
                                    <small>(${globalStats.fastestWin.name})</small>` :
                '<small>Noch kein Rekord</small>'}
                            </div>
                            <div class="time-stat">
                                <small>Durchschnitt:</small>
                                <strong>${avgGameTimeFormatted}</strong>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="stat-card">
                    <h4><i class="fas fa-crown"></i> Aktuelle Führung</h4>
                    <div class="stat-value" style="color: ${leader ? leader.player.color : '#2c3e50'}">
                        ${leader ? leader.player.name : '-'}
                    </div>
                    <div class="stat-details">
                        ${leader ? `
                            <div class="leader-info">
                                <strong>${leader.totalSteps} zurückgelegte Feld${leader.totalSteps !== 1 ? 'er' : ''}</strong><br>
                                <span>${leader.piecesInGoal} Figur${leader.piecesInGoal !== 1 ? 'en' : ''} im Ziel</span>
                            </div>
                        ` : '<div class="no-leader">Keine Führung</div>'}
                        ${leader && second ? `
                            <div class="lead-gap">
                                <i class="fas fa-flag-checkered"></i> Vorsprung: <strong>${leadGap} Feld${leadGap !== 1 ? 'er' : ''}</strong>
                            </div>
                        ` : ''}
                    </div>
                    <div class="stat-progress">
                        <div class="stat-progress-bar" style="width: ${leader ? (leader.totalSteps / 176) * 100 : 0}%"></div>
                    </div>
                </div>

                <div class="stat-card full-width">
                    <h4><i class="fas fa-list-ol"></i> Spielstand</h4>
                    <div class="leaderboard-container">
                        ${this.getLeaderboardHtml(leaderboard)}
                    </div>
                </div>
                
                
                
                <div class="stat-card">
                    <h4><i class="fas fa-trophy"></i> Erfolge</h4>
                    <div class="stat-value">${achievements.length}</div>
                    <div class="achievements-list">
                        ${achievementsHtml || '<div class="no-achievements">Noch keine Erfolge</div>'}
                    </div>
                </div>
                
                <div class="stat-card">
                    <h4><i class="fas fa-chart-line"></i> Leistungsübersicht</h4>
                    <div class="stat-grid">
                        <div class="stat-item">
                            <div class="stat-number">${globalStats.totalRolls}</div>
                            <div class="stat-label">Würfe</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-number">${globalStats.gamesPlayed}</div>
                            <div class="stat-label">Spiele</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-number">${globalStats.totalWins}</div>
                            <div class="stat-label">Siege</div>
                        </div>
                    </div>
                    <div class="stat-details">
                        <strong>Durchschnitt:</strong><br>
                        ${globalStats.gamesPlayed > 0 ? Math.round(globalStats.totalRolls / globalStats.gamesPlayed) : 0} Würfe/Spiel
                    </div>
                </div>
                

                
                <div class="stat-card full-width">
                    <h4><i class="fas fa-history"></i> Gewinnerhistorie</h4>
                    <div class="winners-history">
                        ${winnersHtml}
                    </div>
                </div>
            </div>
            
            <div class="statistics-actions">
                <button id="export-stats-btn" class="btn-secondary">
                    <i class="fas fa-download"></i> Exportieren
                </button>
                <button id="import-stats-btn" class="btn-secondary">
                    <i class="fas fa-upload"></i> Importieren
                </button>
                <button id="reset-stats-btn" class="btn-danger">
                    <i class="fas fa-trash"></i> Zurücksetzen
                </button>
            </div>
            
            <input type="file" id="import-stats-file" accept=".json" style="display: none;">
        `;

        // Event Listener für Buttons
        this.setupEventListeners();
    }

    // Event Listener einrichten
    setupEventListeners() {
        // Reset-Button
        const resetBtn = document.getElementById('reset-stats-btn');
        if (resetBtn) {
            resetBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm('Möchten Sie wirklich ALLE Statistiken zurücksetzen?\nDies kann nicht rückgängig gemacht werden!')) {
                    this.resetGlobalStats();
                    this.updateStatistics(true);
                    this.showNotification('Statistiken wurden zurückgesetzt', 'success');
                }
            });
        }

        // Export-Button
        const exportBtn = document.getElementById('export-stats-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportStats();
                this.showNotification('Statistiken wurden exportiert', 'success');
            });
        }

        // Import-Button
        const importBtn = document.getElementById('import-stats-btn');
        const importFile = document.getElementById('import-stats-file');

        if (importBtn && importFile) {
            importBtn.addEventListener('click', () => {
                importFile.click();
            });

            importFile.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
                        alert('Bitte wählen Sie eine JSON-Datei aus.');
                        return;
                    }

                    this.importStats(file)
                        .then(() => {
                            this.updateStatistics(true);
                            this.showNotification('Statistiken wurden importiert', 'success');
                        })
                        .catch(error => {
                            this.showNotification(`Import fehlgeschlagen: ${error}`, 'error');
                        })
                        .finally(() => {
                            // Datei-Input zurücksetzen
                            importFile.value = '';
                        });
                }
            });
        }
    }

    // Benachrichtigung anzeigen
    showNotification(message, type = 'info') {
        // Einfache Alert-Implementierung - kann durch ein Modal ersetzt werden
        alert(message);
    }

    resetStatistics() {
        this.statistics = {
            totalRolls: 0,
            totalMoves: 0,
            totalCaptures: 0,
            sixesRolled: 0,
            gameStartTime: null,
            currentGameTime: 0,
            playerStats: {},
            gameState: 'not_started',
            achievements: []
        };
    }
}