class Renderer {
    constructor(cellSize) {
        this.CELL_SIZE = cellSize;
    }

    // Helper to draw a single 3D-shaded cell with a border
    drawCell(ctx, x, y, size, color) {
        // Main color fill
        ctx.fillStyle = color;
        ctx.fillRect(x, y, size, size);

        // 3D Shading
        ctx.fillStyle = this.adjustColor(color, 25); // Lighter shade
        ctx.fillRect(x, y, size, 2); // Top
        ctx.fillRect(x, y, 2, size); // Left

        ctx.fillStyle = this.adjustColor(color, -25); // Darker shade
        ctx.fillRect(x + size - 2, y, 2, size); // Right
        ctx.fillRect(x, y + size - 2, size, 2); // Bottom
        
        // "Grout" effect for cell separation
        ctx.strokeStyle = '#111';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, size, size);
    }
    
    adjustColor(hex, amount) {
        let color = hex.startsWith('#') ? hex.slice(1) : hex;
        const num = parseInt(color, 16);
        let r = (num >> 16) + amount;
        let b = ((num >> 8) & 0x00FF) + amount;
        let g = (num & 0x0000FF) + amount;
        r = Math.max(0, Math.min(255, r));
        b = Math.max(0, Math.min(255, b));
        g = Math.max(0, Math.min(255, g));
        return `#${(g | (b << 8) | (r << 16)).toString(16).padStart(6, '0')}`;
    }

    drawGrid(ctx, canvas, grid) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (let r = 0; r < grid.length; r++) {
            for (let c = 0; c < grid[0].length; c++) {
                // Draw cell fill first
                if (grid[r][c]) {
                    this.drawCell(ctx, c * this.CELL_SIZE, r * this.CELL_SIZE, this.CELL_SIZE, grid[r][c]);
                }
            }
        }
        // Draw grid lines on top
        ctx.strokeStyle = '#333';
        for (let r = 0; r < grid.length; r++) {
            for (let c = 0; c < grid[0].length; c++) {
                ctx.strokeRect(c * this.CELL_SIZE, r * this.CELL_SIZE, this.CELL_SIZE, this.CELL_SIZE);
            }
        }
    }
    
    drawPiece(ctx, piece, x, y, scale = 1.0, isGhost = false) {
        ctx.globalAlpha = isGhost ? 0.4 : 1.0;
        const size = this.CELL_SIZE * scale;
        for (let r = 0; r < piece.shape.length; r++) {
            for (let c = 0; c < piece.shape[r].length; c++) {
                if (piece.shape[r][c]) {
                    this.drawCell(ctx, x + c * size, y + r * size, size, piece.cells[r][c]);
                }
            }
        }
        ctx.globalAlpha = 1.0;
    }

    drawPieceOnSelectionCanvas(piece, canvas, ctx) {
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset any transforms
        ctx.clearRect(0, 0, canvas.width, canvas.height); // Strict clear
        // Also clear when piece is removed (piece == null)
        if (!piece) {
            ctx.restore();
            return;
        }
        const scale = .6; // Full size
        const size = this.CELL_SIZE * scale;
        const pieceWidth = piece.shape[0].length * size;
        const pieceHeight = piece.shape.length * size;
        const x = (canvas.width - pieceWidth) / 2;
        const y = (canvas.height - pieceHeight) / 2;
        // The centered rotation is handled by this calculation automatically
        this.drawPiece(ctx, piece, x, y, scale);
        ctx.restore();
    }
}