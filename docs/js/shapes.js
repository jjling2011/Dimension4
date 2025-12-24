import * as utils from "./utils.js"

export const Shapes = Object.freeze({
    None: 0,
    Square: 1,
    Cube: 2,
    UnitCube: 3,
    GrayCube: 4,
    Sphere: 5,
})

const cache = {}

function genCube(key, dimension) {
    const ps = []
    const vs = [-0.5, 0.5]
    for (let i = 0; i < Math.pow(2, dimension); i++) {
        let t = i
        const cur = utils.zero(dimension)
        for (let j = 0; j < dimension; j++) {
            const idx = t % 2
            cur[j] = vs[idx]
            t = Math.floor(t / 2)
        }
        ps.push(cur)
    }
    const lines = utils.to_lines(ps)
    cache[key] = utils.filter_lines(lines, 1.01)
}

function to_gray_line(g1, g2) {
    const vs = [-0.5, 0.5]
    const p1 = []
    const p2 = []
    for (let i = 0; i < g1.length; i++) {
        p1.push(vs[g1[i]])
        p2.push(vs[g2[i]])
    }
    return [p1, p2]
}

function genGrayCube(key, dimension) {
    const lines = []
    let prev = utils.zero(dimension)
    for (let i = 1; i <= Math.pow(2, dimension); i++) {
        let t = i
        const cur = utils.zero(dimension)
        for (let j = 0; j < dimension; j++) {
            const idx = t % 2
            cur[j] = idx
            t = Math.floor(t / 2)
        }
        const gray = utils.to_gray(cur, 2)
        lines.push(to_gray_line(prev, gray))
        prev = gray
    }
    cache[key] = lines
}

function genSquare(key, dimension) {
    const lines = []
    for (let i = 0; i < 4; i++) {
        lines.push([utils.zero(dimension), utils.zero(dimension)])
    }

    // l0.end.x
    lines[0][1][0] = 1

    // l1.start.x
    lines[1][0][0] = 1

    // l1.end.xy
    lines[1][1][0] = 1
    lines[1][1][1] = 1

    // l2.start.xy
    lines[2][0][0] = 1
    lines[2][0][1] = 1
    // l2.end.xy
    lines[2][1][0] = 0
    lines[2][1][1] = 1

    // l3.start.xy
    lines[3][0][0] = 0
    lines[3][0][1] = 1

    cache[key] = lines
}

function genNone(key) {
    cache[key] = []
}

function genUnitCube(key, dimension) {
    const ps = []
    const vs = [0, 1]
    for (let i = 0; i < Math.pow(2, dimension); i++) {
        let t = i
        const cur = utils.zero(dimension)
        for (let j = 0; j < dimension; j++) {
            const idx = t % 2
            cur[j] = vs[idx]
            t = Math.floor(t / 2)
        }
        ps.push(cur)
    }
    const lines = utils.to_lines(ps)
    cache[key] = utils.filter_lines(lines, 1.01)
}

function to_key(shape, dimension) {
    const keys = Object.keys(Shapes)
    for (let i = 0; i < keys.length; i++) {
        if (i === shape) {
            return `${keys[i]}${dimension}`
        }
    }
    throw new Error(`unkonw shape #${shape} dimension ${dimension}`)
}

export function GetShape(shape, dimension) {
    const key = to_key(shape, dimension)
    if (!cache[key]) {
        console.log(`create shape: ${key}`)
        switch (shape) {
            case Shapes.None:
                genNone(key)
                break
            case Shapes.Square:
                genSquare(key, dimension)
                break
            case Shapes.GrayCube:
                genGrayCube(key, dimension)
                break
            case Shapes.UnitCube:
                genUnitCube(key, dimension)
                break
            default:
                genCube(key, dimension)
                break
        }
    } else {
        console.log(`get share ${key} from cache`)
    }
    return utils.clone(cache[key])
}
