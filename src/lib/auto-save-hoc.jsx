import bindAll from 'lodash.bindall';
import debounce from 'lodash.debounce';
import PropTypes from 'prop-types';
import React from 'react';
import VM from 'scratch-vm';
import {connect} from 'react-redux';

// 导入自动保存工具函数，使其在浏览器控制台中可用
import './auto-save-utils.js';

const AUTOSAVE_KEY = 'scratch_autosave_project';
const AUTOSAVE_TIME_KEY = 'scratch_autosave_time';
const AUTOSAVE_DELAY_MS = 1000; // 1秒延迟保存（防抖）

/**
 * Higher Order Component to auto-save projects to browser localStorage
 * @param {React.Component} WrappedComponent component to wrap with auto-save functionality
 * @returns {React.Component} connected component with auto-save
 */
const AutoSaveHOC = function (WrappedComponent) {
    class AutoSaveComponent extends React.Component {
        constructor (props) {
            super(props);
            bindAll(this, [
                'saveProjectToLocalStorage',
                'loadProjectFromLocalStorage',
                'clearLocalStorage',
                'handleProjectLoad',
                'handleProjectChanged'
            ]);

            this.state = {
                hasCheckedAutoSave: false
            };

            // 使用 debounce 避免频繁保存
            this.debouncedSave = debounce(this.saveProjectToLocalStorage, AUTOSAVE_DELAY_MS);
        }

        componentDidMount () {
            // 延迟检查自动保存，等待 VM 和 Runtime 完全初始化
            setTimeout(() => {
                if (!this.state.hasCheckedAutoSave && this.props.vm) {
                    this.loadProjectFromLocalStorage();
                    this.setState({hasCheckedAutoSave: true});
                    
                    // 监听 VM 的 PROJECT_CHANGED 事件
                    this.props.vm.on('PROJECT_CHANGED', this.handleProjectChanged);
                }
            }, 2000); // 增加到 2 秒，确保 VM 完全准备好
        }

        componentDidUpdate (prevProps) {
            // 调试：记录 loadingState 变化
            if (this.props.loadingState !== prevProps.loadingState) {
                console.log(`[AutoSave Debug] loadingState: ${prevProps.loadingState} -> ${this.props.loadingState}`);
            }

            // 当 VM 刚刚加载完成时，检查自动保存并开始监听
            if (this.props.vm && !prevProps.vm && !this.state.hasCheckedAutoSave) {
                setTimeout(() => {
                    this.loadProjectFromLocalStorage();
                    this.setState({hasCheckedAutoSave: true});
                    
                    // 监听 VM 的 PROJECT_CHANGED 事件
                    this.props.vm.on('PROJECT_CHANGED', this.handleProjectChanged);
                }, 2000); // 增加到 2 秒
            }

            // 检测创建新作品：只在从"展示项目"状态变为"获取新项目"状态时才清除
            // 刷新页面时的流程：NOT_LOADED -> FETCHING_NEW_DEFAULT（不清除）
            // 点击新建按钮时的流程：SHOWING_WITHOUT_ID -> FETCHING_NEW_DEFAULT（清除）
            const wasShowingProject = 
                prevProps.loadingState === 'SHOWING_WITH_ID' ||
                prevProps.loadingState === 'SHOWING_WITHOUT_ID';
            
            const isStartingNewProject = this.props.loadingState === 'FETCHING_NEW_DEFAULT';

            if (wasShowingProject && isStartingNewProject) {
                console.log('🆕 检测到创建新作品，清除自动保存缓存');
                console.log(`   loadingState: ${prevProps.loadingState} -> ${this.props.loadingState}`);
                this.clearLocalStorage();
                // 取消待执行的保存操作
                this.debouncedSave.cancel();
            }
        }

        componentWillUnmount () {
            // 组件卸载时，取消待执行的保存操作和移除事件监听
            this.debouncedSave.cancel();
            if (this.props.vm) {
                this.props.vm.removeListener('PROJECT_CHANGED', this.handleProjectChanged);
            }
        }

        /**
         * 处理项目变化事件
         */
        handleProjectChanged () {
            if (this.state.hasCheckedAutoSave && this.props.vm) {
                console.log('检测到项目变化，准备自动保存...');
                this.debouncedSave();
            }
        }

        /**
         * 保存项目到 localStorage
         */
        saveProjectToLocalStorage () {
            if (!this.props.vm) {
                console.warn('VM 未初始化，无法自动保存');
                return;
            }

            const startTime = Date.now();
            console.log('⏳ 正在保存项目...');

            try {
                // 获取项目数据
                this.props.vm.saveProjectSb3().then(content => {
                    // 检查存储大小
                    const sizeInMB = (content.byteLength / (1024 * 1024)).toFixed(2);
                    
                    // localStorage 通常限制在 5-10MB，如果项目太大就提示用户
                    if (content.byteLength > 8 * 1024 * 1024) { // 8MB
                        console.warn(`项目过大 (${sizeInMB}MB)，可能超出浏览器存储限制`);
                        return;
                    }

                    // 将项目数据转换为 base64 字符串以便存储
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        try {
                            const base64data = reader.result;
                            localStorage.setItem(AUTOSAVE_KEY, base64data);
                            localStorage.setItem(AUTOSAVE_TIME_KEY, new Date().toISOString());
                            
                            const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
                            console.log(`✓ 项目已自动保存 (${sizeInMB}MB, 耗时${elapsed}秒)`);
                        } catch (storageError) {
                            if (storageError.name === 'QuotaExceededError') {
                                console.error('浏览器存储空间不足，无法保存项目');
                                // 可选：清除旧的自动保存为新的腾出空间
                                this.clearLocalStorage();
                            } else {
                                console.error('保存到 localStorage 失败:', storageError);
                            }
                        }
                    };
                    reader.onerror = () => {
                        console.error('读取项目数据失败');
                    };
                    reader.readAsDataURL(new Blob([content]));
                }).catch(error => {
                    console.error('获取项目数据失败:', error);
                });
            } catch (error) {
                console.error('自动保存失败:', error);
            }
        }

        /**
         * 从 localStorage 加载项目
         */
        loadProjectFromLocalStorage () {
            if (!this.props.vm) {
                console.warn('VM 未初始化，无法加载自动保存');
                return;
            }

            // 检查 VM runtime 是否已启动
            if (!this.props.vm.runtime || !this.props.vm.runtime.targets) {
                console.warn('VM Runtime 未就绪，跳过自动恢复');
                return;
            }

            try {
                const savedProject = localStorage.getItem(AUTOSAVE_KEY);
                const savedTime = localStorage.getItem(AUTOSAVE_TIME_KEY);

                if (savedProject) {
                    const timeStr = savedTime ? new Date(savedTime).toLocaleString('zh-CN') : '未知';
                    const sizeInMB = (savedProject.length / (1024 * 1024)).toFixed(2);
                    
                    // 自动恢复项目，不显示确认弹窗
                    console.log(`🔄 发现自动保存的项目`);
                    console.log(`   保存时间: ${timeStr}`);
                    console.log(`   大小: ${sizeInMB}MB`);
                    console.log(`   正在恢复...`);
                    
                    this.handleProjectLoad(savedProject);
                }
            } catch (error) {
                console.error('检查自动保存失败:', error);
            }
        }

        /**
         * 处理项目加载
         */
        handleProjectLoad (savedProject) {
            if (!savedProject || savedProject.length < 100) {
                console.error('❌ 自动保存数据无效或已损坏');
                this.clearLocalStorage();
                return;
            }

            try {
                console.log('   正在解析保存的数据...');
                
                // 从 base64 转换回 ArrayBuffer
                fetch(savedProject)
                    .then(res => {
                        if (!res.ok) {
                            throw new Error('读取保存数据失败');
                        }
                        return res.blob();
                    })
                    .then(blob => {
                        console.log(`   数据大小: ${(blob.size / 1024 / 1024).toFixed(2)}MB`);
                        return blob.arrayBuffer();
                    })
                    .then(buffer => {
                        if (!buffer || buffer.byteLength === 0) {
                            throw new Error('保存数据为空');
                        }
                        console.log('   正在加载到 VM...');
                        return this.props.vm.loadProject(buffer);
                    })
                    .then(() => {
                        console.log('✅ 项目已自动恢复');
                        // 恢复后保留自动保存数据，继续追踪变化
                    })
                    .catch(error => {
                        console.error('❌ 恢复项目失败:', error);
                        console.error('   错误详情:', error.message);
                        
                        // 只在数据确实损坏时才提示用户
                        if (error.message.includes('损坏') || error.message.includes('无效')) {
                            alert('恢复项目失败，自动保存的数据可能已损坏。将加载空白项目。');
                            // 清除损坏的数据
                            this.clearLocalStorage();
                        }
                    });
            } catch (error) {
                console.error('❌ 加载自动保存项目失败:', error);
            }
        }

        /**
         * 清除 localStorage 中的项目
         */
        clearLocalStorage () {
            try {
                localStorage.removeItem(AUTOSAVE_KEY);
                localStorage.removeItem(AUTOSAVE_TIME_KEY);
                console.log('✓ 已清除自动保存的项目');
            } catch (error) {
                console.error('清除自动保存失败:', error);
            }
        }

        render () {
            return (
                <WrappedComponent
                    clearAutoSave={this.clearLocalStorage}
                    {...this.props}
                />
            );
        }
    }

    AutoSaveComponent.propTypes = {
        projectChanged: PropTypes.bool,
        vm: PropTypes.instanceOf(VM),
        loadingState: PropTypes.string,
        isAnyCreatingNewState: PropTypes.bool
    };

    const mapStateToProps = state => ({
        projectChanged: state.scratchGui.projectChanged,
        vm: state.scratchGui.vm,
        loadingState: state.scratchGui.projectState.loadingState
    });

    return connect(
        mapStateToProps
    )(AutoSaveComponent);
};

export default AutoSaveHOC;
