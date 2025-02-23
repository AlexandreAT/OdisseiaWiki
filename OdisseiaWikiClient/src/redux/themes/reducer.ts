const initialState = {
    theme: localStorage.getItem('theme') || 'dark',
    neon: localStorage.getItem('neon') || 'off',
}

const themesReducer = (state = initialState, action: any) => {
    switch (action.type) {
        case 'TOGGLE/THEME':
            localStorage.setItem('theme', action.theme)
            return {
                ...state,
                theme: action.theme
            }
        case 'TOGGLE/NEON':
            localStorage.setItem('neon', action.neon)
            return {
                ...state,
                neon: action.neon
            }
        default:
            return state
    }
}

export default themesReducer;