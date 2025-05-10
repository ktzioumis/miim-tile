// Function to shuffle the board ensuring no row contains 3 or more letters of any word
function shuffleBoard(board, words) {
  const columns = board[0].map((_, colIndex) => board.map(row => row[colIndex])); // Extract columns
  
  function isValidRow(row, words) {
    for (let word of words) {
      let count = 0;
      for (let letter of word) {
        if (row.includes(letter)) {
          count++;
        }
      }
      if (count >= 3) return false;
    }
    return true;
  }

  let validShuffle = false;
  let attempts = 0;
  const maxAttempts = 3;

  while (!validShuffle && attempts < maxAttempts) {
    attempts++;

    // Shuffle each column
    columns.forEach(column => {
      for (let i = column.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [column[i], column[j]] = [column[j], column[i]];
      }
    });

    // Reconstruct the board
    const shuffledBoard = columns[0].map((_, rowIndex) =>
      columns.map(column => column[rowIndex])
    );

    validShuffle = shuffledBoard.every(row => isValidRow(row, words));
    if (validShuffle) return shuffledBoard;
  }

  // Return null if failed
  return null;
}


// Function to find alternative column solutions
function findAlternativeColumnSolutions(board, dictionary, words) {
  const columns = board[0].map((_, colIndex) => board.map(row => row[colIndex])); // Extract columns
  const possibleColumnArrangements = [];
  
  // Check for all column permutations
  const permuteColumns = (arr, start = 0) => {
    if (start === arr.length) {
      // If all columns are arranged, check if they form valid words
      const permutedBoard = arr[0].map((_, rowIndex) => arr.map(column => column[rowIndex]));
      const permutedWords = permutedBoard.map(row => row.join(''));
      if (permutedWords.every(word => words.includes(word))) {
        possibleColumnArrangements.push(permutedWords);
      }
    } else {
      for (let i = start; i < arr.length; i++) {
        [arr[start], arr[i]] = [arr[i], arr[start]];
        permuteColumns([...arr], start + 1);
        [arr[start], arr[i]] = [arr[i], arr[start]]; // Swap back
      }
    }
  };
  
  permuteColumns(columns);
  
  return possibleColumnArrangements;
}

// Generate a new random puzzle with the modified shuffle logic
function generatePuzzle() {
  let shuffledBoard = null;
  let selectedWords = [];

  while (!shuffledBoard) {
    selectedWords = [];
    while (selectedWords.length < 4) {
      const randomWord = dictionary[Math.floor(Math.random() * dictionary.length)];
      if (!selectedWords.includes(randomWord)) {
        selectedWords.push(randomWord);
      }
    }

    const board = selectedWords.map(word => word.split(''));
    shuffledBoard = shuffleBoard(board, selectedWords); // Try to shuffle the board

    // If shuffleBoard fails, loop continues and new words are picked
  }

  return { board: shuffledBoard, words: selectedWords };
}


// Initialize the game board with a new puzzle
let currentPuzzle = generatePuzzle(); // Store both board and words
let gameBoard = currentPuzzle.board;
let puzzleWords = currentPuzzle.words;

// Tile change counters
let puzzlesSolved = 0;
let isSolutionViewed = false; // Flag to track if the solution has been viewed

// Create the game board UI
const gameContainer = document.getElementById('game-container');
let draggedTile = null; // Track the tile being dragged
let lastMoveTile = null; // Track the last moved tile for visual change

let isGenerating = false; // Flag to prevent generating a new puzzle while one is in progress

function renderBoard() {
  console.log("Rendering board...");  // Add a log to track function execution
  
  // Ensure the game container exists
  if (!gameContainer) {
    console.error("Game container not found!");
    return;
  }
  
  gameContainer.innerHTML = ''; // Clear previous board
  
  // If gameBoard is empty or undefined, log an error and exit
  if (!gameBoard || gameBoard.length === 0) {
    console.error("Game board is empty or not initialized!");
    return;
  }

  gameBoard.forEach((row, rowIndex) => {
    row.forEach((tile, columnIndex) => {
      const tileElement = document.createElement('div');
      tileElement.textContent = tile;
      tileElement.setAttribute('draggable', true);
      tileElement.dataset.row = rowIndex;
      tileElement.dataset.column = columnIndex;

      tileElement.ondragstart = (e) => {
        draggedTile = e.target;
      };

      tileElement.ondragend = () => {};

      tileElement.ondragover = (e) => {
        e.preventDefault(); // Allow dropping
      };

      tileElement.ondrop = (e) => {
        const targetTile = e.target;
        const targetRow = parseInt(targetTile.dataset.row);
        const targetColumn = parseInt(targetTile.dataset.column);

        const draggedRow = parseInt(draggedTile.dataset.row);
        const draggedColumn = parseInt(draggedTile.dataset.column);

        // Ensure drag-and-drop happens within the same column
        if (targetColumn === draggedColumn) {
          // Swap tiles in the board array
          [gameBoard[draggedRow][draggedColumn], gameBoard[targetRow][targetColumn]] =
            [gameBoard[targetRow][targetColumn], gameBoard[draggedRow][draggedColumn]];

          
          // Re-render the board
          renderBoard();

          // Check if the current board matches any alternative solution
          const alternativeSolutions = findAlternativeColumnSolutions(gameBoard, dictionary, puzzleWords);

          // If there's a matching alternative solution, prompt the user
          if (alternativeSolutions.length > 0) {
            const solutionMessage = `Congratulations! You found a solution: ${alternativeSolutions[0].join(', ')}`;
            // const userConfirmation = confirm(`${solutionMessage}\nDo you want to keep this arrangement?`);

            // if (userConfirmation) {
            //   // Optionally, update the solution state or store the found solution
            //   alert('You have kept the alternative solution!');
            // } else {
            //   // Revert the swap if the user decides not to keep it
            //   [gameBoard[draggedRow][draggedColumn], gameBoard[targetRow][targetColumn]] =
            //     [gameBoard[targetRow][targetColumn], gameBoard[draggedRow][draggedColumn]];

            //   renderBoard(); // Re-render the board to revert the move
            // }
          }

          // Check solution after every move
          checkSolution();
        }
      };

      gameContainer.appendChild(tileElement);
    });
  });
}

// Listen for the "New Puzzle" button click to generate a new puzzle
document.getElementById('new-puzzle-btn').addEventListener('click', () => {
  if (isGenerating) return;

  isGenerating = true;
  const newPuzzleButton = document.getElementById('new-puzzle-btn');
  newPuzzleButton.disabled = true;

  currentPuzzle = generatePuzzle(); // Generate a new puzzle
  gameBoard = currentPuzzle.board; // Set the new board
  puzzleWords = currentPuzzle.words; // Set the new puzzle words

  renderBoard(); // Render the new puzzle
  document.getElementById('solution').innerHTML = ''; // Clear the previous solution


  setTimeout(() => {
    isGenerating = false;
    newPuzzleButton.disabled = false;
  }, 5000);
});

// Listen for the "View Solution" button click to show the solution with confirmation
document.getElementById('view-solution-btn').addEventListener('click', () => {
  const confirmSolution = confirm("Are you sure you want to view the solution?");
  if (confirmSolution) {
    viewSolution(); // Show the solution
  }
});

// Check if the current board matches the solution (with words anywhere on the board)
function checkSolution() {
  const boardWords = gameBoard.flat().join('');
  
  // Check if each word is present in the current puzzle words
  const isSolved = puzzleWords.every(word => {
    return boardWords.includes(word);
  });

  if (isSolved) {
    setTimeout(() => {
      alert('Congratulations! You solved the puzzle!');
    }, 50);
  }
}

// Function to show the solution by displaying the correct words
function viewSolution() {
  const solutionDiv = document.getElementById('solution');
  if (solutionDiv) {
    solutionDiv.innerHTML = `<h3>Solution:</h3><ul>${puzzleWords.map(word => `<li>${word}</li>`).join('')}</ul>`;
    isSolutionViewed = true;
  }
}

// Call renderBoard initially to show the first puzzle
renderBoard();
