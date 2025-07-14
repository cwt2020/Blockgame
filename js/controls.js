function setupControls(gameState) {
    const mainCanvas = document.getElementById('game-canvas');
    const selectionCanvases = document.querySelectorAll('.piece-canvas');
    const controlButtons = document.querySelectorAll('.control-btn');
    const dragContainer = document.getElementById('drag-container');

    let selectedPieceIndex = -1;
    let isDragging = false;
    let dragOffset = { x: 0, y: 0 };

    // --- Control Button Logic ---
    controlButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const index = parseInt(e.target.dataset.pieceIndex, 10);
            const piece = gameState.availablePieces[index];
            if (piece && !isDragging) {
                if (e.target.classList.contains('rotate-btn')) {
                    rotatePiece(piece);
                } else if (e.target.classList.contains('mirror-btn')) {
                    mirrorPiece(piece);
                }
                gameState.drawSelection();
            }
        });
    });

    // --- Drag and Drop Logic ---
    const handleStart = (e, index) => {
        if (!gameState.availablePieces[index] || isDragging) return;
        e.preventDefault();

        selectedPieceIndex = index;
        isDragging = true;
        if (!GameState.controls) GameState.controls = {};
        GameState.controls.isDragging = true;
        GameState.controls.draggedPiece = gameState.availablePieces[index];

        // Calculate offset from finger/touch to top-left of piece
        const piece = gameState.availablePieces[index];
        const pieceRows = piece.shape.length;
        const pieceCols = piece.shape[0].length;
        const piecePixelWidth = pieceCols * gameState.CELL_SIZE;
        const piecePixelHeight = pieceRows * gameState.CELL_SIZE;
        const startX = e.clientX || (e.touches && e.touches[0].clientX);
        const startY = e.clientY || (e.touches && e.touches[0].clientY);
        // Find the slot position
        const slotRect = e.target.getBoundingClientRect();
        dragOffset = {
            x: startX - slotRect.left,
            y: startY - slotRect.top
        };

        const rect = e.target.getBoundingClientRect();
        gameState.selectionCanvases[index].ctx.clearRect(0, 0, rect.width, rect.height);
        createDragElement(gameState.availablePieces[index]);
        handleMove(e);
    };

    const handleEnd = (e) => {
        if (!isDragging) return;
        
        let isValidDrop = false;
        // Only drop if ghost is visible and placement is valid
        if (gameState.ghostPos) {
            const piece = gameState.availablePieces[selectedPieceIndex];
            const pieceRows = piece.shape.length;
            const pieceCols = piece.shape[0].length;
            const row = Math.floor(gameState.ghostPos.y / gameState.CELL_SIZE);
            const col = Math.floor(gameState.ghostPos.x / gameState.CELL_SIZE);
            if (isValidPlacement(gameState.grid, piece, row, col)) {
                gameState.placeSelectedPiece(selectedPieceIndex, row, col);
                isValidDrop = true;
            }
        }

        if (!isValidDrop) {
            snapBack(selectedPieceIndex);
        } else {
            dragContainer.innerHTML = '';
        }

        isDragging = false;
        if (!GameState.controls) GameState.controls = {};
        GameState.controls.isDragging = false;
        GameState.controls.draggedPiece = null;
        gameState.ghostPos = null;
        gameState.drawMainGrid();
    };

    const handleMove = (e) => {
        if (!isDragging) return;
        e.preventDefault();

        let moveX = e.clientX || (e.touches && e.touches[0].clientX);
        let moveY = e.clientY || (e.touches && e.touches[0].clientY);
        dragContainer.style.transform = `translate(${moveX - dragOffset.x}px, ${moveY - dragOffset.y}px)`;

        // Use the currently dragged piece for ghost calculation
        const piece = GameState.controls.draggedPiece;
        if (!piece) {
            gameState.ghostPos = null;
            gameState.drawMainGrid();
            return;
        }
        const pieceRows = piece.shape.length;
        const pieceCols = piece.shape[0].length;
        const mainCanvasRect = mainCanvas.getBoundingClientRect();
        // Calculate the top-left of the piece relative to the grid
        let ghostX = moveX - dragOffset.x - mainCanvasRect.left;
        let ghostY = moveY - dragOffset.y - mainCanvasRect.top;
        let row = Math.round(ghostY / gameState.CELL_SIZE);
        let col = Math.round(ghostX / gameState.CELL_SIZE);
        // Clamp so piece fits in grid
        row = Math.max(0, Math.min(gameState.ROWS - pieceRows, row));
        col = Math.max(0, Math.min(gameState.COLS - pieceCols, col));

        // Check if any part of the block is still overlapping the selection canvas
        let selectionRect = null;
        if (selectedPieceIndex >= 0 && gameState.selectionCanvases[selectedPieceIndex]) {
            selectionRect = gameState.selectionCanvases[selectedPieceIndex].canvas.getBoundingClientRect();
        }
        let blockOverSelection = false;
        if (selectionRect) {
            for (let r = 0; r < pieceRows; r++) {
                for (let c = 0; c < pieceCols; c++) {
                    if (piece.shape[r][c]) {
                        // Calculate block cell position in screen coordinates
                        const cellX = mainCanvasRect.left + (col + c) * gameState.CELL_SIZE;
                        const cellY = mainCanvasRect.top + (row + r) * gameState.CELL_SIZE;
                        if (
                            cellX + gameState.CELL_SIZE > selectionRect.left &&
                            cellX < selectionRect.right &&
                            cellY + gameState.CELL_SIZE > selectionRect.top &&
                            cellY < selectionRect.bottom
                        ) {
                            blockOverSelection = true;
                        }
                    }
                }
            }
        }

        // Show ghost only if placement is valid and block is not overlapping selection canvas
        if (isValidPlacement(gameState.grid, piece, row, col) && !blockOverSelection) {
            gameState.ghostPos = {
                x: col * gameState.CELL_SIZE,
                y: row * gameState.CELL_SIZE
            };
        } else {
            gameState.ghostPos = null;
        }
        gameState.drawMainGrid();
    };
    
    function createDragElement(piece) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const width = piece.shape[0].length * gameState.CELL_SIZE;
        const height = piece.shape.length * gameState.CELL_SIZE;
        canvas.width = width;
        canvas.height = height;
        gameState.renderer.drawPiece(ctx, piece, 0, 0, 1.0);
        dragContainer.innerHTML = '';
        dragContainer.appendChild(canvas);
    }
    
    function snapBack(index) {
        const homeSlot = document.getElementById(`slot-${index}`);
        const homeRect = homeSlot.getBoundingClientRect();
        const dragRect = dragContainer.getBoundingClientRect();
        
        // Calculate the center of the home slot
        const homeX = homeRect.left + (homeRect.width / 2) - (dragRect.width / 2);
        const homeY = homeRect.top + (homeRect.height / 2) - (dragRect.height / 2);

        dragContainer.classList.add('snapping');
        dragContainer.style.transform = `translate(${homeX}px, ${homeY}px)`;

        dragContainer.addEventListener('transitionend', () => {
            dragContainer.classList.remove('snapping');
            dragContainer.innerHTML = '';
            gameState.drawSelection(); // Redraw the piece in its slot
        }, { once: true });
    }
    
    selectionCanvases.forEach((canvas, index) => {
        canvas.addEventListener('mousedown', (e) => handleStart(e, index));
        canvas.addEventListener('touchstart', (e) => handleStart(e, index));
    });

    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchend', handleEnd);
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('touchmove', handleMove);
}