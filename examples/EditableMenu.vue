<template>
  <div class="editable-menu-container">
    <!-- 菜单编辑模式切换按钮 -->
    <div class="menu-edit-controls">
      <el-button 
        v-if="!isEditing" 
        type="primary" 
        size="small" 
        @click="startEdit"
      >
        <el-icon><Edit /></el-icon> 编辑菜单
      </el-button>
      <template v-else>
        <el-button type="success" size="small" @click="saveChanges">
          <el-icon><Check /></el-icon> 保存
        </el-button>
        <el-button type="info" size="small" @click="cancelEdit">
          <el-icon><Close /></el-icon> 取消
        </el-button>
      </template>
    </div>

    <!-- 菜单内容 -->
    <el-menu
      :default-active="activeComponent"
      class="doc-menu"
      @select="handleSelect"
    >
      <template v-for="category in menuData" :key="category.id">
        <el-sub-menu :index="'category-' + category.id">
          <template #title>
            <span>{{ category.name }}</span>
            <!-- 编辑模式下的分类操作按钮 -->
            <div v-if="isEditing" class="category-actions">
              <el-button 
                type="primary" 
                size="small" 
                circle 
                @click.stop="editCategory(category)"
              >
                <el-icon><Edit /></el-icon>
              </el-button>
              <el-button 
                type="danger" 
                size="small" 
                circle 
                @click.stop="confirmDeleteCategory(category)"
              >
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
          </template>
          
          <!-- 组件列表 -->
          <el-menu-item 
            v-for="component in category.components" 
            :key="component.id"
            :index="component.componentId"
          >
            <span>{{ component.name }}</span>
            <!-- 编辑模式下的组件操作按钮 -->
            <div v-if="isEditing" class="component-actions">
              <el-button 
                type="primary" 
                size="small" 
                circle 
                @click.stop="editComponent(component, category.id)"
              >
                <el-icon><Edit /></el-icon>
              </el-button>
              <el-button 
                type="danger" 
                size="small" 
                circle 
                @click.stop="confirmDeleteComponent(component)"
              >
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
          </el-menu-item>
          
          <!-- 编辑模式下的添加组件按钮 -->
          <div v-if="isEditing" class="add-component-btn">
            <el-button 
              type="success" 
              size="small" 
              @click.stop="addComponent(category.id)"
            >
              <el-icon><Plus /></el-icon> 添加组件
            </el-button>
          </div>
        </el-sub-menu>
      </template>
      
      <!-- 编辑模式下的添加分类按钮 -->
      <div v-if="isEditing" class="add-category-btn">
        <el-button 
          type="success" 
          @click="addCategory"
        >
          <el-icon><Plus /></el-icon> 添加分类
        </el-button>
      </div>
    </el-menu>

    <!-- 分类对话框 -->
    <el-dialog
      v-model="categoryDialogVisible"
      :title="categoryForm.id ? '编辑分类' : '添加分类'"
      width="30%"
    >
      <el-form :model="categoryForm" label-width="80px">
        <el-form-item label="分类名称" required>
          <el-input v-model="categoryForm.name" placeholder="请输入分类名称"></el-input>
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="categoryForm.order" :min="1"></el-input-number>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="categoryDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitCategoryForm">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 组件对话框 -->
    <el-dialog
      v-model="componentDialogVisible"
      :title="componentForm.id ? '编辑组件' : '添加组件'"
      width="30%"
    >
      <el-form :model="componentForm" label-width="100px">
        <el-form-item label="组件ID" required>
          <el-input 
            v-model="componentForm.componentId" 
            placeholder="请输入组件ID，如button"
            :disabled="componentForm.id"
          ></el-input>
        </el-form-item>
        <el-form-item label="组件名称" required>
          <el-input v-model="componentForm.name" placeholder="请输入组件名称"></el-input>
        </el-form-item>
        <el-form-item label="所属分类" required>
          <el-select v-model="componentForm.categoryId" placeholder="请选择分类">
            <el-option
              v-for="category in menuData"
              :key="category.id"
              :label="category.name"
              :value="category.id"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="componentForm.order" :min="1"></el-input-number>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="componentDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitComponentForm">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 确认删除对话框 -->
    <el-dialog
      v-model="deleteDialogVisible"
      title="确认删除"
      width="30%"
    >
      <p>{{ deleteConfirmMessage }}</p>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="deleteDialogVisible = false">取消</el-button>
          <el-button type="danger" @click="confirmDelete">确定删除</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { Edit, Delete, Plus, Check, Close } from '@element-plus/icons-vue';
import { categoryApi } from '../api/categoryApi';
import { componentApi } from '../api/componentApi';
import { componentDocApi } from '../api/componentDocApi';
import { ElMessage, ElMessageBox } from 'element-plus';

export default {
  name: 'EditableMenu',
  components: {
    Edit,
    Delete,
    Plus,
    Check,
    Close
  },
  props: {
    activeComponent: {
      type: String,
      default: ''
    }
  },
  emits: ['select'],
  setup(props, { emit }) {
    // 菜单数据
    const menuData = ref([]);
    const isEditing = ref(false);
    const loading = ref(false);
    
    // 分类表单
    const categoryDialogVisible = ref(false);
    const categoryForm = ref({
      id: null,
      name: '',
      order: 1
    });
    
    // 组件表单
    const componentDialogVisible = ref(false);
    const componentForm = ref({
      id: null,
      componentId: '',
      name: '',
      categoryId: null,
      order: 1
    });
    
    // 删除确认
    const deleteDialogVisible = ref(false);
    const deleteConfirmMessage = ref('');
    const deleteItemType = ref(''); // 'category' 或 'component'
    const deleteItemId = ref(null);
    
    // 获取菜单数据
    const fetchMenu = async () => {
      loading.value = true;
      try {
        const response = await categoryApi.getMenu();
        menuData.value = response.data;
      } catch (error) {
        console.error('获取菜单失败:', error);
        ElMessage.error('获取菜单失败，请稍后重试');
      } finally {
        loading.value = false;
      }
    };
    
    // 开始编辑
    const startEdit = () => {
      isEditing.value = true;
    };
    
    // 取消编辑
    const cancelEdit = () => {
      isEditing.value = false;
      // 重新获取菜单数据，放弃所有未保存的更改
      fetchMenu();
    };
    
    // 保存更改
    const saveChanges = () => {
      isEditing.value = false;
      ElMessage.success('菜单更新成功');
    };
    
    // 处理菜单项选择
    const handleSelect = (index) => {
      if (!isEditing.value) {
        emit('select', index);
      }
    };
    
    // 添加分类
    const addCategory = () => {
      categoryForm.value = {
        id: null,
        name: '',
        order: menuData.value.length + 1
      };
      categoryDialogVisible.value = true;
    };
    
    // 编辑分类
    const editCategory = (category) => {
      categoryForm.value = {
        id: category.id,
        name: category.name,
        order: category.order
      };
      categoryDialogVisible.value = true;
    };
    
    // 提交分类表单
    const submitCategoryForm = async () => {
      if (!categoryForm.value.name) {
        ElMessage.warning('请输入分类名称');
        return;
      }
      
      try {
        if (categoryForm.value.id) {
          // 更新分类
          await categoryApi.updateCategory(categoryForm.value.id, categoryForm.value);
          ElMessage.success('分类更新成功');
        } else {
          // 创建分类
          await categoryApi.createCategory(categoryForm.value);
          ElMessage.success('分类创建成功');
        }
        
        categoryDialogVisible.value = false;
        fetchMenu(); // 刷新菜单
      } catch (error) {
        console.error('保存分类失败:', error);
        ElMessage.error('保存分类失败，请稍后重试');
      }
    };
    
    // 确认删除分类
    const confirmDeleteCategory = (category) => {
      deleteItemType.value = 'category';
      deleteItemId.value = category.id;
      deleteConfirmMessage.value = `确定要删除分类「${category.name}」吗？此操作将同时删除该分类下的所有组件及其文档！`;
      deleteDialogVisible.value = true;
    };
    
    // 添加组件
    const addComponent = (categoryId) => {
      componentForm.value = {
        id: null,
        componentId: '',
        name: '',
        categoryId: categoryId,
        order: 1
      };
      
      // 计算当前分类下的组件数量，设置默认排序
      const category = menuData.value.find(c => c.id === categoryId);
      if (category && category.components) {
        componentForm.value.order = category.components.length + 1;
      }
      
      componentDialogVisible.value = true;
    };
    
    // 编辑组件
    const editComponent = (component, categoryId) => {
      componentForm.value = {
        id: component.id,
        componentId: component.componentId,
        name: component.name,
        categoryId: categoryId,
        order: component.order
      };
      componentDialogVisible.value = true;
    };
    
    // 提交组件表单
    const submitComponentForm = async () => {
      if (!componentForm.value.componentId) {
        ElMessage.warning('请输入组件ID');
        return;
      }
      
      if (!componentForm.value.name) {
        ElMessage.warning('请输入组件名称');
        return;
      }
      
      if (!componentForm.value.categoryId) {
        ElMessage.warning('请选择所属分类');
        return;
      }
      
      try {
        let response;
        
        if (componentForm.value.id) {
          // 更新组件
          response = await componentApi.updateComponent(componentForm.value.id, componentForm.value);
          ElMessage.success('组件更新成功');
        } else {
          // 创建组件
          response = await componentApi.createComponent(componentForm.value);
          ElMessage.success('组件创建成功');
          
          // 创建组件文档模板
          try {
            await componentDocApi.createComponentDoc({
              componentId: response.data.id,
              title: response.data.name,
              description: `${response.data.name}组件描述`,
              usage: '请在此处添加组件的使用场景描述',
              props: [],
              events: [],
              examples: [{
                title: '基础用法',
                description: '基础的组件用法',
                code: '<div>\n  <!-- 示例代码 -->\n</div>'
              }]
            });
          } catch (docError) {
            console.error('创建组件文档模板失败:', docError);
            // 不阻止组件创建流程，只提示警告
            ElMessage.warning('组件创建成功，但文档模板创建失败');
          }
        }
        
        componentDialogVisible.value = false;
        fetchMenu(); // 刷新菜单
      } catch (error) {
        console.error('保存组件失败:', error);
        ElMessage.error('保存组件失败，请稍后重试');
      }
    };
    
    // 确认删除组件
    const confirmDeleteComponent = (component) => {
      deleteItemType.value = 'component';
      deleteItemId.value = component.id;
      deleteConfirmMessage.value = `确定要删除组件「${component.name}」吗？此操作将同时删除该组件的文档！`;
      deleteDialogVisible.value = true;
    };
    
    // 确认删除
    const confirmDelete = async () => {
      try {
        if (deleteItemType.value === 'category') {
          await categoryApi.deleteCategory(deleteItemId.value);
          ElMessage.success('分类删除成功');
        } else if (deleteItemType.value === 'component') {
          await componentApi.deleteComponent(deleteItemId.value);
          ElMessage.success('组件删除成功');
        }
        
        deleteDialogVisible.value = false;
        fetchMenu(); // 刷新菜单
      } catch (error) {
        console.error('删除失败:', error);
        ElMessage.error('删除失败，请稍后重试');
      }
    };
    
    // 初始化
    onMounted(fetchMenu);
    
    return {
      menuData,
      isEditing,
      loading,
      categoryDialogVisible,
      categoryForm,
      componentDialogVisible,
      componentForm,
      deleteDialogVisible,
      deleteConfirmMessage,
      startEdit,
      cancelEdit,
      saveChanges,
      handleSelect,
      addCategory,
      editCategory,
      submitCategoryForm,
      confirmDeleteCategory,
      addComponent,
      editComponent,
      submitComponentForm,
      confirmDeleteComponent,
      confirmDelete
    };
  }
};
</script>

<style scoped>
.editable-menu-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.menu-edit-controls {
  padding: 10px;
  display: flex;
  justify-content: center;
  gap: 10px;
}

.doc-menu {
  flex: 1;
  border-right: none;
}

.category-actions,
.component-actions {
  display: none;
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
}

.el-sub-menu__title:hover .category-actions,
.el-menu-item:hover .component-actions {
  display: flex;
  gap: 5px;
}

.add-component-btn {
  padding: 10px;
  display: flex;
  justify-content: center;
}

.add-category-btn {
  padding: 15px;
  display: flex;
  justify-content: center;
}

/* 确保图标按钮在菜单项中正确显示 */
.el-menu-item .el-button,
.el-sub-menu__title .el-button {
  margin-left: 5px;
}

/* 调整菜单项内容布局 */
.el-menu-item,
.el-sub-menu__title {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
</style>