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
        const cam = []
        const factor = Math.sin(Math.PI / 4)
        for (let i = 0; i < this.dimension; i++) {
            const ang = da * i
            axes.push(ang)
            // cos(x * 4) -> [-1, 1]
            // (1 - x) / 2  -> [1, 0]
            zoomf.push(1 - factor * ((1 - Math.cos(ang * 4)) / 2))
            if (i === 0 || ang >= Math.PI / 2) {
                cam.push(5)
            } else {
                cam.push(-5)
            }
        }

        this.camera = cam
        this.axes = axes
        this.zoomf = zoomf
        console.log(`zoom factor: ${zoomf}`)
        console.log(`axis angles: ${axes}`)
        console.log(`camera: ${cam}`)
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

    to_2d(p) {
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
        const ang = ((forward ? 1 : -1) * (2 * Math.PI)) / n
        const [i1, i2] = this.plane_to_idx(plane)

        for (let line of lines) {
            for (let p of line) {
                const x = p[i1]
                const y = p[i2]
                p[i1] = x * Math.cos(ang) - y * Math.sin(ang)
                p[i2] = x * Math.sin(ang) + y * Math.cos(ang)
            }
        }
    }

    draw_hd_line(p1, p2, color) {
        const [x1, y1] = this.to_2d(p1)
        const [x2, y2] = this.to_2d(p2)
        this.board.draw_2d_line(x1, y1, x2, y2, color)
    }

    draw_hd_text(p, text, color) {
        const [x1, y1] = this.to_2d(p)
        this.board.draw_2d_text(text, x1, y1, color)
    }

    to_green(d2, min, diff) {
        // (d1 + d2 - min - min) / diff / 2 -> [0, 1]
        // 1 - x -> [1, 0]
        const r = 1 - (d2 - min) / diff / 2
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
            this.draw_hd_text(p, AxesName[i], "whitesmoke")
        }
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

    to_red_blue(cam, p) {
        const cs = utils.cos(cam, p) // [-1, 1]
        if (cs > 0) {
            return cs * 220 + 30
        }
        return cs * 200 - 30
    }

    to_rgb(rb, g) {
        if (rb >= 0) {
            return `rgb(${rb}, ${g}, 0)`
        }
        return `rgb(0,${g},${-rb})`
    }

    create_axes() {
        const cam = this.camera
        const n = 40
        const lines = []
        const step = 4 / n
        let min = utils.MAX_DISTANCE
        let max = utils.MIN_DISTANCE
        const crbs = []
        for (let i = 0; i < this.dimension; i++) {
            for (let j = -2; j < 2 - step; j += step) {
                const start = utils.zero(this.dimension)
                const end = utils.zero(this.dimension)
                start[i] = j
                end[i] = j + step
                const d = utils.distance(cam, end)
                min = Math.min(min, d)
                max = Math.max(max, d)
                crbs.push(this.to_red_blue(this.camera, end))
                lines.push([start, end, "whitesmoke", d])
            }
        }
        const diff = max - min
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i]
            const g = this.to_green(line[3], min, diff)
            const c = this.to_rgb(crbs[i], g)
            line[2] = c
        }
        return lines
    }

    draw_scene(lines) {
        const cam = this.camera
        const l2 = []
        let min = utils.MAX_DISTANCE
        let max = utils.MIN_DISTANCE
        const crbs = []
        for (let line of lines) {
            const d1 = utils.distance(cam, line[0])
            const d2 = utils.distance(cam, line[1])
            min = Math.min(min, d1, d2)
            max = Math.max(max, d1, d2)
            const rb = this.to_red_blue(cam, line[1])
            crbs.push(rb)
            l2.push([line[0], line[1], "gray", d2])
        }

        const scene = this.create_axes()
        const diff = max - min
        for (let i = 0; i < l2.length; i++) {
            const line = l2[i]
            const rb = crbs[i]
            const g = this.to_green(line[3], min, diff)
            const c = this.to_rgb(rb, g)
            line[2] = c
            scene.push(line)
        }
        scene.sort((a, b) => b[3] - a[3])

        // draw begin
        this.board.clear()
        for (let o of scene) {
            this.draw_hd_line(o[0], o[1], o[2])
        }
        this.draw_axes_name()
    }

    draw_shape(lines) {
        if (this.max_ang === "Auto") {
            this.draw_scene(lines)
        } else {
            const l2 = this.zoom(lines)
            this.draw_scene(l2)
        }
    }
}
