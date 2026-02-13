import * as utils from "./utils.js"
import { Scene } from "./scene.js"
import { Mapper } from "./mapper.js"

export class Coord {
    #dimension
    #scene
    #angs
    #bulb
    #hires_axes
    #axes

    constructor(board) {
        this.#scene = new Scene(board)
        this.reset_coord("2", "Avg")
    }

    //#region public
    get_dimension() {
        return this.#dimension
    }

    reset_coord(dimension_str, coord_type) {
        this.#set_dimesion(dimension_str)
        const d = this.#dimension
        this.reset_angs()
        this.#gen_axes(d)
        const mapper = new Mapper(d, coord_type)
        this.#scene.reset_map_funcs(d, mapper)
    }

    add_ang(plane, forward) {
        const ang = Math.PI / 18
        const delta = (forward ? 1 : -1) * ang
        this.#angs[plane] = (this.#angs[plane] + delta) % (Math.PI * 2)
    }

    reset_angs() {
        this.#angs = {}
        for (let plane of utils.get_planes(this.#dimension)) {
            this.#angs[plane] = 0
        }
    }

    rotate_shape(lines, plane, forward) {
        const n = 100
        const ang = ((forward ? 1 : -1) * (2 * Math.PI)) / n
        this.#rotate_lines(lines, plane, ang)
    }

    draw_shape(lines) {
        const axes = utils.clone(this.#axes)
        const shape = this.#copy_shape(lines)
        shape.push(...utils.clone(this.#hires_axes))
        for (let plane of utils.get_planes(this.#dimension)) {
            this.#rotate_lines(axes, plane, this.#angs[plane])
            this.#rotate_lines(shape, plane, this.#angs[plane])
        }
        this.#scene.clear()
        this.#scene.draw_shape(shape, this.#bulb)
        this.#draw_axes_name(axes)
    }
    //#endregion

    //#region private utils
    #copy_shape(lines) {
        if (lines.length < 1 || !lines[0]) {
            return []
        }

        const d = this.#dimension
        const org_d = lines[0][0].length
        if (org_d === d) {
            return utils.clone(lines)
        }

        const r = []
        for (let line of lines) {
            const start = utils.zero(d)
            const end = utils.zero(d)
            for (let i = 0; i < d; i++) {
                start[i] = line[0][i] || 0
                end[i] = line[1][i] || 0
            }
            r.push([start, end])
        }
        return r
    }

    #gen_axes(dimension) {
        this.#bulb = create_lightbulb(dimension)
        this.#axes = create_axes(dimension)
        this.#hires_axes = utils.dlss(this.#axes, 60)
    }

    #rotate_lines(lines, plane, ang) {
        const [i1, i2] = utils.plane_to_idx(plane)
        for (let line of lines) {
            for (let p of line) {
                this.#rotate_point(p, ang, i1, i2)
            }
        }
    }

    #rotate_point(p, ang, i1, i2) {
        const x = p[i1]
        const y = p[i2]
        p[i1] = x * Math.cos(ang) - y * Math.sin(ang)
        p[i2] = x * Math.sin(ang) + y * Math.cos(ang)
    }

    #draw_axes_name(axes) {
        for (let i = 0; i < this.#dimension; i++) {
            const end = axes[i][1]
            this.#scene.draw_text(end, utils.AXIS_NAMES[i], "whitesmoke")
        }
    }

    #set_dimesion(s) {
        this.#dimension = Number(s) || 2
    }

    //#endregion
}

//#region helper funcs

function create_axes(dimension) {
    const lines = []
    for (let i = 0; i < dimension; i++) {
        const start = utils.zero(dimension)
        const end = utils.zero(dimension)
        start[i] = -1 * utils.AXIS_SIZE
        end[i] = utils.AXIS_SIZE
        lines.push([start, end])
    }
    return lines
}

function create_lightbulb(dimension) {
    const bulb = utils.zero(dimension)
    const half = Math.floor(dimension / 2)
    bulb[0] = 5
    bulb[half] = -5
    bulb[dimension - 1] = 5
    console.log(`light bulb: ${bulb}`)
    return bulb
}
//#endregion
