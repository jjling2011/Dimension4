import * as utils from "./utils.js"

export const AxesName = ["x", "y", "z", "w", "v", "u"]

export class Coord {
    constructor(board, dimension, max_ang) {
        this.board = board
        this.set_dimension(dimension)
        this.set_max_ang(max_ang)
    }

    set_dimension(dimension) {
        this.dimension = Math.min(6, Math.max(2, Math.floor(dimension || 2)))
    }

    reset_angs() {
        for (let name in this.angs) {
            this.angs[name] = 0
        }
    }

    set_max_ang(max_ang) {
        this.max_ang = max_ang
        let da = Math.PI / this.dimension
        switch (max_ang) {
            case "PI/4":
                da = Math.PI / 4 / (this.dimension - 1)
                break
            case "PI/2":
                da = Math.PI / 2 / (this.dimension - 1)
                break
            default:
                break
        }
        const axes = []
        const zoomf = []
        const factor = 0.5
        for (let i = 0; i < this.dimension; i++) {
            const ang = da * i
            axes.push(ang)
            // cos(x) -> [-1, 1]
            // (1 - x) / 2  -> [1, 0]
            zoomf.push(1 - factor * ((1 - Math.cos(ang * 4)) / 2))
        }

        const camd = 5
        const cam = utils.fill(this.dimension, -camd)
        cam[0] = camd // 0
        cam[this.dimension - 1] = camd // 0
        this.cam = cam
        this.axes = axes
        this.zoomf = zoomf
        console.log(`zoom factor: ${zoomf}`)
        console.log(`axis angles: ${axes}`)
    }

    get_planes() {
        const angs = {}
        const planes = []
        for (let i = 0; i < this.dimension; i++) {
            for (let j = i + 1; j < this.dimension; j++) {
                const name = `${AxesName[i]}${AxesName[j]}`
                planes.push(name)
                angs[name] = 0
            }
        }
        this.angs = angs
        return planes
    }

    to_board_point(p) {
        let x = 0
        let y = 0
        for (let i = 0; i < this.dimension; i++) {
            const ang = this.axes[i]
            x = x + Math.cos(ang) * p[i]
            y = y + Math.sin(ang) * p[i]
        }
        return [x, y]
    }

    plane_to_idx(plane) {
        const i1 = AxesName.indexOf(plane[0])
        const i2 = AxesName.indexOf(plane[1])
        if (i1 < 0 || i2 < 0 || i1 >= this.dimension || i2 >= this.dimension) {
            throw new Error(`invalid plane ${plane}`)
        }
        return [i1, i2]
    }

    rotate(lines, plane, forward) {
        const n = 100
        const da = ((forward ? 1 : -1) * (2 * Math.PI)) / n
        this.angs[plane] = (this.angs[plane] + da) % (Math.PI * 2)

        const l2 = utils.clone(lines)
        for (let name in this.angs) {
            const ang = this.angs[name]
            if (Math.abs(ang) < utils.MIN_ANG) {
                continue
            }
            const [i1, i2] = this.plane_to_idx(name)
            for (let line of l2) {
                for (let p of line) {
                    const x = p[i1]
                    const y = p[i2]
                    p[i1] = x * Math.cos(ang) - y * Math.sin(ang)
                    p[i2] = x * Math.sin(ang) + y * Math.cos(ang)
                }
            }
        }
        return l2
    }

    draw_line_raw(p1, p2, color) {
        const [x1, y1] = this.to_board_point(p1)
        const [x2, y2] = this.to_board_point(p2)
        this.board.draw_line(x1, y1, x2, y2, color)
    }

    draw_text_raw(p, text, color) {
        const [x1, y1] = this.to_board_point(p)
        this.board.draw_text(text, x1, y1, color)
    }

    to_color_value(d1, d2, min, diff) {
        // (d1 + d2 - min - min) / diff / 2 -> [0, 1]
        // 1 - x -> [1, 0]
        const r = 1 - (d1 + d2 - min - min) / diff / 2
        const c = r * 230 + 20
        return c
    }

    to_scene_ratio(distance, min, diff, factor) {
        // (distance - min) / diff -> [0, 1]
        // x * 2 -> [0, 2]
        // 1 - x -> [1, -1]
        // 1 + factor * x -> [1 + factor, 1 - factor]
        return 1 + factor * (1 - ((distance - min) / diff) * 2)
    }

    draw_axes_name() {
        for (let i = 0; i < this.dimension; i++) {
            const p = utils.zero(this.dimension)
            p[i] = 2
            this.draw_text_raw(p, AxesName[i], "whitesmoke")
        }
    }

    create_axes() {
        const n = 40
        const a = []
        const step = 4 / n
        for (let i = 0; i < this.dimension; i++) {
            for (let j = -2; j < 2 - step; j += step) {
                const start = utils.zero(this.dimension)
                const end = utils.zero(this.dimension)
                start[i] = j
                end[i] = j + step
                const d = utils.distance(this.cam, end)
                a.push([start, end, "whitesmoke", d])
            }
        }
        return a
    }

    zoom(lines) {
        const l2 = utils.clone(lines)
        for (let line of l2) {
            for (let i = 0; i < this.dimension; i++) {
                line[0][i] *= this.zoomf[i]
                line[1][i] *= this.zoomf[i]
            }
        }
        return l2
    }

    draw_scene(cam, lines) {
        const lds = []
        let min = utils.MAX_DISTANCE
        let max = utils.MIN_DISTANCE
        for (let line of lines) {
            const d1 = utils.distance(cam, line[0])
            const d2 = utils.distance(cam, line[1])
            min = Math.min(min, d1, d2)
            max = Math.max(max, d1, d2)
            lds.push([d1, d2])
        }

        const scene = this.create_axes()
        const diff = max - min
        for (let i = 0; i < lines.length; i++) {
            const c = this.to_color_value(lds[i][0], lds[i][1], min, diff)
            const d = (lds[i][0] + lds[i][1]) / 2
            scene.push([lines[i][0], lines[i][1], `rgb(0, ${c}, 0)`, d])
        }
        scene.sort((a, b) => b[3] - a[3])

        // draw begin
        this.board.clear()
        for (let o of scene) {
            this.draw_line_raw(o[0], o[1], o[2])
        }
        this.draw_axes_name()
    }

    draw_lines(lines) {
        if (this.max_ang === "Auto") {
            this.draw_scene(this.cam, lines)
        } else {
            const l2 = this.zoom(lines)
            this.draw_scene(this.cam, l2)
        }
    }
}
