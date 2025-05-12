const runes = [
    {
        x: 6,
        y: 6,
        type: 2,
        player: 1,
    },
    {
        x: 6,
        y: 8,
        type: 0,
        player: -1,
    }
]
const game = {
    size: 600,
    rowsAndCols: 13,
}

const highlight = [];

function setup() {
    createCanvas(game.size, game.size);
    highlight.push(...getAttackedFields(runes[0]))
}

function draw() {
    background(200);
    // Draw Grid
    const rectSize = game.size / game.rowsAndCols;
    fill(120);
    stroke(220)
    strokeWeight(rectSize / 20)
    for (let i = 0; i < game.rowsAndCols; i++) {
        for (let j = 0; j < game.rowsAndCols; j++) {
            rect(i * rectSize, j * rectSize, rectSize, rectSize);
        }
    }
    // Draw Runes
    for (const rune of runes) {
        fill(rune.player === 0 ? 120 : rune.player === 1 ? 'blue' : 'green')
        rect(rune.x * rectSize, rune.y * rectSize, rectSize, rectSize);
        let runeText;
        switch (parseInt(rune.type)) {
            case -1: runeText = ''; break;
            case 0: runeText = '.'; break;
            case 1: runeText = 'o'; break;
            case 2: runeText = '+'; break;
            case 3: runeText = '[  ]'; break;
            case 4: runeText = '^'; break;
            case 5: runeText = '*'; break;
        }
        const textRatio = 2;
        fill(0);
        strokeWeight(0);
        textSize(rectSize / textRatio);
        text(runeText, (rune.x + 0.5 - 0.5 / textRatio) * rectSize, (rune.y + 0.5 + 0.5 / textRatio) * rectSize);
    }
    // Draw Plates
    for (const h of highlight) {
        fill(150);
        stroke(220)
        strokeWeight(rectSize / 20)
        rect(h.pos.x * rectSize, h.pos.y * rectSize, rectSize, rectSize);
    }
}

function getAttackedFields(rune) {
    switch (rune.type) {
        case 1: return processPaths(rune, [
            [[-1, -1]],
            [[-1, 0]],
            [[-1, 1]],
            [[0, -1]],
            [[0, 1]],
            [[1, -1]],
            [[1, 0]],
            [[1, 1]],
        ]);
        case 2: return processPaths(rune, [
            [[-1, 0], [-2, 0], [-3, 0]],
            [[0, -1], [0, -2], [0, -3]],
            [[1, 0], [2, 0], [3, 0]],
            [[0, 1], [0, 2], [0, 3]],
        ]);
        case 3: return processPaths(rune, [
            [[1, 0], [2, 0], [2, -1]],
            [[1, 0], [2, 0], [2, 1]],
            [[0, 1], [0, 2], [-1, 2]],
            [[0, 1], [0, 2], [1, 2]],
            [[-1, 0], [-2, 0], [-2, 1]],
            [[-1, 0], [-2, 0], [-2, -1]],
            [[0, -1], [0, -2], [1, -2]],
            [[0, -1], [0, -2], [-1, -2]],
        ]);
        case 4: return processPaths(rune, [
            [[-1, -1], [-2, -2], [-3, -3]],
            [[-1, 1], [-2, 2], [-3, 3]],
            [[1, -1], [2, -2], [3, -3]],
            [[1, 1], [2, 2], [3, 3]],
        ]);
        case 5: return processPaths(rune, [
            [[-1, -1], [-2, -2], [-3, -1]],
            [[-1, -1], [-2, -2], [-1, -3]],
            [[1, -1], [2, -2], [3, -1]],
            [[1, -1], [2, -2], [1, -3]],
            [[-1, 1], [-2, 2], [-3, 1]],
            [[-1, 1], [-2, 2], [-1, 3]],
            [[1, 1], [2, 2], [3, 1]],
            [[1, 1], [2, 2], [1, 3]],
        ]);
    };
}

function processPaths(rune, paths) {
    const attackedFields = [];
    paths.forEach(path => {
        const mappedPath = path.map(pos => { return { x: rune.x + pos[0], y: rune.y + pos[1] } });
        for (let i = 0; i < path.length; i++) {
            const subpath = i === 0 ? mappedPath : mappedPath.slice(0, -i);
            const lastPos = subpath[subpath.length - 1];
            const behindPath = subpath.slice(0, -1);
            if (isPlaceable(runes, lastPos, rune.player) && behindPath.every(pos => isEmpty(runes, pos))) {
                attackedFields.push({
                    pos: lastPos,
                    paths: behindPath
                });
            }
        }
    });
    return attackedFields;
}

function isEmpty(runes, pos) {
    return runes.every(r => r.x !== pos.x || r.y !== pos.y);
}

function isPlaceable(runes, pos, player) {
    return runes.every(r => r.x !== pos.x || r.y !== pos.y || r.type !== 0 && r.player !== player);
}