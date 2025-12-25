import { Board } from "./board.js"
import { Coord } from "./coord.js"
import { Shapes, get_shape_names, get_shape_by_name } from "./shapes.js"

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

    let cur_shape_name = Shapes.Sphere3D
    let cur_shape = []
    let rotateHandle
    let cur_plane = "xy"
    $("#btn-rotate-stop").click(() => stop_rotate())
    $("#btn-rotate-forward").click(() => rotate(true))
    $("#btn-rotate-backward").click(() => rotate(false))
    $("#btn-step-forward").click(() => {
        stop_rotate()
        step(true)
    })
    $("#btn-step-backward").click(() => {
        stop_rotate()
        step(false)
    })
    $("#btn-rotate-reset").click(() => {
        stop_rotate()
        coord.reset_angs()
        coord.draw_lines(cur_shape)
    })

    function updateBoardSettings() {
        const scale = Number(elBoardScale.val()) || 27
        const factor = Math.log10(scale / 10)
        board.zoom(factor)
        const mx = Number(elBoardMoveX.val()) || 0
        const my = Number(elBoardMoveY.val()) || 0
        board.shift(mx / 100, my / 100)
        console.log(
            `board scale: ${elBoardScale.val()} max_x: ${elBoardMoveX.val()} max_y: ${elBoardMoveY.val()}`
        )
    }

    function updateCoordSettings() {
        coord.set_dimension(Number(elAxes.val()) || 2)
        coord.set_max_ang(elMaxAng.val())
        update_option_el(elPlanes, coord.get_planes())
    }

    function stop_rotate() {
        clearInterval(rotateHandle)
    }

    function step(forward) {
        const lines = coord.rotate(cur_shape, cur_plane, forward)
        coord.draw_lines(lines)
    }

    function rotate(forward) {
        stop_rotate()
        rotateHandle = setInterval(() => step(forward), 150)
    }

    function refresh() {
        console.log(`call refresh()`)
        stop_rotate()
        updateBoardSettings()
        updateCoordSettings()

        cur_shape = get_shape_by_name(cur_shape_name, coord.dimension)
        coord.draw_lines(cur_shape)
    }

    function update_option_el(el, options, defv) {
        const cur = el.val()
        el.empty()
        let ok = false
        for (let name of options) {
            if (name === cur) {
                ok = true
            }
            el.append(
                $("<option>", {
                    value: name,
                    text: name,
                })
            )
        }
        el.val(ok ? cur : defv || options[0])
        el.trigger("change")
    }

    $(window).on("resize", () => {
        board.resize_board()
        refresh()
    })

    elPlanes.on("change", () => {
        stop_rotate()
        cur_plane = elPlanes.val()
        console.log(`select rotate plane: ${cur_plane}`)
    })

    elShapes.on("change", () => {
        stop_rotate()
        cur_shape_name = elShapes.val()
        console.log(`select shape: ${cur_shape_name}`)
        refresh()
    })

    for (let el of [
        elBoardScale,
        elBoardMoveX,
        elBoardMoveY,
        elMaxAng,
        elAxes,
    ]) {
        el.on("change", refresh)
    }

    function init() {
        update_option_el(elShapes, get_shape_names(), cur_shape_name)
        elPlanes.trigger("change")
    }

    init()
}

$(document).ready(() => main())
