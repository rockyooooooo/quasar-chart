<template>
  <div style="min-width: 500px; width: 90vw; max-width: 800px;">
    <p class="caption">Single File Upload</p>
    <q-uploader
      :multiple="false"
      :url="''"
      :upload-factory="uploadFile"
      @uploaded="uploaded"
    />
    <p class="caption">Granularity</p>
    <q-select
      v-model="granularity"
      :options="granularityOptions"
      :disable="isGranularitySelectDisabled"
      @input="granularityOnChange"
    />
    <p class="caption">User</p>
    <q-select
      v-model="user"
      :options="userOptions"
      :disable="isUserSelectDisabled"
      @input="userOnChange"
    />
    <p class="caption">Start date</p>
    <q-datetime
      v-model="startDate"
      type="date"
      :default-value="defaulteStartDate"
      :min="minStartDate"
      :max="maxStartDate"
      :disable="isStartDateSelectDisabled"
      @change="startDateOnChange"
    />
    <p class="caption">Comparison date</p>
    <q-select
      v-model="comparisonDate"
      :options="validComparisonDates"
      :disable="isComparisonDateSelectDisabled"
      @input="comparisonDateOnChange"
    />
    <div class="chart-container">
      <svg class="chart"></svg>
    </div>
  </div>
</template>

<style>
.chart {
  overflow: visible !important;
  margin: 6rem 0;
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
      allTimes: [],
      dates: [],
      times: [],
      users: [],
      transferredData: [],
      aggregatedData: [],
      granulatedData: [],
      userData: [],
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
      startDate: '',
      defaulteStartDate: '',
      minStartDate: '',
      maxStartDate: '',
      baseDates: [],
      comparisonDate: '',
      validComparisonDates: [],
      selectedBaseDates: [],
      selectedComparisonDates: [],
      isStartDateSelectDisabled: true,
      isComparisonDateSelectDisabled: true
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
        const inputData = evt.target.result

        const parsedData = this.parseData(inputData)
        const dates = this.getAllDates(this.allTimes)
        this.dates = dates
        this.defaulteStartDate = dates[0]
        this.minStartDate = dates[0]
        this.maxStartDate = dates[dates.length - 1]
        const transferredData = this.transfer(parsedData, this.firstTier)

        const secondTransferredData = {}
        for (const key in transferredData) {
          secondTransferredData[key] = this.transfer(transferredData[key], this.secondTier)
        }
        this.transferredData = secondTransferredData

        const aggregatedData = this.aggregate(secondTransferredData)
        this.aggregatedData = aggregatedData
        const granulatedData = this.granulateAggregatedData(aggregatedData, this.granularity)
        this.granulatedData = granulatedData
        console.log('granulatedData: ', granulatedData)

        this.isGranularitySelectDisabled = false
        this.isUserSelectDisabled = false
      }
      reader.readAsText(file)
    },
    parseData (data) {
      const times = {}
      const users = {}

      const parsedData = data.split(/\n/)
        .filter((item) => item !== '')
        .map((item) => {
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
          return result
        })

      for (const prop in times) {
        this.allTimes.push(prop)
      }
      this.times = this.granulateTimes(this.allTimes, this.granularity)

      for (const prop in users) {
        this.users.push(prop)
        this.userOptions.push({ label: prop, value: prop })
      }

      return parsedData
    },
    granulateTimes (times, granularity) {
      const newTimes = [times[0]]
      times.forEach((time) => {
        if (new Date(time) - new Date(newTimes[newTimes.length - 1]) === granularity * 60 * 1000) {
          newTimes.push(time)
        }
      })
      return newTimes
    },
    getAllDates (times) {
      return times.reduce((acc, cur) => {
        const date = cur.slice(0, 10)
        if (!acc.includes(date)) return [...acc, date]
        return acc
      }, [])
    },
    transfer (parsedData, type) {
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

      parsedData.forEach((record) => {
        if (transferredData[record[typeIndex]]) {
          transferredData[record[typeIndex]].push(record)
        } else {
          transferredData[record[typeIndex]] = [record]
        }
      })

      return transferredData
    },
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
    granularityOnChange (granularity) {
      d3.select('.chart').selectAll('*').remove()

      this.times = this.granulateTimes(this.allTimes, granularity)
      const granulatedData = this.granulateAggregatedData(this.aggregatedData, granularity)
      this.granulatedData = granulatedData
      console.log('granulatedData: ', granulatedData)

      if (!this.user) return
      this.userOnChange(this.user)
    },
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
    userOnChange (user) {
      d3.select('.chart').selectAll('*').remove()
      this.startDate = ''
      this.comparisonDate = ''

      const userData = this.granulatedData.find((item) => item[0] === user)[1]
      this.userData = userData
      console.log('userData: ', userData)

      this.isStartDateSelectDisabled = false
    },
    startDateOnChange (value) {
      d3.select('.chart').selectAll('*').remove()

      const userData = this.userData
      const range = ((86400000 / (this.granularity * 60 * 1000))) * weekDays

      const date = value.slice(0, 10)
      const startDateIndex = userData.findIndex((item) => item[0].slice(0, 10) === date)
      const selectedDates = userData.slice(startDateIndex, startDateIndex + range)
      this.baseDates = selectedDates

      const validComparisonDates = []
      for (let i = startDateIndex - range; i + range > 0; i -= range) {
        const endIndex = i + range - 1
        if (i < 0) i = 0
        validComparisonDates.push({
          label: `${userData[i][0]} ~ ${userData[endIndex][0]}`,
          value: [userData[i][0], endIndex - i]
        })
      }
      this.validComparisonDates = validComparisonDates

      console.log('selectedDates: ', selectedDates)
      console.log('validComparisonDates: ', validComparisonDates)

      this.isComparisonDateSelectDisabled = false
    },
    comparisonDateOnChange (value) {
      const userData = this.userData
      const range = ((86400000 / (this.granularity * 60 * 1000))) * weekDays

      const date = value[0]
      const offset = value[1] + 1
      const startDateIndex = userData.findIndex((item) => item[0] === date)
      const selectedDates = userData.slice(startDateIndex, startDateIndex + offset)
      console.log(selectedDates)
      this.selectedBaseDates = this.baseDates.slice(0, range)
      this.selectedComparisonDates = selectedDates
      this.renderBarChart(this.baseDates.slice(0, range), selectedDates)
    },
    renderBarChart (baseDates, comparisonDates) {
      d3.select('.chart').selectAll('*').remove()
      const range = ((86400000 / (this.granularity * 60 * 1000))) * weekDays

      const chartWidth = 800
      const chartHeight = 500
      const barWidth = 50 / (86400000 / (this.granularity * 60 * 1000))

      const bpsArr = baseDates.map((item) => item[1])
      const comparisonBpsArr = comparisonDates.map((item) => item[1])
      const allData = bpsArr.concat(comparisonBpsArr)

      const min = d3.min(allData) * 0.95
      const max = d3.max(allData) * 1.05

      const padData = (data, pushOrUnshift) => {
        const paddedData = data.slice()
        // 相當之醜
        for (let i = pushOrUnshift === 'push' ? paddedData.length - 1 : 0; paddedData.length < range; pushOrUnshift === 'push' ? i++ : '') {
          paddedData[pushOrUnshift]([
            pushOrUnshift === 'push'
              ? new Date(new Date(paddedData[i][0]).getTime() + (this.granularity * 60 * 1000)).toISOString()
              : new Date(new Date(paddedData[i][0]).getTime() - (this.granularity * 60 * 1000)).toISOString(),
            min
          ])
        }
        return paddedData
      }

      const paddedBaseDates = padData(baseDates, 'push')
      const paddedComparisonDates = padData(comparisonDates, 'unshift')
      console.log('paddedBaseDates: ', paddedBaseDates)
      console.log('paddedComparisonDates: ', paddedComparisonDates)
      const growthRates = paddedBaseDates.map((item, index) => [
        item[0],
        paddedComparisonDates[index][1] === min // 檢查上週數據是否為最小值
          ? 0 // 成長率是無限的話，先設為 0
          : item[1] === min // 上週數據不是最小值，檢查這週數據是否為最小值
            ? Math.round(((0 - paddedComparisonDates[index][1]) / paddedComparisonDates[index][1]) * 100) // 這週數據是最小值，用 0 計算成長率(其實成長率就是 -100%)
            : Math.round(((item[1] - paddedComparisonDates[index][1]) / paddedComparisonDates[index][1]) * 100) // 這週數據不是最小值，計算成長率
      ])
      console.log({ growthRates, paddedBaseDates, paddedComparisonDates, min })

      const xLinear = d3.scaleBand()
        .domain(paddedBaseDates.map((item) => item[0]))
        .range([0, chartWidth])

      const comparisonXLinear = d3.scaleBand()
        .domain(paddedComparisonDates.map((item) => item[0]))
        .range([0, chartWidth])

      const yLinear = d3.scaleLinear()
        .domain([min, max])
        .range([0, chartHeight])

      const reverseYLinear = d3.scaleLinear()
        .domain([max, min])
        .range([0, chartHeight])

      // const reverseLineYLinear = d3.scaleLinear()
      //   .domain([max, min])
      //   .range([0, chartHeight])

      const rateYLinear = d3.scaleLinear()
        .domain([d3.max(growthRates.map((item) => item[1])), d3.min(growthRates.map((item) => item[1]))])
        .range([0, chartHeight])
      // const rateYLinear = d3.scaleLinear()
      //   .domain([100, -100])
      //   .range([0, chartHeight])

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
        .attr('transform', 'translate(-6, 0)rotate(-45)')
        .style('text-anchor', 'end')
      chart.append('g')
        .call(comparisonXAxis)
        .selectAll('text')
        .attr('transform', `translate(6, 0)rotate(-45)`)
        .style('text-anchor', 'start')
      chart.append('g').call(yAxis)
      chart.append('g')
        .attr('transform', `translate(${chartWidth}, 0)`)
        .call(rateYAxis)

      const interval = ((chartWidth - (paddedBaseDates.length * barWidth)) / (paddedBaseDates.length))
      chart.selectAll('rect')
        .data(paddedBaseDates.map((item) => item[1]))
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

      const tooltip = d3.select('.chart-container')
        .append('div')
        .attr('id', 'tooltip')
        .style('position', 'absolute')
        .style('visibility', 'hidden')
        .style('background-color', '#d3d3d3')
        .text("I'm a circle!")

      chart.on('mouseover', () => tooltip.style('visibility', 'visible'))
        .on('mousemove', () => tooltip.style('top', (event.pageY - 80) + 'px').style('left', (event.pageX + 20) + 'px'))
        .on('mouseout', () => tooltip.style('visibility', 'hidden'))

      // ===========================================================
    }
  }
}
</script>
