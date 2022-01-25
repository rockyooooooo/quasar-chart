<template>
  <div style="min-width: 500px; width: 90vw; max-width: 800px;">
    <p class="caption">
      Single File Upload
    </p>
    <q-uploader
      :multiple="false"
      :url="''"
      :upload-factory="uploadFile"
      @uploaded="uploaded"
    />
    <p class="caption">
      Granularity
    </p>
    <q-select
      v-model="granularity"
      :options="granularityOptions"
      :disable="isGranularitySelectDisabled"
    />
    <p class="caption">
      User
    </p>
    <q-select
      id="user"
      v-model="user"
      :options="userOptions"
      :disable="isUserSelectDisabled"
    />
    <p class="caption">
      Base date
    </p>
    <q-datetime
      v-model="baseTime"
      type="date"
      :default-value="minBaseTime"
      :min="minBaseTime"
      :max="maxBaseTime"
      :disable="isBaseTimeSelectDisabled"
    />
    <p class="caption">
      Comparison date
    </p>
    <q-select
      v-model="comparisonTime"
      :options="validComparisonTimes"
      :disable="isComparisonTimesSelectDisabled"
    />
    <div class="chart-container">
      <svg class="chart" />
    </div>
  </div>
</template>

<style>
.chart {
  overflow: visible !important;
  margin: 8rem 0;
}
</style>

<script>
import * as d3 from 'd3'

const weekDays = 7

export default {
  name: 'BarChart',
  data () {
    return {
      firstTier: 'users',
      secondTier: 'times',
      inputData: '',
      allTimes: [],
      users: [],
      user: '',
      userOptions: [],
      isUserSelectDisabled: true,
      granularity: 60 * 24,
      granularityOptions: [
        { label: '3 hrs', value: 60 * 3 },
        { label: '6 hrs', value: 60 * 6 },
        { label: '1 day', value: 60 * 24 }
      ],
      isGranularitySelectDisabled: true,
      baseTime: '',
      comparisonTime: '',
      selectedBaseTimes: [],
      selectedComparisonTimes: [],
      isBaseTimeSelectDisabled: true,
      isComparisonTimesSelectDisabled: true
    }
  },
  computed: {
    parsedData () {
      return this.parseData(this.inputData)
    },
    allDates () {
      return this.getAllDates(this.allTimes)
    },
    minBaseTime () {
      return this.allDates[0]
    },
    maxBaseTime () {
      return this.allDates[this.allDates.length - 1]
    },
    aggregatedData () {
      const transferredData = this.transfer(this.parsedData, this.firstTier)

      const secondTransferredData = {}
      for (const key in transferredData) {
        secondTransferredData[key] = this.transfer(transferredData[key], this.secondTier)
      }

      return this.aggregate(secondTransferredData)
    },
    granulatedData () {
      return this.granulateAggregatedData(this.aggregatedData, this.granularity)
    },
    userData () {
      const emptyData = ['', []]
      const userData = this.granulatedData.find((item) => item[0] === this.user) || emptyData
      return userData[1]
    },
    times () {
      return this.granulateTimes(this.allTimes, this.granularity)
    },
    range () {
      return ((86400000 / (this.granularity * 60 * 1000))) * weekDays
    },
    baseDates () {
      const baseDateIndex = this.allDates.indexOf(this.baseTime.slice(0, 10))
      return this.allDates.slice(baseDateIndex, baseDateIndex + weekDays)
    },
    baseTimeIndex () {
      const baseTime = this.baseTime.slice(0, 10)
      return this.userData.findIndex((item) => item[0].slice(0, 10) === baseTime)
    },
    baseTimes () {
      return this.userData.slice(this.baseTimeIndex, this.baseTimeIndex + this.range)
    },
    validComparisonTimes () {
      const validComparisonTimes = []
      for (let i = this.baseTimeIndex - this.range; i + this.range > 0; i -= this.range) {
        const endIndex = i + this.range - 1
        if (i < 0) i = 0
        validComparisonTimes.push({
          label: `${this.userData[i][0].slice(0, 10)} ~ ${this.userData[endIndex][0].slice(0, 10)}`,
          value: [this.userData[i][0].slice(0, 10), endIndex - i]
        })
      }
      return validComparisonTimes
    },
    comparisonDates () {
      const comparisonDates = this.comparisonTimes.reduce((datesObj, time) => {
        datesObj[time[0].slice(0, 10)] = true
        return datesObj
      }, {})
      return Object.keys(comparisonDates)
    },
    comparisonTimes () {
      // 如果 this.comparisonTime[0] 直接放 index，會造成出圖後再更改 granularity 時，拿到的會是舊的 index
      const comparisonTime = this.comparisonTime[0]
      // 如果不用 offset，直接用 comparisonTimeIndex + this.range，會變成如果 validComparisonTimes 不到七天 ex. 11/1-11/3，會抓成 11/1-11/7
      const comparisonTimeOffset = this.comparisonTime[1]
      const comparisonTimeIndex = this.userData.findIndex((item) => item[0].slice(0, 10) === comparisonTime)
      return this.userData.slice(comparisonTimeIndex, comparisonTimeIndex + comparisonTimeOffset + 1)
    }
  },
  watch: {
    parsedData (value) {
      console.log('new parsedData: ', value)
    },
    dates (value) {
      console.log('new dates: ', value)
    },
    minBaseTime (value) {
      console.log('new minBaseTime: ', value)
    },
    maxBaseTime (value) {
      console.log('new maxBaseTime: ', value)
    },
    aggregatedData (value) {
      console.log('new aggregatedData: ', value)
    },
    granulatedData (value) {
      console.log('new granulatedData: ', value)
    },
    userData (value) {
      console.log('new userData: ', value)
    },
    times (value) {
      console.log('new times: ', value)
    },
    range (value) {
      console.log('new range: ', value)
    },
    baseDates (value) {
      console.log('new baseDates: ', value)
    },
    baseTimeIndex (value) {
      console.log('new baseTimeIndex: ', value)
    },
    baseTimes (value) {
      console.log('new baseTimes: ', value)
    },
    comparisonDates (value) {
      console.log('new comparisonDates: ', value)
    },
    validComparisonTimes (value) {
      console.log('new validComparisonTimes: ', value)

      if (!this.comparisonTime.length) return
      this.comparisonTime = this.validComparisonTimes.find((item) => item.value[0] === this.comparisonTime[0]).value
    },
    comparisonTimes (value) {
      console.log('new comparisonTimes: ', value)
    },
    granularity (value) {
      console.log('new granularity: ', value)
      d3.select('.chart').selectAll('*').remove()

      if (!this.comparisonTime.length) return
      this.comparisonTime = this.validComparisonTimes.find((item) => item.value[0] === this.comparisonTime[0]).value

      if (!value || !this.user || !this.baseTime || !this.comparisonTimes.length) return
      this.renderBarChart(this.baseTimes, this.comparisonTimes)
    },
    user (value) {
      console.log('new user: ', value)
      d3.select('.chart').selectAll('*').remove()
      this.isBaseTimeSelectDisabled = false

      if (!value || !this.baseTime || !this.comparisonTimes.length) return
      this.renderBarChart(this.baseTimes, this.comparisonTimes)
    },
    baseTime (value) {
      console.log('new base time: ', value)
      d3.select('.chart').selectAll('*').remove()
      this.isComparisonTimesSelectDisabled = false
    },
    comparisonTime (value) {
      console.log('new comparison time: ', value)

      if (!value.length) return
      this.renderBarChart(this.baseTimes, this.comparisonTimes)
    }
  },
  methods: {
    uploadFile (file, updateProgress) {
      return new Promise((resolve, reject) => {
        resolve(file)
      })
    },
    uploaded (file) {
      const reader = new FileReader()

      reader.onload = (evt) => {
        // reset
        this.allTimes = []
        this.users = []
        this.userOptions = []

        const inputData = evt.target.result
        this.inputData = inputData

        this.isGranularitySelectDisabled = false
        this.isUserSelectDisabled = false
      }
      reader.readAsText(file)
    },
    /**
     * 描述
     * @param {string} data - The input csv data.
     * @returns {array}
     */
    parseData (data) {
      const times = {}
      const users = {}

      const splitData = data.split(/\n/)
      const parsedData = []
      for (const item of splitData) {
        if (item === '') continue

        let arr = item.split(',')
          .map((value) => value.trim())

        // 處理 OTT 含有 comma 的情況，因為會被 split，要把他 concat 回來
        // 不過目前用 hard code 的方法處理，之後可以想辦法寫的更漂亮一點
        let result = arr.length === 6
          ? arr
          : arr.slice(0, 3).concat([arr[3] + ', ' + arr[4]]).concat(arr.slice(5))

        const time = result[0]
        times[time] = time
        const user = result[1]
        users[user] = user
        parsedData.push(result)
      }

      for (const prop in times) {
        this.allTimes.push(prop)
      }

      for (const prop in users) {
        this.users.push(prop)
        this.userOptions.push({ label: prop, value: prop })
      }
      this.user = this.users[0]

      return parsedData
    },
    /**
     * 描述
     * @param {array} times - All value of the time field of the parsedData.
     * @returns {array}
     */
    getAllDates (times) {
      return times.reduce((acc, cur) => {
        const date = cur.slice(0, 10)
        if (!acc.includes(date)) return [...acc, date]
        return acc
      }, [])
    },
    /**
     * 描述
     * @param {array} data - The parsedData.
     * @param {string} type
     * @returns {object}
     */
    transfer (data, type) {
      const transferredData = {}
      let typeIndex = 0
      switch (type) {
        case 'times':
          typeIndex = 0
          break
        case 'users':
          typeIndex = 1
          break
        case 'nations':
          typeIndex = 3
          break
        case 'otts':
          typeIndex = 4
          break
      }

      data.forEach((record) => {
        if (transferredData[record[typeIndex]]) {
          transferredData[record[typeIndex]].push(record)
        } else {
          transferredData[record[typeIndex]] = [record]
        }
      })

      return transferredData
    },
    /**
     * 描述
     * @param {object} transferredData - Transferred twice Data.
     * @returns {array}
     */
    aggregate (transferredData) {
      return Object.entries(transferredData)
        .map((firstTierBucket) => ([
          firstTierBucket[0],
          Object.entries(firstTierBucket[1])
            .map((secondTierBucket) => ([
              secondTierBucket[0],
              secondTierBucket[1].reduce((acc, cur) => {
                return acc + Number(cur[cur.length - 1])
              }, 0)
            ]))
        ]))
    },
    /**
     * 描述
     * @param {array} aggregatedData - The aggregatedData.
     * @param {number} granularity - The user-selected granularity.
     * @returns {array}
     */
    granulateAggregatedData (aggregatedData, granularity) {
      return aggregatedData.map((firstTierBucket) => {
        // 宣告一個存放 second tier bucket 的 array
        const arr = this.times.map((time) => [time, 0])
        let index = 0

        return [
          firstTierBucket[0],
          firstTierBucket[1].reduce((acc, secondTierBucket) => {
            let timeGap = new Date(secondTierBucket[0]) - new Date(arr[index][0])
            // 當 timeGap 大等於 granularity 時就把 index + 1，並更新 timeGap，直到 timeGap 小於 granularity
            while (timeGap >= granularity * 60 * 1000) {
              timeGap = new Date(secondTierBucket[0]) - new Date(arr[++index][0])
            }
            arr[index][1] += secondTierBucket[1]
            return arr
          }, arr)
        ]
      })
    },
    /**
     * 描述
     * @param {array} times - All value of the time field of the parsedData.
     * @param {number} granularity - The user-selected granularity.
     * @returns {array}
     */
    granulateTimes (times, granularity) {
      const newTimes = [times[0]]
      times.forEach((time) => {
        if (new Date(time) - new Date(newTimes[newTimes.length - 1]) === granularity * 60 * 1000) {
          newTimes.push(time)
        }
      })
      return newTimes
    },
    /**
     * 描述
     * @param {array} baseTimes - Bps per selected granularity of the base times.
     * @param {array} comparisonTimes - Bps per selected granularity of the comparison times.
     */
    renderBarChart (baseTimes, comparisonTimes) {
      d3.select('.chart').selectAll('*').remove()

      const chartWidth = 800
      const chartHeight = 500
      const barWidth = 50 / (86400000 / (this.granularity * 60 * 1000))

      const bpsArr = baseTimes.map((item) => item[1])
      const comparisonBpsArr = comparisonTimes.map((item) => item[1])
      const allData = bpsArr.concat(comparisonBpsArr)

      const min = d3.min(allData) * 0.95
      const max = d3.max(allData) * 1.05

      // padData 跟 padDates 想辦法寫成一個 function
      const padData = (data, pushOrUnshift, granularity, length) => {
        if (data.length <= 0) return data // watcher 似乎會把整個相關的 code 都跑一遍，所以一開始 data 是空陣列就直接原封不動 return data，才不會噴錯
        const paddedData = data.slice()
        // 相當之醜
        for (let i = pushOrUnshift === 'push' ? paddedData.length - 1 : 0; paddedData.length < length; pushOrUnshift === 'push' ? i++ : '') {
          paddedData[pushOrUnshift]([
            pushOrUnshift === 'push'
              ? new Date(new Date(paddedData[i][0]).getTime() + (granularity * 60 * 1000)).toISOString()
              : new Date(new Date(paddedData[i][0]).getTime() - (granularity * 60 * 1000)).toISOString(),
            min
          ])
        }
        return paddedData
      }

      const padDates = (dates, pushOrUnshift, granularity, length) => {
        if (dates.length <= 0) return dates // watcher 似乎會把整個相關的 code 都跑一遍，所以一開始 dates 是空陣列就直接原封不動 return dates，才不會噴錯
        const paddedDates = dates.slice()
        // 相當之醜
        for (let i = pushOrUnshift === 'push' ? paddedDates.length - 1 : 0; paddedDates.length < length; pushOrUnshift === 'push' ? i++ : '') {
          paddedDates[pushOrUnshift](
            pushOrUnshift === 'push'
              ? new Date(new Date(paddedDates[i]).getTime() + (granularity * 60 * 1000)).toISOString().slice(0, 10)
              : new Date(new Date(paddedDates[i]).getTime() - (granularity * 60 * 1000)).toISOString().slice(0, 10)
          )
        }
        return paddedDates
      }

      const paddedBaseTimes = padData(baseTimes, 'push', this.granularity, this.range)
      const paddedComparisonTimes = padData(comparisonTimes, 'unshift', this.granularity, weekDays)
      const paddedBaseDates = padDates(this.baseDates, 'push', 60 * 24)
      const paddedComparisonDates = padDates(this.comparisonDates, 'unshift', 60 * 24)
      console.log('paddedBaseTimes: ', paddedBaseTimes)
      console.log('paddedComparisonTimes: ', paddedComparisonTimes)
      const growthRates = paddedBaseTimes.map((item, index) => [
        item[0],
        paddedComparisonTimes[index][1] === min // 檢查上週數據是否為最小值
          ? 0 // 成長率是無限的話，先設為 0
          : item[1] === min // 上週數據不是最小值，檢查這週數據是否為最小值
            ? -100 // 這週數據是最小值，用 0 計算成長率(其實成長率就是 -100%)
            : Math.round(((item[1] - paddedComparisonTimes[index][1]) / paddedComparisonTimes[index][1]) * 100) // 這週數據不是最小值，計算成長率
      ])
      console.log({ growthRates, paddedBaseTimes, paddedComparisonTimes, min })

      const xLinear = d3.scaleBand()
        // .domain(paddedBaseTimes.map((item) => item[0]))
        .domain(paddedBaseDates)
        .range([0, chartWidth])

      const comparisonXLinear = d3.scaleBand()
        // .domain(paddedComparisonTimes.map((item) => item[0]))
        .domain(paddedComparisonDates)
        .range([0, chartWidth])

      const yLinear = d3.scaleLinear()
        .domain([min, max])
        .range([0, chartHeight])

      const reverseYLinear = d3.scaleLinear()
        .domain([max, min])
        .range([0, chartHeight])

      const rateYLinear = d3.scaleLinear()
        .domain([d3.max([100, ...growthRates.map((item) => item[1])]), -100])
        // .domain([d3.max(growthRates.map((item) => item[1])), d3.min(growthRates.map((item) => item[1]))])
        .range([0, chartHeight])

      const chart = d3.select('.chart')
        .attr('width', chartWidth)
        .attr('height', chartHeight)

      const xAxis = d3.axisBottom(xLinear)
      const comparisonXAxis = d3.axisTop(comparisonXLinear)
      const yAxis = d3.axisLeft(reverseYLinear)
        .tickFormat((d) => {
          let remainder = d
          let counter = 0
          while (remainder > 1000) {
            remainder /= 1000
            counter++
          }
          const units = ['', 'k', 'm', 'b']
          return remainder + units[counter]
        })
      const rateYAxis = d3.axisRight(rateYLinear)
        .tickFormat((d) => d + '%')

      chart.append('g')
        .attr('transform', `translate(0, ${chartHeight})`)
        .call(xAxis)
        .selectAll('text')
        // .attr('transform', 'translate(-6, 0)rotate(-45)')
        // .style('text-anchor', 'end')
      chart.append('g')
        .call(comparisonXAxis)
        .selectAll('text')
        // .attr('transform', `translate(6, 0)rotate(-45)`)
        // .style('text-anchor', 'start')
      chart.append('g').call(yAxis)
      chart.append('g')
        .attr('transform', `translate(${chartWidth}, 0)`)
        .call(rateYAxis)

      const interval = ((chartWidth - (paddedBaseTimes.length * barWidth)) / (paddedBaseTimes.length))
      chart.selectAll('rect')
        .data(paddedBaseTimes.map((item) => item[1]))
        .enter()
        .append('rect')
        .attr('x', (d, i) => i * (barWidth + interval) + (interval / 2))
        .attr('y', (d) => chartHeight - yLinear(d))
        .attr('width', barWidth)
        .attr('height', (d) => yLinear(d))
        .attr('fill', '#5F4B8B')
        .attr('class', 'bars')

      chart.append('path')
        .datum(growthRates.map((item) => item[1]))
        .attr('fill', 'none')
        .attr('stroke', '#FEDE00')
        .attr('stroke-width', 2)
        .attr('d', d3.line()
          .x((d, i) => i * (barWidth + interval) + (interval / 2) + (barWidth / 2))
          .y((d) => rateYLinear(d))
        )
        .attr('class', 'line')

      // =======================try tooltip======================

      // const tooltip = d3.select('.chart-container')
      //   .append('div')
      //   .attr('id', 'tooltip')
      //   .style('position', 'absolute')
      //   .style('visibility', 'hidden')
      //   .style('background-color', '#d3d3d3')
      //   .text("I'm a circle!")

      // chart.on('mouseover', () => tooltip.style('visibility', 'visible'))
      //   .on('mousemove', () => tooltip.style('top', (event.pageY - 80) + 'px').style('left', (event.pageX + 20) + 'px'))
      //   .on('mouseout', () => tooltip.style('visibility', 'hidden'))

      // ===========================================================
    }
  }
}
</script>
