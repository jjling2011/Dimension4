import { Board } from "./board.js"
import { Coord } from "./coord.js"
import { Shapes, GetShape } from "./shapes.js"

function main() {
    const board = new Board("board")
    const coord = new Coord(board)

    const elBoardScale = $("#board-scale")
    const elBoardMoveX = $("#board-move-x")
    const elBoardMoveY = $("#board-move-y")
    const elShapes = $("#coord-shapes")
    const elAxes = $("#coord-axes")
    const elMaxAng = $("#coord-max-ang")
    const elPlanes = $("#input-rotate-plane")

    let cur_shape = []
    let rotateHandle
    $("#btn-rotate-stop").click(() => stop_rotate())
    $("#btn-rotate-forward").click(() => rotate(true))
    $("#btn-rotate-backward").click(() => rotate(false))

    function updateBoardSettings() {
        const scale = Number(elBoardScale.val()) || 20
        const factor = Math.log10(scale / 10)
        board.zoom(factor)
        const mx = Number(elBoardMoveX.val()) || 0
        const my = Number(elBoardMoveY.val()) || 0
        board.shift(mx / 100, my / 100)
    }

    function updateCoordSettings() {
        coord.set_dimension(Number(elAxes.val()) || 2)
        coord.set_max_ang(elMaxAng.val())
        update_planes_name()
    }

    function stop_rotate() {
        clearInterval(rotateHandle)
    }

    function rotate(forward) {
        stop_rotate()
        const plane = elPlanes.val()
        const ang = (((forward ? 1 : -1) * Math.PI) / 90) * 3
        rotateHandle = setInterval(() => {
            coord.rotate(cur_shape, plane, ang)
            coord.draw_lines(cur_shape)
        }, 200)
    }

    function get_shape_lines() {
        const dim = coord.dimension
        switch (elShapes.val()) {
            case "None":
                return GetShape(Shapes.None, dim)
            case "Square":
                return GetShape(Shapes.Square, dim)
            case "Unit Cube":
                return GetShape(Shapes.UnitCube, dim)
            case "Gray Cube":
                return GetShape(Shapes.GrayCube, dim)
            default:
                return GetShape(Shapes.Cube, dim)
        }
    }

    function refresh() {
        stop_rotate()
        updateBoardSettings()
        updateCoordSettings()

        cur_shape = get_shape_lines()
        coord.draw_lines(cur_shape)
    }

    function update_planes_name() {
        const cur = elPlanes.val()
        elPlanes.empty()
        let ok = false
        const planes = coord.get_planes()
        for (let name of planes) {
            if (name === cur) {
                ok = true
            }
            elPlanes.append(
                $("<option>", {
                    value: name,
                    text: name,
                })
            )
        }
        elPlanes.val(ok ? cur : "xy")
    }

    $(window).on("resize", () => {
        board.resize_board()
        refresh()
    })

    elPlanes.on("change", () => {
        stop_rotate()
    })

    for (let el of [
        elBoardScale,
        elBoardMoveX,
        elBoardMoveY,
        elShapes,
        elMaxAng,
        elAxes,
    ]) {
        el.on("change", refresh)
    }

    refresh()
}

// 也可以直接使用 jQuery（因为它是全局的）
$(document).ready(() => main())
