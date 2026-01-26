const alt_runes = [
    {
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
    {
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
    {
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
    {
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
    {
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
];

const moves = []
console.log(alt_runes)
