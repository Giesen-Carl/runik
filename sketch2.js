const basicMoves = {
    2: [
        [[-1, -1]],
        [[-1, 0]],
        [[-1, 1]],
        [[0, -1]],
        [[0, 1]],
        [[1, -1]],
        [[1, 0]],
        [[1, 1]],
    ],
    3: [
        [[-1, 0]],
        [[-1, 0], [-2, 0]],
        [[-1, 0], [-2, 0], [-3, 0]],
        [[0, -1]],
        [[0, -1], [0, -2]],
        [[0, -1], [0, -2], [0, -3]],
        [[1, 0]],
        [[1, 0], [2, 0]],
        [[1, 0], [2, 0], [3, 0]],
        [[0, 1]],
        [[0, 1], [0, 2]],
        [[0, 1], [0, 2], [0, 3]],
    ],
    4: [
        [[1, 0]],
        [[1, 0], [2, 0]],
        [[1, 0], [2, 0], [2, -1]],
        [[1, 0], [2, 0], [2, 1]],
        [[0, 1]],
        [[0, 1], [0, 2]],
        [[0, 1], [0, 2], [-1, 2]],
        [[0, 1], [0, 2], [1, 2]],
        [[-1, 0]],
        [[-1, 0], [-2, 0]],
        [[-1, 0], [-2, 0], [-2, 1]],
        [[-1, 0], [-2, 0], [-2, -1]],
        [[0, -1]],
        [[0, -1], [0, -2]],
        [[0, -1], [0, -2], [1, -2]],
        [[0, -1], [0, -2], [-1, -2]],
    ],
    5: [
        [[-1, -1]],
        [[-1, -1], [-2, -2]],
        [[-1, -1], [-2, -2], [-3, -3]],
        [[-1, 1]],
        [[-1, 1], [-2, 2]],
        [[-1, 1], [-2, 2], [-3, 3]],
        [[1, -1]],
        [[1, -1], [2, -2]],
        [[1, -1], [2, -2], [3, -3]],
        [[1, 1]],
        [[1, 1], [2, 2]],
        [[1, 1], [2, 2], [3, 3]],
    ],
    6: [
        [[-1, -1]],
        [[-1, -1], [-2, -2]],
        [[-1, -1], [-2, -2], [-3, -1]],
        [[-1, -1], [-2, -2], [-1, -3]],
        [[1, -1]],
        [[1, -1], [2, -2]],
        [[1, -1], [2, -2], [3, -1]],
        [[1, -1], [2, -2], [1, -3]],
        [[-1, 1]],
        [[-1, 1], [-2, 2]],
        [[-1, 1], [-2, 2], [-3, 1]],
        [[-1, 1], [-2, 2], [-1, 3]],
        [[1, 1]],
        [[1, 1], [2, 2]],
        [[1, 1], [2, 2], [3, 1]],
        [[1, 1], [2, 2], [1, 3]],
    ]
}
const runeMoves = getMovesMapping();
const board = initBoard();
function setup() {
    createCanvas(600, 600);
    printBoardWithCoords(board);
}

function draw() {
    background(200);
    const rectSize = 600 / 13;
    for (let i = 0; i < 13; i++) {
        for (let j = 0; j < 13; j++) {
            fill(120);
            stroke(220)
            strokeWeight(rectSize / 20)
            rect(i * rectSize, j * rectSize, rectSize, rectSize);
            const cellValue = getCell(board, i + 1, j + 1);
            if (cellValue === 0) continue;
            fill(cellValue > 12 ? 'black' : cellValue > 6 ? 'blue' : 'green');
            let runeText = runes[(cellValue + 5) % 6 + 1].image;
            strokeWeight(0);
            textSize(rectSize / 2);
            text(runeText, (i + 0.5 - 0.5 / 2) * rectSize, (j + 0.5 + 0.5 / 2) * rectSize);
        }
    }
}

function setCell(board, x, y, value) {
    const index = (y - 1) * 13 + (x - 1);
    const byteIndex = index >> 1;
    if ((index & 1) === 0) {
        board[byteIndex] =
            (board[byteIndex] & 0xF0) | value;
    } else {
        board[byteIndex] =
            (board[byteIndex] & 0x0F) | (value << 4);
    }
}

function getCell(board, x, y) {
    const index = (y - 1) * 13 + (x - 1);
    const byteIndex = index >> 1;
    return (index & 1) === 0
        ? board[byteIndex] & 0x0F
        : board[byteIndex] >> 4;
}

function initBoard() {
    const board = new Uint8Array(Math.ceil(169 / 2));
    setCell(board, 6, 6, 2);
    setCell(board, 8, 8, 8);

    if (false) {
        // Test setup
        setCell(board, 5, 5, 1);
        setCell(board, 5, 6, 2);
        setCell(board, 5, 7, 3);
        setCell(board, 5, 8, 4);
        setCell(board, 5, 9, 5);
        setCell(board, 5, 10, 6);
    }
    return board;
}

// player is turnplayer
function getChilds(board, player) {
    const childs = [];
    for (let x = 1; x <= 13; x++) {
        for (let y = 1; y <= 13; y++) {
            const cellValue = getCell(board, x, y);
            // filter player cells
            if (cellValue < 1 || cellValue > 12 || ((player === 1) !== (cellValue <= 6))) continue;
            const rune = getRuneFromPlayerrune(cellValue);
            const specificRuneMoves = runeMoves[rune];
            const shifted = specificRuneMoves.map(m => ({ path: m.path.map(p => [x + p[0], y + p[1]]), rune: m.rune }));
            const placeable = shifted.filter(s => s.path.every(p => {
                const x = p[0];
                const y = p[1];
                return x > 0 && x <= 13 && y > 0 && y <= 13 && getCell(board, x, y) === 0;
            }))
            placeable.forEach(move => {
                const newBoard = new Uint8Array(board);
                const path = move.path;
                const pos = path[path.length - 1];
                const behind = path.slice(0, -1);
                behind.forEach(p => setCell(newBoard, p[0], p[1], 1));
                setCell(newBoard, pos[0], pos[1], setRuneFromPlayer(move.rune, player));
                if (isLegal(newBoard, player)) {
                    childs.push(newBoard)
                }
            })
        }
    }
    return childs;
}

// player is turnplayer
function isLegal(board, player) {
    const opposingPlayer = getOpposingPlayer(player);
    for (let x = 1; x <= 13; x++) {
        for (let y = 1; y <= 13; y++) {
            const cellValue = getCell(board, x, y);
            if (cellValue < 1 || cellValue > 12 || ((opposingPlayer === 1) !== (cellValue <= 6))) continue;
            const runeId = getRuneFromPlayerrune(cellValue);
            const specificRuneMoves = basicMoves[runeId];
            const shifted = specificRuneMoves.map(m => m.map(p => [x + p[0], y + p[1]])).filter(path => path.every(pos => pos[0] > 0 && pos[0] <= 13 && pos[1] > 0 && pos[1] <= 13));
            for (const path of shifted) {
                const target = path[path.length - 1];
                const targetCell = getCell(board, target[0], target[1]);
                const targetPlayer = getPlayerFromRune(targetCell);
                const targetRune = getRuneFromPlayerrune(targetCell);
                const targetIsAttacked = targetPlayer === player && targetRune !== 1;
                if (targetIsAttacked) {
                    const behind = path.slice(0, -1);
                    const behindEmpty = behind.every(p => getCell(board, p[0], p[1]) === 0);
                    if (behindEmpty) {
                        return false;
                    }
                }
            }
        }
    }
    return true;
}

function getOpposingPlayer(player) {
    if (player === 1) return 2;
    if (player === 2) return 1;
    return 0;
}
// function getTargets(x, y, rune) {
//     const paths = rune.range;
//     const targets = [];
//     const hash = [];
//     paths.forEach(path => {
//         const mappedPath = path.map(pos => { return { x: x + pos[0], y: y + pos[1] } });
//         for (let i = 0; i < path.length; i++) {
//             const subpath = i === 0 ? mappedPath : mappedPath.slice(0, -i);
//             if (subpath.every(pos => getCell(board, pos.x, pos.y) === 0) && !hash.includes(hashPath(subpath))) {
//                 targets.push({
//                     pos: subpath[subpath.length - 1],
//                     paths: subpath.slice(0, -1)
//                 });
//                 hash.push(hashPath(subpath));
//             }
//         }
//         // for (let i = 0; i < path.length; i++) {
//         //     const subpath = i === 0 ? mappedPath : mappedPath.slice(0, -i);
//         //     const lastPos = subpath[subpath.length - 1];
//         //     const behindPath = subpath.slice(0, -1);
//         //     if (isPlaceable(runes, lastPos, rune.player) && behindPath.every(pos => isEmpty(runes, pos))) {
//         //         targets.push({
//         //             pos: lastPos,
//         //             paths: behindPath
//         //         });
//         //     }
//         // }
//     })
//     return targets;
// }
function getPlayerFromRune(rune) {
    // 0 = No Player
    // 1-6 = Player 1
    // 7-12 = Player 2
    // >12 = No Player (0)
    if (rune < 1 || rune > 12) return 0;
    if (rune >= 1 && rune <= 6) return 1;
    if (rune >= 7 && rune <= 12) return 2;
}
function setRuneFromPlayer(rune, player) {
    // 1-6 Input
    // 1-6 Player 1
    // 7-12 Player 2
    // 0 || >13 No Player (0)
    if (rune === 0) return 0;
    if (player === 1) return rune;
    if (player === 2) return rune + 6;
    if (player === 0) return rune + 12;
}
function getRuneFromPlayerrune(rune) {
    return rune === 0 ? 0 : (rune + 5) % 6 + 1
}
function getMovesMapping() {
    // 1 - Blocker
    // 2 - Circle
    // 3 - Cross
    // 4 - Square
    // 5 - Triangle
    // 6 - Star
    blockerMoves = [
        { path: [[-1, -1]], rune: 1 },
        { path: [[-1, 0]], rune: 1 },
        { path: [[-1, 1]], rune: 1 },
        { path: [[0, -1]], rune: 1 },
        { path: [[0, 1]], rune: 1 },
        { path: [[1, -1]], rune: 1 },
        { path: [[1, 0]], rune: 1 },
        { path: [[1, 1]], rune: 1 },
    ]
    const movesList = {};
    const runeIds = [2, 3, 4, 5, 6]
    runeIds.forEach(runeId => {
        const runeBasicMoves = basicMoves[runeId];
        movesList[runeId] = [...blockerMoves];
        runeIds.forEach(runeIdlower => {
            if (runeId !== runeIdlower) {
                runeBasicMoves.forEach(rbm => movesList[runeId].push({ path: rbm, rune: runeIdlower }));
            }
        })
    })
    return movesList
}

function printMoves(moves) {
    moves.forEach(m => console.log(`${m.rune} | ${m.path.map(p => `(${p[0]} ${p[1]})`)}`))
}

function printBoardWithCoords(board) {
    let out = "     ";
    for (let x = 1; x <= 13; x++) out += x.toString().padStart(2, " ") + " ";
    out += "\n";
    for (let y = 1; y <= 13; y++) {
        out += y.toString().padStart(2, " ") + " | ";
        for (let x = 1; x <= 13; x++) {
            const rune = getCell(board, x, y)
            const s = rune === 0 ? "*" : rune;
            out += s.toString(16).padStart(2, " ") + " ";
        }
        out += "\n";
    }
    console.log(out);
}

const childs = getChilds(board, 1);
childs.forEach((c, i) => {
    console.log(i);
    printBoardWithCoords(c)
}
)