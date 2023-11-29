<template>
  <div>
    <h2>日志列表：</h2>
    <div style="height: 50vh; overflow: auto;">
      <DynamicScroller class="scroller" :item-size="26" :min-item-size="20" :items="list" key-field="id">
        <template #default="{ item, index, active }">
          <DynamicScrollerItem :item="item" :active="active" :size-dependencies="[item.msg]" :data-index="index">
            <div class="card" :class="item.level">
              <div>
                <div><strong>{{ item.msg }}</strong> </div>
                <div style="margin-top: 10px;">{{ item.time }}</div>
              </div>
              <div><strong>{{ item.type.toUpperCase() }}</strong></div>
            </div>
          </DynamicScrollerItem>
        </template>
      </DynamicScroller>
    </div>
    <div>
      <button class="button-default button" @click="testReq">测试请求</button>
    </div>
  </div>
</template>

<script>
import { DynamicScroller, DynamicScrollerItem } from 'vue-virtual-scroller'
export default {
  components: {
    DynamicScroller,
    DynamicScrollerItem
  },
  data() {
    return {
      list: []
    }
  },
  created() {
  },
  methods: {
    testReq() {
      this.$axios.get('/api/Logs/getLogList/app/2023-11-29').then(res => {
        this.$axios.get(`/api/Logs/getLog/${res.data[0]}`).then(log => {
          this.list = log.data.map((k, i) => {
            return { ...k, id: i }
          })
        })
      })
    }
  },
}
</script>
<style scoped>
.bar-item {
  display: flex;
  justify-content: space-between;
}

.card {
  border: 1px solid #ccc;
  border-radius: 8px;
  padding: 15px;
  margin: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  background-color: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card strong {
  margin-right: 5px;
}

.card.ERROR {
  background: #f13f3680;
}

.card.WARN {
  background: #ee8f3b80;
}

.card.DEBUG {
  background: #2d9ef580;
}

.card.INFO {
  background: #97979780;
}

/* 基本按钮样式 */
.button {
  display: inline-block;
  padding: 10px 20px;
  font-size: 16px;
  font-weight: bold;
  text-align: center;
  text-decoration: none;
  cursor: pointer;
  border-radius: 4px;
  transition: background-color 0.3s ease;
}

/* 默认按钮样式 */
.button-default {
  color: #fff;
  background-color: #0074cc;
  border: 2px solid #0074cc;
}

/* 鼠标悬停时的样式 */
.button-default:hover {
  background-color: #005a9e;
  border-color: #005a9e;
}

/* 可以根据需要添加其他按钮样式，例如主要按钮、次要按钮等 */
.button-primary {
  color: #fff;
  background-color: #4caf50;
  border: 2px solid #4caf50;
}

.button-primary:hover {
  background-color: #45a049;
  border-color: #45a049;
}

/* 禁用状态样式 */
.button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
