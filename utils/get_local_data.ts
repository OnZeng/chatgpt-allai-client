//读取本地主题
export const get_local_theme = () => {
    const localData = localStorage.getItem('theme');
    if (localData) {
        return localData;
    } else {
        return 'light';
    }
};