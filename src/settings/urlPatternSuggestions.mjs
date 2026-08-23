export const escapeRegex = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

export const suggestUrlPattern = value => {
    const url = new URL(value)
    const stableUrl = url.origin !== 'null'
        ? `${url.origin}${url.pathname || '/'}`
        : `${url.protocol}//${url.host}${url.pathname || '/'}`

    return `^${escapeRegex(stableUrl)}(?:[?#].*)?$`
}

export const getPatternError = pattern => {
    if (!pattern) return 'A URL pattern is required.'

    try {
        new RegExp(pattern)
        return ''
    } catch (error) {
        return error.message
    }
}
