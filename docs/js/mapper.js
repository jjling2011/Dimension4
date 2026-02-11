//#region  mapper names

export const Mappers = Object.freeze({
    PI2: "PI / 2",
    PI4: "PI / 4",
    Avg: "Average",
    CosXY: "Cos XY",
    SquareXY: "Square XY",
    CosAll: "Cos All",
    SquareAll: "Square All",
    CubicAll: "Cubic All",
})

//#endregion

//#region axis mapper
const mcache = {}

function to_scale_fn(fn) {
    if (fn) {
        return fn
    }
    return function (_, v) {
        return v
    }
}

function gen_straightline_mapper(ang, scale_fn) {
    const f = to_scale_fn(scale_fn)
    return function (v) {
        const l = f(ang, v)
        const x = Math.cos(ang) * l
        const y = Math.sin(ang) * l
        return [x, y]
    }
}

function rotate(x, y, ang) {
    const x2 = x * Math.cos(ang) - y * Math.sin(ang)
    const y2 = x * Math.sin(ang) + y * Math.cos(ang)
    return [x2, y2]
}

function gen_cos_wave_mapper(ang, scale_fn) {
    const f = to_scale_fn(scale_fn)
    return function (v) {
        const [tx, ty] = [v, Math.cos(v * 12) * 0.05]
        return rotate(f(ang, tx), f(ang, ty), ang)
    }
}

function gen_cubic_line_mapper(ang) {
    return function (v) {
        const tx = v * (1 - Math.sin((ang * 2) / 3))
        const ty = (v * v * v) / 2
        return [tx, ty]
    }
}

mcache[Mappers.Avg] = function (dimension) {
    const fns = []
    const da = Math.PI / dimension
    for (let i = 0; i < dimension; i++) {
        const ang = da * i
        const f = gen_straightline_mapper(ang)
        fns.push(f)
    }
    return fns
}

mcache[Mappers.CubicAll] = function (dimension) {
    const fns = []
    const da = Math.PI / 2 / (dimension - 1)
    for (let i = 0; i < dimension; i++) {
        const f = gen_cubic_line_mapper(da * i)
        fns.push(f)
    }
    return fns
}

function gen_parabola_line_mapper(ang) {
    return function (v) {
        const tx = v * (1 - Math.sin(ang / 2))
        const ty = (v * v) / 4
        return [tx, ty]
    }
}

mcache[Mappers.SquareAll] = function (dimension) {
    const fns = []
    const da = Math.PI / 2 / (dimension - 1)
    for (let i = 0; i < dimension; i++) {
        const f = gen_parabola_line_mapper(da * i)
        fns.push(f)
    }
    return fns
}

mcache[Mappers.SquareXY] = function (dimension) {
    const fns = []

    const da = Math.PI / 2 / (dimension - 1)

    const fx = gen_parabola_line_mapper(0)
    const fy = gen_parabola_line_mapper(da)
    fns.push(fx, fy)

    function scale_fn(ang, v) {
        return v * (1 - Math.sin(2 * ang) / 2)
    }
    for (let i = 2; i < dimension; i++) {
        const ang = da * i
        const f = gen_straightline_mapper(ang, scale_fn)
        fns.push(f)
    }
    return fns
}

mcache[Mappers.CosAll] = function (dimension) {
    const fns = []

    function scale_fn(ang, v) {
        return v * (1 - Math.sin(2 * ang) / 2)
    }

    const da = Math.PI / 2 / (dimension - 1)
    for (let i = 0; i < dimension; i++) {
        const f = gen_cos_wave_mapper(da * i, scale_fn)
        fns.push(f)
    }
    return fns
}

mcache[Mappers.CosXY] = function (dimension) {
    const fns = []

    function scale_fn(ang, v) {
        return v * (1 - Math.sin(2 * ang) / 2)
    }

    const da = Math.PI / 2 / (dimension - 1)
    const fx = gen_cos_wave_mapper(da * 0, scale_fn)
    const fy = gen_cos_wave_mapper(da * 1, scale_fn)
    fns.push(fx, fy)

    for (let i = 2; i < dimension; i++) {
        const ang = da * i
        const f = gen_straightline_mapper(ang, scale_fn)
        fns.push(f)
    }
    return fns
}

mcache[Mappers.PI4] = function (dimension) {
    const fns = []

    function scale_fn(ang, v) {
        return v * (1 - Math.sin(4 * ang) / 2)
    }

    const da = Math.PI / 4 / (dimension - 1)
    for (let i = 0; i < dimension; i++) {
        const ang = da * i
        const f = gen_straightline_mapper(ang, scale_fn)
        fns.push(f)
    }
    return fns
}

mcache[Mappers.PI2] = function (dimension) {
    const fns = []

    function scale_fn(ang, v) {
        return v * (1 - Math.sin(2 * ang) / 2)
    }
    const da = Math.PI / 2 / (dimension - 1)
    for (let i = 0; i < dimension; i++) {
        const ang = da * i
        const f = gen_straightline_mapper(ang, scale_fn)
        fns.push(f)
    }
    return fns
}
//#endregion

export class Mapper {
    #fns
    #dimension

    constructor(dimension, coord_type) {
        this.#dimension = dimension
        this.#create_map_funcs(dimension, coord_type)
    }

    //#region private
    #create_map_funcs(dimension, coord_type) {
        const creater = mcache[coord_type] ?? mcache[Mappers.PI2]
        this.#fns = creater(dimension)
    }

    //#endregion

    //#region public
    map(p) {
        let x = 0
        let y = 0
        for (let i = 0; i < this.#dimension; i++) {
            const f = this.#fns[i]
            const [dx, dy] = f(p[i])
            x = x + dx
            y = y + dy
        }
        return [x, y]
    }
    //#endregion
}
