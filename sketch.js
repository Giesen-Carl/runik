const size = 600;
const rowsAndCols = 13;
const rectSize = size / rowsAndCols;
let turnplayer = 0;
let field;
let selection = {
    active: false,
    pos: {
        x: -1,
        y: -1,
    },
    optionsIndex: 1000,
    options: {}
}
let mouseDown = false;

function setup() {
    createCanvas(size, size);
    generateField();
    field[6][6].rune = 0;
    field[5][5] = {
        rune: 1,
        player: 0
    }
    field[7][7] = {
        rune: 3,
        player: 1,
    }
}

function draw() {
    background(220);
    handleInput();
    handleRender();
}
let count = 0;
function handleInput() {
    // Handle Mouse Clicks
    if (mouseIsPressed) {
        if (mouseDown) {
            return;
        }
        mouseDown = true;
        const mousePos = getInboundMouse();
        // Click rune field
        if (isNotEmpty(mousePos)) {
            if (selection.active && mousePos.x === selection.pos.x && mousePos.y === selection.pos.y) {
                selection.active = false;
            } else if (field[mousePos.x][mousePos.y].player === turnplayer) {
                selection.active = true;
                selection.pos.x = mousePos.x;
                selection.pos.y = mousePos.y;
                // Generate Options
                selection.options = generateOptions(mousePos);
            }
        }
        // Click option field
        const optionField = selection.options[`${mousePos.x}-${mousePos.y}`];
        if (selection.active && optionField) {
            field[mousePos.x][mousePos.y].rune = optionField.o[selection.optionsIndex % optionField.o.length];
            field[mousePos.x][mousePos.y].player = turnplayer;
            for (const path of optionField.p) {
                field[path.x][path.y].rune = 0;
                field[path.x][path.y].player = turnplayer;
            }
            selection.active = false;
            selection.pos.x = -1;
            selection.pos.y = -1;
            selection.options = {};
            turnplayer = turnplayer === 1 ? 0 : 1;
        }
    } else {
        mouseDown = false;
    }
}

function handleRender() {
    // Draw all Squares
    iterateField((cell, x, y) => {
        drawRect(x, y, getPlayerColor(cell.player), getRuneText(cell.rune))
    });
    // Draw Option Plates
    if (selection.active) {
        for (const option of Object.values(selection.options)) {
            drawRect(option.t.x, option.t.y, 170, getRuneText(field[option.t.x][option.t.y].rune))
        }
    }

    // Draw hover field
    const mousePos = getInboundMouse();
    drawRect(mousePos.x, mousePos.y, 140, getRuneText(field[mousePos.x][mousePos.y].rune));
    // Draw hover Option field
    const hoveredField = selection.options[`${mousePos.x}-${mousePos.y}`];
    if (!isNotEmpty(mousePos) && selection.active && hoveredField) {
        drawRect(mousePos.x, mousePos.y, 140, getRuneText(hoveredField.o[selection.optionsIndex % hoveredField.o.length]));
    }
}

function getInboundMouse() {
    if (mouseX < 0 || mouseX >= size || mouseY < 0 || mouseY >= size) {
        return { x: 0, y: 0 };
    }
    const x = Math.floor(mouseX * rowsAndCols / size);
    const y = Math.floor(mouseY * rowsAndCols / size);
    return { x, y }
}

function drawRect(xPos, yPos, color, t) {
    // Draw Rect
    fill(color);
    stroke(220)
    strokeWeight(rectSize / 20)
    rect(xPos * rectSize, yPos * rectSize, rectSize, rectSize);
    // Draw Text
    const textRatio = 2;
    fill(0);
    strokeWeight(0);
    textSize(rectSize / textRatio);
    text(t, (xPos + 0.5 - 0.5 / textRatio) * rectSize, (yPos + 0.5 + 0.5 / textRatio) * rectSize);
}

// Gets Called automatically
function mouseWheel(event) {
    if (event.delta < 0) {
        selection.optionsIndex++;
    } else {
        selection.optionsIndex--;
        if (selection.optionsIndex < 0) {
            selection.optionsIndex = 1000;
        }
    }
}

function getRuneText(rune) {
    let runeText;
    switch (rune) {
        case -1: runeText = ''; break;
        case 0: runeText = '.'; break;
        case 1: runeText = 'o'; break;
        case 2: runeText = '+'; break;
        case 3: runeText = '[  ]'; break;
        case 4: runeText = '^'; break;
        case 5: runeText = '*'; break;
    }
    return runeText;
}

function getPlayerColor(player) {
    let color;
    switch (player) {
        case -1: color = 120; break;
        case 0: color = 'blue'; break;
        case 1: color = 'green'; break;
    }
    return color;
}

function generateField() {
    field = [];
    for (let i = 0; i < rowsAndCols; i++) {
        if (field[i] === undefined) {
            field[i] = [];
        }
        for (let j = 0; j < rowsAndCols; j++) {
            field[i][j] = {
                // Players:
                // -1 - neutral
                // 0 - Player1
                // 1 - Player2
                player: -1,
                rune: -1,
            }
        }
    }
}

function generateOptions(pos) {
    const x = pos.x;
    const y = pos.y;
    const rune = field[x][y].rune;
    const player = field[x][y].player;
    const options = [];
    const addOpt = getOptionAdder(options);
    // Blocker
    if (rune === 0) {
        return {};
    }

    // Blocker options
    addOpt(x - 1, y - 1, [0], []);
    addOpt(x - 1, y, [0], []);
    addOpt(x - 1, y + 1, [0], []);
    addOpt(x, y - 1, [0], []);
    addOpt(x, y, [0], []);
    addOpt(x, y + 1, [0], []);
    addOpt(x + 1, y - 1, [0], []);
    addOpt(x + 1, y, [0], []);
    addOpt(x + 1, y + 1, [0], []);

    addRuneOptions(pos, addOpt);

    validateOptionsAndAppendMoves(options, player);

    return indexOptions(options);
}

function validateOptionsAndAppendMoves(options, player) {
    for (const option of options) {
        for (const rune of option.o) {
            const move = genMove(option.t, rune, player, option.p);
            if (testMove(move)) {
                option.m[rune] = move;
            }
        }
    }
    console.log(options)
}

function genMove(pos, rune, player, p) {
    return {
        pos: pos,
        before: {
            rune: field[pos.x][pos.y].rune,
            player: field[pos.x][pos.y].player,
        },
        after: {
            rune: rune,
            player: player,
        },
        path: p,
    }
}

function addRuneOptions(pos, addOpt) {
    const x = pos.x;
    const y = pos.y;
    const rune = field[x][y].rune;
    // Circle
    if (rune === 1) {
        const o = [2, 3, 4, 5];
        addOpt(x - 1, y - 1, o, []);
        addOpt(x - 1, y, o, []);
        addOpt(x - 1, y + 1, o, []);
        addOpt(x, y - 1, o, []);
        addOpt(x, y + 1, o, []);
        addOpt(x + 1, y - 1, o, []);
        addOpt(x + 1, y, o, []);
        addOpt(x + 1, y + 1, o, []);
    }

    // Cross
    if (rune === 2) {
        const o = [1, 3, 4, 5];
        addOpt(x - 1, y, o, []);
        addOpt(x - 2, y, o, [{ x: x - 1, y: y }]);
        addOpt(x - 3, y, o, [{ x: x - 1, y: y }, { x: x - 2, y: y }]);
        addOpt(x + 1, y, o, []);
        addOpt(x + 2, y, o, [{ x: x + 1, y: y }]);
        addOpt(x + 3, y, o, [{ x: x + 1, y: y }, { x: x + 2, y: y }]);
        addOpt(x, y - 1, o, []);
        addOpt(x, y - 2, o, [{ x: x, y: y - 1 }]);
        addOpt(x, y - 3, o, [{ x: x, y: y - 1 }, { x: x, y: y - 2 }]);
        addOpt(x, y + 1, o, []);
        addOpt(x, y + 2, o, [{ x: x, y: y + 1 }]);
        addOpt(x, y + 3, o, [{ x: x, y: y + 1 }, { x: x, y: y + 2 }]);
    }

    // Square
    if (rune === 3) {
        const o = [1, 2, 4, 5]
        addOpt(x - 1, y, o, []);
        addOpt(x + 1, y, o, []);
        addOpt(x, y - 1, o, []);
        addOpt(x, y + 1, o, []);
        addOpt(x - 2, y, o, [{ x: x - 1, y: y }]);
        addOpt(x + 2, y, o, [{ x: x + 1, y: y }]);
        addOpt(x, y - 2, o, [{ x: x, y: y - 1 }]);
        addOpt(x, y + 2, o, [{ x: x, y: y + 1 }]);
        addOpt(x - 2, y + 1, o, [{ x: x - 1, y: y }, { x: x - 2, y: y }]);
        addOpt(x - 2, y - 1, o, [{ x: x - 1, y: y }, { x: x - 2, y: y }]);
        addOpt(x + 2, y + 1, o, [{ x: x + 1, y: y }, { x: x + 2, y: y }]);
        addOpt(x + 2, y - 1, o, [{ x: x + 1, y: y }, { x: x + 2, y: y }]);
        addOpt(x + 1, y - 2, o, [{ x: x, y: y - 1 }, { x: x, y: y - 2 }]);
        addOpt(x - 1, y - 2, o, [{ x: x, y: y - 1 }, { x: x, y: y - 2 }]);
        addOpt(x + 1, y + 2, o, [{ x: x, y: y + 1 }, { x: x, y: y + 2 }]);
        addOpt(x - 1, y + 2, o, [{ x: x, y: y + 1 }, { x: x, y: y + 2 }]);
    }

    // Triangle
    if (rune === 4) {
        const o = [1, 2, 3, 5]
        addOpt(x - 1, y - 1, o, []);
        addOpt(x + 1, y - 1, o, []);
        addOpt(x - 1, y + 1, o, []);
        addOpt(x + 1, y + 1, o, []);
        addOpt(x - 2, y - 2, o, [{ x: x - 1, y: y - 1 }]);
        addOpt(x + 2, y - 2, o, [{ x: x + 1, y: y - 1 }]);
        addOpt(x - 2, y + 2, o, [{ x: x - 1, y: y + 1 }]);
        addOpt(x + 2, y + 2, o, [{ x: x + 1, y: y + 1 }]);
        addOpt(x - 3, y - 3, o, [{ x: x - 1, y: y - 1 }, { x: x - 2, y: y - 2 }]);
        addOpt(x + 3, y - 3, o, [{ x: x + 1, y: y - 1 }, { x: x + 2, y: y - 2 }]);
        addOpt(x - 3, y + 3, o, [{ x: x - 1, y: y + 1 }, { x: x - 2, y: y + 2 }]);
        addOpt(x + 3, y + 3, o, [{ x: x + 1, y: y + 1 }, { x: x + 2, y: y + 2 }]);
    }

    // Star
    if (rune === 5) {
        const o = [1, 2, 3, 4]
        addOpt(x - 1, y - 1, o, []);
        addOpt(x + 1, y - 1, o, []);
        addOpt(x - 1, y + 1, o, []);
        addOpt(x + 1, y + 1, o, []);
        addOpt(x - 2, y - 2, o, [{ x: x - 1, y: y - 1 }]);
        addOpt(x + 2, y - 2, o, [{ x: x + 1, y: y - 1 }]);
        addOpt(x - 2, y + 2, o, [{ x: x - 1, y: y + 1 }]);
        addOpt(x + 2, y + 2, o, [{ x: x + 1, y: y + 1 }]);
        addOpt(x - 3, y - 1, o, [{ x: x - 1, y: y - 1 }, { x: x - 2, y: y - 2 }]);
        addOpt(x + 3, y - 1, o, [{ x: x + 1, y: y - 1 }, { x: x + 2, y: y - 2 }]);
        addOpt(x - 3, y + 1, o, [{ x: x - 1, y: y + 1 }, { x: x - 2, y: y + 2 }]);
        addOpt(x + 3, y + 1, o, [{ x: x + 1, y: y + 1 }, { x: x + 2, y: y + 2 }]);
        addOpt(x - 1, y - 3, o, [{ x: x - 1, y: y - 1 }, { x: x - 2, y: y - 2 }]);
        addOpt(x + 1, y - 3, o, [{ x: x + 1, y: y - 1 }, { x: x + 2, y: y - 2 }]);
        addOpt(x - 1, y + 3, o, [{ x: x - 1, y: y + 1 }, { x: x - 2, y: y + 2 }]);
        addOpt(x + 1, y + 3, o, [{ x: x + 1, y: y + 1 }, { x: x + 2, y: y + 2 }]);

        // addOpt([[x + 1, y + 1], [x + 2, y + 2], [x + 1, y + 3]], o);
    }
}


function indexOptions(arr) {
    let options = {}
    for (const elem of arr) {
        options[`${elem.t.x}-${elem.t.y}`] = elem;
    }
    return options;
}

function addOptions(arr, opt) {
    // check target square
    if (isNotEmpty(opt.t)) {
        return;
    }
    // check path squares
    for (const path of opt.p) {
        if (isNotEmpty(path)) {
            return;
        }
    }
    // push to array
    for (const existing of arr) {
        if (existing.t.x === opt.t.x && existing.t.y === opt.t.y) {
            existing.o.push(...opt.o)
            return;
        }
    }
    arr.push(opt);
}

function getOptionAdder(options) {
    return (x, y, o, p) => addOptions(options, { t: { x, y }, o, p, m: {} });

    // return (p, o) => addMove(options, p, o);
}

function addMove(options, p, o, player) {
    // check path squares
    for (const path of p) {
        if (isNotEmpty({ x: path[0], y: path[1] })) {
            return;
        }
    }
}

function isNotEmpty(pos) {
    return pos.x < 0 || pos.x >= rowsAndCols || pos.y < 0 || pos.y >= rowsAndCols || field[pos.x][pos.y].rune !== -1;
}

function isPlaceable(pos, player) {
    return pos.x >= 0 && pos.x < rowsAndCols && pos.y >= 0 && pos.y < rowsAndCols && field[pos.x][pos.y].rune !== 0 && field[pos.x][pos.y].player !== player;
}

function doMove(move) {
    field[move.pos.x][move.pos.y].rune = move.after.rune;
    field[move.pos.x][move.pos.y].player = move.after.player;
    for (const path of move.path) {
        field[path[0]][path[1]].rune = 0;
        field[path[0]][path[1]].player = move.after.player;
    }
}

function undoMove(move) {
    field[move.pos.x][move.pos.y].rune = move.before.rune;
    field[move.pos.x][move.pos.y].player = move.before.player;
    for (const path of move.path) {
        field[path[0]][path[1]].rune = -1;
        field[path[0]][path[1]].player = -1;
    }
}

function testMove(move) {
    doMove(move);
    const valid = !isAttacked(move.after.player);
    undoMove(move);
    return valid;
}

function isAttacked(player) {
    const attackedFields = [];
    const playerFields = [];
    iterateField((cell, x, y) => {
        if (cell.player === player) {
            playerFields.push(`${x}-${y}`);
        } else {
            attackedFields.push(...getAttackedFields({ x, y }, cell.player));
        }
    });
    return new Set([...attackedFields, ...playerFields]).size !== attackedFields.length + playerFields.length;
}

function getAttackedFields(pos, player) {
    const options = [];
    const addOpt = (x, y, o, p) => {
        const opt = { t: { x, y }, o, p };
        // check target square
        if (!isPlaceable(opt.t, player)) {
            return;
        }
        // check path squares
        for (const path of opt.p) {
            if (isNotEmpty(path)) {
                return;
            }
        }
        options.push(`${x}-${y}`);
    }
    addRuneOptions(pos, addOpt);
    return options;
}

function iterateField(doStuff) {
    for (let x = 0; x < rowsAndCols; x++) {
        for (let y = 0; y < rowsAndCols; y++) {
            doStuff(field[x][y], x, y);
        }
    }
}