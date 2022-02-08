const { describe, test, expect } = require('@jest/globals')
const { transfer, aggregate } = require('./mixin')

describe('transfer', () => {
  test('null', () => {
    expect(() => transfer(null, 'users')).toThrow(TypeError)
  })
})

describe('aggregate', () => {
  test('null', () => {
    expect(() => aggregate(null)).toThrow(TypeError)
  })
})
