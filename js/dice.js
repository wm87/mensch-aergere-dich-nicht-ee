export class Dice {
    constructor(game) {
        this.game = game;
    }

    create3DDice() {
        const diceContainer = document.getElementById('dice-3d');
        diceContainer.innerHTML = '';

        for (let i = 1; i <= 6; i++) {
            const face = document.createElement('div');
            face.className = `face face-${i}`;
            face.id = `face-${i}`;

            const faceGrid = document.createElement('div');
            faceGrid.className = 'face-grid';

            const dotPositions = this.getCorrectDotPositions(i);

            for (let row = 0; row < 3; row++) {
                for (let col = 0; col < 3; col++) {
                    const cell = document.createElement('div');
                    cell.style.display = 'flex';
                    cell.style.justifyContent = 'center';
                    cell.style.alignItems = 'center';

                    const hasDot = dotPositions.some(pos => pos.row === row && pos.col === col);

                    if (hasDot) {
                        const dot = document.createElement('div');
                        dot.className = 'dot';
                        cell.appendChild(dot);
                    }

                    faceGrid.appendChild(cell);
                }
            }

            face.appendChild(faceGrid);
            diceContainer.appendChild(face);
        }

        this.showDiceFace(1);
    }

    getCorrectDotPositions(value) {
        const positions = {
            1: [{ row: 1, col: 1 }],
            2: [{ row: 0, col: 0 }, { row: 2, col: 2 }],
            3: [{ row: 0, col: 0 }, { row: 1, col: 1 }, { row: 2, col: 2 }],
            4: [{ row: 0, col: 0 }, { row: 0, col: 2 }, { row: 2, col: 0 }, { row: 2, col: 2 }],
            5: [{ row: 0, col: 0 }, { row: 0, col: 2 }, { row: 1, col: 1 }, { row: 2, col: 0 }, { row: 2, col: 2 }],
            6: [{ row: 0, col: 0 }, { row: 0, col: 2 }, { row: 1, col: 0 }, { row: 1, col: 2 }, { row: 2, col: 0 }, { row: 2, col: 2 }]
        };

        return positions[value] || positions[1];
    }

    showDiceFace(value) {
        const dice = document.getElementById('dice-3d');
        const rotations = {
            1: 'rotateX(0deg) rotateY(0deg)',
            2: 'rotateY(-90deg)',
            3: 'rotateX(-90deg)',
            4: 'rotateX(90deg)',
            5: 'rotateY(90deg)',
            6: 'rotateY(180deg)'
        };

        dice.style.transform = rotations[value] || rotations[1];
    }
}