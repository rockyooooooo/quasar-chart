<template>
  <div style="min-width: 500px; max-width: 90vw;">
    <q-table
      title="Table Title"
      :data="dataset"
      :columns="columns"
      row-key="name"
    />
  </div>
</template>

<script>
export default {
  name: 'TableChart',
  props: {
    'dataset': {
      type: Array
    }
  },
  data () {
    return {
      columns: [
        {
          name: 'time',
          label: 'Time',
          field: (item) => item[0]
        },
        {
          name: 'user',
          label: 'user',
          field: (item) => item[1]
        },
        {
          name: 'topIP',
          label: 'Top IP',
          field: (item) => item[2]
        },
        {
          name: 'nation',
          label: '國別',
          field: (item) => item[3]
        },
        {
          name: 'OTTService',
          label: 'OTT Service',
          field: (item) => item[4]
        },
        {
          name: 'bps',
          label: 'bps',
          field: (item) => item[5]
        }
      ]
    }
  }
}
</script>
