import { useDispatch, useSelector } from 'react-redux';
import { ContainerOptions, OptionButton } from './ThemeNeonButtons.style';
import { BsLightningCharge, BsLightningChargeFill, BsLightbulbOffFill, BsLightbulbFill, BsPlayCircle, BsPauseCircle, BsDisplay } from 'react-icons/bs';
import { useMotionPreference } from '../../../hooks/useMotionPreference';
import { setMotionPreference } from '../../../utils/motionPreference';

interface RootState {
    themesReducer: {
        theme: 'dark' | 'light';
        neon: 'on' | 'off';
    }
}

export const ThemeNeonButtons = () => {
  const { theme, neon } = useSelector((state: RootState) => state.themesReducer);
  const dispatch = useDispatch();
  const motion = useMotionPreference();
  const nextMotion = motion === 'full' ? 'reduced' : motion === 'reduced' ? 'system' : 'full';
  const motionLabels = { full: 'completas', reduced: 'reduzidas', system: 'seguir o dispositivo' };
  const motionActions = { full: 'ativar animações completas', reduced: 'reduzir movimentos', system: 'seguir o dispositivo' };
  const motionLabel = `Animações: ${motionLabels[motion]}. Clique para ${motionActions[nextMotion]}.`;
  
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
      <OptionButton type="button" theme={theme} neon={neon} onClick={() => setMotionPreference(nextMotion)}
        title={motionLabel} aria-label={motionLabel}>
        {motion === 'full' ? <BsPlayCircle className="icon iconMotion" />
          : motion === 'reduced' ? <BsPauseCircle className="icon iconMotion" />
            : <BsDisplay className="icon iconMotion" />}
      </OptionButton>
      <OptionButton theme={theme} neon={neon} onClick={handleNeon}>
        {neon === "off" && (<BsLightningCharge className="icon iconOff" />)}
        {neon === "on" && (<BsLightningChargeFill className="icon iconOn" />)}
      </OptionButton>
      <OptionButton theme={theme} neon={neon} onClick={handleTheme} disabled={true}>
        {theme === "dark" && (<BsLightbulbOffFill className="icon iconDark" />)}
        {theme === "light" && (<BsLightbulbFill className="icon iconLight" />)}
      </OptionButton>
    </ContainerOptions>
  )
};
