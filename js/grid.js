function createGrid(rows, cols) {
    return Array(rows).fill(null).map(() => Array(cols).fill(null));
}

function isValidPlacement(grid, piece, startRow, startCol) {
    for (let r = 0; r < piece.shape.length; r++) {
        for (let c = 0; c < piece.shape[r].length; c++) {
            if (piece.shape[r][c]) {
                const gridRow = startRow + r;
                const gridCol = startCol + c;
                if (gridRow >= grid.length || gridCol >= grid[0].length || grid[gridRow][gridCol]) {
                    return false;
                }
            }
        }
    }
    return true;
}

function placePiece(grid, piece, startRow, startCol) {
    for (let r = 0; r < piece.shape.length; r++) {
        for (let c = 0; c < piece.shape[r].length; c++) {
            if (piece.shape[r][c]) {
                grid[startRow + r][startCol + c] = piece.cells[r][c];
            }
        }
    }
}

function clearLines(grid) {
    const rows = grid.length;
    const cols = grid[0].length;
    let linesCleared = 0;
    
    // Check for full rows
    let rowsToClear = [];
    for (let r = 0; r < rows; r++) {
        if (grid[r].every(cell => cell !== null)) {
            rowsToClear.push(r);
        }
    }

    // Check for full columns
    let colsToClear = [];
    for (let c = 0; c < cols; c++) {
        let isFull = true;
        for (let r = 0; r < rows; r++) {
            if (grid[r][c] === null) {
                isFull = false;
                break;
            }
        }
        if (isFull) {
            colsToClear.push(c);
        }
    }

    linesCleared = rowsToClear.length + colsToClear.length;
    
    // Clear rows
    for (const r of rowsToClear) {
        for (let c = 0; c < cols; c++) {
            grid[r][c] = null;
        }
    }
    // Clear columns
    for (const c of colsToClear) {
        for (let r = 0; r < rows; r++) {
            grid[r][c] = null;
        }
    }
    
    return linesCleared;
}

function colorPurge(grid) {
    const rows = grid.length;
    const cols = grid[0].length;
    const visited = Array(rows).fill(null).map(() => Array(cols).fill(false));
    let totalPurgedCells = 0;
    let purgeScores = [];

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (grid[r][c] && !visited[r][c]) {
                const color = grid[r][c];
                const group = [];
                const queue = [[r, c]];
                visited[r][c] = true;

                while (queue.length > 0) {
                    const [currR, currC] = queue.shift();
                    group.push([currR, currC]);

                    const neighbors = [[-1, 0], [1, 0], [0, -1], [0, 1]];
                    for (const [dr, dc] of neighbors) {
                        const newR = currR + dr;
                        const newC = currC + dc;
                        if (newR >= 0 && newR < rows && newC >= 0 && newC < cols &&
                            !visited[newR][newC] && grid[newR][newC] === color) {
                            visited[newR][newC] = true;
                            queue.push([newR, newC]);
                        }
                    }
                }
                
                if (group.length >= 7) {
                    totalPurgedCells += group.length;
                    purgeScores.push(group.length * 5); // 5 points per cell
                    for (const [gr, gc] of group) {
                        grid[gr][gc] = null;
                    }
                }
            }
        }
    }
    
    // Calculate final score based on number of purges
    if (purgeScores.length === 0) return 0;
    if (purgeScores.length === 1) return purgeScores[0];
    return purgeScores.reduce((acc, score) => acc * score, 1);
}