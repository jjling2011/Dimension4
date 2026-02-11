import * as utils from "./utils.js"

export class Scene {
    #board
    #dimension
    #mapper

    constructor(board) {
        this.#board = board
    }

    //#region private mapping

    //#endregion

    //#region private draw
    #draw_line(p1, p2, color) {
        const [x1, y1] = this.#mapper.map(p1)
        const [x2, y2] = this.#mapper.map(p2)
        this.#board.draw_2d_line(x1, y1, x2, y2, color)
    }

    #dye(lines, bulb) {
        const l2 = []
        let min = utils.MAX_DISTANCE
        let max = utils.MIN_DISTANCE
        const crbs = []
        for (let line of lines) {
            const d1 = utils.distance(bulb, line[0])
            const d2 = utils.distance(bulb, line[1])
            min = Math.min(min, d1, d2)
            max = Math.max(max, d1, d2)
            const rb = to_red_blue(bulb, line[1])
            crbs.push(rb)
            l2.push([line[0], line[1], "gray", d2])
        }

        const scene = []
        const diff = max - min
        for (let i = 0; i < l2.length; i++) {
            const line = l2[i]
            const rb = crbs[i]
            const g = to_green(line[3], min, diff)
            const c = to_rgb(rb, g)
            line[2] = c
            scene.push(line)
        }
        return scene
    }
    //#endregion

    //#region public
    reset_map_funcs(dimension, mapper) {
        this.#dimension = dimension
        this.#mapper = mapper
    }

    draw_text(p, text, color) {
        const [x1, y1] = this.#mapper.map(p)
        this.#board.draw_2d_text(text, x1, y1, color)
    }

    clear() {
        this.#board.clear()
    }

    draw_shape(lines, bulb) {
        const scene = this.#dye(lines, bulb)
        scene.sort((a, b) => b[3] - a[3])

        // draw begin
        for (let o of scene) {
            this.#draw_line(o[0], o[1], o[2])
        }
    }
    //#endregion
}

//#region helper funcs
function to_green(d2, min, diff) {
    // (d1 + d2 - min - min) / diff / 2 -> [0, 1]
    // 1 - x -> [1, 0]
    const r = 1 - (d2 - min) / diff / 2
    const c = r * 230 + 20
    return c
}

function to_red_blue(bulb, p) {
    const cs = utils.cos(bulb, p) // [-1, 1]
    if (cs > 0) {
        return cs * 220 + 30
    }
    return cs * 200 - 30
}

function to_rgb(rb, g) {
    if (rb >= 0) {
        return `rgb(${rb}, ${g}, 0)`
    }
    return `rgb(0,${g},${-rb})`
}
//#endregion
