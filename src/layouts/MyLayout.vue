<template>
  <q-layout view="lHh Lpr lFf">
    <q-page-container>
      <div class="q-pt-xl row justify-center">
        <router-link to="/bar">
          <q-btn>BarChart</q-btn>
        </router-link>
        <router-link to="/table">
          <q-btn>TableChart</q-btn>
        </router-link>
      </div>
      <q-page padding class="docs-input row justify-center">
        <router-view />
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script>
import { openURL } from 'quasar'

export default {
  name: 'MyLayout',
  data () {
    return {
      leftDrawerOpen: this.$q.platform.is.desktop
    }
  },
  methods: {
    openURL
  }
}
</script>

<style>
</style>
