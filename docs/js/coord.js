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
        for (let plane of this.get_planes()) {
            this.#angs[plane] = 0
        }
    }

    get_planes() {
        const planes = []
        for (let i = 0; i < this.#dimension; i++) {
            for (let j = i + 1; j < this.#dimension; j++) {
                const name = `${utils.AXIS_NAMES[i]}${utils.AXIS_NAMES[j]}`
                planes.push(name)
            }
        }
        return planes
    }

    rotate_shape(lines, plane, forward) {
        const n = 100
        const ang = ((forward ? 1 : -1) * (2 * Math.PI)) / n
        this.#rotate_lines(lines, plane, ang)
    }

    draw_shape(lines) {
        const axes = utils.clone(this.#axes)
        const shape = utils.clone(lines)
        shape.push(...utils.clone(this.#hires_axes))
        for (let plane of this.get_planes()) {
            this.#rotate_lines(axes, plane, this.#angs[plane])
            this.#rotate_lines(shape, plane, this.#angs[plane])
        }
        this.#scene.clear()
        this.#scene.draw_shape(shape, this.#bulb)
        this.#draw_axes_name(axes)
    }
    //#endregion

    //#region private utils
    #gen_axes(dimension) {
        this.#bulb = create_lightbulb(dimension)
        this.#axes = create_axes(dimension)
        this.#hires_axes = utils.dlss(this.#axes, 60)
    }

    #rotate_lines(lines, plane, ang) {
        const [i1, i2] = this.#plane_to_idx(plane)
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

    #plane_to_idx(plane) {
        const i1 = utils.AXIS_NAMES.indexOf(plane[0])
        const i2 = utils.AXIS_NAMES.indexOf(plane[1])
        if (
            i1 < 0 ||
            i2 < 0 ||
            i1 >= this.#dimension ||
            i2 >= this.#dimension
        ) {
            throw new Error(`invalid plane ${plane}`)
        }
        return [i1, i2]
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
