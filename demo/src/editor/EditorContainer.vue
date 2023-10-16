<script setup lang="ts">
import { inject } from 'vue'
import Message from '../Message.vue'
import { Store } from '../store'
import { debounce } from '../utils'
import type { EditorComponentType } from './types'

const props = defineProps<{
  editorComponent: EditorComponentType
  file: 'activeFile' | 'previewFile'
  readonly?: boolean
  showErr?: boolean
}>()

const store = inject('store') as Store

const onChange = debounce((code: string) => {
  store.state[props.file].code = code
}, 500)
</script>

<template>
  <div class="editor-container">
    <props.editorComponent
      @change="onChange"
      :value="store.state[props.file].code"
      :filename="store.state[props.file].filename"
      :readonly="props.readonly"
    />
    <Message v-show="showErr" :err="store.state.errors[0]" />
  </div>
</template>

<style scoped>
.editor-container {
  height: calc(100% - var(--header-height));
  overflow: hidden;
  position: relative;
}
</style>
