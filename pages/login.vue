<template>
    <div class="flex w-full">
        <el-card class="w-full">
            <div slot="header" class="flex justify-between">
                <span>服务器状态</span>
                <el-button type="primary" size="small">链接ws</el-button>
            </div>
            <div v-for="(item, index) in statusList" :key="index" class="p-4 flex justify-between rounded">
                <p class="font-bold text-lg mb-2">{{ item.title }}</p>
                <div class="text-gray-600">
                    <template v-if="item.type === 'Boolean'">
                        <!-- Boolean type structure -->
                        <div :class="statusClasses(item.value)">
                            {{ item.state[item.value ? 0 : 1] }}
                        </div>
                    </template>
                    <template v-else-if="item.type === 'Date'">
                        <!-- Date type structure -->
                        <div>
                            {{ item.value }}
                        </div>
                    </template>
                    <template v-else-if="item.type === 'String'">
                        <!-- String type structure -->
                        <div>
                            {{ item.value }}
                        </div>
                    </template>
                    <template v-else-if="item.type === 'Number'">
                        <!-- Number type structure -->
                        <div :class="statusClasses(item.value)">
                            {{ item.state[item.value ? 0 : 1] }}
                        </div>
                    </template>
                </div>
            </div>
        </el-card>
        <el-card class="w-full">
            <div slot="header" class="flex justify-between">
                <span>运行配置</span>
                <el-button type="primary" size="small">保存并运行</el-button>
            </div>
            <el-form ref="form" :model="formData" label-width="100px">
                <el-form-item label="运行环境">
                    <el-radio-group v-model="formData.env" @input="tabEnv">
                        <el-radio-button label="测试环境"></el-radio-button>
                        <el-radio-button label="生产环境"></el-radio-button>
                    </el-radio-group>
                </el-form-item>
                <el-form-item label="运行模式">
                    <el-radio-group v-model="formData.mode" @input="tabMode">
                        <el-radio-button label="历史模式"></el-radio-button>
                        <el-radio-button label="实时模式"></el-radio-button>
                    </el-radio-group>
                </el-form-item>
                <el-form-item v-if="formData.mode === 0" label="开始时间">
                    <el-date-picker v-model="formData.startTime" type="date" :default-value="new Date()"></el-date-picker>
                </el-form-item>
                <el-form-item v-if="formData.mode === 0" label="结束时间">
                    <el-date-picker v-model="formData.endTime" type="date"
                        :default-value="new Date() + 1000 * 60 * 60 * 24 * 7"></el-date-picker>
                </el-form-item>
                <el-form-item label="心跳时间">
                    <el-input v-model="formData.heartTime" :default-value="1000"></el-input>
                </el-form-item>
                <el-form-item label="指定日期数据覆盖">
                    <el-date-picker v-model="formData.coverTime" type="date" :default-value="new Date()"></el-date-picker>
                </el-form-item>
            </el-form>
        </el-card>
    </div>
</template>
  
<script>
export default {
    data() {
        return {
            statusList: [
                {
                    title: '登录状态',
                    type: 'Boolean',
                    key: "isLogin",
                    state: ['未登录', '已登录'],
                    value: false,
                }, {
                    title: '授权状态',
                    type: 'Boolean',
                    key: "isAuth",
                    state: ['未授权', '已授权'],
                    value: false,
                },
                {
                    title: "加解密工具",
                    type: "Boolean",
                    key: "decryption",
                    state: ["可用", "不可用"],
                    value: false,
                }, {
                    title: "服务运行时间",
                    type: "String",
                    key: "serviceTime",
                    state: ["已运行", "未运行"],
                    value: '-',
                }, {
                    title: "心跳运行时间",
                    type: "String",
                    key: "heartTime",
                    state: ["已运行", "未运行"],
                    value: '-',
                }, {
                    title: "服务版本",
                    type: "String",
                    key: "version",
                    state: ["已运行", "未运行"],
                    value: '-',
                },
            ],
            // 可以控制的服务
            // 运行环境 测试环境 生产环境
            // 运行模式 历史 或实时
            // 如果打开历史模式。则需要选择开始时间，结束时间
            // 可以配置心跳时间
            // 指定日期数据覆盖。
            formData: {
                env: -1,
                mode: -1,
                startTime: new Date(),
                endTime: new Date() + 1000 * 60 * 60 * 24 * 7,
                heartTime: 1000,
                coverTime: new Date(),
            },
            service: {}
        };
    },
    computed: {
        statusClasses() {
            return (value) => ({
                'text-green-500': value,
                'text-red-500': !value,
            });
        },
    },
    methods: {
        tabMode: function (val) {
            if (val === '历史模式') {
                this.formData.mode = 0;
            } else {
                this.formData.mode = 1;
            }
        },
        tabEnv: function (val) {
            if (val === '测试环境') {
                this.formData.env = 0;
            } else {
                this.formData.env = 1;
            }
        }
    }

};
</script>
  
<style>
.el-form-item__content {
    float: right !important;
}
</style>