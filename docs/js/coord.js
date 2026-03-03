import * as utils from "./utils.js"
import { Scene } from "./scene.js"


export class Coord {
    #axes
    #scene
    #angs
    #bulb
    #hires_axes
    #axis_lines

    constructor(board) {
        this.#scene = new Scene(board)
        this.reset_coord([0, 1], "Avg")
    }

    //#region public

    reset_coord(axes, coord_type) {
        this.#axes = axes
        this.reset_angs()
        this.#gen_axes()
        this.#scene.reset_map_funcs(this.#axes, coord_type)
    }

    add_ang(plane, forward) {
        const ang = Math.PI / 18
        const delta = (forward ? 1 : -1) * ang
        this.#angs[plane] = (this.#angs[plane] + delta) % (Math.PI * 2)
    }

    reset_angs() {
        this.#angs = {}
        for (let plane of utils.get_coord_planes(this.#axes)) {
            this.#angs[plane] = 0
        }
    }

    rotate_shape(lines, plane, forward) {
        const n = 100
        const ang = ((forward ? 1 : -1) * (2 * Math.PI)) / n
        this.#rotate_lines(lines, plane, ang)
    }

    draw_shape(lines) {
        const axis_lines = utils.clone(this.#axis_lines)
        const shape = utils.clone(lines)
        shape.push(...utils.clone(this.#hires_axes))
        for (let plane of utils.get_coord_planes(this.#axes)) {
            this.#rotate_lines(axis_lines, plane, this.#angs[plane])
            this.#rotate_lines(shape, plane, this.#angs[plane])
        }
        this.#scene.clear()
        this.#scene.draw_shape(shape, this.#bulb)
        this.#draw_axes_name(axis_lines)
    }
    //#endregion

    //#region private utils

    #gen_axes() {
        this.#bulb = this.#create_lightbulb()
        this.#axis_lines = this.#create_axes()
        this.#hires_axes = utils.dlss(this.#axis_lines, 60)
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

    #draw_axes_name(axes_lines) {
        for (let i = 0; i < axes_lines.length; i++) {
            const axi = this.#axes[i]
            const end = axes_lines[i][1]
            this.#scene.draw_text(end, utils.AXIS_NAMES[axi], "whitesmoke")
        }
    }

    #create_axes() {
        const axes = this.#axes
        const lines = []
        for (let i = 0; i < axes.length; i++) {
            const axi = axes[i]
            const start = utils.zero()
            const end = utils.zero()
            start[axi] = -1 * utils.AXIS_SIZE
            end[axi] = utils.AXIS_SIZE
            lines.push([start, end])
        }
        return lines
    }

    #create_lightbulb() {
        const axes = this.#axes
        const bulb = utils.zero()
        bulb[axes[0]] = 5
        bulb[axes[axes.length - 1]] = 5

        const d = axes.length
        if (d > 2) {
            const half = Math.floor(d / 2)
            bulb[axes[half]] = -5
        }

        console.log(`light bulb: ${bulb}`)
        return bulb
    }
    //#endregion
}
