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
    fill('#00ff00');
    stroke(220);
    strokeWeight(rectSize / 20);
    for (const [x, y] of state) {
        renderRect(x, y, colOffset, rowOffset, globals.xPos, globals.yPos, rectSize);
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
            const msg = network.sendingQueue.shift();
            // network.websocket.send(msg);
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
    networkState = [];
}
setupServer();
function setupServer() {
    initState();
    setInterval(drawServer, 16);
}

function drawServer() {
    advanceState();
    addCellsToState();
    sendMessage(networkState);
}

function advanceState() {
    const getN = (x, y) => { return [[x - 1, y - 1], [x - 1, y], [x - 1, y + 1], [x, y - 1], [x, y + 1], [x + 1, y - 1], [x + 1, y], [x + 1, y + 1]] };
    const map = [];
    for (const [x, y] of networkState) {
        const n = getN(x, y);
        for (const [nx, ny] of n) {
            const existing = map.find((m) => m.x === nx && m.y === ny);
            if (existing) {
                existing.n = existing.n + 1;
            } else {
                map.push({ x: nx, y: ny, o: false, n: 1 });
            }
        }
        const existing = map.find((m) => m.x === x && m.y === y);
        if (existing) {
            existing.o = true;
        } else {
            map.push({ x: x, y: y, o: true, n: 0 });
        }
    }
    const newState = [];
    for (const m of map) {
        if (m.n === 3 || m.n === 2 && m.o) {
            newState.push([m.x, m.y]);
        }
    }
    networkState = newState;
}

function addCellsToState() {
    while (addingCells.length > 0) {
        const [cx, cy] = addingCells.shift();
        const existing = networkState.find(([mx, my]) => mx === cx && my === cy);
        if (!existing) {
            networkState.push([cx, cy]);
        } else {
            const index = networkState.findIndex(([mx, my]) => mx === cx && my === cy);
            networkState.splice(index, 1);
        }
    }
}

function receiveMessage(msg) {
    const data = JSON.parse(msg);
    if (data instanceof Array && data.every(d => d instanceof Array && d.length === 2 && typeof d[0] === 'number' && typeof d[1] === 'number')) {
        addingCells.push(...data);
    }
}

function sendMessage(msg) {
    network.receivedQueue.push(JSON.stringify(msg));
}