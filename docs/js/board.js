export class Board {
    constructor(element_id, zoom_factor) {
        this.zoom_factor = zoom_factor || 0
        this.board = document.getElementById(element_id)
        this.container = this.board.parentNode
        this.ctx = board.getContext("2d")
        this.resize_board()
        this.sx = 0
        this.sy = 0
    }

    shift(x, y) {
        this.sx = this.cx * x
        this.sy = -1 * this.cy * y
    }

    zoom(factor) {
        this.zoom_factor = factor || 0
    }

    resize_board() {
        this.board.width = this.container.clientWidth
        this.board.height = this.container.clientHeight
        this.width = this.board.width
        this.height = this.board.height
        this.cx = this.width / 2
        this.cy = this.height / 2
        this.size = Math.min(this.cx, this.cy)
    }

    clear() {
        this.ctx.clearRect(0, 0, this.width, this.height)
    }

    translate(x, y) {
        const px = this.scalce(x) + this.cx
        const py = -1 * this.scalce(y) + this.cy
        return [px + this.sx, py + this.sy]
    }

    scalce(l) {
        return Number(l) * this.size * this.zoom_factor
    }

    draw_text(text, x, y, color, size) {
        this.ctx.fillStyle = color || "whitesmoke"
        const s = Math.max(14, this.scalce(size || 0))
        this.ctx.font = `${s}px sans`
        const [px, py] = this.translate(x, y)
        this.ctx.fillText(`${text}`, px, py)
    }

    draw_line(x1, y1, x2, y2, color, width) {
        this.ctx.lineWidth = Math.max(1, this.scalce(width)) // 0.003 -> 1
        this.ctx.strokeStyle = color || "white"
        const [p1x, p1y] = this.translate(x1, y1)
        const [p2x, p2y] = this.translate(x2, y2)
        this.ctx.beginPath()
        this.ctx.moveTo(p1x, p1y)
        this.ctx.lineTo(p2x, p2y)
        this.ctx.stroke()
    }

    draw_circle(x, y, color, radius) {
        this.ctx.fillStyle = color || "red"
        const r = Math.max(1, this.scalce(radius))
        this.ctx.beginPath()
        const [px, py] = this.translate(x, y)
        this.ctx.arc(px, py, r, 0, Math.PI * 2)
        this.ctx.fill()
        this.ctx.closePath()
    }
}
