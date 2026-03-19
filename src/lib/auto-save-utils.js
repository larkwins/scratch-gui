/**
 * 自动保存工具函数
 * 可在浏览器控制台中使用这些函数管理自动保存
 */

const AUTOSAVE_KEY = 'scratch_autosave_project';
const AUTOSAVE_TIME_KEY = 'scratch_autosave_time';

// 在浏览器控制台中可用的工具函数
const ScratchAutoSave = {
    /**
     * 检查是否有自动保存的项目
     */
    check: function() {
        const savedProject = localStorage.getItem(AUTOSAVE_KEY);
        const savedTime = localStorage.getItem(AUTOSAVE_TIME_KEY);
        
        if (savedProject) {
            const sizeInMB = (savedProject.length / (1024 * 1024)).toFixed(2);
            const timeStr = savedTime ? new Date(savedTime).toLocaleString('zh-CN') : '未知';
            console.log(`✓ 发现自动保存的项目`);
            console.log(`  保存时间: ${timeStr}`);
            console.log(`  大小: 约 ${sizeInMB}MB`);
            return true;
        } else {
            console.log('✗ 没有自动保存的项目');
            return false;
        }
    },

    /**
     * 清除自动保存的项目
     */
    clear: function() {
        if (confirm('确定要清除自动保存的项目吗？此操作不可恢复！')) {
            localStorage.removeItem('scratch_autosave_project');
            localStorage.removeItem('scratch_autosave_time');
            console.log('✓ 已清除自动保存的项目');
        }
    },

    /**
     * 查看存储使用情况
     */
    storageInfo: function() {
        let totalSize = 0;
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                totalSize += localStorage[key].length + key.length;
            }
        }
        const usedMB = (totalSize / (1024 * 1024)).toFixed(2);
        console.log(`localStorage 使用情况:`);
        console.log(`  已使用: 约 ${usedMB}MB`);
        console.log(`  通常限制: 5-10MB（因浏览器而异）`);
        
        // 显示 Scratch 自动保存占用
        const savedProject = localStorage.getItem(AUTOSAVE_KEY);
        if (savedProject) {
            const scratchSize = (savedProject.length / (1024 * 1024)).toFixed(2);
            console.log(`  Scratch 自动保存: 约 ${scratchSize}MB`);
        }
    },

    /**
     * 导出自动保存的项目为文件
     */
    export: function(filename = 'scratch-autosave.sb3') {
        const savedProject = localStorage.getItem('scratch_autosave_project');
        if (!savedProject) {
            console.error('✗ 没有自动保存的项目可以导出');
            return;
        }

        try {
            // 从 base64 转换
            fetch(savedProject)
                .then(res => res.blob())
                .then(blob => {
                    // 创建下载链接
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = filename;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                    console.log(`✓ 已导出自动保存的项目: ${filename}`);
                })
                .catch(error => {
                    console.error('✗ 导出失败:', error);
                });
        } catch (error) {
            console.error('✗ 导出失败:', error);
        }
    },

    /**
     * 显示帮助信息
     */
    help: function() {
        console.log(`
Scratch 自动保存工具 - 可用命令:

  ScratchAutoSave.check()
    检查是否有自动保存的项目

  ScratchAutoSave.clear()
    清除自动保存的项目

  ScratchAutoSave.storageInfo()
    查看浏览器存储使用情况

  ScratchAutoSave.export(filename)
    导出自动保存的项目为 .sb3 文件
    示例: ScratchAutoSave.export('my-project.sb3')

  ScratchAutoSave.help()
    显示此帮助信息
        `);
    }
};

// 挂载到 window 对象，使其在控制台中可访问
if (typeof window !== 'undefined') {
    window.ScratchAutoSave = ScratchAutoSave;
    
    // 启动时显示欢迎信息
    console.log('%c🎨 Scratch 自动保存已启用', 'color: #4C97FF; font-weight: bold; font-size: 14px;');
    console.log('输入 ScratchAutoSave.help() 查看可用命令');
    console.log('ScratchAutoSave 已挂载到 window 对象');
}

export default ScratchAutoSave;
