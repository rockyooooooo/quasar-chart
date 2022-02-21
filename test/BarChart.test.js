const fs = require('fs')
const fsPromises = fs.promises
const { beforeAll, beforeEach, afterEach, describe, test, expect, jest } = require('@jest/globals')
import { mount, createLocalVue } from '@vue/test-utils'
import Quasar, * as All from 'quasar'
import BarChart from '../src/pages/BarChart.vue'

const localVue = createLocalVue()
localVue.use(Quasar, { components: All, directives: All, plugins: All })

const wrapper = mount(BarChart, {
  localVue
})

// NOTE: 直接載入 csv 來測試，不知道好不好，測試速度會變慢
beforeAll(async () => {
  const inputData = await fsPromises.readFile('./test/parse_data.csv', 'utf-8')

  await wrapper.setData({
    inputData,
    isUserSelectDisabled: false,
    isGranularitySelectDisabled: false,
    isBaseTimeSelectDisabled: false,
    isComparisonTimesSelectDisabled: false
  })
})

describe('uploader', () => {
  const uploader = wrapper.find('#uploader')

  test('uploader 存在', () => {
    expect(uploader.exists()).toBe(true)
  })

  test('uploaded 有被呼叫', () => {
    const fileReaderSpy = jest.spyOn(FileReader.prototype, 'readAsText').mockImplementation(() => null)
    wrapper.vm.uploaded(null)
    expect(fileReaderSpy).toBeCalled()
  })
})

describe('granularity-selector', () => {
  const granularitySelectorWrapper = wrapper.find('#granularity-selector')

  test('granularity-selector 存在', () => {
    expect(granularitySelectorWrapper.exists()).toBe(true)
  })

  test('granularity-selector 初始值為 1 day', () => {
    expect(granularitySelectorWrapper.find('.q-input-target').text()).toBe('1 day')
  })

  test('點擊 granularity-selector 時，下拉選單包含 3 hrs、6 hrs、1 day', async () => {
    await granularitySelectorWrapper.trigger('click')

    // NOTE: dropdown 的 popover 要用 document.querySelector 才找的到
    const qItemLabels = [...document.querySelectorAll('.q-item-label')]
    expect(qItemLabels[0].textContent).toBe('3 hrs')
    expect(qItemLabels[1].textContent).toBe('6 hrs')
    expect(qItemLabels[2].textContent).toBe('1 day')

    await granularitySelectorWrapper.trigger('click')
  })
})

describe('user-selector', () => {
  const userSelectorWrapper = wrapper.find('#user-selector')

  test('user-selector 存在', () => {
    expect(userSelectorWrapper.exists()).toBe(true)
  })

  test('user-selector 初始值為 inputData 找到的第一個 user（這裡是%user-5）', () => {
    expect(userSelectorWrapper.find('.q-input-target').text()).toBe('%user-5')
  })

  test('點擊 user-selector 時，下拉選單包含 inputData 裡的所有 users', async () => {
    const users = [
      '%user-5',
      '%user-7',
      '%user-9',
      '%user-0',
      '%user-4',
      '%user-1',
      '%user-10',
      '%user-8',
      '%user-2',
      '%user-3',
      '%user-6'
    ]

    await userSelectorWrapper.trigger('click')

    // NOTE: dropdown 的 popover 要用 document.querySelector 才找的到
    const qItemLabels = [...document.querySelectorAll('.q-item-label')]
    const qItemLabelTextContents = []
    qItemLabels.forEach((item, index) => {
      qItemLabelTextContents.push(item.textContent)
    })
    expect(qItemLabelTextContents).toEqual(users)

    await userSelectorWrapper.trigger('click')
  })
})

describe('base-time-selector', () => {
  const baseTimeSelectorWrapper = wrapper.find('#base-time-selector')

  test('base-time-selector 存在', async () => {
    expect(baseTimeSelectorWrapper.exists()).toBe(true)
  })

  test('baseTime 設定為 2021-11-17 時，base-time-selector 顯示 2021-11-17 ~ 2021-11-23', async () => {
    const baseTime = '2021-11-17'
    await wrapper.setData({ baseTime })

    expect(baseTimeSelectorWrapper.find('.q-input-target').text()).toBe('2021-11-17 ~ 2021-11-23')

    await wrapper.setData({ baseTime: '' })
  })

  test('（跨月份測試）baseTime 設定為 2021-11-28 時，顯示 2021-11-28 ~ 2021-12-04', async () => {
    const baseTime = '2021-11-28'
    await wrapper.setData({ baseTime })

    expect(baseTimeSelectorWrapper.find('.q-input-target').text()).toBe('2021-11-28 ~ 2021-12-04')

    await wrapper.setData({ baseTime: '' })
  })
})

describe('comparison-time-selector', () => {
  const comparisonTimeSelectorWrapper = wrapper.find('#comparison-time-selector')

  test('comparison-time-selector 存在', () => {
    expect(comparisonTimeSelectorWrapper.exists()).toBe(true)
  })

  test('點擊 comparison-time-selector，在 baseTime 是 2021-11-17 時，下拉選單內容包含 2021-11-10 ~ 2021-11-16、2021-11-03 ~ 2021-11-09、2021-11-01 ~ 2021-11-02', async () => {
    await wrapper.setData({
      baseTime: '2021-11-17'
    })
    await comparisonTimeSelectorWrapper.trigger('click')

    // NOTE: dropdown 的 popover 要用 document.querySelector 才找的到
    const qItemLabels = [...document.querySelectorAll('.q-item-label')]
    expect(qItemLabels.length).toBe(3)
    expect(qItemLabels[0].textContent).toBe('2021-11-10 ~ 2021-11-16')
    expect(qItemLabels[1].textContent).toBe('2021-11-03 ~ 2021-11-09')
    expect(qItemLabels[2].textContent).toBe('2021-11-01 ~ 2021-11-02')

    await comparisonTimeSelectorWrapper.trigger('click')
    await wrapper.setData({ baseTime: '' })
  })

  test('點擊 comparison-time-selector，在 baseTime 是有效選取日期的第一天時（這裡是 2021-11-01），下拉選單內容為空', async () => {
    await wrapper.setData({
      baseTime: '2021-11-01'
    })
    await comparisonTimeSelectorWrapper.trigger('click')

    // NOTE: dropdown 的 popover 要用 document.querySelector 才找的到
    const qItemLabels = [...document.querySelectorAll('.q-item-label')]
    expect(qItemLabels.length).toBe(0)

    await comparisonTimeSelectorWrapper.trigger('click')
    await wrapper.setData({ baseTime: '' })
  })
})

describe('renderBarChart', () => {
  describe('只有 granularity, user 時，不會呼叫 renderBarChart', () => {
    let spy = null

    beforeEach(() => {
      spy = jest.spyOn(wrapper.vm, 'renderBarChart')
    })

    afterEach(() => {
      spy.mockRestore()
    })

    test('granularity, user 皆為初始值', () => {
      expect(spy).not.toHaveBeenCalled()
    })

    test('修改 granularity', async () => {
      await wrapper.setData({
        granularity: 60 * 3
      })

      expect(spy).not.toHaveBeenCalled()

      await wrapper.setData({
        granularity: 60 * 24
      })
    })

    test('修改 user', async () => {
      await wrapper.setData({
        user: '%user-0'
      })

      expect(spy).not.toHaveBeenCalled()

      await wrapper.setData({
        user: '%user-5'
      })
    })
  })

  describe('只有 granularity, user, baseTime 時，不會呼叫 renderBarChart', () => {
    let spy = null

    beforeEach(async () => {
      spy = jest.spyOn(wrapper.vm, 'renderBarChart')
      await wrapper.setData({
        baseTime: '2021-11-17'
      })
    })

    afterEach(async () => {
      spy.mockRestore()
      await wrapper.setData({
        baseTime: ''
      })
    })

    test('granularity, user 皆為初始值', async () => {
      expect(spy).not.toHaveBeenCalled()
    })

    test('改變 granularity', async () => {
      await wrapper.setData({
        granularity: 60 * 3
      })

      expect(spy).not.toHaveBeenCalled()

      await wrapper.setData({
        granularity: 60 * 24
      })
    })

    test('改變 user', async () => {
      await wrapper.setData({
        user: '%user-0'
      })

      expect(spy).not.toHaveBeenCalled()

      await wrapper.setData({
        user: '%user-5'
      })
    })
  })

  describe('當 granularity, user, baseTime, comparisonTime 皆有時，會呼叫 renderBarChart', () => {
    let spy = null

    beforeEach(async () => {
      spy = jest.spyOn(wrapper.vm, 'renderBarChart')
      await wrapper.setData({
        baseTime: '2021-11-17',
        comparisonTime: ['2021-11-10', 6]
      })
    })

    afterEach(async () => {
      spy.mockRestore()
      await wrapper.setData({
        baseTime: '',
        comparisonTime: []
      })
    })

    test('granularity, user 皆為初始值', () => {
      expect(spy).toHaveBeenCalled()
    })

    test('修改 granularity', async () => {
      await wrapper.setData({
        granularity: 60 * 6
      })

      expect(spy).toBeCalled()
      expect(spy).toHaveBeenCalledTimes(3) // BeforeEach will call it for the first time. Since granularity changed, comparisonTime will changed as well.
    })

    test('修改 user', async () => {
      await wrapper.setData({
        user: '%user-0'
      })

      expect(spy).toBeCalled()
      expect(spy).toHaveBeenCalledTimes(3) // BeforeEach will call it for the first time. Since user changed, comparisonTime will changed as well.
    })
  })
})
