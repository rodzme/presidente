// server.js – minimal Express + Socket.IO backend for Presidente
const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');

const app = express();
const httpServer = createServer(app);

// Allow CORS for dev convenience
const io = new Server(httpServer, { cors: { origin: '*' } });

/* ------------------------
   Static front-end files
   ------------------------ */
// Serve static files from both public and src/client directories
const path = require('path');

// Serve static files from public directory (for HTML, CSS, images, etc.)
const publicPath = path.join(__dirname, 'public');
app.use(express.static(publicPath));

// Serve static files from src/client/js (for JavaScript files)
const clientPath = path.join(__dirname, 'src/client');
app.use('/js', express.static(path.join(clientPath, 'js')));

// Serve the main page for the root URL
app.get('/', (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

/* ------------------------
   Socket.IO real-time logic
   ------------------------ */
const MAX_PLAYERS = 4;
const rooms = {}; // roomId -> { players: [], gameState: null }

// Game state management
class GameState {
  constructor(players) {
    this.players = players.map((p, index) => ({
      id: p.id,
      name: p.name,
      index: index,
      hand: [],
      isWinner: false,
      finishPosition: null
    }));
    this.deck = this.createDeck();
    this.dealCards();
    this.currentPlayerIndex = Math.floor(Math.random() * players.length);
    this.currentRound = 0;
    this.centerCards = [];
    this.lastPlayedCards = [];
    this.currentHighestCard = null; // For backward compatibility
    this.currentHighestCards = []; // Cards currently on the table
    this.roundWinner = null;
    this.roundLeader = null; // Player who played the current highest cards
    this.playersWhoSkipped = new Set(); // Track who has skipped this round
    this.consecutiveSkips = 0;
    this.finishedPlayers = 0;
    this.gamePhase = 'playing'; // waiting, playing, roundEnd, gameOver
    this.gameWinner = null;
    this.gameSecond = null;
    this.gameThird = null;
    this.gameLoser = null;
  }

  createDeck() {
    const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
    const values = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]; // 11=J, 12=Q, 13=K, 14=A, 15=2
    const deck = [];
    suits.forEach(suit => {
      values.forEach(value => {
        deck.push({ suit, value });
      });
    });
    return this.shuffle(deck);
  }

  shuffle(deck) {
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
  }

  dealCards() {
    this.players.forEach(player => {
      player.hand = this.deck.splice(0, 13);
    });
  }

  /**
   * Checks if multiple cards can be played
   * @param {Object} player - The player attempting to play
   * @param {Array} cards - The cards to play
   * @returns {boolean} - True if the cards can be played
   */
  canPlayCards(player, cards) {
    if (this.players[this.currentPlayerIndex].id !== player.id) {
      return false;
    }

    if (!cards || cards.length === 0) {
      return false;
    }

    // All cards must have the same value
    const firstCardValue = cards[0].value;
    if (!cards.every(card => card.value === firstCardValue)) {
      return false;
    }

    // If no cards have been played yet, any cards can be played
    if (!this.currentHighestCards || this.currentHighestCards.length === 0) {
      return true;
    }

    // Must play the same number of cards as the current highest
    if (cards.length !== this.currentHighestCards.length) {
      return false;
    }

    // The value must be higher than the current highest cards
    const currentHighestValue = this.currentHighestCards[0].value;
    return firstCardValue > currentHighestValue;
  }

  /**
   * Attempts to play multiple cards
   * @param {number} playerIndex - The player index attempting to play
   * @param {Array} cards - The cards to play
   * @returns {boolean} - True if the cards were successfully played
   */
  playCards(playerIndex, cards) {
    const player = this.players[playerIndex];
    
    if (!this.canPlayCards(player, cards)) {
      console.log('Invalid play: canPlayCards returned false');
      return false;
    }

    // Validate player has these cards
    for (const card of cards) {
      const hasCard = player.hand.find(c => c.suit === card.suit && c.value === card.value);
      if (!hasCard) {
        console.log(`Invalid play: player doesn't have card ${card.value} of ${card.suit}`);
        return false;
      }
    }

    // Remove cards from player's hand
    const playedCards = [];
    for (const card of cards) {
      const index = player.hand.findIndex(c => c.suit === card.suit && c.value === card.value);
      if (index !== -1) {
        const playedCard = player.hand.splice(index, 1)[0];
        playedCards.push(playedCard);
      } else {
        // If we can't play a card, put back the ones we already removed
        playedCards.forEach(pc => player.hand.push(pc));
        return false;
      }
    }

    // Update game state
    this.currentHighestCards = [...playedCards];
    this.currentHighestCard = playedCards[0]; // For backward compatibility
    this.centerCards = [...playedCards];
    this.lastPlayedCards = [...playedCards];
    this.roundLeader = playerIndex; // This player now leads the round
    this.roundWinner = player.id;
    this.playersWhoSkipped.clear(); // Reset skip tracking for new round leader
    this.consecutiveSkips = 0;
    
    // Log the play for debugging
    console.log(`Player ${playerIndex} (${player.name}) played ${playedCards.length} cards of value ${playedCards[0].value}, becoming round leader`);
    
    // Handle player finishing their hand
    if (player.hand.length === 0) {
      this.handlePlayerFinished(player);
    }

    this.nextTurn();
    return true;
  }

  /**
   * Handles when a player finishes their hand
   * @param {Object} player - The player who finished
   */
  handlePlayerFinished(player) {
    this.finishedPlayers++;
    player.finishPosition = this.finishedPlayers;
    console.log(`Player ${player.index} (${player.name}) finished in position ${this.finishedPlayers}!`);
    
    // Update player positions based on finish order
    switch (this.finishedPlayers) {
      case 1:
        this.gameWinner = player; // Presidente
        player.isWinner = true;
        break;
      case 2:
        this.gameSecond = player; // Vice
        break;
      case 3:
        this.gameThird = player; // Sobre
        break;
      case 4:
        this.gameLoser = player; // Cu (last)
        this.gamePhase = 'gameOver';
        break;
    }
    
    // If all but one player has finished, end the game
    const activePlayers = this.players.filter(p => p.finishPosition === null);
    if (activePlayers.length <= 1 && activePlayers[0]) {
      // Last remaining player automatically finishes last
      activePlayers[0].finishPosition = this.players.length;
      this.gameLoser = this.gameLoser || activePlayers[0];
      this.gamePhase = 'gameOver';
    }
  }

  skipTurn() {
    const currentPlayer = this.players[this.currentPlayerIndex];
    console.log(`Player ${this.currentPlayerIndex} (${currentPlayer.name}) skipped their turn`);
    
    // Add this player to the skip set
    this.playersWhoSkipped.add(this.currentPlayerIndex);
    
    // Store current player index before moving to next
    const skippedPlayerIndex = this.currentPlayerIndex;
    
    // Move to next turn
    this.nextTurn();
    
    // If no round leader (first play of the round) and everyone skipped, end round
    if (this.roundLeader === null) {
      console.log('No round leader and all players skipped - round ends');
      this.endRound();
      return;
    }
    
    // Check if we've gone full circle back to the round leader
    if (this.roundLeader !== null && this.currentPlayerIndex === this.roundLeader) {
      console.log(`Back to round leader ${this.roundLeader} (${this.players[this.roundLeader].name}) - round ends`);
      this.endRound();
      return;
    }
    
    // Check if all other active players have skipped
    const activePlayers = this.players.filter((p, idx) => 
      p.finishPosition === null && idx !== this.roundLeader
    );
    
    const allOthersSkipped = activePlayers.every((p) => {
      const playerIdx = this.players.findIndex(pl => pl.id === p.id);
      return this.playersWhoSkipped.has(playerIdx);
    });
    
    if (this.roundLeader !== null && allOthersSkipped) {
      console.log('All other active players have skipped - round ends');
      this.endRound();
      return;
    }
    
    // Log the current skip state for debugging
    console.log(`Skip state - Round leader: ${this.roundLeader}, ` +
                `Current player: ${this.currentPlayerIndex}, ` +
                `Skipped players: ${Array.from(this.playersWhoSkipped).join(', ')}`);
  }
  
  endRound() {
    console.log('Round completed, clearing center cards');
    
    // The round leader (who had the highest cards) wins the round and starts next
    const roundWinnerIndex = this.roundLeader;
    const roundWinner = this.players[roundWinnerIndex];
    
    if (roundWinner) {
      console.log(`Player ${roundWinnerIndex} (${roundWinner.name}) won the round and starts the next round`);
      
      // Update round winner
      this.roundWinner = roundWinner.id;
      
      // Clear round state
      this.centerCards = [];
      this.lastPlayedCards = [];
      this.currentHighestCard = null;
      this.currentHighestCards = [];
      this.playersWhoSkipped.clear();
      this.consecutiveSkips = 0;
      this.currentRound = 0;
      
      // Round winner starts the next round
      this.currentPlayerIndex = roundWinnerIndex;
    } else {
      console.error('No round winner found when ending round');
      // Fallback: Just move to next player if no round leader
      this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
    }
  }

  nextTurn() {
    let attempts = 0;
    const maxAttempts = this.players.length;
    
    do {
      this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
      attempts++;
      
      // Prevent infinite loop if all players are finished
      if (attempts >= maxAttempts) {
        break;
      }
    } while (this.players[this.currentPlayerIndex].finishPosition !== null);
    
    this.currentRound++;
    
    // Check if round is complete (all active players have played)
    const activePlayers = this.players.filter(p => p.finishPosition === null);
    if (this.currentRound >= activePlayers.length) {
      this.endRound();
    }
  }

  getState() {
    return {
      players: this.players.map(p => ({
        id: p.id,
        name: p.name,
        index: p.index,
        handCount: p.hand.length,
        isWinner: p.isWinner,
        finishPosition: p.finishPosition
      })),
      currentPlayerIndex: this.currentPlayerIndex,
      currentRound: this.currentRound,
      centerCards: this.centerCards,
      lastPlayedCards: this.lastPlayedCards,
      currentHighestCard: this.currentHighestCard,
      currentHighestCards: this.currentHighestCards,
      roundWinner: this.roundWinner,
      roundLeader: this.roundLeader,
      gamePhase: this.gamePhase,
      gameWinner: this.gameWinner ? {
        id: this.gameWinner.id,
        name: this.gameWinner.name,
        index: this.gameWinner.index
      } : null,
      gameSecond: this.gameSecond ? {
        id: this.gameSecond.id,
        name: this.gameSecond.name,
        index: this.gameSecond.index
      } : null,
      gameThird: this.gameThird ? {
        id: this.gameThird.id,
        name: this.gameThird.name,
        index: this.gameThird.index
      } : null,
      gameLoser: this.gameLoser ? {
        id: this.gameLoser.id,
        name: this.gameLoser.name,
        index: this.gameLoser.index
      } : null
    };
  }

  getPlayerHand(playerId) {
    const player = this.players.find(p => p.id === playerId);
    return player ? player.hand : [];
  }
}

// Helper: available rooms (< MAX_PLAYERS and not started)
function getAvailableRooms() {
  return Object.entries(rooms)
    .filter(([id, room]) => 
      room.players.length < MAX_PLAYERS && 
      !room.gameState // Only show rooms that haven't started
    )
    .map(([id, room]) => ({
      id,
      count: room.players.length,
      status: room.gameState ? 'in-game' : 'waiting'
    }));
}

io.on('connection', socket => {
  // Send current room list on connection
  socket.emit('roomList', getAvailableRooms());
  console.log(' Client connected:', socket.id);

  // Handle disconnect ---------------------------------
  socket.on('listRooms', () => {
    socket.emit('roomList', getAvailableRooms());
  });

  // 2. Create / join room ---------------------------------
  socket.on('joinRoom', ({ roomId, name }) => {
    console.log(`Player ${name} (${socket.id}) attempting to join room ${roomId}`);
    
    // If room doesn't exist, create it
    if (!rooms[roomId]) {
      console.log(`Creating new room ${roomId}`);
      rooms[roomId] = { 
        players: [],
        gameState: null, // Track if game has started
        status: 'waiting' // waiting, full, in-progress
      };
    }

    const room = rooms[roomId];
    
    // Prevent joining if game already started
    if (room.status === 'in-progress') {
      console.log(`Room ${roomId} game already in progress`);
      socket.emit('gameAlreadyStarted');
      return;
    }
    
    // Check if player is already in the room
    const existingPlayer = room.players.find(p => p.id === socket.id);
    if (existingPlayer) {
      console.log(`Player ${name} (${socket.id}) already in room ${roomId}`);
      return;
    }
    
    // Prevent joining if room is full
    if (room.players.length >= MAX_PLAYERS) {
      console.log(`Room ${roomId} is full`);
      socket.emit('roomFull');
      return;
    }

    // Add player to room
    const playerIndex = room.players.length;
    const playerInfo = { id: socket.id, name, index: playerIndex };
    room.players.push(playerInfo);
    
    console.log(`Player ${name} (${socket.id}) joined room ${roomId} as player ${playerIndex + 1}`);
    console.log(`Room ${roomId} now has ${room.players.length} players`);
    
    socket.join(roomId);
    socket.emit('joined', { 
      id: socket.id, 
      index: playerIndex,
      players: room.players
    });
    
    // Update all players in the room with the new player list
    io.to(roomId).emit('playerList', room.players);

    // Broadcast updated room list to everyone
    io.emit('roomList', getAvailableRooms());

    // Auto-start when exactly 4 players are in the room
    if (room.players.length === MAX_PLAYERS && room.status !== 'in-progress') {
      console.log(`Room ${roomId} has reached ${MAX_PLAYERS} players, starting game...`);
      try {
        console.log(`Creating game state for room ${roomId}`);
        
        // Mark room as in-progress before creating game state
        room.status = 'in-progress';
        
        // Create server-side game state with all players
        room.gameState = new GameState(room.players);
        console.log(`Game started in room ${roomId} with ${room.players.length} players`);
        console.log(`First player index: ${room.gameState.currentPlayerIndex}`);
        
        // Notify all clients in the room that the game is starting
        console.log(`Notifying players in room ${roomId} that game is starting`);
        io.to(roomId).emit('gameStarting', { 
          playerCount: room.players.length,
          firstPlayerIndex: room.gameState.currentPlayerIndex
        });
        
        // Small delay to ensure all clients are ready
        setTimeout(() => {
          console.log(`Sending initial game state to all players in room ${roomId}`);
          
          // Send game state to all players
          room.players.forEach((player, index) => {
            console.log(`Sending game state to player ${player.name} (${player.id})`);
            io.to(player.id).emit('gameState', {
              ...room.gameState.getState(),
              yourHand: room.gameState.getPlayerHand(player.id),
              yourIndex: player.index,
              playerCount: room.players.length
            });
          });
        }, 1000); // Increased delay to ensure all clients are ready
      } catch (error) {
        console.error('Error starting game:', error);
        // Clean up if game fails to start
        room.players = [];
        delete rooms[roomId];
        socket.emit('gameError', { message: 'Failed to start game. Please try again.' });
      }
    }
  });

  // 2. Chat -----------------------------------------------
  socket.on('chat', ({ roomId, message, name }) => {
    io.to(roomId).emit('chat', { name, message });
  });

  // 3. Game actions ---------------------------------------
  socket.on('playCards', ({ roomId, cards }) => {
    const room = rooms[roomId];
    if (!room || !room.gameState) return;
    
    // Find player's index by socket ID
    const playerIndex = room.players.findIndex(p => p.id === socket.id);
    if (playerIndex === -1) return;
    
    console.log(`Player ${playerIndex} (${room.players[playerIndex].name}) playing cards:`, cards);
    
    // Validate and apply move
    if (room.gameState.playCards(playerIndex, cards)) {
      console.log('Cards played successfully, broadcasting to all players in room', roomId);
      console.log('Updated center cards:', room.gameState.centerCards);
      console.log('Current player index:', room.gameState.currentPlayerIndex);
      
      // Broadcast updated game state to all players in the room
      room.players.forEach(player => {
        const gameStateUpdate = {
          ...room.gameState.getState(),
          yourHand: room.gameState.getPlayerHand(player.id),
          yourIndex: player.index
        };
        console.log(`Sending to ${player.name} (${player.id}):`, {
          centerCards: gameStateUpdate.centerCards,
          currentPlayerIndex: gameStateUpdate.currentPlayerIndex,
          handCount: gameStateUpdate.yourHand.length
        });
        // Send individual game state to each player with their specific hand
        io.to(player.id).emit('gameState', gameStateUpdate);
      });
      
      console.log(`Broadcasted game state to ${room.players.length} players in room ${roomId}`);
    } else {
      console.log('Invalid card play attempt by player', playerIndex);
    }
  });
  
  socket.on('skipTurn', ({ roomId }) => {
    const room = rooms[roomId];
    if (!room || !room.gameState) return;
    
    const playerIndex = room.players.findIndex(p => p.id === socket.id);
    if (playerIndex === -1 || playerIndex !== room.gameState.currentPlayerIndex) return;
    
    console.log(`Player ${playerIndex} (${room.players[playerIndex].name}) skipped turn`);
    
    room.gameState.skipTurn();
    
    // Broadcast updated game state
    room.players.forEach(player => {
      io.to(player.id).emit('gameState', {
        ...room.gameState.getState(),
        yourHand: room.gameState.getPlayerHand(player.id),
        yourIndex: player.index
      });
    });
  });

  socket.on('disconnecting', () => {
    [...socket.rooms].forEach(r => {
      if (rooms[r]) {
        rooms[r].players = rooms[r].players.filter(p => p.id !== socket.id);
        io.to(r).emit('playerList', rooms[r].players);
      }
    });
  });
});

/* ------------------------
   Launch
   ------------------------ */
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () =>
  console.log(`Server running at http://localhost:${PORT}`)
);