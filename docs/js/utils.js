export const MIN_DISTANCE = 0.00001
export const MAX_DISTANCE = 1000000.00001

export function get_cords() {
    return $("#cords").val().split(/[, ]+/).map(Number)
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

export function fill(dimension, value) {
    return Array(dimension).fill(value)
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

export function filter_lines(lines, len) {
    const l2 = []
    for (let line of lines) {
        const d = distance(...line)
        if (d < len) {
            l2.push(line)
        }
    }
    console.log(`filter lines: ${lines.length} -> ${l2.length}`)
    return l2
}

export function has_point(haystack, needle) {
    for (let p of haystack) {
        if (distance(p, needle) < MIN_DISTANCE) {
            return true
        }
    }
    return false
}

export function dedup_point(ps) {
    const ps2 = []
    for (let p of ps) {
        if (!has_point(ps2, p)) {
            ps2.push(p)
        }
    }
    console.log(`dedup point: ${ps.length} -> ${ps2.length}`)
    return ps2
}

export function diff_point(p1, p2) {
    const n = p1.length
    if (n !== p2.length) {
        return true
    }
    if (distance(p1, p2) < MIN_DISTANCE) {
        return false
    }
    return true
}

export function diff_line(l1, l2) {
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

export function clone(o) {
    // Source - https://stackoverflow.com/a
    // Posted by G. Ghez
    // Retrieved 2025-12-24, License - CC BY-SA 3.0
    return JSON.parse(JSON.stringify(o))
}

export function connect_all(ps) {
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
