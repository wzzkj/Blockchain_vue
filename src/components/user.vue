<template>
    <div>
        <h1>用户管理</h1>
        <el-table :data="tableData">
            <el-table-column prop="id" label="ID"></el-table-column>
            <el-table-column prop="name" label="姓名"></el-table-column>
            <el-table-column prop="age" label="年龄"></el-table-column>
            <el-table-column prop="gender" label="性别"></el-table-column>
        </el-table>
    </div>
</template>

<script>
export default {
    name: 'user',
    data() {
        return {
        };
    },
    methods: {
    },
};
</script>

<style></style>