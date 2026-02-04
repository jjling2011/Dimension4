import * as utils from "./utils.js"
import { Scene } from "./scene.js"
import { Mapper } from "./mapper.js"

export class Coord {
    #dimension
    #scene

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
        const mapper = new Mapper(d, coord_type)
        this.#scene.reset_map_funcs(d, mapper)
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

    rotate(lines, plane, forward) {
        const n = 100
        const ang = ((forward ? 1 : -1) * (2 * Math.PI)) / n
        const [i1, i2] = this.#plane_to_idx(plane)

        for (let line of lines) {
            for (let p of line) {
                const x = p[i1]
                const y = p[i2]
                p[i1] = x * Math.cos(ang) - y * Math.sin(ang)
                p[i2] = x * Math.sin(ang) + y * Math.cos(ang)
            }
        }
    }

    draw_shape(lines) {
        this.#scene.draw_shape(lines)
    }
    //#endregion

    //#region private utils
    #set_dimesion(s) {
        this.#dimension = Number(s) || 2
    }

    #plane_to_idx(plane) {
        const i1 = utils.AXIS_NAMES.indexOf(plane[0])
        const i2 = utils.AXIS_NAMES.indexOf(plane[1])
        if (i1 < 0 || i2 < 0 || i1 >= this.#dimension || i2 >= this.#dimension) {
            throw new Error(`invalid plane ${plane}`)
        }
        return [i1, i2]
    }
    //#endregion
}
