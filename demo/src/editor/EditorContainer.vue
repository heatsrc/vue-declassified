<script setup lang="ts">
import { debounce } from '../utils'
import { inject, ref, watch } from 'vue'
import { Store } from '../store'
import type { EditorComponentType } from './types'

const SHOW_ERROR_KEY = 'repl_show_error'

const props = defineProps<{
  editorComponent: EditorComponentType
  file: 'activeFile' | 'previewFile'
  readonly?: boolean
}>()

const store = inject('store') as Store
const showMessage = ref(getItem())

const onChange = debounce((code: string) => {
  store.state[props.file].code = code
}, 250)

function setItem() {
  localStorage.setItem(SHOW_ERROR_KEY, showMessage.value ? 'true' : 'false')
}

function getItem() {
  const item = localStorage.getItem(SHOW_ERROR_KEY)
  return !(item === 'false')
}

watch(showMessage, () => {
  setItem()
})
</script>

<template>
  <div class="editor-container">
    <props.editorComponent
      @change="onChange"
      :value="store.state[props.file].code"
      :filename="store.state[props.file].filename"
      :readonly="props.readonly"
    />
  </div>
</template>

<style scoped>
.editor-container {
  height: calc(100% - var(--header-height));
  overflow: hidden;
  position: relative;
}
</style>
