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

    set_max_ang(max_ang) {
        this.max_ang = max_ang
        const d = 10
        const cam = utils.fill(this.dimension, -d)
        cam[0] = (d * 2) / 3 // 0
        cam[this.dimension - 1] = (d * 1) / 2 // 0
        const axes = []
        let da = Math.PI / this.dimension
        switch (max_ang) {
            case "PI/4":
                da = Math.PI / 4 / (this.dimension - 1)
                break
            case "PI/2":
                da = Math.PI / 2 / (this.dimension - 1)
                break
            default:
                cam[0] = d
                cam[this.dimension - 1] = d
                break
        }
        for (let i = 0; i < this.dimension; i++) {
            axes.push(da * i)
        }
        this.cam = cam
        this.axes = axes
    }

    get_planes() {
        const planes = []
        for (let i = 0; i < this.dimension; i++) {
            for (let j = i + 1; j < this.dimension; j++) {
                const name = `${AxesName[i]}${AxesName[j]}`
                planes.push(name)
            }
        }
        return planes
    }

    toBoard(p) {
        let x = 0
        let y = 0
        for (let i = 0; i < this.dimension; i++) {
            const ang = this.axes[i]
            x = x + Math.cos(ang) * p[i]
            y = y + Math.sin(ang) * p[i]
        }
        return [x, y]
    }

    rotate(lines, plane, ang) {
        const ix = AxesName.indexOf(plane[0])
        const iy = AxesName.indexOf(plane[1])

        if (ix < 0 || iy < 0 || ix >= this.dimension || iy >= this.dimension) {
            throw new Error(`invalid plane ${plane}`)
        }

        for (let line of lines) {
            for (let p of line) {
                const x = p[ix]
                const y = p[iy]
                p[ix] = x * Math.cos(ang) - y * Math.sin(ang)
                p[iy] = x * Math.sin(ang) + y * Math.cos(ang)
            }
        }
    }

    draw_line_raw(line, r1, r2, color) {
        const [x1, y1] = this.toBoard(line[0])
        const [x2, y2] = this.toBoard(line[1])
        this.board.draw_line(x1 * r1, y1 * r1, x2 * r2, y2 * r2, color)
    }

    draw_text_raw(p, r, text, color) {
        const [x1, y1] = this.toBoard(p)
        this.board.draw_text(text, x1 * r, y1 * r, color)
    }

    to_color(d1, d2, min, diff) {
        // (d1 + d2 - min - min) / diff -> [0, 2]
        // (2 - x) * 100 + 50 -> [256, 50]
        const r = (d1 + d2 - min - min) / diff
        const g = (2 - r) * 105 + 40
        const c = `rgb(0, ${g}, 0)`
        return c
    }

    to_scale_ration(distance, min, diff, factor) {
        // (distance - min) / diff -> [0, 1]
        // x * 2 -> [0, 2]
        // 1 - x -> [1, -1]
        // 1 + factor * x -> [1 + factor, 1 - factor]
        return 1 + factor * (1 - ((distance - min) / diff) * 2)
    }

    draw_axes() {
        for (let i = 0; i < this.dimension; i++) {
            const start = utils.zero(this.dimension)
            start[i] = -2
            const end = utils.zero(this.dimension)
            end[i] = 2
            this.draw_line_raw([start, end], 1, 1, "whitesmoke")
            this.draw_text_raw(end, 1, AxesName[i], "whitesmoke")
        }
    }

    draw_lines_2d(lines) {
        this.board.clear()
        this.draw_axes()
        for (let line of lines) {
            this.draw_line_raw(line, 1, 1, "green")
        }
    }

    draw_lines_3d(cam, lines) {
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

        // draw begin
        this.board.clear()
        this.draw_axes()

        // draw lines
        const diff = max - min
        const factor = 0.2
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i]
            const r1 = this.to_scale_ration(lds[i][0], min, diff, factor)
            const r2 = this.to_scale_ration(lds[i][1], min, diff, factor)
            const color = this.to_color(lds[i][0], lds[i][1], min, diff)
            this.draw_line_raw(line, r1, r2, color)
        }
    }

    draw_lines(lines) {
        if (this.dimension < 3) {
            this.draw_lines_2d(lines)
            return
        }
        const cam = this.cam
        this.draw_lines_3d(cam, lines)
    }
}
