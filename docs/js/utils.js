//#region constants
export const MIN_DISTANCE = 0.00001
export const MAX_DISTANCE = 1000000.00001
export const MIN_ANG = 0.00001

export const AXIS_NAMES = "abcdefghijklmnopqrstuvwzyx".split("").reverse()
export const AXIS_SIZE = 1.5
//#endregion

//#region public

export function plane_to_idx(plane) {
    const i1 = AXIS_NAMES.indexOf(plane[0])
    const i2 = AXIS_NAMES.indexOf(plane[1])
    if (i1 < 0 || i2 < 0) {
        throw new Error(`invalid plane ${plane}`)
    }
    return [i1, i2]
}

export function get_planes(dimension) {
    const d = parseInt(`${dimension}`)
    const planes = []
    for (let i = 0; i < d; i++) {
        for (let j = i + 1; j < d; j++) {
            const name = `${AXIS_NAMES[i]}${AXIS_NAMES[j]}`
            planes.push(name)
        }
    }
    return planes
}

export function header(...args) {
    const char = "="
    if (!args || args.length < 1) {
        console.log(char.repeat(24))
        return
    }
    const pad = char.repeat(8)
    const arr = [pad]
    arr.push(args.join(" "))
    arr.push(pad)
    console.log(arr.join(" "))
}

export function dlss(lines, mul) {
    const c = lines.length
    if (!c || c < 1) {
        return lines
    }

    mul = mul || Math.min(30, Math.floor(2000 / c))
    if (mul < 2) {
        return lines
    }

    const r = []
    for (let line of lines) {
        let per = clone(line[0])
        const dim = per.length
        const dd = []
        for (let i = 0; i < dim; i++) {
            const d = (line[1][i] - line[0][i]) / mul
            dd.push(d)
        }
        for (let j = 0; j < mul; j++) {
            const cur = zero(dim)
            for (let i = 0; i < dim; i++) {
                cur[i] = per[i] + dd[i]
            }
            r.push([per, cur])
            per = clone(cur)
        }
    }
    console.log(`dlss(${mul}): ${c} -> ${r.length}`)
    return r
}

export function to_gray(p, base) {
    const dimension = p.length
    let shift = 0
    const gray = zero(dimension)
    for (let i = dimension - 1; i >= 0; i--) {
        gray[i] = (p[i] + shift) % base
        shift = shift + base - gray[i]
    }
    return gray
}

export function to_lines(ps) {
    const ps2 = dedup_point(ps)
    const lines = connect_all(ps2)
    return dedup_lines(lines)
}

export function zero(dimension) {
    return Array(dimension).fill(0)
}

export function distance(p1, p2) {
    let d2 = 0
    for (let i = 0; i < p1.length; i++) {
        const t = p1[i] - p2[i]
        d2 = d2 + t * t
    }
    return Math.sqrt(d2)
}

export function cos(p1, p2) {
    let dotp = 0
    let sd1 = 0
    let sd2 = 0
    for (let i = 0; i < p1.length; i++) {
        dotp += p1[i] * p2[i]
        sd1 += p1[i] * p1[i]
        sd2 += p2[i] * p2[i]
    }
    return dotp / Math.sqrt(sd1) / Math.sqrt(sd2)
}

export function trim_long_line(lines, len) {
    const l2 = []
    for (let line of lines) {
        const d = distance(...line)
        if (d < len) {
            l2.push(line)
        }
    }
    console.log(
        `filter lines longer then ${len}: ${lines.length} -> ${l2.length}`,
    )
    return l2
}

export function trim_short_line(lines, len) {
    const l2 = []
    for (let line of lines) {
        const d = distance(...line)
        if (d > len) {
            l2.push(line)
        }
    }
    console.log(
        `filter lines shorter then ${len}: ${lines.length} -> ${l2.length}`,
    )
    return l2
}

export function clone(o) {
    // Source - https://stackoverflow.com/a
    // Posted by G. Ghez
    // Retrieved 2025-12-24, License - CC BY-SA 3.0
    return JSON.parse(JSON.stringify(o))
}

export function dedup_lines(lines) {
    const l2 = []
    for (let line of lines) {
        if (!has_line(l2, line)) {
            l2.push(line)
        }
    }
    console.log(`dedup lines from: ${lines.length} -> ${l2.length}`)
    return l2
}

//#endregion

//#region private
function has_point(haystack, needle) {
    for (let p of haystack) {
        if (distance(p, needle) < MIN_DISTANCE) {
            return true
        }
    }
    return false
}

function dedup_point(ps) {
    const ps2 = []
    for (let p of ps) {
        if (!has_point(ps2, p)) {
            ps2.push(p)
        }
    }
    console.log(`dedup points: ${ps.length} -> ${ps2.length}`)
    return ps2
}

function diff_point(p1, p2) {
    const n = p1.length
    if (n !== p2.length) {
        return true
    }
    if (distance(p1, p2) < MIN_DISTANCE) {
        return false
    }
    return true
}

function diff_line(l1, l2) {
    if (!diff_point(l1[0], l2[0]) && !diff_point(l1[1], l2[1])) {
        return false
    }
    if (!diff_point(l1[0], l2[1]) && !diff_point(l1[1], l2[0])) {
        return false
    }
    return true
}

function has_line(haystack, needle) {
    for (let line of haystack) {
        if (!diff_line(needle, line)) {
            return true
        }
    }
    return false
}

function connect_all(ps) {
    const lines = []
    for (let i = 0; i < ps.length; i++) {
        for (let j = 0; j < ps.length; j++) {
            if (i === j) {
                continue
            }
            lines.push([ps[i], ps[j]])
        }
    }
    console.log(`connect ${ps.length} points with ${lines.length} lines`)
    return lines
}

//#endregion
