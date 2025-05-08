const players = [
    {
        id: 0,
        color: 'blue',
        type: 'human',
    }, {
        id: 1,
        color: 'green',
        // type: 'human',
        type: 'computer',
        strategy: (node) => {
            const moves = node.moves;
            return moves[1][Math.floor(Math.random() * moves[1].length)];
        },
    }
]

const game = {
    size: 600,
    rowsAndCols: 13,
    mouseDown: false,
    players: players,
    turnplayer: players[0],
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
    nextMove: undefined,
}

function setup() {
    createCanvas(game.size, game.size);
    generateField(game.field);
    game.field[6][6].rune = 0;
    game.field[5][5] = {
        rune: 1,
        player: game.players[0].id
    }
    game.field[7][7] = {
        rune: 1,
        player: game.players[1].id,
    }
    game.moves = generateMoves(game.field);
}

function draw() {
    background(220);
    handleInput();
    handleUpdate();
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
            if (!isEmpty(game.field, mousePos) && game.turnplayer.type === 'human') {
                const options = game.moves[game.turnplayer.id].filter(move => compPos(mousePos, move.sourcePos));
                if (game.selection.active && compPos(mousePos, game.selection.pos)) {
                    game.selection.active = false;
                } else if (
                    game.field[mousePos.x][mousePos.y].player === game.turnplayer.id &&
                    options.length > 0
                ) {
                    game.selection.active = true;
                    game.selection.pos = mousePos;
                }
            }
            // Click option field
            const moveOptions =
                game.selection.active ? game.moves[game.turnplayer.id]
                    .filter(move => compPos(game.selection.pos, move.sourcePos))
                    .filter(move => compPos(mousePos, move.targetPos))
                    : [];
            if (moveOptions.length > 0) {
                const move = moveOptions[game.selection.optionsIndex % moveOptions.length];
                game.nextMove = move;
            }
        } else if (mouseButton === 'center') {
            if (game.players.every(player => player.type === 'human' && game.history.length > 0)) {
                undoMove(game.field, game.history.pop());
                // Confirm move
                game.selection.active = false;
                game.selection.pos.x = -1;
                game.selection.pos.y = -1;
                game.turnplayer = game.players.find(player => player.id !== game.turnplayer.id);
            } else if (game.history.length > 0) {
                undoMove(game.field, game.history.pop());
                undoMove(game.field, game.history.pop());
                // Confirm move
                game.selection.active = false;
                game.selection.pos.x = -1;
                game.selection.pos.y = -1;
            }
        }
    } else {
        game.mouseDown = false;
    }
}

function handleUpdate() {
    if (game.turnplayer.type === 'computer' && !gameEnded(game)) {
        game.nextMove = game.turnplayer.strategy(game)
    }
    const move = game.nextMove;
    if (move) {
        doMove(game.field, move);
        game.history.push(move);
        // Confirm move
        game.nextMove = undefined;
        game.selection.active = false;
        game.selection.pos.x = -1;
        game.selection.pos.y = -1;
        game.turnplayer = game.players.find(player => player.id !== game.turnplayer.id);
    }
}

function handleRender() {
    // Draw all Squares
    iterateField(game.field, (cell, pos) => {
        let color;
        if (cell.player === -1) {
            color = 120;
        } else if (cell.player > -1 && game.moves[cell.player].length === 0) {
            color = 'red';
        } else {
            color = game.players.find(player => player.id === cell.player).color;
        }
        drawRect(pos, color, cell.rune)
    });
    if (game.selection.active) {
        const moveOptions = game.moves[game.turnplayer.id].filter(move => compPos(game.selection.pos, move.sourcePos));
        const optionPlatePositions = moveOptions.map(move => move.targetPos);
        // Draw Option Plates
        optionPlatePositions.forEach(pos => drawRect(pos, 170, game.field[pos.x][pos.y].rune));
        const mousePos = getInboundMouse();
        if (isEmpty(game.field, mousePos) && optionPlatePositions.find(pos => compPos(pos, mousePos))) {
            const optionPlateMoves = moveOptions.filter(move => compPos(mousePos, move.targetPos));
            drawRect(mousePos, 140, optionPlateMoves[game.selection.optionsIndex % optionPlateMoves.length].after.rune);
        }
    }
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
    text(runeText, (xPos + 0.5 - 0.5 / textRatio) * rectSize, (yPos + 0.5 + 0.5 / textRatio) * rectSize);
}

function generateMoves(field) {
    let options = {
        '0': [],
        '1': [],
    }
    iterateField(field, (cell, pos) => {
        if (cell.player > -1 && cell.rune > 0) {
            // BLOCKER
            for (let i = -1; i <= 1; i++) {
                for (let j = -1; j <= 1; j++) {
                    if (i !== 0 || j !== 0) {
                        const targetPos = { x: pos.x + i, y: pos.y + j };
                        if (isEmpty(field, targetPos)) {
                            const move = genMove(field, pos, targetPos, 0, cell.player, []);
                            if (testMove(field, move)) {
                                options[cell.player].push(move);
                            }
                        }
                    }
                }
            }
            // RUNES
            const placeableRunes = [1, 2, 3, 4, 5].filter(r => r !== cell.rune);
            getAttackedFields(field, pos).forEach(f => placeableRunes.forEach(pr => {
                const move = genMove(field, pos, f.pos, pr, cell.player, f.paths);
                if (testMove(field, move)) {
                    options[cell.player].push(move);
                }
            }))
        }
    });
    return options;
}

function genMove(field, sourcePos, targetPos, rune, player, path) {
    const move = {
        sourcePos: sourcePos,
        targetPos: targetPos,
        before: {
            rune: field[targetPos.x][targetPos.y].rune,
            player: field[targetPos.x][targetPos.y].player,
        },
        after: {
            rune: rune,
            player: player,
        },
        path: path,
    };
    return move;
}

function doMove(field, move, updateOptions = true) {
    field[move.targetPos.x][move.targetPos.y].rune = move.after.rune;
    field[move.targetPos.x][move.targetPos.y].player = move.after.player;
    for (const path of move.path) {
        field[path.x][path.y].rune = 0;
        field[path.x][path.y].player = move.after.player;
    }
    if (updateOptions) {
        game.moves = generateMoves(field);
    }
}

function undoMove(field, move, updateOptions = true) {
    field[move.targetPos.x][move.targetPos.y].rune = move.before.rune;
    field[move.targetPos.x][move.targetPos.y].player = move.before.player;
    for (const path of move.path) {
        field[path.x][path.y].rune = -1;
        field[path.x][path.y].player = -1;
    }
    if (updateOptions) {
        game.moves = generateMoves(field);
    }
}

function testMove(field, move) {
    doMove(field, move, false);
    const attackedFields = [];
    const playerFields = [];
    iterateField(field, (cell, pos) => {
        if (cell.player === move.after.player) {
            playerFields.push(`${pos.x}-${pos.y}`);
        } else {
            attackedFields.push(...getAttackedFields(field, pos, cell.player).map(f => `${f.pos.x}-${f.pos.y}`));
        }
    });
    const valid = new Set([...attackedFields, ...playerFields]).size === new Set(attackedFields).size + playerFields.length;
    undoMove(field, move, false);
    return valid;
}

function getAttackedFields(field, pos) {
    const x = pos.x;
    const y = pos.y;
    const rune = field[x][y].rune;
    const player = field[x][y].player;
    const attackedFields = [];
    const processPaths = (paths) => {
        for (const path of paths) {
            const mappedPath = path.map(pos => { return { x: x + pos[0], y: y + pos[1] } });
            for (let i = 0; i < path.length; i++) {
                const subpath = i === 0 ? mappedPath : mappedPath.slice(0, -i);
                const lastPos = subpath[subpath.length - 1];
                const behindPath = subpath.slice(0, -1);
                if (isPlaceable(field, lastPos, player) && behindPath.every(pos => isEmpty(field, pos))) {
                    attackedFields.push({
                        pos: lastPos,
                        paths: behindPath
                    });
                }
            }
        }
    }
    switch (rune) {
        case 1: processPaths([
            [[-1, -1]],
            [[-1, 0]],
            [[-1, 1]],
            [[0, -1]],
            [[0, 1]],
            [[1, -1]],
            [[1, 0]],
            [[1, 1]],
        ]);
            break;
        case 2: processPaths([
            [[-1, 0], [-2, 0], [-3, 0]],
            [[0, -1], [0, -2], [0, -3]],
            [[1, 0], [2, 0], [3, 0]],
            [[0, 1], [0, 2], [0, 3]],
        ]);
            break;
        case 3: processPaths([
            [[1, 0], [2, 0], [2, -1]],
            [[1, 0], [2, 0], [2, 1]],
            [[0, 1], [0, 2], [-1, 2]],
            [[0, 1], [0, 2], [1, 2]],
            [[-1, 0], [-2, 0], [-2, 1]],
            [[-1, 0], [-2, 0], [-2, -1]],
            [[0, -1], [0, -2], [1, -2]],
            [[0, -1], [0, -2], [-1, -2]],
        ]);
            break;
        case 4: processPaths([
            [[-1, -1], [-2, -2], [-3, -3]],
            [[-1, 1], [-2, 2], [-3, 3]],
            [[1, -1], [2, -2], [3, -3]],
            [[1, 1], [2, 2], [3, 3]],
        ]);
            break;
        case 5: processPaths([
            [[-1, -1], [-2, -2], [-3, -1]],
            [[-1, -1], [-2, -2], [-1, -3]],
            [[1, -1], [2, -2], [3, -1]],
            [[1, -1], [2, -2], [1, -3]],
            [[-1, 1], [-2, 2], [-3, 1]],
            [[-1, 1], [-2, 2], [-1, 3]],
            [[1, 1], [2, 2], [3, 1]],
            [[1, 1], [2, 2], [1, 3]],
        ]);
            break;
    };
    return attackedFields;
}

function getInboundMouse() {
    if (mouseX < 0 || mouseX >= game.size || mouseY < 0 || mouseY >= game.size) {
        return { x: 0, y: 0 };
    }
    const x = Math.floor(mouseX * game.rowsAndCols / game.size);
    const y = Math.floor(mouseY * game.rowsAndCols / game.size);
    return { x, y }
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

function isEmpty(field, pos) {
    return pos.x >= 0 && pos.x < game.rowsAndCols && pos.y >= 0 && pos.y < game.rowsAndCols && field[pos.x][pos.y].rune === -1;
}

function isPlaceable(field, pos, player) {
    return pos.x >= 0 && pos.x < game.rowsAndCols && pos.y >= 0 && pos.y < game.rowsAndCols && field[pos.x][pos.y].rune !== 0 && field[pos.x][pos.y].player !== player;
}

function iterateField(field, doStuff) {
    for (let x = 0; x < field.length; x++) {
        for (let y = 0; y < field[0].length; y++) {
            doStuff(field[x][y], { x, y });
        }
    }
}

function generateField(field) {
    for (let i = 0; i < game.rowsAndCols; i++) {
        if (field[i] === undefined) {
            field[i] = [];
        }
        for (let j = 0; j < game.rowsAndCols; j++) {
            field[i][j] = {
                player: -1,
                rune: -1,
            }
        }
    }
}

function compPos(pos1, pos2) {
    return pos1.x === pos2.x && pos1.y === pos2.y;
}

function gameEnded(game) {
    return Object.values(game.moves).some(moves => moves.length === 0);
}