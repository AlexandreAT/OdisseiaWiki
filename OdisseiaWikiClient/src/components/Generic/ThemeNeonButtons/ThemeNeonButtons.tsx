import { useDispatch, useSelector } from 'react-redux';
import { ContainerOptions, OptionButton } from './ThemeNeonButtons.style';
import { BsLightningCharge, BsLightningChargeFill, BsLightbulbOffFill, BsLightbulbFill } from 'react-icons/bs';

interface RootState {
    themesReducer: {
        theme: 'dark' | 'light';
        neon: 'on' | 'off';
    }
}

export const ThemeNeonButtons = () => {
  const { theme, neon } = useSelector((state: RootState) => state.themesReducer);
  const dispatch = useDispatch();
  
  const handleTheme = () => {
      dispatch({
          type: 'TOGGLE/THEME',
          theme: theme === "dark" ? "light" : "dark"
      });
  }

  const handleNeon = () => {
      dispatch({
          type: 'TOGGLE/NEON',
          neon: neon === "off" ? "on" : "off"
      })
  }
  
  return (
    <ContainerOptions>
      <OptionButton theme={theme} neon={neon} onClick={handleNeon}>
        {neon === "off" && (<BsLightningCharge className="icon iconOff" />)}
        {neon === "on" && (<BsLightningChargeFill className="icon iconOn" />)}
      </OptionButton>
      <OptionButton theme={theme} neon={neon} onClick={handleTheme}>
        {theme === "dark" && (<BsLightbulbOffFill className="icon iconDark" />)}
        {theme === "light" && (<BsLightbulbFill className="icon iconLight" />)}
      </OptionButton>
    </ContainerOptions>
  )
};