<script setup lang="ts">
import { provide, ref, toRef } from 'vue'
import SplitPane from './SplitPane.vue'
import EditorContainer from './editor/EditorContainer.vue'
import type { EditorComponentType } from './editor/types'
import Output from './output/Output.vue'
import { ReplStore, SFCOptions, Store } from './store'

export interface Props {
  theme?: 'dark' | 'light'
  editor: EditorComponentType
  store?: Store
  autoResize?: boolean
  showCompileOutput?: boolean
  showImportMap?: boolean
  showTsConfig?: boolean
  clearConsole?: boolean
  sfcOptions?: SFCOptions
  layout?: 'horizontal' | 'vertical'
  ssr?: boolean
  previewOptions?: {
    headHTML?: string
    bodyHTML?: string
    placeholderHTML?: string
    customCode?: {
      importCode?: string
      useCode?: string
    }
  }
}

const props = withDefaults(defineProps<Props>(), {
  theme: 'light',
  store: () => new ReplStore(),
  autoResize: true,
  showCompileOutput: false,
  showImportMap: false,
  showTsConfig: false,
  clearConsole: true,
  ssr: false,
  previewOptions: () => ({
    headHTML: '',
    bodyHTML: '',
    placeholderHTML: '',
    customCode: {
      importCode: '',
      useCode: '',
    },
  }),
})

if (!props.editor) {
  throw new Error('The "editor" prop is now required.')
}

const outputRef = ref<InstanceType<typeof Output>>()
const { store } = props
const sfcOptions = (store.options = props.sfcOptions || {})
if (!sfcOptions.script) {
  sfcOptions.script = {}
}
// @ts-ignore only needed in 3.3
sfcOptions.script.fs = {
  fileExists(file: string) {
    if (file.startsWith('/')) file = file.slice(1)
    return !!store.state.files[file]
  },
  readFile(file: string) {
    if (file.startsWith('/')) file = file.slice(1)
    return store.state.files[file].code
  },
}

store.init()

provide('store', store)
provide('autoresize', props.autoResize)
provide('import-map', toRef(props, 'showImportMap'))
provide('tsconfig', toRef(props, 'showTsConfig'))
provide('clear-console', toRef(props, 'clearConsole'))
provide('preview-options', props.previewOptions)
provide('theme', toRef(props, 'theme'))
/**
 * Reload the preview iframe
 */
function reload() {
  outputRef.value?.reload()
}

defineExpose({ reload })
</script>

<template>
  <div class="vue-repl">
    <header>
      <img src="/vuedc-logo-100.png" />
      <h1>VueDc Playground</h1>
    </header>
    <SplitPane :layout="layout">
      <template #left>
        <EditorContainer
          :editorComponent="editor"
          file="activeFile"
          :showErr="true"
        />
      </template>
      <template #right>
        <EditorContainer
          :editorComponent="editor"
          file="previewFile"
          :readonly="true"
        />
      </template>
    </SplitPane>
  </div>
</template>

<style scoped>
.vue-repl {
  --bg: #fff;
  --bg-soft: #f8f8f8;
  --border: #ddd;
  --text-light: #888;
  --font-code: Menlo, Monaco, Consolas, 'Courier New', monospace;
  --color-branding: #42b883;
  --color-branding-dark: #416f9c;
  --header-height: 55px;

  height: 100%;
  margin: 0;
  overflow: hidden;
  font-size: 13px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
    Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  background-color: var(--bg-soft);

  header {
    display: flex;
    align-items: center;
    height: var(--header-height);
    color: white;
    padding: 5px;
    border-bottom: 1px solid var(--border);

    img {
      height: 50px;
    }
    h1 {
      margin-left: 1rem;
      font-size: 2.25rem;
    }
  }
}

.dark .vue-repl {
  --bg: #1a1a1a;
  --bg-soft: #242424;
  --border: #383838;
  --text-light: #aaa;
  --color-branding: #42d392;
  --color-branding-dark: #89ddff;
}

:deep(button) {
  border: none;
  outline: none;
  cursor: pointer;
  margin: 0;
  background-color: transparent;
}
</style>
