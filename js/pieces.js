const COLORS = {
    RED: '#e74c3c',
    GREEN: '#2ecc71',
    BLUE: '#3498db'
};

const PIECE_DEFINITIONS = {
    // Domino (1x2) - Spawns vertically
    '2x1': { shape: [[1], [1]], rarity: 'common' },
    // Trominoes - 1x3 spawns vertically
    '3x1': { shape: [[1], [1], [1]], rarity: 'common' },
    'L_trom': { shape: [[1, 0], [1, 1]], rarity: 'uncommon' },
    // Tetrominoes - I-shape spawns vertically
    'I_tetro': { shape: [[1], [1], [1], [1]], rarity: 'common' },
    'O_tetro': { shape: [[1, 1], [1, 1]], rarity: 'common' },
    'T_tetro': { shape: [[0, 1, 0], [1, 1, 1]], rarity: 'uncommon' },
    'L_tetro': { shape: [[0, 0, 1], [1, 1, 1]], rarity: 'uncommon' },
    'S_tetro': { shape: [[0, 1, 1], [1, 1, 0]], rarity: 'uncommon' },
    // Custom
    '3x3': { shape: [[1, 1, 1], [1, 1, 1], [1, 1, 1]], rarity: 'rare' },
    // Mythic - 1x6 spawns vertically
    '6x1': { shape: [[1], [1], [1], [1], [1], [1]], rarity: 'mythic' }
};

function rotatePiece(piece) {
    const shape = piece.shape;
    const N = shape.length;
    const M = shape[0].length;
    const newShape = Array(M).fill(0).map(() => Array(N).fill(0));
    for (let r = 0; r < N; r++) {
        for (let c = 0; c < M; c++) {
            newShape[c][N - 1 - r] = shape[r][c];
        }
    }
    piece.shape = newShape;
    // Also rotate the color cells
    const newCells = Array(M).fill(0).map(() => Array(N).fill(null));
     for (let r = 0; r < N; r++) {
        for (let c = 0; c < M; c++) {
            newCells[c][N - 1 - r] = piece.cells[r][c];
        }
    }
    piece.cells = newCells;
}

function mirrorPiece(piece) {
    piece.shape.forEach(row => row.reverse());
    piece.cells.forEach(row => row.reverse());
}