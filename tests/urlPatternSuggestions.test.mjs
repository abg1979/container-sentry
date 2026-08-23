import test from 'node:test'
import assert from 'node:assert/strict'

import {
    escapeRegex,
    getPatternError,
    suggestUrlPattern,
} from '../src/settings/urlPatternSuggestions.mjs'

test('escapeRegex escapes regular expression metacharacters', () => {
    assert.equal(escapeRegex('a.b+c?d[e]'), 'a\\.b\\+c\\?d\\[e\\]')
})

test('suggestUrlPattern keeps origin and path but removes query and fragment', () => {
    assert.equal(
        suggestUrlPattern('https://example.com/login?token=secret#step'),
        '^https://example\\.com/login(?:[?#].*)?$',
    )
})

test('suggestUrlPattern preserves explicit ports and escapes path characters', () => {
    assert.equal(
        suggestUrlPattern('https://localhost:8443/a+b/index.html'),
        '^https://localhost:8443/a\\+b/index\\.html(?:[?#].*)?$',
    )
})

test('suggestUrlPattern handles root and non-host URLs', () => {
    assert.equal(suggestUrlPattern('https://example.com'), '^https://example\\.com/(?:[?#].*)?$')
    assert.equal(suggestUrlPattern('file:///tmp/a+b.html'), '^file:///tmp/a\\+b\\.html(?:[?#].*)?$')
})

test('suggestUrlPattern rejects invalid URLs', () => {
    assert.throws(() => suggestUrlPattern('not a url'), TypeError)
})

test('getPatternError reports invalid and empty patterns', () => {
    assert.equal(getPatternError('^https://example\\.com/$'), '')
    assert.equal(getPatternError(''), 'A URL pattern is required.')
    assert.match(getPatternError('['), /regular expression|unterminated/i)
})
