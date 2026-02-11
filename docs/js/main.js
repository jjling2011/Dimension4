import { Board } from "./board.js"
import { Coord } from "./coord.js"
import { Shapes, get_shape_by_name } from "./shapes.js"
import { Mappers } from "./mapper.js"
import * as utils from "./utils.js"

function main() {
    const elBoardScale = $("#board-scale")
    const elBoardMoveX = $("#board-move-x")
    const elBoardMoveY = $("#board-move-y")
    const elShapes = $("#coord-shapes")
    const elDimension = $("#coord-axes-num")
    const elCoordType = $("#coord-type")
    const elPlanes = $("#input-rotate-plane")
    const elAxesPlanes = $("#input-axes-rotate-plane")

    const board = new Board("board")
    const coord = new Coord(board)

    let cur_shape_name = Shapes.Sphere3D
    let cur_shape = []
    let rotateHandle
    let cur_plane = "xy"

    function debug() {
        utils.header("debug()")

        // 1. select coord type
        elCoordType.val(Mappers.CosXY)

        // 2. select dimention
        elDimension.val(3).change()
        elShapes.val(Shapes.Sphere3D).change()
        elPlanes.val("yz").change()

        utils.header()
    }

    function update_board_settings() {
        const scale = Number(elBoardScale.val()) || 27
        const factor = Math.log10(scale / 10)
        board.set_zoom_factor(factor)
        const mx = Number(elBoardMoveX.val()) || 0
        const my = Number(elBoardMoveY.val()) || 0
        board.move_center(mx / 100, my / 100)
        console.log(
            `board scale: ${elBoardScale.val()} max_x: ${elBoardMoveX.val()} max_y: ${elBoardMoveY.val()}`,
        )
    }

    function update_coord_settings() {
        coord.reset_coord(elDimension.val(), elCoordType.val())
        fill_options(elPlanes, coord.get_planes())
        fill_options(elAxesPlanes, coord.get_planes())
    }

    function load_shape() {
        cur_shape = get_shape_by_name(cur_shape_name, coord.get_dimension())
    }

    function stop_rotate() {
        clearInterval(rotateHandle)
    }

    function step(forward) {
        stop_rotate()
        coord.rotate_shape(cur_shape, cur_plane, forward)
        update_canvas()
    }

    function rotate(forward) {
        stop_rotate()
        rotateHandle = setInterval(() => {
            coord.rotate_shape(cur_shape, cur_plane, forward)
            update_canvas()
        }, 150)
    }

    function update_canvas() {
        coord.draw_shape(cur_shape)
    }

    function fill_options(el, options, defv) {
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
                }),
            )
        }
        defv = defv || options[0]
        el.val(ok ? cur : defv)
        el.trigger("change")
    }

    function init_element_event_handler() {
        $("#btn-rotate-stop").click(() => stop_rotate())

        $("#btn-rotate-forward").click(() => rotate(true))

        $("#btn-rotate-backward").click(() => rotate(false))

        $("#btn-step-forward").click(() => step(true))
        $("#btn-step-backward").click(() => step(false))

        $("#btn-rotate-reset").click(() => {
            stop_rotate()
            load_shape()
            update_canvas()
        })

        function add_ang(forward) {
            const plane = elAxesPlanes.val()
            coord.add_ang(plane, forward)
            update_canvas()
        }

        $("#btn-axes-step-forward").click(() => add_ang(true))
        $("#btn-axes-step-backward").click(() => add_ang(false))

        $("#btn-axes-rotate-reset").click(() => {
            coord.reset_angs()
            update_canvas()
        })

        $(window).on("resize", () => {
            board.resize_board()
            update_canvas()
        })

        elPlanes.on("change", () => {
            cur_plane = elPlanes.val()
            console.log(`select rotation plane: ${cur_plane}`)
        })

        elShapes.on("change", () => {
            stop_rotate()
            cur_shape_name = elShapes.val()
            console.log(`select shape: ${cur_shape_name}`)
            load_shape()
            update_canvas()
        })

        elCoordType.on("change", () => {
            update_coord_settings()
            update_canvas()
        })

        elDimension.on("change", () => {
            stop_rotate()
            update_coord_settings()
            load_shape()
            update_canvas()
        })

        for (let el of [elBoardScale, elBoardMoveX, elBoardMoveY]) {
            el.on("change", () => {
                update_board_settings()
                update_canvas()
            })
        }
    }

    function hide_loading_overlay() {
        const overlay = document.getElementById("loadingOverlay")
        overlay.style.display = "none"
    }

    function get_values(o) {
        return Object.values(o)
    }

    function init() {
        utils.header("init()")
        init_element_event_handler()
        fill_options(elShapes, get_values(Shapes), cur_shape_name)
        fill_options(elCoordType, get_values(Mappers), Mappers.PI2)
        update_board_settings()
        update_coord_settings()
        load_shape()
        update_canvas()

        hide_loading_overlay()
        debug && debug()
    }

    init()
}

$(document).ready(() => main())
