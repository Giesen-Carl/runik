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
    options: []
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
            const options = allOptions[turnplayer].find(o => o.after.pos.x === mousePos.x && o.pos.y === mousePos.y);
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
        const optionField = selection.options.find(o => o.pos.x === mousePos.x && o.pos.y === mouseDown.pos.y)
        if (selection.active && optionField) {
            const keys = Object.keys(optionField);
            const rune = keys[selection.optionsIndex % keys.length];
            const move = optionField[rune];
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
            if (Object.values(option).length > 0) {
                const pos = Object.values(option)[0].pos;
                drawRect(pos.x, pos.y, 170, getRuneText(field[pos.x][pos.y].rune))
            }
        }
    }

    // Draw hover field
    const mousePos = getInboundMouse();
    drawRect(mousePos.x, mousePos.y, 140, getRuneText(field[mousePos.x][mousePos.y].rune));
    // Draw hover Option field
    const hoveredField = selection.options[`${mousePos.x}-${mousePos.y}`];
    if (isEmpty(mousePos) && selection.active && hoveredField) {
        const keys = Object.keys(hoveredField);
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
        '0': [],
        '1': [],
    }
    iterateField((field, x, y) => {
        if (field.player > -1) {
            const generatedOptions = generateOptions({ x, y });
            console.log(generatedOptions)
            if (generatedOptions.length > 0) {
                options[field.player] = generatedOptions;
            }
        }
    });
    return options;
}

function addMoveToOptions(options, pos, rune, player, path) {
    const move = genMove(pos, rune, player, path);
    if (testMove(move)) {
        options.push(move);
    }
}

function generateOptions(pos) {
    const x = pos.x;
    const y = pos.y;
    const rune = field[x][y].rune;
    const player = field[x][y].player;
    const placeableRunes = [1, 2, 3, 4, 5].filter(r => r !== rune);
    let options = [];
    // Return {} if Rune is Blocker
    if (rune <= 0) {
        return {};
    }
    // Add Blocker Options
    const blockerFields = getBlockerFields(pos);
    blockerFields.forEach(pos => addMoveToOptions(options, pos, 0, player, []));
    // Add Rune Options
    getAttackedFields(pos).forEach(ret => placeableRunes.forEach(pr => addMoveToOptions(options, ret.pos, pr, player, ret.paths)))
    return options;
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

function genMove(pos, rune, player, path) {
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
        path: path,
    };
    return move;
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
            attackedFields.push(...getAttackedFields({ x, y }, cell.player).map(f => f.posString));
        }
    });
    return new Set([...attackedFields, ...playerFields]).size !== new Set(attackedFields).size + playerFields.length;
}

function processPaths(paths, player) {
    const positions = [];
    for (const path of paths) {
        const mappedPath = path.map(pos => { return { x: pos[0], y: pos[1] } });
        const lastPos = mappedPath[mappedPath.length - 1];
        const behindPath = mappedPath.slice(0, -1);
        if (
            mappedPath.length === 0 ||
            !isPlaceable(lastPos, player) ||
            mappedPath.length > 1 && behindPath.some(pos => !isEmpty(pos))
        ) {
            continue;
        }
        positions.push({
            posString: `${lastPos.x}-${lastPos.y}`,
            pos: lastPos,
            paths: behindPath
        });
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