import * as utils from "./utils.js"

//#region shape names
export const Shapes = Object.freeze({
    None: "None",
    Square2D: "Square 2D",
    Circle2D: "Circle 2D",
    Cube: "Cube",
    UnitCube: "Unit Cube",
    GrayCube: "Gray Cube",
    Circle: "Circle",
    Sphere3D: "Sphere 3D",
    Octahedron3D: "Octahedron 3D",
    Sphere3D32: "Sphere 32 3D",
    MobiusStrip3D: "Mobius strip 3D",
})

//#endregion

const cache = {}

function add_points(p1, p2) {
    const p = utils.clone(p1)
    for (let i = 0; i < p1.length; i++) {
        p[i] += p2[i]
    }
    return p
}

function rotate_point(p, ang, a1, a2) {
    const p2 = utils.clone(p)
    const x = p[a1]
    const y = p[a2]
    p2[a1] = x * Math.cos(ang) - y * Math.sin(ang)
    p2[a2] = x * Math.sin(ang) + y * Math.cos(ang)
    return p2
}

function rotate_lines(lines, ang, a1, a2) {
    const l2 = []
    for (let line of lines) {
        const start = rotate_point(line[0], ang, a1, a2)
        const end = rotate_point(line[1], ang, a1, a2)
        l2.push([start, end])
    }
    return l2
}

function genMobiusStrip3d(dimension) {
    // 能用就行，懒得优化了
    const n = 80
    const lines = []
    const step1 = (Math.PI * 2) / n
    const step2 = step1 / 2
    let m1 = utils.zero(dimension)
    m1[dimension - 1] = -0.1
    let m2 = utils.zero(dimension)
    m2[dimension - 1] = 0.1
    let c = utils.zero(dimension)
    c[0] = 1
    m1 = rotate_point(m1, step2, dimension - 1, 0)
    m2 = rotate_point(m2, step2, dimension - 1, 0)
    let s1 = add_points(c, m1)
    let s2 = add_points(c, m2)
    lines.push([s1, s2])
    for (let ang = 0; ang < Math.PI * 2; ang += step1) {
        c = rotate_point(c, step1, 0, 1)
        m1 = rotate_point(m1, step2, dimension - 1, 0)
        m2 = rotate_point(m2, step2, dimension - 1, 0)
        const mr1 = rotate_point(m1, step1, 0, 1)
        const mr2 = rotate_point(m2, step1, 0, 1)
        const e1 = add_points(c, mr1)
        const e2 = add_points(c, mr2)
        lines.push([s1, e1])
        lines.push([s2, e2])
        lines.push([e1, e2])
        s1 = e1
        s2 = e2
    }
    return utils.dedup_lines(lines)
}

function genCircle2d(dimension) {
    const n = 32
    const lines = []

    // plane xi
    const circle = []
    let start = utils.zero(dimension)
    start[0] = 1
    const step = (2 * Math.PI) / n
    for (let ang = 0; ang < 2 * Math.PI; ang += step) {
        const end = rotate_point(start, step, 0, dimension - 1)
        circle.push([start, end])
        start = end
    }
    lines.push(...circle)
    return utils.dedup_lines(lines)
}

function genCircles(dimension) {
    const n = 32
    const lines = []

    // plane xy
    const circle = []
    let start = utils.zero(dimension)
    start[0] = 1
    const step = (2 * Math.PI) / n
    for (let ang = 0; ang < 2 * Math.PI; ang += step) {
        const end = rotate_point(start, step, 0, 1)
        circle.push([start, end])
        start = end
    }
    lines.push(...circle)

    for (let i = 1; i < dimension; i++) {
        const pxi = rotate_lines(circle, Math.PI / 2, 0, i)
        lines.push(...pxi)
        const pyi = rotate_lines(circle, Math.PI / 2, 1, i)
        lines.push(...pyi)
    }

    return utils.dedup_lines(lines)
}

function genSphere3d(dimension, n) {
    const lines = []
    const step = (2 * Math.PI) / n

    const dm = Math.round((dimension - 1) / 2)
    const longitude = []
    const latitude = []
    let slong = utils.zero(dimension)
    slong[dimension - 1] = 1
    for (let ang = 0; ang < 2 * Math.PI; ang += step) {
        const elong = rotate_point(slong, step, 0, dimension - 1)
        longitude.push([slong, elong])
        slong = elong
        if (dimension > 2) {
            const elat = rotate_point(elong, step, 0, dm)
            latitude.push([elong, elat])
        }
    }
    lines.push(...longitude)
    lines.push(...latitude)

    if (dimension > 2) {
        for (let ang = 0; ang < Math.PI; ang += step) {
            const rlong = rotate_lines(longitude, ang, 0, dm)
            const rlat = rotate_lines(latitude, ang, 0, dm)
            lines.push(...rlong)
            lines.push(...rlat)
        }
    }

    const l2 = utils.dedup_lines(lines)
    return utils.trim_short_line(l2, utils.MIN_DISTANCE)
}

function genCube(dimension) {
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
    return utils.trim_long_line(lines, 1.01)
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

function genGrayCube(dimension) {
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
    return lines
}

function genSquare2D(dimension) {
    const lines = []
    for (let i = 0; i < 4; i++) {
        lines.push([utils.zero(dimension), utils.zero(dimension)])
    }

    const i2 = dimension - 1

    // l0.end.x
    lines[0][1][0] = 1

    // l1.start.x
    lines[1][0][0] = 1

    // l1.end.xy
    lines[1][1][0] = 1
    lines[1][1][i2] = 1

    // l2.start.xy
    lines[2][0][0] = 1
    lines[2][0][i2] = 1
    // l2.end.xy
    lines[2][1][0] = 0
    lines[2][1][i2] = 1

    // l3.start.xy
    lines[3][0][0] = 0
    lines[3][0][i2] = 1

    return lines
}

function genUnitCube(dimension) {
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
    return utils.trim_long_line(lines, 1.01)
}

function create_shape(name, dimension) {
    switch (name) {
        case Shapes.None:
            return []
        case Shapes.Square2D:
            return genSquare2D(dimension)
        case Shapes.Circle2D:
            return genCircle2d(dimension)
        case Shapes.MobiusStrip3D:
            return genMobiusStrip3d(dimension)
        case Shapes.GrayCube:
            return genGrayCube(dimension)
        case Shapes.UnitCube:
            return genUnitCube(dimension)
        case Shapes.Circle:
            return genCircles(dimension)
        case Shapes.Sphere3D:
            return genSphere3d(dimension, 24)
        case Shapes.Octahedron3D:
            return genSphere3d(dimension, 4)
        case Shapes.Sphere3D32:
            return genSphere3d(dimension, 32 / 4)
        default:
            break
    }
    return genCube(dimension)
}

export function get_shape_by_name(name, dimension) {
    const key = `${name}@${dimension}`
    if (!cache[key]) {
        console.log(`create shape: ${key}`)
        const raw_shape = create_shape(name, dimension)
        if (name === Shapes.MobiusStrip3D) {
            cache[key] = utils.dlss(raw_shape, 3)
        } else {
            cache[key] = utils.dlss(raw_shape)
        }
    } else {
        console.log(`get shape from cache: ${key}`)
    }
    const shape = cache[key]
    console.log(`shape has ${shape.length} lines`)
    return utils.clone(shape)
}
