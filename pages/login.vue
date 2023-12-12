<template>
    <div class="flex flex-col md:flex-row w-full">
        <el-card class="w-full md:w-1/2 mb-4 md:mr-2">
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
        <el-card class="w-full md:w-1/2">
            <div slot="header" class="flex justify-between">
                <span>运行配置</span>
                <el-button type="primary" size="small" @click="saveRun">保存并运行</el-button>
            </div>
            <el-form ref="serveForm" :model="formData" :rules="rules">
                <el-form-item label="运行环境" prop="env">
                    <el-radio-group v-model="formData.env">
                        <el-radio-button :label="0">测试环境</el-radio-button>
                        <el-radio-button :label="1">生产环境</el-radio-button>
                    </el-radio-group>
                </el-form-item>
                <el-form-item label="运行模式" prop="mode">
                    <el-radio-group v-model="formData.mode">
                        <el-radio-button :label="0">历史模式</el-radio-button>
                        <el-radio-button :label="1">实时模式</el-radio-button>
                    </el-radio-group>
                </el-form-item>
                <el-form-item v-if="+formData.mode === 0" label="开始时间" prop="startTime">
                    <el-date-picker v-model="formData.startTime" type="date"></el-date-picker>
                </el-form-item>
                <el-form-item v-if="+formData.mode === 0" label="结束时间" prop="endTime">
                    <el-date-picker v-model="formData.endTime" type="date"></el-date-picker>
                </el-form-item>
                <el-form-item label="心跳时间" prop="heartTime">
                    <el-input v-model="formData.heartTime" class="!w-[196px]" :default-value="1000">
                        <template slot="append">毫秒/次</template></el-input>
                </el-form-item>
                <el-form-item label="指定日期数据覆盖" label-width="220" prop="coverTime">
                    <el-date-picker v-model="formData.coverTime" type="date"></el-date-picker>
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
            formData: {
                env: -1,
                mode: -1,
                startTime: new Date(),
                endTime: new Date() + 1000 * 60 * 60 * 24 * 7,
                heartTime: 1000,
                coverTime: new Date(),
            },
            rules: {
                env: [
                    {
                        required: true, message: '请选择运行环境', trigger: 'change',
                        validator: (rule, value, callback) => {
                            if (+value === -1) {
                                callback(new Error('请选择运行环境'))
                            } else {
                                callback()
                            }
                        }
                    }
                ],
                mode: [
                    {
                        required: true, message: '请选择运行模式', trigger: 'change',
                        validator: (rule, value, callback) => {
                            if (+value === -1) {
                                callback(new Error('请选择运行模式'))
                            } else {
                                callback()
                            }
                        }
                    }
                ],
                startTime: [
                    {
                        required: true, message: '请选择开始时间', trigger: 'change',
                        validator: (rule, value, callback) => {
                            if (+this.formData.mode === 0 && !value) {
                                callback(new Error('请选择开始时间'));
                            } else {
                                callback();
                            }
                        }
                    }
                ],
                endTime: [
                    {
                        required: true, message: '请选择结束时间', trigger: 'change',
                        validator: (rule, value, callback) => {
                            if (+this.formData.mode === 0 && !value) {
                                callback(new Error('请选择结束时间'));
                            } else {
                                callback();
                            }
                        }
                    }
                ],
                heartTime: [
                    { required: true, message: '请输入心跳时间', trigger: 'blur' },
                    { pattern: /^\d+$/, message: '心跳时间必须为数字', trigger: 'blur' }
                ],
                coverTime: [
                    { required: true, message: '请选择指定日期数据覆盖', trigger: 'change' }
                ]
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
        saveRun() {
            this.$refs.serveForm.validate((valid) => {
                if (valid) {
                    console.log(this.formData)
                } else {
                    this.$message.warning("表单不完整")
                    return false;
                }
            });

        },
        tabMode(val) {
            if (val === '历史模式') {
                this.formData.mode = 0;
            } else {
                this.formData.mode = 1;
            }
        },
        tabEnv(val) {
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
.el-date-editor.el-input, .el-date-editor.el-input__inner{
    width: 196px;
}
</style>