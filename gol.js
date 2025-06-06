let state = [];
let selected;
const network = {
    websocket: undefined,
    connected: true,
    sendingQueue: [],
    receivedQueue: [],
}

function setup() {
    readGlobals();
    const globals = getGlobals();
    createCanvas(globals.width, globals.height);
}

function draw() {
    handleNetworkQueues();
    const globals = getGlobals();
    resizeCanvas(globals.width, globals.height);
    background(120);
    drawField();
    handleInput();
    writeGlobals();
}

function drawField() {
    const globals = getGlobals();
    drawGrid(globals);
    drawCells(globals);
    drawSelected(globals);
    drawHover(globals);
}

function drawGrid(globals) {
    const rectSize = Math.max(30 * (globals.zoom / 100), 1);
    stroke(240);
    strokeWeight(rectSize / 20);
    const startYL = (0.5 * globals.height - globals.yPos * rectSize) % rectSize;
    for (let yl = startYL; yl < globals.height; yl += rectSize) {
        line(0, yl, globals.width, yl);
    }
    const startXL = (0.5 * globals.width - globals.xPos * rectSize) % rectSize;
    for (let xl = startXL; xl < globals.width; xl += rectSize) {
        line(xl, 0, xl, globals.height);
    }
}

function drawCells(globals) {
    const rectSize = Math.max(30 * (globals.zoom / 100), 1);
    const rowOffset = 0.5 * globals.height / rectSize;
    const colOffset = 0.5 * globals.width / rectSize;
    stroke(220);
    strokeWeight(rectSize / 20);
    for (const cell of state) {
        fill(cell.c);
        renderRect(cell.x, cell.y, colOffset, rowOffset, globals.xPos, globals.yPos, rectSize);
    }
}

function drawHover(globals) {
    const rectSize = Math.max(30 * (globals.zoom / 100), 1);
    const rowOffset = 0.5 * globals.height / rectSize;
    const colOffset = 0.5 * globals.width / rectSize;
    fill('#ffffff80');
    stroke(220);
    strokeWeight(rectSize / 20);
    const [x, y] = getMousePos(globals);
    renderRect(x, y, colOffset, rowOffset, globals.xPos, globals.yPos, rectSize);
}

function drawSelected(globals) {
    const rectSize = Math.max(30 * (globals.zoom / 100), 1);
    const rowOffset = 0.5 * globals.height / rectSize;
    const colOffset = 0.5 * globals.width / rectSize;
    fill('#ff000080');
    stroke(220);
    strokeWeight(rectSize / 20);
    for (const [x, y] of selected) {
        renderRect(x, y, colOffset, rowOffset, globals.xPos, globals.yPos, rectSize);
    }
}

function renderRect(x, y, colOffset, rowOffset, globalX, globalY, rectSize) {
    const xPos = (x - globalX + colOffset) * rectSize;
    const yPos = (y - globalY + rowOffset) * rectSize;
    if (xPos < -rectSize || xPos > width || yPos < -rectSize || yPos > height) {
        return;
    }
    rect(xPos, yPos, rectSize, rectSize);
}

function loadState() {
    advanceState();
}

function getGlobals() {
    const getCookie = (name) => {
        const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
        return match ? decodeURIComponent(match[2]) : null;
    }
    return JSON.parse(getCookie('globals') || '{}');
}

function readGlobals() {
    const globals = getGlobals();
    document.getElementById('xPos').value = parseFloat(globals.xPos);
    document.getElementById('yPos').value = parseFloat(globals.yPos);
    document.getElementById('width').value = parseFloat(globals.width);
    document.getElementById('height').value = parseFloat(globals.height);
    document.getElementById('zoom').value = parseFloat(globals.zoom);
    selected = globals.selected || [];
}

function writeGlobals() {
    const getDocumentValue = (id, defaultValue) => {
        const val = parseFloat(document.getElementById(id)?.value);
        return isNaN(val) ? defaultValue : val;
    }
    const globals = {
        xPos: getDocumentValue('xPos', 0),
        yPos: getDocumentValue('yPos', 0),
        width: getDocumentValue('width', 500),
        height: getDocumentValue('height', 500),
        zoom: getDocumentValue('zoom', 100),
        selected: selected || [],
    }
    document.cookie = `globals=${encodeURIComponent(JSON.stringify(globals))}`;
}

const scrollSpeed = 0.2;
function handleInput() {
    const globals = getGlobals();
    handleKeyBoard(globals);
}

function handleKeyBoard(globals) {
    if (keyIsDown(65) || keyIsDown(LEFT_ARROW)) {
        document.getElementById('xPos').value = parseFloat(globals.xPos) - scrollSpeed * 100 / globals.zoom;
    }
    if (keyIsDown(68) || keyIsDown(RIGHT_ARROW)) {
        document.getElementById('xPos').value = parseFloat(globals.xPos) + scrollSpeed * 100 / globals.zoom;
    }
    if (keyIsDown(87) || keyIsDown(UP_ARROW)) {
        document.getElementById('yPos').value = parseFloat(globals.yPos) - scrollSpeed * 100 / globals.zoom;
    }
    if (keyIsDown(83) || keyIsDown(DOWN_ARROW)) {
        document.getElementById('yPos').value = parseFloat(globals.yPos) + scrollSpeed * 100 / globals.zoom;
    }
    if (keyIsDown(171)) {
        document.getElementById('zoom').value = parseFloat(globals.zoom) + 1;
    }
    if (keyIsDown(173)) {
        document.getElementById('zoom').value = Math.max(parseFloat(globals.zoom) - 1, 1);
    }
    if (keyIsDown(13)) {
        if (selected.length === 0) {
            return;
        }
        network.sendingQueue.push(selected);
        selected = [];
    }
}

function mouseWheel(event) {
    const globals = getGlobals();
    if (event.delta < 0) {
        document.getElementById('zoom').value = parseFloat(globals.zoom) + 5;
    } else {
        document.getElementById('zoom').value = parseFloat(globals.zoom) - 5;
    }
}

function getMousePos(globals) {
    const rectSize = Math.max(30 * (globals.zoom / 100), 1);
    const x = Math.floor(globals.xPos + (mouseX - 0.5 * globals.width) / rectSize);
    const y = Math.floor(globals.yPos + (mouseY - 0.5 * globals.height) / rectSize);
    return [x, y];
}

function mousePressed() {
    const globals = getGlobals();
    const [mx, my] = getMousePos(globals);

    const index = selected.findIndex(([sx, sy]) => sx === mx && sy === my);
    if (index < 0) {
        selected.push([mx, my]);
    } else {
        selected.splice(index, 1);
    }
}

function handleNetworkQueues() {
    if (network.connected) {
        while (network.sendingQueue.length > 0) {
            const cells = network.sendingQueue.shift();
            // network.websocket.send(msg);
            const msg = cells.map(m => { return { x: m[0], y: m[1], c: 'purple' } });
            receiveMessage(JSON.stringify(msg));
        }
        while (network.receivedQueue.length > 0) {
            const msg = network.receivedQueue.shift();
            // receiveMessage(msg);
            state = JSON.parse(msg);
        }
    }
}

// Server stuff
let networkState = [];
let addingCells = [];
function initState() {
    // networkState = [[5, 5], [6, 5], [7, 5], [8, 5], [9, 5], [10, 5], [11, 5], [12, 5], [13, 5], [14, 5], [10, 6]];
    networkState = [
        { x: 0, y: 0, c: 'black' },
        { x: 1, y: 0, c: 'black' },
        { x: 0, y: 1, c: 'black' },
        { x: 1, y: 1, c: 'black' },
    ];
}
setupServer();
function setupServer() {
    initState();
    setInterval(drawServer, 16);
    sendMessage(networkState);
}

function drawServer() {
    advanceState();
    addCellsToState();
    sendMessage(networkState);
}

function advanceState() {
    const getN = (x, y) => { return [[x - 1, y - 1], [x - 1, y], [x - 1, y + 1], [x, y - 1], [x, y + 1], [x + 1, y - 1], [x + 1, y], [x + 1, y + 1]] };
    const map = [];
    for (const cell of networkState) {
        const n = getN(cell.x, cell.y);
        for (const [nx, ny] of n) {
            const existing = map.find((m) => m.x === nx && m.y === ny);
            if (existing) {
                if (existing.n[cell.c] === undefined) {
                    existing.n[cell.c] = 1;
                } else {
                    existing.n[cell.c] = existing.n[cell.c] + 1;
                }
            } else {
                map.push({ x: nx, y: ny, o: false, n: { [cell.c]: 1 } });
            }
        }
        const existing = map.find((m) => m.x === cell.x && m.y === cell.y);
        if (existing) {
            existing.o = true;
        } else {
            map.push({ x: cell.x, y: cell.y, o: true, n: {} });
        }
    }
    const newState = [];
    for (const m of map) {
        const obj = m.n;
        const n = Object.values(obj).reduce((total, num) => total + num, 0);
        if (n === 3 || n === 2 && m.o) {
            const sortedKeys = Object.keys(obj).sort((a, b) => obj[b] - obj[a]);
            const maxKey = sortedKeys[0] === 'black' && sortedKeys.length > 1 ? sortedKeys[1] : sortedKeys[0];
            const duplicates = Object.values(obj).filter(o => o === obj[maxKey]).length > 1;
            const c = duplicates ? 'black' : maxKey;
            newState.push({ x: m.x, y: m.y, c: c });
        }
    }
    networkState = newState;
}

function addCellsToState() {
    while (addingCells.length > 0) {
        const cell = addingCells.shift();
        const existing = networkState.find((ex) => ex.x === cell.x && ex.y === cell.y);
        if (!existing) {
            networkState.push(cell);
        } else {
            const index = networkState.findIndex((ex) => ex.x === cell.x && ex.y === cell.y);
            networkState.splice(index, 1);
        }
    }
}

function receiveMessage(msg) {
    const data = JSON.parse(msg);
    if (data instanceof Array && data.every(d => typeof d.x === 'number' && typeof d.y === 'number' && typeof d.c === 'string')) {
        addingCells.push(...data);
    }
}

function sendMessage(msg) {
    network.receivedQueue.push(JSON.stringify(msg));
}