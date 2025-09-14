# Quiz Application Code Structure

This project has been refactored from a single monolithic JavaScript file to a modular structure with separated concerns.

## Directory Structure

```
├── js/
│   ├── utils/
│   │   ├── storage.js      # Local storage utilities
│   │   └── ui.js           # UI helper functions
│   ├── app.js              # Main entry point and initialization
│   ├── navigation.js       # Tab switching and navigation
│   ├── tagManagement.js    # Tag creation and management
│   ├── asksChat.js         # Chat feature functionality
│   ├── quizManagement.js   # Quiz creation, editing, and display
│   ├── quizTaking.js       # Quiz session functionality
│   └── quizResults.js      # Quiz results display
├── api.js                  # API communication functions
├── config.js               # Configuration settings
├── index.html              # Main HTML structure
└── styles.css              # CSS styles
```

## Module Responsibilities

### Utils

- **storage.js**: Handles saving and retrieving data from localStorage, including quiz state persistence.
- **ui.js**: Contains utility functions for UI formatting and data transformation.

### Feature Modules

- **app.js**: Main entry point that initializes all modules and sets up event listeners.
- **navigation.js**: Manages tab switching between different application views.
- **tagManagement.js**: Handles tag creation, selection, and UI for quiz organization.
- **asksChat.js**: Implements the chat feature for asking questions.
- **quizManagement.js**: Manages quiz creation, editing, card display and filtering.
- **quizTaking.js**: Handles the quiz-taking experience including questions, answers, and timer.
- **quizResults.js**: Displays quiz results and statistics after quiz completion.

## Core Files

- **api.js**: Contains all API communication functions for quiz operations.
- **config.js**: Contains configuration settings like API URL.
- **index.html**: Main HTML structure defining the UI components.

## How It Works

1. **app.js** initializes the application and sets up event handlers
2. Each module handles its own specific functionality and exposes only necessary public methods
3. The modules communicate through well-defined interfaces

## Benefits of Modularization

1. **Improved Maintainability**: Each module focuses on a specific feature, making code easier to understand and update.
2. **Better Organization**: Code is logically grouped by functionality.
3. **Separation of Concerns**: Different parts of the application are properly isolated.
4. **Easier Testing**: Modules can be tested independently.
5. **Scalability**: New features can be added without modifying existing code.

## How to Use

Simply include the app.js module in your HTML file as a type="module":

```html
<script src="js/app.js" type="module"></script>
```

The application will initialize all modules and set up the required functionality.
