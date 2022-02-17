const fs = require('fs')
const fsPromises = fs.promises
const { beforeAll, beforeEach, afterEach, describe, test, expect } = require('@jest/globals')
import { mount, createLocalVue } from '@vue/test-utils'
import Quasar, * as All from 'quasar'
import TableChart from '../src/pages/TableChart.vue'

const localVue = createLocalVue()
localVue.use(Quasar, { components: All, directives: All, plugins: All })

const wrapper = mount(TableChart, {
  localVue
})

// NOTE: 直接載入 csv 來測試，不知道好不好，測試速度會變慢
beforeAll(async () => {
  const inputData = await fsPromises.readFile('./test/parse_data_one_hour.csv', 'utf-8')

  await wrapper.setData({
    inputData,
    isTypeSelectDisabled: false,
    isGranularitySelectDisabled: false,
    isFlipDisabled: false
  })
})

describe('uploader', () => {
  const uploader = wrapper.find('#uploader')

  test('uploader 存在', () => {
    expect(uploader.exists()).toBe(true)
  })
})

describe('type-selector', () => {
  const userSelectorWrapper = wrapper.find('#type-selector')

  test('type-selector 存在', () => {
    expect(userSelectorWrapper.exists()).toBe(true)
  })

  test('type-selector 初始值為 User', () => {
    expect(userSelectorWrapper.find('.q-input-target').text()).toBe('User')
  })

  test('點擊 type-selector 時，下拉選單包含 User, Nation, OTT Service', async () => {
    await userSelectorWrapper.trigger('click')

    // NOTE: dropdown 的 popover 要用 document.querySelector 才找的到
    const qItemLabels = [...document.querySelectorAll('.q-item-label')]
    expect(qItemLabels[0].textContent).toBe('User')
    expect(qItemLabels[1].textContent).toBe('Nation')
    expect(qItemLabels[2].textContent).toBe('OTT Service')

    await userSelectorWrapper.trigger('click')
  })
})

describe('granularity-selector', () => {
  const granularitySelectorWrapper = wrapper.find('#granularity-selector')

  test('granularity-selector 存在', () => {
    expect(granularitySelectorWrapper.exists()).toBe(true)
  })

  test('granularity-selector 初始值為 5 mins', () => {
    expect(granularitySelectorWrapper.find('.q-input-target').text()).toBe('5 mins')
  })

  test('點擊 granularity-selector 時，下拉選單包含 5 mins, 30 mins, 1 hr, 3 hrs、6 hrs、1 day', async () => {
    await granularitySelectorWrapper.trigger('click')

    // NOTE: dropdown 的 popover 要用 document.querySelector 才找的到
    const qItemLabels = [...document.querySelectorAll('.q-item-label')]
    expect(qItemLabels[0].textContent).toBe('5 mins')
    expect(qItemLabels[1].textContent).toBe('30 mins')
    expect(qItemLabels[2].textContent).toBe('1 hr')
    expect(qItemLabels[3].textContent).toBe('3 hrs')
    expect(qItemLabels[4].textContent).toBe('6 hrs')
    expect(qItemLabels[5].textContent).toBe('1 day')

    await granularitySelectorWrapper.trigger('click')
  })
})

// NOTE: 測試 table 可能改成直接修改 firstTier 跟 secondTier 來測試，而不是點擊 flip
// NOTE: 測試 flip-btn 可能改成直接檢查 firstTier 跟 secondTier 來驗證，而不是檢查 table 的內容
// NOTE: 或是兩種都用？
describe('table', () => {
  const tableWrapper = wrapper.find('#table')

  test('table 存在', () => {
    expect(tableWrapper.exists()).toBe(true)
  })

  describe('未 flip 情況', () => {
    test('table thead 預設為 times / users', () => {
      expect(tableWrapper.find('table thead tr th').text()).toBe('times / users')
    })

    test('type 為 nations 時，table thead 為 times / nations', async () => {
      await wrapper.setData({ type: 'nations' })

      expect(tableWrapper.find('table thead tr th').text()).toBe('times / nations')

      await wrapper.setData({ type: 'users' })
    })

    test('type 為 otts 時，table thead 為 times / otts', async () => {
      await wrapper.setData({ type: 'otts' })

      expect(tableWrapper.find('table thead tr th').text()).toBe('times / otts')

      await wrapper.setData({ type: 'users' })
    })
  })

  describe('flip 情況', () => {
    const flipBtnWrapper = wrapper.find('#flip-btn')
    const tableWrapper = wrapper.find('#table')

    test('flip-btn 存在', () => {
      expect(flipBtnWrapper.exists()).toBe(true)
    })

    describe('點擊 flip-btn', () => {
      beforeEach(async () => {
        await flipBtnWrapper.trigger('click')
      })

      afterEach(async () => {
        await flipBtnWrapper.trigger('click')
      })

      test('點擊 flip-btn，table thead 預設為 users / times', async () => {
        expect(tableWrapper.find('table thead tr th').text()).toBe('users / times')
      })

      test('flip 後，type 改為 nations，table thead 為 nations / times', async () => {
        await wrapper.setData({ type: 'nations' })

        expect(tableWrapper.find('table thead tr th').text()).toBe('nations / times')

        await wrapper.setData({ type: 'users' })
      })

      test('flip 後，type 改為 otts，table thead 為 otts / times', async () => {
        await wrapper.setData({ type: 'otts' })

        expect(tableWrapper.find('table thead tr th').text()).toBe('otts / times')

        await wrapper.setData({ type: 'users' })
      })
    })
  })
})
