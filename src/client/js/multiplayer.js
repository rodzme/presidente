// Multiplayer client code - wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
    // Check if Socket.IO is loaded
    if (typeof io === 'undefined') {
        console.error('Socket.IO not loaded! Make sure /socket.io/socket.io.js is included before this script.');
        alert('Connection error: Socket.IO not loaded');
        return;
    }

    const roomId     = sessionStorage.getItem('presidenteRoomId');
    const playerName = sessionStorage.getItem('presidentePlayerName') || `Player-${Math.random().toString(36).slice(2,5)}`;

    // Skip multiplayer setup if no room ID (single player mode)
    if (!roomId) {
        console.log('No room ID found, skipping multiplayer setup');
        return;
    }

    console.log('Connecting to server with:', { roomId, playerName });
    const socket = io();
    
    // Join or create given room with payload {roomId, name}
    socket.emit('joinRoom', { roomId, name: playerName });

    const numerorodadaEl = document.getElementById('numerorodada');
    if (numerorodadaEl) {
        numerorodadaEl.textContent = `Waiting in room ${roomId}...`;
    }

    socket.on('joined',   data   => console.log('Joined:', data));
    socket.on('roomFull', ()     => alert('Room full!'));

    // Update waiting list UI & board names
    const nameElements = [
        document.getElementById('player1Name'),
        document.getElementById('player2Name'),
        document.getElementById('player3Name'),
        document.getElementById('player4Name')
    ];

    socket.on('playerList', list => {
        console.log('Players:', list);
        // reset names
        nameElements.forEach((el,i)=>{ if(el) el.textContent = `Player ${i+1}`; });
        list.forEach(p => {
            if(nameElements[p.index]) nameElements[p.index].textContent = p.name;
            if(p.id === socket.id) {
                // store my seat index
                window.mySeatIndex = p.index;
            }
        });
        const names = list.map(p => p.name || '???');
        const numerorodadaEl = document.getElementById('numerorodada');
        if (numerorodadaEl) {
            numerorodadaEl.textContent = `Room ${roomId}: ${list.length}/4 connected – ${names.join(', ')}`;
        }
    });

    // Handle server-authoritative game state updates
    socket.on('gameState', (gameState) => {
        console.log('=== RECEIVED GAME STATE UPDATE ===');
        console.log('Center cards:', gameState.centerCards);
        console.log('Current player:', gameState.currentPlayerIndex);
        console.log('Your index:', gameState.yourIndex);
        console.log('Your hand count:', gameState.yourHand ? gameState.yourHand.length : 'undefined');
        console.log('===================================');
        
        // Update header to show game is active
        const numerorodadaEl = document.getElementById('numerorodada');
        if (numerorodadaEl) {
            const currentPlayerName = gameState.players[gameState.currentPlayerIndex]?.name || 'Unknown';
            numerorodadaEl.textContent = `${currentPlayerName}'s turn`;
        }
        
        // Expose game state and socket to game.js
        window.multiplayerGameState = gameState;
        window.multiplayerSocket = socket;
        window.myPlayerIndex = gameState.yourIndex;
        
        // Initialize or update the game with server state
        console.log('Checking game state functions...');
        console.log('updateMultiplayerGameState exists:', typeof window.updateMultiplayerGameState);
        console.log('initMultiplayerGame exists:', typeof window.initMultiplayerGame);
        console.log('gameController exists:', typeof window.gameController);
        
        try {
            // Check if this is the first time (game not initialized yet)
            const isFirstTime = !window.gameController || !window.gameController.gameState || !window.gameController.gameState.players || window.gameController.gameState.players.length === 0;
            
            if (isFirstTime && typeof window.initMultiplayerGame === 'function') {
                console.log('Calling initMultiplayerGame (first time initialization)...');
                window.initMultiplayerGame(gameState);
                console.log('initMultiplayerGame completed successfully');
            } else if (typeof window.updateMultiplayerGameState === 'function') {
                console.log('Calling updateMultiplayerGameState (game already initialized)...');
                window.updateMultiplayerGameState(gameState);
                console.log('updateMultiplayerGameState completed successfully');
            } else {
                console.error('Neither updateMultiplayerGameState nor initMultiplayerGame functions are available!');
                console.log('Available window functions:', Object.keys(window).filter(k => k.includes('game') || k.includes('multiplayer')));
            }
        } catch (error) {
            console.error('ERROR in multiplayer game state update:', error);
            console.error('Error stack:', error.stack);
        }
    });
});