const game = {
    size: 600,
    rowsAndCols: 13,
    mouseDown: false,
    turnplayer: 0,
    selection: {
        active: false,
        pos: {
            x: -1,
            y: -1,
        },
        optionsIndex: 1000,
    },
    field: [],
    moves: [],
    history: [],
}

function setup() {
    createCanvas(game.size, game.size);
    generateField();
    game.field[6][6].rune = 0;
    game.field[5][5] = {
        rune: 1,
        player: 0
    }
    game.field[7][7] = {
        rune: 1,
        player: 1,
    }
    game.moves = generateMoves();
}

function draw() {
    background(220);
    handleInput();
    handleRender();
}

function handleInput() {
    // Handle Mouse Clicks
    if (mouseIsPressed) {
        if (game.mouseDown) {
            return;
        }
        game.mouseDown = true;
        if (mouseButton === 'left') {
            const mousePos = getInboundMouse();
            // Click rune field
            if (!isEmpty(mousePos)) {
                const options = game.moves[game.turnplayer].filter(move => compPos(mousePos, move.sourcePos));
                if (game.selection.active && compPos(mousePos, game.selection.pos)) {
                    game.selection.active = false;
                } else if (
                    game.field[mousePos.x][mousePos.y].player === game.turnplayer &&
                    options.length > 0
                ) {
                    game.selection.active = true;
                    game.selection.pos = mousePos;
                }
            }
            // Click option field
            const moveOptions =
                game.selection.active ? game.moves[game.turnplayer]
                    .filter(move => compPos(game.selection.pos, move.sourcePos))
                    .filter(move => compPos(mousePos, move.targetPos))
                    : [];
            if (moveOptions.length > 0) {
                const move = moveOptions[game.selection.optionsIndex % moveOptions.length]
                doMove(move);
                game.history.push(move);
                // Confirm move
                game.selection.active = false;
                game.selection.pos.x = -1;
                game.selection.pos.y = -1;
                game.turnplayer = game.turnplayer === 1 ? 0 : 1;
            }
        } else if (mouseButton === 'center' && game.history.length > 0) {
            const move = game.history.pop();
            undoMove(move);
            // Confirm move
            game.selection.active = false;
            game.selection.pos.x = -1;
            game.selection.pos.y = -1;
            game.turnplayer = game.turnplayer === 1 ? 0 : 1;
        }
    } else {
        game.mouseDown = false;
    }
}

function compPos(pos1, pos2) {
    return pos1.x === pos2.x && pos1.y === pos2.y;
}

function handleRender() {
    // Draw all Squares
    iterateField((cell, pos) => {
        drawRect(pos, getPlayerColor(cell.player), cell.rune)
    });
    if (game.selection.active) {
        const moveOptions = game.moves[game.turnplayer].filter(move => compPos(game.selection.pos, move.sourcePos));
        const optionPlatePositions = moveOptions.map(move => move.targetPos);
        // Draw Option Plates
        optionPlatePositions.forEach(pos => drawRect(pos, 170, game.field[pos.x][pos.y].rune));
        const mousePos = getInboundMouse();
        if (isEmpty(mousePos) && optionPlatePositions.find(pos => compPos(pos, mousePos))) {
            const optionPlateMoves = moveOptions.filter(move => compPos(mousePos, move.targetPos));
            drawRect(mousePos, 140, optionPlateMoves[game.selection.optionsIndex % optionPlateMoves.length].after.rune);
        }
    }
}

function getInboundMouse() {
    if (mouseX < 0 || mouseX >= game.size || mouseY < 0 || mouseY >= game.size) {
        return { x: 0, y: 0 };
    }
    const x = Math.floor(mouseX * game.rowsAndCols / game.size);
    const y = Math.floor(mouseY * game.rowsAndCols / game.size);
    return { x, y }
}

function drawRect(pos, color, rune) {
    const rectSize = game.size / game.rowsAndCols;
    const xPos = pos.x;
    const yPos = pos.y
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
    text(getRuneText(rune), (xPos + 0.5 - 0.5 / textRatio) * rectSize, (yPos + 0.5 + 0.5 / textRatio) * rectSize);
}

// Gets Called automatically
function mouseWheel(event) {
    if (event.delta < 0) {
        game.selection.optionsIndex++;
    } else {
        game.selection.optionsIndex--;
        if (game.selection.optionsIndex < 0) {
            game.selection.optionsIndex = 1000;
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
    if (player > -1 && game.moves[player].length === 0) {
        return 'red';
    }
    switch (player) {
        case -1: color = 120; break;
        case 0: color = 'blue'; break;
        case 1: color = 'green'; break;
    }
    return color;
}

function generateField() {
    for (let i = 0; i < game.rowsAndCols; i++) {
        if (game.field[i] === undefined) {
            game.field[i] = [];
        }
        for (let j = 0; j < game.rowsAndCols; j++) {
            game.field[i][j] = {
                player: -1,
                rune: -1,
            }
        }
    }
}

function generateMoves() {
    let options = {
        '0': [],
        '1': [],
    }
    iterateField((field, pos) => {
        if (field.player > -1 && field.rune > 0) {
            // BLOCKER
            for (let i = -1; i <= 1; i++) {
                for (let j = -1; j <= 1; j++) {
                    if (i !== 0 || j !== 0) {
                        const targetPos = { x: pos.x + i, y: pos.y + j };
                        if (isEmpty(targetPos)) {
                            const move = genMove(pos, targetPos, 0, field.player, []);
                            if (testMove(move)) {
                                options[field.player].push(move);
                            }
                        }
                    }
                }
            }
            // RUNES
            const placeableRunes = [1, 2, 3, 4, 5].filter(r => r !== field.rune);
            getAttackedFields(pos).forEach(f => placeableRunes.forEach(pr => {
                const move = genMove(pos, f.pos, pr, field.player, f.paths);
                if (testMove(move)) {
                    options[field.player].push(move);
                }
            }))
        }
    });
    return options;
}

function genMove(sourcePos, targetPos, rune, player, path) {
    const move = {
        sourcePos: sourcePos,
        targetPos: targetPos,
        before: {
            rune: game.field[targetPos.x][targetPos.y].rune,
            player: game.field[targetPos.x][targetPos.y].player,
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
    return pos.x >= 0 && pos.x < game.rowsAndCols && pos.y >= 0 && pos.y < game.rowsAndCols && game.field[pos.x][pos.y].rune === -1;
}

function isPlaceable(pos, player) {
    return pos.x >= 0 && pos.x < game.rowsAndCols && pos.y >= 0 && pos.y < game.rowsAndCols && game.field[pos.x][pos.y].rune !== 0 && game.field[pos.x][pos.y].player !== player;
}

function doMove(move, updateOptions = true) {
    game.field[move.targetPos.x][move.targetPos.y].rune = move.after.rune;
    game.field[move.targetPos.x][move.targetPos.y].player = move.after.player;
    for (const path of move.path) {
        game.field[path.x][path.y].rune = 0;
        game.field[path.x][path.y].player = move.after.player;
    }
    if (updateOptions) {
        game.moves = generateMoves();
    }
}

function undoMove(move, updateOptions = true) {
    game.field[move.targetPos.x][move.targetPos.y].rune = move.before.rune;
    game.field[move.targetPos.x][move.targetPos.y].player = move.before.player;
    for (const path of move.path) {
        game.field[path.x][path.y].rune = -1;
        game.field[path.x][path.y].player = -1;
    }
    if (updateOptions) {
        game.moves = generateMoves();
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
    iterateField((cell, pos) => {
        if (cell.player === player) {
            playerFields.push(`${pos.x}-${pos.y}`);
        } else {
            attackedFields.push(...getAttackedFields(pos, cell.player).map(f => `${f.pos.x}-${f.pos.y}`));
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
            pos: lastPos,
            paths: behindPath
        });
    }
    return positions;
}

function getAttackedFields(pos) {
    const x = pos.x;
    const y = pos.y;
    const rune = game.field[x][y].rune;
    const player = game.field[x][y].player;
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
    for (let x = 0; x < game.rowsAndCols; x++) {
        for (let y = 0; y < game.rowsAndCols; y++) {
            doStuff(game.field[x][y], { x, y });
        }
    }
}