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
        
        const rect = e.target.getBoundingClientRect();
        const startX = e.clientX || e.touches[0].clientX;
        const startY = e.clientY || e.touches[0].clientY;
        
        dragOffset = { x: startX - rect.left, y: startY - rect.top };

        gameState.selectionCanvases[index].ctx.clearRect(0, 0, rect.width, rect.height);
        createDragElement(gameState.availablePieces[index]);
        handleMove(e);
    };

    const handleEnd = (e) => {
        if (!isDragging) return;
        
        const mainCanvasRect = mainCanvas.getBoundingClientRect();
        const endX = (e.clientX || e.changedTouches[0].clientX);
        const endY = (e.clientY || e.changedTouches[0].clientY);
        
        const onGrid = endX > mainCanvasRect.left && endX < mainCanvasRect.right &&
                       endY > mainCanvasRect.top && endY < mainCanvasRect.bottom;
        
        let isValidDrop = false;
        // Only drop if ghost is visible (piece is over grid)
        if (gameState.ghostPos) {
            const piece = gameState.availablePieces[selectedPieceIndex];
            const pieceRows = piece.shape.length;
            const pieceCols = piece.shape[0].length;
            const row = gameState.ghostPos.y / gameState.CELL_SIZE;
            const col = gameState.ghostPos.x / gameState.CELL_SIZE;
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
        
        let moveX = e.clientX || e.touches[0].clientX;
        let moveY = e.clientY || e.touches[0].clientY;
        // Constrain dragging to the viewport
        const dragEl = dragContainer.firstChild;
        if (dragEl) {
            const elRect = dragEl.getBoundingClientRect();
            moveX = Math.max(0, Math.min(moveX, window.innerWidth - elRect.width));
            moveY = Math.max(0, Math.min(moveY, window.innerHeight - elRect.height));
        }
        // The center of the piece is the reference for ghost and drop
        const piece = gameState.availablePieces[selectedPieceIndex];
        const pieceRows = piece.shape.length;
        const pieceCols = piece.shape[0].length;
        const piecePixelWidth = pieceCols * gameState.CELL_SIZE;
        const piecePixelHeight = pieceRows * gameState.CELL_SIZE;
        const draggedElX = moveX - dragOffset.x;
        const draggedElY = moveY - dragOffset.y;
        dragContainer.style.transform = `translate(${draggedElX}px, ${draggedElY}px)`;

        const mainCanvasRect = mainCanvas.getBoundingClientRect();
        // Calculate intended row/col
        let ghostX = draggedElX - mainCanvasRect.left + piecePixelWidth / 2;
        let ghostY = draggedElY - mainCanvasRect.top + piecePixelHeight / 2;
        let row = Math.floor(ghostY / gameState.CELL_SIZE) - Math.floor(pieceRows / 2);
        let col = Math.floor(ghostX / gameState.CELL_SIZE) - Math.floor(pieceCols / 2);
        // Clamp so piece fits in grid
        row = Math.max(0, Math.min(gameState.ROWS - pieceRows, row));
        col = Math.max(0, Math.min(gameState.COLS - pieceCols, col));
        // Only show ghost if center of piece is over the grid
        const centerOverGrid = ghostX >= 0 && ghostX < mainCanvasRect.width && ghostY >= 0 && ghostY < mainCanvasRect.height;
        if (centerOverGrid) {
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