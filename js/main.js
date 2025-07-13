const GameState = {
    // Constants
    ROWS: 7,
    COLS: 7,
    CELL_SIZE: 40,
    
    // State
    grid: [],
    score: 0,
    gameOver: false,
    availablePieces: [],
    ghostPos: null, // For ghost piece on the main grid
    
    // Modules & Elements
    mainCanvas: null,
    mainCtx: null,
    selectionCanvases: [],
    renderer: null,

    init() {
        // Setup canvases
        this.mainCanvas = document.getElementById('game-canvas');
        this.mainCtx = this.mainCanvas.getContext('2d');
        this.mainCanvas.width = this.COLS * this.CELL_SIZE;
        this.mainCanvas.height = this.ROWS * this.CELL_SIZE;
        
        this.selectionCanvases = [
            { canvas: document.getElementById('piece-canvas-0'), ctx: document.getElementById('piece-canvas-0').getContext('2d')},
            { canvas: document.getElementById('piece-canvas-1'), ctx: document.getElementById('piece-canvas-1').getContext('2d')},
            { canvas: document.getElementById('piece-canvas-2'), ctx: document.getElementById('piece-canvas-2').getContext('2d')}
        ];
        this.selectionCanvases.forEach(c => { c.canvas.width = 4 * this.CELL_SIZE; c.canvas.height = 4 * this.CELL_SIZE; });
        
        this.renderer = new Renderer(this.CELL_SIZE);
        
        restartButton.addEventListener('click', () => this.start());
        hintButton.addEventListener('click', () => this.showHint());
        
        setupControls(this);
        this.start();
    },

    start() {
        this.grid = createGrid(this.ROWS, this.COLS);
        this.score = 0;
        this.gameOver = false;
        hideGameOverScreen();
        updateScore(0);
        this.generateNewPieces();
        this.drawMainGrid();
        this.drawSelection();
    },

    drawMainGrid() {
        this.renderer.drawGrid(this.mainCtx, this.mainCanvas, this.grid);
        if (this.ghostPos && GameState.controls.isDragging) {
            const piece = GameState.controls.draggedPiece;
            // Snap ghost to grid cell under cursor
            const row = Math.floor(this.ghostPos.y / this.CELL_SIZE);
            const col = Math.floor(this.ghostPos.x / this.CELL_SIZE);
            const x = col * this.CELL_SIZE;
            const y = row * this.CELL_SIZE;
            // Only show ghost if valid placement
            if (isValidPlacement(this.grid, piece, row, col)) {
                this.renderer.drawPiece(this.mainCtx, piece, x, y, 1.0, true);
            }
        }
    },

    drawSelection() {
        this.availablePieces.forEach((piece, index) => {
            if (piece) {
                const { canvas, ctx } = this.selectionCanvases[index];
                this.renderer.drawPieceOnSelectionCanvas(piece, canvas, ctx);
            } else {
                 const { canvas, ctx } = this.selectionCanvases[index];
                 ctx.clearRect(0,0,canvas.width, canvas.height);
            }
        });
    },

    placeSelectedPiece(index, row, col) {
        const piece = this.availablePieces[index];
        if (!piece || !isValidPlacement(this.grid, piece, row, col)) {
            this.drawSelection(); // Redraw piece if placement is invalid
            return; 
        }
        
        placePiece(this.grid, piece, row, col);
        this.availablePieces[index] = null;
        this.ghostPos = null;
        this.drawMainGrid();

        // Scoring
        const linesCleared = clearLines(this.grid);
        if (linesCleared > 0) {
            let lineScore = linesCleared * this.ROWS * 10;
            if (linesCleared >= 3) lineScore *= 2;
            else if (linesCleared >= 2) lineScore *= 1.5;
            this.score += lineScore;
        }

        const purgeScore = colorPurge(this.grid);
        this.score += purgeScore;
        updateScore(this.score);

        // Check for new pieces or game over
        if (this.availablePieces.every(p => p === null)) {
            this.generateNewPieces();
            this.drawSelection();
        }

        if (this.checkGameOver()) {
             this.gameOver = true;
             showGameOverScreen(this.score);
        }
    },

    // --- Other methods (generateNewPieces, createRandomPiece, isPiecePlayable, checkGameOver, showHint) remain largely the same ---
    generateNewPieces() {
        this.availablePieces = [this.createRandomPiece(), this.createRandomPiece(), this.createRandomPiece()];
        if (!this.availablePieces.some(p => this.isPiecePlayable(p)) && !this.checkGameOver()) {
            this.generateNewPieces();
        }
    },
    createRandomPiece() {
        const rand = Math.random() * 100;
        let rarity;
        if (rand < 60) rarity = 'common'; else if (rand < 90) rarity = 'uncommon'; else if (rand < 99) rarity = 'rare'; else rarity = 'mythic';
        const possible = Object.keys(PIECE_DEFINITIONS).filter(k => PIECE_DEFINITIONS[k].rarity === rarity);
        const key = possible[Math.floor(Math.random() * possible.length)] || '2x1';
        const def = PIECE_DEFINITIONS[key];
        const piece = { shape: JSON.parse(JSON.stringify(def.shape)), cells: [] };
        const colors = Object.values(COLORS);
        const isMythic = rarity === 'mythic';
        const mythicColor = colors[Math.floor(Math.random() * colors.length)];
        piece.cells = piece.shape.map(row => row.map(cell => cell ? (isMythic ? mythicColor : colors[Math.floor(Math.random() * colors.length)]) : null));
        return piece;
    },
    isPiecePlayable(piece) {
        if (!piece) return false;
        const originalShape = JSON.parse(JSON.stringify(piece.shape));
        for (let i = 0; i < 4; i++) {
            for (let r = 0; r < this.ROWS; r++) for (let c = 0; c < this.COLS; c++) if (isValidPlacement(this.grid, piece, r, c)) { piece.shape = originalShape; return true; }
            mirrorPiece(piece);
            for (let r = 0; r < this.ROWS; r++) for (let c = 0; c < this.COLS; c++) if (isValidPlacement(this.grid, piece, r, c)) { piece.shape = originalShape; return true; }
            mirrorPiece(piece);
            rotatePiece(piece);
        }
        piece.shape = originalShape;
        return false;
    },
    checkGameOver() { return this.availablePieces.every(p => !this.isPiecePlayable(p)); },
    showHint() { /* ... unchanged ... */ }
};

// Add a reference to the controls object within GameState for easier access
GameState.controls = { isDragging: false, draggedPiece: null };
// The actual controls object is created in setupControls

// Initialize the Game
GameState.init();