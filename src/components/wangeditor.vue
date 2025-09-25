<template>
  <div style="border: 1px solid #ccc; z-index: 100">
    <Toolbar
      style="border-bottom: 1px solid #ccc"
      :editor="editorRef"
      :defaultConfig="toolbarConfig"
      :mode="mode"
    />
    <Editor
      style="height: 500px; overflow-y: hidden"
      v-model="valueHtml"
      :defaultConfig="editorConfig"
      :mode="mode"
      @onCreated="handleCreated"
    />
  </div>
</template>

<script setup>
import '@wangeditor/editor/dist/css/style.css'; // 引入 css
import { onBeforeUnmount, ref, shallowRef, watch } from 'vue';
import { Editor, Toolbar } from '@wangeditor/editor-for-vue';

// 定义组件的 props
const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  }
});

// 定义组件的 emits
const emit = defineEmits(['update:modelValue']);

// 编辑器实例，必须用 shallowRef
const editorRef = shallowRef();

// 内容 HTML
const valueHtml = ref(props.modelValue);

// 模式，默认为 'default'
const mode = 'default';

const toolbarConfig = {};
const editorConfig = {
  placeholder: '请输入内容...',
  MENU_CONF: {
    uploadImage: {
      // 服务端上传地址
      server: "http://192.168.1.1:8080/public/fileupload/4564",
      // form-data fieldName ，默认值 'wangeditor-uploaded-image'
      fieldName: 'file',
      // 自定义请求头
      headers: {
        // Authorization: 'Bearer your-token' // 携带 token
      },
    }
  }
};

// 组件销毁时，也及时销毁编辑器
onBeforeUnmount(() => {
  const editor = editorRef.value;
  if (editor == null) return;
  editor.destroy();
});

// 编辑器创建成功时的回调
const handleCreated = (editor) => {
  editorRef.value = editor; // 记录 editor 实例，重要！
};

// 监听 valueHtml 的变化，并同步给父组件
// wangEditor v5 推荐使用 v-model 来进行双向绑定，
// 这里的 watch 主要是为了将内部变化同步到父组件
watch(valueHtml, (newValue) => {
  emit('update:modelValue', newValue);
});

// 监听父组件传入的 modelValue 的变化，并更新编辑器的内容
watch(() => props.modelValue, (newValue) => {
  // 避免内容相同时重复设置 html 导致光标跳动
  if (newValue !== valueHtml.value) {
    valueHtml.value = newValue;
  }
});

</script>

<style scoped>
/* 可根据需要添加样式 */
</style>