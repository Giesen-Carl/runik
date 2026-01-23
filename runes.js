const runes = {
    1: {
        "name": "Blocker",
        "sourceable": false,
        "attackable": false,
        "useSourceRange": false,
        "image": ".",
        "range": [
            [[-1, -1]],
            [[-1, 0]],
            [[-1, 1]],
            [[0, -1]],
            [[0, 1]],
            [[1, -1]],
            [[1, 0]],
            [[1, 1]],
        ]
    },
    2: {
        "name": "Circle",
        "sourceable": true,
        "attackable": true,
        "useSourceRange": true,
        "image": "o",
        "range": [
            [[-1, -1]],
            [[-1, 0]],
            [[-1, 1]],
            [[0, -1]],
            [[0, 1]],
            [[1, -1]],
            [[1, 0]],
            [[1, 1]],
        ]
    },
    3: {
        "name": "Cross",
        "sourceable": true,
        "attackable": true,
        "useSourceRange": true,
        "image": "+",
        "range": [
            [[-1, 0], [-2, 0], [-3, 0]],
            [[0, -1], [0, -2], [0, -3]],
            [[1, 0], [2, 0], [3, 0]],
            [[0, 1], [0, 2], [0, 3]],
        ]
    },
    4: {
        "name": "Square",
        "sourceable": true,
        "attackable": true,
        "useSourceRange": true,
        "image": "[ ]",
        "range": [
            [[1, 0], [2, 0], [2, -1]],
            [[1, 0], [2, 0], [2, 1]],
            [[0, 1], [0, 2], [-1, 2]],
            [[0, 1], [0, 2], [1, 2]],
            [[-1, 0], [-2, 0], [-2, 1]],
            [[-1, 0], [-2, 0], [-2, -1]],
            [[0, -1], [0, -2], [1, -2]],
            [[0, -1], [0, -2], [-1, -2]],
        ]
    },
    5: {
        "name": "Triangle",
        "sourceable": true,
        "attackable": true,
        "useSourceRange": true,
        "image": "^",
        "range": [
            [[-1, -1], [-2, -2], [-3, -3]],
            [[-1, 1], [-2, 2], [-3, 3]],
            [[1, -1], [2, -2], [3, -3]],
            [[1, 1], [2, 2], [3, 3]],
        ]
    },
    6: {
        "name": "Star",
        "sourceable": true,
        "attackable": true,
        "useSourceRange": true,
        "image": "*",
        "range": [
            [[-1, -1], [-2, -2], [-3, -1]],
            [[-1, -1], [-2, -2], [-1, -3]],
            [[1, -1], [2, -2], [3, -1]],
            [[1, -1], [2, -2], [1, -3]],
            [[-1, 1], [-2, 2], [-3, 1]],
            [[-1, 1], [-2, 2], [-1, 3]],
            [[1, 1], [2, 2], [3, 1]],
            [[1, 1], [2, 2], [1, 3]],
        ]
    }
};
