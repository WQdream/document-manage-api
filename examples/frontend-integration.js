/**
 * 前端集成示例
 * 这个文件展示了如何在Vue前端项目中调用后端API
 */

// 1. 在前端项目中创建API服务
// src/api/index.js

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 2. 创建各个模块的API服务
// src/api/categoryApi.js

export const categoryApi = {
  // 获取所有分类
  getAllCategories() {
    return apiClient.get('/categories');
  },
  
  // 获取单个分类及其组件
  getCategoryById(id) {
    return apiClient.get(`/categories/${id}`);
  },
  
  // 创建新分类
  createCategory(category) {
    return apiClient.post('/categories', category);
  },
  
  // 更新分类
  updateCategory(id, category) {
    return apiClient.put(`/categories/${id}`, category);
  },
  
  // 删除分类
  deleteCategory(id) {
    return apiClient.delete(`/categories/${id}`);
  },
  
  // 获取完整菜单结构
  getMenu() {
    return apiClient.get('/menu');
  }
};

// src/api/componentApi.js

export const componentApi = {
  // 获取所有组件
  getAllComponents() {
    return apiClient.get('/components');
  },
  
  // 获取单个组件
  getComponentById(id) {
    return apiClient.get(`/components/${id}`);
  },
  
  // 根据组件ID获取组件
  getComponentByComponentId(componentId) {
    return apiClient.get(`/components/by-component-id/${componentId}`);
  },
  
  // 创建新组件
  createComponent(component) {
    return apiClient.post('/components', component);
  },
  
  // 更新组件
  updateComponent(id, component) {
    return apiClient.put(`/components/${id}`, component);
  },
  
  // 删除组件
  deleteComponent(id) {
    return apiClient.delete(`/components/${id}`);
  }
};

// src/api/componentDocApi.js

export const componentDocApi = {
  // 获取所有组件文档
  getAllComponentDocs() {
    return apiClient.get('/component-docs');
  },
  
  // 获取单个组件文档
  getComponentDocById(id) {
    return apiClient.get(`/component-docs/${id}`);
  },
  
  // 根据组件ID获取文档
  getDocByComponentId(componentId) {
    return apiClient.get(`/component-docs/by-component-id/${componentId}`);
  },
  
  // 创建新组件文档
  createComponentDoc(doc) {
    return apiClient.post('/component-docs', doc);
  },
  
  // 更新组件文档
  updateComponentDoc(id, doc) {
    return apiClient.put(`/component-docs/${id}`, doc);
  },
  
  // 删除组件文档
  deleteComponentDoc(id) {
    return apiClient.delete(`/component-docs/${id}`);
  },
  
  // 导入Markdown文档
  importMarkdown(data) {
    return apiClient.post('/component-docs/import', data);
  },
  
  // 导出Markdown文档
  exportMarkdown(id) {
    return apiClient.get(`/component-docs/${id}/export`, {
      responseType: 'blob'
    });
  }
};

// 3. 在Vue组件中使用API
// 示例：在App.vue中获取菜单数据

/*
import { ref, onMounted } from 'vue';
import { categoryApi } from './api/categoryApi';

export default {
  setup() {
    const categories = ref([]);
    const loading = ref(false);
    const error = ref(null);

    // 获取菜单数据
    const fetchMenu = async () => {
      loading.value = true;
      error.value = null;
      
      try {
        const response = await categoryApi.getMenu();
        categories.value = response.data;
      } catch (err) {
        console.error('获取菜单失败:', err);
        error.value = '获取菜单失败，请稍后重试';
      } finally {
        loading.value = false;
      }
    };

    // 添加新分类
    const addCategory = async (category) => {
      try {
        const response = await categoryApi.createCategory(category);
        // 刷新菜单
        await fetchMenu();
        return response.data;
      } catch (err) {
        console.error('添加分类失败:', err);
        throw err;
      }
    };

    // 更新分类
    const updateCategory = async (id, category) => {
      try {
        const response = await categoryApi.updateCategory(id, category);
        // 刷新菜单
        await fetchMenu();
        return response.data;
      } catch (err) {
        console.error('更新分类失败:', err);
        throw err;
      }
    };

    // 删除分类
    const deleteCategory = async (id) => {
      try {
        await categoryApi.deleteCategory(id);
        // 刷新菜单
        await fetchMenu();
      } catch (err) {
        console.error('删除分类失败:', err);
        throw err;
      }
    };

    onMounted(fetchMenu);

    return {
      categories,
      loading,
      error,
      fetchMenu,
      addCategory,
      updateCategory,
      deleteCategory
    };
  }
};
*/

// 4. 在组件文档页面中使用API
// 示例：获取和更新组件文档

/*
import { ref, computed, watch, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { componentDocApi } from './api/componentDocApi';

export default {
  setup() {
    const route = useRoute();
    const componentId = computed(() => route.params.componentId);
    const doc = ref(null);
    const loading = ref(false);
    const error = ref(null);
    const isEditing = ref(false);
    const editedDoc = ref(null);

    // 获取组件文档
    const fetchComponentDoc = async () => {
      if (!componentId.value) return;
      
      loading.value = true;
      error.value = null;
      
      try {
        const response = await componentDocApi.getDocByComponentId(componentId.value);
        doc.value = response.data;
      } catch (err) {
        console.error('获取组件文档失败:', err);
        error.value = '获取组件文档失败，请稍后重试';
      } finally {
        loading.value = false;
      }
    };

    // 开始编辑
    const startEdit = () => {
      editedDoc.value = JSON.parse(JSON.stringify(doc.value)); // 深拷贝
      isEditing.value = true;
    };

    // 取消编辑
    const cancelEdit = () => {
      editedDoc.value = null;
      isEditing.value = false;
    };

    // 保存编辑
    const saveChanges = async () => {
      if (!editedDoc.value) return;
      
      loading.value = true;
      error.value = null;
      
      try {
        const response = await componentDocApi.updateComponentDoc(editedDoc.value.id, editedDoc.value);
        doc.value = response.data;
        isEditing.value = false;
        editedDoc.value = null;
      } catch (err) {
        console.error('更新组件文档失败:', err);
        error.value = '更新组件文档失败，请稍后重试';
      } finally {
        loading.value = false;
      }
    };

    // 导出Markdown
    const exportMarkdown = async () => {
      if (!doc.value) return;
      
      try {
        const response = await componentDocApi.exportMarkdown(doc.value.id);
        
        // 创建下载链接
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${componentId.value}.md`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (err) {
        console.error('导出Markdown失败:', err);
        error.value = '导出Markdown失败，请稍后重试';
      }
    };

    // 导入Markdown
    const importMarkdown = async (markdownContent) => {
      if (!componentId.value) return;
      
      loading.value = true;
      error.value = null;
      
      try {
        const response = await componentDocApi.importMarkdown({
          componentId: doc.value.componentId,
          markdownContent
        });
        
        doc.value = response.data;
      } catch (err) {
        console.error('导入Markdown失败:', err);
        error.value = '导入Markdown失败，请稍后重试';
      } finally {
        loading.value = false;
      }
    };

    // 监听组件ID变化
    watch(componentId, fetchComponentDoc, { immediate: true });

    onMounted(fetchComponentDoc);

    return {
      doc,
      loading,
      error,
      isEditing,
      editedDoc,
      startEdit,
      cancelEdit,
      saveChanges,
      exportMarkdown,
      importMarkdown
    };
  }
};
*/