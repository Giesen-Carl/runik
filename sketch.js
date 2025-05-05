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
let allOptions;

function setup() {
    createCanvas(size, size);
    generateField();
    field[6][6].rune = 0;
    field[5][5] = {
        rune: 1,
        player: 0
    }
    field[7][7] = {
        rune: 1,
        player: 1,
    }
    allOptions = generateAllOptions();
}

function draw() {
    background(220);
    handleInput();
    handleRender();
}

function handleInput() {
    // Handle Mouse Clicks
    if (mouseIsPressed) {
        if (mouseDown) {
            return;
        }
        mouseDown = true;
        const mousePos = getInboundMouse();
        // Click rune field
        if (!isEmpty(mousePos)) {
            const options = allOptions[turnplayer][`${mousePos.x}-${mousePos.y}`];
            if (selection.active && mousePos.x === selection.pos.x && mousePos.y === selection.pos.y) {
                selection.active = false;
            } else if (
                field[mousePos.x][mousePos.y].player === turnplayer &&
                Object.keys(allOptions[turnplayer]).length > 0 &&
                options
            ) {
                selection.active = true;
                selection.pos.x = mousePos.x;
                selection.pos.y = mousePos.y;
                // Generate Options
                selection.options = options;

            }
        }
        // Click option field
        const optionField = selection.options[`${mousePos.x}-${mousePos.y}`];
        if (selection.active && optionField) {
            const keys = Object.keys(optionField.m);
            const rune = keys[selection.optionsIndex % keys.length];
            const move = optionField.m[rune];
            doMove(move);
            // Confirm move
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
    if (isEmpty(mousePos) && selection.active && hoveredField) {
        const keys = Object.keys(hoveredField.m);
        drawRect(mousePos.x, mousePos.y, 140, getRuneText(keys[selection.optionsIndex % keys.length]));
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
    switch (parseInt(rune)) {
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
                player: -1,
                rune: -1,
            }
        }
    }
}

function generateAllOptions() {
    let options = {
        '0': {},
        '1': {},
    }
    iterateField((field, x, y) => {
        if (field.player > -1) {
            const generatedOptions = generateOptions({ x, y });
            if (Object.keys(generatedOptions).length > 0) {
                options[field.player][`${x}-${y}`] = generatedOptions;
            }
        }
    });
    return options;
}

const exampleValidatedOptions = {
    '6-8': {
        m: {
            '0': {
                pos: {
                    x: 6,
                    y: 8
                },
                path: [],
                before: {
                    rune: -1,
                    player: -1,
                },
                after: {
                    rune: 0,
                    player: 0,
                }
            }
        },
    },
}

function generateOptions2(pos) {
    const x = pos.x;
    const y = pos.y;
    const rune = field[x][y].rune;
    const player = field[x][y].player;
    let options = {};
    const blockerFields = getBlockerFields(pos);
    console.log('BLOCKER FIELDS', blockerFields);
}

function getBlockerFields(pos) {
    const blockerFields = [];
    for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
            if (i !== 0 || j !== 0) {
                const targetPos = { x: pos.x + i, y: pos.y + j };
                if (isEmpty(targetPos)) {
                    blockerFields.push(targetPos);
                }
            }
        }
    }
    return blockerFields;
}

function generateOptions(pos) {
    const x = pos.x;
    const y = pos.y;
    const rune = field[x][y].rune;
    const player = field[x][y].player;
    const options = [];
    const addOpt = (x, y, o, p) => {
        // check target square
        if (!isEmpty({ x, y })) {
            return;
        }
        // check path squares
        for (const path of p) {
            if (!isEmpty(path)) {
                return;
            }
        }
        // push to array
        for (const existing of options) {
            if (existing.t.x === x && existing.t.y === y) {
                existing.o.push(...o)
                return;
            }
        }
        options.push({ t: { x, y }, o, p, m: {} });
    }
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

    const validatedOptions = validateOptions(options, player);
    console.log('VALIDATED OPTIONS', validatedOptions)
    return validatedOptions;
}

function validateOptions(options, player) {
    const indexedOptions = {};
    for (const option of options) {
        for (const rune of option.o) {
            const move = genMove(option.t, rune, player, option.p);
            if (testMove(move)) {
                option.m[rune] = move;
            }
        }
        if (Object.keys(option.m).length !== 0) {
            indexedOptions[`${option.t.x}-${option.t.y}`] = option;
        }
    }
    return indexedOptions;
}

function genMove(pos, rune, player, p) {
    const move = {
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
    };
    // return testMove(move) ? [move] : [];
    return move;
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
    }
}

function isEmpty(pos) {
    return !(pos.x < 0 || pos.x >= rowsAndCols || pos.y < 0 || pos.y >= rowsAndCols || field[pos.x][pos.y].rune !== -1);
}

function isPlaceable(pos, player) {
    return pos.x >= 0 && pos.x < rowsAndCols && pos.y >= 0 && pos.y < rowsAndCols && field[pos.x][pos.y].rune !== 0 && field[pos.x][pos.y].player !== player;
}

function doMove(move, updateOptions = true) {
    field[move.pos.x][move.pos.y].rune = move.after.rune;
    field[move.pos.x][move.pos.y].player = move.after.player;
    for (const path of move.path) {
        field[path.x][path.y].rune = 0;
        field[path.x][path.y].player = move.after.player;
    }
    if (updateOptions) {
        allOptions = generateAllOptions();
    }
}

function undoMove(move, updateOptions = true) {
    field[move.pos.x][move.pos.y].rune = move.before.rune;
    field[move.pos.x][move.pos.y].player = move.before.player;
    for (const path of move.path) {
        field[path.x][path.y].rune = -1;
        field[path.x][path.y].player = -1;
    }
    if (updateOptions) {
        allOptions = generateAllOptions();
    }
}

function testMove(move) {
    doMove(move, false);
    const valid = !isAttacked(move.after.player);
    undoMove(move, false);
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
    return new Set([...attackedFields, ...playerFields]).size !== new Set(attackedFields).size + playerFields.length;
}

function processPath(posArr, player) {
    const mappedPosArr = posArr.map(pos => { return { x: pos[0], y: pos[1] } });
    if (posArr.length === 0) {
        return [];
    }
    const lastPos = mappedPosArr[mappedPosArr.length - 1]
    if (!isPlaceable(lastPos, player)) {
        return [];
    }
    if (mappedPosArr.length > 1) {
        for (const pos of mappedPosArr.slice(0, -1)) {
            if (!isEmpty(pos)) {
                return [];
            }
        }
    }
    return [`${lastPos.x}-${lastPos.y}`];
}

function processPaths(paths, player) {
    const positions = [];
    for (const path of paths) {
        const mappedPath = path.map(pos => { return { x: pos[0], y: pos[1] } });
        const lastPos = mappedPath[mappedPath.length - 1]
        if (
            mappedPath.length === 0 ||
            !isPlaceable(lastPos, player) ||
            mappedPath.length > 1 && mappedPath.slice(0, -1).some(pos => !isEmpty(pos))
        ) {
            continue;
        }
        positions.push(`${lastPos.x}-${lastPos.y}`);
    }
    return positions;
}

function getAttackedFields(pos) {
    const x = pos.x;
    const y = pos.y;
    const rune = field[x][y].rune;
    const player = field[x][y].player;
    const attackedFields = [];
    switch (rune) {
        case 1: attackedFields.push(...processPaths([
            [[x - 1, y - 1]],
            [[x - 1, y]],
            [[x - 1, y + 1]],
            [[x, y - 1]],
            [[x, y + 1]],
            [[x + 1, y - 1]],
            [[x + 1, y]],
            [[x + 1, y + 1]],
        ], player));
            break;
        case 2: attackedFields.push(...processPaths([
            [[x - 1, y]],
            [[x - 1, y], [x - 2, y]],
            [[x - 1, y], [x - 2, y], [x - 3, y]],
            [[x + 1, y]],
            [[x + 1, y], [x + 2, y]],
            [[x + 1, y], [x + 2, y], [x + 3, y]],
            [[x, y - 1]],
            [[x, y - 1], [x, y - 2]],
            [[x, y - 1], [x, y - 2], [x, y - 3]],
            [[x, y + 1]],
            [[x, y + 1], [x, y + 2]],
            [[x, y + 1], [x, y + 2], [x, y + 3]],
        ], player));
            break;
        case 3: attackedFields.push(...processPaths([
            [[x - 1, y]],
            [[x + 1, y]],
            [[x, y - 1]],
            [[x, y + 1]],
            [[x - 1, y], [x - 2, y]],
            [[x + 1, y], [x + 2, y]],
            [[x, y - 1], [x, y - 2]],
            [[x, y + 1], [x, y + 2]],
            [[x - 1, y], [x - 2, y], [x - 2, y + 1]],
            [[x + 1, y], [x + 2, y], [x + 2, y + 1]],
            [[x, y - 1], [x, y - 2], [x + 1, y - 2]],
            [[x, y + 1], [x, y + 2], [x + 1, y + 2]],
            [[x - 1, y], [x - 2, y], [x - 2, y - 1]],
            [[x + 1, y], [x + 2, y], [x + 2, y - 1]],
            [[x, y - 1], [x, y - 2], [x - 1, y - 2]],
            [[x, y + 1], [x, y + 2], [x - 1, y + 2]],
        ], player));
            break;
        case 4: attackedFields.push(...processPaths([
            [[x - 1, y - 1]],
            [[x + 1, y - 1]],
            [[x - 1, y + 1]],
            [[x + 1, y + 1]],
            [[x - 1, y - 1], [x - 2, y - 2]],
            [[x + 1, y - 1], [x + 2, y - 2]],
            [[x - 1, y + 1], [x - 2, y + 2]],
            [[x + 1, y + 1], [x + 2, y + 2]],
            [[x - 1, y - 1], [x - 2, y - 2], [x - 3, y - 3]],
            [[x + 1, y - 1], [x + 2, y - 2], [x + 3, y - 3]],
            [[x - 1, y + 1], [x - 2, y + 2], [x - 3, y + 3]],
            [[x + 1, y + 1], [x + 2, y + 2], [x + 3, y + 3]],
        ], player));
            break;
        case 5: attackedFields.push(...processPaths([
            [[x - 1, y - 1]],
            [[x + 1, y - 1]],
            [[x - 1, y + 1]],
            [[x + 1, y + 1]],
            [[x - 1, y - 1], [x - 2, y - 2]],
            [[x + 1, y - 1], [x + 2, y - 2]],
            [[x - 1, y + 1], [x - 2, y + 2]],
            [[x + 1, y + 1], [x + 2, y + 2]],
            [[x - 1, y - 1], [x - 2, y - 2], [x - 3, y - 1]],
            [[x + 1, y - 1], [x + 2, y - 2], [x + 3, y - 1]],
            [[x - 1, y + 1], [x - 2, y + 2], [x - 3, y + 1]],
            [[x + 1, y + 1], [x + 2, y + 2], [x + 3, y + 1]],
            [[x - 1, y - 1], [x - 2, y - 2], [x - 1, y - 3]],
            [[x + 1, y - 1], [x + 2, y - 2], [x + 1, y - 3]],
            [[x - 1, y + 1], [x - 2, y + 2], [x - 1, y + 3]],
            [[x + 1, y + 1], [x + 2, y + 2], [x + 1, y + 3]],
        ], player));
            break;
    };
    return attackedFields;
}

function iterateField(doStuff) {
    for (let x = 0; x < rowsAndCols; x++) {
        for (let y = 0; y < rowsAndCols; y++) {
            doStuff(field[x][y], x, y);
        }
    }
}