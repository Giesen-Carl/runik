// const board = new Uint8Array(Math.ceil(169 / 2));
// for (let i = 1; i <= 13; i++) {
//     for (let j = 1; j <= 13; j++) {
//         setCell(board, i, j, j);
//     }
// }
const board = initBoard();
function setup() {
    createCanvas(600, 600);
    printBoardWithCoords(board);
}
// const mapping = new Map(runes.map(rune => [rune.id, rune.image]));

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
    setCell(board, 7, 7, 13);
    // setCell(board, 6, 6, 2);
    setCell(board, 6, 6, 6);
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

function printBoardWithCoords(board) {
    let out = "     ";
    for (let x = 1; x <= 13; x++) out += x.toString().padStart(2, " ") + " ";
    out += "\n";
    for (let y = 1; y <= 13; y++) {
        out += y.toString().padStart(2, " ") + " | ";
        for (let x = 1; x <= 13; x++) {
            out += getCell(board, x, y).toString(16).padStart(2, " ") + " ";
        }
        out += "\n";
    }
    console.log(out);
}

function getChilds(board, player) {
    for (let x = 1; x <= 13; x++) {
        for (let y = 1; y <= 13; y++) {
            const cellValue = getCell(board, x, y);
            // filter player cells
            if (cellValue < 1 || cellValue > 12 || ((player === 0) !== (cellValue <= 6))) continue;
            const rune = runes[(cellValue + 5) % 6 + 1];
            console.log(player, rune.name)
            const targets = getTargets(x, y, rune);
            console.log(targets)

        }
    }
}
function hashPath(path) {
    return path.map(pos => `${pos.x},${pos.y}`).join("|");
}
function getTargets(x, y, rune) {
    const paths = rune.range;
    const targets = [];
    const hash = [];
    paths.forEach(path => {
        const mappedPath = path.map(pos => { return { x: x + pos[0], y: y + pos[1] } });
        for (let i = 0; i < path.length; i++) {
            const subpath = i === 0 ? mappedPath : mappedPath.slice(0, -i);
            if (subpath.every(pos => getCell(board, pos.x, pos.y) === 0) && !hash.includes(hashPath(subpath))) {
                targets.push({
                    pos: subpath[subpath.length - 1],
                    paths: subpath.slice(0, -1)
                });
                hash.push(hashPath(subpath));
            }
        }
        // for (let i = 0; i < path.length; i++) {
        //     const subpath = i === 0 ? mappedPath : mappedPath.slice(0, -i);
        //     const lastPos = subpath[subpath.length - 1];
        //     const behindPath = subpath.slice(0, -1);
        //     if (isPlaceable(runes, lastPos, rune.player) && behindPath.every(pos => isEmpty(runes, pos))) {
        //         targets.push({
        //             pos: lastPos,
        //             paths: behindPath
        //         });
        //     }
        // }
    })
    return targets;
}
getChilds(board, 0);