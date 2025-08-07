# Presidente Game - Refactored Architecture

## Overview

This is a refactored version of the Presidente card game that follows SOLID principles and clean architecture patterns. The code has been restructured to be more maintainable, testable, and extensible.

## Architecture Overview

### File Structure

```
Web Implementation/
├── presidente.html          # Main HTML file
├── presidente.css           # Styles
├── game-config.js           # Configuration constants
├── game-events.js           # Event handling and utilities
├── game.js                  # Main game logic
├── jquery-3.5.1.min.js      # jQuery library
└── card.png                 # Card background image
```

### Architecture Layers

#### 1. Domain Models (`game.js`)
- **Card**: Represents individual playing cards with comparison logic
- **Deck**: Manages card collection, shuffling, and dealing
- **Player**: Represents a player with hand management
- **GameState**: Manages game rules and state transitions

#### 2. UI Management (`game.js`)
- **UIManager**: Handles all DOM interactions and visual updates
- Separates UI concerns from business logic

#### 3. Game Controller (`game.js`)
- **GameController**: Orchestrates the entire game flow
- Coordinates between domain models and UI
- Handles user interactions

#### 4. Configuration (`game-config.js`)
- **GameConfig**: Centralized configuration constants
- Easy to modify game rules and UI settings

#### 5. Events and Utilities (`game-events.js`)
- **GameEventEmitter**: Event-driven communication
- **GameUtils**: Utility functions for common operations
- **GameErrorHandler**: Centralized error handling

## SOLID Principles Applied

### Single Responsibility Principle (SRP)
- Each class has a single, well-defined responsibility
- `Card` handles card logic only
- `UIManager` handles UI only
- `GameState` manages game state only

### Open/Closed Principle (OCP)
- Classes are open for extension but closed for modification
- New card types can be added without modifying existing code
- New UI themes can be added by extending UIManager

### Liskov Substitution Principle (LSP)
- All implementations can be substituted without breaking functionality
- Card comparison works consistently across all card types

### Interface Segregation Principle (ISP)
- Classes depend only on the interfaces they use
- Event listeners only subscribe to events they need

### Dependency Inversion Principle (DIP)
- High-level modules don't depend on low-level modules
- Both depend on abstractions
- GameController depends on interfaces, not concrete implementations

## Key Improvements

### 1. Separation of Concerns
- **Business Logic**: Separated from UI logic
- **Configuration**: Centralized in config file
- **Event Handling**: Dedicated event system
- **Error Handling**: Centralized error management

### 2. Maintainability
- **Modular Structure**: Each file has a specific purpose
- **Clear Naming**: Descriptive class and method names
- **Documentation**: Comprehensive JSDoc comments
- **Consistent Patterns**: Uniform coding style

### 3. Testability
- **Dependency Injection**: Easy to mock dependencies
- **Pure Functions**: Utility functions are pure and testable
- **Event-Driven**: Easy to test event interactions
- **Isolated Components**: Each class can be tested independently

### 4. Extensibility
- **Configuration-Driven**: Easy to change game rules
- **Event System**: Easy to add new features
- **Modular Design**: Easy to add new card types or UI themes
- **Plugin Architecture**: Easy to extend functionality

## Usage

### Starting a New Game

```javascript
// The game automatically initializes when the page loads
// Or manually start a new game:
gameController.startNewGame();
```

### Event Handling

```javascript
// Listen for game events
gameController.gameState.eventEmitter.on('cardPlayed', (data) => {
    console.log('Card played:', data);
});

gameController.gameState.eventEmitter.on('turnChanged', (data) => {
    console.log('Turn changed to player:', data.playerIndex);
});
```

### Configuration

```javascript
// Modify game rules in game-config.js
GameConfig.NUMBER_OF_PLAYERS = 6;  // Change number of players
GameConfig.CARDS_PER_PLAYER = 8;   // Change cards per player
```

## Game Rules

### Setup
1. Enter 4 player names
2. Click "Novo Jogo" to start
3. Each player receives 13 cards

### Gameplay
1. Players take turns in sequence
2. Play cards higher than the current highest card
3. Use "Passar Turno" to skip your turn
4. Winner of each round starts the next round

### Card Values
- 3 < 4 < 5 < 6 < 7 < 8 < 9 < 10 < J < Q < K < A < 2

## Development Guidelines

### Adding New Features

1. **New Card Types**: Extend the `Card` class
2. **New UI Elements**: Extend the `UIManager` class
3. **New Game Rules**: Modify `GameState` class
4. **New Events**: Add to `GameEvents` in `game-events.js`

### Testing

```javascript
// Example test structure
describe('Card', () => {
    test('should compare cards correctly', () => {
        const card1 = new Card('hearts', 'A', 12);
        const card2 = new Card('spades', 'K', 11);
        expect(card1.compareTo(card2)).toBe(1);
    });
});
```

### Error Handling

```javascript
// Errors are automatically logged and handled
GameErrorHandler.handleError(error, 'CardPlay');
```

## Performance Considerations

- **Event Debouncing**: Prevents excessive UI updates
- **Efficient DOM Queries**: Cached element references
- **Memory Management**: Proper cleanup of event listeners
- **Optimized Rendering**: Batch UI updates when possible

## Browser Compatibility

- Modern browsers with ES6+ support
- jQuery 3.5.1+ for DOM manipulation
- CSS3 animations for visual effects

## Future Enhancements

1. **AI Players**: Add computer-controlled players
2. **Network Multiplayer**: Add online multiplayer support
3. **Custom Rules**: Allow custom game rule configurations
4. **Statistics**: Add game statistics and history
5. **Animations**: Enhanced card animations and effects
6. **Sound Effects**: Add audio feedback
7. **Mobile Support**: Optimize for mobile devices
8. **Accessibility**: Add screen reader support

## Contributing

1. Follow the established architecture patterns
2. Add comprehensive documentation
3. Write tests for new features
4. Use the event system for communication
5. Keep configuration in the config file
6. Handle errors gracefully 