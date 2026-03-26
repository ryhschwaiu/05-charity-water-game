const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const gameFrame = canvas.parentElement;

const actionPopupEl = document.createElement('div');
actionPopupEl.className = 'action-popup';
gameFrame.appendChild(actionPopupEl);

// UI Elements
const startOverlay = document.getElementById('startOverlay');
const gameOverOverlay = document.getElementById('gameOverOverlay');
const pauseOverlay = document.getElementById('pauseOverlay');
const startButton = document.getElementById('startButton');
const restartButton = document.getElementById('restartButton');
const mainMenuButton = document.getElementById('mainMenuButton');
const pauseButton = document.getElementById('pauseButton');
const continueButton = document.getElementById('continueButton');
const pauseRestartButton = document.getElementById('pauseRestartButton');
const quitButton = document.getElementById('quitButton');

// Score Elements & Game Over Message
const scoreValue = document.getElementById('scoreValue');
const finalScoreValue = document.getElementById('finalScoreValue');
const highScoreValue = document.getElementById('highScoreValue');
const jerryCansValue = document.getElementById('jerryCansValue');
const gameOverMessage = document.getElementById('gameOverMessage');
const startOverlayCard = startOverlay ? startOverlay.querySelector('.overlay-card') : null;

const DIFFICULTY_LABELS = {
    easy: 'The Spring – Easy',
    normal: 'The Pool – Normal',
    hard: 'The Well – Hard',
    test: 'Test Mode'
};

// Optional difficulty DOM (created if missing)
let difficultySelect = document.getElementById('difficultySelect');
if (!difficultySelect && startOverlay) {
    difficultySelect = document.createElement('select');
    difficultySelect.id = 'difficultySelect';
    const difficultyOptions = ['easy', 'normal', 'hard', 'test'];
    for (let i = 0; i < difficultyOptions.length; i += 1) {
        const option = document.createElement('option');
        option.value = difficultyOptions[i];
        option.textContent = DIFFICULTY_LABELS[difficultyOptions[i]] || difficultyOptions[i];
        if (difficultyOptions[i] === 'normal') {
            option.selected = true;
        }
        difficultySelect.appendChild(option);
    }
}

if (difficultySelect && startOverlayCard) {
    // Keep the difficulty menu inside the main menu card above the Start button.
    if (startButton && startButton.parentElement === startOverlayCard) {
        startOverlayCard.insertBefore(difficultySelect, startButton);
    } else {
        startOverlayCard.appendChild(difficultySelect);
    }
}

if (difficultySelect) {
    const requiredDifficulties = ['easy', 'normal', 'hard', 'test'];
    for (let i = 0; i < requiredDifficulties.length; i += 1) {
        const level = requiredDifficulties[i];
        let option = difficultySelect.querySelector(`option[value="${level}"]`);
        if (!option) {
            option = document.createElement('option');
            option.value = level;
            difficultySelect.appendChild(option);
        }

        option.textContent = DIFFICULTY_LABELS[level] || level;
    }
}

// Game Constants
const DEFAULT_GRID_COLS = 4;
const HARD_MODE_GRID_COLS = 3;
const BASE_TILE_SIZE = 120;
const HARD_VISIBLE_ROWS = 4;
const FIXED_CANVAS_WIDTH = HARD_MODE_GRID_COLS * BASE_TILE_SIZE;
const FIXED_CANVAS_HEIGHT = HARD_VISIBLE_ROWS * BASE_TILE_SIZE;
const HAZARDS = ['hatch', 'contaminant', 'pest'];

// Starting parameters
const BASE_WATER_SPEED = 1.0;
const START_PLAYER_ROW = 0;
const START_PLAYER_COL = 0;
const MAX_ROWS_BUFFER = 90;

// Carry and delivery scoring
const JERRY_CAN_DELIVERY_POINTS = 3;

// Difficulty settings
const DIFFICULTY_SETTINGS = {
    easy: {
        gridCols: 5,
        waterSpeedMult: 1,
        maxPlayerWaterLead: 10,
        distributionChance: 0.12,
        pestChanceBase: 0.04,
        pestChanceDepthScale: 0.001,
        contaminantChanceBase: 0.08,
        contaminantChanceDepthScale: 0.002,
        hatchChanceBase: 0.05,
        hatchChanceDepthScale: 0.001,
        jerryCanChanceBase: 0.2,
        jerryCanChanceDepthScale: 0.003
    },
    normal: {
        gridCols: 4,
        waterSpeedMult: 1.75,
        maxPlayerWaterLead: 9,
        distributionChance: 0.12,
        pestChanceBase: 0.06,
        pestChanceDepthScale: 0.0015,
        contaminantChanceBase: 0.1,
        contaminantChanceDepthScale: 0.003,
        hatchChanceBase: 0.07,
        hatchChanceDepthScale: 0.0015,
        jerryCanChanceBase: 0.15,
        jerryCanChanceDepthScale: 0.002
    },
    hard: {
        gridCols: 3,
        waterSpeedMult: 2.5,
        maxPlayerWaterLead: 7,
        distributionChance: 0.12,
        pestChanceBase: 0.1,
        pestChanceDepthScale: 0.0025,
        contaminantChanceBase: 0.14,
        contaminantChanceDepthScale: 0.004,
        hatchChanceBase: 0.1,
        hatchChanceDepthScale: 0.0025,
        jerryCanChanceBase: 0.12,
        jerryCanChanceDepthScale: 0.0015
    },
    test: {
        gridCols: 4,
        waterSpeedMult: 0,
        maxPlayerWaterLead: Number.POSITIVE_INFINITY,
        distributionChance: 0,
        pestChanceBase: 0,
        pestChanceDepthScale: 0,
        contaminantChanceBase: 0,
        contaminantChanceDepthScale: 0,
        hatchChanceBase: 0,
        hatchChanceDepthScale: 0,
        jerryCanChanceBase: 0,
        jerryCanChanceDepthScale: 0
    }
};

const DIFFICULTY_COLOR_SCHEMES = {
    easy: {
        ui: {
            pageText: '#000000',
            bgA: '#BAE3F1',
            bgB: '#B8E3D1',
            panelBackground: '#FCF5E3',
            panelBorder: '#0F80BA',
            heading: '#1E2659',
            accent: '#FFC907',
            button: '#0F80BA',
            buttonHover: '#004A3E',
            keyText: '#1E2659',
            keyShadow: 'rgba(30, 38, 89, 0.22)',
            canvasBorder: '#1E2659',
            overlay: 'rgba(30, 38, 89, 0.45)',
            footerBackground: 'linear-gradient(90deg, #FCF5E3 0%, #BAE3F1 100%)',
            footerText: '#1E2659',
            footerLink: '#004A3E',
            footerLinkHover: '#0F80BA'
        },
        game: {
            pipe: '#B8E3D1',
            empty: '#FCF5E3',
            player: '#FFC907',
            water: '#0F80BA',
            hatch: '#E88B79',
            contaminant: '#000000',
            pest: '#1E2659',
            distribution: '#00AC80',
            text: '#000000',
            brandAccent: '#00AC80',
            gridLine: '#BAE3F1'
        }
    },
    normal: {
        ui: {
            pageText: '#000000',
            bgA: '#F5B99E',
            bgB: '#E9C7B8',
            panelBackground: '#F6F2E0',
            panelBorder: '#909134',
            heading: '#224A4F',
            accent: '#FFC907',
            button: '#224A4F',
            buttonHover: '#1C2B41',
            keyText: '#1C2B41',
            keyShadow: 'rgba(28, 43, 65, 0.22)',
            canvasBorder: '#224A4F',
            overlay: 'rgba(28, 43, 65, 0.48)',
            footerBackground: 'linear-gradient(90deg, #F6F2E0 0%, #E9C7B8 100%)',
            footerText: '#224A4F',
            footerLink: '#C24F21',
            footerLinkHover: '#1C2B41'
        },
        game: {
            pipe: '#E9C7B8',
            empty: '#F6F2E0',
            player: '#FFC907',
            water: '#224A4F',
            hatch: '#F5B99E',
            contaminant: '#000000',
            pest: '#C24F21',
            distribution: '#909134',
            text: '#1C2B41',
            brandAccent: '#224A4F',
            gridLine: '#f0e1d7'
        }
    },
    hard: {
        ui: {
            pageText: '#212121',
            bgA: '#B1C3C4',
            bgB: '#EEF0ED',
            panelBackground: '#F5EEE3',
            panelBorder: '#646464',
            heading: '#212121',
            accent: '#FFC907',
            button: '#646464',
            buttonHover: '#212121',
            keyText: '#212121',
            keyShadow: 'rgba(33, 33, 33, 0.22)',
            canvasBorder: '#212121',
            overlay: 'rgba(33, 33, 33, 0.52)',
            footerBackground: 'linear-gradient(90deg, #F5EEE3 0%, #B1C3C4 100%)',
            footerText: '#212121',
            footerLink: '#646464',
            footerLinkHover: '#212121'
        },
        game: {
            pipe: '#B1C3C4',
            empty: '#EEF0ED',
            player: '#FFC907',
            water: '#212121',
            hatch: '#D9A690',
            contaminant: '#646464',
            pest: '#212121',
            distribution: '#646464',
            text: '#212121',
            brandAccent: '#D9A690',
            gridLine: '#d9ddd9'
        }
    },
    test: null
};

DIFFICULTY_COLOR_SCHEMES.test = DIFFICULTY_COLOR_SCHEMES.normal;

canvas.width = FIXED_CANVAS_WIDTH;
canvas.height = FIXED_CANVAS_HEIGHT;

// Load Jerry Can image
const jerryCanImg = new Image();
jerryCanImg.src = 'img/water-can-transparent.png';

let waterLevel = -3;

// Score is now split so progress points and delivery points never overwrite each other.
let depthScore = 0;
let deliveryScore = 0;
let score = 0;
let maxReachedRow = START_PLAYER_ROW;

let jerryCansCollected = 0;
let jerryCanReserves = 0;
const MAX_JERRY_CAN_RESERVES = 3;
const ACTION_POPUP_DURATION = 0.9;
let actionPopupTimer = 0;
let actionPopupMessage = '';

let highScore = Number(localStorage.getItem('freeFlowHighScore') || 0);
let jerryCansTotal = Number(localStorage.getItem('freeFlowJerryCans') || 0);
highScoreValue.textContent = `${highScore}`;
jerryCansValue.textContent = `${jerryCansTotal}`;

let waterSpeed = BASE_WATER_SPEED;
let guaranteedPathCol = START_PLAYER_COL;
let generationCount = 0;
let selectedDifficulty = 'normal';
let gridCols = DEFAULT_GRID_COLS;
let tileSize = FIXED_CANVAS_WIDTH / DEFAULT_GRID_COLS;

const colors = {
    pipe: '#8BD1CB',
    empty: '#e9f4f9',
    player: '#FFC907',
    water: '#2E9DF7',
    hatch: '#FF902A',
    contaminant: '#F5402C',
    pest: '#F16061',
    distribution: '#0E6BA8',
    text: '#17334a',
    brandAccent: '#1aa6b7',
    gridLine: '#d4e8f2'
};

function hexToRgba(hexColor, alpha) {
    const safeHex = (hexColor || '').replace('#', '');
    if (!/^[0-9A-Fa-f]{6}$/.test(safeHex)) {
        return `rgba(0, 0, 0, ${alpha})`;
    }

    const red = Number.parseInt(safeHex.slice(0, 2), 16);
    const green = Number.parseInt(safeHex.slice(2, 4), 16);
    const blue = Number.parseInt(safeHex.slice(4, 6), 16);
    return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function applyDifficultyTheme(difficultyLevel) {
    const themeKey = DIFFICULTY_COLOR_SCHEMES[difficultyLevel] ? difficultyLevel : 'normal';
    const theme = DIFFICULTY_COLOR_SCHEMES[themeKey];
    if (!theme) {
        return;
    }

    if (document.body) {
        document.body.setAttribute('data-theme', themeKey);
    }

    const rootStyle = document.documentElement.style;
    rootStyle.setProperty('--theme-page-text', theme.ui.pageText);
    rootStyle.setProperty('--theme-bg-a', theme.ui.bgA);
    rootStyle.setProperty('--theme-bg-b', theme.ui.bgB);
    rootStyle.setProperty('--theme-panel-bg', theme.ui.panelBackground);
    rootStyle.setProperty('--theme-panel-border', theme.ui.panelBorder);
    rootStyle.setProperty('--theme-heading', theme.ui.heading);
    rootStyle.setProperty('--theme-accent', theme.ui.accent);
    rootStyle.setProperty('--theme-button', theme.ui.button);
    rootStyle.setProperty('--theme-button-hover', theme.ui.buttonHover);
    rootStyle.setProperty('--theme-key-text', theme.ui.keyText);
    rootStyle.setProperty('--theme-key-shadow', theme.ui.keyShadow);
    rootStyle.setProperty('--theme-canvas-border', theme.ui.canvasBorder);
    rootStyle.setProperty('--theme-overlay', theme.ui.overlay);
    rootStyle.setProperty('--theme-footer-bg', theme.ui.footerBackground);
    rootStyle.setProperty('--theme-footer-text', theme.ui.footerText);
    rootStyle.setProperty('--theme-footer-link', theme.ui.footerLink);
    rootStyle.setProperty('--theme-footer-link-hover', theme.ui.footerLinkHover);

    Object.assign(colors, theme.game);
}

if (difficultySelect) {
    applyDifficultyTheme(difficultySelect.value || selectedDifficulty);
    difficultySelect.addEventListener('change', () => {
        applyDifficultyTheme(difficultySelect.value || 'normal');
    });
}

// Game State Variables
let rows = [];
let worldRows = new Map();
let worldTopRow = 0;
let animationId = null;
let lastTime = 0;
let gameState = 'start';

// Player State
let player = {
    row: START_PLAYER_ROW,
    col: START_PLAYER_COL,
    moveCooldown: 0
};

function makeTile(type, hazard = null, state = null) {
    return { type, hazard, state, collectible: null, special: null };
}

function updateScoreDisplay() {
    score = depthScore + deliveryScore;
    scoreValue.textContent = `${score}`;
}

function getDifficultySetting() {
    return DIFFICULTY_SETTINGS[selectedDifficulty] || DIFFICULTY_SETTINGS.normal;
}

function getVisibleRowCount() {
    return Math.max(1, Math.ceil(canvas.height / tileSize));
}

function showActionPopup(triggerType) {
    const popupMessages = {
        pickup: '+1 Jerry Can',
        distribution: 'Can(s) Distributed',
        cleared: 'Cleared',
        opened: 'Opened'
    };

    const message = popupMessages[triggerType];
    if (!message) {
        return;
    }

    actionPopupMessage = message;
    actionPopupTimer = ACTION_POPUP_DURATION;
}

function clearActionPopup() {
    actionPopupTimer = 0;
    actionPopupMessage = '';
    actionPopupEl.classList.remove('show');
}

function updateActionPopupElement(playerX, playerY, playerSize) {
    if (actionPopupTimer <= 0 || !actionPopupMessage) {
        actionPopupEl.classList.remove('show');
        return;
    }

    const progress = 1 - actionPopupTimer / ACTION_POPUP_DURATION;
    const popupRise = progress * 18;
    const popupAlpha = 1 - progress;

    const scaledPlayerCenterX = (playerX + playerSize / 2) * (canvas.clientWidth / canvas.width);
    const scaledPlayerTopY = playerY * (canvas.clientHeight / canvas.height);
    const popupTop = Math.max(6, scaledPlayerTopY - 14 - popupRise);
    const edgePadding = 8;
    const edgeThreshold = 56;
    const canvasWidth = canvas.clientWidth;

    actionPopupEl.textContent = actionPopupMessage;
    actionPopupEl.style.opacity = `${Math.max(0, popupAlpha)}`;
    actionPopupEl.style.top = `${popupTop}px`;
    actionPopupEl.style.maxWidth = `${Math.max(120, canvasWidth - edgePadding * 2)}px`;

    if (scaledPlayerCenterX <= edgeThreshold) {
        actionPopupEl.style.left = `${edgePadding}px`;
        actionPopupEl.style.transform = 'translate(0, -100%)';
        actionPopupEl.style.textAlign = 'left';
    } else if (scaledPlayerCenterX >= canvasWidth - edgeThreshold) {
        actionPopupEl.style.left = `${canvasWidth - edgePadding}px`;
        actionPopupEl.style.transform = 'translate(-100%, -100%)';
        actionPopupEl.style.textAlign = 'right';
    } else {
        actionPopupEl.style.left = `${scaledPlayerCenterX}px`;
        actionPopupEl.style.transform = 'translate(-50%, -100%)';
        actionPopupEl.style.textAlign = 'center';
    }

    actionPopupEl.classList.add('show');
}

function generateRow(depth = 0, requiredCol = START_PLAYER_COL) {
    const row = [];
    for (let col = 0; col < gridCols; col += 1) {
        row.push(makeTile('empty'));
    }
    let nextRequiredCol = requiredCol;

    row[requiredCol] = makeTile('pipe');

    for (let col = 0; col < gridCols; col += 1) {
        if (col !== requiredCol && Math.random() < 0.35) {
            row[col].type = 'pipe';
        }
    }

    if (Math.random() < 0.28) {
        const direction = Math.random() < 0.5 ? -1 : 1;
        const shiftedCol = requiredCol + direction;
        if (shiftedCol >= 0 && shiftedCol < gridCols) {
            row[shiftedCol].type = 'pipe';
            nextRequiredCol = shiftedCol;
        }
    }

    return { row, nextRequiredCol };
}

function isTileWalkable(tile) {
    return Boolean(tile && (tile.type === 'pipe' || tile.hazard === 'pest'));
}

function getSideFromTo(fromRow, fromCol, toRow, toCol) {
    if (fromRow === toRow - 1 && fromCol === toCol) {
        return 'top';
    }
    if (fromRow === toRow + 1 && fromCol === toCol) {
        return 'bottom';
    }
    if (fromCol === toCol - 1 && fromRow === toRow) {
        return 'left';
    }
    if (fromCol === toCol + 1 && fromRow === toRow) {
        return 'right';
    }
    return null;
}

function getConnectedPipeSides(rowIndex, colIndex) {
    const connectedSides = [];
    const neighbors = [
        { side: 'top', row: rowIndex - 1, col: colIndex },
        { side: 'right', row: rowIndex, col: colIndex + 1 },
        { side: 'bottom', row: rowIndex + 1, col: colIndex },
        { side: 'left', row: rowIndex, col: colIndex - 1 }
    ];

    for (let i = 0; i < neighbors.length; i += 1) {
        const neighbor = neighbors[i];
        const neighborTile = getTileAtWorld(neighbor.row, neighbor.col);
        if (neighborTile && neighborTile.type === 'pipe') {
            connectedSides.push(neighbor.side);
        }
    }

    return connectedSides;
}

function isTileAdjacentToPipe(rowIndex, colIndex) {
    return getConnectedPipeSides(rowIndex, colIndex).length > 0;
}

function canGenerateHatchAt(rowIndex, colIndex) {
    const tile = getTileAtWorld(rowIndex, colIndex);
    if (!tile || tile.type !== 'pipe') {
        return false;
    }
    const connectedSides = getConnectedPipeSides(rowIndex, colIndex);
    return connectedSides.length === 2;
}

function pruneDisconnectedPipeClusters(anchorRow, anchorCol) {
    const anchorTile = getTileAtWorld(anchorRow, anchorCol);
    if (!anchorTile || anchorTile.type !== 'pipe') {
        return;
    }

    const visited = new Set();
    const queue = [{ row: anchorRow, col: anchorCol }];

    while (queue.length > 0) {
        const current = queue.shift();
        const key = `${current.row},${current.col}`;
        if (visited.has(key)) {
            continue;
        }
        visited.add(key);

        const neighbors = [
            { row: current.row - 1, col: current.col },
            { row: current.row + 1, col: current.col },
            { row: current.row, col: current.col - 1 },
            { row: current.row, col: current.col + 1 }
        ];

        for (let i = 0; i < neighbors.length; i += 1) {
            const neighbor = neighbors[i];
            const neighborTile = getTileAtWorld(neighbor.row, neighbor.col);
            if (!neighborTile || neighborTile.type !== 'pipe') {
                continue;
            }

            const neighborKey = `${neighbor.row},${neighbor.col}`;
            if (!visited.has(neighborKey)) {
                queue.push(neighbor);
            }
        }
    }

    // Keep only the player-connected pipe network. Any other cluster is removed.
    for (let localRow = 0; localRow < rows.length; localRow += 1) {
        const worldRow = worldTopRow + localRow;
        for (let col = 0; col < gridCols; col += 1) {
            const tile = rows[localRow][col];
            if (!tile || tile.type !== 'pipe') {
                continue;
            }

            const key = `${worldRow},${col}`;
            if (!visited.has(key)) {
                rows[localRow][col] = makeTile('empty');
            }
        }
    }
}

function isPipeConnectedForSpecial(rowIndex, colIndex) {
    const tile = getTileAtWorld(rowIndex, colIndex);
    if (!tile || tile.type !== 'pipe') {
        return false;
    }
    return getConnectedPipeSides(rowIndex, colIndex).length > 0;
}

function maybeAddDistributionToRow(rowIndex, depth = 0) {
    if (rowIndex === START_PLAYER_ROW) {
        return;
    }

    const setting = getDifficultySetting();
    const distributionChance = setting.distributionChance ?? 0.12;

    if (depth <= 2 || Math.random() >= distributionChance) {
        return;
    }

    const distributionCandidates = [];
    for (let col = 0; col < gridCols; col += 1) {
        const tile = getTileAtWorld(rowIndex, col);
        if (!tile || tile.hazard || tile.collectible || tile.special) {
            continue;
        }
        if (isPipeConnectedForSpecial(rowIndex, col)) {
            distributionCandidates.push(col);
        }
    }

    if (distributionCandidates.length === 0) {
        return;
    }

    const randomIndex = Math.floor(Math.random() * distributionCandidates.length);
    const distributionCol = distributionCandidates[randomIndex];
    const targetTile = getTileAtWorld(rowIndex, distributionCol);

    if (targetTile) {
        targetTile.special = 'distribution';
    }
}

function maybeAddJerryCanToRow(rowIndex, depth = 0) {
    if (rowIndex === START_PLAYER_ROW) {
        return;
    }

    const setting = getDifficultySetting();
    const jerryCanChance = Math.min(
        setting.jerryCanChanceBase + depth * setting.jerryCanChanceDepthScale,
        0.4
    );

    if (Math.random() >= jerryCanChance) {
        return;
    }

    const jerryCanCandidates = [];
    for (let col = 0; col < gridCols; col += 1) {
        const tile = getTileAtWorld(rowIndex, col);
        if (!tile || tile.hazard || tile.collectible || tile.special) {
            continue;
        }
        if (isPipeConnectedForSpecial(rowIndex, col)) {
            jerryCanCandidates.push(col);
        }
    }

    if (jerryCanCandidates.length === 0) {
        return;
    }

    const randomIndex = Math.floor(Math.random() * jerryCanCandidates.length);
    const jerryCanCol = jerryCanCandidates[randomIndex];
    const targetTile = getTileAtWorld(rowIndex, jerryCanCol);

    if (targetTile) {
        targetTile.collectible = 'jerry_can';
    }
}

function maybeAddHazardToRow(rowIndex, depth = 0) {
    if (rowIndex === START_PLAYER_ROW) {
        return;
    }

    const setting = getDifficultySetting();
    const hazardChances = {
        pest: Math.min(
            setting.pestChanceBase + depth * setting.pestChanceDepthScale,
            0.3
        ),
        contaminant: Math.min(
            setting.contaminantChanceBase + depth * setting.contaminantChanceDepthScale,
            0.4
        ),
        hatch: Math.min(
            setting.hatchChanceBase + depth * setting.hatchChanceDepthScale,
            0.35
        )
    };

    const hazardRolls = [];
    for (let i = 0; i < HAZARDS.length; i += 1) {
        const hazardType = HAZARDS[i];
        if (Math.random() < hazardChances[hazardType]) {
            hazardRolls.push(hazardType);
        }
    }

    if (hazardRolls.length === 0) {
        return;
    }

    const randomHazard = hazardRolls[Math.floor(Math.random() * hazardRolls.length)];

    const hazardCandidates = [];
    for (let col = 0; col < gridCols; col += 1) {
        const tile = getTileAtWorld(rowIndex, col);
        if (!tile || tile.hazard || tile.special) {
            continue;
        }

        if (randomHazard === 'pest') {
            if (tile.type !== 'pipe' && isTileAdjacentToPipe(rowIndex, col)) {
                hazardCandidates.push(col);
            }
            continue;
        }

        if (randomHazard === 'hatch') {
            if (canGenerateHatchAt(rowIndex, col)) {
                hazardCandidates.push(col);
            }
            continue;
        }

        if (isPipeConnectedForSpecial(rowIndex, col)) {
            hazardCandidates.push(col);
        }
    }

    if (hazardCandidates.length === 0) {
        return;
    }

    const randomIndex = Math.floor(Math.random() * hazardCandidates.length);
    const hazardCol = hazardCandidates[randomIndex];
    const targetTile = getTileAtWorld(rowIndex, hazardCol);

    if (!targetTile) {
        return;
    }

    if (randomHazard === 'hatch') {
        targetTile.hazard = 'hatch';
        targetTile.state = 'closed';
        targetTile.openSide = null;
        return;
    }

    targetTile.hazard = randomHazard;
}

function getTileAtWorld(rowIndex, colIndex) {
    if (colIndex < 0 || colIndex >= gridCols) {
        return null;
    }
    if (rowIndex < worldTopRow || rowIndex >= worldTopRow + rows.length) {
        return null;
    }
    const localIndex = rowIndex - worldTopRow;
    const row = rows[localIndex];
    if (!row) {
        return null;
    }
    return row[colIndex] || null;
}

function ensureRowExistsAtWorldRow(targetWorldRow) {
    // Add rows at bottom until world row is inside loaded range.
    while (targetWorldRow >= worldTopRow + rows.length) {
        const nextDepth = generationCount;
        const nextWorldRow = worldTopRow + rows.length;
        const nextRowData = generateRow(nextDepth, guaranteedPathCol);
        rows.push(nextRowData.row);
        worldRows.set(nextWorldRow, nextRowData.row);

        pruneDisconnectedPipeClusters(player.row, player.col);

        const eligibleHazardRow = worldTopRow + rows.length - 2;
        if (eligibleHazardRow >= worldTopRow) {
            maybeAddDistributionToRow(eligibleHazardRow, Math.max(0, nextDepth - 1));
            maybeAddHazardToRow(eligibleHazardRow, Math.max(0, nextDepth - 1));
            maybeAddJerryCanToRow(eligibleHazardRow, Math.max(0, nextDepth - 1));
        }

        guaranteedPathCol = nextRowData.nextRequiredCol;
        generationCount += 1;
    }

    // Keep memory bounded.
    while (rows.length > MAX_ROWS_BUFFER) {
        rows.shift();
        worldTopRow += 1;
    }
}

function ensureRowLoadedAboveWorldTop(targetWorldRow) {
    while (targetWorldRow < worldTopRow) {
        const previousWorldRow = worldTopRow - 1;
        const cachedRow = worldRows.get(previousWorldRow);
        if (!cachedRow) {
            break;
        }

        worldTopRow = previousWorldRow;
        rows.unshift(cachedRow);

        if (rows.length > MAX_ROWS_BUFFER) {
            rows.pop();
        }
    }
}

function scrollWorldDownOneTile() {
    worldTopRow += 1;

    // Keep buffer aligned with camera: rows[0] must always represent worldTopRow.
    if (rows.length > 0) {
        rows.shift();
    }

    const targetBottomRow = worldTopRow + getVisibleRowCount() - 1;
    ensureRowExistsAtWorldRow(targetBottomRow);
}

function scrollWorldUpOneTile() {
    if (worldTopRow <= 0) {
        return;
    }
    const previousWorldRow = worldTopRow - 1;
    const cachedRow = worldRows.get(previousWorldRow);
    if (!cachedRow) {
        return;
    }

    worldTopRow = previousWorldRow;
    rows.unshift(cachedRow);

    if (rows.length > MAX_ROWS_BUFFER) {
        rows.pop();
    }
}

function applyPlayerTriggeredScroll() {
    const visibleRows = getVisibleRowCount();
    const scrollTriggerRowOffset = Math.max(1, visibleRows - 2);
    const downTriggerRow = worldTopRow + scrollTriggerRowOffset;
    const upTriggerRow = worldTopRow + 1;

    // Scroll down when player reaches lower trigger.
    if (player.row >= downTriggerRow) {
        scrollWorldDownOneTile();
    } else if (player.row <= upTriggerRow) {
        scrollWorldUpOneTile();
    }
}

function isValidMove(fromRow, fromCol, targetRow, targetCol) {
    if (targetCol < 0 || targetCol >= gridCols) {
        return false;
    }

    const isAdjacentMove =
        Math.abs(targetRow - fromRow) + Math.abs(targetCol - fromCol) === 1;
    if (!isAdjacentMove) {
        return false;
    }

    if (targetRow < worldTopRow) {
        ensureRowLoadedAboveWorldTop(targetRow);
    }
    ensureRowExistsAtWorldRow(targetRow);

    const currentTile = getTileAtWorld(fromRow, fromCol);
    if (currentTile && currentTile.hazard === 'hatch' && currentTile.state === 'closed') {
        const leavingSide = getSideFromTo(targetRow, targetCol, fromRow, fromCol);
        if (!currentTile.openSide || leavingSide !== currentTile.openSide) {
            return false;
        }
    }

    const tile = getTileAtWorld(targetRow, targetCol);
    if (!isTileWalkable(tile)) {
        return false;
    }

    if (tile.hazard === 'hatch' && tile.state === 'closed') {
        const entrySide = getSideFromTo(fromRow, fromCol, targetRow, targetCol);
        const connectedSides = getConnectedPipeSides(targetRow, targetCol);

        if (!connectedSides.includes(entrySide)) {
            return false;
        }
        if (tile.openSide && tile.openSide !== entrySide) {
            return false;
        }
    }

    return true;
}

function applyMoveResult(previousRow, previousCol) {
    const currentTile = getTileAtWorld(player.row, player.col);
    if (currentTile && currentTile.hazard === 'pest') {
        endGame('A pest got you.');
        return;
    }

    // Pick up jerry can (no score yet)
    if (currentTile && currentTile.collectible === 'jerry_can') {
        // Only consume the collectible if the player has reserve capacity.
        if (jerryCanReserves < MAX_JERRY_CAN_RESERVES) {
            currentTile.collectible = null;
            jerryCanReserves += 1;
            jerryCansCollected += 1;
            jerryCansTotal += 1;
            jerryCansValue.textContent = `${jerryCansTotal}`;
            localStorage.setItem('freeFlowJerryCans', `${jerryCansTotal}`);
            showActionPopup('pickup');
        }
    }

    // Deliver jerry can on distribution tile
    if (currentTile && currentTile.special === 'distribution' && jerryCanReserves > 0) {
        deliveryScore += jerryCanReserves * JERRY_CAN_DELIVERY_POINTS;
        jerryCanReserves = 0;
        updateScoreDisplay();
        showActionPopup('distribution');
    }

    // Depth score should only increase after a successful move to a new furthest row.
    if (player.row > maxReachedRow) {
        maxReachedRow = player.row;
        depthScore = Math.max(0, maxReachedRow - START_PLAYER_ROW);
        updateScoreDisplay();
    }

    applyPlayerTriggeredScroll();

    if (currentTile && currentTile.hazard === 'hatch' && currentTile.state === 'closed' && !currentTile.openSide) {
        currentTile.openSide = getSideFromTo(previousRow, previousCol, player.row, player.col);
    }

    player.moveCooldown = 0.12;
}

function tryMoveTo(nextRow, nextCol) {
    if (!isValidMove(player.row, player.col, nextRow, nextCol)) {
        return;
    }

    const previousRow = player.row;
    const previousCol = player.col;

    player.row = nextRow;
    player.col = nextCol;

    applyMoveResult(previousRow, previousCol);
}

function handleInput(event) {
    if (event.key === 'Escape') {
        event.preventDefault();
        if (gameState === 'playing') {
            pauseGame();
        } else if (gameState === 'paused') {
            continueGame();
        }
        return;
    }

    if (gameState !== 'playing') {
        return;
    }

    const key = event.key;

    if (key === ' ' || key === 'Spacebar') {
        event.preventDefault();
        interactWithCurrentTile();
        return;
    }

    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(key)) {
        return;
    }

    event.preventDefault();

    if (player.moveCooldown > 0) {
        return;
    }

    const nextPosition = { row: player.row, col: player.col };

    if (key === 'ArrowLeft') {
        nextPosition.col -= 1;
    } else if (key === 'ArrowRight') {
        nextPosition.col += 1;
    } else if (key === 'ArrowUp') {
        nextPosition.row -= 1;
    } else if (key === 'ArrowDown') {
        nextPosition.row += 1;
    }

    tryMoveTo(nextPosition.row, nextPosition.col);
}

function interactWithCurrentTile() {
    const tile = getTileAtWorld(player.row, player.col);
    if (!tile || tile.type !== 'pipe') {
        return;
    }

    if (tile.hazard === 'hatch' && tile.state === 'closed') {
        tile.state = 'open';
        tile.openSide = null;
        showActionPopup('opened');
        return;
    }

    if (tile.hazard === 'contaminant') {
        tile.hazard = null;
        tile.state = null;
        showActionPopup('cleared');
    }
}

function checkCollisions() {
    const visibleBottomRow = worldTopRow + rows.length - 1;
    if (player.row < worldTopRow || player.row > visibleBottomRow) {
        endGame('You scrolled off screen. (How?!)');
        return;
    }

    if (waterLevel >= player.row + 0.2) {
        endGame('The water reached the player.');
        return;
    }

    const maxDangerRow = Math.floor(waterLevel);
    for (let rowIndex = worldTopRow; rowIndex <= maxDangerRow; rowIndex += 1) {
        for (let col = 0; col < gridCols; col += 1) {
            const tile = getTileAtWorld(rowIndex, col);
            if (!tile) {
                continue;
            }
            if (tile.hazard === 'contaminant') {
                endGame('Water hit contamination. Flow is unsafe.');
                return;
            }
        }
    }
}

function updateGame(deltaTime) {
    if (gameState !== 'playing') {
        return;
    }

    // Difficulty + score scaling
    const setting = getDifficultySetting();
    const difficultyStep = Math.floor(score / 10);
    waterSpeed = (BASE_WATER_SPEED + difficultyStep * 0.025) * setting.waterSpeedMult;

    // New catch-up rule: player cannot exceed max lead from water.
    // If they do, speed up water proportionally.
    const leadDistance = player.row - waterLevel;
    const maxLeadDistance = setting.maxPlayerWaterLead || 9;
    if (Number.isFinite(maxLeadDistance) && leadDistance > maxLeadDistance) {
        const extraCatchup = (leadDistance - maxLeadDistance) * 0.35;
        waterSpeed += extraCatchup;
    }

    if (player.moveCooldown > 0) {
        player.moveCooldown = Math.max(0, player.moveCooldown - deltaTime);
    }

    if (actionPopupTimer > 0) {
        actionPopupTimer = Math.max(0, actionPopupTimer - deltaTime);
    }

    waterLevel += waterSpeed * deltaTime;

    checkCollisions();
}

function drawTileVisual(tile, x, y, timestampSeconds) {
    const stripeHeight = Math.max(4, tileSize * 0.07);
    const shouldUsePipeBackground = tile.type === 'pipe' || tile.hazard === 'pest';
    ctx.fillStyle = shouldUsePipeBackground ? colors.pipe : colors.empty;
    ctx.fillRect(x, y, tileSize, tileSize);

    // Subtle brand accent stripe for intentional style.
    ctx.fillStyle = hexToRgba(colors.brandAccent, 0.08);
    ctx.fillRect(x, y, tileSize, stripeHeight);

    ctx.strokeStyle = colors.gridLine;
    ctx.strokeRect(x, y, tileSize, tileSize);

    if (!tile.hazard && !tile.collectible && !tile.special) {
        return;
    }

    // Draw distribution tile
    if (tile.special === 'distribution') {
        const inset = tileSize * 0.13;
        ctx.fillStyle = colors.distribution;
        ctx.fillRect(x + inset, y + inset, tileSize - inset * 2, tileSize - inset * 2);

        ctx.fillStyle = '#ffffff';
        ctx.font = `${Math.max(10, tileSize * 0.1)}px "Proxima Nova", "Avenir Next", "Segoe UI", sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText('Depot', x + tileSize / 2, y + tileSize / 2 + 4);
    }

    // Draw Jerry Can collectible with gentle bob animation
    if (tile.collectible === 'jerry_can') {
        const bob = Math.sin(timestampSeconds * 4 + x * 0.01 + y * 0.01) * 3;
        const imgSize = tileSize * 0.42;
        const imgX = x + (tileSize - imgSize) / 2;
        const imgY = y + (tileSize - imgSize) / 2 + bob;

        if (jerryCanImg.complete) {
            ctx.drawImage(jerryCanImg, imgX, imgY, imgSize, imgSize);
        }
        return;
    }

    let label = '';
    let color = colors.text;

    if (tile.hazard === 'hatch') {
        label = tile.state === 'open' ? 'Hatch Open' : 'Hatch';
        color = colors.hatch;
    } else if (tile.hazard === 'contaminant') {
        label = 'Contam';
        color = colors.contaminant;
    } else if (tile.hazard === 'pest') {
        label = 'Pest';
        color = colors.pest;
    }

    if (label) {
        const labelInsetX = tileSize * 0.18;
        const labelInsetY = tileSize * 0.37;
        const labelHeight = tileSize * 0.25;
        ctx.fillStyle = color;
        ctx.fillRect(x + labelInsetX, y + labelInsetY, tileSize - labelInsetX * 2, labelHeight);

        ctx.fillStyle = '#ffffff';
        ctx.font = `${Math.max(10, tileSize * 0.1)}px "Proxima Nova", "Avenir Next", "Segoe UI", sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(label, x + tileSize / 2, y + labelInsetY + labelHeight * 0.65);
    }
}

function drawGame(timestampMs = 0) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let localRow = 0; localRow < rows.length; localRow += 1) {
        const row = rows[localRow];
        const worldRow = worldTopRow + localRow;
        const screenY = (worldRow - worldTopRow) * tileSize;

        if (screenY > canvas.height || screenY < -tileSize) {
            continue;
        }

        for (let col = 0; col < gridCols; col += 1) {
            const x = col * tileSize;
            drawTileVisual(row[col], x, screenY, timestampMs / 1000);
        }
    }

    // Player pulse animation
    const pulse = Math.sin(timestampMs / 180) * 2;
    const playerSize = tileSize * 0.6 + pulse;
    const playerY = (player.row - worldTopRow) * tileSize + (tileSize - playerSize) / 2;
    const playerX = player.col * tileSize + (tileSize - playerSize) / 2;

    ctx.fillStyle = colors.player;
    ctx.fillRect(playerX, playerY, playerSize, playerSize);

    // Fill player with water based on reserves (0 to 3).
    if (jerryCanReserves > 0) {
        const fillRatio = Math.min(1, jerryCanReserves / MAX_JERRY_CAN_RESERVES);
        const fillHeight = playerSize * fillRatio;
        const fillY = playerY + (playerSize - fillHeight);

        ctx.fillStyle = hexToRgba(colors.water, 0.85);
        ctx.fillRect(playerX, fillY, playerSize, fillHeight);

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
        ctx.lineWidth = 2;
        ctx.strokeRect(playerX, playerY, playerSize, playerSize);
    }

    // Action popup uses a DOM element so text can render beyond canvas edges when needed.
    updateActionPopupElement(playerX, playerY, playerSize);

    const waterScreenY = (waterLevel - worldTopRow) * tileSize;
    const clampedWaterY = Math.max(0, Math.min(canvas.height, waterScreenY));
    ctx.fillStyle = hexToRgba(colors.water, 0.35);
    ctx.fillRect(0, 0, canvas.width, clampedWaterY);

    ctx.strokeStyle = colors.water;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, clampedWaterY);
    ctx.lineTo(canvas.width, clampedWaterY);
    ctx.stroke();
}

function endGame(reason) {
    if (gameState !== 'playing') {
        return;
    }

    gameState = 'game-over';
    clearActionPopup();
    cancelAnimationFrame(animationId);

    updateScoreDisplay();
    finalScoreValue.textContent = `${score}`;
    gameOverMessage.textContent = reason;

    if (score > highScore) {
        highScore = score;
        highScoreValue.textContent = `${highScore}`;
        localStorage.setItem('freeFlowHighScore', `${highScore}`);

        const duration = 3000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

        const interval = setInterval(function () {
            const timeLeft = animationEnd - Date.now();
            if (timeLeft <= 0) {
                return clearInterval(interval);
            }
            const particleCount = 50 * (timeLeft / duration);
            confetti({
                ...defaults,
                particleCount,
                origin: { x: 0.1 + Math.random() * 0.2, y: Math.random() - 0.2 }
            });
            confetti({
                ...defaults,
                particleCount,
                origin: { x: 0.7 + Math.random() * 0.2, y: Math.random() - 0.2 }
            });
        }, 250);
    }

    pauseOverlay.classList.remove('show');
    gameOverOverlay.classList.add('show');
}

function pauseGame() {
    if (gameState !== 'playing') {
        return;
    }
    gameState = 'paused';
    cancelAnimationFrame(animationId);
    pauseOverlay.classList.add('show');
}

function continueGame() {
    if (gameState !== 'paused') {
        return;
    }
    gameState = 'playing';
    lastTime = 0;
    pauseOverlay.classList.remove('show');
    animationId = requestAnimationFrame(gameLoop);
}

function restartFromPause() {
    if (gameState !== 'paused') {
        return;
    }
    pauseOverlay.classList.remove('show');
    startGame();
}

function quitToMainMenu() {
    if (gameState !== 'paused') {
        return;
    }
    gameState = 'start';
    cancelAnimationFrame(animationId);
    setupNewGame();
    drawGame();
    pauseOverlay.classList.remove('show');
    gameOverOverlay.classList.remove('show');
    startOverlay.classList.add('show');
}

function gameOverToMainMenu() {
    if (gameState !== 'game-over') {
        return;
    }
    gameState = 'start';
    cancelAnimationFrame(animationId);
    setupNewGame();
    drawGame();
    gameOverOverlay.classList.remove('show');
    startOverlay.classList.add('show');
}

function setupNewGame() {
    rows = [];
    worldRows = new Map();
    worldTopRow = 0;
    generationCount = 0;
    guaranteedPathCol = START_PLAYER_COL;

    depthScore = 0;
    deliveryScore = 0;
    score = 0;
    maxReachedRow = START_PLAYER_ROW;
    jerryCansCollected = 0;
    jerryCanReserves = 0;
    clearActionPopup();
    updateScoreDisplay();

    player = {
        row: START_PLAYER_ROW,
        col: START_PLAYER_COL,
        moveCooldown: 0
    };

    waterLevel = -3;
    waterSpeed = BASE_WATER_SPEED;

    // Build extra rows so up/down scrolling has room immediately.
    const initialRows = getVisibleRowCount() + 12;
    for (let i = 0; i < initialRows; i += 1) {
        const rowData = generateRow(generationCount, guaranteedPathCol);
        const worldRow = worldTopRow + rows.length;
        rows.push(rowData.row);
        worldRows.set(worldRow, rowData.row);
        guaranteedPathCol = rowData.nextRequiredCol;
        generationCount += 1;
    }

    pruneDisconnectedPipeClusters(player.row, player.col);

    for (let localRow = 1; localRow < rows.length - 1; localRow += 1) {
        const rowIndex = worldTopRow + localRow;
        maybeAddDistributionToRow(rowIndex, localRow);
        maybeAddHazardToRow(rowIndex, localRow);
        maybeAddJerryCanToRow(rowIndex, localRow);
    }

    const spawnTile = getTileAtWorld(player.row, player.col);
    if (!isTileWalkable(spawnTile)) {
        const localRow = player.row - worldTopRow;
        rows[localRow][player.col] = makeTile('pipe');
    }
}

function gameLoop(timestamp) {
    if (!lastTime) {
        lastTime = timestamp;
    }

    const deltaTime = Math.min((timestamp - lastTime) / 1000, 0.1);
    lastTime = timestamp;

    updateGame(deltaTime);
    drawGame(timestamp);

    if (gameState === 'playing') {
        animationId = requestAnimationFrame(gameLoop);
    }
}

function startGame() {
    if (difficultySelect) {
        selectedDifficulty = difficultySelect.value || 'normal';
    }

    applyDifficultyTheme(selectedDifficulty);

    const setting = getDifficultySetting();
    gridCols = setting.gridCols || DEFAULT_GRID_COLS;
    tileSize = FIXED_CANVAS_WIDTH / gridCols;
    canvas.width = FIXED_CANVAS_WIDTH;
    canvas.height = FIXED_CANVAS_HEIGHT;

    setupNewGame();
    gameState = 'playing';
    lastTime = 0;
    startOverlay.classList.remove('show');
    gameOverOverlay.classList.remove('show');
    pauseOverlay.classList.remove('show');
    animationId = requestAnimationFrame(gameLoop);
}

// Touch Controls for Swiping
let touchStartX = 0;
let touchStartY = 0;

function handleTouchStart(event) {
    touchStartX = event.touches[0].clientX;
    touchStartY = event.touches[0].clientY;
}

function handleTouchEnd(event) {
    if (gameState !== 'playing') {
        return;
    }

    const touchEndX = event.changedTouches[0].clientX;
    const touchEndY = event.changedTouches[0].clientY;

    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;

    const minSwipeDistance = 40;
    const swipeDistance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    if (swipeDistance < minSwipeDistance) {
        interactWithCurrentTile();
        return;
    }

    const isHorizontal = Math.abs(deltaX) > Math.abs(deltaY);

    if (player.moveCooldown > 0) {
        return;
    }

    const nextPosition = { row: player.row, col: player.col };

    if (isHorizontal) {
        if (deltaX < 0) {
            nextPosition.col -= 1;
        } else {
            nextPosition.col += 1;
        }
    } else {
        if (deltaY < 0) {
            nextPosition.row -= 1;
        } else {
            nextPosition.row += 1;
        }
    }

    tryMoveTo(nextPosition.row, nextPosition.col);
}

startButton.addEventListener('click', startGame);
restartButton.addEventListener('click', startGame);
mainMenuButton.addEventListener('click', gameOverToMainMenu);
pauseButton.addEventListener('click', pauseGame);
continueButton.addEventListener('click', continueGame);
pauseRestartButton.addEventListener('click', restartFromPause);
quitButton.addEventListener('click', quitToMainMenu);
window.addEventListener('keydown', handleInput);
canvas.addEventListener('touchstart', handleTouchStart, false);
canvas.addEventListener('touchend', handleTouchEnd, false);

drawGame();