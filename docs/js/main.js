import { Board } from "./board.js"
import { Coord } from "./coord.js"
import { Shapes, get_shape_by_name } from "./shapes.js"
import { Mappers } from "./mapper.js"
import * as utils from "./utils.js"

function main() {
    const elBoardScale = $("#board-scale")
    const elBoardMoveX = $("#board-move-x")
    const elBoardMoveY = $("#board-move-y")
    const elShapeName = $("#shape-name")
    const elShapeDimension = $("#shape-dimension")
    const elShapePlane = $("#shape-rotate-plane")

    const elCoordType = $("#coord-type")
    const elCoordAxes = $("#coord-axes-checkboxes")
    const elCoordPlane = $("#coord-rotate-plane")

    const board = new Board("board")
    const coord = new Coord(board)

    let cur_shape = []
    let rotateHandle
    let cur_plane = "xy"

    function debug() {
        utils.header("debug()")

        elCoordType.val(Mappers.Avg)
        select_coord_axes("xyz")

        elShapeDimension.val(3).change()
        elShapeName.val(Shapes.QuasiSphereX).change()
        elShapePlane.val("xy").change()

        utils.header()
    }

    function update_board_settings() {
        const scale = Number(elBoardScale.val()) || 27
        const factor = Math.log10(scale / 10)
        board.set_zoom_factor(factor)
        const mx = (Number(elBoardMoveX.val()) || 0) / 100
        const my = (Number(elBoardMoveY.val()) || 0) / 100
        board.move_center(mx, my)
        console.log(`board scale: ${elBoardScale.val()} origin: (${mx}, ${my})`)
    }

    function update_shape_settings() {
        const d = get_shape_dim()
        fill_options(elShapePlane, utils.get_planes(d))
    }

    function update_coord_settings() {
        const axes_str = get_selected_coord_axes()
        const axes = utils.axes_to_idxes(axes_str)
        const coordType = elCoordType.val()
        coord.reset_coord(axes, coordType)

        const planes = utils.get_coord_planes(axes)
        fill_options(elCoordPlane, planes)
    }

    function get_shape_dim() {
        return parseInt(elShapeDimension.val())
    }

    function load_shape() {
        const name = elShapeName.val()
        const d = get_shape_dim()
        cur_shape = get_shape_by_name(name, d)
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
            const plane = elCoordPlane.val()
            console.log(`coord rotating plane: ${cur_plane}`)
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

        elShapePlane.on("change", () => {
            cur_plane = elShapePlane.val()
            console.log(`shape rotating plane: ${cur_plane}`)
        })

        elShapeName.on("change", () => {
            stop_rotate()
            load_shape()
            update_canvas()
        })

        elCoordType.on("change", () => {
            update_coord_settings()
            update_canvas()
        })

        elShapeDimension.on("change", () => {
            stop_rotate()
            update_shape_settings()
            load_shape()
            update_canvas()
        })

        elCoordAxes.on('click', 'input[type="checkbox"]', () => {
            update_coord_settings()
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

    function get_selected_coord_axes() {
        const axes = []
        elCoordAxes.children('input:checkbox:checked').map((_, el) => {
            const box = $(el)
            const name = box.val()
            axes.push(name)
        })
        return axes
    }

    function select_coord_axes(names) {
        console.log(`select axes: ${names}`)
        elCoordAxes.children("input:checkbox").map((_, el) => {
            const box = $(el)
            const name = box.val()
            box.prop('checked', names.indexOf(name) >= 0)
        })
        update_coord_settings()
    }

    function init_coord_axes(names) {

        // init checkboxes
        const prefix = "axis-checkbox"
        const axes = utils.AXIS_NAMES.slice(0, utils.MAX_DIMESION)
        const checkboxes = axes.map((name, idx) => {
            const id = `${prefix}-${idx}`
            return `<input type="checkbox" id="${id}" value="${name}" class="${prefix}">
                    <label for="${id}">${name}</label>`
        }).join('\n')
        elCoordAxes.html(checkboxes)

        // init buttons
        const button_container = $("#coord-axes-buttons")
        for (let i = utils.MIN_DIMESION; i < utils.MAX_DIMESION; i++) {
            const name = utils.AXIS_NAMES.slice(0, i + 1).join("");
            $('<button>').text(`${name.length}.${name}`)
                .on('click', () => {
                    select_coord_axes(name)
                    update_canvas()
                })
                .appendTo(button_container)
        }
        select_coord_axes(names)
    }

    function init() {
        utils.header("init()")

        fill_options(elShapeDimension, utils.get_dimensions_array())
        fill_options(elShapeName, get_values(Shapes))
        fill_options(elCoordType, get_values(Mappers))
        init_coord_axes("xyz")

        init_element_event_handler()

        update_board_settings()
        update_coord_settings()
        update_shape_settings()
        load_shape()
        update_canvas()

        hide_loading_overlay()
        debug && debug()
    }

    init()
}

$(document).ready(() => main())
